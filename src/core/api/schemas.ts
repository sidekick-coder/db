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

export function transformWhere(where: any) {
    const { and, or, ...rest } = where
    const result: any = {
        and: [],
        or: [],
    }

    if (rest?.field && rest?.operator) {
        return {
            field: rest.field,
            operator: rest.operator,
            value: rest.value,
        }
    }

    for (const [key, value] of Object.entries<any>(rest)) {
        result.and.push({
            field: value?.field || key,
            operator: value?.operator || 'eq',
            value: value?.value || value,
        })
    }

    if (and?.length) {
        and.forEach((w: any) => {
            result.and.push(transformWhere(w))
        })
    }

    if (or?.length) {
        or.forEach((w: any) => {
            result.or.push(transformWhere(w))
        })
    }

    // if (result.and.length === 1 && !result.or.length) {
    //     return result.and[0]
    // }

    if (!result.or.length) {
        delete result.or
    }

    if (!result.and.length) {
        delete result.and
    }

    return result
}

export const where = v.pipe(v.any(), v.transform(transformWhere))
