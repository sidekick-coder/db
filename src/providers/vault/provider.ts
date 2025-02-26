import { defineProvider } from '@/core/provider/defineProvider.js'
import { v, validate } from '@/core/validator/index.js'
import * as folder from '@/providers/folder/index.js'
import { DataProvider } from '@/core/provider/index.js'
import crypto from 'crypto'
import { drive } from '@/core/drive/index.js'
import { resolve } from 'path'
import { createFilesystem } from '@/core/filesystem/createFilesystem.js'
import { parsers } from '@/core/parsers/all.js'
import { queryArray } from '@/core/provider/queryArray.js'
import { omit, pick } from 'lodash-es'
import { createIdMaker } from '@/core/id/index.js'
import { createIncrementalStategyFromFile } from '@/core/id/incremental.js'

function encrypt(payload: any) {
    const schema = v.object({
        type: v.optional(v.picklist(['uint8', 'hex']), 'uint8'),
        value: v.union([v.string(), v.extras.uint8()]),
        salt: v.optional(v.string(), crypto.randomBytes(16).toString('hex')),
        iv: v.optional(v.string(), crypto.randomBytes(16).toString('hex')),
        password: v.string(),
    })

    const options = validate(schema, payload)

    if (options.value instanceof Uint8Array && options.type === 'hex') {
        throw new Error('Can not convert Uint8Array to hex')
    }

    const salt = Buffer.from(options.salt, 'hex')
    const iv = Buffer.from(options.iv, 'hex')
    const key = crypto.scryptSync(options.password, salt, 32)
    const cipher = crypto.createCipheriv('aes-256-ctr', key, iv)

    if (options.type === 'hex' && typeof options.value === 'string') {
        const encrypted = cipher.update(options.value, 'utf8', 'hex')

        return encrypted + cipher.final('hex')
    }

    if (options.type === 'uint8' && options.value instanceof Uint8Array) {
        const buffer = Buffer.concat([cipher.update(options.value), cipher.final()])

        return new Uint8Array(buffer)
    }

    throw new Error('Invalid type')
}

function decrypt(payload: any) {
    const schema = v.object({
        type: v.optional(v.picklist(['uint8', 'hex']), 'uint8'),
        value: v.union([v.string(), v.extras.uint8()]),
        salt: v.optional(v.string(), crypto.randomBytes(16).toString('hex')),
        iv: v.optional(v.string(), crypto.randomBytes(16).toString('hex')),
        password: v.string(),
    })

    const options = validate(schema, payload)

    const salt = Buffer.from(options.salt as string, 'hex')
    const iv = Buffer.from(options.iv as string, 'hex')
    const key = crypto.scryptSync(options.password, salt, 32)
    const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv)

    if (options.type === 'hex' && typeof options.value === 'string') {
        let decrypted = decipher.update(options.value, 'hex', 'utf8')

        decrypted += decipher.final('utf8')

        return decrypted
    }

    if (options.type === 'uint8' && options.value instanceof Uint8Array) {
        const buffer = Buffer.concat([decipher.update(options.value), decipher.final()])

        return new Uint8Array(buffer)
    }

    throw new Error('Invalid type')
}

export const provider = defineProvider((payload, { root, fs }) => {
    const filesystem = createFilesystem({ fs })

    const schema = v.object({
        format: v.optional(v.string(), 'markdown'),
        path: v.extras.path(root),
        id_strategy: v.optional(v.string(), 'increment'),
    })

    const config = validate(schema, payload)
    const parser = parsers.find((p) => p.name === config.format)

    if (!parser) {
        throw new Error(`Parser for format "${config.format}" not found`)
    }

    const makeId = createIdMaker({
        strategies: [
            createIncrementalStategyFromFile(drive, resolve(config.path, '.db', 'last_id.json')),
        ],
    })

    function checkPassword(payload: any) {
        const password = validate((v) => v.string(), payload.password)

        const filename = resolve(config.path, '.db', 'password.json')

        if (!drive.existsSync(filename)) {
            return {
                valid: false,
                message: 'No password set',
            }
        }

        const text = drive.readSync(filename)
        const json = JSON.parse(text)

        const decrypted = decrypt({
            type: 'hex',
            value: json.encrypted,
            salt: json.salt,
            iv: json.iv,
            password: password,
        }) as string

        if (decrypted.endsWith('success')) {
            return {
                valid: true,
                message: 'Password correct',
            }
        }

        return {
            valid: false,
            message: 'Password incorrect',
        }
    }

    function setPassword(payload: any) {
        const schema = v.object({
            salt: v.optional(v.string(), crypto.randomBytes(16).toString('hex')),
            iv: v.optional(v.string(), crypto.randomBytes(16).toString('hex')),
            password: v.string(),
        })

        const options = validate(schema, payload)

        const filename = resolve(config.path, '.db', 'password.json')

        if (drive.existsSync(filename)) {
            return {
                message: 'Password already set',
                filename,
            }
        }

        const encrypted = encrypt({
            value: crypto.randomBytes(16).toString('hex') + 'success',
            salt: options.salt,
            iv: options.iv,
            password: options.password,
        })

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

    async function lock(payload: any) {
        const schema = v.object({
            password: v.string(),
            id: v.string(),
        })

        const options = validate(schema, payload)
        const check = checkPassword({ password: payload.password })

        if (!check.valid) {
            return {
                message: check.message,
            }
        }

        const filepath = resolve(config.path, options.id)
        const metadata = await filesystem.read.json(resolve(filepath, '.db', '.metadata.json'), {
            default: {
                salt: crypto.randomBytes(16).toString('hex'),
                iv: crypto.randomBytes(16).toString('hex'),
                files: [],
            },
        })

        const all = await filesystem.readdir(filepath)
        const files = [] as any

        all.filter((file) => file !== '.db').forEach((file) => {
            const meta = metadata.files.find((f: any) => f.name === file)

            files.push({
                name: file,
                encrypted: false,
                ...meta,
            })
        })

        for (const file of files) {
            if (file.encrypted) {
                continue
            }

            const source_filename = file.name
            const target_filename = encrypt({
                type: 'hex',
                value: file.name,
                password: options.password,
                salt: metadata.salt,
                iv: metadata.iv,
            }) as string

            const text = filesystem.readSync(resolve(filepath, source_filename))

            const encrypted = encrypt({
                value: text,
                salt: metadata.salt,
                iv: metadata.iv,
                password: options.password,
            }) as Uint8Array

            filesystem.writeSync(resolve(filepath, target_filename), encrypted)
            filesystem.removeSync(resolve(filepath, source_filename))

            file.encrypted = true
            file.name = target_filename
        }

        metadata.files = files

        filesystem.writeSync.json(resolve(filepath, '.db', '.metadata.json'), metadata, {
            recursive: true,
        })

        return files
    }

    async function unlock(payload: any) {
        const schema = v.object({
            password: v.string(),
            id: v.string(),
        })

        const options = validate(schema, payload)
        const check = checkPassword({ password: payload.password })

        if (!check.valid) {
            throw new Error(check.message)
        }

        const filepath = resolve(config.path, options.id)
        const metadata = await filesystem.read.json(resolve(filepath, '.db', '.metadata.json'))

        if (!metadata) {
            throw new Error('Can not decrypt! metadata file not found')
        }

        const all = await filesystem.readdir(filepath)
        const files = [] as any

        all.filter((file) => file !== '.db').forEach((file) => {
            const meta = metadata.files.find((f: any) => f.name === file)

            files.push({
                name: file,
                encrypted: false,
                ...meta,
            })
        })

        for (const file of files) {
            if (!file.encrypted) {
                continue
            }

            const source_filename = file.name
            const target_filename = decrypt({
                type: 'hex',
                value: file.name,
                password: options.password,
                salt: metadata.salt,
                iv: metadata.iv,
            }) as string

            const encrypted = filesystem.readSync(resolve(filepath, source_filename)) as Uint8Array

            const contents = decrypt({
                value: encrypted,
                salt: metadata.salt,
                iv: metadata.iv,
                password: options.password,
            }) as Uint8Array

            filesystem.writeSync(resolve(filepath, target_filename), contents)
            filesystem.removeSync(resolve(filepath, source_filename))

            file.encrypted = false
            file.name = target_filename
        }

        metadata.files = files

        filesystem.writeSync.json(resolve(filepath, '.db', '.metadata.json'), metadata, {
            recursive: true,
        })

        return files
    }

    const list: DataProvider['list'] = async (options) => {
        const password = validate((v) => v.string('Password is required'), options?.password)

        const check = checkPassword({ password })

        if (!check.valid) {
            throw new Error(check.message)
        }

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
                resolve(config.path, folder, '.db', '.metadata.json')
            )

            const realIndexFilename = `index.${parser.ext}`
            const encryptedIndexFilename = encrypt({
                type: 'hex',
                value: realIndexFilename,
                password,
                salt: metadata.salt,
                iv: metadata.iv,
            }) as string

            let indexFilename = realIndexFilename

            if (!filesystem.existsSync(resolve(config.path, folder, indexFilename))) {
                indexFilename = encryptedIndexFilename
            }

            const fullFilename = resolve(config.path, folder, indexFilename)

            if (!filesystem.existsSync(fullFilename)) {
                const error = new Error('Index file not found')

                Object.assign(error, {
                    folder: resolve(config.path, folder),
                    real_filename: `index.${parser.ext}`,
                    encrypted_filename: encryptedIndexFilename,
                })

                throw error
            }

            const fileMeta = metadata?.files?.find((f: any) => f.name === indexFilename)

            let raw = await filesystem.read(fullFilename)

            if (fileMeta?.encrypted) {
                raw = decrypt({
                    type: 'uint8',
                    value: raw,
                    password,
                    salt: metadata.salt,
                    iv: metadata.iv,
                }) as Uint8Array
            }

            const rawText = new TextDecoder().decode(raw)

            const item = {
                id: folder.replace(`.${parser.ext}`, ''),
                folder: resolve(config.path, folder),
                raw: rawText,
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

        const check = checkPassword({ password })

        if (!check.valid) {
            throw new Error(check.message)
        }

        const id = data.id || (await makeId(config.id_strategy))

        if (await drive.exists(resolve(config.path, id))) {
            throw new Error(`Item with id "${id}" already exists`)
        }

        const filename = resolve(config.path, id, `index.${parser.ext}`)

        await drive.mkdir(resolve(config.path, id))

        await drive.write(filename, parser.stringify(data))

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
        create,
        list: withPassword(list),
    }
})
