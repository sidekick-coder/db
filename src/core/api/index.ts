import { vWithExtras as v } from '../validator/index.js'
import { DbConfig, dbConfigSchema } from './schemas.js'
import { list as baseList, type ListOptions } from './list.js'
import { create as baseCreate, type CreateOptions } from './create.js'
import { update as baseUpdate, type UpdateOptions } from './update.js'
import { destroy as baseDestroy, type DestroyOptions } from './destroy.js'

export function createDb(config: DbConfig) {
    const dbConfig = v.parse(dbConfigSchema, config)
    const defaultDatabase = dbConfig.databases.find((db) => db.name === dbConfig.default_database)

    function list(payload?: Omit<ListOptions, 'dbConfig'>) {
        const options = { ...payload } as any

        if (!options.provider && defaultDatabase) {
            options.provider = defaultDatabase.provider
            options.config = defaultDatabase.config
        }

        return baseList({
            ...options,
            dbConfig,
        })
    }

    function create(payload: Omit<CreateOptions, 'dbConfig'>) {
        const options = { ...payload } as any

        if (!options.provider && defaultDatabase) {
            options.provider = defaultDatabase.provider
            options.config = defaultDatabase.config
        }

        return baseCreate({
            ...options,
            dbConfig,
        })
    }

    function update(payload: Omit<UpdateOptions, 'dbConfig'>) {
        const options = { ...payload } as any

        if (!options.provider && defaultDatabase) {
            options.provider = defaultDatabase.provider
            options.config = defaultDatabase.config
        }

        return baseUpdate({
            ...options,
            dbConfig,
        })
    }

    function destroy(payload: Omit<DestroyOptions, 'dbConfig'>) {
        const options = { ...payload } as any

        if (!options.provider && defaultDatabase) {
            options.provider = defaultDatabase.provider
            options.config = defaultDatabase.config
        }

        return baseDestroy({
            ...options,
            dbConfig,
        })
    }

    return {
        list,
        create,
        update,
        destroy,
    }
}
