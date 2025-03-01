import { Config } from './config.js'
import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { FindOptions } from '@/core/database/find.js'
import { list } from './list.js'
import { Parser } from '@/core/parsers/all.js'

interface Payload {
    filesystem: Filesystem
    root: string
    options: FindOptions
    parser: Parser
}

export async function find(payload: Payload) {
    const { filesystem, options, root, parser } = payload

    const { data: items } = await list({
        filesystem,
        root,
        parser,
        options: {
            ...options,
            limit: 1,
        },
    })

    return items[0] || null
}
