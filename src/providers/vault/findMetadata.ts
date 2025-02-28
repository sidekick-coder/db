import crypto from 'crypto'

import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { Config } from './config.js'
import { v } from '@/core/validator/valibot.js'
import { validate } from '@/core/validator/validate.js'

interface Options {
    id: string
    filesystem: Filesystem
    providerConfig: Config
}

export function findMetadata(options: Options) {
    const { filesystem, providerConfig, id } = options

    const resolve = (...args: string[]) => filesystem.path.resolve(providerConfig.path, ...args)

    const filepath = resolve(id, '.db', 'metadata.json')

    const json: any = filesystem.readSync.json(filepath, {
        default: {
            salt: crypto.randomBytes(16).toString('hex'),
            iv: crypto.randomBytes(16).toString('hex'),
            files: [],
        },
    })

    const all = filesystem.readdirSync(resolve(id))

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
