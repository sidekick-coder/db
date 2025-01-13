import { command } from '@/core/command/index.js'

command('list')
    .args({
        where: {
            name: 'where',
            schema: (v) => v.optional(v.string()),
        },
    })
    .handle(async (ctx) => {
        console.log(ctx.args.where)
    })
