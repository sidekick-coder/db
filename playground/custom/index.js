export default (config) => ({
    list() {
        return {
            meta: config,
            data: [
                {
                    id: 1,
                    name: 'Dummy item',
                },
            ],
        }
    },
})
