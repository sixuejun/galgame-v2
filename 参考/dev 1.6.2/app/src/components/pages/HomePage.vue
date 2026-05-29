<!--
  HomePage 组件

  游戏主页面，显示故事内容和玩家选择。

  功能：
  - 显示游戏标题和副标题
  - 显示场景元数据（时间、地点、天气）
  - 显示经过 HTML 清理的故事内容
  - 显示玩家选择面板
  - 错误边界保护

  Props:
  - config (Config, 可选): 游戏配置对象，包含标题和副标题
  - story (Story, 可选): 故事对象，包含内容、时间、地点、天气等信息
  - choices (Choice[], 默认: []): 玩家可选择的选项列表

  Emits:
  - choose(text: string): 当玩家选择一个选项时触发，传递选择的文本

  使用示例:
  ```vue
  <HomePage
    :config="gameConfig"
    :story="currentStory"
    :choices="availableChoices"
    @choose="handlePlayerChoice"
  />
  ```
-->
<template>
  <ErrorBoundary @error="handleError">
    <div class="page-home">
      <!-- 页面标题和副标题 -->
      <HomeHeader :show="showHomeHeader" :title="pageTitle" :subtitle="pageSubtitle" />

      <!-- 故事内容显示 -->
      <StoryDisplay :story="story" :sanitized-content="sanitizedContent" />

      <!-- 玩家选择面板 -->
      <ChoicesPanel :choices="choices" :choice-header="choiceHeader" @choose="handleChoice" />
    </div>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Config, Story, Choice } from '../../types'
import ErrorBoundary from '../common/ErrorBoundary.vue'
import HomeHeader from './HomePage/HomeHeader.vue'
import StoryDisplay from './HomePage/StoryDisplay.vue'
import ChoicesPanel from './HomePage/ChoicesPanel.vue'
import { logger } from '../../utils/logger'
import { useSettingsStore } from '../../stores/settingsStore'
import { useStoryContentProcessor } from '../../composables/ui/useStoryContentProcessor'

interface Props {
  config?: Config
  story?: Story
  choices?: Choice[]
}

const props = withDefaults(defineProps<Props>(), {
  choices: () => [],
})

const emit = defineEmits<{
  choose: [text: string]
}>()

const settingsStore = useSettingsStore()

// 是否显示主页标题
const showHomeHeader = computed(() => {
  return settingsStore.settings.showHomeHeader
})

// 页面标题 - 使用新数据模型结构
const pageTitle = computed(() => {
  return props.config?.home?.title || '伊甸园 - Eden System'
})

// 页面副标题 - 使用新数据模型结构
const pageSubtitle = computed(() => {
  return props.config?.home?.subtitle || '一个只属于二人的完美世界'
})

// 选择面板标题 - 使用新数据模型结构
const choiceHeader = computed(() => {
  return props.config?.home?.choiceHeader
})

// 使用故事内容处理 Composable
const { sanitizedContent } = useStoryContentProcessor(computed(() => props.story?.content))

const handleChoice = (text: string) => {
  emit('choose', text)
}

/**
 * 处理错误
 */
const handleError = (error: Error) => {
  logger.error('主页发生错误:', error)
}
</script>

<style scoped>
.page-home {
  animation: fadeInUp var(--transition-slow) cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
