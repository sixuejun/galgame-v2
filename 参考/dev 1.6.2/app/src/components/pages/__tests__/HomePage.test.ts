import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import HomePage from '../HomePage.vue'
import type { Config, Story, Choice } from '../../../types'

// Mock 子组件
vi.mock('../HomePage/HomeHeader.vue', () => ({
  default: {
    name: 'HomeHeader',
    template: `
      <div v-if="show" class="home-header">
        <h1 id="page-title">{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </div>
    `,
    props: ['show', 'title', 'subtitle'],
  },
}))

vi.mock('../HomePage/StoryDisplay.vue', () => ({
  default: {
    name: 'StoryDisplay',
    template: `
      <div class="scene-content">
        <div v-if="story?.time || story?.location || story?.weather" class="scene-header">
          <div v-if="story?.time" class="scene-meta" data-label="时间">
            <span class="scene-meta-value">{{ story.time }}</span>
          </div>
          <div v-if="story?.location" class="scene-meta" data-label="地点">
            <span class="scene-meta-value">{{ story.location }}</span>
          </div>
          <div v-if="story?.weather" class="scene-meta" data-label="天气">
            <span class="scene-meta-value">{{ story.weather }}</span>
          </div>
        </div>
        <div class="scene-content-main" v-html="sanitizedContent"></div>
      </div>
    `,
    props: ['story', 'sanitizedContent'],
  },
}))

vi.mock('../HomePage/ChoicesPanel.vue', () => ({
  default: {
    name: 'ChoicesPanel',
    template: '<div class="choices-panel-mock"></div>',
    props: ['choices', 'choiceHeader'],
    emits: ['choose'],
  },
}))

// Mock sanitize 工具
vi.mock('../../../utils/sanitize', () => ({
  sanitizeHTML: vi.fn((html: string) => html),
}))

// Mock imageParser 工具
vi.mock('../../../utils/imageParser/', () => ({
  hasImageShorthand: vi.fn((content: string) => content.includes('[img:')),
  parseAndConvertImageShorthand: vi.fn((content: string) => {
    // 简单的模拟实现
    if (content.includes('[img:')) {
      return '<div style="background-image:url(test.jpg)">Converted Image Block</div>'
    }
    return content
  }),
  parseAndConvertImageShorthandAsync: vi.fn(async (content: string) => {
    // 简单的模拟实现
    if (content.includes('[img:')) {
      return '<div style="background-image:url(test.jpg)">Converted Image Block</div>'
    }
    return content
  }),
  parseAndConvertImageShorthandAsyncWithCallback: vi.fn((content: string) => {
    // 简单的模拟实现 - 返回字符串而不是 Promise
    if (content.includes('[img:')) {
      return '<div style="background-image:url(test.jpg)">Converted Image Block</div>'
    }
    return content
  }),
}))

describe('HomePage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockConfig: Config = {
    version: '1.0.0',
    phase: '测试阶段',
    home: {
      title: '伊甸园系统',
      subtitle: '互动式故事游戏',
    },
  }

  const mockStory: Story = {
    content: '<p>这是故事内容</p>',
    time: '2024年1月1日',
    location: '伊甸园',
    weather: '晴朗',
  }

  const mockChoices: Choice[] = [{ text: '选择1' }, { text: '选择2' }]

  describe('渲染测试', () => {
    it('应该渲染主页容器', () => {
      const wrapper = mount(HomePage)

      expect(wrapper.find('.page-home').exists()).toBe(true)
    })

    it('应该渲染标题和副标题', () => {
      const wrapper = mount(HomePage, {
        props: { config: mockConfig },
      })

      expect(wrapper.find('.home-header h1').text()).toBe('伊甸园系统')
      expect(wrapper.find('.home-header p').text()).toBe('互动式故事游戏')
    })

    it('应该渲染场景内容', () => {
      const wrapper = mount(HomePage, {
        props: { story: mockStory },
      })

      expect(wrapper.find('.scene-content').exists()).toBe(true)
      expect(wrapper.find('.scene-content-main').exists()).toBe(true)
    })

    it('应该渲染 ChoicesPanel', () => {
      const wrapper = mount(HomePage)

      expect(wrapper.find('.choices-panel-mock').exists()).toBe(true)
    })
  })

  describe('场景头部测试', () => {
    it('有场景元数据时应该显示场景头部', () => {
      const wrapper = mount(HomePage, {
        props: { story: mockStory },
      })

      expect(wrapper.find('.scene-header').exists()).toBe(true)
    })

    it('应该显示时间信息', () => {
      const wrapper = mount(HomePage, {
        props: { story: mockStory },
      })

      const timeMeta = wrapper.find('[data-label="时间"]')
      expect(timeMeta.exists()).toBe(true)
      expect(timeMeta.find('.scene-meta-value').text()).toBe('2024年1月1日')
    })

    it('应该显示地点信息', () => {
      const wrapper = mount(HomePage, {
        props: { story: mockStory },
      })

      const locationMeta = wrapper.find('[data-label="地点"]')
      expect(locationMeta.exists()).toBe(true)
      expect(locationMeta.find('.scene-meta-value').text()).toBe('伊甸园')
    })

    it('应该显示天气信息', () => {
      const wrapper = mount(HomePage, {
        props: { story: mockStory },
      })

      const weatherMeta = wrapper.find('[data-label="天气"]')
      expect(weatherMeta.exists()).toBe(true)
      expect(weatherMeta.find('.scene-meta-value').text()).toBe('晴朗')
    })

    it('没有场景元数据时不应该显示场景头部', () => {
      const wrapper = mount(HomePage, {
        props: {
          story: { content: '内容' },
        },
      })

      expect(wrapper.find('.scene-header').exists()).toBe(false)
    })
  })

  describe('Props 测试', () => {
    it('应该接受 config prop', () => {
      const wrapper = mount(HomePage, {
        props: { config: mockConfig },
      })

      expect(wrapper.props('config')).toEqual(mockConfig)
    })

    it('应该接受 story prop', () => {
      const wrapper = mount(HomePage, {
        props: { story: mockStory },
      })

      expect(wrapper.props('story')).toEqual(mockStory)
    })

    it('应该接受 choices prop', () => {
      const wrapper = mount(HomePage, {
        props: { choices: mockChoices },
      })

      expect(wrapper.props('choices')).toEqual(mockChoices)
    })

    it('choices 应该有默认值', () => {
      const wrapper = mount(HomePage)

      expect(wrapper.props('choices')).toEqual([])
    })
  })

  describe('内容清理测试', () => {
    it('应该显示故事内容', async () => {
      const wrapper = mount(HomePage, {
        props: { story: mockStory },
      })

      await flushPromises()

      const content = wrapper.find('.scene-content-main')
      expect(content.html()).toContain('这是故事内容')
    })

    it('没有故事时应该显示默认内容', async () => {
      const wrapper = mount(HomePage)

      await flushPromises()

      const content = wrapper.find('.scene-content-main')
      expect(content.html()).toContain('故事内容加载中...')
    })
  })

  describe('图片简写格式测试', () => {
    it('应该检测并转换图片简写格式', async () => {
      const storyWithImage: Story = {
        content: '[img:https://example.com/test.jpg]\n测试文字',
      }

      const wrapper = mount(HomePage, {
        props: { story: storyWithImage },
      })

      await flushPromises()

      const content = wrapper.find('.scene-content-main')
      expect(content.html()).toContain('Converted Image Block')
    })

    it('没有图片简写格式时应该正常显示内容', async () => {
      const wrapper = mount(HomePage, {
        props: { story: mockStory },
      })

      await flushPromises()

      const content = wrapper.find('.scene-content-main')
      expect(content.html()).toContain('这是故事内容')
    })
  })

  describe('事件测试', () => {
    it('应该触发 choose 事件', async () => {
      const wrapper = mount(HomePage, {
        props: { choices: mockChoices },
      })

      // 模拟 ChoicesPanel 触发 choose 事件
      const choicesPanel = wrapper.findComponent({ name: 'ChoicesPanel' })
      await choicesPanel.vm.$emit('choose', '选择1')

      expect(wrapper.emitted('choose')).toBeTruthy()
      expect(wrapper.emitted('choose')?.[0]).toEqual(['选择1'])
    })
  })

  describe('可访问性测试', () => {
    it('应该有页面标题 ID', () => {
      const wrapper = mount(HomePage, {
        props: { config: mockConfig },
      })

      const title = wrapper.find('#page-title')
      expect(title.exists()).toBe(true)
    })
  })

  describe('Markdown 渲染测试', () => {
    it('应该解析 Markdown 加粗语法', async () => {
      // Mock window.marked
      const mockMarked = {
        parse: vi.fn((content: string) => content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')),
      }
      // @ts-expect-error - Mocking window.marked
      globalThis.window = { marked: mockMarked }

      const storyWithMarkdown: Story = {
        content: '这是 **加粗** 的文字',
      }

      const wrapper = mount(HomePage, {
        props: { story: storyWithMarkdown },
      })

      await flushPromises()

      expect(mockMarked.parse).toHaveBeenCalled()
      const content = wrapper.find('.scene-content-main')
      expect(content.html()).toContain('<strong>加粗</strong>')
    })

    it('应该解析 Markdown 斜体语法', async () => {
      // Mock window.marked
      const mockMarked = {
        parse: vi.fn((content: string) => content.replace(/\*(.+?)\*/g, '<em>$1</em>')),
      }
      // @ts-expect-error - Mocking window.marked
      globalThis.window = { marked: mockMarked }

      const storyWithMarkdown: Story = {
        content: '这是 *斜体* 的文字',
      }

      const wrapper = mount(HomePage, {
        props: { story: storyWithMarkdown },
      })

      await flushPromises()

      expect(mockMarked.parse).toHaveBeenCalled()
      const content = wrapper.find('.scene-content-main')
      expect(content.html()).toContain('<em>斜体</em>')
    })

    it('应该解析 Markdown 删除线语法', async () => {
      // Mock window.marked
      const mockMarked = {
        parse: vi.fn((content: string) => content.replace(/~~(.+?)~~/g, '<del>$1</del>')),
      }
      // @ts-expect-error - Mocking window.marked
      globalThis.window = { marked: mockMarked }

      const storyWithMarkdown: Story = {
        content: '这是 ~~删除线~~ 的文字',
      }

      const wrapper = mount(HomePage, {
        props: { story: storyWithMarkdown },
      })

      await flushPromises()

      expect(mockMarked.parse).toHaveBeenCalled()
      const content = wrapper.find('.scene-content-main')
      expect(content.html()).toContain('<del>删除线</del>')
    })

    it('当 marked 未加载时应该跳过 Markdown 解析', async () => {
      // @ts-expect-error - Mocking window without marked
      globalThis.window = {}

      const storyWithMarkdown: Story = {
        content: '这是 **加粗** 的文字',
      }

      const wrapper = mount(HomePage, {
        props: { story: storyWithMarkdown },
      })

      await flushPromises()

      const content = wrapper.find('.scene-content-main')
      // 应该显示原始 Markdown 语法
      expect(content.html()).toContain('**加粗**')
    })

    it('当 Markdown 解析失败时应该使用原始内容', () => {
      // Mock window.marked with error
      const mockMarked = {
        parse: vi.fn(() => {
          throw new Error('Markdown parse error')
        }),
      }
      // @ts-expect-error - Mocking window.marked
      globalThis.window = { marked: mockMarked }

      const storyWithMarkdown: Story = {
        content: '这是测试内容',
      }

      const wrapper = mount(HomePage, {
        props: { story: storyWithMarkdown },
      })

      // 应该继续渲染，不会崩溃
      const content = wrapper.find('.scene-content-main')
      expect(content.exists()).toBe(true)
    })
  })
})
