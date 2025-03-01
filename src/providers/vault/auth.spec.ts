import crypto from 'crypto'
import { describe, expect, it, beforeEach } from 'vitest'
import { createEncryption } from './encryption.js'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'
import { auth } from './auth.js'

describe('auth', () => {
    const filesystem = createFilesystemFake()
    const resolve = filesystem.path.resolve
    const root = resolve('vault')

    const encryption = createEncryption()
    let password = ''

    beforeEach(() => {
        filesystem.removeSync(root)

        filesystem.mkdirSync(root)

        password = crypto.randomBytes(16).toString('hex')

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

    it('should create password file', async () => {
        await auth({
            filesystem,
            root,
            options: { password, timeout: '15s' },
        })

        const filename = resolve(root, '.db', 'password')

        expect(filesystem.existsSync(filename)).toBe(true)
        expect(filesystem.readSync.text(filename)).toBe(password)
    })

    it('should throw an error if passowrd is invalid', async () => {
        await expect(
            auth({
                filesystem,
                root,
                options: { password: 'invalid', timeout: '15s' },
            })
        ).rejects.toThrow('Invalid password')
    })
})
