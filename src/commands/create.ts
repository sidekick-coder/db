import { command } from '@/core/command/index.js'
import { drive } from '@/core/drive/index.js'
import * as markdown from '@/core/markdown/index.js'
import { MountDataProvider } from '@/core/provider/types.js'

command('create')
    .options({
        provider: {
            name: 'provider',
            schema: (v) => v.string(),
        },
        config: {
            name: 'config',
            schema: (v) => v.extras.vars,
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

        const item = await provider.create(options.data)

        console.log(table(Object.entries(item)))
    })
