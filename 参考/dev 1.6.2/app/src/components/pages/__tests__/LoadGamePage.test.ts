// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import LoadGamePage from '../LoadGamePage.vue'

// Mock 子组件
vi.mock('../../common/ErrorBoundary.vue', () => ({
  default: {
    name: 'ErrorBoundary',
    template: '<div class="error-boundary-mock"><slot /></div>',
  },
}))

vi.mock('../LoadGamePage/LoadGameHeader.vue', () => ({
  default: {
    name: 'LoadGameHeader',
    template: `
      <div class="load-header">
        <h1 class="load-title">读取存档</h1>
        <div class="header-actions">
          <button class="import-btn" @click="$emit('import-click')">导入</button>
          <button class="clear-btn" @click="$emit('clear-click')">清空</button>
        </div>
      </div>
    `,
    props: ['isOperating'],
    emits: ['import-click', 'clear-click'],
  },
}))

vi.mock('../LoadGamePage/LoadGameContent.vue', () => ({
  default: {
    name: 'LoadGameContent',
    template: `
      <div class="load-content">
        <div v-if="isLoading" class="loading-state">
          <span>正在加载存档列表...</span>
        </div>
        <div v-else-if="errorMessage" class="error-state">
          <span>{{ errorMessage }}</span>
          <button class="retry-btn" @click="$emit('retry')">重试</button>
        </div>
        <div v-else-if="paginatedSaves.length === 0" class="empty-state">
          <p>暂无存档</p>
        </div>
        <div v-else class="saves-content">
          <div class="save-list-table-mock"></div>
          <div class="save-list-pagination-mock"></div>
        </div>
      </div>
    `,
    props: [
      'isLoading',
      'errorMessage',
      'paginatedSaves',
      'isOperating',
      'currentPage',
      'totalPages',
      'getSaveIcon',
      'getSaveTypeText',
      'formatTime',
    ],
    emits: ['load', 'export', 'delete', 'retry', 'prev-page', 'next-page'],
  },
}))

vi.mock('../LoadGamePage/SaveListTable.vue', () => ({
  default: {
    name: 'SaveListTable',
    template: '<div class="save-list-table-mock"></div>',
  },
}))

vi.mock('../LoadGamePage/SaveListPagination.vue', () => ({
  default: {
    name: 'SaveListPagination',
    template: '<div class="save-list-pagination-mock"></div>',
  },
}))

// Mock composables
const mockIsLoading = ref(false)
const mockErrorMessage = ref('')
const mockCurrentPage = ref(1)
const mockTotalPages = ref(1)
const mockPaginatedSaves = ref([])
const mockPrevPage = vi.fn()
const mockNextPage = vi.fn()
const mockLoadSaves = vi.fn()
const mockGetSaveIcon = vi.fn()
const mockGetSaveTypeText = vi.fn()
const mockFormatTime = vi.fn()

vi.mock('../../../composables/save/useSaveList', () => ({
  useSaveList: () => ({
    isLoading: mockIsLoading,
    errorMessage: mockErrorMessage,
    currentPage: mockCurrentPage,
    totalPages: mockTotalPages,
    paginatedSaves: mockPaginatedSaves,
    prevPage: mockPrevPage,
    nextPage: mockNextPage,
    loadSaves: mockLoadSaves,
    getSaveIcon: mockGetSaveIcon,
    getSaveTypeText: mockGetSaveTypeText,
    formatTime: mockFormatTime,
  }),
}))

const mockIsOperating = ref(false)
const mockFileInputRef = ref(null)
const mockExportSave = vi.fn()
const mockHandleImportClick = vi.fn()
const mockHandleFileSelectBase = vi.fn()

vi.mock('../../../composables/save/useSaveOperations', () => ({
  useSaveOperations: () => ({
    isOperating: mockIsOperating,
    fileInputRef: mockFileInputRef,
    exportSave: mockExportSave,
    handleImportClick: mockHandleImportClick,
    handleFileSelect: mockHandleFileSelectBase,
  }),
}))

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}))

describe('LoadGamePage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    mockIsLoading.value = false
    mockErrorMessage.value = ''
    mockCurrentPage.value = 1
    mockTotalPages.value = 1
    mockPaginatedSaves.value = []
    mockIsOperating.value = false
  })

  describe('渲染测试', () => {
    it('应该渲染读取存档页面容器', () => {
      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.load-game-page').exists()).toBe(true)
    })

    it('应该渲染 ErrorBoundary', () => {
      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.error-boundary-mock').exists()).toBe(true)
    })

    it('应该渲染标题', () => {
      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      const title = wrapper.find('.load-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toContain('读取存档')
    })

    it('应该渲染导入和清空按钮', () => {
      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.import-btn').exists()).toBe(true)
      expect(wrapper.find('.clear-btn').exists()).toBe(true)
    })

    it('应该渲染隐藏的文件输入', () => {
      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      const fileInput = wrapper.find('input[type="file"]')
      expect(fileInput.exists()).toBe(true)
      expect(fileInput.attributes('accept')).toBe('.yaml,.yml')
    })
  })

  describe('加载状态', () => {
    it('加载时应该显示加载状态', () => {
      mockIsLoading.value = true

      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.loading-state').exists()).toBe(true)
      expect(wrapper.find('.loading-state span').text()).toBe('正在加载存档列表...')
    })

    it('加载完成后不应该显示加载状态', () => {
      mockIsLoading.value = false

      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.loading-state').exists()).toBe(false)
    })
  })

  describe('错误状态', () => {
    it('有错误时应该显示错误状态', () => {
      mockIsLoading.value = false
      mockErrorMessage.value = '加载失败'

      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.error-state').exists()).toBe(true)
      expect(wrapper.find('.error-state span').text()).toBe('加载失败')
    })

    it('点击重试按钮应该调用 loadSaves', async () => {
      mockIsLoading.value = false
      mockErrorMessage.value = '加载失败'

      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      await wrapper.find('.retry-btn').trigger('click')

      expect(mockLoadSaves).toHaveBeenCalled()
    })
  })

  describe('空状态', () => {
    it('没有存档时应该显示空状态', () => {
      mockIsLoading.value = false
      mockErrorMessage.value = ''
      mockPaginatedSaves.value = []

      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-state p').text()).toBe('暂无存档')
    })

    it('有存档时不应该显示空状态', () => {
      mockIsLoading.value = false
      mockErrorMessage.value = ''
      mockPaginatedSaves.value = [{ name: 'save1', timestamp: Date.now(), type: 'auto' }]

      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.empty-state').exists()).toBe(false)
    })
  })

  describe('存档列表', () => {
    it('有存档时应该显示存档列表', () => {
      mockIsLoading.value = false
      mockErrorMessage.value = ''
      mockPaginatedSaves.value = [{ name: 'save1', timestamp: Date.now(), type: 'auto' }]

      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.save-list-table-mock').exists()).toBe(true)
      expect(wrapper.find('.save-list-pagination-mock').exists()).toBe(true)
    })
  })

  describe('事件触发', () => {
    it('点击导入按钮应该调用 handleImportClick', async () => {
      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      await wrapper.find('.import-btn').trigger('click')

      expect(mockHandleImportClick).toHaveBeenCalled()
    })

    it('点击清空按钮应该触发 clearAll 事件', async () => {
      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      await wrapper.find('.clear-btn').trigger('click')

      expect(wrapper.emitted('clearAll')).toBeTruthy()
    })

    it('handleLoad 应该触发 load 事件', () => {
      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.handleLoad('save1')

      expect(wrapper.emitted('load')).toBeTruthy()
      expect(wrapper.emitted('load')?.[0]).toEqual(['save1'])
    })

    it('handleDelete 应该触发 delete 事件', () => {
      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.handleDelete('save1')

      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')?.[0]).toEqual(['save1'])
    })
  })

  describe('暴露方法', () => {
    it('loadSaves 应该调用 composable 的 loadSaves', () => {
      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.loadSaves()

      expect(mockLoadSaves).toHaveBeenCalled()
    })

    it('setOperating 应该设置 isOperating 的值', () => {
      const wrapper = mount(LoadGamePage, {
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.setOperating(true)

      expect(mockIsOperating.value).toBe(true)
    })
  })
})
