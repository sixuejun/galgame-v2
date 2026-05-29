import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, computed } from 'vue'
import App from '../App.vue'

// Mock 所有子组件
vi.mock('../components/common/ErrorBoundary.vue', () => ({
  default: {
    name: 'ErrorBoundary',
    template: '<div class="error-boundary-mock"><slot /></div>',
    emits: ['error'],
  },
}))

vi.mock('../components/common/LoadingSpinner.vue', () => ({
  default: {
    name: 'LoadingSpinner',
    template: '<div class="loading-spinner-mock"></div>',
    props: ['message'],
  },
}))

vi.mock('../components/pages/InitializationPage.vue', () => ({
  default: {
    name: 'InitializationPage',
    template: '<div class="initialization-page-mock"></div>',
    props: ['systemInstruction'],
    emits: ['generate'],
  },
}))

vi.mock('../components/layout/NavBar.vue', () => ({
  default: {
    name: 'NavBar',
    template: '<div class="navbar-mock"></div>',
    props: ['navButtons', 'currentPage', 'phase'],
    emits: ['navigate', 'save', 'load'],
  },
}))

vi.mock('../components/layout/PageRouter.vue', () => ({
  default: {
    name: 'PageRouter',
    template: '<div class="page-router-mock"></div>',
    props: [
      'currentPage',
      'config',
      'story',
      'choices',
      'characters',
      'shop',
      'storage',
      'achievements',
      'summaries',
    ],
    emits: ['choose', 'load-save', 'delete-save', 'import-save', 'clear-all-saves'],
  },
}))

vi.mock('../components/common/ScrollToTopButton.vue', () => ({
  default: {
    name: 'ScrollToTopButton',
    template: '<div class="scroll-to-top-mock"></div>',
  },
}))

vi.mock('../components/layout/Modal.vue', () => ({
  default: {
    name: 'Modal',
    template: '<div class="modal-mock"></div>',
    props: ['isVisible', 'title', 'content', 'buttons'],
    emits: ['close'],
  },
}))

vi.mock('../components/common/ToastContainer.vue', () => ({
  default: {
    name: 'ToastContainer',
    template: '<div class="toast-container-mock"></div>',
  },
}))

vi.mock('../components/layout/AILoadingOverlay.vue', () => ({
  default: {
    name: 'AILoadingOverlay',
    template: '<div class="ai-loading-overlay-mock"></div>',
    props: ['isVisible', 'message', 'isRetrying', 'retryCount', 'maxRetries', 'retryReason'],
  },
}))

// Mock composables - 使用可变的 ref 以便在测试中修改
const mockLoadData = vi.fn()
const mockSaveInitializationData = vi.fn()
const mockNavigateTo = vi.fn()
const mockShowConfirm = vi.fn()
const mockHideModal = vi.fn()
const mockShowSuccessToast = vi.fn()
const mockShowErrorToast = vi.fn()
const mockShowWarningToast = vi.fn()
const mockShowInfoToast = vi.fn()
const mockHandleManualSave = vi.fn()
const mockHandleLoadSave = vi.fn()
const mockHandleDeleteSave = vi.fn()
const mockHandleImportSave = vi.fn()
const mockHandleClearAllSaves = vi.fn()
const mockHandleInitGenerate = vi.fn()
const mockHandleChoice = vi.fn()
const mockSyncHeight = vi.fn()
const mockStartAchievementWatching = vi.fn()

// 创建可变的状态
const mockIsLoading = ref(false)
const mockLoadError = ref('')
const mockNeedsInitialization = ref(false)

vi.mock('../stores/gameStore', () => ({
  useGameStore: () => ({
    gameData: ref({}),
    isLoading: mockIsLoading,
    loadError: mockLoadError,
    config: ref(null),
    story: ref(null),
    choices: ref([]),
    characters: ref({}),
    shop: ref(null),
    storage: ref(null),
    achievements: ref(null),
    summaries: ref([]),
    needsInitialization: mockNeedsInitialization,
    loadData: mockLoadData,
    saveInitializationData: mockSaveInitializationData,
  }),
}))

vi.mock('../composables/ai/useAICommunication', () => ({
  useAICommunication: () => ({
    isGenerating: ref(false),
    isAIAvailable: ref(true),
  }),
}))

vi.mock('../composables/ui/useModal', () => ({
  useModal: () => ({
    isVisible: ref(false),
    title: ref(''),
    content: ref(''),
    buttons: ref([]),
    showConfirm: mockShowConfirm,
    hideModal: mockHideModal,
  }),
}))

vi.mock('../composables/ui/useToast', () => ({
  useToast: () => ({
    success: mockShowSuccessToast,
    error: mockShowErrorToast,
    warning: mockShowWarningToast,
    info: mockShowInfoToast,
  }),
}))

vi.mock('../composables/ui/usePageNavigation', () => ({
  usePageNavigation: () => ({
    currentPage: ref('home'),
    navigateTo: mockNavigateTo,
  }),
}))

vi.mock('../composables/save/useSaveManagement', () => ({
  useSaveManagement: () => ({
    handleManualSave: mockHandleManualSave,
    handleLoadSave: mockHandleLoadSave,
    handleDeleteSave: mockHandleDeleteSave,
    handleImportSave: mockHandleImportSave,
    handleClearAllSaves: mockHandleClearAllSaves,
  }),
}))

vi.mock('../composables/game/useGameInitialization', () => ({
  useGameInitialization: () => ({
    systemInstruction: ref('默认系统指令'),
    handleInitGenerate: mockHandleInitGenerate,
  }),
}))

vi.mock('../composables/game/usePlayerChoice', () => ({
  usePlayerChoice: () => ({
    handleChoice: mockHandleChoice,
  }),
}))

vi.mock('../composables/achievement/useAchievementUnlock', () => ({
  useAchievementsAutoUnlock: () => ({
    startWatching: mockStartAchievementWatching,
  }),
}))

// Mock 新的 app composables
vi.mock('../composables/app/useAppLifecycle', async () => {
  // 动态导入 Vue 的 onMounted
  const { onMounted } = await import('vue')

  return {
    useAppLifecycle: (options: {
      gameStore: { loadData: () => void }
      startAchievementWatching: () => void
    }) => {
      // 使用真实的 onMounted，这样它会在组件挂载时同步调用
      onMounted(() => {
        options.gameStore.loadData()
        options.startAchievementWatching()
      })

      return {
        handleRetry: () => {
          options.gameStore.loadData()
        },
      }
    },
  }
})

vi.mock('../composables/app/useAppErrorHandling', () => ({
  useAppErrorHandling: () => ({
    handleError: vi.fn(),
  }),
}))

vi.mock('../composables/app/useHeightSync', () => ({
  useHeightSync: () => ({
    syncHeight: mockSyncHeight,
  }),
}))

vi.mock('../composables/app/useAILoadingOverlay', () => ({
  useAILoadingOverlay: () => ({
    isLoadingAI: ref(false),
    aiLoadingMessage: computed(() => 'AI 正在思考中，请稍候...'),
    isAnyRetrying: ref(false),
    currentRetryCount: ref(0),
    currentMaxRetries: ref(3),
    currentRetryReason: ref(''),
  }),
}))

vi.mock('../utils/errorHandler', () => ({
  setToastCallback: vi.fn(),
}))

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('App', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // 重置所有状态
    mockIsLoading.value = false
    mockLoadError.value = ''
    mockNeedsInitialization.value = false
  })

  describe('渲染测试', () => {
    it('应该渲染应用容器', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('#app-wrapper').exists()).toBe(true)
      expect(wrapper.find('#eden-container').exists()).toBe(true)
    })

    it('应该渲染 ErrorBoundary', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.error-boundary-mock').exists()).toBe(true)
    })
  })

  describe('生命周期测试', () => {
    it('onMounted 应该调用 loadData', () => {
      mount(App, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(mockLoadData).toHaveBeenCalledTimes(1)
    })

    it('onMounted 应该启动成就自动解锁监听', () => {
      mount(App, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(mockStartAchievementWatching).toHaveBeenCalledTimes(1)
    })
  })

  describe('加载状态测试', () => {
    it('当 isLoading 为 true 时应该显示 LoadingSpinner', () => {
      mockIsLoading.value = true

      const wrapper = mount(App, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.loading-spinner-mock').exists()).toBe(true)
    })

    it('当 isLoading 为 false 时不应该显示 LoadingSpinner', () => {
      mockIsLoading.value = false

      const wrapper = mount(App, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.loading-spinner-mock').exists()).toBe(false)
    })
  })

  describe('错误处理测试', () => {
    it('当 loadError 存在时应该显示错误容器', () => {
      mockLoadError.value = '加载失败'

      const wrapper = mount(App, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.error-container').exists()).toBe(true)
      expect(wrapper.find('.error-message').text()).toBe('加载失败')
    })

    it('点击重试按钮应该调用 loadData', async () => {
      mockLoadError.value = '加载失败'

      const wrapper = mount(App, {
        global: {
          plugins: [createPinia()],
        },
      })

      const retryButton = wrapper.find('.retry-button')
      await retryButton.trigger('click')

      // 应该调用 loadData 两次：一次是 onMounted，一次是点击重试
      expect(mockLoadData).toHaveBeenCalledTimes(2)
    })

    it('当没有错误时不应该显示错误容器', () => {
      mockLoadError.value = ''

      const wrapper = mount(App, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.error-container').exists()).toBe(false)
    })
  })

  describe('初始化页面测试', () => {
    it('当 needsInitialization 为 true 时应该显示 InitializationPage', () => {
      mockNeedsInitialization.value = true

      const wrapper = mount(App, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.initialization-page-mock').exists()).toBe(true)
    })

    it('当 needsInitialization 为 false 时不应该显示 InitializationPage', () => {
      mockNeedsInitialization.value = false

      const wrapper = mount(App, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.initialization-page-mock').exists()).toBe(false)
    })
  })

  describe('主内容渲染测试', () => {
    it('当没有加载、错误或初始化状态时应该显示主内容', () => {
      mockIsLoading.value = false
      mockLoadError.value = ''
      mockNeedsInitialization.value = false

      const wrapper = mount(App, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.navbar-mock').exists()).toBe(true)
      expect(wrapper.find('.page-router-mock').exists()).toBe(true)
      expect(wrapper.find('.scroll-to-top-mock').exists()).toBe(true)
      expect(wrapper.find('.modal-mock').exists()).toBe(true)
      expect(wrapper.find('.toast-container-mock').exists()).toBe(true)
      expect(wrapper.find('.ai-loading-overlay-mock').exists()).toBe(true)
    })
  })
})
