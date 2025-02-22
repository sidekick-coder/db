import * as valibot from 'valibot'
import { schema as vars } from './vars.js'
import { resolve } from 'path'

type Valibot = typeof v

const stringList = valibot.pipe(
    valibot.any(),
    valibot.transform((value) => {
        if (typeof value === 'string') {
            return value.split(',')
        }

        if (Array.isArray(value)) {
            return value
        }
    }),
    valibot.array(valibot.string())
)

function array<T extends ValibotSchema = ValibotSchema>(s: T) {
    return valibot.pipe(
        v.union([v.array(s), s]),
        valibot.transform((value) => (Array.isArray(value) ? value : [value]))
    )
}

function path(dirname: string) {
    return valibot.pipe(
        valibot.string(),
        valibot.transform((value) => resolve(dirname, value))
    )
}

const extras = {
    array,
    vars,
    stringList,
    path,
    number: valibot.pipe(
        valibot.any(),
        valibot.transform(Number),
        valibot.check((n) => !isNaN(n)),
        valibot.number()
    ),
}

export const vWithExtras = {
    ...valibot,
    extras,
}

export const v = vWithExtras

export interface ValibotWithExtras extends Valibot {
    extras: typeof extras
}

export type ValibotSchema = valibot.BaseSchema<unknown, unknown, valibot.BaseIssue<unknown>>

export interface ValidatorCallback<T extends ValibotSchema> {
    (_v: ValibotWithExtras): T
}

export type ValidatorResult<T extends valibot.ObjectEntries> = valibot.InferOutput<
    valibot.ObjectSchema<T, undefined>
>

export function validate<T extends ValibotSchema>(cb: ValidatorCallback<T> | T, payload: any) {
    let schema: T

    if (typeof cb === 'function') {
        schema = cb(vWithExtras)
    } else {
        schema = cb
    }

    const { output, issues, success } = valibot.safeParse(schema, payload)

    if (!success) {
        const error = new Error('Validation failed')
        const flatten = valibot.flatten(issues)
        const details = {
            ...flatten.root,
            ...flatten.nested,
        }

        Object.assign(error, {
            details,
        })

        throw error
    }

    return output
}
