import { vWithExtras as v } from '../validator/index.js'
import { type Chain, compose, createChain } from '@sidekick-coder/compositor'
import { Arg, BaseContext, CommandDefinition, ExecuteFn, Flag, OptionRecord } from './types.js'
import { addCommand } from './register.js'

export interface Builder<A extends OptionRecord<Arg>, F extends OptionRecord<Flag>>
    extends Chain<BaseContext> {
    handle(cb: ExecuteFn<A, F>): void
    args<T extends OptionRecord<Arg>>(args: T): Builder<T, F>
    flags<T extends OptionRecord<Flag>>(flags: T): Builder<A, T>
}

function validate<T extends OptionRecord>(options: T, input: Record<string, any>) {
    const entries = {} as any

    for (const [key, value] of Object.entries(options)) {
        entries[key] = value.schema ? value.schema(v) : v.any()
    }

    const schema = v.object(entries)

    return v.parse(schema, input)
}

export function command(name: string) {
    let $args = {} as OptionRecord<Arg>
    let $flags = {} as OptionRecord<Flag>

    const chain = createChain<BaseContext, Builder<{}, {}>>({
        handle: (cb) => {
            const definition: CommandDefinition = {
                name,
                args: $args,
                flags: $flags,
                run: async (ctx) => {
                    // parse args
                    const args = Object.keys($args).reduce(
                        (acc, key, index) => ({
                            ...acc,
                            [key]: ctx.args[index],
                        }),
                        {}
                    )

                    const result = {
                        args: validate($args, args),
                        flags: validate($flags, ctx.flags),
                    }

                    const fullCtx = compose([result, ...chain.modifiers])

                    return cb(fullCtx)
                },
            }

            addCommand(name, definition)
        },
        args<T extends OptionRecord<Arg>>(args: T) {
            $args = args

            return chain
        },
        flags<T extends OptionRecord<Flag>>(flags: T) {
            $flags = flags

            return chain
        },
    })

    return chain as Builder<{}, {}>
}
