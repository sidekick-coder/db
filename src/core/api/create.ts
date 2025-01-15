import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { dbConfigSchema } from './schemas.js'

export interface CreateOptions extends InferOutput<typeof schema> {}

const schema = v.object({
    dbConfig: dbConfigSchema,
    provider: v.string(),
    config: v.optional(v.record(v.string(), v.any())),
    data: v.record(v.string(), v.any()),
})

export async function create(payload: CreateOptions) {
    const options = v.parse(schema, payload)

    const config = options.config
    const providers = options.dbConfig.providers

    const mount = providers[options.provider]

    if (!mount) {
        throw new Error(`Provider "${options.provider}" not found`)
    }

    const provider = mount(config)

    const item = await provider.create(options.data)

    return item
}
