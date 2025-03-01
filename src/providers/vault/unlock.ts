import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { createEncryption } from './encryption.js'
import { findMetadata } from './findMetadata.js'
import { findPassword } from './findPassword.js'

interface Options {
    id: string
    root: string
    filesystem: Filesystem
}

export async function unlock(options: Options) {
    const { filesystem, root, id } = options
    const resolve = (...args: string[]) => filesystem.path.resolve(root, ...args)

    if (!filesystem.existsSync(resolve(options.id))) {
        throw new Error(`Item ${options.id} not found in ${resolve(options.id)}`)
    }

    const password = findPassword({ filesystem, root })
    const metadata = findMetadata({ id: id, filesystem, root })
    const encryption = createEncryption({
        password: password,
        salt: metadata.salt,
        iv: metadata.iv,
    })

    encryption.setSalt(metadata.salt).setIv(metadata.iv)

    for (const file of metadata.files) {
        if (!file.encrypted) {
            continue
        }

        const source_filename = file.name as string
        const target_filename = encryption.decrypt(source_filename)
        const encrypted = filesystem.readSync(resolve(options.id, source_filename))

        const contents = encryption.decrypt(encrypted)

        filesystem.writeSync(resolve(options.id, target_filename), contents)
        filesystem.removeSync(resolve(options.id, source_filename))

        file.encrypted = false
        file.name = target_filename
    }

    filesystem.writeSync.json(resolve(options.id, '.db', 'metadata.json'), metadata, {
        recursive: true,
    })

    return metadata.files
}
