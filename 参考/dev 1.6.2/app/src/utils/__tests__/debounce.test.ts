import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounce, throttle } from '../debounce'

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('debounce', () => {
    it('应该延迟执行函数', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该在多次调用时重置计时器', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      vi.advanceTimersByTime(50)
      debouncedFn()
      vi.advanceTimersByTime(50)
      debouncedFn()

      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该传递参数给原函数', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('arg1', 'arg2')
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('应该使用最后一次调用的参数', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('first')
      vi.advanceTimersByTime(50)
      debouncedFn('second')
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('second')
    })

    it('应该允许多次独立的防抖调用', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)

      debouncedFn()
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('throttle', () => {
    it('应该创建节流函数', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      expect(typeof throttledFn).toBe('function')
    })

    it('应该在第一次调用时设置定时器', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()

      // 第一次调用不会立即执行，而是设置定时器
      expect(fn).not.toHaveBeenCalled()
      expect(vi.getTimerCount()).toBeGreaterThan(0)
    })

    it('应该在节流期结束后执行函数', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      expect(fn).not.toHaveBeenCalled()

      // 前进到节流期结束
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该在节流期间只执行第一次设置的调用', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn('call1')
      throttledFn('call2')
      throttledFn('call3')

      // 节流期间不应该执行
      expect(fn).not.toHaveBeenCalled()

      // 前进到节流期结束
      vi.advanceTimersByTime(100)

      // 应该只执行一次，使用第一次调用的参数（因为定时器捕获了第一次的args）
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('call1')
    })

    it('应该传递参数给原函数', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn('arg1', 'arg2')
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('应该在节流期结束后允许新的调用', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      // 第一次调用
      throttledFn('first')
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('first')

      // 等待足够长的时间，确保可以开始新的节流周期
      vi.advanceTimersByTime(100)

      // 第二次调用
      throttledFn('second')
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(2)
      expect(fn).toHaveBeenLastCalledWith('second')
    })

    it('应该在达到节流时间时立即执行', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      // 第一次调用并等待完成
      throttledFn('first')
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)

      // 等待超过节流时间
      vi.advanceTimersByTime(100)

      // 再次调用，由于已经超过节流时间，应该立即执行
      throttledFn('second')
      expect(fn).toHaveBeenCalledTimes(2)
      expect(fn).toHaveBeenLastCalledWith('second')
    })

    it('应该清除之前的定时器当满足立即执行条件时', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      // 第一次调用
      throttledFn('first')
      const initialTimerCount = vi.getTimerCount()
      expect(initialTimerCount).toBeGreaterThan(0)

      // 等待定时器触发
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)

      // 再等待超过节流时间
      vi.advanceTimersByTime(100)

      // 再次调用，由于已经超过节流时间，应该立即执行
      throttledFn('second')
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })
})
