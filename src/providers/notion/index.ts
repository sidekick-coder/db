import { defineProvider } from '@/core/provider/defineProvider.js'
import { DataProvider } from '@/core/provider/types.js'
import { vWithExtras as v } from '@/core/validator/index.js'
import { InferOutput } from 'valibot'

import omit from 'lodash-es/omit.js'
import pick from 'lodash-es/pick.js'
import { merge } from 'lodash-es'
import { toDataItem, toNotionObject } from './parse.js'
import { tryCatch } from '@/utils/tryCatch.js'
import { parseWhere } from './parseWhere.js'

const schema = v.object({
    database_id: v.string(),
    secret_token: v.string(),
})

const paginationSchema = v.object({
    page_size: v.optional(v.extras.number),
    start_cursor: v.optional(v.string()),
})

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

        async function findProperties() {
            const response = await api(`databases/${database_id}`)

            return response.properties
        }

        const list: DataProvider['list'] = async (options) => {
            const where = options?.where
            const exclude = options?.exclude
            const include = options?.include
            const limit = options?.limit || 100
            const cursor = options?.cursor

            const properties = await findProperties()

            const body: any = {
                page_size: limit,
                start_cursor: cursor,
            }

            if (where && Object.keys(where).length) {
                // console.log('notion.where', JSON.stringify(where, null, 2))
                body.filter = parseWhere(where, properties)
                // console.log('notion.filter', JSON.stringify(body.filter, null, 2))
            }

            const { results, has_more, next_cursor, request_id } = await api(
                `databases/${database_id}/query`,
                {
                    method: 'POST',
                    body: JSON.stringify(body),
                }
            )

            let items = [] as any[]

            for (const notionObject of results) {
                const item = toDataItem(notionObject)

                item._raw = notionObject
                item._id = notionObject.id

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
                    has_more,
                    next_cursor,
                    request_id,
                },
                data: items,
            }
        }

        const find: DataProvider['find'] = async (options) => {
            const { data: items } = await list({
                ...options,
                limit: 1,
            })

            return items[0] || null
        }

        const create: DataProvider['create'] = async (options) => {
            const { data } = options

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

        const update: DataProvider['update'] = async (options) => {
            const { data, where } = options
            const page = await list({ where, exclude: [] })
            const items = page.data

            const properties = await findProperties()

            let count = 0

            for await (const item of items) {
                count++

                const notionObject = toNotionObject(data, properties)

                await api(`pages/${item._id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(notionObject),
                })
            }

            //if (page.meta.has_more) {
            //    const nextCount = await update!({
            //        ...options,
            //        cursor: page.meta.next_cursor,
            //    })
            //
            //    count += nextCount.count
            //}

            return { count }
        }

        const destroy: DataProvider['destroy'] = async (options) => {
            const { where } = options
            const { data, meta } = await list({ where, exclude: [] })

            let count = 0

            for await (const item of data) {
                count++

                await api(`pages/${item._id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        archived: true,
                    }),
                })
            }

            //if (meta.has_more) {
            //    const nextCount = await destroy!(options)
            //
            //    count += nextCount.count
            //}

            return { count }
        }

        return {
            list,
            find,
            create,
            update,
            destroy,
            findProperties,
        }
    })
}
