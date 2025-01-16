import { createDateStrategy } from './date.js'
import { Strategy } from './types.js'
import { createUuidStrategy } from './uuid.js'

interface Config {
    default_strategy?: string
    strategies?: Strategy[]
}

export function createIdMaker(config?: Config) {
    const default_strategy = config?.default_strategy || 'uuid'
    const strategies = [createUuidStrategy(), createDateStrategy()]

    if (config?.strategies) {
        strategies.push(...config.strategies)
    }

    return async (name?: string, strategyOptions?: any) => {
        const strategy = strategies.find((s) => s.name === (name || default_strategy))

        if (!strategy) {
            throw new Error(`Strategy not found`)
        }

        return strategy.create(strategyOptions)
    }
}
