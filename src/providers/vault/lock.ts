import path from 'path'
import { Config } from './config.js'
import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { Encryption } from './encryption.js'
import { findMetadata } from './findMetadata.js'

interface Options {
    id: string
    encryption: Encryption
    filesystem: Filesystem
    providerConfig: Config
}

export async function lock(options: Options) {
    const { filesystem, encryption, providerConfig, id } = options

    const filepath = path.resolve(providerConfig.path, options.id)

    if (!filesystem.existsSync(filepath)) {
        throw new Error(`Item ${options.id} not found`)
    }

    const metadata = findMetadata({ id: id, filesystem, providerConfig })

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
