import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { where } from './schemas.js'
import { providerSchema } from '../provider/schema.js'

export interface FindOptions extends InferOutput<typeof schema> {}

const schema = v.object({
    provider: providerSchema,
    where: v.optional(where),
    include: v.optional(v.extras.stringList),
    exclude: v.optional(v.extras.stringList),
})

export async function find(payload: FindOptions) {
    const options = v.parse(schema, payload)

    const where = options.where
    const include = options?.include
    const exclude = options?.exclude

    const provider = options.provider

    if (!provider.find) {
        throw new Error(`Provider does not support find`)
    }

    const response = await provider.find({
        where: where,
        include: include,
        exclude: exclude,
    })

    return response
}
