import { listCommands } from '@/core/command/index.js'
import minimist from 'minimist'

async function run() {
    const commands = await listCommands()

    const {
        _: [commandName, ...args],
        ...flags
    } = minimist(process.argv.slice(2))

    const command = commands.find((c) => commandName == c.name)

    if (!command) {
        console.error(`Command "${commandName}" not found`)
        process.exit(1)
    }

    await command.run({ args, flags })
}

run()
