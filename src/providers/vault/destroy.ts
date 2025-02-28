import { Config } from './config.js'
import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { Encryption } from './encryption.js'
import { Parser } from '@/core/parsers/all.js'
import { list } from './list.js'
import { DestroyOptions } from '@/core/database/destroy.js'

interface Options {
    filesystem: Filesystem
    destroyOptions: DestroyOptions
    providerConfig: Config
    encryption: Encryption
    parser: Parser
}

export async function destroy(options: Options) {
    const { filesystem, encryption, destroyOptions, providerConfig, parser } = options

    const { data: items } = await list({
        filesystem,
        providerConfig,
        encryption,
        parser,
        listOptions: {
            where: destroyOptions.where,
            limit: destroyOptions.limit,
        },
    })

    for (const item of items) {
        const filename = filesystem.path.resolve(providerConfig.path, item.id)

        filesystem.removeSync(filename)
    }

    return { count: items.length }
}
