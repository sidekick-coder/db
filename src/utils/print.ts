import * as YAML from './yaml.js'
import Table from 'cli-table3'

function parse(value: any) {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value)
    }

    if (value === undefined) {
        return ''
    }

    if (Array.isArray(value)) {
        return JSON.stringify(value)
    }

    if (typeof value === 'object') {
        return JSON.stringify(value)
    }

    return value
}

interface Options {
    format?: 'json' | 'yaml'
    vertical?: boolean
}

function printTableVertical(data: any[]) {
    const screenWidth = process.stdout.columns || 80

    for (const item of data) {
        const table = new Table({
            wordWrap: true,
            wrapOnWordBoundary: false,
            colWidths: [Math.floor(screenWidth * 0.2), Math.floor(screenWidth * 0.7)],
        })

        for (const key of Object.keys(item)) {
            table.push([key, parse(item[key])])
        }

        console.log(table.toString())
    }
}

function printList(data: any[]) {
    const header = [] as string[]
    const rows = [] as string[][]

    data.forEach((item) => {
        Object.keys(item).forEach((key) => {
            if (!header.includes(key)) {
                header.push(key)
            }
        })

        const row = [] as string[]

        header.forEach((key) => {
            row.push(parse(item[key]))
        })

        rows.push(row)
    })

    const screenWidth = process.stdout.columns ? process.stdout.columns - 5 : 80

    const table = new Table({
        head: header,
        wordWrap: true,
        wrapOnWordBoundary: false,
        colWidths: new Array(header.length).fill(Math.floor(screenWidth / header.length)),
        rowHeights: [2],
    })

    rows.forEach((row) => table.push(row))

    console.log(table.toString())
}

export function print(data: any, options?: Options) {
    const output = options?.format || 'table'

    if (output === 'json') {
        console.log(JSON.stringify(data))
        return
    }

    if (output === 'yaml') {
        console.log(YAML.stringify(data))
        return
    }

    if (Array.isArray(data) && options?.vertical) {
        return printTableVertical(data)
    }

    if (Array.isArray(data)) {
        return printList(data)
    }

    if (typeof data === 'object') {
        const screenWidth = process.stdout.columns || 80

        const table = new Table({
            wordWrap: true,
            wrapOnWordBoundary: false,
            colWidths: [Math.floor(screenWidth * 0.2), Math.floor(screenWidth * 0.7)],
        })

        for (const key of Object.keys(data || {})) {
            table.push([key, parse(data[key])])
        }

        console.log(table.toString())
    }
}
