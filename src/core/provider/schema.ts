import { InferOutput } from 'valibot'
import { vWithExtras as v } from '../validator/index.js'

export const providerSchema = v.object({
    list: v.optional(v.function()),
    find: v.optional(v.function()),
    create: v.optional(v.function()),
    update: v.optional(v.function()),
    destroy: v.optional(v.function()),
})

export type ProviderSchema = InferOutput<typeof providerSchema>
