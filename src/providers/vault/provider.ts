import { defineProvider } from '@/core/provider/defineProvider.js'
import { validate } from '@/core/validator/index.js'
import { DataProvider } from '@/core/provider/index.js'
import { drive } from '@/core/drive/index.js'
import { createFilesystem } from '@/core/filesystem/createFilesystem.js'
import { parsers } from '@/core/parsers/all.js'
import { createIdMaker } from '@/core/id/index.js'
import { createIncrementalStategyFromFile } from '@/core/id/incremental.js'
import { schema as configSchema } from './config.js'
import { list as vaultList } from './list.js'
import { find as vaultFind } from './find.js'
import { create as vaultCreate } from './create.js'
import { update as vaultUpdate } from './update.js'
import { destroy as vaultDestroy } from './destroy.js'
import { lock as vaultLock } from './lock.js'
import { unlock as vaultUnlock } from './unlock.js'
import { init as vaultInit } from './init.js'
import { auth as vaultAuth } from './auth.js'

export const provider = defineProvider((payload, { root, fs }) => {
    const config = validate(configSchema(root), payload)
    const filesystem = createFilesystem({ fs })
    const resolve = (...args: string[]) => filesystem.path.resolve(config.path, ...args)

    // parser
    const parser = parsers.find((p) => p.name === config.format)

    if (!parser) {
        throw new Error(`Parser for format "${config.format}" not found`)
    }

    // id maker
    const maker = createIdMaker({
        strategies: [createIncrementalStategyFromFile(drive, resolve('.db', 'last_id.json'))],
    })

    const makeId = () => maker(config.id_strategy)

    // methods

    async function init(payload: any) {
        return vaultInit({
            filesystem,
            root: config.path,
            options: payload,
        })
    }

    async function auth(payload: any) {
        return vaultAuth({
            filesystem,
            root: config.path,
            options: payload,
        })
    }

    async function lock(payload: any) {
        const id = validate((v) => v.string('id is required'), payload.id)

        return vaultLock({
            id,
            root: config.path,
            filesystem,
        })
    }

    function unlock(payload: any) {
        const id = validate((v) => v.string('id is required'), payload.id)

        return vaultUnlock({
            id,
            root: config.path,
            filesystem,
        })
    }

    const list: DataProvider['list'] = async (options) => {
        return vaultList({
            filesystem,
            root: config.path,
            parser,
            options: options,
        })
    }

    const find: DataProvider['find'] = async (options) => {
        return vaultFind({
            filesystem,
            root: config.path,
            parser,
            options: options,
        })
    }

    const create: DataProvider['create'] = async (options) => {
        return vaultCreate({
            filesystem,
            root: config.path,
            parser,
            options,
            makeId,
        })
    }

    const update: DataProvider['update'] = async (payload) => {
        return vaultUpdate({
            filesystem,
            root: config.path,
            parser,
            options: payload,
        })
    }

    const destroy: DataProvider['destroy'] = async (payload) => {
        return vaultDestroy({
            filesystem,
            parser,
            root: config.path,
            options: payload,
        })
    }

    return {
        lock,
        unlock,
        list,
        find,
        create,
        update,
        destroy,
        auth,
        init,
    }
})
