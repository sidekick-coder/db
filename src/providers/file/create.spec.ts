import { beforeEach, expect, it } from 'vitest'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'
import { create } from './create.js'
import { json as parser } from '@/core/parsers/all.js'
import { tryCatch } from '@/utils/tryCatch.js'

const root = '/db'
const filesystem = createFilesystemFake()

beforeEach(() => {
    filesystem.removeSync(root)

    filesystem.mkdirSync(root)
})

it('should create an item in the database', async () => {
    await create({
        root,
        filesystem,
        parser,
        makeId: async () => '01',
        options: {
            data: {
                title: 'Hello',
            },
        },
    })

    const item = filesystem.readSync.json('/db/01.json')

    expect(item).to.containSubset({ title: 'Hello' })
})

it('should create an item with an id in the database', async () => {
    await create({
        root,
        filesystem,
        parser,
        makeId: async () => '02',
        options: {
            data: {
                id: 'random-id',
                title: 'Hello',
            },
        },
    })

    expect(filesystem.existsSync('/db/random-id.json')).toBe(true)

    expect(filesystem.readSync.json('/db/random-id.json')).to.containSubset({ title: 'Hello' })
})

it('should throw an error if item id already exists', async () => {
    await create({
        root,
        filesystem,
        parser,
        makeId: async () => '03',
        options: {
            data: {
                id: '03',
                title: 'Hello',
            },
        },
    })

    const [, error] = await tryCatch(() =>
        create({
            root,
            filesystem,
            parser,
            makeId: async () => '03',
            options: {
                data: {
                    id: '03',
                    title: 'Hello',
                },
            },
        })
    )

    expect(error.message).toBe('Item with id "03" already exists')
})
