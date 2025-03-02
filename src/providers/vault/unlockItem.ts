import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { createEncryption } from './encryption.js'
import { findMetadata } from './findMetadata.js'
import { findPassword } from './findPassword.js'
import { validate } from '@/core/validator/validate.js'

interface Options {
    root: string
    filesystem: Filesystem
    options: {
        id: string
    }
}

export async function unlockItem(options: Options) {
    const { filesystem, root } = options
    const resolve = (...args: string[]) => filesystem.path.resolve(root, ...args)
    const id = validate((v) => v.string(), options.options.id)

    if (!filesystem.existsSync(resolve(id))) {
        throw new Error(`Item ${id} not found in ${resolve(id)}`)
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
        const encrypted = filesystem.readSync(resolve(id, source_filename))

        const contents = encryption.decrypt(encrypted)

        filesystem.writeSync(resolve(id, target_filename), contents)
        filesystem.removeSync(resolve(id, source_filename))

        file.encrypted = false
        file.name = target_filename
    }

    filesystem.writeSync.json(resolve(id, '.db', 'metadata.json'), metadata, {
        recursive: true,
    })

    return metadata.files
}
