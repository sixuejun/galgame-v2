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
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
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

          <!-- 按钮行 -->
          <div class="prompt-actions">
            <!-- 相册按钮（打开独立相册弹窗） -->
            <button class="album-btn" @click="store.openAlbumPanel()">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z" />
              </svg>
              相册
              <span v-if="albumCount > 0" class="album-badge">{{ albumCount }}</span>
            </button>

            <div class="action-spacer" />

            <button class="gen-btn" :disabled="!currentPromptText.trim() || isGenerating" @click="onGenerate">
              <span v-if="isGenerating" class="spinner" />
              {{ isGenerating ? '生成中...' : '生成' }}
            </button>
            <label class="import-btn" title="从本地上传图片（自动绑定当前场景）">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
              </svg>
              导入图片
              <input ref="fileInputRef" type="file" accept="image/*" class="hidden-file-input" @change="onFileSelected" />
            </label>
          </div>
        </div>

        <!-- 预览图网格 -->
        <div v-if="retryGeneratedImages.length > 0" class="preview-section">
          <div class="section-label">本次生成 / 导入</div>
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
              @dblclick="img.status === 'done' ? openPreview(img.imageData!, img.tempId) : null"
            >
              <!-- 铅笔按钮（右上角） -->
              <button
                v-if="img.status === 'done'"
                class="edit-title-btn"
                title="编辑标题"
                @click.stop="openTitleEdit(img.tempId)"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
              </button>

              <!-- 长按预览图标 -->
              <div class="long-press-hint">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
              </div>

              <!-- 生成完成 -->
              <template v-if="img.status === 'done'">
                <img :src="img.imageData" class="preview-img" />
                <div class="select-overlay">
                  <div class="select-badge">{{ retrySelectedIndices.has(i) ? '✓' : '+' }}</div>
                </div>
                <!-- title 标签 -->
                <div v-if="img.title" class="title-tag">{{ img.title }}</div>
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

  <!-- 大图预览遮罩（双击预览图触发） -->
  <Transition name="preview-fade">
    <div v-if="previewItem" class="preview-overlay" @click.self="closePreview">
      <div class="preview-panel" @click.stop>
        <img :src="previewItem.imageData" class="preview-full-img" />

        <!-- 编辑操作栏（本次图片） -->
        <div class="preview-edit-bar">
          <button class="preview-edit-btn" @click="openTitleEdit(previewItem.tempId!)">编辑标题</button>
          <label class="preview-edit-btn">
            替换图片
            <input type="file" accept="image/*" class="hidden-file-input" @change="onReplaceFile($event, previewItem.tempId!)" />
          </label>
          <label class="preview-edit-btn">
            网络图片
            <input type="text" class="url-input" placeholder="粘贴 URL 后回车" @keyup.enter="onUrlImport($event, previewItem.tempId!)" />
          </label>
        </div>

        <button class="preview-close" @click="closePreview">✕</button>
      </div>
    </div>
  </Transition>

  <!-- 标题编辑弹窗 -->
  <Transition name="panel-fade">
    <div v-if="titleEditTarget !== null" class="edit-title-overlay" @click.self="titleEditTarget = null">
      <div class="edit-title-panel">
        <div class="edit-title-header">
          <span>编辑标题</span>
          <button class="close-btn" @click="titleEditTarget = null">✕</button>
        </div>
        <div class="edit-title-body">
          <input
            v-model="titleEditValue"
            class="edit-title-input"
            placeholder="输入标题..."
            @keyup.enter="confirmTitleEdit()"
            ref="titleEditInputRef"
          />
          <div class="edit-title-hint">标题用于场景绑定：相同标题的图片在场景切换时会优先展示</div>
        </div>
        <div class="edit-title-footer">
          <button class="cancel-btn" @click="titleEditTarget = null">取消</button>
          <button class="confirm-title-btn" @click="confirmTitleEdit()">确认</button>
        </div>
      </div>
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
const fileInputRef = ref<HTMLInputElement | null>(null);

// 相册按钮 badge 计数
const albumCount = computed(() =>
  store.getBindingAlbum('background').length + store.getBindingAlbum('cg').length,
);

// 预览状态
interface PreviewTarget {
  imageData: string;
  tempId: string;
  title?: string;
}
const previewItem = ref<PreviewTarget | null>(null);

// 标题编辑状态
const titleEditTarget = ref<string | null>(null);
const titleEditValue = ref('');
const titleEditInputRef = ref<HTMLInputElement | null>(null);

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

function openPreview(imageData: string, tempId: string) {
  const img = retryGeneratedImages.value.find(g => g.tempId === tempId);
  previewItem.value = { imageData, tempId, title: img?.title };
}

function closePreview() {
  previewItem.value = null;
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
    if (base64) store.importImageToRetry(base64);
  };
  reader.onerror = () => toastr.error('图片读取失败');
  reader.readAsDataURL(file);
  input.value = '';
}

// 打开标题编辑弹窗
function openTitleEdit(tempId: string) {
  const img = retryGeneratedImages.value.find(g => g.tempId === tempId);
  titleEditTarget.value = tempId;
  titleEditValue.value = img?.title ?? store.currentBlock?.scene ?? '';
  nextTick(() => titleEditInputRef.value?.focus());
}

// 确认标题编辑
function confirmTitleEdit() {
  const target = titleEditTarget.value;
  if (!target || !titleEditValue.value.trim()) {
    titleEditTarget.value = null;
    return;
  }
  store.updateRetryImageTitle(target, titleEditValue.value.trim());
  toastr.success(`标题已更新为「${titleEditValue.value.trim()}」`);
  if (previewItem.value?.tempId === target) {
    previewItem.value.title = titleEditValue.value.trim();
  }
  titleEditTarget.value = null;
}

// 替换图片
function onReplaceFile(event: Event, tempId: string) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = e => {
    const base64 = e.target?.result as string;
    if (base64) {
      store.replaceRetryImageData(tempId, base64);
      toastr.success('图片已替换');
    }
  };
  reader.onerror = () => toastr.error('图片读取失败');
  reader.readAsDataURL(file);
  input.value = '';
}

// 导入网络图片
async function onUrlImport(event: Event, tempId: string) {
  const input = event.target as HTMLInputElement;
  const url = input.value.trim();
  if (!url) return;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('网络错误');
    const blob = await resp.blob();
    const reader = new FileReader();
    reader.onload = e => {
      const base64 = e.target?.result as string;
      if (base64) {
        store.replaceRetryImageData(tempId, base64);
        toastr.success('网络图片已导入');
      }
    };
    reader.onerror = () => toastr.error('图片读取失败');
    reader.readAsDataURL(blob);
    input.value = '';
  } catch {
    toastr.error('网络图片获取失败，请检查 URL');
  }
}
</script>

<style scoped>
/* ====== 外层容器 ====== */
.retry-overlay {
  position: absolute;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

/* ====== 黑色遮罩 ====== */
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
  transition: background 0.2s, border-color 0.2s;
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
  transition: color 0.2s, border-color 0.2s;
  margin-bottom: -1px;
}

.mode-tab:hover { color: var(--theme-text-main, var(--vn-fg)); }
.mode-tab.active { color: var(--theme-accent, var(--rust)); border-bottom-color: var(--theme-accent, var(--rust)); }

/* ====== 提示词输入区 ====== */
.prompt-section {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid rgba(196, 162, 101, 0.1);
  flex-shrink: 0;
}

.prompt-block { display: flex; flex-direction: column; gap: 6px; }

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
  transition: border-color 0.2s, opacity 0.2s;
  font-family: inherit;
}

.prompt-input:focus { border-color: rgba(196, 162, 101, 0.55); }
.prompt-input::placeholder { color: var(--theme-text-muted, var(--vn-muted)); }
.prompt-input.is-inactive { opacity: 0.35; cursor: not-allowed; }

/* ====== 按钮行 ====== */
.prompt-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-spacer { flex: 1; }

/* ====== 相册按钮 ====== */
.album-btn {
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
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  user-select: none;
  position: relative;
}

.album-btn:hover {
  background: rgba(42, 36, 32, 0.9);
  border-color: rgba(196, 162, 101, 0.5);
  color: var(--theme-text-main, var(--vn-fg));
}

.album-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: var(--theme-accent, var(--rust));
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
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
  transition: background 0.2s, border-color 0.2s, opacity 0.2s;
}

.gen-btn:hover:not(:disabled) {
  background: rgba(139, 69, 19, 0.95);
  border-color: var(--theme-accent, var(--rust));
}

.gen-btn:disabled { opacity: 0.45; cursor: not-allowed; }

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
  transition: background 0.2s, border-color 0.2s, color 0.2s;
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
.preview-section { padding: 14px 20px; flex: 1; min-height: 0; }

.section-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--theme-text-muted, var(--vn-muted));
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 10px;
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
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  cursor: default;
  background: rgba(42, 36, 32, 0.5);
}

.preview-item.is-done { cursor: pointer; }
.preview-item.is-done:hover { border-color: rgba(196, 162, 101, 0.5); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4); }
.preview-item.is-selected { border-color: var(--theme-accent, var(--rust)) !important; transform: translateY(-5px) !important; box-shadow: 0 10px 30px rgba(139, 69, 19, 0.55) !important; }

/* 铅笔按钮 */
.edit-title-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 3;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(196, 162, 101, 0.4);
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
}

.preview-item:hover .edit-title-btn { opacity: 1; }
.edit-title-btn:hover { background: rgba(139, 69, 19, 0.8); }

.preview-img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* 长按预览图标 */
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
}

.select-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.preview-item.is-selected .select-overlay { opacity: 1; }

.select-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--theme-accent, var(--rust));
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 标题标签 */
.title-tag {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.7rem;
  padding: 10px 6px 4px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 生成中 / 失败占位 */
.gen-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 6px;
  color: var(--theme-text-muted, var(--vn-muted));
  font-size: 0.78rem;
}

.error-placeholder { color: rgba(220, 80, 80, 0.8); }

.gen-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(196, 162, 101, 0.2);
  border-top-color: var(--theme-accent, var(--rust));
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ====== 底部确认栏 ====== */
.retry-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid rgba(196, 162, 101, 0.1);
  flex-shrink: 0;
}

.clear-btn {
  padding: 7px 16px;
  background: transparent;
  border: 1px solid rgba(196, 162, 101, 0.3);
  border-radius: 6px;
  color: var(--theme-text-muted, var(--vn-muted));
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.clear-btn:hover { background: rgba(196, 162, 101, 0.1); color: var(--theme-text-main, var(--vn-fg)); }

.selected-info { font-size: 0.82rem; color: var(--theme-text-muted, var(--vn-muted)); }

.confirm-btn {
  padding: 7px 20px;
  background: var(--theme-accent-soft, rgba(139, 69, 19, 0.7));
  border: 1px solid rgba(196, 162, 101, 0.45);
  border-radius: 6px;
  color: var(--paper-light);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.confirm-btn:hover:not(:disabled) { background: rgba(139, 69, 19, 0.95); border-color: var(--theme-accent, var(--rust)); }
.confirm-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* ====== 大图预览 ====== */
.preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.preview-panel {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-full-img {
  max-width: 100%;
  max-height: calc(90vh - 60px);
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.preview-edit-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-edit-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.2s;
}
.preview-edit-btn:hover { background: rgba(255, 255, 255, 0.2); }

.url-input {
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.82rem;
  outline: none;
  width: 220px;
}
.url-input::placeholder { color: rgba(255, 255, 255, 0.4); }
.url-input:focus { border-color: rgba(196, 162, 101, 0.6); }

.preview-close {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.preview-close:hover { background: rgba(139, 69, 19, 0.7); }

.preview-fade-enter-active, .preview-fade-leave-active { transition: opacity 0.2s; }
.preview-fade-enter-from, .preview-fade-leave-to { opacity: 0; }

/* ====== 标题编辑弹窗 ====== */
.edit-title-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.edit-title-panel {
  background: var(--vn-panel-bg);
  border: 1px solid rgba(196, 162, 101, 0.35);
  border-radius: 10px;
  width: 340px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.edit-title-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(196, 162, 101, 0.15);
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--theme-text-main, var(--vn-fg));
}

.edit-title-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-title-input {
  width: 100%;
  box-sizing: border-box;
  background: rgba(42, 36, 32, 0.5);
  border: 1px solid rgba(196, 162, 101, 0.3);
  border-radius: 6px;
  color: var(--theme-text-main, var(--vn-fg));
  font-size: 0.9rem;
  padding: 8px 10px;
  outline: none;
}
.edit-title-input:focus { border-color: rgba(196, 162, 101, 0.6); }

.edit-title-hint {
  font-size: 0.72rem;
  color: var(--theme-text-muted, var(--vn-muted));
  line-height: 1.5;
}

.edit-title-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid rgba(196, 162, 101, 0.1);
}

.cancel-btn {
  padding: 6px 16px;
  background: transparent;
  border: 1px solid rgba(196, 162, 101, 0.3);
  border-radius: 5px;
  color: var(--theme-text-muted, var(--vn-muted));
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.2s;
}
.cancel-btn:hover { background: rgba(196, 162, 101, 0.1); }

.confirm-title-btn {
  padding: 6px 18px;
  background: var(--theme-accent-soft, rgba(139, 69, 19, 0.7));
  border: 1px solid rgba(196, 162, 101, 0.4);
  border-radius: 5px;
  color: var(--paper-light);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.confirm-title-btn:hover { background: rgba(139, 69, 19, 0.95); }

.panel-fade-enter-active, .panel-fade-leave-active { transition: opacity 0.2s; }
.panel-fade-enter-from, .panel-fade-leave-to { opacity: 0; }
</style>
