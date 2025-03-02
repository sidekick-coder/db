import crypto from 'crypto'
import { describe, expect, it, beforeEach } from 'vitest'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'
import { unlockItem } from './unlockItem.js'
import { createEncryption } from './encryption.js'
import { lock } from './lock.js'
import { lockItem } from './lockItem.js'

describe('unlockItem', () => {
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

    it('should unlock an item in the vault', async () => {
        filesystem.mkdirSync(`${root}/item1`)
        filesystem.writeSync.text(
            `${root}/item1/index.json`,
            JSON.stringify({ id: 'item1', name: 'Item 1' })
        )

        await lockItem({
            root,
            filesystem,
            options: { id: 'item1' },
        })

        const result = await unlockItem({
            root,
            filesystem,
            options: { id: 'item1' },
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
            unlockItem({
                root,
                filesystem,
                options: { id: 'nonexistent' },
            })
        ).rejects.toThrow('Item nonexistent not found in /vault/nonexistent')
    })

    it('should unlock an item when it is encrypted by lock function', async () => {
        filesystem.writeSync.json(
            `${root}/item1/index.json`,
            { name: 'Item 1' },
            { recursive: true }
        )

        await lockItem({
            root,
            filesystem,
            options: { id: 'item1' },
        })

        const result = await unlockItem({
            root,
            filesystem,
            options: { id: 'item1' },
        })

        expect(result).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: 'index.json', encrypted: false }),
            ])
        )

        const item = filesystem.readSync.json(`${root}/item1/index.json`)

        expect(item).toEqual(expect.objectContaining({ name: 'Item 1' }))
    })
})
