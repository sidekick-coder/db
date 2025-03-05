import { vWithExtras as v, validate } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { schema as where } from './where.js'
import { schema as data } from './data.js'
import { DataProvider } from '../provider/index.js'

export interface UpdateOptions extends InferOutput<typeof schema> {}

const schema = v.objectWithRest(
    {
        data: data(),
        where: v.optional(where),
        limit: v.optional(v.number()),
    },
    v.any()
)

export async function update(provider: DataProvider, payload: UpdateOptions) {
    const options = validate(schema, payload)

    if (!provider.update) {
        throw new Error(`Provider does not support updating`)
    }

    return await provider.update(options)
}
