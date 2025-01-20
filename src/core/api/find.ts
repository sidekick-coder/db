import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'
import { common, where } from './schemas.js'

export interface FindOptions extends InferOutput<typeof schema> {}

const schema = v.object({
    ...common,
    where: v.optional(where),
    field: v.optional(
        v.object({
            exclude: v.optional(v.array(v.string())),
            include: v.optional(v.array(v.string())),
        })
    ),
})

export async function find(payload: FindOptions) {
    const options = v.parse(schema, payload)

    const providerName = options.provider
    const config = options.config

    const where = options.where
    const include = options.field?.include
    const exclude = options.field?.exclude

    const mount = options.providerList.get(providerName)

    if (!mount) {
        throw new Error(`Provider "${options.provider}" not found`)
    }

    const provider = mount(config)

    if (!provider.find) {
        throw new Error(`Provider "${providerName}" does not support find`)
    }

    const response = await provider.find({
        where: where,
        include: include,
        exclude: exclude,
    })

    return response
}
