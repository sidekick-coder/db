import { it } from 'vitest'
import { DataProvider } from '@/core/provider/index.js'

export function testUpdate(update: DataProvider['update']) {
    it.todo('should update an item in the database')

    it.todo('should not remove previous properties if not included in update')

    it.todo('should update multiple items in the database')

    it.todo('should not update any items if none match where clause')
}
