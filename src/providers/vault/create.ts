import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { CreateOptions } from '@/core/database/create.js'
import { Parser } from '@/core/parsers/all.js'
import { lockItem } from './lockItem.js'

interface Payload {
    filesystem: Filesystem
    root: string
    options: CreateOptions
    makeId: () => Promise<string>
    parser: Parser
}

export async function create(payload: Payload) {
    const { filesystem, root, options, makeId, parser } = payload
    const resolve = (...args: string[]) => filesystem.path.resolve(root, ...args)

    const data = options.data

    const id = data.id || (await makeId())

    if (filesystem.existsSync(resolve(id))) {
        throw new Error(`Item with id "${id}" already exists`)
    }

    const folder = resolve(id, `index.${parser.ext}`)
    const raw = parser.stringify(data)

    filesystem.mkdirSync(resolve(id))

    filesystem.writeSync.text(folder, raw)

    await lockItem({
        filesystem,
        root,
        options: { id },
    })

    const item = {
        id,
        raw,
        folder,
        ...data,
    }

    return item
}
