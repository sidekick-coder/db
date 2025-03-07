import { defineProvider } from '@/core/provider/defineProvider.js'
import { parsers } from '@/core/parsers/index.js'
import { v, validate } from '@/core/validator/index.js'

import { update } from './update.js'
import { list } from './list.js'
import { createFilesystem } from '@/core/filesystem/createFilesystem.js'
import { create } from './create.js'
import { find } from './find.js'
import { destroy } from './destroy.js'
import { createStrategies } from '@/core/idStrategy/createStrategies.js'

export const provider = defineProvider((config, instanceConfig) => {
    const filesystem = createFilesystem({
        fs: instanceConfig.fs,
        path: instanceConfig.path,
    })

    const schema = v.object({
        path: v.extras.path(instanceConfig.root, filesystem.path),
        format: v.optional(v.picklist(['markdown', 'json', 'yaml']), 'markdown'),
        id_strategy: v.optional(
            v.object({
                name: v.string(),
                options: v.optional(v.any()),
            }),
            { name: 'incremental' }
        ),
    })

    const { path, format, id_strategy } = validate(schema, config)
    const root = path

    const strategies = createStrategies({ filesystem, root })

    const parser = parsers.find((p) => p.name === format)
    const strategy = strategies.find((s) => s.name === id_strategy.name)

    if (!parser) {
        throw new Error(`Parser for format "${format}" not found`)
    }

    if (!strategy) {
        throw new Error(`Strategy for id "${id_strategy}" not found`)
    }

    const makeId = () => strategy.create(id_strategy.options)

    return {
        list: (options = {}) =>
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
                makeId,
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
