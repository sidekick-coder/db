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

const dateOperatorsMap = {
    eq: 'equals',
    ne: 'does_not_equal',
    gt: 'after',
    gte: 'on_or_after',
    lt: 'before',
    lte: 'on_or_before',
}

export function parseWhere(where: any, properties: any) {
    const { and, or, ...rest } = where
    const property = properties[rest.field]

    const result: any = {
        and: [],
        or: [],
    }

    if (rest.operator === 'in') {
        const or = rest.value.map((v: any) => ({
            property: rest.field,
                [property.type]: {
                    equals: v,
                },
        }))
            

        return {
            or
        }
    }

    if (rest.operator === 'exists') {
        return { 
            property: rest.field,
            [property.type]: {
                is_not_empty: rest.value ? true : undefined,
                is_empty: rest.value ? undefined : true,
            },
        }
    }
    
    if (property?.type === 'formula') {
        return { 
            property: rest.field,
            [property.type]: {
                string: {
                    contains: rest.value,
                },
            },
        }
    }

    if (property && rest?.field && rest?.operator) {
        const notionOperator = dateOperatorsMap[rest.operator] || 'equals'
        return {
            property: rest.field,
            [property.type]: {
                [notionOperator]: rest.value,
            },
        }
    }

    
    if (and?.length) {
        and.forEach((w: any) => {
            result.and.push(parseWhere(w, properties))
        })
    }

    if (or?.length) {
        or.forEach((w: any) => {
            result.or.push(parseWhere(w, properties))
        })
    }   

    if (result.and.length === 1 && !result.or.length) {
        return result.and[0]
    }

    if (!result.or.length) {
        delete result.or
    }

    if (!result.and.length) {
        delete result.and 
    }

    return result
}