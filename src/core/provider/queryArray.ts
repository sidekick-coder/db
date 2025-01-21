import sift from 'sift'
import { Where, WhereCondition } from './types.js'
import { transformWhere } from '../api/schemas.js'

const operatorMap = {
    eq: '$eq',
    ne: '$ne',
    gt: '$gt',
    gte: '$gte',
    lt: '$lt',
    lte: '$lte',
    in: '$in',
    exists: '$exists',
}

function parseCondition(condition: WhereCondition) {
    const { field, operator, value } = condition

    if (!field || !operator) {
        console.error('Invalid condition:', condition)
        return {}
    }

    const siftOperator = operatorMap[operator!]

    if (!siftOperator) {
        throw new Error(`Unsupported operator: ${operator}`)
    }

    return {
        [field]: {
            [siftOperator]: value,
        },
    }
}

function parseGroup(group: any) {
    const { and, or, ...rest } = group

    const parsed: any = {}

    if (rest?.field && rest?.operator) {
        return parseCondition(rest)
    }

    if (and?.length) {
        parsed.$and = and.map(parseGroup)
    }

    if (or?.length) {
        parsed.$or = or.map(parseGroup)
    }

    return parsed
}

function parseWhere(payload: Where) {
    if (!payload) return {}

    const transformed = transformWhere(payload)

    const parsed = parseGroup(transformed)

    if (!parsed.$and?.length) {
        delete parsed.$and
    }

    if (!parsed.$or?.length) {
        delete parsed.$or
    }

    return parsed
}

export function queryArray(data: any[], where: Where) {
    const siftQuery = parseWhere(where)

    // @ts-ignore
    return data.filter(sift(siftQuery))
}
