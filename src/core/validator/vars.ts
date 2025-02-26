import * as v from 'valibot'
import { dirname, resolve } from 'path'
import { filesystem } from '@/utils/filesystem.js'
import qs from 'qs'

function createReviver(folder: string) {
    return (_: string, value: any) => {
        if (typeof value == 'string' && value.startsWith('./')) {
            return resolve(dirname(folder), value)
        }

        return value
    }
}

export const schema = v.optional(
    v.pipe(
        v.any(),
        v.transform((value) => {
            if (typeof value == 'object') {
                return value
            }

            if (/\.yml$/.test(value)) {
                const file = value.replace(/^@/, '')
                const folder = dirname(file)

                return filesystem.readSync.yaml(value.replace(/^@/, ''), {
                    reviver: createReviver(folder),
                })
            }

            if (typeof value == 'string' && value.includes('=')) {
                const result = qs.parse(value, { allowEmptyArrays: true })

                return result as Record<string, any>
            }

            if (typeof value == 'string' && value.startsWith('{')) {
                return JSON.parse(value)
            }

            if (typeof value == 'string' && value.startsWith('[')) {
                return JSON.parse(value)
            }

            return value
        }),
        v.record(v.string(), v.any())
    )
)
