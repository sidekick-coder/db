import crypto from 'crypto'
import { describe, it, expect, beforeEach } from 'vitest'
import { find } from './find.js'
import { createEncryption } from './encryption.js'
import { validate } from '@/core/validator/validate.js'
import { schema as configSchema } from './config.js'
import { parsers } from '@/core/parsers/all.js'
import { lockItem } from './lockItem.js'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'

describe('find', () => {
    const filesystem = createFilesystemFake()
    const resolve = filesystem.path.resolve
    const root = '/vault'
    const config = validate(configSchema('/', filesystem.path), {
        format: 'json',
        path: root,
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

    it('should find an item in the vault', async () => {
        const payload = {
            name: 'Item 1',
        }

        filesystem.writeSync.json(resolve(root, 'item1', 'index.json'), payload, {
            recursive: true,
        })

        const result = await find({
            filesystem,
            root,
            parser,
            options: { where: { id: 'item1' } },
        })

        expect(result).toEqual(expect.objectContaining(payload))
    })

    it('should return null if item is not found', async () => {
        const result = await find({
            filesystem,
            root,
            parser,
            options: { where: { id: 'nonexistent' } },
        })

        expect(result).toBeNull()
    })

    it('should find an item when it is encrypted by lock function', async () => {
        const payload = {
            name: 'Item 1',
        }

        filesystem.mkdirSync(`${root}/item1`)
        filesystem.writeSync.json(`${root}/item1/index.json`, payload)

        await lockItem({
            root,
            filesystem,
            options: { id: 'item1' },
        })

        const result = await find({
            filesystem,
            root,
            parser,
            options: { where: { id: 'item1' } },
        })

        expect(result).toEqual(expect.objectContaining(payload))
    })
})
