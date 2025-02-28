import crypto from 'crypto'
import { describe, expect, it, beforeEach } from 'vitest'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'
import { unlock } from './unlock.js'
import { createEncryption } from './encryption.js'
import { validate } from '@/core/validator/validate.js'
import { schema as configSchema } from './config.js'
import { lock } from './lock.js'

describe('unlock', () => {
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

    it('should unlock an item in the vault', async () => {
        filesystem.mkdirSync(`${root}/item1`)
        filesystem.writeSync.text(
            `${root}/item1/index.json`,
            JSON.stringify({ id: 'item1', name: 'Item 1' })
        )

        await lock({
            id: 'item1',
            encryption,
            filesystem,
            providerConfig: config,
        })

        const result = await unlock({
            id: 'item1',
            encryption,
            filesystem,
            providerConfig: config,
        })

        expect(result).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: 'index.json', encrypted: false }),
            ])
        )

        const unlockedItem = JSON.parse(filesystem.readSync.text(`${root}/item1/index.json`))

        expect(unlockedItem).toEqual(expect.objectContaining({ id: 'item1', name: 'Item 1' }))
    })

    it('should throw an error if metadata file is not found', async () => {
        await expect(
            unlock({
                id: 'nonexistent',
                encryption,
                filesystem,
                providerConfig: config,
            })
        ).rejects.toThrow('Metadata file not found')
    })

    it('should unlock an item when it is encrypted by lock function', async () => {
        filesystem.mkdirSync(`${root}/item1`)
        filesystem.writeSync.text(
            `${root}/item1/index.json`,
            JSON.stringify({ id: 'item1', name: 'Item 1' })
        )

        await lock({
            id: 'item1',
            encryption,
            filesystem,
            providerConfig: config,
        })

        const result = await unlock({
            id: 'item1',
            encryption,
            filesystem,
            providerConfig: config,
        })

        expect(result).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: 'index.json', encrypted: false }),
            ])
        )
        const unlockedItem = JSON.parse(filesystem.readSync.text(`${root}/item1/index.json`))
        expect(unlockedItem).toEqual(expect.objectContaining({ id: 'item1', name: 'Item 1' }))
    })
})
