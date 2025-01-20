import crypto from 'crypto'
import { Strategy } from './types.js'

export function createUuidStrategy(): Strategy {
    return {
        name: 'uuid',
        async create() {
            return crypto.randomUUID()
        },
    }
}
