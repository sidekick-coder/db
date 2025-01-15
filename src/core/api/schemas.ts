import { InferOutput } from 'valibot'
import { vWithExtras as v } from '../validator/index.js'

export const dbSchema = v.object({
    name: v.optional(v.string()),
    provider: v.string(),
    config: v.record(v.string(), v.any()),
})

export interface DbConfig extends InferOutput<typeof dbConfigSchema> {}

export const dbConfigSchema = v.object({
    providers: v.record(v.string(), v.any()),
    default_database: v.optional(v.string()),
    databases: v.pipe(
        v.any(),
        v.transform((v) => (Array.isArray(v) ? v : [v])),
        v.array(dbSchema)
    ),
})

export const common = {
    dbConfig: dbConfigSchema,
    providerList: v.map(v.string(), v.any()),
    provider: v.string(),
    config: v.optional(v.record(v.string(), v.any())),
}
