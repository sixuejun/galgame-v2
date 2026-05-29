import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SafeImage from '../SafeImage.vue'
import { logger } from '../../../utils/logger'

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('SafeImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染测试', () => {
    it('应该渲染图片容器', () => {
      const wrapper = mount(SafeImage, {
        props: {
          src: 'https://example.com/image.jpg',
        },
      })

      expect(wrapper.find('.safe-image-container').exists()).toBe(true)
    })

    it('应该渲染图片元素', () => {
      const wrapper = mount(SafeImage, {
        props: {
          src: 'https://example.com/image.jpg',
          alt: '测试图片',
        },
      })

      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://example.com/image.jpg')
      expect(img.attributes('alt')).toBe('测试图片')
    })

    it('应该设置懒加载属性', () => {
      const wrapper = mount(SafeImage, {
        props: {
          src: 'https://example.com/image.jpg',
        },
      })

      const img = wrapper.find('img')
      expect(img.attributes('loading')).toBe('lazy')
    })

    it('应该应用自定义样式类', () => {
      const wrapper = mount(SafeImage, {
        props: {
          src: 'https://example.com/image.jpg',
          imageClass: 'custom-class',
        },
      })

      const img = wrapper.find('img')
      expect(img.classes()).toContain('custom-class')
    })
  })

  describe('默认 Props', () => {
    it('应该使用默认的 alt 值', () => {
      const wrapper = mount(SafeImage, {
        props: {
          src: 'https://example.com/image.jpg',
        },
      })

      const img = wrapper.find('img')
      expect(img.attributes('alt')).toBe('image')
    })

    it('应该使用默认的 fallbackIcon', async () => {
      const wrapper = mount(SafeImage, {
        props: {
          src: 'https://example.com/invalid-image.jpg',
        },
      })

      const img = wrapper.find('img')
      await img.trigger('error')

      const fallbackIcon = wrapper.find('.fallback-icon i')
      expect(fallbackIcon.classes()).toContain('fas')
      expect(fallbackIcon.classes()).toContain('fa-image')
    })
  })

  describe('图片加载成功', () => {
    it('加载成功时应该显示图片', async () => {
      const wrapper = mount(SafeImage, {
        props: {
          src: 'https://example.com/image.jpg',
        },
      })

      const img = wrapper.find('img')
      await img.trigger('load')

      expect(wrapper.find('img').exists()).toBe(true)
      expect(wrapper.find('.fallback-icon').exists()).toBe(false)
    })

    it('加载成功时不应该记录日志', async () => {
      const wrapper = mount(SafeImage, {
        props: {
          src: 'https://example.com/image.jpg',
        },
      })

      const img = wrapper.find('img')
      await img.trigger('load')

      expect(logger.warn).not.toHaveBeenCalled()
    })
  })

  describe('图片加载失败', () => {
    it('加载失败时应该显示备用图标', async () => {
      const wrapper = mount(SafeImage, {
        props: {
          src: 'https://example.com/invalid-image.jpg',
        },
      })

      const img = wrapper.find('img')
      await img.trigger('error')

      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.find('.fallback-icon').exists()).toBe(true)
    })

    it('加载失败时应该记录警告日志', async () => {
      const wrapper = mount(SafeImage, {
        props: {
          src: 'https://example.com/invalid-image.jpg',
        },
      })

      const img = wrapper.find('img')
      await img.trigger('error')

      expect(logger.warn).toHaveBeenCalledWith(
        '图片加载失败: https://example.com/invalid-image.jpg'
      )
    })

    it('应该显示自定义备用图标', async () => {
      const wrapper = mount(SafeImage, {
        props: {
          src: 'https://example.com/invalid-image.jpg',
          fallbackIcon: 'fas fa-user',
        },
      })

      const img = wrapper.find('img')
      await img.trigger('error')

      const fallbackIcon = wrapper.find('.fallback-icon i')
      expect(fallbackIcon.classes()).toContain('fas')
      expect(fallbackIcon.classes()).toContain('fa-user')
    })

    it('备用图标应该应用自定义样式类', async () => {
      const wrapper = mount(SafeImage, {
        props: {
          src: 'https://example.com/invalid-image.jpg',
          imageClass: 'custom-class',
        },
      })

      const img = wrapper.find('img')
      await img.trigger('error')

      const fallbackIcon = wrapper.find('.fallback-icon')
      expect(fallbackIcon.classes()).toContain('custom-class')
    })
  })

  describe('状态切换', () => {
    it('从加载失败恢复到加载成功', async () => {
      const wrapper = mount(SafeImage, {
        props: {
          src: 'https://example.com/image.jpg',
        },
      })

      // 先触发错误
      const img = wrapper.find('img')
      await img.trigger('error')
      expect(wrapper.find('.fallback-icon').exists()).toBe(true)

      // 再触发加载成功
      await img.trigger('load')
      expect(wrapper.find('img').exists()).toBe(true)
      expect(wrapper.find('.fallback-icon').exists()).toBe(false)
    })
  })

  describe('Props 更新', () => {
    it('更新 src 应该重新渲染图片', async () => {
      const wrapper = mount(SafeImage, {
        props: {
          src: 'https://example.com/image1.jpg',
        },
      })

      await wrapper.setProps({ src: 'https://example.com/image2.jpg' })

      const img = wrapper.find('img')
      expect(img.attributes('src')).toBe('https://example.com/image2.jpg')
    })

    it('更新 alt 应该更新图片的 alt 属性', async () => {
      const wrapper = mount(SafeImage, {
        props: {
          src: 'https://example.com/image.jpg',
          alt: '原始描述',
        },
      })

      await wrapper.setProps({ alt: '新描述' })

      const img = wrapper.find('img')
      expect(img.attributes('alt')).toBe('新描述')
    })
  })

  describe('边界情况', () => {
    it('应该处理空 src', () => {
      const wrapper = mount(SafeImage, {
        props: {
          src: '',
        },
      })

      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('')
    })

    it('应该处理特殊字符的 src', () => {
      const specialSrc = 'https://example.com/图片.jpg?param=值&other=测试'
      const wrapper = mount(SafeImage, {
        props: {
          src: specialSrc,
        },
      })

      const img = wrapper.find('img')
      expect(img.attributes('src')).toBe(specialSrc)
    })

    it('应该处理 data URL', () => {
      const dataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const wrapper = mount(SafeImage, {
        props: {
          src: dataUrl,
        },
      })

      const img = wrapper.find('img')
      expect(img.attributes('src')).toBe(dataUrl)
    })
  })
})
