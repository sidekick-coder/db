import crypto from 'crypto'
import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { createEncryption } from './encryption.js'
import { validate } from '@/core/validator/validate.js'

interface Payload {
    filesystem: Filesystem
    root: string
    options: {
        salt: string
        iv: string
        password: string
        force: boolean
    }
}

export async function init(payload: Payload) {
    const { filesystem, root } = payload
    const { resolve } = filesystem.path

    const filename = resolve(root, '.db', 'password.json')
    const isInitialized = filesystem.existsSync(filename)

    if (isInitialized && !payload.options.force) {
        return {
            message: 'Vault already initialized, if you want to overwrite use force option',
            filename,
        }
    }

    const options = await validate.async(
        (v) =>
            v.objectAsync({
                salt: v.optional(v.string(), crypto.randomBytes(16).toString('hex')),
                iv: v.optional(v.string(), crypto.randomBytes(16).toString('hex')),
                password: v.prompts.password(),
                force: v.optional(v.boolean(), false),
            }),
        payload.options
    )

    const { salt, iv, password } = options

    const encryption = createEncryption({
        password,
        salt,
        iv,
    })

    const test = encryption.encrypt(crypto.randomBytes(16).toString('hex') + 'success')

    const json = {
        salt: options.salt,
        iv: options.iv,
        test,
    }

    filesystem.writeSync.json(filename, json, {
        recursive: true,
    })

    return {
        message: 'Password set',
        filename,
        ...json,
    }
}
