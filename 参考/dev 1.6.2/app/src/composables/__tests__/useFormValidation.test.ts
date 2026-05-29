// @ts-nocheck
import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useFormValidation } from '../form/useFormValidation'

// Mock 依赖
vi.mock('../../utils/sanitize', () => ({
  validateAndSanitize: vi.fn((input: string, maxLength: number) => ({
    isValid: input.length <= maxLength && !input.includes('<script>'),
    sanitized: input.replace(/<script>/g, ''),
    errors: input.includes('<script>') ? ['包含不安全内容'] : [],
  })),
}))

vi.mock('../../utils/typeGuards/index', () => ({
  isValidNumber: (value: unknown): value is number => typeof value === 'number' && !isNaN(value),
  isNonNegativeInteger: (value: unknown): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value >= 0,
  isNonEmptyString: (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0,
}))

describe('useFormValidation', () => {
  describe('验证规则创建器', () => {
    describe('required', () => {
      it('应该验证非空字符串', () => {
        const { required } = useFormValidation()
        const rule = required()

        expect(rule.validator('hello')).toBe(true)
        expect(rule.validator('')).toBe(false)
        expect(rule.validator('  ')).toBe(false)
      })

      it('应该验证非 null/undefined 值', () => {
        const { required } = useFormValidation()
        const rule = required()

        expect(rule.validator(0)).toBe(true)
        expect(rule.validator(false)).toBe(true)
        expect(rule.validator(null)).toBe(false)
        expect(rule.validator(undefined)).toBe(false)
      })

      it('应该使用自定义错误消息', () => {
        const { required } = useFormValidation()
        const rule = required('请输入内容')

        expect(rule.message).toBe('请输入内容')
      })

      it('应该使用默认错误消息', () => {
        const { required } = useFormValidation()
        const rule = required()

        expect(rule.message).toBe('此项为必填项')
      })
    })

    describe('minLength', () => {
      it('应该验证最小长度', () => {
        const { minLength } = useFormValidation()
        const rule = minLength(5)

        expect(rule.validator('hello')).toBe(true)
        expect(rule.validator('hi')).toBe(false)
      })

      it('应该只接受字符串', () => {
        const { minLength } = useFormValidation()
        const rule = minLength(5)

        expect(rule.validator(12345)).toBe(false)
        expect(rule.validator(null)).toBe(false)
      })

      it('应该使用自定义错误消息', () => {
        const { minLength } = useFormValidation()
        const rule = minLength(5, '太短了')

        expect(rule.message).toBe('太短了')
      })

      it('应该使用默认错误消息', () => {
        const { minLength } = useFormValidation()
        const rule = minLength(5)

        expect(rule.message).toBe('最少需要 5 个字符')
      })
    })

    describe('maxLength', () => {
      it('应该验证最大长度', () => {
        const { maxLength } = useFormValidation()
        const rule = maxLength(5)

        expect(rule.validator('hello')).toBe(true)
        expect(rule.validator('hello world')).toBe(false)
      })

      it('应该只接受字符串', () => {
        const { maxLength } = useFormValidation()
        const rule = maxLength(5)

        expect(rule.validator(123)).toBe(false)
      })

      it('应该使用默认错误消息', () => {
        const { maxLength } = useFormValidation()
        const rule = maxLength(10)

        expect(rule.message).toBe('最多允许 10 个字符')
      })
    })

    describe('number', () => {
      it('应该验证有效数字', () => {
        const { number } = useFormValidation()
        const rule = number()

        expect(rule.validator(123)).toBe(true)
        expect(rule.validator(0)).toBe(true)
        expect(rule.validator(-5)).toBe(true)
        expect(rule.validator(3.14)).toBe(true)
      })

      it('应该拒绝无效数字', () => {
        const { number } = useFormValidation()
        const rule = number()

        expect(rule.validator(NaN)).toBe(false)
        expect(rule.validator('123')).toBe(false)
        expect(rule.validator(null)).toBe(false)
      })

      it('应该使用默认错误消息', () => {
        const { number } = useFormValidation()
        const rule = number()

        expect(rule.message).toBe('必须是有效数字')
      })
    })

    describe('numberRange', () => {
      it('应该验证数字范围', () => {
        const { numberRange } = useFormValidation()
        const rule = numberRange(1, 10)

        expect(rule.validator(5)).toBe(true)
        expect(rule.validator(1)).toBe(true)
        expect(rule.validator(10)).toBe(true)
        expect(rule.validator(0)).toBe(false)
        expect(rule.validator(11)).toBe(false)
      })

      it('应该拒绝非数字', () => {
        const { numberRange } = useFormValidation()
        const rule = numberRange(1, 10)

        expect(rule.validator('5')).toBe(false)
        expect(rule.validator(null)).toBe(false)
      })

      it('应该使用默认错误消息', () => {
        const { numberRange } = useFormValidation()
        const rule = numberRange(1, 10)

        expect(rule.message).toBe('必须在 1 到 10 之间')
      })
    })

    describe('nonNegativeInteger', () => {
      it('应该验证非负整数', () => {
        const { nonNegativeInteger } = useFormValidation()
        const rule = nonNegativeInteger()

        expect(rule.validator(0)).toBe(true)
        expect(rule.validator(1)).toBe(true)
        expect(rule.validator(100)).toBe(true)
      })

      it('应该拒绝负数和小数', () => {
        const { nonNegativeInteger } = useFormValidation()
        const rule = nonNegativeInteger()

        expect(rule.validator(-1)).toBe(false)
        expect(rule.validator(3.14)).toBe(false)
      })

      it('应该使用默认错误消息', () => {
        const { nonNegativeInteger } = useFormValidation()
        const rule = nonNegativeInteger()

        expect(rule.message).toBe('必须是非负整数')
      })
    })

    describe('custom', () => {
      it('应该使用自定义验证器', () => {
        const { custom } = useFormValidation()
        const rule = custom(value => value === 'special', '必须是特殊值')

        expect(rule.validator('special')).toBe(true)
        expect(rule.validator('normal')).toBe(false)
        expect(rule.message).toBe('必须是特殊值')
      })
    })
  })

  describe('validateField', () => {
    it('应该验证通过所有规则', () => {
      const { validateField, required, minLength } = useFormValidation()
      const rules = [required(), minLength(3)]

      expect(validateField('hello', rules)).toBe('')
    })

    it('应该返回第一个失败规则的错误消息', () => {
      const { validateField, required, minLength } = useFormValidation()
      const rules = [required(), minLength(5)]

      expect(validateField('hi', rules)).toBe('最少需要 5 个字符')
    })

    it('应该在第一个失败时停止验证', () => {
      const { validateField, required, minLength } = useFormValidation()
      const rules = [required('必填'), minLength(5, '太短')]

      expect(validateField('', rules)).toBe('必填')
    })

    it('应该处理空规则数组', () => {
      const { validateField } = useFormValidation()

      expect(validateField('anything', [])).toBe('')
    })
  })

  describe('createFieldValidation', () => {
    it('应该创建字段验证对象', () => {
      const { createFieldValidation, required } = useFormValidation()
      const value = ref('test')
      const rules = [required()]

      const field = createFieldValidation(value, rules)

      expect(field.value).toBe(value)
      expect(field.rules).toBe(rules)
      expect(field.errorMessage.value).toBe('')
      expect(field.isValid.value).toBe(true)
    })

    it('isValid 应该基于 errorMessage 计算', () => {
      const { createFieldValidation, required } = useFormValidation()
      const value = ref('')
      const rules = [required()]

      const field = createFieldValidation(value, rules)

      expect(field.isValid.value).toBe(true)

      field.errorMessage.value = '错误'
      expect(field.isValid.value).toBe(false)

      field.errorMessage.value = ''
      expect(field.isValid.value).toBe(true)
    })
  })

  describe('验证方法', () => {
    describe('validateNonEmptyString', () => {
      it('应该验证非空字符串', () => {
        const { validateNonEmptyString } = useFormValidation()

        expect(validateNonEmptyString('hello')).toBe(true)
        expect(validateNonEmptyString('')).toBe(false)
        expect(validateNonEmptyString('  ')).toBe(false)
        expect(validateNonEmptyString(123)).toBe(false)
      })
    })

    describe('validateNumber', () => {
      it('应该验证数字', () => {
        const { validateNumber } = useFormValidation()

        expect(validateNumber(123)).toBe(true)
        expect(validateNumber(0)).toBe(true)
        expect(validateNumber(-5)).toBe(true)
        expect(validateNumber(NaN)).toBe(false)
        expect(validateNumber('123')).toBe(false)
      })
    })

    describe('validateNumberRange', () => {
      it('应该验证数字范围', () => {
        const { validateNumberRange } = useFormValidation()

        expect(validateNumberRange(5, 1, 10)).toBe(true)
        expect(validateNumberRange(1, 1, 10)).toBe(true)
        expect(validateNumberRange(10, 1, 10)).toBe(true)
        expect(validateNumberRange(0, 1, 10)).toBe(false)
        expect(validateNumberRange(11, 1, 10)).toBe(false)
        expect(validateNumberRange('5', 1, 10)).toBe(false)
      })
    })

    describe('validateNonNegativeInteger', () => {
      it('应该验证非负整数', () => {
        const { validateNonNegativeInteger } = useFormValidation()

        expect(validateNonNegativeInteger(0)).toBe(true)
        expect(validateNonNegativeInteger(1)).toBe(true)
        expect(validateNonNegativeInteger(100)).toBe(true)
        expect(validateNonNegativeInteger(-1)).toBe(false)
        expect(validateNonNegativeInteger(3.14)).toBe(false)
      })
    })

    describe('validateAndSanitizeInput', () => {
      it('应该调用 validateAndSanitize 工具函数', () => {
        const { validateAndSanitizeInput } = useFormValidation()
        const result = validateAndSanitizeInput('test input', 100)

        expect(result.isValid).toBe(true)
        expect(result.sanitized).toBe('test input')
      })

      it('应该使用默认最大长度', () => {
        const { validateAndSanitizeInput } = useFormValidation()
        const result = validateAndSanitizeInput('test')

        expect(result.isValid).toBe(true)
      })

      it('应该检测不安全内容', () => {
        const { validateAndSanitizeInput } = useFormValidation()
        const result = validateAndSanitizeInput('<script>alert("xss")</script>', 100)

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('包含不安全内容')
      })
    })
  })
})
