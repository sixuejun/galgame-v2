<!--
  StoryDisplay 组件

  显示故事内容，包含场景元数据（时间、地点、天气）和故事正文

  Props:
  - story: 故事对象，包含内容、时间、地点、天气等信息
  - sanitizedContent: 经过清理的 HTML 内容
-->
<template>
  <div class="scene-content" :class="{ compact: isCompactMode }">
    <div v-if="showSceneHeader" class="scene-header">
      <div v-if="story?.time" class="scene-meta" data-label="时间">
        <span class="scene-meta-value">{{ story.time }}</span>
      </div>
      <div v-if="story?.location" class="scene-meta" data-label="地点">
        <span class="scene-meta-value">{{ story.location }}</span>
      </div>
      <div v-if="story?.weather" class="scene-meta" data-label="天气">
        <span class="scene-meta-value">{{ story.weather }}</span>
      </div>
    </div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="scene-content-main" v-html="sanitizedContent"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import type { Story } from '../../../types'
import { useSettingsStore } from '../../../stores/settingsStore'
import { useTTS } from '../../../composables/ui/useTTS'

// Props
const props = defineProps<{
  story?: Story
  sanitizedContent: string
}>()

const settingsStore = useSettingsStore()
const { playText } = useTTS()

// 对话行的引用
const dialogueLines = ref<Array<{ text: string; element: HTMLElement }>>([])

// 是否显示场景头部
const showSceneHeader = computed(() => {
  // 检查配置项是否启用
  const isEnabled = settingsStore.settings.showStoryMetadata
  // 检查是否有元数据内容
  const hasMetadata = !!(props.story?.time || props.story?.location || props.story?.weather)
  return isEnabled && hasMetadata
})

// 是否启用紧凑模式（当主页标题和故事元数据都不显示时）
const isCompactMode = computed(() => {
  const showHomeHeader = settingsStore.settings.showHomeHeader
  const showMetadata = settingsStore.settings.showStoryMetadata
  return !showHomeHeader && !showMetadata
})

/**
 * 检测文本是否包含对话
 * 支持的引号：英文单引号 '、中文引号「」和 ""
 */
const hasDialogue = (text: string): boolean => {
  // 匹配英文单引号、中文引号
  const dialoguePattern = /'[^']+?'|「[^」]+?」|"[^"]+?"/
  return dialoguePattern.test(text)
}

/**
 * 提取对话文本
 */
const extractDialogue = (text: string): string => {
  // 提取引号内的内容
  const match = text.match(/'([^']+?)'|「([^」]+?)」|"([^"]+?)"/)
  if (match) {
    return match[1] || match[2] || match[3] || ''
  }
  return text
}

/**
 * 扫描并标记对话行
 */
const scanDialogueLines = (): void => {
  dialogueLines.value = []
  const contentElement = document.querySelector('.scene-content-main')
  if (!contentElement) return

  // 获取所有文本节点
  const walker = document.createTreeWalker(contentElement, NodeFilter.SHOW_TEXT, null)
  const textNodes: Text[] = []
  let node: Node | null
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text)
  }

  // 检查每个文本节点是否包含对话
  textNodes.forEach(textNode => {
    const text = textNode.textContent || ''
    if (hasDialogue(text)) {
      const parentElement = textNode.parentElement
      if (parentElement && !parentElement.querySelector('.tts-play-button')) {
        dialogueLines.value.push({
          text: extractDialogue(text),
          element: parentElement,
        })
      }
    }
  })

  // 为每个对话行添加播放按钮
  nextTick(() => {
    dialogueLines.value.forEach(({ text, element }) => {
      addPlayButton(element, text)
    })
  })
}

/**
 * 添加播放按钮到元素
 */
const addPlayButton = (element: HTMLElement, text: string): void => {
  // 检查是否已经添加过按钮
  if (element.querySelector('.tts-play-button')) return

  const button = document.createElement('button')
  button.className = 'tts-play-button'
  button.innerHTML = '<i class="fas fa-volume-up"></i>'
  button.title = '播放语音'
  button.onclick = e => {
    e.preventDefault()
    e.stopPropagation()
    playText(text)
  }

  // 将按钮添加到元素末尾
  element.style.position = 'relative'
  element.appendChild(button)
}

/**
 * 组件挂载后扫描对话
 */
onMounted(() => {
  nextTick(() => {
    scanDialogueLines()
  })
})
</script>

<style scoped>
.scene-content {
  background: white;
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--gray-200);
  transition: all var(--transition-base) ease;
}

.scene-content:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-2px);
}

/* 紧凑模式：当主页标题和故事元数据都不显示时，使用更简洁的样式 */
.scene-content.compact {
  padding: var(--spacing-md);
  margin-bottom: 0;
  box-shadow: none;
  border: none;
  background: transparent;
}

.scene-content.compact:hover {
  box-shadow: none;
  transform: none;
}

.scene-header {
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  text-align: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--gray-200);
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.scene-meta {
  flex: 1;
  min-width: 100px;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: all var(--transition-base) ease;
}

.scene-meta:hover {
  background: var(--gray-50);
  transform: translateY(-2px);
}

.scene-meta::before {
  content: attr(data-label);
  display: block;
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-bottom: var(--spacing-xs);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: var(--font-semibold);
}

.scene-meta-value {
  font-size: var(--text-lg);
  color: var(--text-dark);
  font-weight: var(--font-semibold);
}

.scene-content-main {
  line-height: 1.8;
  white-space: pre-wrap;
  color: var(--text-dark);
  font-size: var(--text-base);
}

.scene-content-main :deep(h1),
.scene-content-main :deep(h2),
.scene-content-main :deep(h3) {
  color: var(--primary-blue);
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: var(--font-semibold);
}

.scene-content-main :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-lg);
  margin: var(--spacing-md) 0;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base) ease;
}

.scene-content-main :deep(img:hover) {
  box-shadow: var(--shadow-lg);
  transform: scale(1.02);
}

.scene-content-main :deep(blockquote) {
  border-left: 4px solid var(--primary-blue);
  padding-left: var(--spacing-lg);
  margin: var(--spacing-lg) 0;
  color: var(--text-muted);
  font-style: italic;
  background: var(--gray-50);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.scene-content-main :deep(code) {
  background: rgba(0, 128, 255, 0.1);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-family: 'Courier New', monospace;
  font-size: var(--text-sm);
  color: var(--primary-blue);
}

.scene-content-main :deep(strong) {
  color: var(--primary-blue);
  font-weight: var(--font-bold);
}

.scene-content-main :deep(em) {
  color: var(--accent-pink);
  font-style: italic;
}

.scene-content-main :deep(del) {
  color: var(--text-muted);
  text-decoration: line-through;
  opacity: 0.7;
}

.scene-content-main :deep(p) {
  margin: 0.5em 0;
}

.scene-content-main :deep(ul),
.scene-content-main :deep(ol) {
  margin: 0.5em 0;
  padding-left: 2em;
}

.scene-content-main :deep(li) {
  margin: 0.25em 0;
}

/* TTS 播放按钮样式 */
.scene-content-main :deep(.tts-play-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-left: var(--spacing-xs);
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--primary-blue);
  color: white;
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all var(--transition-base) ease;
  vertical-align: middle;
  opacity: 0.7;
}

.scene-content-main :deep(.tts-play-button:hover) {
  opacity: 1;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.4);
}

.scene-content-main :deep(.tts-play-button:active) {
  transform: scale(0.95);
}

.scene-content-main :deep(.tts-play-button i) {
  font-size: 12px;
}

@media (max-width: 768px) {
  .scene-content {
    padding: var(--spacing-lg);
  }

  .scene-header {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .scene-meta {
    width: 100%;
  }

  .scene-content-main :deep(.tts-play-button) {
    width: 28px;
    height: 28px;
    font-size: var(--text-sm);
  }
}
</style>
