import minimist from 'minimist'

import { validate } from '@/core/validator/index.js'
import { merge, omit } from 'lodash-es'
import { DatabaseDefinition } from '@/core/config/schemas.js'

interface Options {
    databaseDefinition?: DatabaseDefinition
}

export function parseOptions(args: string[], options?: Options) {
    const flags = minimist(args, {
        string: ['where', 'view', 'data', 'render', 'id'],
        alias: {
            where: 'w',
            view: 'v',
            data: 'd',
            render: 'r',
            render_options: 'ro',
            sortBy: ['sort-by'],
            sortDesc: ['sort-desc'],
        },
    })

    const result: any = validate(
        (v) =>
            v.objectWithRest(
                {
                    view: v.optional(v.string(), options?.databaseDefinition?.view?.default),
                    render: v.optional(v.string()),
                    data: v.optional(v.extras.vars),
                    where: v.optional(v.extras.vars),
                    include: v.optional(v.extras.stringList),
                    exclude: v.optional(v.extras.stringList),
                    render_options: v.optional(v.extras.vars, {}),
                },
                v.any()
            ),
        flags
    )

    console.log('result', result)

    // view
    if (result.view && options?.databaseDefinition) {
        // try to find view in list
        const view = options.databaseDefinition?.view?.sources?.find((v) => v.name === result.view)

        merge(result, omit(view, 'name'))
    }

    return result
}
