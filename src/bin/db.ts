import { listCommands } from '@/core/command/index.js'
import { readFile } from '@/utils/filesystem.js'
import * as YAML from '@/utils/yaml.js'
import minimist from 'minimist'

async function run() {
    const commands = await listCommands()

    const { _: allArgs, ...flags } = minimist(process.argv.slice(2))

    const [name, ...args] = allArgs

    // const filename = flags['config'] || flags['c']
    //
    // if (!filename) {
    //     console.error('Please provide a config file')
    //     process.exit(1)
    // }
    //
    // const contents = await readFile(filename)
    //
    // const config = YAML.parse(contents)

    const command = commands.find((c) => name == c.name)

    if (!command) {
        console.error(`Command "${name}" not found`)
        process.exit(1)
    }

    await command.run({ args, flags })
}

run()
