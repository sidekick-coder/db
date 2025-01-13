import { command } from '@/core/command/builder.js'
import { listCommands } from '@/core/command/register.js'

command('help').handle(async (ctx) => {
    const all = await listCommands()

    console.log(all)
})
