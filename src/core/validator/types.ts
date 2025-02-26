import { BaseSchema, BaseSchemaAsync, BaseIssue } from 'valibot'

export type ValibotSchema = BaseSchema<unknown, unknown, BaseIssue<unknown>>
export type ValibotSchemaAsync = BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>
