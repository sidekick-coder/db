import { defineProvider } from '@/core/provider/defineProvider.js'
import { v, validate } from '@/core/validator/index.js'
import * as folder from '@/providers/folder/index.js'
import { DataProvider } from '@/core/provider/index.js'
import crypto from 'crypto'
import { drive } from '@/core/drive/index.js'
import path from 'path'
import { createFilesystem } from '@/core/filesystem/createFilesystem.js'
import { parsers } from '@/core/parsers/all.js'
import { queryArray } from '@/core/provider/queryArray.js'
import { omit, pick } from 'lodash-es'
import { createIdMaker } from '@/core/id/index.js'
import { createIncrementalStategyFromFile } from '@/core/id/incremental.js'
import { createEncryption, decrypt, encrypt } from './encryption.js'

export const provider = defineProvider((payload, { root, fs }) => {
    const schema = v.object({
        format: v.optional(v.string(), 'markdown'),
        path: v.extras.path(root),
        id_strategy: v.optional(v.string(), 'increment'),
    })

    const config = validate(schema, payload)
    const parser = parsers.find((p) => p.name === config.format)
    const filesystem = createFilesystem({ fs })
    const encryption = createEncryption()

    if (!parser) {
        throw new Error(`Parser for format "${config.format}" not found`)
    }

    const makeId = createIdMaker({
        strategies: [
            createIncrementalStategyFromFile(
                drive,
                path.resolve(config.path, '.db', 'last_id.json')
            ),
        ],
    })

    function checkPassword(payload: any) {
        const password = validate((v) => v.string(), payload.password)

        const filename = path.resolve(config.path, '.db', 'password.json')

        if (!drive.existsSync(filename)) {
            return {
                valid: false,
                message: 'No password set',
            }
        }

        const data = filesystem.readSync.json(filename)

        const decrypted = encryption
            .setSalt(data.salt)
            .setIv(data.iv)
            .setPassword(password)
            .decrypt(data.encrypted as string)

        if (!decrypted.endsWith('success')) {
            throw new Error('Password incorrect')
        }
    }

    function setPassword(payload: any) {
        const schema = v.object({
            salt: v.optional(v.string(), crypto.randomBytes(16).toString('hex')),
            iv: v.optional(v.string(), crypto.randomBytes(16).toString('hex')),
            password: v.string(),
        })

        const options = validate(schema, payload)

        const filename = path.resolve(config.path, '.db', 'password.json')

        if (drive.existsSync(filename)) {
            return {
                message: 'Password already set',
                filename,
            }
        }

        const encrypted = encryption
            .setSalt(options.salt)
            .setIv(options.iv)
            .setPassword(options.password)
            .encrypt(crypto.randomBytes(16).toString('hex') + 'success')

        const json = {
            salt: options.salt,
            iv: options.iv,
            encrypted,
        }

        filesystem.writeSync.json(filename, json, {
            recursive: true,
        })

        return {
            message: 'Password set',
            filename,
        }
    }

    function withPassword(fn: Function) {
        return async (payload: any) => {
            payload.password = await validate.async((v) => v.prompts.password(), payload.password)

            return fn(payload)
        }
    }

    function findMetadata(payload: any) {
        const options = validate(v.object({ id: v.string() }), payload)

        const filepath = path.resolve(config.path, options.id, '.db', '.metadata.json')

        const json: any = filesystem.readSync.json(filepath, {
            default: {
                salt: crypto.randomBytes(16).toString('hex'),
                iv: crypto.randomBytes(16).toString('hex'),
                files: [],
            },
        })

        const all = filesystem.readdirSync(path.resolve(config.path, options.id))

        const files = [] as any

        all.filter((file) => file !== '.db').forEach((file) => {
            const meta = json.files.find((f: any) => f.name === file)

            files.push({
                name: file,
                encrypted: false,
                ...meta,
            })
        })

        json.files = files

        const schema = v.object({
            salt: v.string(),
            iv: v.string(),
            files: v.array(v.object({ name: v.string(), encrypted: v.boolean() })),
        })

        return validate(schema, json)
    }

    async function lock(payload: any) {
        const schema = v.object({
            password: v.string(),
            id: v.string(),
        })

        const options = validate(schema, payload)

        checkPassword({ password: payload.password })

        const filepath = path.resolve(config.path, options.id)

        if (!filesystem.existsSync(filepath)) {
            throw new Error(`Item ${options.id} not found`)
        }

        const metadata = findMetadata({ id: options.id })

        encryption.setSalt(metadata.salt).setIv(metadata.iv).setPassword(options.password)

        for (const file of metadata.files) {
            if (file.encrypted) {
                continue
            }

            const source_filename = file.name
            const target_filename = encryption.encrypt(source_filename)

            const contents = filesystem.readSync(path.resolve(filepath, source_filename))
            const encrypted = encryption.encrypt(contents)

            filesystem.writeSync(path.resolve(filepath, target_filename), encrypted)
            filesystem.removeSync(path.resolve(filepath, source_filename))

            file.encrypted = true
            file.name = target_filename
        }

        filesystem.writeSync.json(path.resolve(filepath, '.db', '.metadata.json'), metadata, {
            recursive: true,
        })

        return metadata.files
    }

    function unlock(payload: any) {
        const schema = v.object({
            password: v.string(),
            id: v.string(),
        })

        const options = validate(schema, payload)

        checkPassword({ password: payload.password })

        const filepath = path.resolve(config.path, options.id)

        if (!filesystem.existsSync(path.resolve(filepath, '.db', '.metadata.json'))) {
            throw new Error('Metadata file not found')
        }

        const metadata = findMetadata({ id: options.id })

        encryption.setSalt(metadata.salt).setIv(metadata.iv).setPassword(options.password)

        for (const file of metadata.files) {
            if (!file.encrypted) {
                continue
            }

            const source_filename = file.name as string
            const target_filename = encryption.decrypt(source_filename)
            const encrypted = filesystem.readSync(path.resolve(filepath, source_filename))

            const contents = encryption.decrypt(encrypted)

            filesystem.writeSync(path.resolve(filepath, target_filename), contents)
            filesystem.removeSync(path.resolve(filepath, source_filename))

            file.encrypted = false
            file.name = target_filename
        }

        filesystem.writeSync.json(path.resolve(filepath, '.db', '.metadata.json'), metadata, {
            recursive: true,
        })

        return metadata.files
    }

    const list: DataProvider['list'] = async (options) => {
        const password = validate((v) => v.string('Password is required'), options?.password)

        checkPassword({ password })

        const where = options?.where || {}
        const exclude = options?.exclude || []
        const include = options?.include || []
        const limit = options?.limit
        const page = options?.page || 1

        const files = filesystem.readdirSync(config.path)
        const exclude_patterns = ['.db']

        const result = [] as any[]

        for (const folder of files) {
            if (exclude_patterns.includes(folder)) {
                continue
            }

            const metadata = filesystem.readSync.json(
                path.resolve(config.path, folder, '.db', '.metadata.json')
            )

            if (metadata) {
                encryption.setSalt(metadata.salt).setIv(metadata.iv).setPassword(password)
            }

            const filename = filesystem.existsSync(
                path.resolve(config.path, folder, `index.${parser.ext}`)
            )
                ? path.resolve(config.path, folder, `index.${parser.ext}`)
                : path.resolve(config.path, folder, encryption.encrypt(`index.${parser.ext}`))

            const basename = path.basename(filename)

            if (!filesystem.existsSync(filename)) {
                const error = new Error('Index file not found')

                Object.assign(error, {
                    folder: path.resolve(config.path, folder),
                    filename: `index.${parser.ext}`,
                    encrypted_filename: encryption.encrypt(`index.${parser.ext}`),
                })

                throw error
            }

            const fileMeta = metadata?.files?.find((f: any) => f.name === basename)

            let raw = await filesystem.read(filename)

            if (fileMeta?.encrypted) {
                raw = encryption.decrypt(raw)
            }

            const rawText = new TextDecoder().decode(raw)

            const item = {
                id: folder.replace(`.${parser.ext}`, ''),
                folder: path.resolve(config.path, folder),
                raw: rawText,
                encrypted: fileMeta?.encrypted || false,
            }

            Object.assign(item, parser.parse(rawText))

            result.push(item)
        }

        let items = queryArray(result, where)

        if (include.length) {
            items = items.map((item) => pick(item, include))
        }

        if (exclude.length && !include.length) {
            items = items.map((item) => omit(item, exclude))
        }

        if (limit) {
            const start = (page - 1) * limit
            const end = start + limit

            items = items.slice(start, end)
        }

        const response = {
            meta: {
                total: result.length,
                limit,
                total_pages: limit ? Math.ceil(result.length / limit) : 1,
            },
            data: items,
        }

        return response
    }

    const find: DataProvider['find'] = async (options) => {
        const { data: items } = await list({
            ...options,
            limit: 1,
        })

        return items[0] || null
    }

    const create: DataProvider['create'] = async (payload) => {
        const password = validate((v) => v.string(), payload.password)
        const data = validate((v) => v.any(), payload.data)

        checkPassword({ password })

        const id = data.id || (await makeId(config.id_strategy))

        if (await drive.exists(path.resolve(config.path, id))) {
            throw new Error(`Item with id "${id}" already exists`)
        }

        const filename = path.resolve(config.path, id, `index.${parser.ext}`)

        await filesystem.mkdir(path.resolve(config.path, id))

        await filesystem.write.text(filename, parser.stringify(data))

        await lock({ password, id })

        const item = await find({ where: { id: String(id) }, password })

        return item!
    }

    return {
        setPassword: withPassword(setPassword),
        checkPassword: withPassword(checkPassword),
        encrypt: withPassword(encrypt),
        decrypt: withPassword(decrypt),
        lock: withPassword(lock),
        unlock: withPassword(unlock),
        create: withPassword(create),
        list: withPassword(list),
    }
})
