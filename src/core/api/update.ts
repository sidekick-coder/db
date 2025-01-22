import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { where } from './schemas.js'
import { providerSchema } from '../provider/schema.js'

export interface UpdateOptions extends InferOutput<typeof schema> {}

const schema = v.object({
    data: v.record(v.string(), v.any()),
    where: v.optional(where),
    provider: providerSchema,
})

export async function update(payload: UpdateOptions) {
    const options = v.parse(schema, payload)
    const where = options.where || {}
    const provider = options.provider

    if (!provider.update) {
        throw new Error(`Provider does not support updating`)
    }

    const item = await provider.update(options.data, where)

    return item
}
