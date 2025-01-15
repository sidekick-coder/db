import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { common } from './schemas.js'

export interface UpdateOptions extends InferOutput<typeof schema> {}

const schema = v.object({
    ...common,
    data: v.record(v.string(), v.any()),
    where: v.optional(v.record(v.string(), v.any())),
})

export async function update(payload: UpdateOptions) {
    const options = v.parse(schema, payload)

    const config = options.config
    const where = options.where || {}

    const mount = options.providerList.get(options.provider)

    if (!mount) {
        throw new Error(`Provider "${options.provider}" not found`)
    }

    const provider = mount(config)

    if (!provider.update) {
        throw new Error(`Provider "${options.provider}" does not support updating`)
    }

    const item = await provider.update(options.data, where)

    return item
}
