import crypto from 'crypto'
import { describe, expect, it, beforeEach } from 'vitest'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'

import { update } from './update.js'
import { createEncryption } from './encryption.js'
import { validate } from '@/core/validator/validate.js'
import { schema as configSchema } from './config.js'
import { parsers } from '@/core/parsers/all.js'
import { lock } from './lock.js'
import { find } from './find.js'

describe('update', () => {
    const filesystem = createFilesystemFake()
    const resolve = filesystem.path.resolve
    const root = resolve('vault')

    const config = validate(configSchema('/', filesystem.path), {
        format: 'json',
        path: root,
        id_strategy: 'increment',
        password: crypto.randomBytes(16).toString('hex'),
    })

    const encryption = createEncryption({ password: config.password })
    const parser = parsers.find((p) => p.name === config.format)

    beforeEach(() => {
        filesystem.removeSync(root)

        filesystem.mkdirSync(root)
    })

    it('should update an item in the vault', async () => {
        filesystem.writeSync.json(
            resolve(root, 'item1', 'index.json'),
            { name: 'Item 1' },
            { recursive: true }
        )

        const result = await update({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            updateOptions: { where: { id: 'item1' }, data: { name: 'Updated Item 1' } },
        })

        expect(result.count).toBe(1)

        const updatedItem = JSON.parse(filesystem.readSync.text(`${root}/item1/index.json`))

        expect(updatedItem).toEqual(expect.objectContaining({ name: 'Updated Item 1' }))
    })

    it('should update multiple items in the vault', async () => {
        filesystem.writeSync.json(
            resolve(root, 'item1', 'index.json'),
            { name: 'Item 1' },
            { recursive: true }
        )

        filesystem.writeSync.json(
            resolve(root, 'item2', 'index.json'),
            { name: 'Item 2' },
            { recursive: true }
        )

        const result = await update({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            updateOptions: { where: {}, data: { description: 'Updated description' } },
        })

        expect(result.count).toBe(2)

        const updatedItem1 = filesystem.readSync.json(resolve(root, 'item1', 'index.json'))
        const updatedItem2 = filesystem.readSync.json(resolve(root, 'item2', 'index.json'))

        expect(updatedItem1).toEqual(
            expect.objectContaining({
                name: 'Item 1',
                description: 'Updated description',
            })
        )
        expect(updatedItem2).toEqual(
            expect.objectContaining({
                name: 'Item 2',
                description: 'Updated description',
            })
        )
    })

    it('should not update any items if none match the criteria', async () => {
        filesystem.writeSync.json(
            resolve(root, 'item1', 'index.json'),
            { name: 'Item 1' },
            { recursive: true }
        )

        const result = await update({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            updateOptions: { where: { id: 'nonexistent' }, data: { name: 'Updated Item' } },
        })

        expect(result.count).toBe(0)

        const item = filesystem.readSync.json(resolve(root, 'item1', 'index.json'))

        expect(item).toEqual(expect.objectContaining({ name: 'Item 1' }))
    })

    it('should update an item when it is encrypted by lock function', async () => {
        filesystem.writeSync.json(
            resolve(root, 'item1', 'index.json'),
            { name: 'Item 1' },
            { recursive: true }
        )

        await lock({
            id: 'item1',
            encryption,
            filesystem,
            providerConfig: config,
        })

        const result = await update({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            updateOptions: { where: { id: 'item1' }, data: { name: 'Updated Item 1' } },
        })

        expect(result.count).toBe(1)

        const updatedItem = await find({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            findOptions: { where: { id: 'item1' }, limit: 1 },
        })

        expect(updatedItem).toEqual(expect.objectContaining({ name: 'Updated Item 1' }))
    })
})
