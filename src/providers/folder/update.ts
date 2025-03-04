import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { Parser } from '@/core/parsers/all.js'
import { UpdateOptions } from '@/core/database/update.js'
import { omit } from 'lodash-es'
import { list } from './list.js'

interface Payload {
    filesystem: Filesystem
    root: string
    options: UpdateOptions
    parser: Parser
}

export async function update(payload: Payload) {
    const { filesystem, root, options, parser } = payload
    const resolve = (...args: string[]) => filesystem.path.resolve(root, ...args)

    const data = options.data

    const { data: items } = await list({
        filesystem,
        root,
        parser,
        options: {
            where: options.where,
            limit: options.limit,
        },
    })

    const hideKeys = ['id', 'folder', 'raw', 'lock']

    for (const item of items) {
        const filename = resolve(item.id, `index.${parser.ext}`)

        const properties = omit({ ...item, ...data }, hideKeys)

        const content = parser.stringify(properties)

        filesystem.writeSync.text(filename, content)
    }

    return { count: items.length }
}
