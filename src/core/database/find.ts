import { vWithExtras as v, validate } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { schema as where } from './where.js'
import { DataProvider } from '../provider/index.js'

export interface FindOptions extends InferOutput<typeof schema> {}

const schema = v.objectWithRest(
    {
        where: v.optional(where),
        include: v.optional(v.extras.stringList),
        exclude: v.optional(v.extras.stringList),
    },
    v.any()
)

export async function find(provider: DataProvider, payload: FindOptions) {
    const options = validate(schema, payload)

    if (!provider.find) {
        throw new Error(`Provider does not support find`)
    }

    return await provider.find(options)
}
