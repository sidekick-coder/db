import crypto from 'crypto'
import { describe, expect, it, beforeEach } from 'vitest'
import { createEncryption } from './encryption.js'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'
import { init } from './init.js'

describe('init', () => {
    const filesystem = createFilesystemFake()
    const resolve = filesystem.path.resolve
    const root = resolve('vault')

    beforeEach(() => {
        filesystem.removeSync(root)

        filesystem.mkdirSync(root)
    })

    it('should initialized vault database', async () => {
        const password = crypto.randomBytes(16).toString('hex')

        const encryption = createEncryption({
            password,
        })

        const respose = await init({
            filesystem,
            root,
            options: { password },
        })

        const filename = resolve(root, '.db', 'password.json')
        const json = filesystem.readSync.json(filename)

        const test = encryption.setSalt(json.salt).setIv(json.iv).decrypt(json.test)

        expect(respose.message).toBe('Vault database initialized')

        expect(filesystem.existsSync(filename)).toBe(true)
        expect(json.salt).toBeDefined()
        expect(json.iv).toBeDefined()
        expect(test).toMatch(/success/)
    })

    it('should init with custom salt and iv', async () => {
        const password = crypto.randomBytes(16).toString('hex')

        const salt = crypto.randomBytes(16).toString('hex')
        const iv = crypto.randomBytes(16).toString('hex')
        const encryption = createEncryption({
            password,
            salt,
            iv,
        })

        await init({
            filesystem,
            root,
            options: { password, salt, iv },
        })

        const filename = resolve(root, '.db', 'password.json')
        const json = filesystem.readSync.json(filename)
        const test = encryption.decrypt(json.test)

        expect(filesystem.existsSync(filename)).toBe(true)
        expect(json.salt).toBe(salt)
        expect(json.iv).toBe(iv)
        expect(test).toMatch(/success/)
    })

    it('should not init if already initialized', async () => {
        const password = crypto.randomBytes(16).toString('hex')

        await init({
            filesystem,
            root,
            options: { password },
        })

        const response = await init({
            filesystem,
            root,
            options: { password },
        })

        expect(response.message).toBe(
            'Vault already initialized, if you want to overwrite use force option'
        )
    })

    it('should force init', async () => {
        const password = crypto.randomBytes(16).toString('hex')

        await init({
            filesystem,
            root,
            options: { password },
        })

        const response = await init({
            filesystem,
            root,
            options: { password, force: true },
        })

        expect(response.message).toBe('Vault database initialized')
    })
})
