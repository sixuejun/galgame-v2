import { describe, it, expect, beforeEach } from 'vitest'
import { useModal } from '../ui/useModal'
import type { ModalButton } from '../../types'

describe('useModal', () => {
  beforeEach(() => {
    // 重置模态框状态
    const { hideModal } = useModal()
    hideModal()
  })

  describe('showModal', () => {
    it('应该显示模态框并设置标题和内容', () => {
      const { showModal, isVisible, title, content } = useModal()

      showModal('Test Title', 'Test Content')

      expect(isVisible.value).toBe(true)
      expect(title.value).toBe('Test Title')
      expect(content.value).toBe('Test Content')
    })

    it('应该使用自定义按钮', () => {
      const { showModal, buttons } = useModal()
      const customButtons: ModalButton[] = [
        { text: 'Button 1', class: 'primary', action: () => {} },
        { text: 'Button 2', class: 'secondary', action: () => {} },
      ]

      showModal('Test Title', 'Test Content', customButtons)

      expect(buttons.value).toEqual(customButtons)
    })

    it('当没有提供按钮时应该使用默认按钮', () => {
      const { showModal, buttons } = useModal()

      showModal('Test Title', 'Test Content')

      expect(buttons.value).toHaveLength(1)
      expect(buttons.value[0].text).toBe('确定')
      expect(buttons.value[0].class).toBe('primary')
    })

    it('默认按钮点击应该隐藏模态框', () => {
      const { showModal, buttons, isVisible } = useModal()

      showModal('Test Title', 'Test Content')
      expect(isVisible.value).toBe(true)

      // 点击默认按钮
      buttons.value[0].action()
      expect(isVisible.value).toBe(false)
    })
  })

  describe('showConfirm', () => {
    it('应该显示确认对话框', () => {
      const { showConfirm, isVisible, title, content } = useModal()

      showConfirm('Confirm Title', 'Confirm Content')

      expect(isVisible.value).toBe(true)
      expect(title.value).toBe('Confirm Title')
      expect(content.value).toBe('Confirm Content')
    })

    it('应该创建确认和取消按钮', () => {
      const { showConfirm, buttons } = useModal()

      showConfirm('Confirm Title', 'Confirm Content')

      expect(buttons.value).toHaveLength(2)
      expect(buttons.value[0].text).toBe('取消')
      expect(buttons.value[0].class).toBe('secondary')
      expect(buttons.value[1].text).toBe('确定')
      expect(buttons.value[1].class).toBe('primary')
    })

    it('应该使用自定义按钮文本', () => {
      const { showConfirm, buttons } = useModal()

      showConfirm('Confirm Title', 'Confirm Content', 'Yes', 'No')

      expect(buttons.value[0].text).toBe('No')
      expect(buttons.value[1].text).toBe('Yes')
    })

    it('点击确认按钮应该返回 true 并隐藏模态框', async () => {
      const { showConfirm, buttons, isVisible } = useModal()

      const promise = showConfirm('Confirm Title', 'Confirm Content')

      // 点击确认按钮
      buttons.value[1].action()

      const result = await promise
      expect(result).toBe(true)
      expect(isVisible.value).toBe(false)
    })

    it('点击取消按钮应该返回 false 并隐藏模态框', async () => {
      const { showConfirm, buttons, isVisible } = useModal()

      const promise = showConfirm('Confirm Title', 'Confirm Content')

      // 点击取消按钮
      buttons.value[0].action()

      const result = await promise
      expect(result).toBe(false)
      expect(isVisible.value).toBe(false)
    })
  })

  describe('hideModal', () => {
    it('应该隐藏模态框', () => {
      const { showModal, hideModal, isVisible } = useModal()

      showModal('Test Title', 'Test Content')
      expect(isVisible.value).toBe(true)

      hideModal()
      expect(isVisible.value).toBe(false)
    })

    it('当模态框已经隐藏时调用应该没有副作用', () => {
      const { hideModal, isVisible } = useModal()

      expect(isVisible.value).toBe(false)
      hideModal()
      expect(isVisible.value).toBe(false)
    })
  })

  describe('状态共享', () => {
    it('多次调用 useModal 应该返回相同的状态', () => {
      const modal1 = useModal()
      const modal2 = useModal()

      modal1.showModal('Test Title', 'Test Content')

      expect(modal2.isVisible.value).toBe(true)
      expect(modal2.title.value).toBe('Test Title')
      expect(modal2.content.value).toBe('Test Content')
    })

    it('一个实例的操作应该影响另一个实例', () => {
      const modal1 = useModal()
      const modal2 = useModal()

      modal1.showModal('Test Title', 'Test Content')
      expect(modal2.isVisible.value).toBe(true)

      modal2.hideModal()
      expect(modal1.isVisible.value).toBe(false)
    })
  })
})
