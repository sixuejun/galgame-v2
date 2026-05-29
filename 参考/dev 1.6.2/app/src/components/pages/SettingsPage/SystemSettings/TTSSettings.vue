<!--
  TTSSettings 组件

  功能：
  - 在设置页面中提供 MiniMax TTS 配置
  - 直接与 settingsStore 绑定，实时保存配置
-->
<template>
  <div class="settings-subsection">
    <h3 class="subsection-title">
      <i class="fas fa-volume-up"></i>
      MiniMax 语音合成
    </h3>

    <div class="settings-grid">
      <!-- MiniMax API Key -->
      <div class="setting-item full-width">
        <label for="minimax-api-key" class="setting-label">MiniMax API Key</label>
        <div class="setting-control">
          <input
            id="minimax-api-key"
            v-model="apiKey"
            type="password"
            placeholder="sk-xxxx"
            autocomplete="off"
          />
          <span class="setting-hint">仅保存在浏览器本地设置中，建议在受信任环境下填写。</span>
        </div>
      </div>

      <!-- 目标模型 -->
      <div class="setting-item">
        <label for="minimax-model" class="setting-label">
          <i class="fas fa-microphone"></i>
          目标模型
        </label>
        <div class="setting-control">
          <CustomSelect
            id="minimax-model"
            :model-value="selectedModel"
            :options="modelOptions"
            aria-label="选择TTS语音模型"
            @update:model-value="handleModelChange"
          />
          <span class="setting-hint">{{ getModelHint(selectedModel) }}</span>
        </div>
      </div>

      <!-- 输出形式 -->
      <div class="setting-item">
        <label for="minimax-output-format" class="setting-label">
          <i class="fas fa-file-audio"></i>
          输出形式
        </label>
        <div class="setting-control">
          <CustomSelect
            id="minimax-output-format"
            :model-value="outputFormat"
            :options="outputFormats"
            aria-label="选择音频输出格式"
            @update:model-value="handleOutputFormatChange"
          />
          <span class="setting-hint">{{ getOutputHint(outputFormat) }}</span>
        </div>
      </div>

      <!-- 启用 Stream -->
      <div class="setting-item">
        <label for="minimax-stream" class="setting-label">启用 Stream（Chunk / SSE）</label>
        <div class="setting-control">
          <div class="toggle-wrapper">
            <label class="toggle-switch">
              <input id="minimax-stream" v-model="streamEnabled" type="checkbox" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <span class="setting-hint">开启后可按需解析增量数据，当前仍返回最终合成音频。</span>
        </div>
      </div>

      <!-- 自定义请求 ID -->
      <div class="setting-item">
        <label for="minimax-request-id" class="setting-label">自定义请求 ID</label>
        <div class="setting-control">
          <input
            id="minimax-request-id"
            v-model="requestId"
            type="text"
            placeholder="方便排查日志"
          />
          <span class="setting-hint">可选，用于在日志中追踪请求。</span>
        </div>
      </div>

      <!-- 语音 ID -->
      <div class="setting-item">
        <label for="minimax-voice-id" class="setting-label">语音 ID (Voice ID)</label>
        <div class="setting-control">
          <input id="minimax-voice-id" v-model="voiceId" type="text" placeholder="输入语音 ID" />
          <span class="setting-hint">用于指定要使用的语音角色。</span>
        </div>
      </div>

      <!-- 语音速度 -->
      <div class="setting-item">
        <label for="minimax-speed" class="setting-label">
          <i class="fas fa-tachometer-alt"></i>
          语音速度 (Speed)
        </label>
        <div class="setting-control">
          <CustomNumberInput
            id="minimax-speed"
            :model-value="speed"
            :min="0.5"
            :max="2"
            :step="0.1"
            aria-label="语音播放速度"
            @update:model-value="handleSpeedChange"
          />
          <span class="setting-hint">语音播放速度，范围：0.5 - 2.0，默认：1.0</span>
        </div>
      </div>

      <!-- TTS 缓存上限 -->
      <div class="setting-item">
        <label for="tts-cache-limit" class="setting-label">
          <i class="fas fa-database"></i>
          TTS 缓存上限
        </label>
        <div class="setting-control">
          <CustomNumberInput
            id="tts-cache-limit"
            :model-value="cacheLimit"
            :min="10"
            :max="1000"
            :step="10"
            aria-label="TTS音频缓存数量上限"
            @update:model-value="handleCacheLimitChange"
          />
          <span class="setting-hint">TTS 音频缓存数量上限，范围：10 - 1000，默认：100</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settingsStore'
import CustomSelect from '@/components/common/CustomSelect.vue'
import CustomNumberInput from '@/components/common/CustomNumberInput.vue'
import type { MiniMaxOutputFormat, MiniMaxVoiceModel } from '@/types'

const modelOptions = ref<Array<{ label: string; value: MiniMaxVoiceModel }>>([
  { label: 'speech-2.6-hd（推荐）', value: 'speech-2.6-hd' },
  { label: 'speech-2.6-turbo', value: 'speech-2.6-turbo' },
  { label: 'speech-02-hd', value: 'speech-02-hd' },
  { label: 'speech-02-turbo', value: 'speech-02-turbo' },
  { label: 'speech-01-hd', value: 'speech-01-hd' },
  { label: 'speech-01-turbo', value: 'speech-01-turbo' },
])

const modelHints: Record<MiniMaxVoiceModel, string> = {
  'speech-2.6-hd': '高保真，延迟略高',
  'speech-2.6-turbo': '均衡性能',
  'speech-02-hd': '上一代高保真模型',
  'speech-02-turbo': '上一代低延迟模型',
  'speech-01-hd': '兼容旧能力',
  'speech-01-turbo': '兼容旧能力（低延迟）',
}

const outputFormats = ref<Array<{ label: string; value: MiniMaxOutputFormat }>>([
  { label: 'hex（默认，可直接播放）', value: 'hex' },
  { label: 'url（24h 有效音频地址）', value: 'url' },
])

const outputHints: Record<MiniMaxOutputFormat, string> = {
  hex: '返回 hex 字符串，便于立即生成 Blob 播放',
  url: '返回临时链接，适合分发/下载',
}

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

const apiKey = computed({
  get: () => settings.value.minimaxApiKey ?? '',
  set: value => settingsStore.updateSetting('minimaxApiKey', value),
})

const selectedModel = computed({
  get: () => settings.value.minimaxModel ?? 'speech-2.6-hd',
  set: value => settingsStore.updateSetting('minimaxModel', value),
})

const outputFormat = computed({
  get: () => settings.value.minimaxOutputFormat ?? 'hex',
  set: value => settingsStore.updateSetting('minimaxOutputFormat', value),
})

const streamEnabled = computed({
  get: () => settings.value.minimaxStream ?? false,
  set: value => settingsStore.updateSetting('minimaxStream', value),
})

const requestId = computed({
  get: () => settings.value.minimaxRequestId ?? '',
  set: value => settingsStore.updateSetting('minimaxRequestId', value),
})

const voiceId = computed({
  get: () => settings.value.minimaxVoiceId ?? '',
  set: value => settingsStore.updateSetting('minimaxVoiceId', value),
})

const speed = computed({
  get: () => settings.value.minimaxSpeed ?? 1.0,
  set: value => {
    const numValue = typeof value === 'number' && !isNaN(value) ? value : 1.0
    settingsStore.updateSetting('minimaxSpeed', numValue)
  },
})

const cacheLimit = computed({
  get: () => settings.value.ttsCacheLimit ?? 100,
  set: value => {
    const numValue = typeof value === 'number' && !isNaN(value) ? value : 100
    settingsStore.updateSetting('ttsCacheLimit', numValue)
  },
})

/**
 * 处理模型变更
 */
const handleModelChange = (value: string) => {
  selectedModel.value = value as MiniMaxVoiceModel
}

/**
 * 处理输出格式变更
 */
const handleOutputFormatChange = (value: string) => {
  outputFormat.value = value as MiniMaxOutputFormat
}

/**
 * 处理语音速度变更
 */
const handleSpeedChange = (value: number) => {
  speed.value = value
}

/**
 * 处理缓存上限变更
 */
const handleCacheLimitChange = (value: number) => {
  cacheLimit.value = value
}

const getModelHint = (value: MiniMaxVoiceModel) => {
  return modelHints[value] ?? ''
}

const getOutputHint = (value: MiniMaxOutputFormat) => {
  return outputHints[value] ?? ''
}

// 暴露方法供测试使用
defineExpose({
  handleModelChange,
  handleOutputFormatChange,
  handleSpeedChange,
  handleCacheLimitChange,
  getModelHint,
  getOutputHint,
})
</script>

<style scoped>
@import './settings-common.css';

/* Toggle 开关样式 */
.toggle-wrapper {
  display: flex;
  align-items: center;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e0;
  transition: 0.3s;
  border-radius: 24px;
  border: 2px solid #a0aec0;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-slider:hover {
  background-color: #b8c5d3;
  border-color: #8795a8;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

input:checked + .toggle-slider {
  background-color: var(--primary-blue);
  border-color: var(--primary-blue);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

input:checked + .toggle-slider:hover {
  background-color: #0070e0;
  border-color: #0070e0;
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

/* 全宽设置项 */
.setting-item.full-width {
  grid-column: 1 / -1;
}
</style>
