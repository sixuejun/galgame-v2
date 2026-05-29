<!--
  LoadGameHeader 组件

  读取存档页面的标题和操作按钮区域

  Props:
  - isOperating: 是否正在操作中

  Emits:
  - import-click: 点击导入按钮时触发
  - clear-click: 点击清空按钮时触发
-->
<template>
  <div class="load-header">
    <h1 class="load-title">
      <i class="fas fa-folder-open"></i>
      读取存档
    </h1>
    <div class="header-actions">
      <button
        class="action-btn import-btn"
        :disabled="isOperating"
        title="导入存档"
        aria-label="导入存档"
        @click="emit('import-click')"
      >
        <i class="fas fa-file-import" aria-hidden="true"></i>
        <span>导入</span>
      </button>
      <button
        class="action-btn clear-btn"
        :disabled="isOperating"
        title="清空所有存档"
        aria-label="清空所有存档"
        @click="emit('clear-click')"
      >
        <i class="fas fa-trash-alt" aria-hidden="true"></i>
        <span>清空</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props
defineProps<{
  isOperating?: boolean
}>()

// Emits
const emit = defineEmits<{
  'import-click': []
  'clear-click': []
}>()
</script>

<style scoped>
/* 标题区域 */
.load-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid rgba(0, 128, 255, 0.3);
}

.load-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin: 0;
}

.load-title i {
  color: var(--primary-blue);
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.action-btn {
  padding: 8px 16px;
  border-radius: var(--radius-lg);
  border: 1px solid;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all var(--transition-base);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.import-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: #60a5fa;
  color: white;
}

.import-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.clear-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-color: #fbbf24;
  color: white;
}

.clear-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #d97706, #b45309);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .load-title {
    font-size: var(--text-xl);
  }

  .action-btn {
    padding: 6px 14px;
    font-size: var(--text-xs);
  }
}

@media (max-width: 768px) {
  .load-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .load-title {
    font-size: var(--text-lg);
    width: 100%;
  }

  .header-actions {
    width: 100%;
    gap: var(--spacing-sm);
  }

  .action-btn {
    flex: 1;
    justify-content: center;
    padding: 10px 12px;
    font-size: var(--text-sm);
  }
}

@media (max-width: 480px) {
  .load-header {
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
    padding-bottom: var(--spacing-md);
  }

  .load-title {
    font-size: var(--text-base);
    gap: var(--spacing-sm);
  }

  .load-title i {
    font-size: var(--text-lg);
  }

  .header-actions {
    gap: var(--spacing-xs);
  }

  .action-btn {
    padding: 8px 10px;
    font-size: var(--text-xs);
    gap: 4px;
  }

  .action-btn i {
    font-size: var(--text-sm);
  }

  .action-btn span {
    display: inline;
  }
}
</style>
