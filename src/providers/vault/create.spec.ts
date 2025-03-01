import crypto from 'crypto'
import { describe, expect, it, beforeEach } from 'vitest'

import { createFilesystemFake } from '@/core/filesystem/index.js'
import { create } from './create.js'
import { createEncryption } from './encryption.js'
import { validate } from '@/core/validator/validate.js'
import { schema as configSchema } from './config.js'
import { parsers } from '@/core/parsers/all.js'

describe('create', () => {
    const filesystem = createFilesystemFake()
    const resolve = filesystem.path.resolve
    const root = resolve('vault')

    const config = validate(configSchema('/', filesystem.path), {
        format: 'json',
        path: root,
        id_strategy: 'increment',
        password: crypto.randomBytes(16).toString('hex'),
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

    it('should create an item in the vault', async () => {
        const result = await create({
            filesystem,
            root,
            parser,
            options: { data: { name: 'Item 1' } },
            makeId: async () => 'item1',
        })

        expect(result).toEqual(expect.objectContaining({ id: 'item1', name: 'Item 1' }))
        expect(filesystem.existsSync(resolve(root, 'item1'))).toBe(true)
    })

    it('should throw an error if item already exists', async () => {
        filesystem.mkdirSync(resolve(root, 'item1'))
        filesystem.writeSync.text(
            resolve(root, 'item1', `index.${parser.ext}`),
            JSON.stringify({ id: 'item1', name: 'Item 1' })
        )

        const fn = async () =>
            create({
                filesystem,
                root,
                parser,
                options: { data: { id: 'item1', name: 'Item 1' } },
                makeId: async () => 'item1',
            })

        await expect(fn).rejects.toThrow('Item with id "item1" already exists')
    })

    it('should check if the created item is encrypted', async () => {
        await create({
            filesystem,
            root,
            parser,
            options: { data: { name: 'Item 1' } },
            makeId: async () => 'item1',
        })

        expect(filesystem.existsSync(resolve(root, 'item1'))).toBe(true)

        expect(filesystem.existsSync(resolve(root, 'item1', '.db', 'metadata.json'))).toBe(true)

        const metadata = filesystem.readSync.json(resolve(root, 'item1', '.db', 'metadata.json'))

        for (const file of metadata.files) {
            expect(file.encrypted).toBe(true)

            const contents = filesystem.readSync.text(resolve(root, 'item2', file.name))

            expect(contents).not.toEqual(parser.stringify({ name: 'Item 1' }))
        }
    })
})
