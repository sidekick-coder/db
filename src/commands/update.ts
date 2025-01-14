import { command } from '@/core/command/index.js'
import { drive } from '@/core/drive/index.js'
import * as markdown from '@/core/markdown/index.js'
import { MountDataProvider } from '@/core/provider/types.js'
import { table } from 'table'
import { confirm } from '@inquirer/prompts'

command('update')
    .options({
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
        data: {
            name: 'data',
            schema: (v) => v.extras.vars,
        },
    })
    .handle(async ({ options }) => {
        const providers: Record<string, MountDataProvider> = {
            markdown: markdown.provider,
        }

        const mount = providers[options.provider]

        if (!mount) {
            console.error(`Provider "${options.provider}" not found`)
            return
        }

        const provider = mount({
            ...options.config,
            drive,
        })

        const items = await provider.list({ where: options.where })

        const confirmation = await confirm({
            message: `This will update ${items.length} items. Are you sure?`,
        })

        if (!confirmation) {
            return
        }

        const item = await provider.update(options.data, flags.where)

        console.log(table(Object.entries(item)))
    })
