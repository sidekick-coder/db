import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { where } from './schemas.js'
import { providerSchema } from '../provider/schema.js'

export interface DestroyOptions extends InferOutput<typeof schema> {}

const schema = v.object({
    config: v.optional(v.record(v.string(), v.any())),
    where: v.optional(where),
    provider: providerSchema,
})

export async function destroy(payload: DestroyOptions) {
    const options = v.parse(schema, payload)
    const where = options.where || {}
    const provider = options.provider

    if (!provider.destroy) {
        throw new Error(`Provider does not support destroying`)
    }

    const item = await provider.destroy(where)

    return item
}
