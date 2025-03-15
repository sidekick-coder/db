import { beforeEach, expect, it } from 'vitest'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'
import { createIncremental } from './createIncremental.js'

const root = '/db'
const filename = '/db/incremental.json'
const filesystem = createFilesystemFake()
const strategy = createIncremental(filesystem, filename)

beforeEach(() => {
    filesystem.removeSync(root)

    filesystem.mkdirSync(root)
})

function read() {
    return filesystem.readSync.json(filename, {
        schema: (v) => v.object({ last_id: v.number() }),
    })
}

it('should start with id 01', async () => {
    const id = await strategy.create()

    expect(id).toBe('01')

    expect(read()).to.containSubset({ last_id: 1 })
})

it('should not add initial zero if is greated than 9', async () => {
    filesystem.writeSync.json(filename, { last_id: 9 })

    const id = await strategy.create()

    expect(id).toBe('10')

    expect(read()).to.containSubset({ last_id: 10 })
})

it('should create ids greater than 100', async () => {
    filesystem.writeSync.json(filename, { last_id: 99 })

    const id = await strategy.create()

    expect(id).toBe('100')

    expect(read()).to.containSubset({ last_id: 100 })
})
