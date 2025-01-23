import { InferOutput } from 'valibot'
import { vWithExtras as v } from '../validator/index.js'

const base = {
    list: v.optional(v.pipe(v.function(), v.args(v.tuple([v.any()])), v.returns(v.any()))),
    find: v.optional(v.pipe(v.function(), v.args(v.tuple([v.any()])), v.returns(v.any()))),
    create: v.optional(v.pipe(v.function(), v.args(v.tuple([v.any()])), v.returns(v.any()))),
    update: v.optional(
        v.pipe(v.function(), v.args(v.tuple([v.any(), v.any()])), v.returns(v.any()))
    ),
    destroy: v.optional(v.pipe(v.function(), v.args(v.tuple([v.any()])), v.returns(v.any()))),
}

export const providerSchema = v.objectWithRest(base, v.any())

export type ProviderSchema = InferOutput<typeof providerSchema>
