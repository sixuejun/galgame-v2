<template>
  <div id="app-wrapper">
    <div id="eden-container">
      <ErrorBoundary @error="handleError">
        <!-- 加载状态 -->
        <LoadingSpinner v-if="isLoading" message="正在加载游戏数据..." />

        <!-- 错误状态 -->
        <div v-else-if="loadError" class="error-container">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h2 class="error-title">加载失败</h2>
          <p class="error-message">{{ loadError }}</p>
          <button class="retry-button" aria-label="重新加载" @click="handleRetry">
            <i class="fas fa-redo"></i>
            <span>重试</span>
          </button>
        </div>

        <!-- 初始化页面 -->
        <InitializationPage
          v-else-if="needsInitialization"
          ref="initPageRef"
          :system-instruction="systemInstruction"
          @generate="handleInitGenerate"
        />

        <!-- 主内容 -->
        <template v-else>
          <!-- 导航栏（顶部） -->
          <NavBar
            :nav-buttons="config?.navButtons"
            :current-page="currentPage"
            :phase="config?.phase || '未知阶段'"
            @navigate="navigateTo"
            @save="handleManualSave"
            @load="handleNavigateToLoad"
          />

          <!-- 主内容区域 -->
          <PageRouter
            ref="pageRouterRef"
            :current-page="currentPage"
            :config="config"
            :story="story"
            :choices="choices"
            :characters="characters"
            :shop="shop"
            :storage="storage"
            :achievements="achievements"
            :summaries="summaries"
            @choose="handleChoice"
            @load-save="handleLoadSave"
            @delete-save="handleDeleteSave"
            @import-save="handleImportSave"
            @clear-all-saves="handleClearAllSaves"
          />

          <!-- 悬浮回顶按钮 -->
          <ScrollToTopButton />

          <!-- 模态框 -->
          <Modal
            :is-visible="modalVisible"
            :title="modalTitle"
            :content="modalContent"
            :buttons="modalButtons"
            @close="hideModal"
          />

          <!-- Toast 通知 -->
          <ToastContainer />

          <!-- AI 加载遮罩 -->
          <AILoadingOverlay
            :is-visible="isLoadingAI"
            :message="aiLoadingMessage"
            :is-retrying="isAnyRetrying"
            :retry-count="currentRetryCount"
            :max-retries="currentMaxRetries"
            :retry-reason="currentRetryReason"
          />
        </template>
      </ErrorBoundary>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from './stores/gameStore'
import { useAICommunication } from './composables/ai/useAICommunication'
import { useModal } from './composables/ui/useModal'
import { useToast } from './composables/ui/useToast'
import { usePageNavigation } from './composables/ui/usePageNavigation'
import { useSaveManagement } from './composables/save/useSaveManagement'
import { useGameInitialization } from './composables/game/useGameInitialization'
import { usePlayerChoice } from './composables/game/usePlayerChoice'
import { useAchievementsAutoUnlock } from './composables/achievement/useAchievementUnlock'
import { useAppLifecycle } from './composables/app/useAppLifecycle'
import { useAppErrorHandling } from './composables/app/useAppErrorHandling'
import { useHeightSync } from './composables/app/useHeightSync'
import { useAILoadingOverlay } from './composables/app/useAILoadingOverlay'
import { useTheme } from './composables/ui/useTheme'
import ErrorBoundary from './components/common/ErrorBoundary.vue'
import LoadingSpinner from './components/common/LoadingSpinner.vue'
import ScrollToTopButton from './components/common/ScrollToTopButton.vue'
import NavBar from './components/layout/NavBar.vue'
import Modal from './components/layout/Modal.vue'
import ToastContainer from './components/common/ToastContainer.vue'
import PageRouter from './components/layout/PageRouter.vue'
import AILoadingOverlay from './components/layout/AILoadingOverlay.vue'
import InitializationPage from './components/pages/InitializationPage.vue'

// ========== 数据管理 ==========
const gameStore = useGameStore()
const {
  gameData,
  isLoading,
  loadError,
  config,
  story,
  choices,
  characters,
  shop,
  storage,
  achievements,
  summaries,
  needsInitialization,
} = storeToRefs(gameStore)

// ========== 成就自动解锁 ==========
const { startWatching: startAchievementWatching } = useAchievementsAutoUnlock(gameData)

// ========== AI 通信 ==========
const { isGenerating, isAIAvailable } = useAICommunication()

// ========== UI 交互 ==========
const {
  isVisible: modalVisible,
  title: modalTitle,
  content: modalContent,
  buttons: modalButtons,
  showConfirm,
  hideModal,
} = useModal()

const {
  success: showSuccessToast,
  error: showErrorToast,
  warning: showWarningToast,
  info: showInfoToast,
} = useToast()

// ========== 错误处理 ==========
const { handleError } = useAppErrorHandling({
  showErrorToast,
  showWarningToast,
  showInfoToast,
})

// ========== 页面引用 ==========
const initPageRef = ref<InstanceType<typeof InitializationPage> | null>(null)
const pageRouterRef = ref<InstanceType<typeof PageRouter> | null>(null)

// 从 PageRouter 中获取子页面引用
const loadGamePageRef = computed(() => pageRouterRef.value?.loadGamePageRef || null)
const reviewPageRef = computed(() => pageRouterRef.value?.reviewPageRef || null)

// ========== AI 加载状态 ==========
const {
  isLoadingAI,
  aiLoadingMessage,
  isAnyRetrying,
  currentRetryCount,
  currentMaxRetries,
  currentRetryReason,
} = useAILoadingOverlay({ isGenerating })

// ========== 页面导航 ==========
const { currentPage, navigateTo } = usePageNavigation()

/**
 * 导航到读档页面
 */
const handleNavigateToLoad = () => {
  navigateTo('load')
}

// ========== iframe 高度同步 ==========
useHeightSync({
  currentPage,
  story,
  choices,
  characters,
  shop,
  storage,
  achievements,
  summaries,
  modalVisible,
  isLoadingAI,
})

// ========== 存档管理 ==========
const {
  handleManualSave,
  handleLoadSave,
  handleDeleteSave,
  handleImportSave,
  handleClearAllSaves,
} = useSaveManagement({
  loadGamePageRef,
  showConfirm,
  showSuccessToast,
  showErrorToast,
  navigateTo,
})

// ========== 游戏初始化 ==========
const { systemInstruction, handleInitGenerate } = useGameInitialization({
  initPageRef,
  isAIAvailable,
  saveInitializationData: gameStore.saveInitializationData,
  showSuccessToast,
  showErrorToast,
})

// ========== 玩家选择处理 ==========
const { handleChoice } = usePlayerChoice({
  reviewPageRef,
})

// ========== 生命周期 ==========
const { handleRetry } = useAppLifecycle({
  gameStore,
  startAchievementWatching,
})

// ========== 主题系统 ==========
useTheme()
</script>

<style scoped>
/* 错误状态样式 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-2xl);
  min-height: 400px;
  text-align: center;
}

.error-icon {
  font-size: 64px;
  color: var(--error);
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}

.error-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-dark);
  margin: 0;
}

.error-message {
  font-size: var(--text-base);
  color: var(--text-secondary);
  max-width: 500px;
  margin: 0;
}

.retry-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-base) ease;
  box-shadow: var(--shadow-md);
}

.retry-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.retry-button:active {
  transform: translateY(0);
}

.retry-button i {
  font-size: var(--text-lg);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-icon {
    font-size: 48px;
  }

  .error-title {
    font-size: var(--text-xl);
  }

  .error-message {
    font-size: var(--text-sm);
  }

  .retry-button {
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: var(--text-sm);
  }
}
</style>
