import { command } from '@/core/command/index.js'
import { drive } from '@/core/drive/index.js'
import * as markdown from '@/core/markdown/index.js'
import { MountDataProvider } from '@/core/provider/types.js'
import * as YAML from '@/utils/yaml.js'
import { table } from 'table'

command('create')
    .flags({
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

        const item = await provider.create(flags.data)

        console.log(table(Object.entries(item)))
    })
