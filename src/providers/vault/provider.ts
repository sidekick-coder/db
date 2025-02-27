import { defineProvider } from '@/core/provider/defineProvider.js'
import { validate } from '@/core/validator/index.js'
import { DataProvider } from '@/core/provider/index.js'
import crypto from 'crypto'
import { drive } from '@/core/drive/index.js'
import path from 'path'
import { createFilesystem } from '@/core/filesystem/createFilesystem.js'
import { parsers } from '@/core/parsers/all.js'
import { createIdMaker } from '@/core/id/index.js'
import { createIncrementalStategyFromFile } from '@/core/id/incremental.js'
import { createEncryption, decrypt, encrypt } from './encryption.js'
import { schema as configSchema } from './config.js'
import { list as vaultList } from './list.js'
import { find as vaultFind } from './find.js'
import { create as vaultCreate } from './create.js'
import { update as vaultUpdate } from './update.js'
import { destroy as vaultDestroy } from './destroy.js'
import { lock as vaultLock } from './lock.js'
import { unlock as vaultUnlock } from './unlock.js'
import { setPassword as vaultSetPassword } from './setPassword.js'

export const provider = defineProvider((payload, { root, fs }) => {
    const config = validate(configSchema(root), payload)
    const filesystem = createFilesystem({ fs })
    const encryption = createEncryption()

    // parser
    const parser = parsers.find((p) => p.name === config.format)

    if (!parser) {
        throw new Error(`Parser for format "${config.format}" not found`)
    }

    // id maker
    const maker = createIdMaker({
        strategies: [
            createIncrementalStategyFromFile(
                drive,
                path.resolve(config.path, '.db', 'last_id.json')
            ),
        ],
    })

    const makeId = () => maker(config.id_strategy)

    // password
    const password = validate((v) => v.string(), payload.password)

    const filename = path.resolve(config.path, '.db', 'password.json')

    if (!drive.existsSync(filename)) {
        return {
            valid: false,
            message: 'No password set',
        }
    }

    const data = filesystem.readSync.json(filename)

    encryption.setPassword(password)

    const decrypted = encryption
        .setSalt(data.salt)
        .setIv(data.iv)
        .decrypt(data.encrypted as string)

    if (!decrypted.endsWith('success')) {
        throw new Error('Password incorrect')
    }

    // methods
    function setPassword(payload: any) {
        const salt = crypto.randomBytes(16).toString('hex')
        const iv = crypto.randomBytes(16).toString('hex')

        return vaultSetPassword({
            filesystem,
            password: payload.password,
            providerConfig: config,
            salt,
            iv,
        })
    }

    async function lock(payload: any) {
        const id = validate((v) => v.string('id is required'), payload.id)

        return vaultLock({
            id,
            encryption,
            filesystem,
            providerConfig: config,
        })
    }

    function unlock(payload: any) {
        const id = validate((v) => v.string('id is required'), payload.id)

        return vaultUnlock({
            id,
            encryption,
            filesystem,
            providerConfig: config,
        })
    }

    const list: DataProvider['list'] = async (options) => {
        return vaultList({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            listOptions: options,
        })
    }

    const find: DataProvider['find'] = async (options) => {
        return vaultFind({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            findOptions: options,
            makeId,
        })
    }

    const create: DataProvider['create'] = async (payload) => {
        return vaultCreate({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            createOptions: payload,
            makeId,
        })
    }

    const update: DataProvider['update'] = async (payload) => {
        return vaultUpdate({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            updateOptions: payload,
        })
    }

    const destroy: DataProvider['destroy'] = async (payload) => {
        return vaultDestroy({
            filesystem,
            parser,
            encryption,
            providerConfig: config,
            destroyOptions: payload,
        })
    }

    return {
        setPassword,
        encrypt,
        decrypt,
        lock,
        unlock,
        list,
        find,
        create,
        update,
        destroy,
    }
})
