import crypto from 'crypto'
import { Strategy } from './types.js'

export function createUuidStrategy(): Strategy {
    return {
        name: 'uuid',
        create() {
            return crypto.randomUUID()
        },
    }
}
