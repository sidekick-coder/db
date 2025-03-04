import { resolve } from 'path'
import { drive } from '@/core/drive/index.js'
import { defineProvider } from '@/core/provider/defineProvider.js'
import { DataProvider } from '@/core/provider/types.js'
import { query, count } from '@/core/provider/queryArray.js'

import { createIncrementalStategyFromFile } from '@/core/id/incremental.js'
import { createIdMaker } from '@/core/id/index.js'
import { v, validate } from '@/core/validator/index.js'
import { parsers } from '@/core/parsers/index.js'

import { update } from './update.js'
import { list } from './list.js'
import { createFilesystem } from '@/core/filesystem/createFilesystem.js'

export const provider = defineProvider((config, { root }) => {
    const filesystem = createFilesystem()

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

    //const find: DataProvider['find'] = async (options) => {
    //    const { data: items } = await list({
    //        ...options,
    //        limit: 1,
    //    })
    //
    //    return items[0] || null
    //}

    //const create: DataProvider['create'] = async (options) => {
    //    const { data } = options
    //
    //    const { id: explicitId, ...properties } = data
    //    const id = explicitId || (await makeId(id_strategy, {}))
    //    const filename = resolve(path, `${id}.${parser.ext}`)
    //
    //    if (await drive.exists(filename)) {
    //        throw new Error(`Item with id "${id}" already exists`)
    //    }
    //
    //    const content = parser.stringify(properties)
    //
    //    await drive.write(filename, content)
    //
    //    return {
    //        id: id,
    //        ...properties,
    //    }
    //}

    //const destroy: DataProvider['destroy'] = async (options) => {
    //    const { where } = options
    //    const { data: items } = await list({ where, include: ['filename'] })
    //
    //    for (const item of items) {
    //        await drive.destroy(item.filename)
    //    }
    //
    //    return { count: items.length }
    //}

    return {
        list: (options) =>
            list({
                root: config.path,
                filesystem,
                parser,
                options,
            }),
        //find,
        //create,
        update: (options) =>
            update({
                root: config.path,
                filesystem,
                options,
                parser,
            }),
        //destroy,
    }
})
