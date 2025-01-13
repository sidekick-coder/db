import { readJson, readYaml } from '@/utils/filesystem.js'
import * as v from 'valibot'
import qs from 'qs'
import { dirname, resolve } from 'path'

type Valibot = typeof v

const vars = v.optional(
    v.pipe(
        v.string(),
        v.transform((value) => {
            if (value.startsWith('@') && value.endsWith('.json')) {
                return readJson(value.replace(/^@/, ''), {
                    transformRelativePaths: true,
                })
            }

            if (value.startsWith('@') && (value.endsWith('.yml') || value.endsWith('.yaml'))) {
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
                return qs.parse(value) as Record<string, any>
            }

            return value
        }),
        v.record(v.string(), v.any())
    )
)

const extras = {
    vars,
}

export const vWithExtras = {
    ...v,
    extras,
}

export interface ValibotWithExtras extends Valibot {
    extras: typeof extras
}

export interface ValidatorCallback<T extends v.ObjectEntries> {
    (_v: ValibotWithExtras): T
}

export type ValidatorResult<T extends v.ObjectEntries> = v.InferOutput<v.ObjectSchema<T, undefined>>

export function validate<T extends v.ObjectEntries>(cb: ValidatorCallback<T>, payload: any) {
    const entries = cb({
        ...v,
        extras,
    })

    const schema = v.object(entries)

    return v.safeParse(schema, payload)
}
