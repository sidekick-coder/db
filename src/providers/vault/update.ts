import path from 'path'
import { Config } from './config.js'
import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { Encryption } from './encryption.js'
import { Parser } from '@/core/parsers/all.js'
import { UpdateOptions } from '@/core/database/update.js'
import { list } from './list.js'
import { findMetadata } from './findMetadata.js'
import { omit } from 'lodash-es'

interface Options {
    filesystem: Filesystem
    updateOptions: UpdateOptions
    providerConfig: Config
    encryption: Encryption
    parser: Parser
}

export async function update(options: Options) {
    const { filesystem, encryption, updateOptions, providerConfig, parser } = options

    const data = updateOptions.data

    const { data: items } = await list({
        filesystem,
        providerConfig,
        encryption,
        parser,
        listOptions: {
            where: updateOptions.where,
            limit: updateOptions.limit,
        },
    })

    const hideKeys = ['id', 'folder', 'raw', 'encrypted']

    for (const item of items) {
        const id = item.id

        const metadata = findMetadata({
            id,
            filesystem,
            providerConfig,
        })

        encryption.setSalt(metadata.salt).setIv(metadata.iv)

        const baseName = `index.${parser.ext}`
        const baseNameEncrypted = encryption.encrypt(baseName)

        const fileMeta = metadata.files.find(
            (f) => f.name === baseNameEncrypted || f.name === baseName
        )

        const filename = path.resolve(
            providerConfig.path,
            id,
            fileMeta.encrypted ? baseNameEncrypted : baseName
        )

        const properties = omit({ ...item, ...data }, hideKeys)

        let content = new TextEncoder().encode(parser.stringify(properties))

        if (fileMeta.encrypted) {
            content = encryption.encrypt(content)
        }

        filesystem.writeSync(filename, content)
    }

    return { count: items.length }
}
