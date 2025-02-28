import crypto from 'crypto'
import { describe, expect, it, beforeEach } from 'vitest'
import { lock } from './lock.js'
import { createEncryption } from './encryption.js'
import { validate } from '@/core/validator/validate.js'
import { schema as configSchema } from './config.js'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'

describe('lock', () => {
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

    beforeEach(() => {
        filesystem.removeSync(root)

        filesystem.mkdirSync(root)
    })

    it('should lock an item in the vault', async () => {
        filesystem.mkdirSync(`${root}/item1`)
        filesystem.writeSync.text(
            `${root}/item1/index.json`,
            JSON.stringify({ id: 'item1', name: 'Item 1' })
        )

        const result = await lock({
            id: 'item1',
            encryption,
            filesystem,
            providerConfig: config,
        })

        expect(result).toEqual(
            expect.arrayContaining([expect.objectContaining({ encrypted: true })])
        )
        expect(filesystem.existsSync(`${root}/item1/index.json`)).toBe(false)
        expect(filesystem.existsSync(`${root}/item1/${encryption.encrypt('index.json')}`)).toBe(
            true
        )
    })

    it('should throw an error if item is not found', async () => {
        await expect(
            lock({
                id: 'nonexistent',
                encryption,
                filesystem,
                providerConfig: config,
            })
        ).rejects.toThrow('Item nonexistent not found')
    })
})
