import { parse as baseParse, stringify as baseStringify } from 'yaml'

const parse = baseParse

const stringify = baseStringify

export const YAML = {
    parse,
    stringify,
}
