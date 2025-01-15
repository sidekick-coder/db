import sift from 'sift'
import { Where, WhereCondition } from './types.js'

const operatorMap = {
    '=': '$eq',
    '!=': '$ne',
    '>': '$gt',
    '>=': '$gte',
    '<': '$lt',
    '<=': '$lte',
    'in': '$in',
}

function parseCondition(condition: WhereCondition) {
    const key = Object.keys(condition)[0]
    const value = condition[key]

    if (typeof value === 'object' && 'operator' in value && 'value' in value) {
        const siftOperator = operatorMap[value.operator]
        if (!siftOperator) {
            throw new Error(`Unsupported operator: ${value.operator}`)
        }
        return { [key]: { [siftOperator]: value.value } }
    }

    return { [key]: value }
}

function parseGroup(group: any) {
    if ('and' in group) {
        return {
            $and: group.and.map(parseGroup),
        }
    }

    if ('or' in group) {
        return {
            $or: group.or.map(parseGroup),
        }
    }

    return parseCondition(group)
}

function parseWhere(whereClause: Where) {
    if (!whereClause) return {}

    return parseGroup(whereClause)
}

export function queryArray(data: any[], where: Where) {
    const siftQuery = parseWhere(where)

    // @ts-ignore
    return data.filter(sift(siftQuery))
}
