import { vWithExtras as v } from '../validator/index.js'

const dbSchema = v.object({
    name: v.optional(v.string()),
    provider: v.string(),
    config: v.record(v.string(), v.any()),
})

const schema = v.object({
    default_database: v.optional(v.string()),
    databases: v.pipe(
        v.any(),
        v.transform((v) => (Array.isArray(v) ? v : [v])),
        v.array(dbSchema)
    ),
})

export function parse(raw: any) {
    const { output, success, issues } = v.safeParse(schema, raw)

    if (!success) {
        console.error(issues)

        throw new Error('Invalid configuration')
    }

    return output
}
