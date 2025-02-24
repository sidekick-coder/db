import { createDatabase } from './createDatabase.js'
import { Config } from '../config/resolve.js'

export function createDatabaseFromConfig(config: Config, name: string) {
    const source = config.databases.sources.find((s) => s.data.name === name)

    if (!source) {
        throw new Error(`Database ${name} not found`)
    }

    const defintion = source.data

    return createDatabase(defintion, { root: source.dirname || config.dirname })
}
