<template>
  <!-- 全屏遮罩 + 面板 -->
  <Transition name="input-fade">
    <div
      v-if="visible"
      class="dialogue-input-root absolute inset-0 flex cursor-default items-center justify-center"
      style="z-index: 70"
      @click.self="handleClose"
    >
      <!-- 遮罩 -->
      <div
        class="dialogue-input-backdrop absolute inset-0"
        style="background: var(--theme-input-backdrop, var(--theme-choice-backdrop, rgba(42, 36, 32, 0.3)))"
      />

      <!-- 面板主体 -->
      <div class="dialogue-input-panel relative" :style="panelStyle">
        <SkinShell :skin="panelSkin">
          <div class="flex h-full w-full flex-col" style="gap: 0">
            <!-- 顶部装饰线 -->
            <div class="dialogue-input-top-line shrink-0" :style="topLineStyle" />

            <!-- 头部 -->
            <div class="dialogue-input-header flex shrink-0 items-center justify-between" :style="headerStyle">
              <div class="dialogue-input-title flex items-center gap-2" :style="titleStyle">
                <i class="fa-solid fa-keyboard" style="color: var(--theme-accent, var(--rust)); font-size: 0.7rem" />
                <span>自由输入</span>
              </div>
              <button
                class="dialogue-input-close flex cursor-pointer items-center justify-center"
                :style="closeBtnStyle"
                aria-label="关闭"
                @click="handleClose"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                >
                  <line x1="1" y1="1" x2="11" y2="11" />
                  <line x1="11" y1="1" x2="1" y2="11" />
                </svg>
              </button>
            </div>

            <!-- 输入区（包含文本框和发送按钮） -->
            <div class="dialogue-input-body shrink-0" :style="bodyStyle">
              <div class="dialogue-input-textarea-wrapper" :style="textareaWrapperStyle">
                <textarea
                  ref="inputRef"
                  v-model="inputText"
                  class="dialogue-input-textarea no-scrollbar"
                  :style="textareaStyle"
                  placeholder="输入你想说的话..."
                  rows="3"
                  @keydown.enter.ctrl="handleSend"
                  @keydown.enter.exact.prevent
                  @keydown.escape="handleClose"
                />
                <!-- 悬浮发送按钮 -->
                <button
                  class="dialogue-input-send-btn flex cursor-pointer items-center"
                  :style="sendBtnStyle"
                  :disabled="!inputText.trim()"
                  aria-label="发送"
                  @click="handleSend"
                >
                  <i class="fa-solid fa-paper-plane" style="font-size: 0.65rem; margin-right: 0.4em" />
                  <span>发送</span>
                </button>
              </div>
            </div>

            <!-- 底部装饰线 -->
            <div class="dialogue-input-bottom-line shrink-0" :style="bottomLineStyle" />
          </div>
        </SkinShell>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import SkinShell from '../common/SkinShell.vue';
import { useVNStore } from '../../store';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [text: string];
}>();

const store = useVNStore();
const inputRef = ref<HTMLTextAreaElement | null>(null);
const inputText = ref('');

watch(
  () => props.visible,
  async visible => {
    if (visible) {
      inputText.value = '';
      await nextTick();
      inputRef.value?.focus();
    }
  },
);

const panelSkin = computed(() => store.getComponentSkinForCurrent('inputPanel'));

const panelStyle = computed(() => ({
  width: 'min(90vw, 32rem)',
  maxWidth: 'min(90vw, 32rem)',
  ...(panelSkin.value
    ? { background: 'transparent', border: 'transparent', boxShadow: 'none' }
    : {
        background: 'var(--theme-input-panel-bg, rgba(35, 30, 25, 0.92))',
        border: '1px solid var(--theme-input-panel-border, rgba(90, 79, 64, 0.55))',
        borderRadius: 'var(--theme-input-panel-radius, 0px)',
        boxShadow: 'var(--theme-input-panel-shadow, 0 8px 32px rgba(0,0,0,0.3))',
      }),
}));

const topLineStyle = computed(() => ({
  height: '1px',
  background:
    'var(--theme-input-top-line-bg, linear-gradient(to right, transparent, rgba(196, 162, 101, 0.3), transparent))',
}));

const bottomLineStyle = computed(() => ({
  height: '1px',
  background:
    'var(--theme-input-bottom-line-bg, linear-gradient(to right, transparent, rgba(196, 162, 101, 0.3), transparent))',
}));

const headerStyle = computed(() => ({
  padding: 'var(--theme-input-header-padding, 0.5rem 0.75rem)',
}));

const titleStyle = computed(() => ({
  fontFamily: 'var(--theme-font-body, serif)',
  fontSize: 'var(--theme-input-title-font-size, 0.75rem)',
  color: 'var(--theme-input-title-color, rgba(212, 197, 160, 0.85))',
  letterSpacing: '0.1em',
}));

const closeBtnStyle = computed(() => ({
  width: '1.4rem',
  height: '1.4rem',
  background: 'transparent',
  border: 'none',
  borderRadius: '2px',
  color: 'var(--theme-input-close-btn-color, rgba(139, 125, 107, 0.5))',
  transition: 'color 0.15s ease, background 0.15s ease',
}));

const bodyStyle = {
  padding: '0 0.75rem',
};

const textareaWrapperStyle = computed(() => ({
  position: 'relative' as const,
  width: '100%',
}));

const textareaStyle = computed(() => ({
  width: '100%',
  background: 'var(--theme-input-textarea-bg, transparent)',
  border: 'var(--theme-input-textarea-border, 1px solid rgba(90, 79, 64, 0.3))',
  borderRadius: 'var(--theme-input-textarea-radius, 0px)',
  outline: 'none',
  resize: 'none' as const,
  fontFamily: 'var(--theme-font-body, serif)',
  fontSize: 'var(--theme-input-textarea-font-size, 1em)',
  lineHeight: 'var(--theme-input-textarea-line-height, 1.75)',
  color: 'var(--theme-input-textarea-color, rgba(212, 197, 160, 0.9))',
  letterSpacing: 'var(--theme-input-textarea-letter-spacing, 0.05em)',
  caretColor: 'var(--theme-input-textarea-caret-color, var(--theme-accent, var(--rust)))',
  padding: 'var(--theme-input-textarea-padding-top, 0.5rem) var(--theme-input-textarea-padding-right, 3rem) var(--theme-input-textarea-padding-bottom, 0.5rem) var(--theme-input-textarea-padding-left, 0.75rem)',
}));

const sendBtnStyle = computed(() => {
  const hasText = inputText.value.trim();
  return {
    position: 'absolute' as const,
    right: 'var(--theme-input-send-btn-right, 0.5rem)',
    bottom: 'var(--theme-input-send-btn-bottom, 0.5rem)',
    padding: '0.3rem 0.65rem',
    background: hasText
      ? 'var(--theme-input-send-btn-bg, var(--theme-accent, var(--rust)))'
      : 'var(--theme-input-send-btn-disabled-bg, rgba(90, 79, 64, 0.2))',
    border: '1px solid',
    borderColor: hasText
      ? 'var(--theme-input-send-btn-bg, var(--theme-accent, var(--rust)))'
      : 'rgba(90, 79, 64, 0.35)',
    borderRadius: 'var(--theme-button-radius, 2px)',
    color: hasText
      ? 'var(--theme-input-send-btn-color, rgba(245, 240, 228, 0.95))'
      : 'var(--theme-input-send-btn-disabled-color, rgba(139, 125, 107, 0.4))',
    fontFamily: 'var(--theme-font-body, serif)',
    fontSize: 'var(--theme-input-send-btn-font-size, 0.7rem)',
    letterSpacing: '0.08em',
    cursor: hasText ? 'pointer' : 'not-allowed',
    transition: 'all 0.15s ease',
  };
});

function handleClose() {
  emit('close');
}

function handleSend() {
  const text = inputText.value.trim();
  if (!text) return;
  emit('submit', text);
  inputText.value = '';
}
</script>

<style scoped>
/* 关闭按钮悬停 */
.dialogue-input-close:hover {
  color: var(--theme-input-close-btn-hover-color, var(--theme-text-main, rgba(212, 197, 160, 0.9)));
  background: var(--theme-input-close-btn-hover-bg, rgba(90, 79, 64, 0.3));
}

/* 发送按钮悬停 */
.dialogue-input-send-btn:not(:disabled):hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

/* 发送按钮点击 */
.dialogue-input-send-btn:not(:disabled):active {
  transform: translateY(0);
  opacity: 1;
}

/* Textarea placeholder */
.dialogue-input-textarea::placeholder {
  color: var(--theme-input-textarea-placeholder-color, var(--theme-text-faint, rgba(139, 125, 107, 0.35)));
  font-style: italic;
}

/* 滚动条 */
.dialogue-input-textarea::-webkit-scrollbar {
  width: 3px;
}

.dialogue-input-textarea::-webkit-scrollbar-track {
  background: transparent;
}

.dialogue-input-textarea::-webkit-scrollbar-thumb {
  background: var(--theme-input-scrollbar-bg, rgba(90, 79, 64, 0.5));
  border-radius: 2px;
}

/* 遮罩淡入淡出 */
.input-fade-enter-active,
.input-fade-leave-active {
  transition: opacity 0.2s ease;
}

.input-fade-enter-from,
.input-fade-leave-to {
  opacity: 0;
}

/* 面板入场动画 */
.input-fade-enter-active .dialogue-input-panel {
  animation: input-panel-slide-in 0.22s ease-out forwards;
}

.input-fade-leave-active .dialogue-input-panel {
  animation: input-panel-slide-out 0.18s ease-in forwards;
}

@keyframes input-panel-slide-in {
  from {
    transform: translateY(10px) scale(0.97);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes input-panel-slide-out {
  from {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  to {
    transform: translateY(10px) scale(0.97);
    opacity: 0;
  }
}
</style>
