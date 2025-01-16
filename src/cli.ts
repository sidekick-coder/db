#! /usr/bin/env node
import { readConfig } from '@/utils/filesystem.js'
import minimist from 'minimist'
import { resolve } from 'path'
import { createDb } from '@/core/api/index.js'
import { drive } from './core/drive/index.js'
import { print } from './utils/print.js'
import { confirm } from '@inquirer/prompts'

import { vWithExtras as v } from '@/core/validator/index.js'
import { merge } from 'lodash-es'
import { createFolderProvider } from './providers/folder/index.js'
import { createJsonProvider, createMarkdownProvider } from './providers/file/index.js'

async function run() {
    const { _: allArgs, ...flags } = minimist(process.argv.slice(2))

    const [name] = allArgs

    const files = [
        resolve(process.cwd(), 'db.config.yml'),
        resolve(process.cwd(), 'db.config.yaml'),
        resolve(process.cwd(), 'db.config.json'),
    ]

    if (flags['db-config']) {
        files.unshift(resolve(process.cwd(), flags['db-config']))
    }

    const homeConfig = readConfig([resolve(process.env.HOME!, '.config', 'db', 'config.yml')])
    const localConfig = readConfig(files) || {}

    const raw = merge({}, homeConfig, localConfig)

    const providers = {
        markdown: createMarkdownProvider(drive),
    }

    if (homeConfig.providers) {
        for (const p of homeConfig.providers) {
            const mount = await import(resolve(process.cwd(), p.path))

            providers[p.name] = mount.default
        }
    }

    const db = createDb({
        ...raw,
        databases: raw.databases || [],
        providers: {
            markdown: createMarkdownProvider(drive),
            folder: createFolderProvider(drive),
            json: createJsonProvider(drive),
        },
    })

    const options = { ...flags } as any

    // handle vars flags
    const varsFlags = ['config', 'where', 'data', 'pagination', 'sort', 'field']

    for (const key of varsFlags) {
        if (options[key]) {
            options[key] = v.parse(v.extras.vars, options[key])
        }
    }

    // handle provider paths
    const isProviderPath = (path?: string) => path?.startsWith('/') || path?.startsWith('.')
    const allProviders = [...(homeConfig?.providers || []), ...(localConfig?.providers || [])]

    for (const p of allProviders) {
        const mount = await import(resolve(process.cwd(), p.path))

        db.addProvider(p.name, mount.default)
    }

    if (isProviderPath(options.provider)) {
        const path = resolve(process.cwd(), options.provider)
        const mount = await import(path)

        db.addProvider(options.provider, mount.default)
    }

    for await (const item of raw?.databases || []) {
        if (isProviderPath(item.provider)) {
            const path = resolve(process.cwd(), item.provider)
            const mount = await import(path)

            db.addProvider(item.provider, mount.default)
        }
    }

    // handle selected database
    if (options.database || options.d) {
        db.select(options.database || options.d)
    }

    if (name == 'list') {
        const response = await db.list(options)

        if (['json', 'yaml'].includes(options.format)) {
            return print(response, options.format)
        }

        print(response.meta)
        print(response.data)
    }

    if (name == 'create') {
        const response = await db.create(options)

        print(response, options.format)
    }

    if (name == 'update') {
        const { data: items } = await db.list(options)

        if (items.length > 1) {
            const confirmation = await confirm({
                message: `This will update ${items.length} items. Are you sure?`,
            })

            if (!confirmation) {
                return
            }
        }

        const response = await db.update(options)

        print(response, options.format)
    }

    if (['destroy', 'delete'].includes(name)) {
        const { data: items } = await db.list(options)

        if (items.length > 1) {
            const confirmation = await confirm({
                message: `This will destroy ${items.length} items. Are you sure?`,
            })

            if (!confirmation) {
                return
            }
        }

        const response = await db.destroy(options)

        print(response, options.format)
    }
}

run()
