<!--
  ReviewConfigPanel 组件

  回顾配置面板组件，用于配置摘要显示和发送数量。

  功能：
  - 配置显示的摘要数量
  - 配置发送给 AI 的摘要数量
  - 重置到默认值
  - 实时验证和提示

  Props:
  - config (Config): 游戏配置对象

  Emits:
  - update:config(config: Config): 配置更新时触发
-->
<template>
  <div class="config-panel">
    <div class="config-item">
      <label for="display-count">默认显示条数：</label>
      <CustomNumberInput
        id="display-count"
        :model-value="displayCount"
        :min="1"
        :max="100"
        label="默认显示条数"
        @update:model-value="handleDisplayCountChange"
      />
    </div>
    <div class="config-item">
      <label for="send-count">发送给AI条数：</label>
      <CustomNumberInput
        id="send-count"
        :model-value="sendCount"
        :min="0"
        :max="1000"
        label="发送给AI条数"
        @update:model-value="handleSendCountChange"
      />
    </div>
    <button class="reset-btn" title="重置配置" @click="handleReset">
      <i class="fas fa-undo"></i>
      重置
    </button>
  </div>
</template>

<script setup lang="ts">
import CustomNumberInput from '../../common/CustomNumberInput.vue'

interface Props {
  displayCount: number
  sendCount: number
}

defineProps<Props>()

const emit = defineEmits<{
  'update:displayCount': [value: number]
  'update:sendCount': [value: number]
  reset: []
}>()

const handleDisplayCountChange = (value: number) => {
  emit('update:displayCount', value)
}

const handleSendCountChange = (value: number) => {
  emit('update:sendCount', value)
}

const handleReset = () => {
  emit('reset')
}
</script>

<style scoped>
/* 配置面板 */
.config-panel {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  background: linear-gradient(135deg, rgba(0, 128, 255, 0.08), rgba(0, 191, 255, 0.05));
  border-radius: var(--radius-xl);
  border: 1px solid rgba(0, 128, 255, 0.25);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 128, 255, 0.1);
  transition: all var(--transition-base);
}

.config-panel:hover {
  border-color: rgba(0, 128, 255, 0.4);
  box-shadow: 0 6px 30px rgba(0, 128, 255, 0.15);
}

.config-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
  border: 1px solid rgba(0, 128, 255, 0.1);
}

.config-item:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 128, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 128, 255, 0.1);
}

.config-item label {
  color: var(--text-primary);
  font-size: var(--text-sm);
  white-space: nowrap;
  font-weight: var(--font-semibold);
}

.reset-btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: 1px solid rgba(251, 191, 36, 0.5);
  border-radius: var(--radius-lg);
  color: white;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: all var(--transition-base);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25);
  white-space: nowrap;
}

.reset-btn:hover {
  background: linear-gradient(135deg, #d97706, #b45309);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
  border-color: rgba(251, 191, 36, 0.8);
}

.reset-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.reset-btn i {
  font-size: var(--text-base);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .config-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .config-item {
    justify-content: space-between;
  }

  .reset-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
