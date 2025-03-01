import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { Parser } from '@/core/parsers/all.js'
import { DestroyOptions } from '@/core/database/destroy.js'
import { list } from './list.js'

interface Payload {
    filesystem: Filesystem
    root: string
    options: DestroyOptions
    parser: Parser
}

export async function destroy(payload: Payload) {
    const { filesystem, root, parser, options } = payload

    const { data: items } = await list({
        filesystem,
        root,
        parser,
        options: {
            where: options.where,
            limit: options.limit,
        },
    })

    for (const item of items) {
        const filename = filesystem.path.resolve(root, item.id)

        filesystem.removeSync(filename)
    }

    return { count: items.length }
}
