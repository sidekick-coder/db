import { DataItem, Where, WhereCondition } from '@/core/provider/types.js'
import { has, get } from 'lodash-es'

function getOne(value: any, keys: string[]) {
    for (const key of keys) {
        if (has(value, key)) {
            return get(value, key)
        }
    }
}

export function toDataItem(notionObject: any) {
    const result: any = {}

    const entries = Object.entries<any>(notionObject.properties)

    for (const [key, value] of entries) {
        if (value.id === 'title') {
            result[key] = value.title.map((t: any) => t.plain_text).join('')
            continue
        }

        if (value.type === 'status') {
            result[key] = get(value, 'status.name')
            continue
        }

        if (value.type === 'number') {
            result[key] = value.number
            continue
        }

        if (value.type === 'formula') {
            result[key] = getOne(value.formula, ['number', 'string'])
            continue
        }

        if (value.type === 'select') {
            result[key] = get(value, 'select.name')
            continue
        }

        if (value.type === 'multi_select') {
            result[key] = value.multi_select.map((s: any) => s?.name)
            continue
        }

        if (value.type === 'url') {
            result[key] = value.url
            continue
        }

        if (value.type === 'files') {
            result[key] = value.files
            continue
        }

        if (value.type === 'last_edited_time') {
            result[key] = value.last_edited_time
            continue
        }

        if (value.type === 'created_time') {
            result[key] = value.created_time
            continue
        }
    }

    return result
}

export function toNotionObject(itemData: DataItem, properties: any) {
    const result: any = {
        properties: {},
    }

    for (const [key, value] of Object.entries(itemData)) {
        const property = properties[key]

        if (!property) continue

        if (property.type === 'title') {
            result.properties[key] = {
                title: [
                    {
                        type: 'text',
                        text: {
                            content: value,
                        },
                    },
                ],
            }
            continue
        }

        if (property.type === 'status') {
            const options = get(property, 'status.options', [])

            const status = options.find((o: any) => {
                if (o.name === value) return o
                if (o.id === value) return o
            })

            if (!status) continue

            result.properties[key] = {
                status: status,
            }
            continue
        }

        if (property.type === 'number') {
            result.properties[key] = {
                number: Number(value),
            }
            continue
        }

        if (property.type === 'formula') {
            result.properties[key] = {
                formula: value,
            }
            continue
        }

        if (property.type === 'select') {
            result.properties[key] = {
                select: {
                    name: value,
                },
            }
            continue
        }

        if (property.type === 'multi_select') {
            result.properties[key] = {
                multi_select: value.map((s: any) => ({ name: s })),
            }
            continue
        }

        if (property.type === 'url') {
            result.properties[key] = {
                url: value,
            }
            continue
        }

        if (property.type === 'files') {
            result.properties[key] = {
                files: value,
            }
            continue
        }

        if (property.type === 'last_edited_time') {
            result.properties[key] = {
                last_edited_time: value,
            }
            continue
        }

        if (property.type === 'created_time') {
            result.properties[key] = {
                created_time: value,
            }
            continue
        }
    }

    return result
}

function whereConditionToNotionFilter(condition: WhereCondition, properties: any) {
    const property = properties[condition.field]
    const operatorMap = {
        eq: 'equals',
        ne: 'does_not_equal',
        gt: 'greater_than',
        gte: 'greater_than_or_equal_to',
        lt: 'less_than',
        lte: 'less_than_or_equal_to',
        in: 'contains',
        nin: 'does_not_contain',
        like: 'contains',
        nlike: 'does_not_contain',
    }

    const and = [] as any[]
    const or = [] as any[]

    if (condition.operator === 'in') {
        condition.value.forEach((v: any) => {
            or.push({
                property: condition.field,
                [property.type]: {
                    equals: v,
                },
            })
        })

        return { or }
    }

    const operator = operatorMap[condition.operator!]

    if (property.type === 'formula') {
        and.push({
            property: condition.field,
            [property.type]: {
                string: {
                    contains: condition.value,
                },
            },
        })

        return { and }
    }

    and.push({
        property: condition.field,
        [property.type]: {
            [operator]: condition.value,
        },
    })

    return { and }
}

export function toNotionFilter(where: Where, properties: any) {
    const and = [] as any[]
    const or = [] as any[]

    const andConditions = where.and || []

    for (const condition of andConditions) {
        const filter = whereConditionToNotionFilter(condition, properties)

        if (filter?.and?.length === 1 && !filter.or) {
            and.push(filter.and[0])
            continue
        }

        and.push(filter)
    }

    const orConditions = where.or || []

    for (const condition of orConditions) {
        const filter = whereConditionToNotionFilter(condition, properties)

        or.push(filter)
    }

    const result = {}

    if (and.length) {
        result['and'] = and
    }

    if (or.length) {
        result['or'] = or
    }

    if (!Object.keys(result).length) {
        return
    }

    return result
}
