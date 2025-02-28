import crypto from 'crypto'
import { describe, expect, it, beforeEach } from 'vitest'
import { list } from './list.js'
import { createEncryption } from './encryption.js'
import { validate } from '@/core/validator/validate.js'
import { schema as configSchema } from './config.js'
import { parsers } from '@/core/parsers/all.js'
import { lock } from './lock.js'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'

describe('list', () => {
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

    it('should list items in the vault', async () => {
        filesystem.mkdirSync(resolve(root, 'item1'))
        filesystem.writeSync.json(resolve(root, 'item1', 'index.json'), {
            name: 'Item 1',
        })
        filesystem.mkdirSync(resolve(root, 'item2'))
        filesystem.writeSync.json(resolve(root, 'item2', 'index.json'), { name: 'Item 2' })

        const result = await list({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            listOptions: {},
        })

        expect(result.data).toHaveLength(2)
        expect(result.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: 'item1', name: 'Item 1' }),
                expect.objectContaining({ id: 'item2', name: 'Item 2' }),
            ])
        )
    })

    it('should apply filters to the list', async () => {
        filesystem.mkdirSync(resolve(root, 'item1'))
        filesystem.writeSync.json(resolve(root, 'item1', 'index.json'), {
            name: 'Item 1',
        })
        filesystem.mkdirSync(resolve(root, 'item2'))
        filesystem.writeSync.json(resolve(root, 'item2', 'index.json'), { name: 'Item 2' })

        const result = await list({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            listOptions: { where: { name: 'Item 1' } },
        })

        expect(result.data).toHaveLength(1)
        expect(result.data[0]).toEqual(expect.objectContaining({ id: 'item1', name: 'Item 1' }))
    })

    it('should list items when they are encrypted by lock function', async () => {
        filesystem.mkdirSync(resolve(root, 'item1'))
        filesystem.writeSync.json(resolve(root, 'item1', 'index.json'), {
            name: 'Item 1',
        })
        filesystem.mkdirSync(resolve(root, 'item2'))
        filesystem.writeSync.json(resolve(root, 'item2', 'index.json'), { name: 'Item 2' })

        await lock({
            id: 'item1',
            encryption,
            filesystem,
            providerConfig: config,
        })

        const result = await list({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            listOptions: {},
        })

        expect(result.data).toHaveLength(2)
        expect(result.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: 'Item 1', encrypted: true }),
                expect.objectContaining({ name: 'Item 2', encrypted: false }),
            ])
        )
    })
})
