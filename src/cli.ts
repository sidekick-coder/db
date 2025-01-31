#! /usr/bin/env node
import minimist from 'minimist'
import { resolve } from 'path'
import { createInstance } from '@/core/api/index.js'
import { print } from './utils/print.js'
import { confirm } from '@inquirer/prompts'

import { vWithExtras as v, validate } from '@/core/validator/index.js'
import { all } from './providers/index.js'
import { resolveConfig } from './core/config/resolveConfig.js'
import { merge, mergeWith } from 'lodash-es'
import { createRenderer } from './core/render/createRenderer.js'
import consoleRender from './renders/console.js'

async function run() {
    const { _: allArgs, ...flags } = minimist(process.argv.slice(2))

    const [name] = allArgs

    const files = [
        resolve(process.cwd(), 'db.config.yml'),
        resolve(process.cwd(), 'db.config.yaml'),
        resolve(process.cwd(), 'db.config.json'),
    ]

    if (process.env.HOME) {
        files.unshift(resolve(process.env.HOME, '.config', 'db', 'config.yml'))
    }

    if (flags['db-config']) {
        files.unshift(resolve(process.cwd(), flags['db-config']))
    }

    const config = await resolveConfig({
        files,
        providers: all,
        renders: [consoleRender],
    })

    const instance = createInstance({
        databases: config.databases,
        providers: config.providers,
        renders: config.renders,
    })

    const options = { ...flags } as any

    // aliases
    if (flags['w']) {
        options.where = flags['w']
    }

    if (flags['v']) {
        options.view = flags['v']
    }

    if (flags['d']) {
        options.data = flags['d']
    }

    if (flags['db']) {
        options.database = flags['db']
    }

    // handle vars flags
    const varsFlags = ['config', 'where', 'data', 'pagination', 'sort', 'render-options']

    for (const key of varsFlags) {
        options[key] = validate((v) => v.extras.vars, flags[key] || {})
    }

    // where shortcuts

    if (!options.where.and) {
        options.where.and = []
    }

    if (flags['where-in']) {
        const [field, value] = flags['where-in'].split('=')

        options.where.and.push({
            field,
            operator: 'in',
            value: value.split(','),
        })
    }

    const dbName = options.database || config.default_database

    const db = instance.use(dbName)
    const databaseDefinition = config.databases.find((db) => db.name === dbName)
    const renderName = options.render || 'console'
    const render = createRenderer({
        renders: config.renders,
    })

    // view
    if (!options.view && databaseDefinition.default_view) {
        options.view = databaseDefinition.default_view
    }

    if (options.view) {
        // try to find view in list
        const view = databaseDefinition?.views?.find((v) => v.name === options.view)

        // if not found, try to parse file
        if (!view) {
            //view = parseFile(options.view)
        }

        options.view = view
    }

    if (options.view) {
        options.where = merge(options.where, options.view.where)
        options.sort = options.sort || options.view.sort
        options.pagination = options.pagination || options.view.pagination
        options.include = options.include || options.view.include
        options.exclude = options.exclude || options.view.exclude
        options.render = options.render || options.view.render
        options['render-options'] = merge(options['render-options'], options.view['render_options'])
    }

    if (name == 'list') {
        const response = await db.list(options)

        return render(renderName, {
            method: 'list',
            output: response,
            options: options['render-options'],
        })
    }

    if (name == 'find') {
        const response = await db.find(options)

        return render(renderName, {
            method: 'find',
            output: response,
            options: options['render-options'],
        })
    }

    if (name == 'create') {
        const response = await db.create(options)

        return render(renderName, {
            method: 'create',
            output: response,
            options: options['render-options'],
        })
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

        return render(renderName, {
            method: 'update',
            output: response,
            options: options['render-options'],
        })
    }

    if (name === 'method') {
        if (!options.name) {
            console.error('Method name not provided')
            return
        }

        const args = v.parse(v.array(v.extras.vars), options.args || [])

        const response = await db.method(options.name, args)

        return render(renderName, {
            method: 'method',
            output: response,
            options: options['render-options'],
        })
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

        return render(renderName, {
            method: 'destroy',
            output: response,
            options: options['render-options'],
        })
    }

    console.error('Command not found')
}

run()
