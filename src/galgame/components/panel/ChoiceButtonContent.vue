<template>
  <div
    class="choice-btn-content"
    :style="contentStyle"
    :class="{
      'is-selected': isSelected,
      'is-hovered': isHovered,
      'is-locked': isLocked,
      'is-custom': choice.isCustomInput,
    }"
    @click.stop="handleClick"
  >
    <!-- 序号（固定宽度，始终居中） -->
    <span class="choice-letter" :style="letterStyle">{{ letter }}</span>

    <!-- 文字区域（固定高度，超出滚动） -->
    <div class="choice-text-wrapper" :style="textWrapperStyle">
      <template v-if="choice.isCustomInput">
        <input
          v-if="isSelected"
          ref="customInputRef"
          v-model="inputValue"
          class="choice-custom-input"
          :style="inputStyle"
          placeholder="自由输入选项"
          @input="emit('custom-input', inputValue)"
          @keydown.enter.stop="emit('custom-submit')"
          @click.stop
        />
        <span v-else class="choice-text" :style="textStyle">{{ choice.text }}</span>
      </template>
      <span v-else class="choice-text" :style="textStyle">{{ choice.text }}</span>
    </div>

    <!-- 悬浮发送按钮：仅在自由输入且已选中时显示 -->
    <button
      v-if="choice.isCustomInput && isSelected"
      class="choice-custom-send"
      type="button"
      aria-label="发送"
      @click.stop="emit('custom-submit')"
    >
      <svg
        class="choice-custom-send-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <path
          d="M22 2L15 22L11 13L2 9L22 2Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Choice } from '../../store';

const props = defineProps<{
  choice: Choice;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  isLocked: boolean;
}>();

const emit = defineEmits<{
  select: [choiceId: string];
  'custom-input': [value: string];
  'custom-submit': [];
}>();

const customInputRef = ref<HTMLInputElement | null>(null);
const inputValue = ref('');

const letter = computed(() => String.fromCharCode(65 + props.index));

watch(
  () => props.isSelected,
  async selected => {
    if (selected && props.choice.isCustomInput) {
      await nextTick();
      customInputRef.value?.focus();
    }
  },
);

watch(
  () => props.choice.choiceId,
  () => {
    inputValue.value = '';
  },
);

function handleClick() {
  if (props.isLocked) return;
  emit('select', props.choice.choiceId);
}

const contentStyle = computed(() => ({
  display: 'flex',
  alignItems: 'stretch',
  gap: 'var(--theme-choice-btn-inner-gap, 0.5rem)',
  width: '100%',
  cursor: props.isLocked ? 'not-allowed' : 'pointer',
  opacity: props.isLocked ? '0.55' : '1',
}));

const letterStyle = computed(() => ({
  flex: '0 0 auto',
  alignSelf: 'center',
  fontFamily: 'var(--theme-choice-letter-font-family, serif)',
  fontSize: 'var(--theme-choice-letter-font-size, clamp(0.9rem, 1.5vw, 1.1rem))',
  fontWeight: 'var(--theme-choice-letter-font-weight, 600)',
  color: 'var(--theme-choice-letter-color, rgba(110, 71, 54, 0.85))',
  transition: 'color 0.15s ease',
  paddingLeft: 'var(--theme-choice-btn-inner-padding-left, 0.5rem)',
  paddingRight: 'var(--theme-choice-btn-inner-padding-right, 0.5rem)',
  userSelect: 'none',
}));

const textWrapperStyle = computed(() => ({
  flex: '1 1 0',
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
  height: 'var(--theme-choice-btn-text-area-height, 2.5rem)',
  overflowY: 'auto' as const,
  paddingTop: 'var(--theme-choice-btn-inner-padding-top, 0.5rem)',
  paddingBottom: 'var(--theme-choice-btn-inner-padding-bottom, 0.5rem)',
  paddingRight: 'var(--theme-choice-btn-inner-padding-right, 0.5rem)',
}));

const textStyle = computed(() => ({
  display: 'block',
  width: '100%',
  fontFamily: 'var(--theme-choice-text-font-family, serif)',
  fontSize: 'var(--theme-choice-text-font-size, clamp(0.9rem, 1.5vw, 1.1rem))',
  fontWeight: 'var(--theme-choice-text-font-weight, 400)',
  color: 'var(--theme-choice-text-color, rgba(47, 36, 31, 0.9))',
  lineHeight: 'var(--theme-choice-text-line-height, 1.4)',
  letterSpacing: 'var(--theme-choice-text-letter-spacing, 0.02em)',
  transition: 'color 0.15s ease, opacity 0.15s ease',
  wordBreak: 'break-word' as const,
}));

const inputStyle = computed(() => ({
  display: 'block',
  width: '100%',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  fontFamily: 'var(--theme-choice-text-font-family, serif)',
  fontSize: 'var(--theme-choice-text-font-size, clamp(0.9rem, 1.5vw, 1.1rem))',
  fontWeight: 'var(--theme-choice-text-font-weight, 400)',
  color: 'var(--theme-choice-text-color, rgba(47, 36, 31, 0.9))',
  letterSpacing: 'var(--theme-choice-text-letter-spacing, 0.02em)',
  caretColor: 'var(--theme-choice-caret-color, var(--theme-accent, #6e4736))',
  padding: '0',
}));
</script>

<style scoped>
/* Hover / Selected states for letter & text colors */
.choice-btn-content:not(.is-locked):hover .choice-letter,
.choice-btn-content.is-hovered .choice-letter {
  color: var(--theme-choice-letter-color-hover, var(--theme-choice-letter-color, rgba(110, 71, 54, 0.85)));
}

.choice-btn-content:not(.is-locked):hover .choice-text,
.choice-btn-content.is-hovered .choice-text {
  color: var(--theme-choice-text-color-hover, var(--theme-choice-text-color, rgba(47, 36, 31, 0.9)));
}

.choice-btn-content.is-selected .choice-text {
  color: var(--theme-choice-text-color-selected, var(--theme-choice-text-color, rgba(47, 36, 31, 1)));
}

/* 隐藏滚动条 */
.choice-text-wrapper::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* 自定义输入占位符 */
.choice-custom-input::placeholder {
  color: var(--theme-choice-text-placeholder-color, rgba(92, 76, 68, 0.45));
  font-style: italic;
}

/* 悬浮发送按钮 */
.choice-custom-send {
  flex: 0 0 auto;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.8rem;
  height: 1.8rem;
  margin-right: 0.5rem;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--theme-choice-send-btn-color, rgba(110, 71, 54, 0.75));
  cursor: pointer;
  transition: all 0.15s ease;
}

.choice-custom-send:not(:disabled):hover {
  color: var(--theme-choice-send-btn-hover-color, rgba(110, 71, 54, 1));
}

.choice-custom-send:not(:disabled):active {
  transform: scale(0.92);
}

.choice-custom-send-icon {
  width: 16px;
  height: 16px;
}
</style>
