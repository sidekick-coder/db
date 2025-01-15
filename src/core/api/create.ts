import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { common } from './schemas.js'

export interface CreateOptions extends InferOutput<typeof schema> {}

const schema = v.object({
    ...common,
    config: v.optional(v.record(v.string(), v.any())),
    data: v.record(v.string(), v.any()),
})

export async function create(payload: CreateOptions) {
    const options = v.parse(schema, payload)

    const config = options.config

    const mount = options.providerList.get(options.provider)

    if (!mount) {
        throw new Error(`Provider "${options.provider}" not found`)
    }

    const provider = mount(config)

    if (!provider.create) {
        throw new Error(`Provider "${options.provider}" does not support creating`)
    }

    const item = await provider.create(options.data)

    return item
}
