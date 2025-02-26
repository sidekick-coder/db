import { MountDataProvider } from './types.js'

export function defineProvider<T extends MountDataProvider>(payload: T) {
    return payload
}
