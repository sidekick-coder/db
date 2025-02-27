import { describe, it, expect } from 'vitest'
import { query } from './queryArray.js'

describe('query', () => {
    it('should filter', () => {
        const data = [
            { name: 'John', age: 30 },
            { name: 'Jane', age: 25 },
            { name: 'Doe', age: 30 },
        ]

        const where = {
            name: 'John',
        }

        const result = query(data, { where })

        expect(result).toEqual([{ name: 'John', age: 30 }])
    })

    it('shoud filter with "and" operator', () => {
        const data = [
            { name: 'John', age: 30, job: 'developer' },
            { name: 'Jane', age: 25, job: 'developer' },
            { name: 'Doe', age: 30, job: 'developer' },
        ]

        const where = {
            and: [{ age: 30 }, { job: 'developer' }],
        }

        const result = query(data, { where })

        expect(result).toEqual([
            { name: 'John', age: 30, job: 'developer' },
            { name: 'Doe', age: 30, job: 'developer' },
        ])
    })

    it('shoud filter with "or" operator', () => {
        const data = [
            { name: 'John', age: 31, job: 'developer' },
            { name: 'Doe', age: 30, job: 'developer' },
            { name: 'Jane', age: 25, job: 'design' },
        ]

        const where = {
            or: [{ age: 31 }, { job: 'design' }],
        }

        const result = query(data, { where })

        expect(result).toEqual([
            { name: 'John', age: 31, job: 'developer' },
            { name: 'Jane', age: 25, job: 'design' },
        ])
    })

    it('shoud filter with "and" and "or" operator', () => {
        const data = [
            { name: 'John', age: 20, job: 'developer' },
            { name: 'Doe', age: 30, job: 'developer' },
            { name: 'Jane', age: 30, job: 'design' },
        ]

        const where = {
            and: [{ age: 30 }, { or: [{ job: 'developer' }, { job: 'design' }] }],
        }

        const result = query(data, { where })

        expect(result).toEqual([
            { name: 'Doe', age: 30, job: 'developer' },
            { name: 'Jane', age: 30, job: 'design' },
        ])
    })

    it.each([{ age: { operator: 'gt', value: 25 } }, { field: 'age', operator: 'gt', value: 25 }])(
        'should filter using operator %o',
        (where) => {
            const data = [
                { name: 'John', age: 20 },
                { name: 'Jane', age: 25 },
                { name: 'Doe', age: 30 },
            ]

            const result = query(data, { where })

            expect(result).toEqual([{ name: 'Doe', age: 30 }])
        }
    )

    it('should filter with complex query 1', () => {
        const data = [
            { title: 'Todo 1', status: 'done' },
            { title: 'Todo 1', status: 'in_progress' },
            { title: 'Todo 4', status: 'todo' },
            { title: 'Todo 5' },
        ]

        const where = {
            or: [
                { status: 'todo' },
                { status: 'in_progress' },
                { field: 'status', operator: 'exists', value: false },
            ],
        }

        const result = query(data, { where })

        expect(result).toEqual([
            { title: 'Todo 1', status: 'in_progress' },
            { title: 'Todo 4', status: 'todo' },
            { title: 'Todo 5' },
        ])
    })
})
