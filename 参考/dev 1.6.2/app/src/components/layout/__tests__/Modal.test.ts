import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Modal from '../Modal.vue'
import type { ModalButton } from '../../../types'

// Mock DOMPurify
const mockSanitize = vi.fn((content: string) => content)

// 定义扩展的 Window 类型
type WindowWithDOMPurify = typeof globalThis.window & {
  DOMPurify: {
    sanitize: typeof mockSanitize
  }
}

// 设置 mock
;(globalThis.window as unknown as WindowWithDOMPurify) = {
  ...globalThis.window,
  DOMPurify: {
    sanitize: mockSanitize,
  },
} as WindowWithDOMPurify

describe('Modal', () => {
  const createMockButtons = (): ModalButton[] => [
    {
      text: '确定',
      class: 'primary',
      action: vi.fn(),
    },
    {
      text: '取消',
      class: 'secondary',
      action: vi.fn(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // 清理 body 内容
    document.body.innerHTML = ''
  })

  afterEach(() => {
    // 清理所有挂载的组件
    document.body.innerHTML = ''
  })

  describe('渲染测试', () => {
    it('当 isVisible 为 true 时应该显示模态框', () => {
      mount(Modal, {
        props: {
          isVisible: true,
          title: 'Test Title',
          content: 'Test Content',
          buttons: createMockButtons(),
        },
        attachTo: document.body,
      })

      // Teleport 会将内容传送到 body，所以需要在 document.body 中查找
      expect(document.body.querySelector('.modal-overlay')).toBeTruthy()
      expect(document.body.querySelector('.modal')).toBeTruthy()
    })

    it('当 isVisible 为 false 时应该隐藏模态框', () => {
      mount(Modal, {
        props: {
          isVisible: false,
          title: 'Test Title',
          content: 'Test Content',
          buttons: createMockButtons(),
        },
        attachTo: document.body,
      })

      expect(document.body.querySelector('.modal-overlay')).toBeFalsy()
    })

    it('应该正确显示标题', () => {
      mount(Modal, {
        props: {
          isVisible: true,
          title: 'Test Modal Title',
          content: 'Test Content',
          buttons: createMockButtons(),
        },
        attachTo: document.body,
      })

      const title = document.body.querySelector('.modal-title')
      expect(title?.textContent).toBe('Test Modal Title')
    })

    it('应该正确显示内容', () => {
      mount(Modal, {
        props: {
          isVisible: true,
          title: 'Test Title',
          content: 'Test Modal Content',
          buttons: createMockButtons(),
        },
        attachTo: document.body,
      })

      const content = document.body.querySelector('.modal-content')
      expect(content?.textContent).toContain('Test Modal Content')
    })

    it('应该渲染所有按钮', () => {
      const buttons = createMockButtons()
      mount(Modal, {
        props: {
          isVisible: true,
          title: 'Test Title',
          content: 'Test Content',
          buttons,
        },
        attachTo: document.body,
      })

      const buttonElements = document.body.querySelectorAll('.modal-button')
      expect(buttonElements.length).toBe(2)
      expect(buttonElements[0].textContent?.trim()).toBe('确定')
      expect(buttonElements[1].textContent?.trim()).toBe('取消')
    })

    it('应该为按钮应用正确的 class', () => {
      const buttons = createMockButtons()
      mount(Modal, {
        props: {
          isVisible: true,
          title: 'Test Title',
          content: 'Test Content',
          buttons,
        },
        attachTo: document.body,
      })

      const buttonElements = document.body.querySelectorAll('.modal-button')
      expect(buttonElements[0].classList.contains('primary')).toBe(true)
      expect(buttonElements[1].classList.contains('secondary')).toBe(true)
    })
  })

  describe('内容清理测试', () => {
    it('应该使用 DOMPurify 清理 HTML 内容', () => {
      const htmlContent = '<p>Test <script>alert("xss")</script></p>'
      mount(Modal, {
        props: {
          isVisible: true,
          title: 'Test Title',
          content: htmlContent,
          buttons: createMockButtons(),
        },
        attachTo: document.body,
      })

      expect(mockSanitize).toHaveBeenCalledWith(htmlContent, expect.any(Object))
    })

    it('应该配置 DOMPurify 允许的标签和属性', () => {
      const htmlContent = '<p>Test Content</p>'
      mount(Modal, {
        props: {
          isVisible: true,
          title: 'Test Title',
          content: htmlContent,
          buttons: createMockButtons(),
        },
        attachTo: document.body,
      })

      expect(mockSanitize).toHaveBeenCalledWith(
        htmlContent,
        expect.objectContaining({
          ALLOWED_TAGS: expect.arrayContaining(['b', 'i', 'em', 'strong', 'a', 'p', 'br']),
          ALLOWED_ATTR: expect.arrayContaining(['href', 'title', 'target', 'class']),
          KEEP_CONTENT: true,
        })
      )
    })
  })

  describe('事件处理测试', () => {
    it('点击遮罩层应该触发 close 事件', async () => {
      const wrapper = mount(Modal, {
        props: {
          isVisible: true,
          title: 'Test Title',
          content: 'Test Content',
          buttons: createMockButtons(),
        },
        attachTo: document.body,
      })

      const overlay = document.body.querySelector('.modal-overlay') as HTMLElement
      overlay.click()
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('点击模态框内部不应该触发 close 事件', async () => {
      const wrapper = mount(Modal, {
        props: {
          isVisible: true,
          title: 'Test Title',
          content: 'Test Content',
          buttons: createMockButtons(),
        },
        attachTo: document.body,
      })

      const modal = document.body.querySelector('.modal') as HTMLElement
      modal.click()
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('close')).toBeFalsy()
    })

    it('按下 ESC 键应该触发 close 事件', async () => {
      const wrapper = mount(Modal, {
        props: {
          isVisible: true,
          title: 'Test Title',
          content: 'Test Content',
          buttons: createMockButtons(),
        },
        attachTo: document.body,
      })

      const overlay = document.body.querySelector('.modal-overlay') as HTMLElement
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      overlay.dispatchEvent(event)
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('点击按钮应该执行对应的 action', async () => {
      const buttons = createMockButtons()
      mount(Modal, {
        props: {
          isVisible: true,
          title: 'Test Title',
          content: 'Test Content',
          buttons,
        },
        attachTo: document.body,
      })

      const buttonElements = document.body.querySelectorAll<HTMLElement>('.modal-button')
      buttonElements[0].click()
      expect(buttons[0].action).toHaveBeenCalled()

      buttonElements[1].click()
      expect(buttons[1].action).toHaveBeenCalled()
    })
  })

  describe('可访问性测试', () => {
    it('应该设置正确的 ARIA 属性', () => {
      mount(Modal, {
        props: {
          isVisible: true,
          title: 'Test Title',
          content: 'Test Content',
          buttons: createMockButtons(),
        },
        attachTo: document.body,
      })

      const overlay = document.body.querySelector('.modal-overlay') as HTMLElement
      expect(overlay.getAttribute('role')).toBe('dialog')
      expect(overlay.getAttribute('aria-modal')).toBe('true')
      expect(overlay.getAttribute('aria-labelledby')).toBeTruthy()
    })

    it('标题应该有唯一的 ID', () => {
      mount(Modal, {
        props: {
          isVisible: true,
          title: 'Test Title',
          content: 'Test Content',
          buttons: createMockButtons(),
        },
        attachTo: document.body,
      })

      const title = document.body.querySelector('.modal-title') as HTMLElement
      const titleId = title.getAttribute('id')
      expect(titleId).toBeTruthy()
      expect(titleId).toMatch(/^modal-title-/)
    })

    it('按钮组应该有正确的 role 和 aria-label', () => {
      mount(Modal, {
        props: {
          isVisible: true,
          title: 'Test Title',
          content: 'Test Content',
          buttons: createMockButtons(),
        },
        attachTo: document.body,
      })

      const buttonsGroup = document.body.querySelector('.modal-buttons') as HTMLElement
      expect(buttonsGroup.getAttribute('role')).toBe('group')
      expect(buttonsGroup.getAttribute('aria-label')).toBe('模态框操作按钮')
    })
  })

  describe('插槽测试', () => {
    it('应该支持自定义内容插槽', () => {
      mount(Modal, {
        props: {
          isVisible: true,
          title: 'Test Title',
          buttons: createMockButtons(),
        },
        slots: {
          content: '<div class="custom-content">Custom Content</div>',
        },
        attachTo: document.body,
      })

      const customContent = document.body.querySelector('.custom-content')
      expect(customContent).toBeTruthy()
      expect(customContent?.textContent).toBe('Custom Content')
    })
  })

  describe('响应式测试', () => {
    it('更新 isVisible 应该显示/隐藏模态框', async () => {
      const wrapper = mount(Modal, {
        props: {
          isVisible: false,
          title: 'Test Title',
          content: 'Test Content',
          buttons: createMockButtons(),
        },
        attachTo: document.body,
      })

      expect(document.body.querySelector('.modal-overlay')).toBeFalsy()

      await wrapper.setProps({ isVisible: true })
      await wrapper.vm.$nextTick()
      expect(document.body.querySelector('.modal-overlay')).toBeTruthy()

      await wrapper.setProps({ isVisible: false })
      await wrapper.vm.$nextTick()
      expect(document.body.querySelector('.modal-overlay')).toBeFalsy()
    })

    it('更新 title 应该更新标题显示', async () => {
      const wrapper = mount(Modal, {
        props: {
          isVisible: true,
          title: 'Original Title',
          content: 'Test Content',
          buttons: createMockButtons(),
        },
        attachTo: document.body,
      })

      let title = document.body.querySelector('.modal-title')
      expect(title?.textContent).toBe('Original Title')

      await wrapper.setProps({ title: 'Updated Title' })
      await wrapper.vm.$nextTick()
      title = document.body.querySelector('.modal-title')
      expect(title?.textContent).toBe('Updated Title')
    })

    it('更新 buttons 应该更新按钮显示', async () => {
      const wrapper = mount(Modal, {
        props: {
          isVisible: true,
          title: 'Test Title',
          content: 'Test Content',
          buttons: createMockButtons(),
        },
        attachTo: document.body,
      })

      let buttonElements = document.body.querySelectorAll('.modal-button')
      expect(buttonElements.length).toBe(2)

      const newButtons: ModalButton[] = [{ text: 'OK', class: 'primary', action: vi.fn() }]
      await wrapper.setProps({ buttons: newButtons })
      await wrapper.vm.$nextTick()
      buttonElements = document.body.querySelectorAll('.modal-button')
      expect(buttonElements.length).toBe(1)
      expect(buttonElements[0].textContent?.trim()).toBe('OK')
    })
  })
})
