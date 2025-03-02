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

export async function lockItem(options: Options) {
    const { filesystem, root } = options
    const resolve = (...args: string[]) => filesystem.path.resolve(root, ...args)

    const id = validate((v) => v.string(), options.options.id)
    const filepath = resolve(id)

    if (!filesystem.existsSync(resolve(id))) {
        throw new Error(`Item ${id} not found in ${filepath}`)
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

        const contents = filesystem.readSync(resolve(id, source_filename))
        const encrypted = encryption.encrypt(contents)

        filesystem.writeSync(resolve(id, target_filename), encrypted)
        filesystem.removeSync(resolve(id, source_filename))

        file.encrypted = true
        file.name = target_filename
    }

    filesystem.writeSync.json(resolve(id, '.db', 'metadata.json'), metadata, {
        recursive: true,
    })

    return metadata.files
}
