import { resolve } from 'path'
import { Drive } from '@/core/drive/types.js'
import { defineProvider } from '@/core/provider/defineProvider.js'
import * as YAML from '@/utils/yaml.js'
import { DataProvider } from '@/core/provider/types.js'
import { queryArray } from '@/core/provider/queryArray.js'

import omit from 'lodash-es/omit.js'
import pick from 'lodash-es/pick.js'

interface Config {
    path: string
}

export function createMarkdownProvider(drive: Drive) {
    return defineProvider((config: Config) => {
        const { path } = config

        const list: DataProvider['list'] = async (options) => {
            const where = options?.where || {}
            const exclude = options?.exclude || ['_raw', '_filename', '_body']
            const include = options?.include || []
            const limit = options?.pagination?.limit
            const page = options?.pagination?.page || 1

            const files = await drive.list(path)
            const result = [] as any[]

            for (const file of files) {
                const filename = resolve(path, file)
                const content = await drive.read(filename)

                const raw = content
                let body = content
                const properies: any = {
                    id: file.replace(/\.md$/, ''),
                }

                if (content.startsWith('---')) {
                    const [, frontmatter, rest] = content.split('---')

                    Object.assign(properies, YAML.parse(frontmatter))

                    body = rest.trim()
                }

                properies['_raw'] = raw
                properies['_filename'] = filename
                properies['_body'] = body || ''

                result.push(properies)
            }

            let items = queryArray(result, where)

            if (include.length) {
                items = items.map((item) => pick(item, include))
            }

            if (exclude.length && !include.length) {
                items = items.map((item) => omit(item, exclude))
            }

            if (limit) {
                const start = (page - 1) * limit
                const end = start + limit

                items = items.slice(start, end)
            }

            const response = {
                meta: {
                    total: result.length,
                    limit,
                    total_pages: limit ? Math.ceil(result.length / limit) : 1,
                },
                data: items,
            }

            return response
        }

        const create: DataProvider['create'] = async (data) => {
            const body = data.body || ''
            const properies = omit(data, 'body')
            const filename = resolve(path, `${data.id}.md`)

            const frontmatter = YAML.stringify(properies)

            const content = `---\n${frontmatter}---\n${body}`

            await drive.write(filename, content)

            return data
        }

        const update: DataProvider['update'] = async (data, where) => {
            const { data: items } = await list({ where })

            for (const item of items) {
                const filename = resolve(path, `${item.id}.md`)
                const newData = { ...item, ...data }
                const body = newData.body || item.body

                const content = `---\n${YAML.stringify(newData)}---\n${body}`

                await drive.write(filename, content)
            }

            return { count: items.length }
        }

        const destroy: DataProvider['destroy'] = async (where) => {
            const { data: items } = await list({ where, include: ['_filename'] })

            for (const item of items) {
                await drive.destroy(item._filename)
            }

            return { count: items.length }
        }

        return {
            list,
            create,
            update,
            destroy,
        }
    })
}
