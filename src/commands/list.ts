import { command } from '@/core/command/index.js'
import { drive } from '@/core/drive/index.js'
import * as markdown from '@/core/markdown/index.js'
import { DataProvider, MountDataProvider } from '@/core/provider/types.js'
import qs from 'qs'
import * as YAML from '@/utils/yaml.js'
import { table } from 'table'

command('list')
    .flags({
        provider: {
            name: 'provider',
            schema: (v) => v.string(),
        },
        config: {
            name: 'config',
            schema: (v) =>
                v.pipe(
                    v.string(),
                    v.transform((value) => qs.parse(value) as Record<string, any>),
                    v.record(v.string(), v.any())
                ),
        },
        format: {
            name: 'format',
            schema: (v) => v.optional(v.picklist(['default', 'json', 'yaml'])),
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

        const items = await provider.list()

        if (flags.format == 'json') {
            console.log(JSON.stringify(items))
            return
        }

        if (flags.format == 'yaml') {
            console.log(YAML.stringify(items))
            return
        }

        items.forEach((item) => {
            const data = Object.entries(item)

            console.log(table(data))
        })
    })
