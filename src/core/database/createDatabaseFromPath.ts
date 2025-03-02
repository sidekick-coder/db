import { createDatabase } from './createDatabase.js'
import { resolve } from '../config/resolve.js'

export function createDatabaseFromPath(path: string, databaseName?: string) {
    const config = resolve(path)

    const name = databaseName || config.databases.default

    const source = config.databases.sources.find((s) => s.data.name === name)

    if (!source) {
        throw new Error(`Database ${name} not found`)
    }

    const defintion = source.data

    return createDatabase(defintion, { root: source.dirname || config.dirname })
}
