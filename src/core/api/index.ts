import { vWithExtras as v } from '../validator/index.js'
import { DbConfig, dbConfigSchema } from './schemas.js'
import { list as baseList, type ListOptions } from './list.js'
import { find as baseFind, FindOptions } from './find.js'
import { create as baseCreate, type CreateOptions } from './create.js'
import { update as baseUpdate, type UpdateOptions } from './update.js'
import { destroy as baseDestroy, type DestroyOptions } from './destroy.js'

export function createDb(config: DbConfig) {
    const providerList = new Map(Object.entries(config.providers))
    const dbConfig = v.parse(dbConfigSchema, config)
    const defaultDatabase = dbConfig.databases.find((db) => db.name === dbConfig.default_database)

    const current = {
        name: defaultDatabase?.name,
        provider: defaultDatabase?.provider,
        config: defaultDatabase?.config,
    }

    function addProvider(name: string, provider: any) {
        providerList.set(name, provider)
    }

    function select(name: string) {
        const db = dbConfig.databases.find((db) => db.name === name)

        if (!db) {
            throw new Error(`Database "${name}" not found`)
        }

        current.name = db.name
        current.provider = db.provider
        current.config = db.config
    }

    function baseOptions(payload: any) {
        return {
            name: current.name,
            provider: current.provider,
            config: current.config,
            providerList,
            dbConfig,
            ...payload,
        }
    }

    function list(payload?: Omit<ListOptions, 'dbConfig'>) {
        const options = baseOptions(payload)

        return baseList(options)
    }

    function find(payload: Omit<FindOptions, 'dbConfig'>) {
        const options = baseOptions(payload)

        return baseFind(options)
    }

    function create(payload: Omit<CreateOptions, 'dbConfig'>) {
        const options = baseOptions(payload)

        return baseCreate(options)
    }

    function update(payload: Omit<UpdateOptions, 'dbConfig'>) {
        const options = baseOptions(payload)

        return baseUpdate(options)
    }

    function destroy(payload: Omit<DestroyOptions, 'dbConfig'>) {
        const options = baseOptions(payload)

        return baseDestroy(options)
    }

    return {
        addProvider,
        select,

        list,
        find,
        create,
        update,
        destroy,
    }
}
