import { readJson, readYaml } from '@/utils/filesystem.js'
import qs from 'qs'
import { dirname, resolve } from 'path'

export function reviver(folder: string) {
    return (_key: any, value: any) => {
        // fix relative paths
        if (typeof value == 'string' && value.startsWith('./')) {
            return resolve(folder, value)
        }

        return value
    }
}

export function transform(value: any) {
    if (typeof value == 'object') {
        return value
    }

    if (value.startsWith('@') && value.endsWith('.json')) {
        const file = value.replace(/^@/, '')
        const folder = dirname(file)

        return readJson(file, {
            reviver: reviver(folder),
        })
    }

    if (value.startsWith('@') && (value.endsWith('.yml') || value.endsWith('.yaml'))) {
        const file = value.replace(/^@/, '')
        const folder = dirname(file)

        return readYaml(value.replace(/^@/, ''), {
            reviver: reviver(folder),
        })
    }

    if (typeof value == 'string' && value.includes('=')) {
        return qs.parse(value) as Record<string, any>
    }

    return value
}
