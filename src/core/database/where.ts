import { vWithExtras as v } from '../validator/index.js'

export function transformWhere(where: any) {
    const { and, or, ...rest } = where

    const result: any = {
        and: [],
        or: [],
    }

    if (rest?.field && rest?.operator) {
        return {
            field: rest.field,
            operator: rest.operator,
            value: rest.value,
        }
    }

    for (const [key, value] of Object.entries<any>(rest)) {
        result.and.push({
            field: value?.field || key,
            operator: value?.operator || 'eq',
            value: value?.value || value,
        })
    }

    if (and?.length) {
        and.forEach((w: any) => {
            result.and.push(transformWhere(w))
        })
    }

    if (or?.length) {
        or.forEach((w: any) => {
            result.or.push(transformWhere(w))
        })
    }

    // if (result.and.length === 1 && !result.or.length) {
    //     return result.and[0]
    // }

    if (!result.or.length) {
        delete result.or
    }

    if (!result.and.length) {
        delete result.and
    }

    return result
}

export const schema = v.pipe(v.any(), v.transform(transformWhere))
