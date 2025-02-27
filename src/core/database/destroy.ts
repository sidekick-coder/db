import { vWithExtras as v, validate } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { schema as where } from './where.js'
import { DataProvider } from '../provider/index.js'

export interface DestroyOptions extends InferOutput<typeof schema> {}

const schema = v.object({
    where: v.optional(where),
    limit: v.optional(v.number()),
})

export async function destroy(provider: DataProvider, payload: DestroyOptions) {
    if (!provider.destroy) {
        throw new Error(`Provider does not support destroying`)
    }

    const options = validate(schema, payload)

    return await provider.destroy(options)
}
