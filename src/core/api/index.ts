import { vWithExtras as v } from '../validator/index.js'
import { DbConfig, dbConfigSchema } from './schemas.js'
import { createDatabase } from '../database/index.js'

export function createInstace(payload: DbConfig) {
    const config = v.parse(dbConfigSchema, payload)

    function addProvider(name: string, provider: any) {
        config.providers.push({
            name,
            provider,
        })
    }

    function use(name: string) {
        const db = config.databases.find((db) => db.name === name)

        if (!db) {
            throw new Error(`Database "${name}" not found`)
        }

        const provider = config.providers.find((p) => p.name === db.provider)

        if (!provider) {
            throw new Error(`Provider "${db.provider}" not found`)
        }

        return createDatabase({
            name: db.name,
            provider: provider.provider,
            config: db.config,
        })
    }

    return {
        addProvider,
        use,
    }
}
