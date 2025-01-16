import { YAML } from './yaml.js'

function parse(contents: string) {
    let body = contents
    const result: any = {}

    if (contents.startsWith('---')) {
        const [, frontmatter, rest] = contents.split('---')

        Object.assign(result, YAML.parse(frontmatter))

        body = rest.trim()
    }

    result['body'] = body || ''

    return result
}

function stringify(data: any) {
    const { body, ...properties } = data

    let result = ''

    if (properties && Object.keys(properties).length) {
        result += `---\n${YAML.stringify(properties)}---\n`
    }

    if (body) {
        result += body
    }

    return result
}

export const MD = {
    parse,
    stringify,
}
