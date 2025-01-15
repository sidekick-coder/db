import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { common } from './schemas.js'

export interface DestroyOptions extends InferOutput<typeof schema> {}

const schema = v.object({
    ...common,
    config: v.optional(v.record(v.string(), v.any())),
    where: v.optional(v.record(v.string(), v.any())),
})

export async function destroy(payload: DestroyOptions) {
    const options = v.parse(schema, payload)

    const config = options.config
    const where = options.where || {}
    const mount = options.providerList.get(options.provider)

    if (!mount) {
        throw new Error(`Provider "${options.provider}" not found`)
    }

    const provider = mount(config)

    if (!provider.destroy) {
        throw new Error(`Provider "${options.provider}" does not support destroying`)
    }

    const item = await provider.destroy(where)

    return item
}
