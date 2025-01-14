import { command } from '@/core/command/index.js'
import { drive } from '@/core/drive/index.js'
import * as markdown from '@/core/markdown/index.js'
import { MountDataProvider } from '@/core/provider/types.js'
import { table } from 'table'
import { confirm } from '@inquirer/prompts'

command('destroy')
    .flags({
        provider: {
            name: 'provider',
            schema: (v) => v.string(),
        },
        config: {
            name: 'config',
            schema: (v) => v.extras.vars,
        },
        where: {
            name: 'where',
            schema: (v) => v.optional(v.extras.vars),
        },
    })
    .handle(async ({ flags }) => {
        const providers: Record<string, MountDataProvider> = {
            markdown: markdown.provider,
        }

        const mount = providers[flags.provider]

        if (!mount) {
            console.error(`Provider "${flags.provider}" not found`)
            return
        }

        const provider = mount({
            ...flags.config,
            drive,
        })

        const items = await provider.list({ where: flags.where })

        const confirmation = await confirm({
            message: `This will delete ${items.length} items. Are you sure?`,
        })

        if (!confirmation) {
            return
        }

        const item = await provider.destroy(flags.where)

        console.log(table(Object.entries(item)))
    })
