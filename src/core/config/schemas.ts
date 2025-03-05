import { v, validate } from '../validator/index.js'
import { InferOutput } from 'valibot'
import { merge } from 'lodash-es'
import { schema as sources } from '@/core/common/sources.js'

export type DatabaseDefinition = InferOutput<ReturnType<typeof database>>

const viewSources = (root: string) =>
    v.pipe(
        sources(root),
        v.transform((items) => items.map((i) => i.data)),
        v.transform((items) => {
            return items.map((i) => {
                if (i.extend) {
                    const parent = items.find((x) => x.name === i.extend)

                    return merge({}, parent, i)
                }

                return i
            })
        })
    )

export const view = (root: string) =>
    v.object({
        default: v.optional(v.string()),
        sources: v.optional(viewSources(root)),
    })

export const database = (root: string) =>
    v.objectWithRest(
        {
            name: v.string(),
            provider: v.object({
                name: v.string(),
                config: v.any(),
            }),
            view: v.optional(view(root)),
        },
        v.record(v.string(), v.any())
    )

export const config = (root: string) =>
    v.object({
        databases: v.object({
            default: v.optional(v.string()),
            sources: v.pipe(
                sources(root),
                v.transform((i) => {
                    return i.map((i) => {
                        if ('dirname' in i) {
                            return {
                                filename: i.filename,
                                dirname: i.dirname,
                                data: validate(database(i.dirname), i.data),
                            }
                        }

                        return {
                            data: validate(database(root), i.data),
                        }
                    })
                })
            ),
        }),
    })
