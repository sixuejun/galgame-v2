import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SettingsPage from '../SettingsPage.vue'
import type { Config } from '../../../types'

describe('SettingsPage', () => {
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

  describe('渲染测试', () => {
    it('应该渲染设置页面容器', () => {
      const wrapper = mount(SettingsPage)

      expect(wrapper.find('.settings-page').exists()).toBe(true)
    })

    it('应该渲染页面标题', () => {
      const wrapper = mount(SettingsPage, {
        props: { config: mockConfig },
      })

      const title = wrapper.find('.page-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toContain('设置')
    })

    it('应该渲染标题图标', () => {
      const wrapper = mount(SettingsPage)

      const icon = wrapper.find('.page-title i.fa-cog')
      expect(icon.exists()).toBe(true)
    })

    it('应该渲染设置内容区域', () => {
      const wrapper = mount(SettingsPage)

      expect(wrapper.find('.settings-content').exists()).toBe(true)
    })

    it('应该渲染系统设置区域', () => {
      const wrapper = mount(SettingsPage)

      const settingsSection = wrapper.find('.settings-section')
      expect(settingsSection.exists()).toBe(true)
    })

    it('应该渲染设置项', () => {
      const wrapper = mount(SettingsPage)

      const settingItems = wrapper.findAll('.setting-item')
      expect(settingItems.length).toBeGreaterThan(0)
    })
  })

  describe('Props 测试', () => {
    it('应该接受 config prop', () => {
      const wrapper = mount(SettingsPage, {
        props: { config: mockConfig },
      })

      expect(wrapper.props('config')).toEqual(mockConfig)
    })

    it('没有 config 时应该使用默认标题', () => {
      const wrapper = mount(SettingsPage)

      const title = wrapper.find('.page-title')
      expect(title.text()).toContain('设置')
    })
  })

  describe('可访问性测试', () => {
    it('应该有页面标题 ID', () => {
      const wrapper = mount(SettingsPage)

      const title = wrapper.find('#page-title')
      expect(title.exists()).toBe(true)
    })
  })
})
