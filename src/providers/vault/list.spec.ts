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
    })

    const encryption = createEncryption()
    const parser = parsers.find((p) => p.name === config.format)

    beforeEach(() => {
        filesystem.removeSync(root)

        filesystem.mkdirSync(root)

        const password = crypto.randomBytes(16).toString('hex')
        const salt = crypto.randomBytes(16).toString('hex')
        const iv = crypto.randomBytes(16).toString('hex')

        encryption.setPassword(password).setSalt(salt).setIv(iv)

        filesystem.mkdirSync(resolve(root, '.db'))
        filesystem.writeSync.text(resolve(root, '.db', 'password'), password)
        filesystem.writeSync.json('/vault/.db/password.json', {
            salt,
            iv,
            test: encryption.encrypt('success'),
        })
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
            root,
            parser,
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
            root,
            parser,
            options: { where: { name: 'Item 1' } },
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
            root,
            filesystem,
        })

        const result = await list({
            filesystem,
            root,
            parser,
            options: {},
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
