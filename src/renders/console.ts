import { defineRender } from '@/core/render/defineRender.js'
import Table from 'cli-table3'
import chalk from 'chalk'

function formatValue(value: any) {
    if (typeof value === 'boolean') {
        return value ? chalk.green('true') : chalk.red('false')
    }

    if (typeof value === 'object') {
        return JSON.stringify(value)
    }

    return value
}

function general(output: any = {}) {
    const screenWidth = process.stdout.columns || 80

    const table = new Table({
        wordWrap: true,
        wrapOnWordBoundary: false,
        colWidths: [Math.floor(screenWidth * 0.2), Math.floor(screenWidth * 0.7)],
    })

    for (const key of Object.keys(output)) {
        table.push([key, formatValue(output[key])])
    }

    console.log(table.toString())
}

function list(output: any, columns?: any[]) {
    const screenWidth = (process.stdout.columns || 80) - 6
    const rows = [] as string[][]
    const head: any = []

    if (columns) {
        head.push(...columns)
    }

    if (!columns) {
        output.data
            .map((item: any) => Object.keys(item))
            .flat()
            .filter((value, index, self) => self.indexOf(value) === index)
            .forEach((key) => {
                head.push({
                    label: key,
                    value: key,
                })
            })
    }

    output.data.forEach((item: any) => {
        const row = [] as string[]

        head.forEach((h) => {
            row.push(formatValue(item[h.value]))
        })

        rows.push(row)
    })

    head.forEach((h) => {
        if (h.width) {
            h.width = Number(h.width)
        }

        if (!h.label) {
            h.label = h.value
        }
    })

    const usedWidth = head.filter((h) => !!h.width).reduce((acc, h) => acc + h.width, 0)
    const remainingWidth = 100 - usedWidth
    const withNoWidth = head.filter((h) => !h.width).length

    head.forEach((h) => {
        if (!h.width) {
            h.width = Math.floor(remainingWidth / withNoWidth)
        }
    })

    head.forEach((h) => {
        if (h.width) {
            h.realWidth = Math.floor(screenWidth * (h.width / 100))
        }
    })

    const table = new Table({
        head: head.map((h) => chalk.bold(h.label)),
        style: {
            head: [], //disable colors in header cells
            border: [], //disable colors for the border
        },
        wordWrap: true,
        wrapOnWordBoundary: false,
        colWidths: head.map((h) => h.realWidth),
    })

    table.push(...rows)

    general(output.meta)

    console.log(table.toString())
}

export default defineRender({
    name: 'console',
    render: async ({ method, output, options }) => {
        if (options.format === 'json') {
            console.log(JSON.stringify(output))
            return
        }

        if (method === 'list') {
            return list(output, options.columns)
        }

        if (Array.isArray(output)) {
            return output.forEach((o) => general(o))
        }

        return general(output)
    },
})
