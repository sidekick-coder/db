import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { providerSchema } from '../provider/schema.js'

export interface CreateOptions extends InferOutput<typeof schema> {}

const schema = v.object({
    provider: providerSchema,
    config: v.optional(v.record(v.string(), v.any())),
    data: v.record(v.string(), v.any()),
})

export async function create(payload: CreateOptions) {
    const options = v.parse(schema, payload)
    const provider = options.provider

    if (!provider.create) {
        throw new Error(`Provider does not support creating`)
    }

    const item = await provider.create(options.data)

    return item
}
