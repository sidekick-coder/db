import { where } from "@/core/api/schemas.js"
import { validate } from "@/core/validator/index.js"
import { mergeWith } from "lodash-es"

export function parseVars(payload: any){
    let items = Array.isArray(payload) ? payload : [payload]

    if (!items.length) {
        return {}
    }

    let result = {}

    items.forEach((item) => {
        const vars = validate(v => v.extras.vars, item)

        result = mergeWith(result, vars, (objValue, srcValue) => {
            if (Array.isArray(objValue)) {
                return objValue.concat(srcValue)
            }
        })
    })

    return result
}

export function parseWhere(payload: any){
    const record = parseVars(payload)

    return validate(() => where, record)
}