#! /usr/bin/env node
import { readConfig } from '@/utils/filesystem.js'
import minimist from 'minimist'
import { resolve } from 'path'
import { createDb } from '@/core/api/index.js'
import { createMarkdownProvider } from './providers/markdown/index.js'
import { drive } from './core/drive/index.js'
import { print } from './utils/print.js'
import { confirm } from '@inquirer/prompts'

import { vWithExtras as v } from '@/core/validator/index.js'

async function run() {
    // const commands = await listCommands()

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

    const raw = readConfig(files) || {}

    const db = createDb({
        ...raw,
        databases: raw.databases || [],
        providers: {
            markdown: createMarkdownProvider(drive),
        },
    })

    const options = { ...flags } as any

    const varsFlags = ['config', 'where', 'data']

    for (const key of varsFlags) {
        if (options[key]) {
            options[key] = v.parse(v.extras.vars, options[key])
        }
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
