import { defineProvider } from '@/core/provider/defineProvider.js'
import { DataProvider } from '@/core/provider/types.js'
import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'

import omit from 'lodash-es/omit.js'
import pick from 'lodash-es/pick.js'
import { get, has } from 'lodash-es'

const schema = v.object({
    database_id: v.string(),
    secret_token: v.string(),
})

const paginationSchema = v.object({
    page_size: v.optional(v.extras.number),
    start_cursor: v.optional(v.string()),
})

function getOne(value: any, keys: string[]) {
    for (const key of keys) {
        if (has(value, key)) {
            return get(value, key)
        }
    }
}

export interface NotionProviderConfig extends InferOutput<typeof schema> {}

export function createNotionProvider() {
    return defineProvider((config: any) => {
        const { secret_token, database_id } = v.parse(schema, config)

        function convertWhere(where: any, properties: any) {
            const and = [] as any
            const or = [] as any

            for (const [key, value] of Object.entries(where)) {
                const property = properties[key]

                if (!property) continue

                if (property.type === 'title') {
                    and.push({
                        property: key,
                        rich_text: {
                            equals: value,
                        },
                    })

                    continue
                }
            }

            return {
                and,
                or,
            }
        }

        function convertSort(sort: any) {
            return sort
        }

        function convertItem(item: any) {
            const result: any = {}

            result.id = item.id

            for (const [key, value] of Object.entries<any>(item.properties)) {
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

        async function findProperties() {
            const response = await fetch(`https://api.notion.com/v1/databases/${database_id}`, {
                headers: {
                    'Authorization': `Bearer ${secret_token}`,
                    'Notion-Version': '2022-06-28',
                },
            })

            const body = await response.json()

            return body.properties
        }

        const list: DataProvider['list'] = async (options) => {
            const pagination = v.parse(paginationSchema, options?.pagination || {})
            const where = options?.where
            const exclude = options?.exclude
            const include = options?.include

            const properties = await findProperties()

            const body: any = {
                page_size: pagination.page_size,
                start_cursor: pagination.start_cursor,
            }

            if (where) {
                body.filter = convertWhere(where, properties)
            }

            const response = await fetch(
                `https://api.notion.com/v1/databases/${database_id}/query`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${secret_token}`,
                        'Notion-Version': '2022-06-28',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                }
            )

            const responseBody = await response.json()

            let items = [] as any[]

            for (const file of responseBody.results) {
                const item = convertItem(file)

                item._raw = file

                items.push(item)
            }

            if (include?.length) {
                items = items.map((item) => pick(item, include))
            }

            if (exclude?.length && !include?.length) {
                items = items.map((item) => omit(item, exclude))
            }

            // exclude properties with underscore
            if (items.length && !include && !exclude) {
                const keys = Object.keys(items[0]).filter((k) => k !== '_id' && k.startsWith('_'))

                items = items.map((item) => omit(item, keys))
            }

            return {
                meta: {
                    has_more: responseBody.has_more,
                    next_cursor: responseBody.next_cursor,
                    request_id: responseBody.request_id,
                },
                data: items,
            }
        }

        // const find: DataProvider['find'] = async (where, field) => {}

        // const create: DataProvider['create'] = async (data) => {}

        // const update: DataProvider['update'] = async (data, where) => {}

        // const destroy: DataProvider['destroy'] = async (where) => {}

        return {
            list,
        }
    })
}
