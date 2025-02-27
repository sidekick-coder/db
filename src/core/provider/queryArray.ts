import sift from 'sift'
import { Where, WhereCondition } from './types.js'
import { transformWhere } from '@/core/database/where.js'
import { omit, pick } from 'lodash-es'

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

interface Options {
    where?: Where
    include?: string[]
    exclude?: string[]
    limit?: number
    offset?: number
}

export function query(data: any[], options?: Options) {
    const { where, include, exclude } = options

    const limit = options.limit || 20
    const offset = options.offset || 0
    const siftQuery = parseWhere(where)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let items = data.filter(sift(siftQuery))

    if (include?.length) {
        items = items.map((item) => pick(item, options.include))
    }

    if (exclude?.length && !options.include.length) {
        items = items.map((item) => omit(item, exclude))
    }

    items = items.slice(offset, offset + limit)

    return items
}

export function count(data: any[], options: Pick<Options, 'where'>) {
    const items = query(data, { where: options.where })

    return items.length
}
