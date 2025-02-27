import { resolve } from 'path'
import { drive } from '@/core/drive/index.js'
import { defineProvider } from '@/core/provider/defineProvider.js'
import { DataProvider } from '@/core/provider/types.js'
import { query, count } from '@/core/provider/queryArray.js'

import omit from 'lodash-es/omit.js'
import { createIncrementalStategyFromFile } from '@/core/id/incremental.js'
import { createIdMaker } from '@/core/id/index.js'
import { v, validate } from '@/core/validator/index.js'
import { parsers } from '@/core/parsers/index.js'

export const provider = defineProvider((config, { root }) => {
    const schema = v.object({
        path: v.extras.path(root),
        format: v.optional(v.picklist(['markdown', 'json', 'yaml']), 'markdown'),
        id_strategy: v.optional(v.string(), 'increment'),
    })

    const { path, format, id_strategy } = validate(schema, config)

    const parser = parsers.find((p) => p.name === format)

    if (!parser) {
        throw new Error(`Parser for format "${format}" not found`)
    }

    const makeId = createIdMaker({
        strategies: [createIncrementalStategyFromFile(drive, resolve(path, '.db', 'last_id.json'))],
    })

    const list: DataProvider['list'] = async (options) => {
        const where = options?.where || {}
        const exclude = options?.exclude
        const include = options?.include
        const limit = options?.limit
        const page = options?.page || 1

        const files = await drive.list(path, {
            onlyFiles: true,
        })

        const filteredFiles = files.filter((f) => {
            if (f === '.db') return false

            return true
        })

        const result = [] as any[]

        for (const file of filteredFiles) {
            const filename = resolve(path, file)

            const content = drive.readSync(filename)

            const item: any = {
                id: file.replace(`.${parser.ext}`, ''),
                filename: filename,
                raw: content,
            }

            Object.assign(item, parser.parse(content))

            result.push(item)
        }

        const items = query(result, {
            where,
            exclude,
            include,
            limit,
            offset: page > 1 ? (page - 1) * limit : 0,
        })

        const meta = {
            total: count(result, { where }),
            limit,
            total_pages: limit ? Math.ceil(result.length / limit) : 1,
        }

        return {
            meta,
            data: items,
        }
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

        const { id: explicitId, ...properties } = data
        const id = explicitId || (await makeId(id_strategy, {}))
        const filename = resolve(path, `${id}.${parser.ext}`)

        if (await drive.exists(filename)) {
            throw new Error(`Item with id "${id}" already exists`)
        }

        const content = parser.stringify(properties)

        await drive.write(filename, content)

        return {
            id: id,
            ...properties,
        }
    }

    const update: DataProvider['update'] = async (options) => {
        const { where, data } = options

        const { data: items } = await list({ where, exclude: [] })

        for (const item of items) {
            const filename = resolve(path, `${item.id}.${parser.ext}`)

            const hideKeys = ['id', 'filename', 'raw']

            const properties = omit({ ...item, ...data }, hideKeys)

            const content = parser.stringify(properties)

            await drive.write(filename, content)
        }

        return { count: items.length }
    }

    const destroy: DataProvider['destroy'] = async (options) => {
        const { where } = options
        const { data: items } = await list({ where, include: ['filename'] })

        for (const item of items) {
            await drive.destroy(item.filename)
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
