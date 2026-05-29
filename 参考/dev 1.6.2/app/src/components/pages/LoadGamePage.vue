<!--
  LoadGamePage 组件

  读取存档页面，用于管理和加载游戏存档。

  功能：
  - 显示所有可用存档列表
  - 支持分页显示存档
  - 加载选中的存档
  - 删除指定存档
  - 导入外部存档文件
  - 清空所有存档
  - 错误边界保护

  Emits:
  - load-save(saveData: GameData): 当用户选择加载存档时触发
  - delete-save(slotId: string): 当用户删除存档时触发
  - import-save(file: File): 当用户导入存档文件时触发
  - clear-all-saves(): 当用户清空所有存档时触发

  暴露方法:
  - refreshSaves(): 刷新存档列表

  使用示例:
  ```vue
  <LoadGamePage
    @load-save="handleLoadSave"
    @delete-save="handleDeleteSave"
    @import-save="handleImportSave"
    @clear-all-saves="handleClearAllSaves"
    ref="loadGamePageRef"
  />
  ```
-->
<template>
  <ErrorBoundary @error="handleError">
    <div class="load-game-page">
      <div class="load-container">
        <!-- 标题和操作按钮 -->
        <LoadGameHeader
          :is-operating="isOperating"
          @import-click="handleImportClick"
          @clear-click="handleClearClick"
        />

        <!-- 隐藏的文件输入 -->
        <input
          ref="fileInputRef"
          type="file"
          accept=".yaml,.yml"
          aria-label="选择存档文件"
          style="display: none"
          @change="handleFileSelect"
        />

        <!-- 存档列表内容 -->
        <LoadGameContent
          :is-loading="isLoading"
          :error-message="errorMessage"
          :paginated-saves="paginatedSaves"
          :is-operating="isOperating"
          :current-page="currentPage"
          :total-pages="totalPages"
          :get-save-icon="getSaveIcon"
          :get-save-type-text="getSaveTypeText"
          :format-time="formatTime"
          @load="handleLoad"
          @export="exportSave"
          @delete="handleDelete"
          @retry="loadSaves"
          @prev-page="prevPage"
          @next-page="nextPage"
        />
      </div>
    </div>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import ErrorBoundary from '../common/ErrorBoundary.vue'
import LoadGameHeader from './LoadGamePage/LoadGameHeader.vue'
import LoadGameContent from './LoadGamePage/LoadGameContent.vue'
import { useSaveList } from '../../composables/save/useSaveList'
import { useSaveOperations } from '../../composables/save/useSaveOperations'
import { logger } from '../../utils/logger'

// Emits
const emit = defineEmits<{
  load: [saveName: string]
  delete: [saveName: string]
  import: [yamlContent: string]
  clearAll: []
}>()

// 使用存档列表 Composable
const {
  isLoading,
  errorMessage,
  currentPage,
  totalPages,
  paginatedSaves,
  prevPage,
  nextPage,
  loadSaves,
  getSaveIcon,
  getSaveTypeText,
  formatTime,
} = useSaveList({ itemsPerPage: 20 })

// 使用存档操作 Composable
const {
  isOperating,
  fileInputRef,
  exportSave,
  handleImportClick,
  handleFileSelect: handleFileSelectBase,
} = useSaveOperations()

// Methods
const handleLoad = (saveName: string) => {
  emit('load', saveName)
}

const handleDelete = (saveName: string) => {
  emit('delete', saveName)
}

/**
 * 处理文件选择
 */
const handleFileSelect = async (event: Event) => {
  await handleFileSelectBase(event, (yamlContent: string) => {
    emit('import', yamlContent)
  })
}

/**
 * 处理清空按钮点击
 */
const handleClearClick = () => {
  emit('clearAll')
}

/**
 * 处理错误
 */
const handleError = (error: Error) => {
  logger.error('读取存档页面发生错误:', error)
}

// Expose methods
defineExpose({
  loadSaves,
  setOperating: (value: boolean) => {
    isOperating.value = value
  },
  handleImportClick,
})
</script>

<style scoped>
.load-game-page {
  width: 100%;
  min-height: 400px;
}

.load-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl) 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .load-container {
    padding: var(--spacing-lg) 0;
  }
}

@media (max-width: 768px) {
  .load-container {
    padding: var(--spacing-md) 0;
  }
}

@media (max-width: 480px) {
  .load-container {
    padding: var(--spacing-sm) 0;
  }
}
</style>
