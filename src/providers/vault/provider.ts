import { defineProvider } from '@/core/provider/defineProvider.js'
import { validate } from '@/core/validator/index.js'
import { createFilesystem } from '@/core/filesystem/createFilesystem.js'
import { parsers } from '@/core/parsers/all.js'
import { schema as configSchema } from './config.js'
import { list } from './list.js'
import { find } from './find.js'
import { create } from './create.js'
import { update } from './update.js'
import { destroy } from './destroy.js'
import { lock } from './lock.js'
import { lockItem } from './lockItem.js'
import { unlock } from './unlock.js'
import { unlockItem } from './unlockItem.js'
import { init } from './init.js'
import { auth } from './auth.js'

import { createStrategies } from '@/core/idStrategy/createStrategies.js'

export const provider = defineProvider((payload, { root, fs, path }) => {
    const config = validate(configSchema(root, path), payload)
    const filesystem = createFilesystem({ fs, path })

    const { format, id_strategy } = config

    const strategies = createStrategies({ filesystem, root: config.path })

    const parser = parsers.find((p) => p.name === format)
    const strategy = strategies.find((s) => s.name === id_strategy.name)

    if (!parser) {
        throw new Error(`Parser for format "${format}" not found`)
    }

    if (!strategy) {
        throw new Error(`Strategy for id "${id_strategy}" not found`)
    }

    const makeId = () => strategy.create(id_strategy.options)

    const common = {
        filesystem,
        root: config.path,
    }

    return {
        list: (options = {}) => list({ ...common, parser, options }),
        find: (options) => find({ ...common, parser, options }),
        create: (options) => create({ ...common, parser, options, makeId }),
        update: (options) => update({ ...common, parser, options }),
        destroy: (options) => destroy({ ...common, parser, options }),
        init: (options: any) => init({ ...common, options }),
        auth: (options: any) => auth({ ...common, options }),
        lock: (options: any) => lock({ ...common, parser, options }),
        lockItem: (options: any) => lockItem({ ...common, filesystem, options }),
        unlock: (options: any) => unlock({ ...common, parser, options }),
        unlockItem: (options: any) => unlockItem({ ...common, options }),
    }
})
