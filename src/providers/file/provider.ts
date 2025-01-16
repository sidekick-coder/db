import { resolve } from 'path'
import { Drive } from '@/core/drive/types.js'
import { defineProvider } from '@/core/provider/defineProvider.js'
import { DataProvider } from '@/core/provider/types.js'
import { queryArray } from '@/core/provider/queryArray.js'

import omit from 'lodash-es/omit.js'
import pick from 'lodash-es/pick.js'
import { createIncrementalStategyFromFile } from '@/core/id/incremental.js'
import { createIdMaker } from '@/core/id/index.js'

interface ProviderConfig {
    drive: Drive
    ext: string
    parse: (data: string) => any
    stringify: (data: any) => string
}

interface Config {
    path: string
    id?: {
        strategy?: string
        [key: string]: any
    }
}

export function createFileProvider(providerConfig: ProviderConfig) {
    return defineProvider((config: Config) => {
        const { drive, ext, parse, stringify } = providerConfig
        const { path } = config

        const idConfig = config.id || {}
        const { strategy: idStrategy, ...idOptions } = idConfig

        const makeId = createIdMaker({
            strategies: [
                createIncrementalStategyFromFile(drive, resolve(path, '.db', 'last_id.json')),
            ],
        })

        const list: DataProvider['list'] = async (options) => {
            const where = options?.where || {}
            const exclude = options?.exclude || []
            const include = options?.include || []
            const limit = options?.pagination?.limit
            const page = options?.pagination?.page || 1

            const files = await drive.list(path)
            const result = [] as any[]

            for (const file of files) {
                const filename = resolve(path, file)

                const content = await drive.read(filename)

                const item: any = {
                    _id: file.replace(`.${ext}`, ''),
                    _filename: filename,
                    _raw: content,
                }

                Object.assign(item, parse(content))

                result.push(item)
            }

            let items = queryArray(result, where)

            if (include.length) {
                items = items.map((item) => pick(item, include))
            }

            if (exclude.length && !include.length) {
                items = items.map((item) => omit(item, exclude))
            }

            // exclude properties with underscore
            if (items.length && !include.length && !exclude.length) {
                const keys = Object.keys(items[0]).filter((k) => k !== '_id' && k.startsWith('_'))

                items = items.map((item) => omit(item, keys))
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

        const find: DataProvider['find'] = async (where, field) => {
            const { data: items } = await list({
                where,
                include: field?.include,
                exclude: field?.exclude,
                pagination: { limit: 1 },
            })

            return items[0] || null
        }

        const create: DataProvider['create'] = async (data) => {
            const { id: explicitId, ...properties } = data
            const id = explicitId || (await makeId(idStrategy, idOptions))
            const filename = resolve(path, `${id}.${ext}`)

            if (await drive.exists(filename)) {
                throw new Error(`Item with id "${id}" already exists`)
            }

            const content = stringify(properties)

            await drive.write(filename, content)

            const item = await find({ _id: String(id) })!

            return item!
        }

        const update: DataProvider['update'] = async (data, where) => {
            const { data: items } = await list({ where, exclude: [] })

            for (const item of items) {
                const filename = resolve(path, `${item.id}.${ext}`)

                const hideKeys = Object.keys(item).filter((k) => k.startsWith('_'))

                const properties = omit({ ...item, ...data }, hideKeys)

                const content = stringify(properties)

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
            find,
            create,
            update,
            destroy,
        }
    })
}
