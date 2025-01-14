import { command } from '@/core/command/index.js'
import { drive } from '@/core/drive/index.js'
import * as markdown from '@/core/markdown/index.js'
import { MountDataProvider } from '@/core/provider/types.js'
import * as YAML from '@/utils/yaml.js'
import { cliui } from '@poppinss/cliui'

command('list')
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
        pagination: {
            name: 'pagination',
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
        const pagination = options.pagination

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

        const response = await provider.list({
            where: where,
            include: include,
            exclude: exclude,
            pagination: pagination,
        })

        if (format == 'json') {
            console.log(JSON.stringify(response))
            return
        }

        if (format == 'yaml') {
            console.log(YAML.stringify(response))
            return
        }

        const { meta, data: items } = response
        const ui = cliui()

        const metaTable = ui.table()

        metaTable.head([
            {
                content: ui.colors.cyan('Meta'),
                colSpan: 2,
            },
        ])

        Object.entries(meta).forEach(([key, value]) => metaTable.row([String(key), String(value)]))

        metaTable.render()

        const header = [] as string[]
        const rows = [] as string[][]

        items.forEach((item) => {
            Object.keys(item).forEach((key) => {
                if (!header.includes(key)) {
                    header.push(key)
                }
            })

            const row = [] as string[]

            header.forEach((key) => {
                row.push(String(item[key] || ''))
            })

            rows.push(row)
        })

        const table = ui.table()

        table.head(header)

        rows.forEach((row) => table.row(row))

        table.render()
    })
