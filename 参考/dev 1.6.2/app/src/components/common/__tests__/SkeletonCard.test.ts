import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkeletonCard from '../SkeletonCard.vue'

describe('SkeletonCard', () => {
  describe('基本渲染', () => {
    it('应该渲染骨架屏卡片', () => {
      const wrapper = mount(SkeletonCard)

      const card = wrapper.find('.skeleton-card')
      expect(card.exists()).toBe(true)
    })

    it('应该有正确的 ARIA 属性', () => {
      const wrapper = mount(SkeletonCard)

      const card = wrapper.find('.skeleton-card')
      expect(card.attributes('role')).toBe('status')
      expect(card.attributes('aria-label')).toBe('正在加载内容')
    })

    it('应该渲染骨架屏图片占位符', () => {
      const wrapper = mount(SkeletonCard)

      const image = wrapper.find('.skeleton-image')
      expect(image.exists()).toBe(true)
    })

    it('应该渲染骨架屏内容区域', () => {
      const wrapper = mount(SkeletonCard)

      const content = wrapper.find('.skeleton-content')
      expect(content.exists()).toBe(true)
    })
  })

  describe('内容元素', () => {
    it('应该渲染标题占位符', () => {
      const wrapper = mount(SkeletonCard)

      const title = wrapper.find('.skeleton-title')
      expect(title.exists()).toBe(true)
    })

    it('应该渲染文本占位符', () => {
      const wrapper = mount(SkeletonCard)

      const texts = wrapper.findAll('.skeleton-text')
      expect(texts.length).toBeGreaterThan(0)
    })

    it('应该渲染短文本占位符', () => {
      const wrapper = mount(SkeletonCard)

      const shortText = wrapper.find('.skeleton-text.short')
      expect(shortText.exists()).toBe(true)
    })

    it('应该渲染页脚区域', () => {
      const wrapper = mount(SkeletonCard)

      const footer = wrapper.find('.skeleton-footer')
      expect(footer.exists()).toBe(true)
    })

    it('应该渲染徽章占位符', () => {
      const wrapper = mount(SkeletonCard)

      const badges = wrapper.findAll('.skeleton-badge')
      expect(badges.length).toBe(2)
    })
  })

  describe('组件结构', () => {
    it('应该有正确的元素层次结构', () => {
      const wrapper = mount(SkeletonCard)

      const card = wrapper.find('.skeleton-card')
      const image = card.find('.skeleton-image')
      const content = card.find('.skeleton-content')

      expect(image.exists()).toBe(true)
      expect(content.exists()).toBe(true)
    })

    it('应该在内容区域包含所有必要的子元素', () => {
      const wrapper = mount(SkeletonCard)

      const content = wrapper.find('.skeleton-content')
      const title = content.find('.skeleton-title')
      const texts = content.findAll('.skeleton-text')
      const footer = content.find('.skeleton-footer')

      expect(title.exists()).toBe(true)
      expect(texts.length).toBeGreaterThan(0)
      expect(footer.exists()).toBe(true)
    })

    it('应该按正确的顺序渲染元素', () => {
      const wrapper = mount(SkeletonCard)

      const card = wrapper.find('.skeleton-card')
      const children = card.element.children

      // 第一个子元素应该是图片
      expect(children[0].classList.contains('skeleton-image')).toBe(true)
      // 第二个子元素应该是内容区域
      expect(children[1].classList.contains('skeleton-content')).toBe(true)
    })
  })

  describe('CSS 类', () => {
    it('应该有所有必需的 CSS 类', () => {
      const wrapper = mount(SkeletonCard)

      expect(wrapper.find('.skeleton-card').exists()).toBe(true)
      expect(wrapper.find('.skeleton-image').exists()).toBe(true)
      expect(wrapper.find('.skeleton-content').exists()).toBe(true)
      expect(wrapper.find('.skeleton-title').exists()).toBe(true)
      expect(wrapper.find('.skeleton-text').exists()).toBe(true)
      expect(wrapper.find('.skeleton-footer').exists()).toBe(true)
      expect(wrapper.find('.skeleton-badge').exists()).toBe(true)
    })

    it('应该正确应用 short 类到文本元素', () => {
      const wrapper = mount(SkeletonCard)

      const shortText = wrapper.find('.skeleton-text.short')
      expect(shortText.exists()).toBe(true)
      expect(shortText.classes()).toContain('skeleton-text')
      expect(shortText.classes()).toContain('short')
    })
  })

  describe('多实例渲染', () => {
    it('应该能够渲染多个独立的骨架屏卡片', () => {
      const wrapper = mount({
        components: { SkeletonCard },
        template: `
          <div>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        `,
      })

      const cards = wrapper.findAllComponents(SkeletonCard)
      expect(cards.length).toBe(3)
    })
  })

  describe('无 Props 组件', () => {
    it('应该在没有任何 props 的情况下正常工作', () => {
      const wrapper = mount(SkeletonCard)

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.skeleton-card').exists()).toBe(true)
    })

    it('应该不接受任何 props', () => {
      const wrapper = mount(SkeletonCard)

      // SkeletonCard 是纯展示组件,不应该有 props
      expect(Object.keys(wrapper.props()).length).toBe(0)
    })
  })
})
