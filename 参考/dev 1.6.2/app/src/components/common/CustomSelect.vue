<!--
  CustomSelect 组件

  自定义下拉选择组件，提供更好的样式控制和用户体验。

  功能：
  - 支持 v-model 双向绑定
  - 自定义样式的下拉选择器
  - 点击外部自动关闭
  - 下拉动画效果
  - 显示当前选中项的勾选标记
  - 无障碍支持（ARIA 属性）

  Props:
  - modelValue: 当前选中的值
  - options: 选项列表（{ value, label }[]）
  - ariaLabel: ARIA 标签（可选，默认为"选择选项"）

  Emits:
  - update:modelValue: 当选中值变化时触发

  使用示例：
  <CustomSelect
    v-model="selectedValue"
    :options="[
      { value: 'all', label: '全部' },
      { value: 'active', label: '激活' }
    ]"
    aria-label="选择状态"
  />
-->
<template>
  <div v-click-outside="close" class="custom-select" :class="{ open: isOpen }">
    <!-- 选中的值显示区域 -->
    <button class="select-trigger" :aria-label="ariaLabel" :aria-expanded="isOpen" @click="toggle">
      <span class="select-value">{{ selectedLabel }}</span>
      <i class="fas fa-chevron-down select-icon" :class="{ rotated: isOpen }"></i>
    </button>

    <!-- 下拉选项列表 -->
    <transition name="dropdown">
      <div v-show="isOpen" class="select-dropdown">
        <div class="select-options">
          <button
            v-for="option in options"
            :key="option.value"
            class="select-option"
            :class="{ selected: option.value === modelValue }"
            @click="selectOption(option.value)"
          >
            <span>{{ option.label }}</span>
            <i v-if="option.value === modelValue" class="fas fa-check"></i>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

/**
 * 选项接口
 */
export interface SelectOption {
  /** 选项值 */
  value: string
  /** 选项显示文本 */
  label: string
}

/**
 * Props 定义
 * @property {string} modelValue - 当前选中的值
 * @property {SelectOption[]} options - 选项列表
 * @property {string} [ariaLabel='选择选项'] - ARIA 标签
 */
interface Props {
  /** 当前选中的值 */
  modelValue: string
  /** 选项列表 */
  options: SelectOption[]
  /** ARIA 标签 */
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: '选择选项',
})

/**
 * Emits 定义
 * @event update:modelValue - 当选中值变化时触发
 */
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)

const selectedLabel = computed(() => {
  const selected = props.options.find(opt => opt.value === props.modelValue)
  return selected?.label || '请选择'
})

const toggle = () => {
  isOpen.value = !isOpen.value
}

const close = () => {
  isOpen.value = false
}

const selectOption = (value: string) => {
  emit('update:modelValue', value)
  close()
}

// 暴露给测试使用
defineExpose({
  isOpen,
})

// 自定义指令：点击外部关闭
interface ClickOutsideElement extends HTMLElement {
  clickOutsideEvent?: (event: Event) => void
}

const vClickOutside = {
  mounted(el: ClickOutsideElement, binding: { value: () => void }) {
    el.clickOutsideEvent = (event: Event) => {
      const target = event.target as HTMLElement
      if (!(el === target || el.contains(target))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: ClickOutsideElement) {
    if (el.clickOutsideEvent) {
      document.removeEventListener('click', el.clickOutsideEvent)
    }
  },
}
</script>

<style scoped>
.custom-select {
  position: relative;
  min-width: 140px;
}

/* 触发按钮 */
.select-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: white;
  border: 2px solid var(--gray-300);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-family: inherit;
  color: var(--text-dark);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.select-trigger:hover {
  border-color: var(--primary-blue);
  box-shadow: 0 2px 4px rgba(0, 128, 255, 0.1);
}

.select-trigger:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(0, 128, 255, 0.1);
}

.custom-select.open .select-trigger {
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(0, 128, 255, 0.1);
}

.select-value {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-icon {
  font-size: var(--text-sm);
  color: var(--gray-500);
  transition: transform var(--transition-base);
}

.select-icon.rotated {
  transform: rotate(180deg);
}

/* 下拉列表 */
.select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  background: white;
  border: 2px solid var(--primary-blue);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.select-options {
  max-height: 240px;
  overflow-y: auto;
}

/* 选项按钮 */
.select-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: white;
  border: none;
  font-size: var(--text-base);
  font-family: inherit;
  color: var(--text-dark);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-base);
}

.select-option:hover {
  background: var(--gray-100);
}

.select-option.selected {
  background: rgba(0, 128, 255, 0.1);
  color: var(--primary-blue);
  font-weight: var(--font-semibold);
}

.select-option i {
  font-size: var(--text-sm);
  color: var(--primary-blue);
}

/* 滚动条样式 */
.select-options::-webkit-scrollbar {
  width: 6px;
}

.select-options::-webkit-scrollbar-track {
  background: var(--gray-100);
}

.select-options::-webkit-scrollbar-thumb {
  background: var(--gray-400);
  border-radius: var(--radius-full);
}

.select-options::-webkit-scrollbar-thumb:hover {
  background: var(--gray-500);
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .select-trigger {
    font-size: var(--text-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .select-option {
    font-size: var(--text-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
  }
}
</style>
