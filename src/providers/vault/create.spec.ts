import crypto from 'crypto'
import { describe, expect, it, beforeEach } from 'vitest'

import { createFilesystem } from '@/core/filesystem/createFilesystem.js'
import { createFsFake } from '@/core/filesystem/createFsFake.js'
import { create } from './create.js'
import { createEncryption } from './encryption.js'
import { validate } from '@/core/validator/validate.js'
import { schema as configSchema } from './config.js'
import { parsers } from '@/core/parsers/all.js'
import { lock } from './lock.js'

describe('create', () => {
    const root = 'D:\\vault'

    const config = validate(configSchema(root), {
        format: 'json',
        path: root,
        id_strategy: 'increment',
        password: crypto.randomBytes(16).toString('hex'),
    })

    const fs = createFsFake()

    const filesystem = createFilesystem({ fs })
    const encryption = createEncryption({ password: config.password })
    const parser = parsers.find((p) => p.name === config.format)

    beforeEach(() => {
        filesystem.removeSync(root)

        filesystem.mkdirSync(root)
    })

    it('should create an item in the vault', async () => {
        const result = await create({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            createOptions: { data: { name: 'Item 1' } },
            makeId: async () => 'item1',
        })

        expect(result).toEqual(expect.objectContaining({ id: 'item1', name: 'Item 1' }))
        expect(filesystem.existsSync(`${root}\\item1`)).toBe(true)
    })

    it('should throw an error if item already exists', async () => {
        filesystem.mkdirSync(`${root}\\item1`)
        filesystem.writeSync.text(
            `${root}\\item1\\index.json`,
            JSON.stringify({ id: 'item1', name: 'Item 1' })
        )

        const fn = async () =>
            create({
                filesystem,
                encryption,
                providerConfig: config,
                parser,
                createOptions: { data: { id: 'item1', name: 'Item 1' } },
                makeId: async () => 'item1',
            })

        await expect(fn).rejects.toThrow('Item with id "item1" already exists')
    })

    it('should check if the created item is encrypted', async () => {
        await create({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            createOptions: { data: { name: 'Item 1' } },
            makeId: async () => 'item1',
        })

        await lock({
            id: 'item1',
            encryption,
            filesystem,
            providerConfig: config,
        })

        await create({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            createOptions: { data: { name: 'Item 2' } },
            makeId: async () => 'item2',
        })

        expect(filesystem.existsSync(`${root}\\item2`)).toBe(true)
        expect(filesystem.existsSync(`${root}\\item2\\.db\\.metadata.json`)).toBe(true)

        const metadata = filesystem.readSync.json(`${root}\\item2\\.db\\.metadata.json`)

        for (const file of metadata.files) {
            expect(file.encrypted).toBe(true)

            const contents = filesystem.readSync.text(`${root}\\item2\\${file.name}`)

            expect(contents).not.toEqual(
                expect.stringContaining(JSON.stringify({ name: 'Item 2' }))
            )
        }
    })
})
