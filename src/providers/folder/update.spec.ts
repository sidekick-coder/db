import { beforeEach, expect, it } from 'vitest'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'
import { update } from './update.js'
import { json as parser } from '@/core/parsers/all.js'
import { createFactories } from './__tests__/factories.js'

const filesystem = createFilesystemFake()
const resolve = filesystem.path.resolve
const root = '/db'

const { readSync } = filesystem
const { makeItem, makeManyItems } = createFactories({ filesystem, parser, root })

beforeEach(() => {
    filesystem.removeSync(root)

    filesystem.mkdirSync(root)
})

it('should update an item in the database', async () => {
    const item = makeItem({
        title: 'Hello word',
    })

    const response = await update({
        root: root,
        filesystem,
        parser,
        options: {
            where: {
                id: item.id,
            },
            data: {
                title: 'Updated',
            },
        },
    })

    expect(response.count).toBe(1)

    const json = filesystem.readSync.json(resolve(root, item.id, 'index.json'))

    expect(json).to.containSubset({ title: 'Updated' })
})
//
it('should not remove previous properties if not included in update', async () => {
    const item = makeItem({
        title: 'Hello word',
    })

    const response = await update({
        root: root,
        filesystem,
        parser,
        options: {
            where: {
                id: item.id,
            },
            data: {
                type: 'message',
            },
        },
    })

    expect(response.count).toBe(1)

    const json = filesystem.readSync.json(resolve(root, item.id, 'index.json'))

    expect(json).to.containSubset({ title: 'Hello word', type: 'message' })
})

it('should update multiple items with where clause ', async () => {
    const items = makeManyItems(3, { type: 'greeting' })

    const response = await update({
        root: root,
        filesystem,
        parser,
        options: {
            where: {
                type: 'greeting',
            },
            data: {
                is_greeting: true,
            },
        },
    })

    expect(response.count).toBe(items.length)

    items.forEach((item) => {
        const json = readSync.json(resolve(root, item.id, 'index.json'))

        expect(json).to.containSubset({ is_greeting: true })
    })
})

it('should not update any items if none match where clause', async () => {
    const noUpdate = makeManyItems(3, { type: 'message' })
    const items = makeManyItems(3, { type: 'greeting' })

    const response = await update({
        root: root,
        filesystem,
        parser,
        options: {
            where: {
                type: 'greeting',
            },
            data: {
                is_greeting: true,
            },
        },
    })

    expect(response.count).toBe(items.length)

    items.forEach((item) => {
        const json = readSync.json(resolve(root, item.id, 'index.json'))

        expect(json).to.containSubset({ is_greeting: true })
    })

    noUpdate.forEach((item) => {
        const json = readSync.json(resolve(root, item.id, 'index.json'))

        expect(json).to.not.containSubset({ is_greeting: true })
    })
})
