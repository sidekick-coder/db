import { resolve } from 'path'
import { defineProvider } from '@/core/provider/defineProvider.js'
import { DataProvider } from '@/core/provider/types.js'
import { query, count } from '@/core/provider/queryArray.js'
import { drive } from '@/core/drive/index.js'
import { createIdMaker } from '@/core/id/index.js'
import { createIncrementalStategyFromFile } from '@/core/id/incremental.js'
import { parsers } from '@/core/parsers/index.js'
import { v, validate } from '@/core/validator/index.js'

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
        const exclude = options?.exclude || []
        const include = options?.include || []
        const limit = options?.limit
        const page = options?.page || 1
        const sortBy = options?.sortBy
        const sortDesc = options?.sortDesc

        let files = await drive.list(path, { onlyDirs: true })

        const excludeDirs = ['.db']

        files = files.filter((file) => !excludeDirs.includes(file))

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

        const items = query(result, {
            where,
            exclude,
            include,
            limit,
            offset: page > 1 ? (page - 1) * limit : 0,
            sortBy,
            sortDesc,
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

        const id = data.id || (await makeId(id_strategy))

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
