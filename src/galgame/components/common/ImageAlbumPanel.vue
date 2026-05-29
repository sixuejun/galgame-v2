<template>
  <Transition name="panel-fade">
    <div v-if="albumPanelOpen" class="album-overlay">
      <div class="album-backdrop" @click.self="store.closeAlbumPanel()" />
      <div class="album-panel" role="dialog" aria-modal="true">
        <!-- 标题栏 -->
        <div class="album-header">
          <span class="album-title">图片相册</span>
          <div class="header-right">
            <span class="album-count">{{ bgItems.length + cgItems.length }} 张绑定图片</span>
            <button class="close-btn" title="关闭" @click="store.closeAlbumPanel()">✕</button>
          </div>
        </div>

        <!-- 标签页 -->
        <div class="album-tabs">
          <button class="album-tab" :class="{ active: activeTab === 'background' }" @click="activeTab = 'background'">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
              <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z" />
            </svg>
            背景 ({{ bgItems.length }})
          </button>
          <button class="album-tab" :class="{ active: activeTab === 'cg' }" @click="activeTab = 'cg'">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            CG ({{ cgItems.length }})
          </button>
        </div>

        <!-- 图片网格 -->
        <div class="album-content">
          <div v-if="currentItems.length === 0" class="album-empty">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor" class="empty-icon">
              <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z" />
            </svg>
            <p>暂无绑定的 {{ activeTab === 'background' ? '背景' : 'CG' }} 图片</p>
            <p class="empty-hint">从重新生成面板导入或编辑图片标题即可创建绑定</p>
          </div>

          <div v-else class="album-grid">
            <div
              v-for="item in currentItems"
              :key="item.title"
              class="album-card"
              @click="openPreview(item)"
            >
              <img :src="item.imageData" class="card-img" />
              <div class="card-overlay">
                <div class="card-title">{{ item.title }}</div>
                <div class="card-meta">
                  {{ item.type === 'background' ? '背景' : 'CG' }}
                  · {{ formatTime(item.timestamp) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 大图预览 -->
  <Transition name="preview-fade">
    <div v-if="previewItem" class="preview-overlay" @click.self="closePreview">
      <div class="preview-panel" @click.stop>
        <img :src="previewItem.imageData" class="preview-full-img" />

        <div class="preview-info">
          <div class="preview-title">{{ previewItem.title }}</div>
          <div class="preview-meta">
            {{ previewItem.type === 'background' ? '背景' : 'CG' }}
            · 绑定于 {{ formatTime(previewItem.timestamp) }}
          </div>
        </div>

        <!-- 操作栏 -->
        <div class="preview-actions">
          <!-- 编辑标题 -->
          <div class="action-row">
            <label class="action-label">标题</label>
            <input v-model="editTitle" class="action-input" placeholder="输入标题..." @keyup.enter="confirmEditTitle" />
            <button class="action-btn primary" @click="confirmEditTitle">保存</button>
          </div>

          <!-- 替换图片 -->
          <div class="action-row">
            <label class="action-label">替换</label>
            <label class="action-btn">
              本地文件
              <input type="file" accept="image/*" class="hidden-input" @change="onReplaceFile" />
            </label>
            <label class="action-btn">
              网络图片
              <input type="text" v-model="urlInput" class="action-input url" placeholder="粘贴 URL 后回车" @keyup.enter="onUrlImport" />
            </label>
          </div>

          <!-- 底部操作 -->
          <div class="action-row bottom">
            <button class="action-btn" @click="onInsertToQueue">插入卡牌队列</button>
            <button class="action-btn danger" @click="onDeleteBinding">删除绑定</button>
          </div>
        </div>

        <button class="preview-close" @click="closePreview">✕</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useVNStore } from '../../store';

const store = useVNStore();

const albumPanelOpen = computed(() => store.albumPanelOpen);
const activeTab = ref<'background' | 'cg'>('background');

const bgItems = computed(() => store.getBindingAlbum('background'));
const cgItems = computed(() => store.getBindingAlbum('cg'));
const currentItems = computed(() => (activeTab.value === 'background' ? bgItems.value : cgItems.value));

// 大图预览
interface AlbumItem {
  title: string;
  imageData: string;
  timestamp: number;
  type: 'background' | 'cg';
}
const previewItem = ref<AlbumItem | null>(null);
const editTitle = ref('');
const urlInput = ref('');

function openPreview(item: AlbumItem) {
  previewItem.value = item;
  editTitle.value = item.title;
  urlInput.value = '';
}

function closePreview() {
  previewItem.value = null;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// 编辑标题
function confirmEditTitle() {
  const item = previewItem.value;
  if (!item || !editTitle.value.trim()) return;
  const newTitle = editTitle.value.trim();

  if (newTitle === item.title) { closePreview(); return; }

  const bindings = store.getSceneBindings();
  const oldBinding = bindings[item.title];
  if (oldBinding) {
    // 重命名：新增新key，删除旧key
    store.bindSceneImage(newTitle, oldBinding.imageData, oldBinding.type);
    store.unbindSceneImage(item.title);
    toastr.success(`已重命名为「${newTitle}」`);
  }
  closePreview();
}

// 替换图片（本地）
function onReplaceFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = e => {
    const base64 = e.target?.result as string;
    if (!base64) return;
    const item = previewItem.value;
    if (!item) return;
    store.bindSceneImage(item.title, base64, item.type);
    toastr.success('图片已替换');
    // 刷新预览
    if (item) previewItem.value = { ...item, imageData: base64 };
  };
  reader.onerror = () => toastr.error('图片读取失败');
  reader.readAsDataURL(file);
  input.value = '';
}

// 替换图片（网络）
async function onUrlImport() {
  const url = urlInput.value.trim();
  if (!url) return;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('network');
    const blob = await resp.blob();
    const reader = new FileReader();
    reader.onload = e => {
      const base64 = e.target?.result as string;
      if (!base64) return;
      const item = previewItem.value;
      if (!item) return;
      store.bindSceneImage(item.title, base64, item.type);
      if (item) previewItem.value = { ...item, imageData: base64 };
      toastr.success('网络图片已导入');
    };
    reader.onerror = () => toastr.error('图片读取失败');
    reader.readAsDataURL(blob);
    urlInput.value = '';
  } catch {
    toastr.error('网络图片获取失败，请检查 URL');
  }
}

// 插入卡牌队列
function onInsertToQueue() {
  const item = previewItem.value;
  if (!item) return;
  const ok = store.insertBindingToQueue(item.title);
  if (ok) {
    toastr.success(`「${item.title}」已插入卡牌队列`);
    closePreview();
  } else {
    toastr.warning(`「${item.title}」已在卡牌队列中`);
  }
}

// 删除绑定
function onDeleteBinding() {
  const item = previewItem.value;
  if (!item) return;
  store.unbindSceneImage(item.title);
  toastr.success(`「${item.title}」绑定已删除`);
  closePreview();
}
</script>

<style scoped>
/* ====== 遮罩 ====== */
.album-overlay {
  position: absolute;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.album-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(42, 36, 32, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* ====== 弹窗主体 ====== */
.album-panel {
  position: relative;
  z-index: 1;
  background: var(--vn-panel-bg);
  border: 1px solid rgba(196, 162, 101, 0.3);
  border-radius: 12px;
  width: min(100%, 780px);
  height: min(100%, 600px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

/* ====== 标题栏 ====== */
.album-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(196, 162, 101, 0.15);
  flex-shrink: 0;
}

.album-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--theme-text-main, var(--vn-fg));
  letter-spacing: 0.05em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.album-count {
  font-size: 0.78rem;
  color: var(--theme-text-muted, var(--vn-muted));
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

/* ====== 标签页 ====== */
.album-tabs {
  display: flex;
  padding: 0 20px;
  border-bottom: 1px solid rgba(196, 162, 101, 0.12);
  flex-shrink: 0;
}

.album-tab {
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

.album-tab:hover { color: var(--theme-text-main, var(--vn-fg)); }
.album-tab.active { color: var(--theme-accent, var(--rust)); border-bottom-color: var(--theme-accent, var(--rust)); }

/* ====== 内容区 ====== */
.album-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

/* 空状态 */
.album-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  color: var(--theme-text-muted, var(--vn-muted));
  text-align: center;
  gap: 8px;
}

.empty-icon { opacity: 0.3; }

.album-empty p { margin: 0; font-size: 0.9rem; }
.empty-hint { font-size: 0.78rem !important; opacity: 0.7; }

/* ====== 图片网格 ====== */
.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.album-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(196, 162, 101, 0.2);
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
  background: rgba(42, 36, 32, 0.4);
  aspect-ratio: 16 / 10;
}

.album-card:hover {
  transform: translateY(-3px);
  border-color: rgba(196, 162, 101, 0.5);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 40%, rgba(0, 0, 0, 0.75));
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.album-card:hover .card-overlay { opacity: 1; }

.card-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.65);
  margin-top: 2px;
}

/* ====== 大图预览 ====== */
.preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.preview-panel {
  position: relative;
  background: var(--vn-panel-bg);
  border: 1px solid rgba(196, 162, 101, 0.3);
  border-radius: 12px;
  width: min(100%, 680px);
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

.preview-full-img {
  width: 100%;
  max-height: 380px;
  object-fit: contain;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
}

.preview-info {
  border-bottom: 1px solid rgba(196, 162, 101, 0.12);
  padding-bottom: 12px;
}

.preview-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--theme-text-main, var(--vn-fg));
}

.preview-meta {
  font-size: 0.75rem;
  color: var(--theme-text-muted, var(--vn-muted));
  margin-top: 4px;
}

/* 操作栏 */
.preview-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.action-row.bottom {
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid rgba(196, 162, 101, 0.1);
}

.action-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--theme-text-muted, var(--vn-muted));
  min-width: 36px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.action-input {
  flex: 1;
  min-width: 120px;
  padding: 6px 10px;
  background: rgba(42, 36, 32, 0.5);
  border: 1px solid rgba(196, 162, 101, 0.25);
  border-radius: 6px;
  color: var(--theme-text-main, var(--vn-fg));
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s;
}

.action-input:focus { border-color: rgba(196, 162, 101, 0.55); }
.action-input::placeholder { color: var(--theme-text-muted, var(--vn-muted)); }
.action-input.url { min-width: 200px; }

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: rgba(42, 36, 32, 0.6);
  border: 1px solid rgba(196, 162, 101, 0.3);
  border-radius: 6px;
  color: var(--theme-text-soft, var(--vn-muted));
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  white-space: nowrap;
}

.action-btn:hover {
  background: rgba(42, 36, 32, 0.9);
  border-color: rgba(196, 162, 101, 0.5);
  color: var(--theme-text-main, var(--vn-fg));
}

.action-btn.primary {
  background: var(--theme-accent-soft, rgba(139, 69, 19, 0.7));
  border-color: rgba(196, 162, 101, 0.4);
  color: var(--paper-light);
}

.action-btn.primary:hover {
  background: rgba(139, 69, 19, 0.95);
  border-color: var(--theme-accent, var(--rust));
}

.action-btn.danger { color: rgba(220, 80, 80, 0.8); border-color: rgba(220, 80, 80, 0.3); }
.action-btn.danger:hover { background: rgba(220, 80, 80, 0.15); border-color: rgba(220, 80, 80, 0.6); color: rgba(220, 80, 80, 1); }

.hidden-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.preview-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.preview-close:hover { background: rgba(139, 69, 19, 0.7); }

/* ====== 动画 ====== */
.panel-fade-enter-active, .panel-fade-leave-active { transition: opacity 0.2s; }
.panel-fade-enter-from, .panel-fade-leave-to { opacity: 0; }

.preview-fade-enter-active, .preview-fade-leave-active { transition: opacity 0.2s; }
.preview-fade-enter-from, .preview-fade-leave-to { opacity: 0; }
</style>
