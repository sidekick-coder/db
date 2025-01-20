import { defineProvider } from '@/core/provider/defineProvider.js'
import { DataProvider } from '@/core/provider/types.js'
import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'

import omit from 'lodash-es/omit.js'
import pick from 'lodash-es/pick.js'
import { get, has, merge } from 'lodash-es'
import { toDataItem, toNotionObject } from './parse.js'
import { tryCatch } from '@/utils/tryCatch.js'

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

        const api = async (path: string, options: RequestInit = {}) => {
            const defaultOptions = {
                headers: {
                    'Authorization': `Bearer ${secret_token}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json',
                },
            }

            const [response, error] = await tryCatch(async () =>
                fetch(`https://api.notion.com/v1/${path}`, merge(defaultOptions, options))
            )

            if (error) {
                throw error
            }

            const body = await response.json()

            if (!response.ok) {
                console.error(body)
                throw new Error('Notion API error')
            }

            if (body.object === 'error') {
                console.error(body)
                throw new Error('Notion API error')
            }

            return body
        }

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

                if (property.type === 'formula') {
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

        async function findProperties() {
            const response = await api(`databases/${database_id}`)

            return response.properties
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

            const response = await api(`databases/${database_id}/query`, {
                method: 'POST',
                body: JSON.stringify(body),
            })

            const responseBody = await response.json()

            if (!response.ok) {
                console.error(body.filter)
                console.error(responseBody)
                throw new Error('Notion API error')
            }

            let items = [] as any[]

            for (const notionObject of responseBody.results) {
                const item = toDataItem(notionObject)

                item._raw = notionObject

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

        const create: DataProvider['create'] = async (data) => {
            const properties = await findProperties()

            const notionObject = toNotionObject(data, properties)

            notionObject.parent = {
                database_id,
            }

            const response = await api(`pages`, {
                method: 'POST',
                body: JSON.stringify(notionObject),
            })

            return toDataItem(response)
        }

        // const update: DataProvider['update'] = async (data, where) => {}

        // const destroy: DataProvider['destroy'] = async (where) => {}

        return {
            list,
            create,
        }
    })
}
