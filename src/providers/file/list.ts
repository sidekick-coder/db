import { ListOptions } from '@/core/database/list.js'
import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { count, query } from '@/core/provider/queryArray.js'
import { Parser } from '@/core/parsers/all.js'

interface Payload {
    filesystem: Filesystem
    root: string
    options?: ListOptions
    parser: Parser
}

export async function list(payload: Payload) {
    const { filesystem, root, options, parser } = payload

    const resolve = (...args: string[]) => filesystem.path.resolve(root, ...args)

    const where = options?.where || {}
    const exclude = options?.exclude
    const include = options?.include
    const limit = options?.limit
    const page = options?.page || 1
    const sortBy = options?.sortBy
    const sortDesc = options?.sortDesc

    const files = filesystem.readdirSync(root).filter((f) => !['.db'].includes(f))

    const result = [] as any[]

    for (const file of files) {
        const filename = resolve(file)

        const content = filesystem.readSync.text(filename)

        const item: any = {
            id: file.replace(`.${parser.ext}`, ''),
            filename: filename,
            raw: content,
        }

        Object.assign(item, parser.parse(content))

        result.push(item)
    }

    const items = query(result, {
        where,
        exclude,
        include,
        limit,
        offset: page > 1 ? (page - 1) * limit : 0,
        sortBy,
        sortDesc,
    })

    const meta = {
        total: count(result, { where }),
        limit,
        total_pages: limit ? Math.ceil(result.length / limit) : 1,
    }

    return {
        meta,
        data: items,
    }
}
