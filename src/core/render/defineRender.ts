export interface RenderParams {
    method: string
    output: any
    options: any
    config: any
}

export interface Render {
    name: string
    render: (params: RenderParams) => Promise<any> | any
}

export function defineRender(render: Render) {
    return render
}
