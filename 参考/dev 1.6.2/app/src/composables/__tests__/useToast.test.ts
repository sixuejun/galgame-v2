import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useToast } from '../ui/useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 清空所有 toasts
    const { toasts } = useToast()
    toasts.value = []
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('showToast', () => {
    it('应该添加一个 toast 到列表', () => {
      const { showToast, toasts } = useToast()

      showToast('Test message')

      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].message).toBe('Test message')
    })

    it('应该使用默认类型 info', () => {
      const { showToast, toasts } = useToast()

      showToast('Test message')

      expect(toasts.value[0].type).toBe('info')
    })

    it('应该使用指定的类型', () => {
      const { showToast, toasts } = useToast()

      showToast('Success message', 'success')

      expect(toasts.value[0].type).toBe('success')
    })

    it('应该使用指定的持续时间', () => {
      const { showToast, toasts } = useToast()

      showToast('Test message', 'info', 5000)

      expect(toasts.value[0].duration).toBe(5000)
    })

    it('应该返回 toast 的 ID', () => {
      const { showToast } = useToast()

      const id = showToast('Test message')

      expect(typeof id).toBe('number')
      expect(id).toBeGreaterThan(0)
    })

    it('每个 toast 应该有唯一的 ID', () => {
      const { showToast } = useToast()

      const id1 = showToast('Message 1')
      const id2 = showToast('Message 2')
      const id3 = showToast('Message 3')

      expect(id1).not.toBe(id2)
      expect(id2).not.toBe(id3)
      expect(id1).not.toBe(id3)
    })

    it('应该在指定时间后自动移除 toast', () => {
      const { showToast, toasts } = useToast()

      showToast('Test message', 'info', 3000)
      expect(toasts.value).toHaveLength(1)

      vi.advanceTimersByTime(3000)
      expect(toasts.value).toHaveLength(0)
    })

    it('当 duration 为 0 时不应该自动移除', () => {
      const { showToast, toasts } = useToast()

      showToast('Test message', 'info', 0)
      expect(toasts.value).toHaveLength(1)

      vi.advanceTimersByTime(10000)
      expect(toasts.value).toHaveLength(1)
    })
  })

  describe('removeToast', () => {
    it('应该移除指定 ID 的 toast', () => {
      const { showToast, removeToast, toasts } = useToast()

      const id = showToast('Test message', 'info', 0)
      expect(toasts.value).toHaveLength(1)

      removeToast(id)
      expect(toasts.value).toHaveLength(0)
    })

    it('应该只移除指定的 toast', () => {
      const { showToast, removeToast, toasts } = useToast()

      const id1 = showToast('Message 1', 'info', 0)
      const id2 = showToast('Message 2', 'info', 0)
      const id3 = showToast('Message 3', 'info', 0)
      expect(toasts.value).toHaveLength(3)

      removeToast(id2)
      expect(toasts.value).toHaveLength(2)
      expect(toasts.value.find(t => t.id === id1)).toBeTruthy()
      expect(toasts.value.find(t => t.id === id2)).toBeFalsy()
      expect(toasts.value.find(t => t.id === id3)).toBeTruthy()
    })

    it('移除不存在的 toast 不应该报错', () => {
      const { removeToast, toasts } = useToast()

      expect(() => removeToast(999)).not.toThrow()
      expect(toasts.value).toHaveLength(0)
    })
  })

  describe('success', () => {
    it('应该创建成功类型的 toast', () => {
      const { success, toasts } = useToast()

      success('Success message')

      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].type).toBe('success')
      expect(toasts.value[0].message).toBe('Success message')
    })

    it('应该支持自定义持续时间', () => {
      const { success, toasts } = useToast()

      success('Success message', 5000)

      expect(toasts.value[0].duration).toBe(5000)
    })
  })

  describe('error', () => {
    it('应该创建错误类型的 toast', () => {
      const { error, toasts } = useToast()

      error('Error message')

      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].type).toBe('error')
      expect(toasts.value[0].message).toBe('Error message')
    })

    it('应该支持自定义持续时间', () => {
      const { error, toasts } = useToast()

      error('Error message', 5000)

      expect(toasts.value[0].duration).toBe(5000)
    })
  })

  describe('info', () => {
    it('应该创建信息类型的 toast', () => {
      const { info, toasts } = useToast()

      info('Info message')

      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].type).toBe('info')
      expect(toasts.value[0].message).toBe('Info message')
    })

    it('应该支持自定义持续时间', () => {
      const { info, toasts } = useToast()

      info('Info message', 5000)

      expect(toasts.value[0].duration).toBe(5000)
    })
  })

  describe('warning', () => {
    it('应该创建警告类型的 toast', () => {
      const { warning, toasts } = useToast()

      warning('Warning message')

      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].type).toBe('warning')
      expect(toasts.value[0].message).toBe('Warning message')
    })

    it('应该支持自定义持续时间', () => {
      const { warning, toasts } = useToast()

      warning('Warning message', 5000)

      expect(toasts.value[0].duration).toBe(5000)
    })
  })

  describe('状态共享', () => {
    it('多次调用 useToast 应该返回相同的 toasts 列表', () => {
      const toast1 = useToast()
      const toast2 = useToast()

      toast1.showToast('Test message')

      expect(toast2.toasts.value).toHaveLength(1)
      expect(toast2.toasts.value[0].message).toBe('Test message')
    })

    it('一个实例的操作应该影响另一个实例', () => {
      const toast1 = useToast()
      const toast2 = useToast()

      const id = toast1.showToast('Test message', 'info', 0)
      expect(toast2.toasts.value).toHaveLength(1)

      toast2.removeToast(id)
      expect(toast1.toasts.value).toHaveLength(0)
    })
  })

  describe('多个 toast 管理', () => {
    it('应该支持同时显示多个 toast', () => {
      const { showToast, toasts } = useToast()

      showToast('Message 1', 'info', 0)
      showToast('Message 2', 'success', 0)
      showToast('Message 3', 'error', 0)

      expect(toasts.value).toHaveLength(3)
    })

    it('应该按照添加顺序排列 toast', () => {
      const { showToast, toasts } = useToast()

      showToast('First', 'info', 0)
      showToast('Second', 'info', 0)
      showToast('Third', 'info', 0)

      expect(toasts.value[0].message).toBe('First')
      expect(toasts.value[1].message).toBe('Second')
      expect(toasts.value[2].message).toBe('Third')
    })

    it('应该正确处理多个 toast 的自动移除', () => {
      const { showToast, toasts } = useToast()

      showToast('Message 1', 'info', 1000)
      showToast('Message 2', 'info', 2000)
      showToast('Message 3', 'info', 3000)

      expect(toasts.value).toHaveLength(3)

      vi.advanceTimersByTime(1000)
      expect(toasts.value).toHaveLength(2)

      vi.advanceTimersByTime(1000)
      expect(toasts.value).toHaveLength(1)

      vi.advanceTimersByTime(1000)
      expect(toasts.value).toHaveLength(0)
    })
  })
})
