import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { pad } from '@/core/idStrategy/createIncremental.js'
import { Parser } from '@/core/parsers/all.js'

interface Options {
    filesystem: Filesystem
    parser: Parser
    root: string
}

export function createFactories(options: Options) {
    const { filesystem, parser, root } = options
    const resolve = filesystem.path.resolve

    function makeItem(payload = {}) {
        const id = pad(filesystem.readdirSync(root).length, 2)

        const filename = resolve(root, `${id}.${parser.ext}`)
        const raw = parser.stringify(payload)

        filesystem.writeSync.text(filename, raw)

        return {
            id,
            filename,
            raw,
            ...parser.parse(raw),
        }
    }

    function makeManyItems(count = 5, payload?: any) {
        const items = []

        for (let i = 0; i < count; i++) {
            items.push(makeItem(payload))
        }

        return items
    }

    return {
        makeItem,
        makeManyItems,
    }
}
