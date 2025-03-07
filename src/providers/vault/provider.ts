import { defineProvider } from '@/core/provider/defineProvider.js'
import { validate } from '@/core/validator/index.js'
import { DataProvider } from '@/core/provider/index.js'
import { createFilesystem } from '@/core/filesystem/createFilesystem.js'
import { parsers } from '@/core/parsers/all.js'
import { schema as configSchema } from './config.js'
import { list as vaultList } from './list.js'
import { find as vaultFind } from './find.js'
import { create as vaultCreate } from './create.js'
import { update as vaultUpdate } from './update.js'
import { destroy as vaultDestroy } from './destroy.js'
import { lock as vaultLock } from './lock.js'
import { lockItem as vaultLockItem } from './lockItem.js'
import { unlock as vaultUnlock } from './unlock.js'
import { unlockItem as vaultUnlockItem } from './unlockItem.js'
import { init as vaultInit } from './init.js'
import { auth as vaultAuth } from './auth.js'
import { createStrategies } from '@/core/idStrategy/createStrategies.js'

export const provider = defineProvider((payload, { root, fs, path }) => {
    const config = validate(configSchema(root, path), payload)
    const filesystem = createFilesystem({ fs, path })

    const { format, id_strategy } = config

    const strategies = createStrategies({ filesystem, root: config.path })

    const parser = parsers.find((p) => p.name === format)
    const strategy = strategies.find((s) => s.name === id_strategy.name)

    if (!parser) {
        throw new Error(`Parser for format "${format}" not found`)
    }

    if (!strategy) {
        throw new Error(`Strategy for id "${id_strategy}" not found`)
    }

    const makeId = () => strategy.create(id_strategy.options)

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

    function lock(payload: any) {
        return vaultLock({
            root: config.path,
            filesystem,
            parser,
            options: payload,
        })
    }

    function lockItem(payload: any) {
        return vaultLockItem({
            root: config.path,
            filesystem,
            options: payload,
        })
    }

    function unlock(payload: any) {
        return vaultUnlock({
            parser,
            root: config.path,
            filesystem,
            options: payload,
        })
    }

    function unlockItem(payload: any) {
        return vaultUnlockItem({
            root: config.path,
            filesystem,
            options: payload,
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
        lockItem,
        unlock,
        unlockItem,
        list,
        find,
        create,
        update,
        destroy,
        auth,
        init,
    }
})
