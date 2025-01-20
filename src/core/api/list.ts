import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { common, where } from './schemas.js'

export interface ListOptions extends InferOutput<typeof schema> {}

const stringList = v.pipe(
    v.any(),
    v.transform((value) => {
        if (typeof value === 'string') {
            return value.split(',')
        }

        if (Array.isArray(value)) {
            return value
        }
    }),
    v.array(v.string())
)

const schema = v.object({
    ...common,
    where: v.optional(where),
    pagination: v.optional(v.record(v.string(), v.any())),
    include: v.optional(stringList),
    exclude: v.optional(stringList),
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
