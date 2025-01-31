import { Render, RenderParams } from './defineRender.js'

interface Options {
    renders: Render[]
}
export function createRenderer(options: Options) {
    return (name: string, payload: RenderParams) => {
        const render = options.renders.find((r) => r.name === name)

        if (!render) {
            throw new Error(`Render "${name}" not found`)
        }

        return render.render(payload)
    }
}
