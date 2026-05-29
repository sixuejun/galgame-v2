<!--
  ActionButtons 组件

  导航栏操作按钮组件，提供游戏操作功能。

  功能：
  - 保存游戏按钮
  - 重置游戏按钮（带确认）
  - 导出数据按钮
  - 导入数据按钮
  - 禁用状态控制
  - 无障碍支持

  Props:
  - disabled (boolean, 默认: false): 是否禁用所有按钮

  Emits:
  - save(): 点击保存时触发
  - reset(): 点击重置时触发
  - export(): 点击导出时触发
  - import(): 点击导入时触发
-->
<template>
  <div class="action-buttons">
    <button
      class="action-btn save-btn"
      title="手动存档"
      aria-label="手动存档"
      @click="$emit('save')"
    >
      <i class="fas fa-save" aria-hidden="true"></i>
      <span class="btn-text">存档</span>
    </button>
    <button
      class="action-btn load-btn"
      title="读取存档"
      aria-label="读取存档"
      @click="$emit('load')"
    >
      <i class="fas fa-folder-open" aria-hidden="true"></i>
      <span class="btn-text">读档</span>
    </button>
    <button
      :class="['action-btn', 'fullscreen-btn', { active: isFullscreen }]"
      :title="isFullscreen ? '退出全屏' : isInIframeEnv ? '全屏模式 (模拟)' : '全屏模式'"
      :aria-label="isFullscreen ? '退出全屏' : '进入全屏'"
      @click="toggleFullscreen"
    >
      <i :class="['fas', isFullscreen ? 'fa-compress' : 'fa-expand']" aria-hidden="true"></i>
      <span class="btn-text">{{ isFullscreen ? '退出' : '全屏' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useFullscreen } from '../../../composables/ui/useFullscreen'

defineEmits<{
  save: []
  load: []
}>()

// 全屏功能
const { isFullscreen, toggleFullscreen, isInIframeEnv } = useFullscreen()
</script>

<style scoped>
.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

/* 通用操作按钮样式 */
.action-btn {
  border: 1px solid;
  cursor: pointer;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  border-radius: var(--radius-lg);
  color: white;
  transition: all var(--transition-base) var(--ease-out);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  min-height: 44px;
}

.action-btn i {
  font-size: 16px;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.action-btn:active {
  transform: translateY(0);
}

/* 存档按钮 */
.save-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  border-color: #34d399;
}

.save-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.5);
}

/* 读档按钮 */
.load-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-color: #fbbf24;
}

.load-btn:hover {
  background: linear-gradient(135deg, #d97706, #b45309);
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.5);
}

/* 全屏按钮 */
.fullscreen-btn {
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  border-color: var(--secondary-blue);
}

.fullscreen-btn:hover {
  background: linear-gradient(135deg, var(--primary-blue-dark), var(--secondary-blue-dark));
  box-shadow: 0 4px 16px rgba(0, 128, 255, 0.5);
}

.fullscreen-btn.active {
  background: linear-gradient(135deg, var(--secondary-blue), var(--primary-blue));
}

@media (max-width: 768px) {
  .action-btn {
    padding: 10px 14px;
    min-width: auto;
    font-size: var(--text-sm);
  }
}

@media (max-width: 480px) {
  .action-buttons {
    gap: var(--spacing-xs);
  }

  .action-btn .btn-text {
    display: none;
  }

  .action-btn {
    padding: 10px;
    min-width: 44px;
    justify-content: center;
  }
}
</style>
