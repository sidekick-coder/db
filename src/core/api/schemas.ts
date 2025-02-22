import { InferOutput } from 'valibot'
import { vWithExtras as v } from '../validator/index.js'

export interface DbConfig extends InferOutput<typeof dbConfigSchema> {}

export const dbSchema = v.object({
    name: v.string(),
    provider: v.string(),
    config: v.optional(v.record(v.string(), v.any()), {}),
    default_view: v.optional(v.string()),
    views: v.optional(v.array(v.any()), []),
})

export const dbConfigProvider = v.object({
    name: v.string(),
    provider: v.pipe(v.any()),
})

export const dbConfigSchema = v.object({
    providers: v.array(dbConfigProvider),
    databases: v.pipe(
        v.any(),
        v.transform((v) => (Array.isArray(v) ? v : [v])),
        v.array(dbSchema)
    ),
    renders: v.optional(v.array(v.any()), []),
})

export const common = {
    dbConfig: dbConfigSchema,
    providerList: v.map(v.string(), v.any()),
    provider: v.string(),
    config: v.optional(v.record(v.string(), v.any())),
}
