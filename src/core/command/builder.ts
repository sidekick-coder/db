import { vWithExtras as v } from '../validator/index.js'
import { type Chain, compose, createChain } from '@sidekick-coder/compositor'
import { BaseContext, CommandDefinition, ExecuteFn, OptionRecord } from './types.js'
import { addCommand } from './register.js'

export interface Builder<T extends OptionRecord = {}> extends Chain<BaseContext> {
    handle(cb: ExecuteFn<T>): void
    options<O extends OptionRecord>(args: O): Builder<O>
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
    let $options = {}

    const chain = createChain<BaseContext, Builder>({
        handle: (cb) => {
            const definition: CommandDefinition = {
                name,
                options: $options,
                run: async (ctx) => {
                    const options = validate($options, ctx)

                    const fullCtx = compose([ctx, { options }, ...chain.modifiers])

                    return cb(fullCtx)
                },
            }

            addCommand(name, definition)
        },
        options<T extends OptionRecord>(options: T) {
            $options = options

            return chain
        },
    })

    return chain as Builder
}
