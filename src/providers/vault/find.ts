import { Config } from './config.js'
import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { Encryption } from './encryption.js'
import { FindOptions } from '@/core/database/find.js'
import { list } from './list.js'
import { Parser } from '@/core/parsers/all.js'

interface Options {
    filesystem: Filesystem
    findOptions: FindOptions
    providerConfig: Config
    encryption: Encryption
    parser: Parser
}

export async function find(options: Options) {
    const { filesystem, findOptions, encryption, providerConfig, parser } = options

    const { data: items } = await list({
        filesystem,
        providerConfig,
        encryption,
        parser,
        listOptions: {
            ...findOptions,
            limit: 1,
        },
    })

    return items[0] || null
}
