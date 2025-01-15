import * as YAML from './yaml.js'
import { cliui } from '@poppinss/cliui'

export function print(data: any, output?: 'json' | 'yaml') {
    if (output === 'json') {
        console.log(JSON.stringify(data))
        return
    }

    if (output === 'yaml') {
        console.log(YAML.stringify(data))
        return
    }

    const ui = cliui()

    if (Array.isArray(data)) {
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
                row.push(String(item[key] || ''))
            })

            rows.push(row)
        })

        const table = ui.table()

        table.head(header)

        rows.forEach((row) => table.row(row))

        table.render()

        return
    }

    if (typeof data === 'object') {
        const table = ui.table()

        const header = Object.keys(data)

        table.head(header)

        table.row(header.map((key) => String(data[key])))

        table.render()
    }
}
