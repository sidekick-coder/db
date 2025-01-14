import { command } from '@/core/command/index.js'
import { drive } from '@/core/drive/index.js'
import * as markdown from '@/core/markdown/index.js'
import { MountDataProvider } from '@/core/provider/types.js'
import * as YAML from '@/utils/yaml.js'
import { table } from 'table'

command('list')
    .options({
        provider: {
            name: 'provider',
            schema: (v) => v.string(),
        },
        config: {
            name: 'config',
            schema: (v) => v.record(v.string(), v.any()),
        },
        where: {
            name: 'where',
            schema: (v) => v.optional(v.extras.vars),
        },
        include: {
            name: 'include',
            schema: (v) =>
                v.optional(
                    v.pipe(
                        v.string(),
                        v.transform((v) => v.split(',')),
                        v.array(v.string())
                    )
                ),
        },
        exclude: {
            name: 'exclude',
            schema: (v) =>
                v.optional(
                    v.pipe(
                        v.string(),
                        v.transform((v) => v.split(',')),
                        v.array(v.string())
                    )
                ),
        },
        format: {
            name: 'format',
            schema: (v) => v.optional(v.picklist(['default', 'json', 'yaml'])),
        },
    })
    .handle(async ({ options }) => {
        const providerName = options.provider
        const config = options.config

        const where = options.where || {}
        const include = options.include
        const exclude = options.exclude

        const format = options.format

        const providers: Record<string, MountDataProvider> = {
            markdown: markdown.provider,
        }

        const mount = providers[providerName]

        if (!mount) {
            console.error(`Provider "${providerName}" not found`)
            return
        }

        const provider = mount({
            ...config,
            drive,
        })

        const items = await provider.list({
            where: where,
            include: include,
            exclude: exclude,
        })

        if (format == 'json') {
            console.log(JSON.stringify(items))
            return
        }

        if (format == 'yaml') {
            console.log(YAML.stringify(items))
            return
        }

        items.forEach((item) => {
            const data = Object.entries(item)

            console.log(table(data))
        })
    })
