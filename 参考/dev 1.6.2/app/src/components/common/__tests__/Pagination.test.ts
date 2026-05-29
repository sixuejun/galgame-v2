import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Pagination from '../Pagination.vue'

describe('Pagination', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleWarnSpy: any

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  describe('渲染测试', () => {
    it('总页数大于 1 时应该渲染分页组件', () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 1,
          totalPages: 5,
        },
      })

      expect(wrapper.find('.pagination').exists()).toBe(true)
      expect(wrapper.find('.page-info').exists()).toBe(true)
    })

    it('总页数等于 1 时不应该渲染分页组件', () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 1,
          totalPages: 1,
        },
      })

      expect(wrapper.find('.pagination').exists()).toBe(false)
    })

    it('总页数为 0 时不应该渲染分页组件', () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 1,
          totalPages: 0,
        },
      })

      expect(wrapper.find('.pagination').exists()).toBe(false)
    })

    it('应该显示当前页码和总页数', () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 3,
          totalPages: 10,
        },
      })

      const pageInfo = wrapper.find('.page-info')
      expect(pageInfo.text()).toBe('3 / 10')
    })

    it('应该渲染上一页和下一页按钮', () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 2,
          totalPages: 5,
        },
      })

      const buttons = wrapper.findAll('.page-btn')
      expect(buttons).toHaveLength(2)
      expect(buttons[0].text()).toContain('上一页')
      expect(buttons[1].text()).toContain('下一页')
    })
  })

  describe('按钮状态', () => {
    it('在第一页时上一页按钮应该被禁用', () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 1,
          totalPages: 5,
        },
      })

      const prevBtn = wrapper.findAll('.page-btn')[0]
      expect(prevBtn.attributes('disabled')).toBeDefined()
      expect(prevBtn.attributes('aria-disabled')).toBe('true')
    })

    it('在最后一页时下一页按钮应该被禁用', () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 5,
          totalPages: 5,
        },
      })

      const nextBtn = wrapper.findAll('.page-btn')[1]
      expect(nextBtn.attributes('disabled')).toBeDefined()
      expect(nextBtn.attributes('aria-disabled')).toBe('true')
    })

    it('在中间页时两个按钮都应该启用', () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 3,
          totalPages: 5,
        },
      })

      const buttons = wrapper.findAll('.page-btn')
      expect(buttons[0].attributes('disabled')).toBeUndefined()
      expect(buttons[1].attributes('disabled')).toBeUndefined()
    })
  })

  describe('页码切换', () => {
    it('点击下一页应该触发事件', async () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 2,
          totalPages: 5,
        },
      })

      const nextBtn = wrapper.findAll('.page-btn')[1]
      await nextBtn.trigger('click')

      expect(wrapper.emitted('update:currentPage')).toBeTruthy()
      expect(wrapper.emitted('update:currentPage')![0]).toEqual([3])
      expect(wrapper.emitted('page-change')).toBeTruthy()
      expect(wrapper.emitted('page-change')![0]).toEqual([3])
    })

    it('点击上一页应该触发事件', async () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 3,
          totalPages: 5,
        },
      })

      const prevBtn = wrapper.findAll('.page-btn')[0]
      await prevBtn.trigger('click')

      expect(wrapper.emitted('update:currentPage')).toBeTruthy()
      expect(wrapper.emitted('update:currentPage')![0]).toEqual([2])
      expect(wrapper.emitted('page-change')).toBeTruthy()
      expect(wrapper.emitted('page-change')![0]).toEqual([2])
    })

    it('在第一页点击上一页不应该触发事件', async () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 1,
          totalPages: 5,
        },
      })

      const prevBtn = wrapper.findAll('.page-btn')[0]
      await prevBtn.trigger('click')

      expect(wrapper.emitted('update:currentPage')).toBeFalsy()
      expect(wrapper.emitted('page-change')).toBeFalsy()
    })

    it('在最后一页点击下一页不应该触发事件', async () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 5,
          totalPages: 5,
        },
      })

      const nextBtn = wrapper.findAll('.page-btn')[1]
      await nextBtn.trigger('click')

      expect(wrapper.emitted('update:currentPage')).toBeFalsy()
      expect(wrapper.emitted('page-change')).toBeFalsy()
    })
  })

  describe('无障碍支持', () => {
    it('应该有正确的 role 和 aria-label', () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 2,
          totalPages: 5,
        },
      })

      const nav = wrapper.find('.pagination')
      expect(nav.attributes('role')).toBe('navigation')
      expect(nav.attributes('aria-label')).toBe('分页导航')
    })

    it('应该支持自定义 aria-label', () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 2,
          totalPages: 5,
          ariaLabel: '商品列表分页',
        },
      })

      const nav = wrapper.find('.pagination')
      expect(nav.attributes('aria-label')).toBe('商品列表分页')
    })

    it('按钮应该有正确的 aria-label', () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 2,
          totalPages: 5,
        },
      })

      const buttons = wrapper.findAll('.page-btn')
      expect(buttons[0].attributes('aria-label')).toBe('上一页')
      expect(buttons[1].attributes('aria-label')).toBe('下一页')
    })

    it('页码信息应该有 aria-live 和 role', () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 2,
          totalPages: 5,
        },
      })

      const pageInfo = wrapper.find('.page-info')
      expect(pageInfo.attributes('role')).toBe('status')
      expect(pageInfo.attributes('aria-live')).toBe('polite')
      expect(pageInfo.attributes('aria-label')).toBe('当前页码')
    })
  })

  describe('Props 验证（开发环境）', () => {
    it('currentPage < 1 时应该警告', () => {
      mount(Pagination, {
        props: {
          currentPage: 0,
          totalPages: 5,
        },
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('currentPage (0) 应该 >= 1')
      )
    })

    it('totalPages < 0 时应该警告', () => {
      mount(Pagination, {
        props: {
          currentPage: 1,
          totalPages: -1,
        },
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('totalPages (-1) 应该 >= 0')
      )
    })

    it('currentPage > totalPages 时应该警告', () => {
      mount(Pagination, {
        props: {
          currentPage: 10,
          totalPages: 5,
        },
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('currentPage (10) 不应该大于 totalPages (5)')
      )
    })

    it('totalPages 为 0 时不应该警告 currentPage', () => {
      consoleWarnSpy.mockClear()

      mount(Pagination, {
        props: {
          currentPage: 1,
          totalPages: 0,
        },
      })

      // 应该只有一个警告（totalPages >= 0 的检查通过）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const warnings = consoleWarnSpy.mock.calls.filter((call: any) =>
        (call[0] as string).includes('currentPage')
      )
      expect(warnings).toHaveLength(0)
    })
  })

  describe('边界情况', () => {
    it('应该处理只有 2 页的情况', () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 1,
          totalPages: 2,
        },
      })

      expect(wrapper.find('.pagination').exists()).toBe(true)
      expect(wrapper.find('.page-info').text()).toBe('1 / 2')
    })

    it('应该处理大量页数', () => {
      const wrapper = mount(Pagination, {
        props: {
          currentPage: 500,
          totalPages: 1000,
        },
      })

      expect(wrapper.find('.page-info').text()).toBe('500 / 1000')
    })
  })
})
