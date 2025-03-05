import { v } from '../validator/valibot.js'

export const schema = () =>
    v.pipe(
        v.record(v.string(), v.any()),
        v.transform((value) => {
            const result = {}

            Object.entries(value).forEach(([k, v]) => {
                if (v === '$undefined') {
                    v = undefined
                }

                result[k] = v
            })

            console.log('result', result)

            return result
        })
    )
