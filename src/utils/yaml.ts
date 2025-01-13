import { parse as baseParse, stringify as baseStringify } from 'yaml'

export function parse(xml: string): Document {
    return baseParse(xml)
}

export function stringify(doc: any): string {
    return baseStringify(doc)
}
