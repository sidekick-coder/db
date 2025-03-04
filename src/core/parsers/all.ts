import { MD } from './markdown.js'
import { YAML } from './yaml.js'

export interface Parser {
    name: string
    ext: string
    parse: (data: string) => any
    stringify: (data: any) => string
}

export const parsers = [] as Parser[]

export const json: Parser = {
    name: 'json',
    ext: 'json',
    parse: JSON.parse,
    stringify: (contents) => JSON.stringify(contents, null, 4),
}

parsers.push({
    name: 'json',
    ext: 'json',
    parse: JSON.parse,
    stringify: (contents) => JSON.stringify(contents, null, 4),
})

parsers.push({
    name: 'markdown',
    ext: 'md',
    parse: MD.parse,
    stringify: (contents) => MD.stringify(contents),
})

parsers.push({
    name: 'yaml',
    ext: 'yaml',
    parse: YAML.parse,
    stringify: (contents) => YAML.stringify(contents, null, 4),
})

parsers.push({
    name: 'yml',
    ext: 'yml',
    parse: YAML.parse,
    stringify: (contents) => YAML.stringify(contents, null, 4),
})
