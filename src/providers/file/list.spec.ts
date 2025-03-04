import { beforeEach, expect, it } from 'vitest'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'
import { list } from './list.js'
import { json as parser } from '@/core/parsers/all.js'

const filesystem = createFilesystemFake()

beforeEach(() => {
    filesystem.removeSync('/db')

    filesystem.mkdirSync('/db')
})

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

it('should list items', async () => {
    const items = makeManyItems()

    const response = await list({
        root: '/db',
        filesystem,
        parser,
    })

    expect(response.data.length).toBe(items.length)

    expect(response.data).toEqual(items)
})

it('should list items with limit', async () => {
    const items = makeManyItems()

    const response = await list({
        root: '/db',
        filesystem,
        parser,
        options: {
            limit: 3,
        },
    })

    expect(response.data.length).toBe(3)

    expect(response.data).toEqual(items.slice(0, 3))
})

it('should list items with where', async () => {
    makeManyItems()

    const item = makeItem({
        type: 'gold',
    })

    const response = await list({
        root: '/db',
        filesystem,
        parser,
        options: {
            where: {
                type: 'gold',
            },
        },
    })

    expect(response.data.length).toBe(1)

    expect(response.data[0]).toEqual(item)
})
