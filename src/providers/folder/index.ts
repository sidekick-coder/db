import { resolve } from 'path'
import { Drive } from '@/core/drive/types.js'
import { defineProvider } from '@/core/provider/defineProvider.js'
import { DataProvider } from '@/core/provider/types.js'
import { queryArray } from '@/core/provider/queryArray.js'

import omit from 'lodash-es/omit.js'
import pick from 'lodash-es/pick.js'
import { MD, YAML } from '@/core/parsers/index.js'
import { createIdMaker } from '@/core/id/index.js'
import { createIncrementalStategyFromFile } from '@/core/id/incremental.js'

interface Config {
    path: string
    format?: 'markdown' | 'json'
    exclude?: string[]
    id?: {
        strategy?: string
    }
}

interface Parser {
    ext: string
    parse: (data: string) => any
    stringify: (data: any) => string
}

const parsers: Record<string, Parser> = {
    json: {
        ext: 'json',
        parse: JSON.parse,
        stringify: (contents) => JSON.stringify(contents, null, 4),
    },
    markdown: {
        ext: 'md',
        parse: MD.parse,
        stringify: (contents) => MD.stringify(contents),
    },
    yaml: {
        ext: 'yaml',
        parse: YAML.parse,
        stringify: (contents) => YAML.stringify(contents, null, 4),
    },
    yml: {
        ext: 'yml',
        parse: YAML.parse,
        stringify: (contents) => YAML.stringify(contents, null, 4),
    },
}

export function createFolderProvider(drive: Drive) {
    return defineProvider((config: Config) => {
        const { path } = config

        const idConfig = config.id || {}
        const { strategy: idStrategy, ...idOptions } = idConfig

        const parser = parsers[config.format || 'markdown']

        if (!parser) {
            throw new Error(`Unknown format: ${config.format}`)
        }

        const makeId = createIdMaker({
            strategies: [createIncrementalStategyFromFile(drive, resolve(path, 'last_id.json'))],
        })

        const list: DataProvider['list'] = async (options) => {
            const where = options?.where || {}
            const exclude = options?.exclude || []
            const include = options?.include || []
            const limit = options?.limit
            const page = options?.page || 1

            let files = await drive.list(path, { onlyDirs: true })

            if (config.exclude) {
                files = files.filter((file) => !config.exclude?.includes(file))
            }

            const result = [] as any[]

            for (const file of files) {
                const raw = await drive.read(resolve(path, file, `index.${parser.ext}`))

                const item = {
                    id: file.replace(`.${parser.ext}`, ''),
                    folder: resolve(path, file),
                    raw: raw,
                }

                Object.assign(item, parser.parse(raw))

                result.push(item)
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

        const find: DataProvider['find'] = async (options) => {
            const { data: items } = await list({
                ...options,
                limit: 1,
            })

            return items[0] || null
        }

        const create: DataProvider['create'] = async (options) => {
            const { data } = options

            const id = data.id || (await makeId(idStrategy, idOptions))

            if (await drive.exists(resolve(path, id))) {
                throw new Error(`Item with id "${id}" already exists`)
            }

            const filename = resolve(path, id, `index.${parser.ext}`)

            await drive.mkdir(resolve(path, id))

            await drive.write(filename, parser.stringify(data))

            const item = await find({ where: { id: String(id) } })

            return item!
        }

        const update: DataProvider['update'] = async (options) => {
            const { data, where } = options

            const page = await list({ where })
            const items = page.data

            for (const item of items) {
                const filename = resolve(path, item.id, `index.${parser.ext}`)

                await drive.write(filename, parser.stringify(data))
            }

            return { count: items.length }
        }

        const destroy: DataProvider['destroy'] = async (options) => {
            const { where } = options
            const { data: items } = await list({ where, include: ['folder'] })

            for (const item of items) {
                await drive.destroy(item.folder)
            }

            return { count: items.length }
        }

        return {
            list,
            find,
            create,
            update,
            destroy,
        }
    })
}
