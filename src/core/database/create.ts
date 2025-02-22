import { vWithExtras as v, validate } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { DataProvider } from '../provider/index.js'

export interface CreateOptions extends InferOutput<typeof schema> {}

const schema = v.object({
    data: v.record(v.string(), v.any()),
})

export async function create(provider: DataProvider, payload: CreateOptions) {
    if (!provider.create) {
        throw new Error(`Provider does not support creating`)
    }

    const options = validate(schema, payload)

    return provider.create(options)
}
