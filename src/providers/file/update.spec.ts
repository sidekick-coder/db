import { beforeEach, expect, it } from 'vitest'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'
import { update } from './update.js'
import { json } from '@/core/parsers/all.js'

const filesystem = createFilesystemFake()

beforeEach(() => {
    filesystem.removeSync('/db')

    filesystem.mkdirSync('/db')
})

it('should update an item in the database', async () => {
    filesystem.writeSync.json('/db/01.json', {
        title: 'Hello word',
    })

    const response = await update({
        root: '/db',
        filesystem,
        parser: json,
        options: {
            where: {
                id: '01',
            },
            data: {
                title: 'Updated',
            },
        },
    })

    expect(response.count).toBe(1)

    const item = filesystem.readSync.json('/db/01.json')

    expect(item).to.containSubset({ title: 'Updated' })
})

it('should not remove previous properties if not included in update', async () => {
    filesystem.writeSync.json('/db/01.json', {
        title: 'Hello word',
    })

    const response = await update({
        root: '/db',
        filesystem,
        parser: json,
        options: {
            where: {
                id: '01',
            },
            data: {
                type: 'message',
            },
        },
    })

    expect(response.count).toBe(1)

    const item = filesystem.readSync.json('/db/01.json')

    expect(item).to.containSubset({ title: 'Hello word', type: 'message' })
})

it('should update multiple items with where clause ', async () => {
    filesystem.writeSync.json('/db/01.json', { title: 'Hello', type: 'greeting' })
    filesystem.writeSync.json('/db/02.json', { title: 'Bye', type: 'greeting' })

    const response = await update({
        root: '/db',
        filesystem,
        parser: json,
        options: {
            where: {
                type: 'greeting',
            },
            data: {
                is_greeting: true,
            },
        },
    })

    expect(response.count).toBe(2)

    expect(filesystem.readSync.json('/db/01.json')?.is_greeting).toBe(true)
    expect(filesystem.readSync.json('/db/02.json')?.is_greeting).toBe(true)
})

it('should not update any items if none match where clause', async () => {
    filesystem.writeSync.json('/db/01.json', { title: 'Hello word', type: 'message' })
    filesystem.writeSync.json('/db/02.json', { title: 'Hello', type: 'greeting' })
    filesystem.writeSync.json('/db/03.json', { title: 'Bye', type: 'greeting' })

    const response = await update({
        root: '/db',
        filesystem,
        parser: json,
        options: {
            where: {
                type: 'greeting',
            },
            data: {
                is_greeting: true,
            },
        },
    })

    expect(response.count).toBe(2)

    expect(filesystem.readSync.json('/db/01.json')?.is_greeting).to.not.toBeDefined()
    expect(filesystem.readSync.json('/db/02.json')?.is_greeting).toBe(true)
    expect(filesystem.readSync.json('/db/03.json')?.is_greeting).toBe(true)
})
