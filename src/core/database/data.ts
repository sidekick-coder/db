import { v } from '../validator/valibot.js'

export const schema = () =>
    v.pipe(
        v.record(v.string(), v.any()),
        v.transform((value) => {
            const result: Record<string, any> = {}

            Object.entries(value).forEach(([k, v]) => {
                if (v === '$undefined') {
                    v = undefined
                }

                result[k] = v
            })

            return result
        })
    )
