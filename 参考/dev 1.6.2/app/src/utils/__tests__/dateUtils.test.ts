import { describe, it, expect } from 'vitest'
import { formatDate } from '../dateUtils'

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('应该格式化有效的ISO日期字符串', () => {
      const result = formatDate('2024-01-15T10:30:00Z')

      // 验证包含年月日时分
      expect(result).toContain('2024')
      expect(result).toContain('1月')
      expect(result).toContain('15')
    })

    it('应该处理空字符串', () => {
      expect(formatDate('')).toBe('')
    })

    it('应该返回原字符串对于无效日期', () => {
      const invalidDate = 'invalid-date'
      expect(formatDate(invalidDate)).toBe(invalidDate)
    })

    it('应该格式化不同的日期', () => {
      const result = formatDate('2023-12-25T15:45:30Z')

      expect(result).toContain('2023')
      expect(result).toContain('12月')
      expect(result).toContain('25')
    })

    it('应该使用中文格式', () => {
      const result = formatDate('2024-06-01T12:00:00Z')

      // 应该包含中文"月"
      expect(result).toContain('月')
    })
  })
})
