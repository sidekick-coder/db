import { readConfig } from '@/utils/filesystem.js'
import { DbConfig } from '../api/schemas.js'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

interface Options {
    files: string[]
    default_database?: string
    databases?: DbConfig['databases']
    providers?: DbConfig['providers']
}

function createModuleProxy(filename: string) {
    let value: any

    const url = pathToFileURL(resolve(filename))

    return new Proxy(
        {},
        {
            get(_, key) {
                if (!value) {
                    value = require(url.href)
                }

                return value[key]
            },
        }
    )
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
            if (/\.(js|ts)$/.test(p.provider)) {
                result.providers.push({
                    name: p.name,
                    provider: createModuleProxy(p.provider),
                })
            }
        }

        for await (const db of content?.databases || []) {
            result.databases.push(db)

            if (/\.(js|ts)$/.test(db.provider)) {
                result.providers.push({
                    name: db.provider,
                    provider: createModuleProxy(db.provider),
                })
            }
        }
    }

    return result
}
