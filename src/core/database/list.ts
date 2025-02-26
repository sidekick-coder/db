import { vWithExtras as v, validate } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { schema as where } from './where.js'
import { DataProvider } from '../provider/index.js'

export interface ListOptions extends InferOutput<typeof schema> {}

const schema = v.objectWithRest(
    {
        where: v.optional(where),
        limit: v.optional(v.number()),
        page: v.optional(v.number()),
        cursor: v.optional(v.string()),
        include: v.optional(v.extras.stringList),
        exclude: v.optional(v.extras.stringList),
        sortBy: v.optional(v.extras.array(v.string())),
        sortDesc: v.optional(v.extras.array(v.boolean())),
    },
    v.any()
)

export async function list(provider: DataProvider, payload: ListOptions) {
    const options = validate(schema, payload)

    if (!provider.list) {
        throw new Error(`Provider does not support listing`)
    }

    return await provider.list(options)
}
