import crypto from 'crypto'
import { Strategy } from './types.js'

export function createUuid(): Strategy {
    return {
        name: 'uuid',
        async create() {
            return crypto.randomUUID()
        },
    }
}
