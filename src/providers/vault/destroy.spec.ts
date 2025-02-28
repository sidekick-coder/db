import { beforeEach, describe, expect, it } from 'vitest'
import { destroy } from './destroy.js'
import { createEncryption } from './encryption.js'
import { validate } from '@/core/validator/validate.js'
import { schema as configSchema } from './config.js'
import { parsers } from '@/core/parsers/all.js'
import { createFilesystemFake } from '@/core/filesystem/createFilesystemFake.js'

describe('destroy', () => {
    const root = '/vault'
    const filesystem = createFilesystemFake()

    const config = validate(configSchema('/', filesystem.path), {
        format: 'json',
        path: root,
        id_strategy: 'increment',
        password: 'test-password',
    })

    const encryption = createEncryption().setPassword(config.password)
    const parser = parsers.find((p) => p.name === config.format)

    beforeEach(() => {
        filesystem.removeSync(root)

        filesystem.mkdirSync(root)
    })

    it('should destroy items based on the provided options', async () => {
        filesystem.writeSync.json('/vault/01/index.json', { name: 'test' }, { recursive: true })

        const result = await destroy({
            filesystem,
            providerConfig: config,
            encryption,
            parser,
            destroyOptions: {
                where: { id: '01' },
                limit: 1,
            },
        })

        expect(result.count).toBe(1)
        expect(filesystem.existsSync('/vault/01')).toBe(false)
    })

    it('should not destroy items if no matching items are found', async () => {
        const destroyOptions = {
            where: { id: '03' },
            limit: 1,
        }

        const result = await destroy({
            filesystem,
            destroyOptions,
            providerConfig: config,
            encryption,
            parser,
        })

        expect(result.count).toBe(0)
    })
})
