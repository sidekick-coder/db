import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { dbConfigSchema } from './schemas.js'

export interface ListOptions extends InferOutput<typeof schema> {}

const schema = v.object({
    dbConfig: dbConfigSchema,
    provider: v.string(),
    config: v.optional(v.record(v.string(), v.any())),
    where: v.optional(v.record(v.string(), v.any())),
    pagination: v.optional(v.record(v.string(), v.any())),
    include: v.optional(v.array(v.string())),
    exclude: v.optional(v.array(v.string())),
})

export async function list(payload: ListOptions) {
    const options = v.parse(schema, payload)

    const providerName = options.provider
    const config = options.config
    const providers = options.dbConfig.providers

    const where = options.where || {}
    const include = options.include
    const exclude = options.exclude
    const pagination = options.pagination

    const mount = providers[providerName]

    if (!mount) {
        throw new Error(`Provider "${options.provider}" not found`)
    }

    const provider = mount(config)

    const response = await provider.list({
        where: where,
        include: include,
        exclude: exclude,
        pagination: pagination,
    })

    return response
}
