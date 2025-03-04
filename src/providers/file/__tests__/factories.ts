import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { Parser } from '@/core/parsers/all.js'

interface Options {
    filesystem: Filesystem
    parser: Parser
}

export function createFactories(options: Options) {
    const { filesystem, parser } = options
    function makeItem(payload = {}) {
        const id = String(filesystem.readdirSync('/db').length)
        const filename = `/db/${id}.json`
        const raw = parser.stringify(payload)

        filesystem.writeSync.text(filename, raw)

        return {
            id,
            filename,
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
