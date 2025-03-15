import { defineProvider } from '@/core/provider/defineProvider.js'

import { v, validate } from '@/core/validator/index.js'
import { schema as where } from '@/core/database/where.js'
import { parsers } from '@/core/parsers/index.js'

import { update } from './update.js'
import { list } from './list.js'
import { createFilesystem } from '@/core/filesystem/createFilesystem.js'
import { create } from './create.js'
import { find } from './find.js'
import { destroy } from './destroy.js'
import { createStrategies } from '@/core/idStrategy/createStrategies.js'
import cp from 'child_process'

export const provider = defineProvider((config, instanceOptions) => {
    const filesystem = createFilesystem({
        fs: instanceOptions.fs,
        path: instanceOptions.path,
    })

    const schema = v.object({
        path: v.extras.path(instanceOptions.root, filesystem.path),
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

    async function open(payload: any) {
        const options = validate(
            (v) =>
                v.object({
                    where: v.optional(where),
                    editor: v.optional(v.string()),
                }),
            payload
        )
        const item = await find({
            root,
            filesystem,
            parser,
            options,
        })

        if (!item) {
            throw new Error('Item not found')
        }

        let bin: string

        if (process.env.EDITOR) {
            bin = process.env.EDITOR
        }

        if (payload.editor) {
            bin = payload.editor
        }

        if (!bin) {
            throw new Error(
                'No editor found, please set the EDITOR environment variable or pass the editor option'
            )
        }

        cp.spawn(bin, [item.filename], {
            stdio: 'inherit',
            env: process.env,
        })
    }

    return {
        open,
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
                root,
                filesystem,
                parser,
                options,
            }),
    }
})
