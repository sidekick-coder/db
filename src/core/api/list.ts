import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { common } from './schemas.js'

export interface ListOptions extends InferOutput<typeof schema> {}

const schema = v.object({
    ...common,
    where: v.optional(v.record(v.string(), v.any())),
    pagination: v.optional(v.record(v.string(), v.any())),
    field: v.optional(
        v.object({
            exclude: v.optional(v.array(v.string())),
            include: v.optional(v.array(v.string())),
        })
    ),
})

export async function list(payload: ListOptions) {
    const options = v.parse(schema, payload)

    const providerName = options.provider
    const config = options.config

    const where = options.where || {}
    const include = options.field?.include
    const exclude = options.field?.exclude
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
