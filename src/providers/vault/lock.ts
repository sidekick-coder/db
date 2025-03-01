import { Config } from './config.js'
import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { createEncryption, Encryption } from './encryption.js'
import { findMetadata } from './findMetadata.js'
import { findPassword } from './findPassword.js'

interface Options {
    id: string
    root: string
    filesystem: Filesystem
}

export async function lock(options: Options) {
    const { filesystem, root, id } = options
    const resolve = (...args: string[]) => filesystem.path.resolve(root, ...args)

    const filepath = resolve(options.id)

    if (!filesystem.existsSync(resolve(options.id))) {
        throw new Error(`Item ${options.id} not found in ${filepath}`)
    }

    const password = findPassword({ filesystem, root })
    const metadata = findMetadata({ id: id, filesystem, root })

    const encryption = createEncryption({
        password,
        salt: metadata.salt,
        iv: metadata.iv,
    })

    for (const file of metadata.files) {
        if (file.encrypted) {
            continue
        }

        const source_filename = file.name
        const target_filename = encryption.encrypt(source_filename)

        const contents = filesystem.readSync(resolve(options.id, source_filename))
        const encrypted = encryption.encrypt(contents)

        filesystem.writeSync(resolve(options.id, target_filename), encrypted)
        filesystem.removeSync(resolve(options.id, source_filename))

        file.encrypted = true
        file.name = target_filename
    }

    filesystem.writeSync.json(resolve(options.id, '.db', 'metadata.json'), metadata, {
        recursive: true,
    })

    return metadata.files
}
