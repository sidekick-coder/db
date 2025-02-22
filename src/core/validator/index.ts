import * as v from 'valibot'
import { schema as vars } from './vars.js'

type Valibot = typeof v

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

export type ValibotSchema = v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>

export function validate<T extends ValibotSchema>(cb: ValidatorCallback<T> | T, payload: any) {
    let schema: T

    if (typeof cb === 'function') {
        schema = cb(vWithExtras)
    } else {
        schema = cb
    }

    const { output, issues, success } = v.safeParse(schema, payload)

    if (!success) {
        const error = new Error('Validation failed')
        const details = issues ? v.flatten(issues) : undefined

        Object.assign(error, { details })

        throw error
    }

    return output
}
