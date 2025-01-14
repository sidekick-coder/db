import * as v from 'valibot'
import type { Context } from '@sidekick-coder/compositor'
import { ValibotWithExtras } from '@/core/validator/index.js'

export interface BaseContext extends Context {}

export type Valibot = typeof v

export interface Option<T extends v.BaseSchema<any, any, any> = v.BaseSchema<any, any, any>> {
    name: string
    description?: string
    schema?: (v: ValibotWithExtras) => T
}

/* eslint-disable */
export type OptionType<T extends Option> =
    T extends { schema: undefined } ? any :
    v.InferOutput<ReturnType<NonNullable<T['schema']>>>
/* eslint-enable */

export interface OptionRecord<T extends Option = Option> extends Record<string, T> {}

export type OptionRecordType<T extends OptionRecord> = {
    [K in keyof T]: OptionType<T[K]>
}

export interface CommandDefinition {
    name: string
    options: OptionRecord
    run: (ctx: BaseContext) => Promise<any>
}

export interface ExecuteFn<T extends OptionRecord> {
    (ctx: BaseContext & { options: OptionRecordType<T> }): Promise<any>
}
