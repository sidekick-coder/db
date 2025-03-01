import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { createEncryption } from './encryption.js'

interface Options {
    filesystem: Filesystem
    root: string
}

export function findPassword(options: Options) {
    const { filesystem, root } = options
    const resolve = (...args: string[]) => filesystem.path.resolve(root, ...args)

    if (!filesystem.existsSync(resolve('.db', 'password'))) {
        throw new Error('Not authenticated, please run db auth first')
    }

    const password = filesystem.readSync.text(resolve('.db', 'password'))
    const metadata = filesystem.readSync.json(resolve('.db', 'password.json'), {
        schema: (v) =>
            v.object({
                salt: v.string(),
                iv: v.string(),
                test: v.string(),
            }),
    })

    if (!password || !metadata) {
        throw new Error('Password not found')
    }

    const encryption = createEncryption({
        password,
        salt: metadata.salt,
        iv: metadata.iv,
    })

    const decrypted = encryption.decrypt(metadata.test as string)

    if (!decrypted.endsWith('success')) {
        throw new Error('Password incorrect')
    }

    return password
}
