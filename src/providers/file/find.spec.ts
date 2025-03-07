import { beforeEach, expect, it } from 'vitest'
import { json as parser } from '@/core/parsers/all.js'
import { createFactories } from './__tests__/factories.js'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'
import { find } from './find.js'

const root = '/db'
const filesystem = createFilesystemFake()
const { makeItem, makeManyItems } = createFactories({ filesystem, parser, root })

beforeEach(() => {
    filesystem.removeSync(root)

    filesystem.mkdirSync(root)
})

it('should find single item', async () => {
    makeManyItems()

    const item = makeItem({
        type: 'gold',
    })

    const response = await find({
        root: '/db',
        filesystem,
        parser,
        options: {
            where: {
                type: 'gold',
            },
        },
    })

    expect(response).toEqual(item)
})
