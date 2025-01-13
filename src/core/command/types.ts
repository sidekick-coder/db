import * as v from 'valibot'
import type { Context } from '@sidekick-coder/compositor'

export interface BaseContext extends Context {
    args: Record<string, any>
    flags: Record<string, any>
}

export type Valibot = typeof v

export interface Option<T extends v.BaseSchema<any, any, any> = v.BaseSchema<any, any, any>> {
    name: string
    description?: string
    schema?: (v: Valibot) => T
}

/* eslint-disable */
export type OptionType<T extends Option> =
    T extends { schema: (v: Valibot) => v.BaseSchema<infer R, any, any> } ? R :
    T extends { schema: (v: Valibot) => v.BaseSchema<any, infer R, any> } ? R :
    T extends { schema: (v: Valibot) => v.BaseSchema<any, any, infer R> } ? R :
    any
/* eslint-enable */
export interface Arg extends Option {}

export interface Flag extends Option {
    alias: string[]
}

export interface OptionRecord<T extends Option = Option> extends Record<string, T> {}

export type OptionRecordType<T extends OptionRecord<Option>> = {
    [K in keyof T]: OptionType<T[K]>
}

export interface CommandDefinition {
    name: string
    args: OptionRecord<Arg>
    flags: OptionRecord<Flag>
    run: (ctx: BaseContext) => Promise<any>
}

export interface ExecuteFn<A extends OptionRecord<Arg>, F extends OptionRecord<Flag>> {
    (ctx: BaseContext & { args: OptionRecordType<A>; flags: OptionRecordType<F> }): Promise<any>
}
