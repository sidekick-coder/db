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
import { createYamlProvider } from './providers/file/yaml.js'
import { createNotionProvider } from './providers/notion/index.js'

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

    const homeConfig = readConfig([resolve(process.env.HOME!, '.config', 'db', 'config.yml')]) || {}
    const localConfig = readConfig(files) || {}

    const raw = merge({}, homeConfig, localConfig)

    const db = createDb({
        ...raw,
        databases: raw.databases || [],
        providers: {
            markdown: createMarkdownProvider(drive),
            folder: createFolderProvider(drive),
            json: createJsonProvider(drive),
            yaml: createYamlProvider({ drive, ext: 'yaml' }),
            yml: createYamlProvider({ drive, ext: 'yml' }),
            notion: createNotionProvider(),
        },
    })

    const options = { ...flags } as any

    if (flags['w']) {
        options.where = flags['w']
    }

    if (flags['v']) {
        options.view = flags['v']
    }

    if (flags['d']) {
        options.database = flags['d']
    }

    // handle vars flags
    const varsFlags = ['config', 'where', 'data', 'pagination', 'sort', 'view']

    for (const key of varsFlags) {
        if (options[key]) {
            options[key] = v.parse(v.extras.vars, options[key])
        }
    }

    if (options.view) {
        options.where = options.where || options.view.where
        options.sort = options.sort || options.view.sort
        options.pagination = options.pagination || options.view.pagination
        options.include = options.include || options.view.include
        options.exclude = options.exclude || options.view.exclude
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
    if (options.database) {
        db.select(options.database)
    }

    if (name == 'list') {
        const response = await db.list(options)

        if (['json', 'yaml'].includes(options.format)) {
            return print(response, {
                format: options.format,
            })
        }

        print(response.meta)

        print(response.data, {
            format: options.format,
            vertical: !!options['print-vertical'],
        })
    }

    if (name == 'find') {
        const response = await db.find(options)

        print(response, {
            format: options.format,
            vertical: !!options['print-vertical'],
        })
    }

    if (name == 'create') {
        const response = await db.create(options)

        print(response, options.format)
    }

    if (name == 'update') {
        if (!options.where) {
            const confirmation = await confirm({
                message: `You are not providing a where clause. Are you sure you want to update all items?`,
            })

            if (!confirmation) {
                return
            }
        }

        const response = await db.update(options)

        print(response, options.format)
    }

    if (['destroy', 'delete'].includes(name)) {
        if (!options.where) {
            const confirmation = await confirm({
                message: `You are not providing a where clause. Are you sure you want to delete all items?`,
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
