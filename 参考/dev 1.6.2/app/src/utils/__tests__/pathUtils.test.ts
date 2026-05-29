import { describe, it, expect } from 'vitest'
import { getDataByPath, setDataByPath } from '../pathUtils'

describe('pathUtils', () => {
  describe('getDataByPath', () => {
    it('应该获取顶层属性', () => {
      const obj = { name: 'test', value: 42 }
      expect(getDataByPath(obj, 'name')).toBe('test')
      expect(getDataByPath(obj, 'value')).toBe(42)
    })

    it('应该获取嵌套属性', () => {
      const obj = {
        user: {
          profile: {
            name: 'John',
            age: 30,
          },
        },
      }

      expect(getDataByPath(obj, 'user.profile.name')).toBe('John')
      expect(getDataByPath(obj, 'user.profile.age')).toBe(30)
    })

    it('应该返回undefined对于不存在的路径', () => {
      const obj = { name: 'test' }
      expect(getDataByPath(obj, 'nonexistent')).toBeUndefined()
      expect(getDataByPath(obj, 'name.nested')).toBeUndefined()
    })

    it('应该处理null和undefined', () => {
      expect(getDataByPath(null, 'path')).toBeUndefined()
      expect(getDataByPath(undefined, 'path')).toBeUndefined()
    })

    it('应该处理数组', () => {
      const obj = {
        items: ['a', 'b', 'c'],
      }

      expect(getDataByPath(obj, 'items.0')).toBe('a')
      expect(getDataByPath(obj, 'items.1')).toBe('b')
    })

    it('应该处理深层嵌套', () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep',
              },
            },
          },
        },
      }

      expect(getDataByPath(obj, 'level1.level2.level3.level4.value')).toBe('deep')
    })
  })

  describe('setDataByPath', () => {
    it('应该设置顶层属性', () => {
      const obj: Record<string, unknown> = {}
      setDataByPath(obj, 'name', 'test')

      expect(obj.name).toBe('test')
    })

    it('应该设置嵌套属性', () => {
      const obj: Record<string, unknown> = {}
      setDataByPath(obj, 'user.profile.name', 'John')

      expect(obj).toEqual({
        user: {
          profile: {
            name: 'John',
          },
        },
      })
    })

    it('应该覆盖现有值', () => {
      const obj: Record<string, unknown> = { name: 'old' }
      setDataByPath(obj, 'name', 'new')

      expect(obj.name).toBe('new')
    })

    it('应该创建中间对象', () => {
      const obj: Record<string, unknown> = {}
      setDataByPath(obj, 'a.b.c.d', 'value')

      expect(obj).toEqual({
        a: {
          b: {
            c: {
              d: 'value',
            },
          },
        },
      })
    })

    it('应该处理已存在的部分路径', () => {
      const obj: Record<string, unknown> = {
        user: {
          name: 'John',
        },
      }

      setDataByPath(obj, 'user.age', 30)

      expect(obj).toEqual({
        user: {
          name: 'John',
          age: 30,
        },
      })
    })

    it('应该替换非对象的中间值', () => {
      const obj: Record<string, unknown> = {
        user: 'string',
      }

      setDataByPath(obj, 'user.profile.name', 'John')

      expect(obj).toEqual({
        user: {
          profile: {
            name: 'John',
          },
        },
      })
    })

    it('应该设置不同类型的值', () => {
      const obj: Record<string, unknown> = {}

      setDataByPath(obj, 'string', 'text')
      setDataByPath(obj, 'number', 42)
      setDataByPath(obj, 'boolean', true)
      setDataByPath(obj, 'null', null)
      setDataByPath(obj, 'array', [1, 2, 3])

      expect(obj).toEqual({
        string: 'text',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
      })
    })
  })
})
