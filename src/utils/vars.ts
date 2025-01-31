import fs from 'fs'
import { where } from '@/core/api/schemas.js'
import { validate } from '@/core/validator/index.js'
import { mergeWith } from 'lodash-es'
import { YAML } from '@/core/parsers/yaml.js'
import fg from 'fast-glob'

export function parseFile(filename: string) {
    const extensions = ['.yml', '.yaml', '.json']

    if (extensions.some((ext) => filename.endsWith(`*${ext}`))) {
        const pattern = fg.convertPathToPattern(filename)

        const files = fg.sync(pattern)

        return files.map((file) => parseFile(file))
    }

    const contents = fs.readFileSync(filename, 'utf-8')

    const reviver = (key, value) => {
        if (typeof value == 'string' && extensions.some((ext) => value.endsWith(ext))) {
            return parseFile(value)
        }

        return value
    }

    if (filename.endsWith('.json')) {
        return JSON.parse(contents, reviver)
    }

    if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
        return YAML.parse(contents, reviver)
    }

    return contents
}

export function parseVars(payload: any) {
    const items = Array.isArray(payload) ? payload : [payload]

    if (!items.length) {
        return {}
    }

    let result = {}

    items.forEach((item) => {
        const vars = validate((v) => v.extras.vars, item)

        result = mergeWith(result, vars, (objValue, srcValue) => {
            if (Array.isArray(objValue)) {
                return objValue.concat(srcValue)
            }
        })
    })

    return result
}

export function parseWhere(payload: any) {
    const record = parseVars(payload)

    return validate(() => where, record)
}

