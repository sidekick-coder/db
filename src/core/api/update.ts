import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { dbConfigSchema } from './schemas.js'

export interface UpdateOptions extends InferOutput<typeof schema> {}

const schema = v.object({
    dbConfig: dbConfigSchema,
    provider: v.string(),
    config: v.optional(v.record(v.string(), v.any())),
    data: v.record(v.string(), v.any()),
    where: v.optional(v.record(v.string(), v.any())),
})

export async function update(payload: UpdateOptions) {
    const options = v.parse(schema, payload)

    const config = options.config
    const providers = options.dbConfig.providers
    const where = options.where || {}

    const mount = providers[options.provider]

    if (!mount) {
        throw new Error(`Provider "${options.provider}" not found`)
    }

    const provider = mount(config)

    const item = await provider.update(options.data, where)

    return item
}
