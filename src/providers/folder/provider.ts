import { resolve } from 'path'
import { defineProvider } from '@/core/provider/defineProvider.js'
import { drive } from '@/core/drive/index.js'
import { createIdMaker } from '@/core/id/index.js'
import { createIncrementalStategyFromFile } from '@/core/id/incremental.js'
import { parsers } from '@/core/parsers/index.js'
import { v, validate } from '@/core/validator/index.js'

import { update } from './update.js'
import { list } from './list.js'
import { createFilesystem } from '@/core/filesystem/createFilesystem.js'
import { create } from './create.js'
import { find } from './find.js'
import { destroy } from './destroy.js'

export const provider = defineProvider((config, instanceConfig) => {
    const filesystem = createFilesystem()

    const schema = v.object({
        path: v.extras.path(instanceConfig.root, filesystem.path),
        format: v.optional(v.picklist(['markdown', 'json', 'yaml']), 'markdown'),
        id_strategy: v.optional(v.string(), 'increment'),
    })

    const { path, format, id_strategy } = validate(schema, config)
    const root = path

    const parser = parsers.find((p) => p.name === format)

    if (!parser) {
        throw new Error(`Parser for format "${format}" not found`)
    }

    const makeId = createIdMaker({
        strategies: [createIncrementalStategyFromFile(drive, resolve(path, '.db', 'last_id.json'))],
    })

    return {
        list: (options) =>
            list({
                root,
                filesystem,
                parser,
                options,
            }),
        find: (options) =>
            find({
                root,
                filesystem,
                parser,
                options,
            }),
        create: (options) =>
            create({
                root,
                filesystem,
                parser,
                makeId: () => makeId(id_strategy),
                options,
            }),
        update: (options) =>
            update({
                root,
                filesystem,
                options,
                parser,
            }),
        destroy: (options) =>
            destroy({
                filesystem,
                root,
                parser,
                options,
            }),
    }
})
