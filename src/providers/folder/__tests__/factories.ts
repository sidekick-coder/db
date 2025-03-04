import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { Parser } from '@/core/parsers/all.js'

interface Options {
    root: string
    filesystem: Filesystem
    parser: Parser
}

export function createFactories(options: Options) {
    const { filesystem, parser, root } = options

    function makeItem(payload = {}) {
        const id = String(filesystem.readdirSync(root).length)
        const folder = filesystem.path.resolve(root, id)
        const filename = filesystem.path.resolve(root, id, `index.${parser.ext}`)
        const raw = parser.stringify(payload)

        filesystem.writeSync.text(filename, raw, {
            recursive: true,
        })

        return {
            id,
            folder,
            raw,
            ...payload,
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
