import { Drive } from '../drive/types.js'
import { Strategy } from './types.js'

interface Options {
    getLast: () => number | Promise<number>
    setLast: (last: number) => void | Promise<void>
}

interface Config {
    padSize?: number
}

function pad(value: number, size: number) {
    return `${'0'.repeat(size - 1)}${value}`.slice(-size)
}

export function createIncrementalStrategy(options: Options): Strategy {
    return {
        name: 'increment',
        async create(config?: Config) {
            const padSize = config?.padSize || 2

            const last = await options.getLast()

            const id = last + 1

            await options.setLast(id)

            return pad(id, padSize)
        },
    }
}

export function createIncrementalStategyFromFile(drive: Drive, filename: string): Strategy {
    return createIncrementalStrategy({
        getLast: async () => {
            if (!(await drive.exists(filename))) {
                return 0
            }

            const content = await drive.read(filename)

            const config = JSON.parse(content)

            return Number(config.last_id || 0)
        },
        setLast: async (last: number) => {
            const content = JSON.stringify({ last_id: last }, null, 4)

            await drive.write(filename, content, {
                recursive: true,
            })
        },
    })
}
