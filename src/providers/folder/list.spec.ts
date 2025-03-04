import { beforeEach, expect, it } from 'vitest'
import { list } from './list.js'
import { json as parser } from '@/core/parsers/all.js'
import { createFactories } from './__tests__/factories.js'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'

const filesystem = createFilesystemFake()
const root = '/db'
const { makeItem, makeManyItems } = createFactories({ filesystem, parser, root })

beforeEach(() => {
    filesystem.removeSync(root)

    filesystem.mkdirSync(root)
})

it('should list items', async () => {
    const items = makeManyItems()

    const response = await list({
        root,
        filesystem,
        parser,
    })

    expect(response.data.length).toBe(items.length)

    expect(response.data).toEqual(items)
})

it('should list items with limit', async () => {
    const items = makeManyItems()

    const response = await list({
        root,
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
        root,
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
