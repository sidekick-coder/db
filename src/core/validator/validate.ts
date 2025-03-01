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

export type ValidatePayload<T extends ValibotSchema = ValibotSchema> = ValidatorCallback<T> | T

/*  eslint-disable prettier/prettier */
export type ValidateResult<T extends ValidatePayload> =
    T extends ValibotSchema ? InferOutput<T> :
    T extends ValidatorCallback<infer U> ? InferOutput<U> :
    unknown
/*  eslint-enable prettier/prettier */

export function validate<T extends ValibotSchema>(cb: ValidatePayload<T>, payload: any) {
    const schema: T = typeof cb === 'function' ? cb(v) : cb

    const { output, issues, success } = v.safeParse(schema, payload)

    if (!success) {
        const flatten = v.flatten(issues)
        const messages = [] as string[]

        if (flatten.root) {
            messages.push(...flatten.root)
        }

        if (flatten.nested) {
            Object.entries(flatten.nested).forEach(([key, value]) => {
                messages.push(...value.map((v) => `${key}: ${v}`))
            })
        }

        const message = messages.length ? messages.join(', ') : 'Validation failed'

        const error = new Error(message)

        error.name = 'ValidationError'

        Object.assign(error, {
            messages,
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
