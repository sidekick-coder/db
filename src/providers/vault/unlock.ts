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

export async function unlock(options: Options) {
    const { filesystem, encryption, providerConfig, id } = options

    const filepath = path.resolve(providerConfig.path, options.id)

    if (!filesystem.existsSync(path.resolve(filepath, '.db', '.metadata.json'))) {
        throw new Error('Metadata file not found')
    }

    const metadata = findMetadata({ id: id, filesystem, providerConfig })

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
