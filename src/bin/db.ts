import { listCommands } from '@/core/command/index.js'
import { parse } from '@/core/config/index.js'
import { readConfig } from '@/utils/filesystem.js'
import minimist from 'minimist'
import { resolve } from 'path'

async function run() {
    const commands = await listCommands()

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

    const raw = readConfig(files)

    const config = parse(raw)

    const db = config.databases.find((d) => {
        if (flags.database) return d.name == flags.database

        if (flags.d) return d.name == flags.d

        return d.name == config.default_database
    })

    if (!db) {
        console.error(`Database not found`)
        process.exit(1)
    }

    const options = {
        ...flags,
        provider: db.provider,
        config: db.config,
    }

    const command = commands.find((c) => name == c.name)

    if (!command) {
        console.error(`Command "${name}" not found`)
        process.exit(1)
    }

    await command.run(options)
}

run()
