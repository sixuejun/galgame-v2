<template>
  <div class="absolute bottom-0 left-0 right-0 z-20 px-4 md:px-8 pb-4 md:pb-6">
    <div class="flex items-center gap-2 md:gap-4 max-w-4xl mx-auto">
      <!-- 外置左箭头 -->
      <button
        v-if="!isInnerArrow"
        :disabled="isFirstDialogue"
        :class="[
          'flex flex-shrink-0 items-center justify-center transition-all duration-200',
          isFirstDialogue ? 'cursor-not-allowed opacity-40' : 'hover:scale-105',
        ]"
        :style="outerArrowStyle"
        aria-label="上一条对话"
        @click.stop="handlePrev"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- 对话框主体 -->
      <div
        class="flex-1 relative p-4 md:p-5 min-h-[120px]"
        :class="[isNarration ? 'flex flex-col' : '']"
        :style="boxStyle"
      >
        <!-- 内置左箭头 -->
        <div v-if="isInnerArrow" class="absolute left-2 top-1/2 -translate-y-1/2 z-10">
          <button
            :disabled="isFirstDialogue"
            :class="[
              'flex items-center justify-center transition-all duration-200',
              isFirstDialogue ? 'cursor-not-allowed opacity-40' : 'hover:bg-opacity-100',
            ]"
            :style="innerLeftArrowStyle"
            aria-label="上一条对话"
            @click.stop="handlePrev"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <!-- 角色名区域 -->
        <div
          v-if="!isNarration"
          class="h-6 mb-2 flex items-start"
          :style="{
            paddingLeft: isInnerArrow ? '48px' : 0,
            paddingRight: isInnerArrow ? '48px' : 0,
          }"
        >
          <div
            class="px-3 py-1 text-sm font-medium"
            :style="{
              backgroundColor: dialogStyle.colors.nameBackground,
              color: dialogStyle.colors.nameText,
              borderRadius: nameShape.borderRadius,
              borderBottom: nameShape.style === 'underline' ? `2px solid ${dialogStyle.colors.nameText}` : undefined,
              boxShadow: nameShape.style === 'floating' ? '0 2px 8px rgba(0,0,0,0.1)' : undefined,
            }"
          >
            {{ character }}
          </div>
          <!-- 编辑/删除按钮（仅user消息显示） -->
          <div v-if="props.isEditable && props.messageId !== undefined" class="ml-auto flex gap-2">
            <button
              @click.stop="handleEdit"
              class="p-1 rounded transition-colors hover:bg-black/10"
              aria-label="编辑"
              title="编辑消息"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              @click.stop="handleDelete"
              class="p-1 rounded transition-colors hover:bg-red-500/20"
              aria-label="删除"
              title="删除消息"
            >
              <svg class="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- 文字内容 -->
        <div
          ref="textContentRef"
          :class="[
            'leading-relaxed',
            isNarration ? `italic text-center flex-1 flex flex-col ${narrationJustifyClass}` : '',
          ]"
          :style="{
            color: isNarration ? dialogStyle.colors.narrationText : dialogStyle.colors.dialogText,
            fontSize: `${dialogStyle.fontSize}px`,
            paddingLeft: isInnerArrow ? '48px' : 0,
            paddingRight: isInnerArrow ? '48px' : 0,
          }"
        >
          <span v-html="formatTextWithCursor(displayedText, isTyping)"></span>
        </div>

        <!-- 呼吸指示器 -->
        <div class="absolute bottom-3 right-4">
          <component :is="indicatorComponent" />
        </div>

        <!-- 内置右箭头 -->
        <div v-if="isInnerArrow" class="absolute right-2 top-1/2 -translate-y-1/2 z-10">
          <button
            :disabled="isLastDialogue"
            :class="[
              'flex items-center justify-center transition-all duration-200',
              isLastDialogue ? 'cursor-not-allowed opacity-40' : 'hover:bg-opacity-100',
            ]"
            :style="innerRightArrowStyle"
            aria-label="下一条对话"
            @click.stop="handleNext"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 外置右箭头 -->
      <button
        v-if="!isInnerArrow"
        :disabled="isLastDialogue"
        :class="[
          'flex flex-shrink-0 items-center justify-center transition-all duration-200',
          isLastDialogue ? 'cursor-not-allowed opacity-40' : 'hover:scale-105',
        ]"
        :style="outerArrowStyle"
        aria-label="下一条对话"
        @click.stop="handleNext"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>

  <!-- 编辑对话框 -->
  <div
    v-if="showEditDialog"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    @click="cancelEdit"
  >
    <div
      class="bg-card rounded-lg p-6 shadow-xl max-w-md w-full mx-4"
      @click.stop
      :style="{
        backgroundColor: dialogStyle.colors.boxBackground,
        borderColor: dialogStyle.colors.boxBorder,
        borderWidth: '1px',
        borderStyle: 'solid',
      }"
    >
      <h3 class="text-lg font-semibold mb-4" :style="{ color: dialogStyle.colors.dialogText }">编辑消息</h3>
      <textarea
        v-model="editText"
        class="w-full p-3 rounded border resize-none focus:outline-none focus:ring-2"
        :style="{
          backgroundColor: dialogStyle.colors.boxBackground,
          borderColor: dialogStyle.colors.boxBorder,
          color: dialogStyle.colors.dialogText,
        }"
        rows="4"
        placeholder="输入消息内容..."
      ></textarea>
      <div class="flex gap-3 mt-4 justify-end">
        <button
          @click="cancelEdit"
          class="px-4 py-2 rounded transition-colors"
          :style="{
            backgroundColor: dialogStyle.colors.boxBorder + '40',
            color: dialogStyle.colors.dialogText,
          }"
        >
          取消
        </button>
        <button
          @click="confirmEdit"
          class="px-4 py-2 rounded transition-colors"
          :style="{
            backgroundColor: dialogStyle.colors.nameBackground,
            color: dialogStyle.colors.nameText,
          }"
        >
          确认
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, nextTick, onMounted, onUnmounted, ref, VNode, watch } from 'vue';
import {
  type DialogBoxStyle,
  arrowShapePresets,
  backgroundPatternPresets,
  borderWidthPresets,
  boxShapePresets,
  defaultDialogStyle,
  indicatorShapePresets,
  nameShapePresets,
} from '../types/galgame';

interface Props {
  character: string;
  text: string;
  isLastDialogue: boolean;
  isFirstDialogue: boolean;
  onPrev: () => void;
  onNext: () => void;
  dialogKey: number;
  customStyle?: DialogBoxStyle;
  isLoading?: boolean;
  streamingText?: string;
  isThrough?: boolean;
  isEditable?: boolean;
  messageId?: number;
  onEdit?: (messageId: number, newText: string) => void;
  onDelete?: (messageId: number) => void;
}

const props = defineProps<Props>();

const displayedText = ref('');
const isTyping = ref(true);
let typingTimer: ReturnType<typeof setInterval> | null = null;

const TYPING_SPEED = 50;

// 用于检测narration文本是否需要换行
const textContentRef = ref<HTMLElement | null>(null);
const needsWrapping = ref(false);

// 根据是否需要换行来决定对齐方式
const narrationJustifyClass = computed(() => {
  return needsWrapping.value ? 'justify-start' : 'justify-center';
});

const dialogStyle = computed(() => props.customStyle || defaultDialogStyle);
const boxShape = computed(() => boxShapePresets.find(p => p.id === dialogStyle.value.boxShape) || boxShapePresets[0]);
const nameShape = computed(
  () => nameShapePresets.find(p => p.id === dialogStyle.value.nameShape) || nameShapePresets[0],
);
const arrowShape = computed(
  () => arrowShapePresets.find(p => p.id === dialogStyle.value.arrowShape) || arrowShapePresets[0],
);
const indicatorShape = computed(
  () => indicatorShapePresets.find(p => p.id === dialogStyle.value.indicatorShape) || indicatorShapePresets[0],
);
const borderWidth = computed(
  () => borderWidthPresets.find(p => p.id === dialogStyle.value.borderWidth) || borderWidthPresets[1],
);
const bgPattern = computed(() => backgroundPatternPresets.find(p => p.id === dialogStyle.value.backgroundPattern));

const isNarration = computed(() => !props.character || props.character.trim() === '');
const isInnerArrow = computed(() => arrowShape.value.isInner);
const isMinimalArrow = computed(() => arrowShape.value.type === 'minimal');
const isPillShape = computed(() => dialogStyle.value.boxShape === 'pill');

// 背景图案样式
const getPatternStyle = computed((): Record<string, string> => {
  if (!bgPattern.value?.pattern) return {};

  const borderColorForPattern = dialogStyle.value.colors.boxBorder.replace(/[\d.]+\)$/, '0.08)');
  const patternWithColor = bgPattern.value.pattern.replace(/VAR_BORDER_COLOR/g, borderColorForPattern);

  let backgroundSize = '20px 20px';
  if (bgPattern.value.id === 'dots') backgroundSize = '16px 16px';
  if (bgPattern.value.id === 'diamonds') backgroundSize = '16px 16px';
  if (bgPattern.value.id === 'stripes') backgroundSize = '28px 28px';

  return {
    backgroundImage: patternWithColor,
    backgroundSize,
  };
});

const boxStyle = computed((): Record<string, string> => {
  const style: Record<string, string> = {
    backgroundColor: isPillShape.value ? 'rgba(255, 255, 255, 0.7)' : dialogStyle.value.colors.boxBackground,
    borderRadius: boxShape.value.borderRadius,
    borderTopWidth: borderWidth.value.width,
    borderLeftWidth: borderWidth.value.width,
    borderRightWidth: borderWidth.value.width,
    borderBottomWidth: borderWidth.value.width,
    borderStyle: 'solid',
    borderColor: dialogStyle.value.colors.boxBorder,
    boxShadow: boxShape.value.shadow,
    ...(isPillShape.value ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : {}),
    ...getPatternStyle.value,
  };
  return style;
});

const outerArrowStyle = computed(() => {
  const isDisabled = props.isFirstDialogue || props.isLastDialogue;
  const iconColor = isDisabled ? `${dialogStyle.value.colors.arrowIcon}66` : dialogStyle.value.colors.arrowIcon;

  if (isMinimalArrow.value) {
    return {
      color: iconColor,
    };
  }

  const bgColor = dialogStyle.value.colors.arrowBackground;
  let borderRadius = '9999px';
  if (arrowShape.value.type === 'square' || arrowShape.value.type === 'inner-square') borderRadius = '6px';
  if (arrowShape.value.type === 'pill') borderRadius = '16px';

  return {
    backgroundColor: bgColor,
    borderRadius,
    color: iconColor,
  };
});

const innerLeftArrowStyle = computed(() => {
  const isDisabled = props.isFirstDialogue;
  const iconColor = isDisabled ? `${dialogStyle.value.colors.arrowIcon}66` : dialogStyle.value.colors.arrowIcon;
  const isRound = arrowShape.value.type === 'inner-round';
  return {
    background: isRound ? dialogStyle.value.colors.arrowBackground : 'transparent',
    color: iconColor,
  };
});

const innerRightArrowStyle = computed(() => {
  const isDisabled = props.isLastDialogue;
  const iconColor = isDisabled ? `${dialogStyle.value.colors.arrowIcon}66` : dialogStyle.value.colors.arrowIcon;
  const isRound = arrowShape.value.type === 'inner-round';
  return {
    background: isRound ? dialogStyle.value.colors.arrowBackground : 'transparent',
    color: iconColor,
  };
});

// 指示器组件
const indicatorComponent = computed((): VNode | null => {
  const { type } = indicatorShape.value;
  const { indicatorColor } = dialogStyle.value.colors;

  if (type === 'none') return null;

  // 只在流式加载时显示动画
  const isStreaming = props.isLoading || false;

  if (type === 'dots') {
    return h(
      'div',
      { class: 'flex gap-1 items-center' },
      [0, 1, 2].map(i =>
        h('span', {
          key: i,
          class: 'w-1.5 h-1.5 rounded-full transition-opacity duration-500',
          style: {
            backgroundColor: indicatorColor,
            opacity: isStreaming ? (i === 2 ? 1 : 0.4) : 0.6,
            animation: isStreaming && i === 2 ? 'pulse 1s ease-in-out infinite' : undefined,
          },
        }),
      ),
    );
  }

  if (type === 'diamonds') {
    return h(
      'div',
      { class: 'flex gap-1 items-center' },
      [0, 1, 2].map(i =>
        h('span', {
          key: i,
          class: 'transition-all duration-300',
          style: {
            width: '8px',
            height: '8px',
            backgroundColor: indicatorColor,
            opacity: isStreaming ? (i === 2 ? 1 : 0.3 + i * 0.15) : 0.5,
            transform: `rotate(45deg) scale(${isStreaming && i === 2 ? 1.1 : 0.9})`,
            animation: isStreaming && i === 2 ? 'diamondPulse 1.2s ease-in-out infinite' : undefined,
            display: 'inline-block',
          },
        }),
      ),
    );
  }

  if (type === 'pulse') {
    return h('div', { class: 'relative w-3 h-3' }, [
      h('span', {
        class: 'absolute inset-0 rounded-full',
        style: {
          backgroundColor: indicatorColor,
          opacity: 0.4,
          animation: isStreaming ? 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' : undefined,
        },
      }),
      h('span', {
        class: 'absolute inset-0 rounded-full',
        style: {
          backgroundColor: indicatorColor,
          animation: isStreaming ? 'pulse 2s ease-in-out infinite' : undefined,
        },
      }),
    ]);
  }

  if (type === 'arrow') {
    return h(
      'svg',
      {
        class: 'w-4 h-4 transition-transform duration-300',
        style: {
          color: indicatorColor,
          animation: isStreaming ? 'arrowBounce 0.8s ease-in-out infinite' : undefined,
        },
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24',
      },
      [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2',
          d: 'M9 5l7 7-7 7',
        }),
      ],
    );
  }

  return null;
});

function handlePrev() {
  if (!props.isFirstDialogue) {
    props.onPrev();
  }
}

function handleNext() {
  if (!props.isLastDialogue) {
    props.onNext();
  }
}

// 格式化文本，处理 *星号包裹* 的内心想法
function formatTextWithThoughts(text: string): string {
  if (!text) return '';

  // 将 *星号包裹* 的内容转换为斜体灰色（内心想法），左右稍微空出来一点
  // 匹配 *内容* 格式（排除 *through* 标记）
  return text.replace(/\*([^*]+)\*/g, (match, content) => {
    // 如果是 *through* 标记，跳过
    if (content.trim() === 'through') return match;
    // 转换为内心想法格式（斜体灰色，左右留空）
    return ` <span style="color: #9ca3af; font-style: italic;">${content}</span> `;
  });
}

// 格式化文本并添加光标
function formatTextWithCursor(text: string, showCursor: boolean): string {
  const formattedText = formatTextWithThoughts(text);
  if (showCursor) {
    // 将光标直接插入到文本末尾，确保它紧跟着文本
    // 使用 display: inline 确保光标是内联元素，不会导致换行
    return formattedText + '<span class="animate-pulse" style="display: inline; margin-left: 2px;">|</span>';
  }
  return formattedText;
}

function clearTypingTimer() {
  if (typingTimer) {
    clearInterval(typingTimer);
    typingTimer = null;
  }
}

function startTyping() {
  clearTypingTimer();

  if (props.isLoading) {
    displayedText.value = props.text;
    isTyping.value = true;
    return;
  }

  if (!props.text) {
    displayedText.value = '';
    isTyping.value = false;
    return;
  }

  displayedText.value = '';
  isTyping.value = true;

  let index = 0;
  typingTimer = setInterval(() => {
    if (index < props.text.length) {
      displayedText.value = props.text.slice(0, index + 1);
      index++;
    } else {
      isTyping.value = false;
      clearTypingTimer();
    }
  }, TYPING_SPEED);
}

// 检测文本是否需要换行
function checkTextWrapping() {
  if (!isNarration.value || !textContentRef.value) {
    needsWrapping.value = false;
    return;
  }

  nextTick(() => {
    if (!textContentRef.value) return;

    const element = textContentRef.value;
    const span = element.querySelector('span');
    if (!span || !displayedText.value) {
      needsWrapping.value = false;
      return;
    }

    // 获取容器的实际宽度（减去padding）
    const containerWidth = element.offsetWidth;
    const paddingLeft = parseInt(getComputedStyle(element).paddingLeft) || 0;
    const paddingRight = parseInt(getComputedStyle(element).paddingRight) || 0;
    const availableWidth = containerWidth - paddingLeft - paddingRight;

    if (availableWidth <= 0) {
      needsWrapping.value = false;
      return;
    }

    // 创建一个临时元素来测量文本是否需要换行
    const tempDiv = document.createElement('div');
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = `${availableWidth}px`;
    tempDiv.style.fontSize = `${dialogStyle.value.fontSize}px`;
    tempDiv.style.fontStyle = 'italic';
    tempDiv.style.fontFamily = getComputedStyle(element).fontFamily;
    tempDiv.style.lineHeight = getComputedStyle(element).lineHeight;
    tempDiv.style.textAlign = 'center';
    tempDiv.style.whiteSpace = 'normal';
    tempDiv.style.wordWrap = 'break-word';
    tempDiv.style.overflowWrap = 'break-word';

    // 复制文本内容（使用innerHTML来保留格式，但去除可能影响测量的元素）
    const textContent = span.innerHTML || '';
    // 移除打字机光标等可能影响测量的元素
    const cleanContent = textContent.replace(/<span[^>]*class="[^"]*animate-pulse[^"]*"[^>]*>.*?<\/span>/gi, '');
    tempDiv.innerHTML = cleanContent || 'M';

    document.body.appendChild(tempDiv);

    // 测量单行高度（使用单个字符）
    const singleLineDiv = document.createElement('div');
    singleLineDiv.style.visibility = 'hidden';
    singleLineDiv.style.position = 'absolute';
    singleLineDiv.style.top = '-9999px';
    singleLineDiv.style.left = '-9999px';
    singleLineDiv.style.width = `${availableWidth}px`;
    singleLineDiv.style.fontSize = `${dialogStyle.value.fontSize}px`;
    singleLineDiv.style.fontStyle = 'italic';
    singleLineDiv.style.fontFamily = getComputedStyle(element).fontFamily;
    singleLineDiv.style.lineHeight = getComputedStyle(element).lineHeight;
    singleLineDiv.style.textAlign = 'center';
    singleLineDiv.style.whiteSpace = 'nowrap';
    singleLineDiv.textContent = 'M';
    document.body.appendChild(singleLineDiv);

    const singleLineHeight = singleLineDiv.offsetHeight;
    const actualHeight = tempDiv.offsetHeight;

    document.body.removeChild(tempDiv);
    document.body.removeChild(singleLineDiv);

    // 如果实际高度明显大于单行高度（考虑一些误差），则认为需要换行
    needsWrapping.value = actualHeight > singleLineHeight * 1.3;
  });
}

watch(
  () => [props.text, props.dialogKey, props.isLoading],
  () => {
    startTyping();
  },
  { immediate: true },
);

watch(
  () => displayedText.value,
  () => {
    if (isNarration.value) {
      // 使用 setTimeout 确保 DOM 完全更新后再检测
      setTimeout(() => {
        checkTextWrapping();
      }, 10);
    }
  },
);

onMounted(() => {
  startTyping();
  if (isNarration.value) {
    checkTextWrapping();
  }
});

onUnmounted(() => {
  clearTypingTimer();
});

// 编辑/删除功能
const showEditDialog = ref(false);
const editText = ref('');

function handleEdit() {
  if (props.messageId === undefined) return;
  editText.value = props.text;
  showEditDialog.value = true;
}

function handleDelete() {
  if (props.messageId === undefined || !props.onDelete) return;
  if (confirm('确定要删除这条消息吗？')) {
    props.onDelete(props.messageId);
  }
}

function confirmEdit() {
  if (props.messageId === undefined || !props.onEdit) return;
  if (editText.value.trim()) {
    props.onEdit(props.messageId, editText.value.trim());
    showEditDialog.value = false;
  }
}

function cancelEdit() {
  showEditDialog.value = false;
  editText.value = '';
}
</script>

<style scoped>
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes diamondPulse {
  0%,
  100% {
    opacity: 1;
    transform: rotate(45deg) scale(1);
  }
  50% {
    opacity: 0.6;
    transform: rotate(45deg) scale(0.8);
  }
}

@keyframes ping {
  75%,
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

@keyframes arrowBounce {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(3px);
  }
}
</style>
