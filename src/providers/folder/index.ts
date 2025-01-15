import { resolve } from 'path'
import { Drive } from '@/core/drive/types.js'
import { defineProvider } from '@/core/provider/defineProvider.js'
import * as YAML from '@/utils/yaml.js'
import { DataProvider } from '@/core/provider/types.js'
import { queryArray } from '@/core/provider/queryArray.js'

import omit from 'lodash-es/omit.js'
import pick from 'lodash-es/pick.js'
import * as md from '@/providers/markdown/index.js'

interface Config {
    path: string
    format?: 'markdown' | 'json'
    exclude?: string[]
}

export function createFolderProvider(drive: Drive) {
    return defineProvider((config: Config) => {
        const { path } = config

        async function write(id: string, data: any) {
            const seiralized = omit(data, ['_folder', '_raw', '_filename'])
            const folder = resolve(path, id)

            if (!(await drive.exists(folder))) {
                await drive.mkdir(folder)
            }

            if (config.format === 'json') {
                const filename = resolve(path, id, 'index.json')

                const content = JSON.stringify(seiralized, null, 4)

                return drive.write(filename, content)
            }

            const filename = resolve(path, id, 'index.md')

            await md.writeItem({ drive, filename, data: seiralized })
        }

        async function read(id: string) {
            if (config.format === 'json') {
                const filename = resolve(path, id, 'index.json')

                const content = await drive.read(filename)

                return JSON.parse(content)
            }

            const filename = resolve(path, id, 'index.md')

            return md.readItem({ drive, filename })
        }

        const list: DataProvider['list'] = async (options) => {
            const where = options?.where || {}
            const exclude = options?.exclude || ['_raw', '_filename', '_folder', '_body']
            const include = options?.include || []
            const limit = options?.pagination?.limit
            const page = options?.pagination?.page || 1

            let files = await drive.list(path, { onlyDirs: true })

            if (config.exclude) {
                files = files.filter((file) => !config.exclude?.includes(file))
            }

            const result = [] as any[]

            for (const file of files) {
                const data = await read(file)

                data._folder = resolve(path, file)

                result.push(data)
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
            await write(data.id, data)

            return data
        }

        const update: DataProvider['update'] = async (data, where) => {
            const { data: items } = await list({ where })

            for (const item of items) {
                await write(item.id, { ...item, ...data })
            }

            return { count: items.length }
        }

        const destroy: DataProvider['destroy'] = async (where) => {
            const { data: items } = await list({ where, include: ['_folder'] })

            for (const item of items) {
                await drive.destroy(item._folder)
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
