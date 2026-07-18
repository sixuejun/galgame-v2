<template>
  <div class="typewriter-container" :style="containerStyle">
    <div
      ref="textRef"
      class="typewriter-content no-scrollbar overflow-y-auto"
      :style="contentStyle"
      @scroll="handleScroll"
    >
      <!-- 角色台词：需要解析心理描写 -->
      <p v-if="textType === 'character'" class="typewriter-text" :style="textStyle">
        <template v-for="(segment, index) in parsedText" :key="index">
          <span v-if="segment.type === 'thought'" class="thought-segment">{{ segment.text }}</span>
          <template v-else>{{ segment.text }}</template>
        </template>
        <span v-if="isTyping" class="typewriter-caret" />
      </p>

      <!-- 旁白/用户：直接显示 -->
      <p v-else class="typewriter-text" :style="textStyle">
        {{ displayedText }}
        <span v-if="isTyping" class="typewriter-caret" />
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVNStore } from '../../store';

const props = withDefaults(
  defineProps<{
    /** 当前显示的文本 */
    displayedText: string;
    /** 是否正在打字中 */
    isTyping: boolean;
    /** 文本类型，决定渲染方式 */
    textType?: 'character' | 'narration' | 'blacktext';
    /** 最大高度 */
    maxHeight?: string;
    /** 禁用解析心理描写 */
    disableThoughtParsing?: boolean;
  }>(),
  {
    textType: 'narration',
    maxHeight: 'var(--theme-dialogue-text-max-height, 6rem)', // 用 rem 而非 em 避免字号联动
    disableThoughtParsing: false,
  },
);

const emit = defineEmits<{
  /** 滚动时触发 */
  scroll: [];
}>();

const store = useVNStore();
const textRef = ref<HTMLDivElement | null>(null);
const isManualScroll = ref(false);

/** 容器样式 */
const containerStyle = computed(() => ({
  paddingTop: 'var(--theme-dialogue-text-padding-top, 1.5rem)',
  paddingRight: 'var(--theme-dialogue-text-padding-right, 2.5rem)',
  paddingBottom: 'var(--theme-dialogue-text-padding-bottom, 0.8rem)',
  paddingLeft: 'var(--theme-dialogue-text-padding-left, 2.5rem)',
}));

/** 内容区样式 */
const contentStyle = computed(() => {
  const base = { maxHeight: props.maxHeight };
  if (store.settings.fixedDialogueMinHeight) {
    // 开关开启：额外设 min-height 保底，避免短文本时高度坍缩
    return { ...base, minHeight: 'var(--theme-dialogue-min-height, 25vmin)' };
  }
  // 开关关闭：只设 max-height，文本在范围内自由撑开，超出上限时内部滚动，不撑大外层
  return base;
});

/** 文本样式 */
const textStyle = computed(() => {
  const baseStyle: Record<string, string> = {
    // 关键 fallback：用 rem 而非 em，避免被祖先 font-size 联动缩小、消失
    fontSize: 'var(--theme-dialogue-text-font-size, 1rem)',
    lineHeight: 'var(--theme-dialogue-text-line-height, 1.75)',
    letterSpacing: 'var(--theme-dialogue-text-letter-spacing, 0.05em)',
  };

  if (props.textType === 'narration') {
    baseStyle.fontStyle = 'italic';
  }

  baseStyle.color = getTextColor();

  if (props.textType !== 'character') {
    baseStyle.fontFamily = 'var(--theme-font-body, inherit)';
  }

  return baseStyle;
});

function getTextColor() {
  switch (props.textType) {
    case 'narration':
      return 'var(--theme-text-soft, rgba(212,197,160,0.7))';
    case 'character':
    default:
      return 'var(--theme-dialogue-text-color, var(--theme-text-main, #2f241f))';
  }
}

/** 解析角色台词中的心理描写（*内容*） */
interface TextSegment {
  type: 'normal' | 'thought';
  text: string;
}

function parseCharacterText(text: string): TextSegment[] {
  if (props.disableThoughtParsing) {
    return [{ type: 'normal', text }];
  }

  const segments: TextSegment[] = [];
  const regex = /\*(.*?)\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'normal', text: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'thought', text: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'normal', text: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'normal', text }];
}

const parsedText = computed(() => {
  if (props.textType !== 'character' || props.disableThoughtParsing) {
    return [{ type: 'normal' as const, text: props.displayedText }];
  }
  return parseCharacterText(props.displayedText);
});

function handleScroll() {
  isManualScroll.value = true;
  emit('scroll');
  setTimeout(() => {
    isManualScroll.value = false;
  }, 3000);
}

// Auto-scroll to bottom when text changes
watch(
  () => props.displayedText,
  () => {
    if (!isManualScroll.value && textRef.value) {
      textRef.value.scrollTop = textRef.value.scrollHeight;
    }
  },
);
</script>

<style scoped>
/* height 默认 100%，可在父级 .skin-shell__content 是 h-auto 时被全局样式覆盖 */
.typewriter-container {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.typewriter-content {
  width: 100%;
  /* 不强制 height:100%，让内容按需自然撑开（开关关闭时由父级 .h-auto 接管） */
  min-height: 0;
}

.typewriter-text {
  margin: 0;
  padding: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 心理描写：灰色斜体，与普通文字有间距 */
.thought-segment {
  color: rgba(150, 140, 130, 0.85);
  font-style: italic;
  margin: 0 0.15em;
}

/* 光标 */
.typewriter-caret {
  display: inline-block;
  width: 0.1em;
  height: 1em;
  background: var(--theme-accent, var(--rust));
  animation: cursor-blink 1s infinite;
  vertical-align: text-bottom;
  margin-left: 0.05em;
}

@keyframes cursor-blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}
</style>
