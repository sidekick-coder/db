import path from 'path'
import crypto from 'crypto'
import { Config } from './config.js'
import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { createEncryption } from './encryption.js'

interface Options {
    salt: string
    iv: string
    password: string
    filesystem: Filesystem
    providerConfig: Config
}

export async function setPassword(options: Options) {
    const { filesystem, password, providerConfig, salt, iv } = options

    const encryption = createEncryption({
        password,
        salt,
        iv,
    })

    const filename = path.resolve(providerConfig.path, '.db', 'password.json')

    if (filesystem.existsSync(filename)) {
        return {
            message: 'Password already set',
            filename,
        }
    }

    const encrypted = encryption.encrypt(crypto.randomBytes(16).toString('hex') + 'success')

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
