import { v } from './valibot.js'
import { InferOutput, ObjectSchema, ObjectEntries } from 'valibot'
import type { ValibotSchema, ValibotSchemaAsync } from './types.js'

export interface ValidatorCallback<T extends ValibotSchema> {
    (_v: typeof v): T
}

export type ValidatorCallbackAsync<T extends ValibotSchemaAsync> = {
    (_v: typeof v): T
}

export type ValidatorResult<T extends ObjectEntries> = InferOutput<ObjectSchema<T, undefined>>

export function validate<T extends ValibotSchema>(cb: ValidatorCallback<T> | T, payload: any) {
    const schema: T = typeof cb === 'function' ? cb(v) : cb

    const { output, issues, success } = v.safeParse(schema, payload)

    if (!success) {
        const error = new Error('Validation failed')
        const flatten = v.flatten(issues)
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

validate.async = async function <T extends ValibotSchemaAsync>(
    cb: ValidatorCallbackAsync<T> | T,
    payload: any
) {
    let schema: T

    if (typeof cb === 'function') {
        schema = cb(v)
    } else {
        schema = cb
    }

    const { output, issues, success } = await v.safeParseAsync(schema, payload)

    if (!success) {
        const error = new Error('Validation failed')
        const flatten = v.flatten(issues)
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
