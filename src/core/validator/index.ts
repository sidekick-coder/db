import { readJson, readYaml } from '@/utils/filesystem.js'
import * as v from 'valibot'
import qs from 'qs'
import { dirname, resolve } from 'path'

type Valibot = typeof v

const vars = v.optional(
    v.pipe(
        v.any(),
        v.transform((value) => {
            if (typeof value == 'object') {
                return value
            }

            if (/\.json$/.test(value)) {
                return readJson(value.replace(/^@/, ''), {
                    transformRelativePaths: true,
                })
            }

            if (/\.(yml|yaml)$/.test(value)) {
                const file = value.replace(/^@/, '')
                const folder = dirname(file)

                return readYaml(value.replace(/^@/, ''), {
                    reviver: (_key: any, value: any) => {
                        // fix relative paths
                        if (typeof value == 'string' && value.startsWith('./')) {
                            return resolve(folder, value)
                        }

                        return value
                    },
                })
            }

            if (typeof value == 'string' && value.includes('=')) {
                const result = qs.parse(value, { allowEmptyArrays: true })

                return result as Record<string, any>
            }

            if (typeof value == 'string' && value.startsWith('{')) {
                return JSON.parse(value)
            }

            if (typeof value == 'string' && value.startsWith('[')) {
                return JSON.parse(value)
            }

            return value
        }),
        v.record(v.string(), v.any())
    )
)

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
const extras = {
    vars,
    stringList,
    number: v.pipe(
        v.any(),
        v.transform(Number),
        v.check((n) => !isNaN(n)),
        v.number()
    ),
}

export const vWithExtras = {
    ...v,
    extras,
}

export interface ValibotWithExtras extends Valibot {
    extras: typeof extras
}

export interface ValidatorCallback<T extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>> {
    (_v: ValibotWithExtras): T
}

export type ValidatorResult<T extends v.ObjectEntries> = v.InferOutput<v.ObjectSchema<T, undefined>>

export function validate<T extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
    cb: ValidatorCallback<T>,
    payload: any
) {
    const schema = cb({
        ...v,
        extras,
    })

    return v.parse(schema, payload)
}
