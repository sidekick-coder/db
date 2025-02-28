import { createPathNode } from '@/core/filesystem/createPathNode.js'
import { v } from '@/core/validator/valibot.js'
import { InferOutput } from 'valibot'

export interface Config extends InferOutput<ReturnType<typeof schema>> {}

export const schema = (dirname: string, path = createPathNode()) =>
    v.object({
        format: v.optional(v.string(), 'markdown'),
        path: v.extras.path(dirname, path),
        id_strategy: v.optional(v.string(), 'increment'),
        password: v.string('Password is required'),
    })
