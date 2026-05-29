import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Icon from '../Icon.vue'
import SafeImage from '../SafeImage.vue'

describe('Icon', () => {
  describe('Font Awesome 图标', () => {
    it('应该渲染 Font Awesome 图标（完整类名）', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'fas fa-star',
          alt: '星标',
        },
      })

      const icon = wrapper.find('i')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('fas')
      expect(icon.classes()).toContain('fa-star')
      expect(icon.attributes('aria-label')).toBe('星标')
    })

    it('应该渲染 Font Awesome 图标（仅图标名）', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'fa-heart',
          alt: '心形',
        },
      })

      const icon = wrapper.find('i')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('fas')
      expect(icon.classes()).toContain('fa-heart')
    })

    it('应该支持不同的 Font Awesome 样式', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'far fa-circle',
          alt: '圆圈',
        },
      })

      const icon = wrapper.find('i')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('far')
      expect(icon.classes()).toContain('fa-circle')
    })

    it('应该支持 Font Awesome 品牌图标', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'fab fa-github',
          alt: 'GitHub',
        },
      })

      const icon = wrapper.find('i')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('fab')
      expect(icon.classes()).toContain('fa-github')
    })
  })

  describe('图片 URL', () => {
    it('应该渲染 HTTP 图片', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'http://example.com/icon.png',
          alt: '自定义图标',
        },
        global: {
          stubs: {
            SafeImage: true,
          },
        },
      })

      const safeImage = wrapper.findComponent({ name: 'SafeImage' })
      expect(safeImage.exists()).toBe(true)
    })

    it('应该渲染 HTTPS 图片', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'https://example.com/icon.png',
          alt: '自定义图标',
        },
        global: {
          stubs: {
            SafeImage: true,
          },
        },
      })

      const safeImage = wrapper.findComponent({ name: 'SafeImage' })
      expect(safeImage.exists()).toBe(true)
    })

    it('应该传递正确的 props 给 SafeImage', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'https://example.com/icon.png',
          alt: '自定义图标',
          fallbackIcon: 'fas fa-user',
        },
      })

      const safeImage = wrapper.findComponent(SafeImage)
      expect(safeImage.props('src')).toBe('https://example.com/icon.png')
      expect(safeImage.props('alt')).toBe('自定义图标')
      expect(safeImage.props('fallbackIcon')).toBe('fas fa-user')
      expect(safeImage.props('imageClass')).toBe('custom-icon')
    })

    it('应该使用默认的 fallbackIcon', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'https://example.com/icon.png',
          alt: '自定义图标',
        },
      })

      const safeImage = wrapper.findComponent(SafeImage)
      expect(safeImage.props('fallbackIcon')).toBe('fas fa-image')
    })
  })

  describe('纯文本图标', () => {
    it('应该渲染 Emoji 图标', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: '⭐',
          alt: '星星',
        },
      })

      const span = wrapper.find('span')
      expect(span.exists()).toBe(true)
      expect(span.text()).toBe('⭐')
      expect(span.attributes('aria-label')).toBe('星星')
    })

    it('应该渲染普通文本图标', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'A',
          alt: '字母A',
        },
      })

      const span = wrapper.find('span')
      expect(span.exists()).toBe(true)
      expect(span.text()).toBe('A')
    })

    it('应该渲染中文字符图标', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: '金',
          alt: '金色',
        },
      })

      const span = wrapper.find('span')
      expect(span.exists()).toBe(true)
      expect(span.text()).toBe('金')
    })
  })

  describe('默认 Props', () => {
    it('应该使用默认的 alt 值', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'fas fa-star',
        },
      })

      const icon = wrapper.find('i')
      expect(icon.attributes('aria-label')).toBe('图标')
    })

    it('应该使用默认的 fallbackIcon 值', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'https://example.com/icon.png',
        },
      })

      const safeImage = wrapper.findComponent(SafeImage)
      expect(safeImage.props('fallbackIcon')).toBe('fas fa-image')
    })
  })

  describe('图标类型识别', () => {
    it('应该正确识别 Font Awesome 图标（包含 fa-）', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'fas fa-star',
        },
      })

      expect(wrapper.find('i').exists()).toBe(true)
      expect(wrapper.find('span').exists()).toBe(false)
      expect(wrapper.findComponent(SafeImage).exists()).toBe(false)
    })

    it('应该正确识别 URL 图标（http://）', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'http://example.com/icon.png',
        },
        global: {
          stubs: {
            SafeImage: true,
          },
        },
      })

      expect(wrapper.find('i').exists()).toBe(false)
      expect(wrapper.find('span').exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'SafeImage' }).exists()).toBe(true)
    })

    it('应该正确识别 URL 图标（https://）', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'https://example.com/icon.png',
        },
        global: {
          stubs: {
            SafeImage: true,
          },
        },
      })

      expect(wrapper.find('i').exists()).toBe(false)
      expect(wrapper.find('span').exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'SafeImage' }).exists()).toBe(true)
    })

    it('应该正确识别纯文本图标', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: '⭐',
        },
      })

      expect(wrapper.find('i').exists()).toBe(false)
      expect(wrapper.find('span').exists()).toBe(true)
      expect(wrapper.findComponent(SafeImage).exists()).toBe(false)
    })
  })

  describe('边界情况', () => {
    it('应该处理空字符串', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: '',
        },
      })

      // 空字符串应该被识别为纯文本
      expect(wrapper.find('span').exists()).toBe(true)
      expect(wrapper.find('span').text()).toBe('')
    })

    it('应该处理包含 fa- 但不是 Font Awesome 的字符串', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'fa-custom-text',
        },
      })

      // 包含 fa- 应该被识别为 Font Awesome
      expect(wrapper.find('i').exists()).toBe(true)
    })

    it('应该处理类似 URL 但不是的字符串', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'ftp://example.com/icon.png',
        },
      })

      // 不是 http:// 或 https:// 应该被识别为纯文本
      expect(wrapper.find('span').exists()).toBe(true)
    })
  })

  describe('iconClass 计算属性', () => {
    it('仅图标名时应该添加 fas 前缀', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'fa-star',
        },
      })

      const icon = wrapper.find('i')
      expect(icon.classes()).toContain('fas')
      expect(icon.classes()).toContain('fa-star')
    })

    it('完整类名时应该保持原样', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'far fa-circle',
        },
      })

      const icon = wrapper.find('i')
      expect(icon.classes()).toContain('far')
      expect(icon.classes()).toContain('fa-circle')
    })

    it('非 Font Awesome 图标时应该返回空字符串', () => {
      const wrapper = mount(Icon, {
        props: {
          iconData: 'https://example.com/icon.png',
        },
      })

      // 不应该有 i 元素
      expect(wrapper.find('i').exists()).toBe(false)
    })
  })
})
