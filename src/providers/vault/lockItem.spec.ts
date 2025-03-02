import crypto from 'crypto'
import { describe, expect, it, beforeEach } from 'vitest'
import { lockItem } from './lockItem.js'
import { createEncryption } from './encryption.js'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'

describe('lockItem', () => {
    const filesystem = createFilesystemFake()
    const resolve = filesystem.path.resolve
    const root = resolve('vault')

    const encryption = createEncryption()

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

    it('should lock an item in the vault', async () => {
        const itemPath = (...args: string[]) => resolve(root, 'item1', ...args)

        filesystem.mkdirSync(itemPath())

        filesystem.writeSync.json(itemPath('index.json'), { name: 'Item 1' })
        filesystem.writeSync.json(
            itemPath('.db', 'metadata.json'),
            {
                salt: encryption.state.salt,
                iv: encryption.state.iv,
            },
            { recursive: true }
        )

        await lockItem({
            filesystem,
            root,
            options: { id: 'item1' },
        })

        expect(filesystem.existsSync(itemPath('index.json'))).toBe(false)
        expect(filesystem.existsSync(itemPath(encryption.encrypt('index.json')))).toBe(true)
    })

    it('should throw an error if item is not found', async () => {
        await expect(
            lockItem({
                filesystem,
                root,
                options: { id: 'nonexistent' },
            })
        ).rejects.toThrow('Item nonexistent not found')
    })
})
