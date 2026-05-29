import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  sanitizeHTML,
  sanitizeUserInput,
  validateUserInput,
  validateAndSanitize,
} from '../sanitize'

describe('sanitize', () => {
  // Mock DOMPurify
  const mockDOMPurify = {
    sanitize: vi.fn((dirty: string) => dirty),
    version: '3.0.0',
    removed: [],
    isSupported: true,
    setConfig: vi.fn(),
    clearConfig: vi.fn(),
    addHook: vi.fn(),
    removeHook: vi.fn(),
    removeHooks: vi.fn(),
    removeAllHooks: vi.fn(),
  }

  beforeEach(() => {
    globalThis.window = {
      DOMPurify: mockDOMPurify,
    } as unknown as Window & typeof globalThis
    mockDOMPurify.sanitize.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('sanitizeHTML', () => {
    it('应该调用 DOMPurify.sanitize', () => {
      const html = '<p>test</p>'
      sanitizeHTML(html)
      expect(mockDOMPurify.sanitize).toHaveBeenCalled()
    })

    it('应该传递正确的配置给 DOMPurify', () => {
      const html = '<p>test</p>'
      sanitizeHTML(html)
      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(
        html,
        expect.objectContaining({
          FORBID_TAGS: expect.arrayContaining(['script', 'iframe', 'object']),
          FORBID_ATTR: expect.arrayContaining(['onclick', 'onerror', 'onload']),
          KEEP_CONTENT: true,
        })
      )
    })

    it('应该返回清理后的 HTML', () => {
      mockDOMPurify.sanitize.mockReturnValue('<p>cleaned</p>')
      const result = sanitizeHTML('<p>test</p>')
      expect(result).toBe('<p>cleaned</p>')
    })

    it('当 DOMPurify 未加载时应该抛出错误（默认行为）', () => {
      globalThis.window = {} as unknown as Window & typeof globalThis
      expect(() => sanitizeHTML('<p>test</p><script>alert("xss")</script>')).toThrow(
        'DOMPurify 未加载'
      )
    })

    it('当 DOMPurify 未加载且 throwOnError=false 时应该降级处理', () => {
      globalThis.window = {} as unknown as Window & typeof globalThis
      const result = sanitizeHTML('<p>test</p><script>alert("xss")</script>', {
        throwOnError: false,
      })
      expect(result).toBe('testalert("xss")')
    })

    it('当 DOMPurify 抛出错误时应该抛出错误（默认行为）', () => {
      mockDOMPurify.sanitize.mockImplementation(() => {
        throw new Error('DOMPurify error')
      })
      expect(() => sanitizeHTML('<p>test</p>')).toThrow('HTML 清理失败')
    })

    it('当 DOMPurify 抛出错误且 throwOnError=false 时应该降级处理', () => {
      mockDOMPurify.sanitize.mockImplementation(() => {
        throw new Error('DOMPurify error')
      })
      const result = sanitizeHTML('<p>test</p>', { throwOnError: false })
      expect(result).toBe('test')
    })

    it('应该处理空字符串', () => {
      mockDOMPurify.sanitize.mockReturnValue('')
      const result = sanitizeHTML('')
      expect(result).toBe('')
    })

    it('应该处理复杂的 HTML', () => {
      const html = '<div><p>test</p><span>content</span></div>'
      mockDOMPurify.sanitize.mockReturnValue(html)
      const result = sanitizeHTML(html)
      expect(result).toBe(html)
    })
  })

  describe('sanitizeUserInput', () => {
    it('应该移除所有 HTML 标签', () => {
      const input = '<p>test</p><div>content</div>'
      const result = sanitizeUserInput(input)
      expect(result).toBe('testcontent')
    })

    it('应该移除 javascript: 协议', () => {
      const input = 'javascript:alert("xss")'
      const result = sanitizeUserInput(input)
      expect(result).toBe('alert("xss")')
    })

    it('应该移除事件处理器', () => {
      const input = 'onclick=alert("xss")'
      const result = sanitizeUserInput(input)
      expect(result).toBe('alert("xss")')
    })

    it('应该处理空字符串', () => {
      const result = sanitizeUserInput('')
      expect(result).toBe('')
    })

    it('应该处理 null 和 undefined', () => {
      // @ts-expect-error - Testing invalid input types
      expect(sanitizeUserInput(null)).toBe('')
      // @ts-expect-error - Testing invalid input types
      expect(sanitizeUserInput(undefined)).toBe('')
    })

    it('应该去除前后空格', () => {
      const input = '  test  '
      const result = sanitizeUserInput(input)
      expect(result).toBe('test')
    })

    it('应该保留纯文本内容', () => {
      const input = 'This is a normal text'
      const result = sanitizeUserInput(input)
      expect(result).toBe('This is a normal text')
    })

    it('应该处理混合内容', () => {
      const input = '<p>Hello</p> <script>alert("xss")</script> World'
      const result = sanitizeUserInput(input)
      expect(result).toBe('Hello alert("xss") World')
    })

    it('应该处理大小写不敏感的 javascript:', () => {
      const input = 'JavaScript:alert("xss")'
      const result = sanitizeUserInput(input)
      expect(result).toBe('alert("xss")')
    })

    it('应该处理大小写不敏感的事件处理器', () => {
      const input = 'onClick=alert("xss")'
      const result = sanitizeUserInput(input)
      expect(result).toBe('alert("xss")')
    })
  })

  describe('validateUserInput', () => {
    it('应该验证通过正常输入', () => {
      const result = validateUserInput('normal text')
      expect(result.valid).toBe(true)
      expect(result.sanitized).toBe('normal text')
    })

    it('应该拒绝空输入', () => {
      const result = validateUserInput('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('输入内容不能为空')
    })

    it('应该拒绝只有空格的输入', () => {
      const result = validateUserInput('   ')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('输入内容不能为空')
    })

    it('应该拒绝超长输入', () => {
      const longInput = 'a'.repeat(501)
      const result = validateUserInput(longInput)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('输入内容过长')
    })

    it('应该支持自定义最大长度', () => {
      const input = 'a'.repeat(100)
      const result = validateUserInput(input, 50)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('最多允许 50 个字符')
    })

    it('应该检测 script 标签', () => {
      const result = validateUserInput('<script>alert("xss")</script>')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('非法字符或潜在的安全风险')
    })

    it('应该检测 javascript: 协议', () => {
      const result = validateUserInput('javascript:alert("xss")')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('非法字符或潜在的安全风险')
    })

    it('应该检测事件处理器', () => {
      const result = validateUserInput('onclick=alert("xss")')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('非法字符或潜在的安全风险')
    })

    it('应该检测 iframe 标签', () => {
      const result = validateUserInput('<iframe src="evil.com"></iframe>')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('非法字符或潜在的安全风险')
    })

    it('应该检测 object 标签', () => {
      const result = validateUserInput('<object data="evil.swf"></object>')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('非法字符或潜在的安全风险')
    })

    it('应该检测 embed 标签', () => {
      const result = validateUserInput('<embed src="evil.swf">')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('非法字符或潜在的安全风险')
    })

    it('应该检测 eval 函数', () => {
      const result = validateUserInput('eval(maliciousCode)')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('非法字符或潜在的安全风险')
    })

    it('应该检测 CSS expression', () => {
      const result = validateUserInput('expression(alert("xss"))')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('非法字符或潜在的安全风险')
    })

    it('应该大小写不敏感地检测危险模式', () => {
      expect(validateUserInput('<SCRIPT>').valid).toBe(false)
      expect(validateUserInput('JAVASCRIPT:').valid).toBe(false)
      expect(validateUserInput('ONCLICK=').valid).toBe(false)
    })

    it('应该返回清理后的文本', () => {
      const result = validateUserInput('  normal text  ')
      expect(result.valid).toBe(true)
      expect(result.sanitized).toBe('normal text')
    })

    it('应该处理中文输入', () => {
      const result = validateUserInput('这是一段中文文本')
      expect(result.valid).toBe(true)
      expect(result.sanitized).toBe('这是一段中文文本')
    })

    it('应该处理特殊字符', () => {
      const result = validateUserInput('Hello! @#$%^&*()')
      expect(result.valid).toBe(true)
      expect(result.sanitized).toBe('Hello! @#$%^&*()')
    })
  })

  describe('validateAndSanitize', () => {
    it('应该验证并清理正常输入', () => {
      const result = validateAndSanitize('normal text')
      expect(result.valid).toBe(true)
      expect(result.sanitized).toBe('normal text')
    })

    it('应该拒绝无效输入', () => {
      const result = validateAndSanitize('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('输入内容不能为空')
    })

    it('应该拒绝危险输入', () => {
      const result = validateAndSanitize('<script>alert("xss")</script>')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('非法字符或潜在的安全风险')
    })

    it('应该支持自定义最大长度', () => {
      const input = 'a'.repeat(100)
      const result = validateAndSanitize(input, 50)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('最多允许 50 个字符')
    })

    it('应该返回清理后的文本', () => {
      const result = validateAndSanitize('  <p>test</p>  ')
      expect(result.valid).toBe(true)
      expect(result.sanitized).toBe('test')
    })

    it('应该处理边界情况', () => {
      const input = 'a'.repeat(500)
      const result = validateAndSanitize(input)
      expect(result.valid).toBe(true)
      expect(result.sanitized).toBe(input)
    })
  })
})
