import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { common, where } from './schemas.js'

export interface FindOptions extends InferOutput<typeof schema> {}

const schema = v.object({
    ...common,
    where: v.optional(where),
    include: v.optional(v.extras.stringList),
    exclude: v.optional(v.extras.stringList),
})

export async function find(payload: FindOptions) {
    const options = v.parse(schema, payload)

    const providerName = options.provider
    const config = options.config

    const where = options.where
    const include = options?.include
    const exclude = options?.exclude

    const mount = options.providerList.get(providerName)

    if (!mount) {
        throw new Error(`Provider "${options.provider}" not found`)
    }

    const provider = mount(config)

    if (!provider.find) {
        throw new Error(`Provider "${providerName}" does not support find`)
    }

    const response = await provider.find({
        where: where,
        include: include,
        exclude: exclude,
    })

    return response
}
