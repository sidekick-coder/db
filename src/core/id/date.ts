import { Strategy } from './types.js'
import { format } from 'date-fns'

interface Config {
    pattern?: string
}

export function createDateStrategy(): Strategy {
    return {
        name: 'date',
        async create(config: Config) {
            const pattern = config.pattern || 'yyyy-MM-dd'

            return format(new Date(), pattern)
        },
    }
}
