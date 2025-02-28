import * as valibot from 'valibot'
import { schema as vars } from './vars.js'
import { resolve } from 'path'
import * as inquirer from '@inquirer/prompts'
import type { ValibotSchema } from './types.js'
import { FilesystemOptionsPath } from '../filesystem/types.js'
import { createPathNode } from '../filesystem/createPathNode.js'

export type Valibot = typeof valibot

export interface ValibotWithExtras extends Valibot {
    extras: typeof extras
}

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

function path(dirname: string, path: FilesystemOptionsPath = createPathNode()) {
    return valibot.pipe(
        valibot.string(),
        valibot.transform((value) => path.resolve(dirname, value))
    )
}

function uint8() {
    return valibot.pipe(
        valibot.any(),
        valibot.check((value) => value instanceof Uint8Array),
        valibot.transform((value) => value as Uint8Array)
    )
}

const prompts = {
    password: (options?: any) =>
        valibot.optionalAsync(valibot.string(), () => {
            return inquirer.password({
                message: 'Enter password',
                ...options,
            })
        }),
}

const extras = {
    array,
    vars,
    stringList,
    path,
    uint8,
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
    prompts,
}

export const v = vWithExtras
