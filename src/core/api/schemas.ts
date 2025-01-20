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

export function transformWhere(where: any) {
    const { and, or, ...rest } = where
    const result: any = {
        and: [],
        or: [],
    }

    if (rest?.field && rest?.operator && rest?.value) {
        return {
            and: [
                {
                    field: rest.field,
                    operator: rest.operator,
                    value: rest.value,
                },
            ],
        }
    }

    for (const [key, value] of Object.entries<any>(rest)) {
        result.and.push({
            field: value.field || key,
            operator: value?.operator || 'eq',
            value: value?.value || value,
        })
    }

    if (and?.length) {
        and.forEach((w: any) => {
            result.and.push(...transformWhere(w).and)
        })
    }

    if (or?.length) {
        or.forEach((w: any) => {
            result.or.push(...transformWhere(w).and)
        })
    }

    return result
}

export const where = v.pipe(v.record(v.string(), v.any()), v.transform(transformWhere))
