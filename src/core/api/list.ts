import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { common, where } from './schemas.js'

export interface ListOptions extends InferOutput<typeof schema> {}

const schema = v.object({
    ...common,
    where: v.optional(where),
    pagination: v.optional(v.record(v.string(), v.any())),
    include: v.optional(v.extras.stringList),
    exclude: v.optional(v.extras.stringList),
})

export async function list(payload: ListOptions) {
    const options = v.parse(schema, payload)

    const providerName = options.provider
    const config = options.config

    const where = options.where
    const include = options?.include
    const exclude = options?.exclude
    const pagination = options.pagination

    const mount = options.providerList.get(providerName)

    if (!mount) {
        throw new Error(`Provider "${options.provider}" not found`)
    }

    const provider = mount(config)

    if (!provider.list) {
        throw new Error(`Provider "${providerName}" does not support listing`)
    }

    const response = await provider.list({
        where: where,
        include: include,
        exclude: exclude,
        pagination: pagination,
    })

    return response
}
