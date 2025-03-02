import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { validate } from '@/core/validator/validate.js'
import { schema as where } from '@/core/database/where.js'
import { WhereCondition } from '@/core/provider/index.js'
import { list } from './list.js'
import { Parser } from '@/core/parsers/all.js'
import { unlockItem } from './unlockItem.js'
import { tryCatch } from '@/utils/tryCatch.js'

interface Options {
    root: string
    filesystem: Filesystem
    parser: Parser
    options: {
        where?: WhereCondition
        limit?: number
        verbose?: boolean
    }
}

export async function unlock(payload: Options) {
    const { filesystem, root, parser } = payload

    const options = validate(
        (v) =>
            v.object({
                where: v.optional(where),
                limit: v.optional(v.number()),
                verbose: v.optional(v.boolean()),
            }),
        payload.options
    )

    const { data: items } = await list({
        root,
        filesystem,
        parser,
        options: {
            where: options.where,
            limit: options.limit,
        },
    })

    let success = 0
    let failed = 0

    for (const item of items) {
        const [result, error] = await tryCatch(() =>
            unlockItem({ filesystem, root, options: { id: item.id } })
        )

        if (result) {
            success++
        }

        if (error) {
            failed++
        }

        if (options.verbose) {
            console.log(`Item ${item.id} unlocked`)
        }
    }

    return {
        success,
        failed,
    }
}
