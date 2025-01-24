import { readConfig } from '@/utils/filesystem.js'
import { DbConfig } from '../api/schemas.js'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

interface Options {
    files: string[]
    default_database?: string
    databases?: DbConfig['databases']
    providers?: DbConfig['providers']
}

export async function resolveConfig(options: Options) {
    const result: any = {
        default_database: options.default_database,
        databases: options.databases || [],
        providers: options.providers || [],
    }

    for await (const file of options.files) {
        const content = await readConfig(file)

        if (!content) continue

        if (content.default_database) {
            result.default_database = content.default_database
        }

        for await (const p of content?.providers || []) {
            if (p.provider.endsWith('.js')) {
                const url = pathToFileURL(resolve(p.provider))

                const pModule = await import(url.href)

                result.providers.push({
                    name: p.name,
                    provider: pModule.default,
                })
            }
        }

        for await (const db of content?.databases || []) {
            result.databases.push(db)

            if (db.provider.endsWith('.js')) {
                const url = pathToFileURL(resolve(db.provider))

                const pModule = await import(url.href)

                result.providers.push({
                    name: db.provider,
                    provider: pModule.default,
                })
            }
        }
    }

    return result
}
