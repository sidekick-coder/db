import { readConfig } from '@/utils/filesystem.js'
import { DbConfig } from '../api/schemas.js'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import { createRequire } from 'module'
import { parseFile } from '@/utils/vars.js'
import { merge } from 'lodash-es'

const require = createRequire(import.meta.url)

interface Options {
    files: string[]
    default_database?: string
    databases?: DbConfig['databases']
    providers?: DbConfig['providers']
    renders?: DbConfig['renders']
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
        renders: options.renders || [],
    }

    for await (const file of options.files) {
        const content = await readConfig(file)

        if (!content) continue

        if (content.default_database) {
            result.default_database = content.default_database
        }

        for (const p of content?.providers || []) {
            if (/\.(js|ts)$/.test(p.provider)) {
                result.providers.push({
                    name: p.name,
                    provider: createModuleProxy(p.provider),
                })
            }
        }

        for (const db of content?.databases || []) {
            result.databases.push(db)

            if (/\.(js|ts)$/.test(db.provider)) {
                result.providers.push({
                    name: db.provider,
                    provider: createModuleProxy(db.provider),
                })
            }

            if (db.views) {
                let views = db.views
                    .map((v: any) => (typeof v === 'object' ? v : parseFile(v)))
                    .flat()

                views = views.map((v: any) => {
                    if (v.extend) {
                        const view = views.find((x: any) => x.name === v.extend)

                        return merge({}, view, v)
                    }

                    return v
                })

                db.views = views
            }
        }

        for (const r of content?.renders || []) {
            if (/\.(js|ts)$/.test(r.render)) {
                result.renders.push({
                    name: r.name,
                    provider: createModuleProxy(r.render),
                })
            }
        }
    }

    return result
}
