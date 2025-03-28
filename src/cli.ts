import fs from 'fs'
import minimist from 'minimist'
import { dirname, resolve } from 'path'
import { resolve as resolveConfig } from '@/core/config/resolve.js'
import { confirm } from '@inquirer/prompts'

import { vWithExtras as v, validate } from '@/core/validator/index.js'
import { camelCase, merge, omit, snakeCase } from 'lodash-es'
import { createRenderer } from './core/render/createRenderer.js'
import { consoleRender } from './renders/index.js'
import { createDatabase } from './core/database/index.js'
import { parseOptions } from './utils/parseOptions.js'

async function run() {
    const { _: allArgs, ...flags } = minimist(process.argv.slice(2), {
        string: ['file', 'where', 'view', 'data', 'database', 'render', 'id'],
        alias: {
            file: 'f',
            where: 'w',
            view: 'v',
            data: 'd',
            database: 'db',
            render: 'r',
            render_options: 'ro',
            sortBy: ['sort-by'],
            sortDesc: ['sort-desc'],
        },
    })

    const [name] = allArgs

    const filename = resolve(process.cwd(), flags.file || 'db.config.yml')

    if (!fs.existsSync(filename)) {
        throw new Error('Config file not found')
    }

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

    const options = parseOptions(process.argv.slice(2), {
        databaseDefinition,
    })

    const renderName = options.render || 'console'

    const render = createRenderer({
        renders: [consoleRender],
    })

    if (name === 'show-options') {
        return console.log(JSON.stringify(options, null, 2))
    }

    if (name === 'show-definition') {
        return console.log(JSON.stringify(databaseDefinition, null, 2))
    }

    if (name === 'list-databases') {
        return console.log(config.databases.sources.map((s) => s.data.name))
    }

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

    const method =
        database.provider[name] ||
        database.provider[snakeCase(name)] ||
        database.provider[camelCase(name)]

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
