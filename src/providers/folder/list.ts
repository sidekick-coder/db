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
    const exclude = options?.exclude || []
    const include = options?.include || []
    const limit = options?.limit
    const page = options?.page || 1
    const sortBy = options?.sortBy
    const sortDesc = options?.sortDesc

    let files = filesystem.readdirSync(root)

    const excludeDirs = ['.db']

    files = files.filter((file) => !excludeDirs.includes(file))

    const result = [] as Record<string, any>[]

    for (const id of files) {
        const filename = resolve(id, `index.${parser.ext}`)
        const folder = resolve(id)

        if (!filesystem.existsSync(filename)) {
            throw new Error(`File "${filename}" not found`)
        }

        const raw = filesystem.readSync.text(resolve(id, `index.${parser.ext}`))

        const item = {
            id,
            folder,
            raw,
        }

        Object.assign(item, parser.parse(raw))

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
