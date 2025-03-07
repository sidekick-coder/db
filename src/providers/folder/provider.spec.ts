import { vi, beforeEach, expect, it } from 'vitest'
import { markdown as parser } from '@/core/parsers/all.js'
import { createFactories } from './__tests__/factories.js'
import { createFilesystemFake } from '@/core/filesystem/index.js'
import { provider as mount } from './provider.js'
import { validate } from '@/core/validator/validate.js'
import { tryCatch } from '@/utils/tryCatch.js'
import { format } from 'date-fns'
import { afterEach } from 'node:test'

const filesystem = createFilesystemFake()

const config = {
    path: '/db',
}

const instanceOptions = {
    root: '/',
    fs: filesystem.fs,
    path: filesystem.path,
}

const { makeItem, makeManyItems } = createFactories({ filesystem, parser, root: config.path })

let provider = mount({ path: '/db' }, instanceOptions)

function createProvider(payload: any) {
    provider = mount({ ...config, ...payload }, instanceOptions)
}

beforeEach(() => {
    filesystem.removeSync('/db')

    filesystem.mkdirSync('/db')

    createProvider({ path: '/db' })
})

afterEach(() => {
    vi.useRealTimers()
})

it('should list items', async () => {
    const items = makeManyItems()

    const response = await provider.list()

    expect(response.data.length).toBe(items.length)

    expect(response.data).toEqual(items)
})

it('should find an item', async () => {
    makeManyItems()

    const item = makeItem()

    const response = await provider.find({
        where: {
            id: item.id,
        },
    })

    expect(response).toEqual(item)
})

it('should create an item', async () => {
    const payload = {
        type: 'gold',
    }

    const item = {
        id: '01',
        folder: '/db/01',
        raw: parser.stringify(payload),
        type: 'gold',
    }

    const created = await provider.create({
        data: payload,
    })

    expect(created).toEqual(item)

    const { data } = await provider.list()

    expect(data.length).toBe(1)
})

it('should create an item with uuid id strategry', async () => {
    createProvider({
        id_strategy: {
            name: 'uuid',
        },
    })

    const payload = {
        type: 'gold',
    }

    const created = await provider.create({
        data: payload,
    })

    const [uuid] = tryCatch.sync(() => validate((v) => v.pipe(v.string(), v.uuid()), created.id))

    expect(!!uuid).toBe(true)

    const { data } = await provider.list()

    expect(data.length).toBe(1)
})

it.each(['dd', 'MM-dd', 'yyyy-MM-dd', 'yyyy-MM-dd-HH-mm', 'yyyy-MM-dd-HH-mm-ss'])(
    'should create an item with date id strategry and pattern %s',
    async (pattern) => {
        const mockDate = new Date(2022, 0, 1)

        vi.setSystemTime(mockDate)

        createProvider({
            id_strategy: {
                name: 'date',
                options: {
                    pattern,
                },
            },
        })

        const payload = {
            type: 'gold',
        }

        const created = await provider.create({
            data: payload,
        })

        expect(created.id).toBe(format(mockDate, pattern))

        const { data } = await provider.list()

        expect(data.length).toBe(1)
    }
)

it('should update an item', async () => {
    makeManyItems()

    const item = makeItem()

    const payload = {
        type: 'silver',
    }

    const { count } = await provider.update({
        where: {
            id: item.id,
        },
        data: payload,
    })

    expect(count).toBe(1)

    const updated = await provider.find({
        where: {
            id: item.id,
        },
    })

    expect(updated.type).toBe(payload.type)
})

it('should destroy an item', async () => {
    const item = makeItem()

    const { count } = await provider.destroy({
        where: {
            id: item.id,
        },
    })

    expect(count).toBe(1)

    const { data } = await provider.list()

    expect(data.length).toBe(0)
})
