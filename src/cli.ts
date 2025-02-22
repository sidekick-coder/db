#! /usr/bin/env node
import minimist from 'minimist'
import { dirname, resolve } from 'path'
import { resolve as resolveConfig } from '@/core/config/resolve.js'
import { confirm } from '@inquirer/prompts'

import { vWithExtras as v, validate } from '@/core/validator/index.js'
import { merge, omit } from 'lodash-es'
import { createRenderer } from './core/render/createRenderer.js'
import consoleRender from './renders/console.js'
import { createDatabase } from './core/database/index.js'

async function run() {
    const { _: allArgs, ...flags } = minimist(process.argv.slice(2), {
        string: ['file', 'where', 'view', 'data', 'database', 'render'],
        alias: {
            file: 'f',
            where: 'w',
            view: 'v',
            data: 'd',
            database: 'db',
            render: 'r',
            render_options: 'ro',
        },
    })

    const [name] = allArgs

    const filename = resolve(process.cwd(), flags.file || 'db.config.yml')

    const config = resolveConfig(filename)

    const dbName = flags.database || config.databases.default

    const source = config.databases.sources.find((s) => s.data.name === dbName)

    if (!source) {
        console.error(`Database "${dbName}" not found`)
        return
    }

    let folder = dirname(filename)
    const databaseDefinition = source.data

    if ('dirname' in source) {
        folder = source.dirname
    }

    const database = createDatabase(databaseDefinition, {
        root: folder,
    })

    const options: any = validate(
        (v) =>
            v.objectWithRest(
                {
                    view: v.optional(v.string(), databaseDefinition.view?.default),
                    render: v.optional(v.string()),
                    data: v.optional(v.extras.vars),
                    where: v.optional(v.extras.vars),
                    render_options: v.optional(v.extras.vars, {}),
                },
                v.any()
            ),
        flags
    )

    // view
    if (options.view) {
        // try to find view in list
        const view = databaseDefinition?.view?.sources?.find((v) => v.name === options.view)

        merge(options, omit(view, 'name'))
    }

    const renderName = options.render || 'console'

    const render = createRenderer({
        renders: [consoleRender],
    })

    if (name == 'list') {
        const response = await database.list(options)

        return render(renderName, {
            method: 'list',
            output: response,
            options: options['render_options'],
            config: config,
        })
    }

    if (name == 'find') {
        const response = await database.find(options)

        return render(renderName, {
            method: 'find',
            output: response,
            options: options['render_options'],
            config,
        })
    }

    if (name == 'create') {
        const response = await database.create(options)

        return render(renderName, {
            method: 'create',
            output: response,
            options: options['render_options'],
            config,
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

        const response = await database.update(options)

        return render(renderName, {
            method: 'update',
            output: response,
            options: options['render_options'],
            config,
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

        const response = await database.destroy(options)

        return render(renderName, {
            method: 'destroy',
            output: response,
            options: options['render_options'],
            config,
        })
    }

    if (name === 'method') {
        if (!options.name) {
            console.error('Method name not provided')
            return
        }

        const args = v.parse(v.array(v.extras.vars), options.args || [])

        const response = await database.method(options.name, args)

        return render(renderName, {
            method: 'method',
            output: response,
            options: options['render_options'],
            config,
        })
    }

    const method = database.method(name)

    if (method) {
        const response = await method(options)

        return render(renderName, {
            method: 'method',
            output: response,
            options: options['render_options'],
            config,
        })
    }

    console.error('Command not found')
}

if (process.argv.includes('--debug')) {
    console.time('cli')
}

run().finally(() => {
    if (process.argv.includes('--debug')) {
        console.timeEnd('cli')
    }
})
