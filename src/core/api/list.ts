import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { common, where } from './schemas.js'
import { providerSchema } from '../provider/schema.js'

export interface ListOptions extends InferOutput<typeof schema> {}

const schema = v.object({
    provider: providerSchema,
    where: v.optional(where),
    pagination: v.optional(v.record(v.string(), v.any())),
    include: v.optional(v.extras.stringList),
    exclude: v.optional(v.extras.stringList),
})

export async function list(payload: ListOptions) {
    const options = v.parse(schema, payload)

    const where = options.where
    const include = options?.include
    const exclude = options?.exclude
    const pagination = options.pagination

    const provider = options.provider

    if (!provider.list) {
        throw new Error(`Provider does not support listing`)
    }

    const response = await provider.list({
        where: where,
        include: include,
        exclude: exclude,
        pagination: pagination,
    })

    return response
}
