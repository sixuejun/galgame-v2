<!--
  ChoicesPanel 组件

  选项面板组件，显示游戏中的选择项。

  功能：
  - 显示选择项列表
  - 支持点击选择
  - 可折叠/展开
  - 禁用状态控制
  - 空状态自动隐藏
  - 无障碍支持

  Props:
  - choices (Choice[]): 选择项列表
  - choiceHeader (string, 可选): 选择面板标题，默认为"玩家选择"

  Emits:
  - choose(text: string): 选择某项时触发
-->
<template>
  <div v-if="choices.length > 0" class="choices-panel">
    <div
      class="choices-header"
      role="button"
      tabindex="0"
      @click="toggleCollapsed"
      @keydown.enter="toggleCollapsed"
      @keydown.space.prevent="toggleCollapsed"
    >
      <span>{{ choiceHeader || '玩家选择' }}</span>
      <i
        :class="['fas fa-chevron-down choices-toggle', { collapsed: isCollapsed }]"
        aria-hidden="true"
      ></i>
    </div>
    <div :class="['choices-content', { collapsed: isCollapsed }]">
      <div class="choice-list" role="list">
        <button
          v-for="(choice, index) in choices"
          :key="index"
          class="choice-button"
          role="listitem"
          @click="$emit('choose', choice.text)"
        >
          {{ choice.text }}
        </button>
      </div>

      <!-- 自定义行动输入框 -->
      <CustomActionInput @submit="$emit('choose', $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Choice } from '../../../types'
import CustomActionInput from './CustomActionInput.vue'

defineProps<{
  choices: Choice[]
  choiceHeader?: string
}>()

defineEmits<{
  choose: [text: string]
}>()

const isCollapsed = ref(false)

const toggleCollapsed = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.choices-panel {
  background: linear-gradient(to top, rgba(245, 249, 252, 0.95), rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-top: var(--spacing-xl);
  border-radius: var(--radius-xl);
  border: 2px solid rgba(0, 128, 255, 0.2);
}

.choices-header {
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, rgba(0, 128, 255, 0.08), rgba(0, 191, 255, 0.08));
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: var(--font-semibold);
  color: var(--primary-blue);
  font-size: var(--text-lg);
  transition: all var(--transition-base) ease;
  border-bottom: 1px solid rgba(0, 128, 255, 0.15);
}

.choices-header:hover {
  background: linear-gradient(135deg, rgba(0, 128, 255, 0.12), rgba(0, 191, 255, 0.12));
}

.choices-toggle {
  transition: transform var(--transition-base) ease;
  font-size: var(--text-xl);
}

.choices-toggle.collapsed {
  transform: rotate(-180deg);
}

.choices-content {
  overflow-y: auto;
  transition: max-height var(--transition-slow) ease;
  background: white;
}

.choices-content.collapsed {
  max-height: 0;
  overflow: hidden;
}

.choice-list {
  padding: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.choice-button {
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  text-align: left;
  transition: all var(--transition-base) ease;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

.choice-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.choice-button:hover::before {
  left: 100%;
}

.choice-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.choice-button:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .choice-list {
    padding: var(--spacing-md);
  }

  .choice-button {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--text-sm);
  }
}
</style>
