import { beforeEach, expect, it } from 'vitest'
import { json as parser } from '@/core/parsers/all.js'
import { createFactories } from './__tests__/factories.js'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'
import { destroy } from './destroy.js'

const filesystem = createFilesystemFake()
const { makeItem, makeManyItems } = createFactories({ filesystem, parser })

beforeEach(() => {
    filesystem.removeSync('/db')

    filesystem.mkdirSync('/db')
})

it('should delete item', async () => {
    const item = makeItem({
        type: 'gold',
    })

    const response = await destroy({
        root: '/db',
        filesystem,
        parser,
        options: {
            where: {
                type: 'gold',
            },
        },
    })

    expect(response.count).toBe(1)

    expect(filesystem.existsSync(`/db/${item.id}.json`)).toBe(false)
})

it('should delete multiple items', async () => {
    const items = makeManyItems(3, {
        type: 'gold',
    })

    const response = await destroy({
        root: '/db',
        filesystem,
        parser,
        options: {
            where: {
                type: 'gold',
            },
        },
    })

    expect(response.count).toBe(3)

    items.forEach((item) => {
        expect(filesystem.existsSync(`/db/${item.id}.json`)).toBe(false)
    })
})

it('should delete with limit', async () => {
    makeManyItems()

    const response = await destroy({
        root: '/db',
        filesystem,
        parser,
        options: {
            limit: 3,
        },
    })

    expect(response.count).toBe(3)
})

it('should not delete item if where condition does not match', async () => {
    makeManyItems()

    const response = await destroy({
        root: '/db',
        filesystem,
        parser,
        options: {
            where: {
                type: 'gold',
            },
        },
    })

    expect(response.count).toBe(0)
})
