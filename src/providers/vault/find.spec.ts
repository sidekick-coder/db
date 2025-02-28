import { describe, it, expect, beforeEach } from 'vitest'
import { find } from './find.js'
import { createEncryption } from './encryption.js'
import { validate } from '@/core/validator/validate.js'
import { schema as configSchema } from './config.js'
import { parsers } from '@/core/parsers/all.js'
import { lock } from './lock.js'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'

describe('find', () => {
    const filesystem = createFilesystemFake()
    const root = '/vault'
    const config = validate(configSchema('/', filesystem.path), {
        format: 'json',
        path: root,
        id_strategy: 'increment',
        password: 'test-password',
    })
    const encryption = createEncryption().setPassword(config.password)
    const parser = parsers.find((p) => p.name === config.format)
    const resolve = (...args: string[]) => filesystem.path.resolve(root, ...args)

    beforeEach(() => {
        filesystem.removeSync(root)

        filesystem.mkdirSync(root)
    })

    it('should find an item in the vault', async () => {
        filesystem.mkdirSync(resolve('item1'))
        filesystem.writeSync.json(resolve('item1', 'index.json'), {
            id: 'item1',
            name: 'Item 1',
        })

        const result = await find({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            findOptions: { where: { id: 'item1' } },
        })

        expect(result).toEqual(expect.objectContaining({ id: 'item1', name: 'Item 1' }))
    })

    it('should return null if item is not found', async () => {
        const result = await find({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            findOptions: { where: { id: 'nonexistent' } },
        })

        expect(result).toBeNull()
    })

    it('should find an item when it is encrypted by lock function', async () => {
        const payload = {
            name: 'Item 1',
        }
        filesystem.mkdirSync(`${root}/item1`)
        filesystem.writeSync.json(`${root}/item1/index.json`, payload)

        await lock({
            id: 'item1',
            encryption,
            filesystem,
            providerConfig: config,
        })

        const result = await find({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            findOptions: { where: { id: 'item1' } },
        })

        expect(result).toEqual(expect.objectContaining(payload))
    })
})
