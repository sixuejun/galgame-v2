<template>
  <!-- 直接渲染，不使用 Teleport，跟 SettingsPanel 保持一致 -->
  <Transition name="panel-fade">
    <div v-if="retryPanelOpen" class="retry-overlay">
      <div class="retry-backdrop" @click.self="store.closeRetryPanel()" />
      <div class="retry-panel" role="dialog" aria-modal="true">
        <!-- 标题栏 -->
        <div class="retry-header">
          <span class="retry-title">{{ panelTitle }}</span>
          <button class="close-btn" title="关闭" @click="store.closeRetryPanel()">✕</button>
        </div>

        <!-- 模式标签页（仅两种类型都存在时显示） -->
        <div v-if="retryMode === 'both'" class="mode-tabs">
          <button
            class="mode-tab"
            :class="{ active: retryActiveTab === 'background' }"
            @click="store.setRetryActiveTab('background')"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path
                d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z"
              />
            </svg>
            重新生成背景
          </button>
          <button class="mode-tab" :class="{ active: retryActiveTab === 'cg' }" @click="store.setRetryActiveTab('cg')">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              />
            </svg>
            重新生成 CG
          </button>
        </div>

        <!-- 提示词输入区 -->
        <div class="prompt-section">
          <!-- 背景提示词 -->
          <div v-if="retryMode !== 'cg'" class="prompt-block">
            <label class="prompt-label">背景提示词</label>
            <textarea
              v-model="bgPromptText"
              class="prompt-input"
              :class="{ 'is-inactive': retryMode === 'both' && retryActiveTab !== 'background' }"
              placeholder="输入背景提示词..."
              rows="3"
              :readonly="retryMode === 'both' && retryActiveTab !== 'background'"
            />
          </div>

          <!-- CG 提示词 -->
          <div v-if="retryMode !== 'background'" class="prompt-block">
            <label class="prompt-label">CG 提示词</label>
            <textarea
              v-model="cgPromptText"
              class="prompt-input"
              :class="{ 'is-inactive': retryMode === 'both' && retryActiveTab !== 'cg' }"
              placeholder="输入 CG 提示词..."
              rows="3"
              :readonly="retryMode === 'both' && retryActiveTab !== 'cg'"
            />
          </div>

          <!-- 生成按钮 -->
          <div class="prompt-actions">
            <button class="gen-btn" :disabled="!currentPromptText.trim() || isGenerating" @click="onGenerate">
              <span v-if="isGenerating" class="spinner" />
              {{ isGenerating ? '生成中...' : '生成' }}
            </button>
            <label class="import-btn" title="从本地上传图片">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path
                  d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"
                />
              </svg>
              导入图片
              <input ref="fileInputRef" type="file" accept="image/*" class="hidden-file-input" @change="onFileSelected" />
            </label>
          </div>
        </div>

        <!-- 预览图网格 -->
        <div v-if="retryGeneratedImages.length > 0" class="preview-section">
          <div class="preview-grid">
            <div
              v-for="(img, i) in retryGeneratedImages"
              :key="img.tempId"
              class="preview-item"
              :class="{
                'is-done': img.status === 'done',
                'is-error': img.status === 'error',
                'is-selected': retrySelectedIndices.has(i),
              }"
              @click="img.status === 'done' ? onToggleSelect(i) : null"
              @dblclick="img.status === 'done' ? openPreview(img.imageData!) : null"
            >
              <!-- 长按预览图标 -->
              <div class="long-press-hint">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path
                    d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                  />
                </svg>
              </div>

              <!-- 生成完成 -->
              <template v-if="img.status === 'done'">
                <img :src="img.imageData" class="preview-img" />
                <div class="select-overlay">
                  <div class="select-badge">{{ retrySelectedIndices.has(i) ? '✓' : '+' }}</div>
                </div>
              </template>

              <!-- 生成中 -->
              <div v-else-if="img.status === 'generating'" class="gen-placeholder">
                <div class="gen-spinner" />
                <span>生成中</span>
              </div>

              <!-- 失败 -->
              <div v-else class="gen-placeholder error-placeholder">
                <span>{{ img.errorMsg ?? '失败' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部确认栏 -->
        <div v-if="retryGeneratedImages.length > 0" class="retry-footer">
          <button v-if="retrySelectedIndices.size > 0" class="clear-btn" @click="store.clearRetrySelection()">
            取消全选
          </button>
          <span class="selected-info"> 已选 {{ retrySelectedIndices.size }} 张 </span>
          <button class="confirm-btn" :disabled="retrySelectedIndices.size === 0" @click="onConfirm">确认插入</button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 大图预览遮罩（双击触发） -->
  <Transition name="preview-fade">
    <div v-if="previewImage" class="preview-overlay" @click="previewImage = null">
      <img :src="previewImage" class="preview-full-img" @click.stop />
      <button class="preview-close" @click="previewImage = null">✕</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useVNStore } from '../../store';

const store = useVNStore();

const retryPanelOpen = computed(() => store.retryPanelOpen);
const retryMode = computed(() => store.retryMode);
const retryActiveTab = computed(() => store.retryActiveTab);
const retryGeneratedImages = computed(() => store.retryGeneratedImages);
const retrySelectedIndices = computed(() => store.retrySelectedIndices);
const lastRetryPrompt = computed(() => store.lastRetryPrompt);

const bgPromptText = ref('');
const cgPromptText = ref('');
const previewImage = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const isGenerating = computed(() => retryGeneratedImages.value.some(g => g.status === 'generating'));

// 当前标签页对应的提示词
const currentPromptText = computed(() =>
  retryActiveTab.value === 'background' ? bgPromptText.value : cgPromptText.value,
);

// 面板标题
const panelTitle = computed(() => {
  const mode = retryMode.value;
  if (mode === 'both') return '重新生成背景 & CG';
  if (mode === 'cg') return '重新生成 CG';
  return '重新生成背景';
});

// 弹窗打开时初始化提示词
watch(retryPanelOpen, open => {
  if (open) {
    bgPromptText.value = lastRetryPrompt.value.background ?? '';
    cgPromptText.value = lastRetryPrompt.value.cg ?? '';
  }
});

// 用户修改提示词时同步回 store
watch(bgPromptText, val => {
  store.lastRetryPrompt = { ...store.lastRetryPrompt, background: val };
});
watch(cgPromptText, val => {
  store.lastRetryPrompt = { ...store.lastRetryPrompt, cg: val };
});

function onGenerate() {
  const text = currentPromptText.value.trim();
  if (!text) return;
  store.addRetryImageRequest(text, retryActiveTab.value);
}

function onToggleSelect(index: number) {
  store.toggleRetryImageSelection(index);
}

function openPreview(imageData: string) {
  previewImage.value = imageData;
}

function onConfirm() {
  store.confirmRetryImages();
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    toastr.warning('请选择图片文件');
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const base64 = e.target?.result as string;
    if (base64) {
      store.importImageToRetry(base64);
    }
  };
  reader.onerror = () => toastr.error('图片读取失败');
  reader.readAsDataURL(file);

  // 清空 value，允许重复选择同一文件
  input.value = '';
}
</script>

<style scoped>
/* ====== 外层容器（与 SettingsPanel 保持一致：absolute 填充父级） ====== */
.retry-overlay {
  position: absolute;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

/* ====== 黑色遮罩（点击关闭） ====== */
.retry-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(42, 36, 32, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* ====== 弹窗主体 ====== */
.retry-panel {
  position: relative;
  z-index: 1;
  background: var(--vn-panel-bg);
  border: 1px solid rgba(196, 162, 101, 0.3);
  border-radius: 12px;
  width: min(100%, 860px);
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

/* ====== 标题栏 ====== */
.retry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(196, 162, 101, 0.15);
  flex-shrink: 0;
}

.retry-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--theme-text-main, var(--vn-fg));
  letter-spacing: 0.05em;
}

.close-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba(196, 162, 101, 0.3);
  background: transparent;
  color: var(--theme-text-main, var(--vn-fg));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition:
    background 0.2s,
    border-color 0.2s;
}

.close-btn:hover {
  background: rgba(139, 69, 19, 0.3);
  border-color: var(--theme-accent, var(--rust));
}

/* ====== 模式标签页 ====== */
.mode-tabs {
  display: flex;
  border-bottom: 1px solid rgba(196, 162, 101, 0.12);
  padding: 0 20px;
  flex-shrink: 0;
}

.mode-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--theme-text-muted, var(--vn-muted));
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;
  margin-bottom: -1px;
}

.mode-tab:hover {
  color: var(--theme-text-main, var(--vn-fg));
}

.mode-tab.active {
  color: var(--theme-accent, var(--rust));
  border-bottom-color: var(--theme-accent, var(--rust));
}

/* ====== 提示词输入区 ====== */
.prompt-section {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid rgba(196, 162, 101, 0.1);
  flex-shrink: 0;
}

.prompt-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.prompt-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--theme-text-muted, var(--vn-muted));
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.prompt-input {
  width: 100%;
  box-sizing: border-box;
  background: rgba(42, 36, 32, 0.4);
  border: 1px solid rgba(196, 162, 101, 0.25);
  border-radius: 6px;
  color: var(--theme-text-main, var(--vn-fg));
  font-size: 0.85rem;
  line-height: 1.6;
  padding: 10px 12px;
  resize: vertical;
  outline: none;
  transition:
    border-color 0.2s,
    opacity 0.2s;
  font-family: inherit;
}

.prompt-input:focus {
  border-color: rgba(196, 162, 101, 0.55);
}

.prompt-input::placeholder {
  color: var(--theme-text-muted, var(--vn-muted));
}

/* 非当前激活标签页的输入框置灰 */
.prompt-input.is-inactive {
  opacity: 0.35;
  cursor: not-allowed;
}

.prompt-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* ====== 生成按钮 ====== */
.gen-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 24px;
  background: var(--theme-accent-soft, rgba(139, 69, 19, 0.7));
  border: 1px solid rgba(196, 162, 101, 0.45);
  border-radius: 6px;
  color: var(--paper-light);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s,
    opacity 0.2s;
}

.gen-btn:hover:not(:disabled) {
  background: rgba(139, 69, 19, 0.95);
  border-color: var(--theme-accent, var(--rust));
}

.gen-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ====== 导入按钮 ====== */
.import-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(42, 36, 32, 0.6);
  border: 1px solid rgba(196, 162, 101, 0.3);
  border-radius: 6px;
  color: var(--theme-text-soft, var(--vn-muted));
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s,
    color 0.2s;
  user-select: none;
}

.import-btn:hover {
  background: rgba(42, 36, 32, 0.9);
  border-color: rgba(196, 162, 101, 0.5);
  color: var(--theme-text-main, var(--vn-fg));
}

.hidden-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

/* ====== 预览网格 ====== */
.preview-section {
  padding: 16px 20px;
  flex: 1;
  min-height: 0;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.preview-item {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  transition:
    border-color 0.2s,
    transform 0.2s,
    box-shadow 0.2s;
  cursor: default;
  background: rgba(42, 36, 32, 0.5);
}

.preview-item.is-done {
  cursor: pointer;
}

.preview-item.is-done:hover {
  border-color: rgba(196, 162, 101, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.preview-item.is-selected {
  border-color: var(--theme-accent, var(--rust)) !important;
  transform: translateY(-5px) !important;
  box-shadow: 0 10px 30px rgba(139, 69, 19, 0.55) !important;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ====== 长按预览图标 ====== */
.long-press-hint {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.preview-item.is-done:hover .long-press-hint {
  opacity: 1;
}

/* ====== 选中遮罩 ====== */
.select-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 6px;
}

.preview-item.is-selected .select-overlay {
  opacity: 1;
}

.select-badge {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--theme-accent, var(--rust));
  border: 2px solid rgba(196, 162, 101, 0.6);
  color: var(--paper-light);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ====== 生成中占位 ====== */
.gen-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--theme-text-muted, var(--vn-muted));
  font-size: 0.75rem;
}

.error-placeholder {
  color: rgba(200, 80, 80, 0.8);
}

/* ====== 生成旋转动画 ====== */
.gen-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(196, 162, 101, 0.2);
  border-top-color: rgba(196, 162, 101, 0.7);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ====== 底部确认栏 ====== */
.retry-footer {
  padding: 12px 20px 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid rgba(196, 162, 101, 0.12);
  flex-shrink: 0;
}

.selected-info {
  font-size: 0.8rem;
  color: var(--theme-text-muted, var(--vn-muted));
  flex: 1;
}

.clear-btn {
  padding: 6px 14px;
  background: transparent;
  border: 1px solid rgba(196, 162, 101, 0.3);
  border-radius: 5px;
  color: var(--theme-text-muted, var(--vn-muted));
  font-size: 0.8rem;
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s;
}

.clear-btn:hover {
  border-color: rgba(196, 162, 101, 0.6);
  color: var(--theme-text-main, var(--vn-fg));
}

.confirm-btn {
  padding: 8px 22px;
  background: rgba(139, 69, 19, 0.85);
  border: 1px solid rgba(196, 162, 101, 0.55);
  border-radius: 6px;
  color: var(--paper-light);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s,
    opacity 0.2s;
}

.confirm-btn:hover:not(:disabled) {
  background: rgba(139, 69, 19, 1);
}

.confirm-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ====== 大图预览 ====== */
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.preview-full-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 0 60px rgba(0, 0, 0, 0.8);
  cursor: default;
}

.preview-close {
  position: fixed;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(196, 162, 101, 0.4);
  background: rgba(42, 36, 32, 0.7);
  color: var(--theme-text-main, var(--vn-fg));
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.preview-close:hover {
  background: var(--theme-accent-soft, rgba(139, 69, 19, 0.5));
}

/* ====== 过渡动画 ====== */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.25s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}

.panel-fade-enter-active .retry-panel,
.panel-fade-leave-active .retry-panel {
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.25s ease;
}

.panel-fade-enter-from .retry-panel {
  transform: scale(0.92);
  opacity: 0;
}

.panel-fade-leave-to .retry-panel {
  transform: scale(0.95);
  opacity: 0;
}

.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.2s ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}

/* ====== 按钮内旋转 ====== */
.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
</style>
