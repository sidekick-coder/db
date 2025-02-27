import { defineProvider } from '@/core/provider/defineProvider.js'
import { v, validate } from '@/core/validator/index.js'
import { DataProvider } from '@/core/provider/index.js'
import crypto from 'crypto'
import { drive } from '@/core/drive/index.js'
import path from 'path'
import { createFilesystem } from '@/core/filesystem/createFilesystem.js'
import { parsers } from '@/core/parsers/all.js'
import { createIdMaker } from '@/core/id/index.js'
import { createIncrementalStategyFromFile } from '@/core/id/incremental.js'
import { createEncryption, decrypt, encrypt } from './encryption.js'
import { list as vaultList } from './list.js'
import { schema as configSchema } from './config.js'

export const provider = defineProvider((payload, { root, fs }) => {
    const config = validate(configSchema(root), payload)
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

    const password = validate((v) => v.string(), payload.password)

    const filename = path.resolve(config.path, '.db', 'password.json')

    if (!drive.existsSync(filename)) {
        return {
            valid: false,
            message: 'No password set',
        }
    }

    const data = filesystem.readSync.json(filename)

    encryption.setPassword(password)

    const decrypted = encryption
        .setSalt(data.salt)
        .setIv(data.iv)
        .decrypt(data.encrypted as string)

    if (!decrypted.endsWith('success')) {
        throw new Error('Password incorrect')
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
            id: v.string(),
        })

        const options = validate(schema, payload)

        const filepath = path.resolve(config.path, options.id)

        if (!filesystem.existsSync(filepath)) {
            throw new Error(`Item ${options.id} not found`)
        }

        const metadata = findMetadata({ id: options.id })

        encryption.setSalt(metadata.salt).setIv(metadata.iv)

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
            id: v.string(),
        })

        const options = validate(schema, payload)

        const filepath = path.resolve(config.path, options.id)

        if (!filesystem.existsSync(path.resolve(filepath, '.db', '.metadata.json'))) {
            throw new Error('Metadata file not found')
        }

        const metadata = findMetadata({ id: options.id })

        encryption.setSalt(metadata.salt).setIv(metadata.iv)

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
        return vaultList({
            filesystem,
            listOptions: options,
            password: config.password,
            providerConfig: config,
            parser,
        })
    }

    const find: DataProvider['find'] = async (options) => {
        const { data: items } = await list({
            ...options,
            limit: 1,
        })

        return items[0] || null
    }

    const create: DataProvider['create'] = async (payload) => {
        const data = validate((v) => v.any(), payload.data)

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
        setPassword,
        encrypt,
        decrypt,
        lock,
        unlock,
        create,
        list,
    }
})
