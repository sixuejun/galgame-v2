<template>
  <div class="image-gen-console" :class="{ collapsed: isCollapsed }">
    <!-- 收起时的触发按钮 -->
    <div v-if="isCollapsed" class="console-trigger" @click="isCollapsed = false">
      <i class="fa-solid fa-terminal" />
      <span>生图测试</span>
    </div>

    <!-- 展开时的控制台 -->
    <div v-else class="console-panel">
      <div class="console-header">
        <div class="console-title">
          <i class="fa-solid fa-terminal" />
          <span>生图测试控制台</span>
        </div>
        <div class="console-actions">
          <button class="btn-toggle" title="收起" @click="toggleExpand">
            <i class="fa-solid fa-chevron-down" />
          </button>
        </div>
      </div>

      <div class="console-body">
        <!-- 图片类型选择 -->
        <div class="form-row">
          <label class="form-label">图片类型</label>
          <div class="type-selector">
            <button class="type-btn" :class="{ active: imageType === 'background' }" @click="imageType = 'background'">
              <i class="fa-solid fa-image" />
              背景 (BG)
            </button>
            <button class="type-btn" :class="{ active: imageType === 'cg' }" @click="imageType = 'cg'">
              <i class="fa-solid fa-portrait" />
              CG
            </button>
          </div>
        </div>

        <!-- 标题输入 -->
        <div class="form-row">
          <label class="form-label">标题 (可选)</label>
          <input v-model="imageTitle" type="text" class="form-input" placeholder="如：教室黄昏、雨夜告白" />
        </div>

        <!-- 提示词输入 -->
        <div class="form-row">
          <label class="form-label">提示词</label>
          <textarea
            v-model="prompt"
            class="form-textarea"
            placeholder="输入英文提示词，如：sfw, 1girl, classroom, sunset, window light"
            rows="2"
          />
        </div>

        <!-- 操作按钮 -->
        <div class="form-row actions">
          <button :disabled="!prompt.trim()" class="btn-action btn-generate" @click="handleGenerateOnly">
            <i class="fa-solid fa-magic" />
            仅生成
          </button>
          <button :disabled="!prompt.trim()" class="btn-action btn-write" @click="handleWriteAndGenerate">
            <i class="fa-solid fa-pen" />
            写入消息并生成
          </button>
          <button class="btn-action btn-clear" @click="handleClear">
            <i class="fa-solid fa-trash" />
            清空
          </button>
        </div>

        <!-- 状态信息 -->
        <div v-if="generating" class="status-bar">
          <i class="fa-solid fa-spinner fa-spin" />
          <span>正在生成图片...</span>
        </div>
        <div v-else-if="lastResult" class="status-bar success">
          <i class="fa-solid fa-check" />
          <span>生成完成 ✓</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVNStore } from '../../store';

const store = useVNStore();

const isCollapsed = ref(true);
const imageType = ref<'background' | 'cg'>('background');
const imageTitle = ref('');
const prompt = ref('');
const generating = ref(false);
const lastResult = ref(false);

function toggleExpand() {
  isCollapsed.value = true;
}

/**
 * 完整模拟生图流程：
 * 1. 写入消息（模拟AI生成标签）
 * 2. 解析标签块
 * 3. 发送生图请求
 * 4. 图片生成后：先展示到舞台，再加入队列
 */
async function handleWriteAndGenerate() {
  if (!prompt.value.trim()) return;

  generating.value = true;
  lastResult.value = false;

  // 1. 构建图像标签块（格式与 messageParser 解析格式一致）
  // 格式：<background>...</background> 或 <image>...</image>
  // 注意：CG 类型使用 <image> 标签，而非 <cg>
  const titleStr = imageTitle.value.trim() ? `\ntitle###${imageTitle.value.trim()}###` : '';
  const tagName = imageType.value === 'background' ? 'background' : 'image';
  const tagBlock = `<${tagName}>${titleStr}\nimage###${prompt.value.trim()}###\n</${tagName}>`;

  try {
    // 2. 获取最新消息并写入标签
    // 使用 getChatMessages(-1) 获取最新楼层的消息
    const latestMessages = getChatMessages(-1);
    if (latestMessages.length > 0) {
      const latestMessage = latestMessages[0];
      const updatedMessage = latestMessage.message + '\n' + tagBlock;
      await setChatMessages([{ ...latestMessage, message: updatedMessage }]);
      console.info('[ImageGenConsole] 已写入标签到消息:', tagBlock);
    }

    // 3. 等待消息系统处理完成（短暂延迟确保消息已更新）
    await new Promise(resolve => setTimeout(resolve, 100));

    // 4. 调用 store 的完整处理流程（解析标签 → 检查重复 → 发送请求 → 响应处理 → 展示）
    const latestMsgs = getChatMessages(-1);
    if (latestMsgs.length > 0) {
      await store.reparseImageTagsFromMessage(latestMsgs[0].message_id);
    } else if (imageType.value === 'background') {
      store.requestBackgroundImage(prompt.value.trim(), imageTitle.value.trim() || undefined);
    } else {
      store.requestCgImage(prompt.value.trim(), imageTitle.value.trim() || undefined);
    }

    console.info('[ImageGenConsole] 生图请求已发送');
  } catch (e) {
    console.error('[ImageGenConsole] 流程执行失败:', e);
  } finally {
    // 模拟生成中状态
    setTimeout(() => {
      generating.value = false;
      lastResult.value = true;
      setTimeout(() => {
        lastResult.value = false;
      }, 3000);
    }, 1500);
  }
}

/**
 * 仅生图（不写入消息）
 */
async function handleGenerateOnly() {
  if (!prompt.value.trim()) return;

  generating.value = true;
  lastResult.value = false;

  try {
    if (imageType.value === 'background') {
      store.requestBackgroundImage(prompt.value.trim(), imageTitle.value.trim() || undefined);
    } else {
      store.requestCgImage(prompt.value.trim(), imageTitle.value.trim() || undefined);
    }
    console.info('[ImageGenConsole] 生图请求已发送');
  } catch (e) {
    console.error('[ImageGenConsole] 生成失败:', e);
  } finally {
    setTimeout(() => {
      generating.value = false;
      lastResult.value = true;
      setTimeout(() => {
        lastResult.value = false;
      }, 3000);
    }, 1500);
  }
}

function handleClear() {
  imageTitle.value = '';
  prompt.value = '';
  imageType.value = 'background';
}
</script>

<style scoped>
.image-gen-console {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  font-family: 'Consolas', 'Monaco', monospace;
}

/* 收起状态 */
.console-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(42, 36, 32, 0.95);
  border-top: 2px solid var(--theme-accent, var(--rust));
  color: var(--theme-text-soft, rgba(212, 197, 160, 0.8));
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: fit-content;
}

.console-trigger:hover {
  background: rgba(139, 69, 19, 0.3);
  color: rgba(212, 197, 160, 1);
}

/* 展开状态 */
.console-panel {
  background: rgba(30, 26, 22, 0.98);
  border-top: 2px solid var(--theme-accent, var(--rust));
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
}

.console-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(42, 36, 32, 0.8);
  border-bottom: 1px solid rgba(139, 69, 19, 0.3);
}

.console-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
  font-size: 12px;
  font-weight: bold;
}

.console-actions {
  display: flex;
  gap: 8px;
}

.btn-toggle {
  background: none;
  border: none;
  color: rgba(212, 197, 160, 0.6);
  cursor: pointer;
  padding: 4px 8px;
  font-size: 12px;
  transition: color 0.2s;
}

.btn-toggle:hover {
  color: rgba(212, 197, 160, 1);
}

.console-body {
  padding: 12px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.form-row.actions {
  justify-content: flex-start;
  gap: 8px;
  margin-top: 12px;
}

.form-label {
  min-width: 70px;
  color: rgba(139, 69, 19, 0.9);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input,
.form-textarea {
  flex: 1;
  background: rgba(20, 18, 15, 0.8);
  border: 1px solid rgba(139, 69, 19, 0.4);
  border-radius: 4px;
  padding: 6px 10px;
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
  font-family: inherit;
  font-size: 12px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--theme-accent, var(--rust));
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: rgba(212, 197, 160, 0.3);
}

.form-textarea {
  resize: vertical;
  min-height: 50px;
}

/* 类型选择器 */
.type-selector {
  display: flex;
  gap: 8px;
}

.type-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(20, 18, 15, 0.8);
  border: 1px solid rgba(139, 69, 19, 0.4);
  border-radius: 4px;
  color: rgba(212, 197, 160, 0.6);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn:hover {
  border-color: var(--theme-accent-soft, rgba(139, 69, 19, 0.7));
  color: var(--theme-text-soft, rgba(212, 197, 160, 0.8));
}

.type-btn.active {
  background: rgba(139, 69, 19, 0.3);
  border-color: var(--theme-accent, var(--rust));
  color: rgba(212, 197, 160, 1);
}

/* 操作按钮 */
.btn-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid;
  border-radius: 4px;
  font-family: inherit;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-generate {
  background: rgba(139, 69, 19, 0.3);
  border-color: var(--theme-accent, var(--rust));
  color: rgba(255, 248, 220, 0.95);
}

.btn-generate:hover:not(:disabled) {
  background: var(--theme-accent-soft, rgba(139, 69, 19, 0.5));
}

.btn-write {
  background: rgba(74, 64, 53, 0.3);
  border-color: var(--theme-accent-soft, rgba(139, 69, 19, 0.6));
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
}

.btn-write:hover:not(:disabled) {
  background: rgba(74, 64, 53, 0.5);
}

.btn-clear {
  background: transparent;
  border-color: rgba(139, 69, 19, 0.3);
  color: rgba(212, 197, 160, 0.5);
}

.btn-clear:hover {
  background: rgba(139, 69, 19, 0.2);
  border-color: var(--theme-accent-soft, rgba(139, 69, 19, 0.5));
  color: var(--theme-text-soft, rgba(212, 197, 160, 0.8));
}

/* 状态栏 */
.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(20, 18, 15, 0.8);
  border-radius: 4px;
  color: var(--theme-text-soft, rgba(212, 197, 160, 0.7));
  font-size: 11px;
}

.status-bar.success {
  color: rgba(100, 200, 100, 0.9);
}
</style>
