<template>
  <!-- 刘海入口按钮（折叠态） -->
  <div
    v-if="settingsStore.settings.achievementListEnabled"
    data-ui="achievement-notch"
    class="achievement-notch"
    :class="{ 'is-open': expanded }"
  >
    <div class="achievement-notch__shell">
      <!-- 展开面板 -->
      <div class="achievement-notch__panel">
        <div class="achievement-notch__content">
          <!-- 面板头部 -->
          <div class="notch-header">
            <div class="notch-stage-name">{{ currentStageName }}</div>
            <div class="notch-progress-wrapper">
              <div class="notch-progress-bar">
                <div class="notch-progress-fill" :style="{ width: `${Math.min(worldCollapseDegree, 100)}%` }"></div>
              </div>
              <span class="notch-progress-text">{{ worldCollapseDegree }} / 100</span>
            </div>
          </div>

          <!-- 成就列表 -->
          <div class="notch-achievement-list">
            <div v-if="currentPageAchievements.length === 0" class="notch-empty">当前角色暂无成就</div>
            <div
              v-for="achievement in currentPageAchievements"
              :key="achievement.name"
              class="notch-achievement-item"
              :class="{
                'is-completed': isCompleted(achievement.name),
                'is-in-progress': isInProgress(achievement.name),
              }"
            >
              <div class="notch-achievement-label">
                <div class="notch-achievement-content">
                  <div class="notch-achievement-name">{{ achievement.name }}</div>
                  <div v-if="settingsStore.settings.achievementShowCondition" class="notch-achievement-desc">
                    {{ achievement.condition }}
                  </div>
                </div>

                <!-- 三态按钮：角色成就走三次点击，普通成就直接勾选 -->
                <button
                  type="button"
                  class="notch-state-btn"
                  :class="{
                    'is-done': isCompleted(achievement.name),
                    'is-pending': !isCompleted(achievement.name) && !isInProgress(achievement.name),
                    'is-loading': isInProgress(achievement.name),
                  }"
                  :aria-label="getButtonLabel(achievement)"
                  @click="handleAchievementClick(achievement)"
                >
                  <!-- 加载中：显示 svg 小球 -->
                  <svg
                    v-if="isInProgress(achievement.name) && !isCompleted(achievement.name)"
                    class="loading-balls"
                    viewBox="0 0 1024 1024"
                    width="16"
                    height="16"
                  >
                    <circle cx="100" cy="512" r="20" />
                    <circle cx="200" cy="300" r="15" />
                    <circle cx="300" cy="200" r="25" />
                    <circle cx="512" cy="150" r="30" />
                    <circle cx="724" cy="200" r="25" />
                    <circle cx="824" cy="300" r="15" />
                    <circle cx="924" cy="512" r="20" />
                  </svg>
                  <!-- 已完成：显示勾选 -->
                  <svg
                    v-else-if="isCompleted(achievement.name)"
                    class="check-icon"
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <!-- 未选中（线框） -->
                  <svg v-else class="empty-icon" viewBox="0 0 24 24" width="14" height="14" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 翻页控制 -->
          <div v-if="totalPages > 1" class="notch-pagination">
            <!-- 扩大点击区域：左半边 -->
            <div class="notch-pagination-zone notch-pagination-zone--prev" @click="currentPage > 0 && currentPage--" />
            <!-- 扩大点击区域：右半边 -->
            <div
              class="notch-pagination-zone notch-pagination-zone--next"
              @click="currentPage < totalPages - 1 && currentPage++"
            />

            <button
              class="notch-page-btn notch-page-prev"
              :disabled="currentPage === 0"
              aria-label="上一页"
              @click="currentPage--"
            >
              <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
                <path
                  d="M7 1L2 5L7 9"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <div class="notch-page-dots">
              <span
                v-for="i in totalPages"
                :key="i"
                class="notch-dot"
                :class="{ 'is-active': i - 1 === currentPage }"
              />
            </div>
            <button
              class="notch-page-btn notch-page-next"
              :disabled="currentPage >= totalPages - 1"
              aria-label="下一页"
              @click="currentPage++"
            >
              <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
                <path
                  d="M1 1L6 5L1 9"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 刘海按钮 -->
      <button
        type="button"
        class="achievement-notch__toggle"
        :aria-expanded="expanded"
        aria-label="展开"
        @click="toggleExpand"
      >
        <span class="notch-arrow"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLatestMvuStore } from '../../latestMvuStore';
import { useVNStore } from '../../store';

interface Achievement {
  name: string;
  condition: string;
  description?: string;
  stage?: number;
  character?: string;
}

interface StageDef {
  id: number;
  name: string;
  threshold: number;
}

interface AchievementConfig {
  stages: StageDef[];
  achievements: Achievement[];
}

const settingsStore = useVNStore();
const latestMvu = useLatestMvuStore();
latestMvu.startAutoSync();
const expanded = ref(false);
const loading = ref(false);
const config = ref<AchievementConfig | null>(null);
const worldCollapseDegree = ref(0);
const completedNames = ref<string[]>([]);
const inProgressNames = ref<string[]>([]);
const activeCharacterNames = ref<string[]>([]);
const currentPage = ref(0);

// 每页显示数量（从设置读取，默认 5）
const pageSize = computed(() => settingsStore.settings.achievementPageSize || 5);

// 计算当前阶段
const currentStageName = computed(() => {
  if (!config.value) return '--';
  const stages = config.value.stages;
  const deg = worldCollapseDegree.value;
  let current = stages[0];
  for (const s of stages) {
    if (deg >= s.threshold) current = s;
    else break;
  }
  return current?.name ?? '--';
});

// 根据崩坏阶段计算当前阶段 ID
const currentStageId = computed(() => {
  if (!config.value) return 1;
  const stages = config.value.stages;
  const deg = worldCollapseDegree.value;
  let id = 1;
  for (const s of stages) {
    if (deg >= s.threshold) id = s.id;
    else break;
  }
  return id;
});

// 根据崩坏阶段和角色名筛选成就
// stage 和 character 都是可选的，但至少要有其中一个才能显示
const filteredAchievements = computed(() => {
  if (!config.value) return [];
  const names = activeCharacterNames.value.map(n => n.trim().toLowerCase());
  const stageId = currentStageId.value;
  return config.value.achievements.filter(a => {
    const hasStage = a.stage !== undefined && a.stage !== null;
    const hasCharacter = !!a.character?.trim();
    // 两者都没有 → 不显示
    if (!hasStage && !hasCharacter) return false;
    // 只有 stage → 仅显示属于当前阶段的成就
    if (hasStage && !hasCharacter) return a.stage! === stageId;
    // 只有 character → 角色名匹配即显示
    if (!hasStage && hasCharacter) {
      const chars = a.character!.split('/').map((c: string) => c.trim().toLowerCase());
      return chars.some((c: string) => names.includes(c));
    }
    // 两者都有 → 仅显示属于当前阶段且角色匹配的成就
    const chars = a.character!.split('/').map((c: string) => c.trim().toLowerCase());
    return a.stage! === stageId && chars.some((c: string) => names.includes(c));
  });
});

// 总页数
const totalPages = computed(() => Math.max(1, Math.ceil(filteredAchievements.value.length / pageSize.value)));

// 当前页的成就
const currentPageAchievements = computed(() => {
  const start = currentPage.value * pageSize.value;
  return filteredAchievements.value.slice(start, start + pageSize.value);
});

function isCompleted(name: string): boolean {
  return completedNames.value.includes(name);
}

function isInProgress(name: string): boolean {
  return inProgressNames.value.includes(name);
}

function getButtonLabel(achievement: Achievement): string {
  if (isCompleted(achievement.name)) return '已完成';
  if (isInProgress(achievement.name)) return '进行中…';
  return achievement.character ? '点击开始（进行中 → 已完成）' : '点击标记完成';
}

function toggleExpand() {
  expanded.value = !expanded.value;
}

async function loadData() {
  loading.value = true;
  try {
    // 读取世界书配置：遍历当前角色/聊天绑定的所有世界书，查找条目名为"成就列表"的条目
    const worldbookNames = settingsStore.getAllCurrentWorldbookNames();
    let configEntryContent: string | null = null;
    for (const wbName of worldbookNames) {
      try {
        const entries = await getWorldbook(wbName);
        const entry = entries.find(e => e.name === '成就列表');
        if (entry?.content) {
          configEntryContent = entry.content;
          break;
        }
      } catch {
        /* ignore */
      }
    }
    if (configEntryContent) {
      const match = configEntryContent.match(/<!-- ACHIEVEMENTS_CONFIG -->([\s\S]*)/);
      if (match) {
        const jsonStr = match[1].trim();
        config.value = JSON.parse(jsonStr) as AchievementConfig;
      }
    } else {
      console.warn('[AchievementNotch] 未找到条目名为"成就列表"的世界书条目');
    }

    // 读取 latest MVU stat_data
    const stat = latestMvu.statData;
    worldCollapseDegree.value = Number(_.get(stat, '世界崩坏程度', 0)) || 0;
    const done = (_.get(stat, '成就.已完成', []) as string[]).filter((n: unknown) => typeof n === 'string');
    const inProg = (_.get(stat, '成就.进行中', []) as string[]).filter((n: unknown) => typeof n === 'string');
    completedNames.value = Array.isArray(done) ? done : [];
    inProgressNames.value = Array.isArray(inProg) ? inProg : [];

    // 从当前聊天消息中提取角色名
    await loadActiveCharacterNames();
  } catch (e) {
    console.error('[AchievementNotch] 加载数据失败:', e);
  } finally {
    loading.value = false;
  }
}

async function loadActiveCharacterNames() {
  try {
    const messages = getChatMessages('latest');
    if (!messages || messages.length === 0) {
      activeCharacterNames.value = [];
      return;
    }
    const nameSet = new Set<string>();
    for (const msg of messages) {
      const text = msg.message || '';
      // 匹配 **角色名:** 或 **角色名：** 格式
      const matches = text.matchAll(/\*\*(.+?)\*\*[：:]\s*/g);
      for (const m of matches) {
        const name = m[1]?.trim();
        if (name) nameSet.add(name);
      }
    }
    activeCharacterNames.value = Array.from(nameSet);
    console.info('[AchievementNotch] 检测到角色名:', activeCharacterNames.value);
  } catch (e) {
    console.error('[AchievementNotch] 加载角色名失败:', e);
    activeCharacterNames.value = [];
  }
}

/**
 * 处理成就点击
 * - 有 character 字段的角色成就：三态循环（线框 → 进行中 → 已完成）
 * - 普通成就：直接标记完成
 */
function handleAchievementClick(achievement: Achievement) {
  const name = achievement.name;
  const hasCharacter = !!achievement.character?.trim();

  if (hasCharacter) {
    // 角色成就：三态
    if (isCompleted(name)) {
      // 已完成 → 取消完成（从 both 进行中和已完成 中都移除）
      syncBothArrays(name, 'remove');
    } else if (isInProgress(name)) {
      // 进行中 → 已完成
      syncBothArrays(name, 'complete');
    } else {
      // 线框 → 进行中
      syncBothArrays(name, 'start');
    }
  } else {
    // 普通成就：直接完成（切换勾选状态）
    syncCompletedArray(name, isCompleted(name) ? 'remove' : 'add');
  }
}

/**
 * 同步 completedNames 和 inProgressNames 到酒馆变量
 * @param action 'start' | 'complete' | 'remove'
 */
function syncBothArrays(name: string, action: 'start' | 'complete' | 'remove') {
  latestMvu.patch(statData => {
    let done = (_.get(statData, '成就.已完成', []) as string[]).filter((n: unknown) => typeof n === 'string');
    let inProg = (_.get(statData, '成就.进行中', []) as string[]).filter((n: unknown) => typeof n === 'string');

    if (action === 'start') {
      if (!inProg.includes(name)) inProg.push(name);
      done = done.filter(n => n !== name);
    } else if (action === 'complete') {
      inProg = inProg.filter(n => n !== name);
      if (!done.includes(name)) done.push(name);
    } else if (action === 'remove') {
      done = done.filter(n => n !== name);
      inProg = inProg.filter(n => n !== name);
    }

    _.set(statData, '成就', { 进行中: inProg, 已完成: done });

    inProgressNames.value = inProg;
    completedNames.value = done;
  });

  if (action === 'start') {
    console.info(`[AchievementNotch] 成就开始: ${name}`);
    settingsStore.showToast(`成就进行中「${name}」`);
  } else if (action === 'complete') {
    console.info(`[AchievementNotch] 成就完成: ${name}`);
    settingsStore.showToast(`成就达成「${name}」`);
  } else {
    console.info(`[AchievementNotch] 成就取消: ${name}`);
  }
}

/**
 * 同步已完成数组（普通成就用）
 */
function syncCompletedArray(name: string, action: 'add' | 'remove') {
  latestMvu.patch(statData => {
    let done = (_.get(statData, '成就.已完成', []) as string[]).filter((n: unknown) => typeof n === 'string');

    if (action === 'add') {
      if (!done.includes(name)) done.push(name);
    } else {
      done = done.filter(n => n !== name);
    }

    const inProg = (_.get(statData, '成就.进行中', []) as string[]).filter((n: unknown) => typeof n === 'string');
    _.set(statData, '成就', { 进行中: inProg, 已完成: done });

    completedNames.value = done;
  });

  if (action === 'add') {
    console.info(`[AchievementNotch] 普通成就完成: ${name}`);
    settingsStore.showToast(`成就达成「${name}」`);
  } else {
    console.info(`[AchievementNotch] 普通成就取消: ${name}`);
  }
}

const pollTimer: ReturnType<typeof setInterval> | null = null;

function startPolling() {
  // polling removed; MVU event auto sync via latestMvu
}

function stopPolling() {
  // polling removed; MVU event auto sync via latestMvu
}

function refreshFromLatest() {
  const stat = latestMvu.statData;
  const deg = Number(_.get(stat, '世界崩坏程度', 0)) || 0;
  const done = (_.get(stat, '成就.已完成', []) as string[]).filter((n: unknown) => typeof n === 'string');
  const inProg = (_.get(stat, '成就.进行中', []) as string[]).filter((n: unknown) => typeof n === 'string');

  loadActiveCharacterNames();

  if (
    deg !== worldCollapseDegree.value ||
    JSON.stringify(done) !== JSON.stringify(completedNames.value) ||
    JSON.stringify(inProg) !== JSON.stringify(inProgressNames.value)
  ) {
    worldCollapseDegree.value = deg;
    completedNames.value = done;
    inProgressNames.value = inProg;
  }
}

watch(expanded, val => {
  if (val) {
    currentPage.value = 0;
    loadData();
    refreshFromLatest();
  }
});

watch(
  () => latestMvu.lastUpdatedAt,
  () => {
    if (!settingsStore.settings.achievementListEnabled) return;
    refreshFromLatest();
  },
  { immediate: true },
);

onMounted(() => {
  if (settingsStore.settings.achievementListEnabled) {
    loadData();
    refreshFromLatest();
  }
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.achievement-notch {
  --toggle-width: 100px;
  --toggle-height: 28px;
  --panel-width: 340px;
  --panel-height: 260px;

  --notch-bg: var(--vn-panel-bg, rgba(42, 36, 32, 0.97));
  --text-color: var(--vn-fg, var(--theme-text-main, rgba(212, 197, 160, 0.92)));
  --muted-color: var(--vn-muted, var(--theme-text-muted, rgba(139, 125, 107, 0.7)));
  --border-color: rgba(90, 79, 64, 0.5);
  --progress-bg: rgba(255, 255, 255, 0.08);
  --progress-fill: var(--stain, rgba(139, 69, 19, 0.85));
  --success-color: var(--vn-success, rgba(90, 122, 74, 0.85));

  --toggle-radius: 0 0 16px 16px;

  --anim: 0.35s cubic-bezier(0.22, 1, 0.36, 1);

  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;

  width: var(--panel-width);
  overflow: visible;
}

/* 负责裁切和高度动画 */
.achievement-notch__shell {
  position: relative;
  width: 100%;
  height: var(--toggle-height);
  overflow: hidden;
  transition: height var(--anim);
}

.achievement-notch.is-open .achievement-notch__shell {
  height: calc(var(--panel-height) + var(--toggle-height));
}

/* 面板 */
.achievement-notch__panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: var(--panel-height);

  background: var(--notch-bg);
  border: 1px solid var(--border-color);
  border-top: none;
  color: var(--text-color);

  box-sizing: border-box;

  transform: translateY(calc(-1 * var(--panel-height)));
  transition:
    transform var(--anim),
    opacity var(--anim);
  opacity: 0;
}

.achievement-notch.is-open .achievement-notch__panel {
  transform: translateY(0);
  opacity: 1;
}

/* 内容 */
.achievement-notch__content {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 面板头部 */
.notch-header {
  padding: 10px 12px 8px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.notch-stage-name {
  text-align: center;
  font-size: 0.72rem;
  font-weight: bold;
  color: var(--text-color);
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.notch-progress-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notch-progress-bar {
  flex: 1;
  height: 5px;
  background: var(--progress-bg);
  border-radius: 3px;
  overflow: hidden;
}

.notch-progress-fill {
  height: 100%;
  background: var(--progress-fill);
  border-radius: 3px;
  transition: width var(--anim);
}

.notch-progress-text {
  font-size: 0.62rem;
  color: var(--muted-color);
  min-width: 45px;
  text-align: right;
}

/* 成就列表 */
.notch-achievement-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notch-empty {
  text-align: center;
  padding: 12px;
  color: var(--muted-color);
  font-size: 0.68rem;
}

.notch-achievement-item {
  border: 1px solid var(--theme-achievement-item-border, rgba(90, 79, 64, 0.3));
  border-radius: 2px;
  background: var(--theme-achievement-item-bg, rgba(58, 51, 44, 0.8));
  transition: all 0.2s ease;
}

.notch-achievement-item:hover {
  background: var(--theme-achievement-item-bg-hover, rgba(212, 197, 160, 0.04));
}

.notch-achievement-item.is-completed {
  border-color: var(--theme-achievement-item-border-completed, rgba(60, 55, 48, 0.4));
  background: var(--theme-achievement-item-bg-completed, rgba(40, 35, 30, 0.3));
  opacity: 0.75;
}

.notch-achievement-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
}

.notch-achievement-content {
  flex: 1;
  min-width: 0;
}

.notch-achievement-name {
  font-size: 0.7rem;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 2px;
}

.notch-achievement-item.is-completed .notch-achievement-name {
  color: var(--muted-color);
}

.notch-achievement-item.is-in-progress .notch-achievement-name {
  color: var(--text-color);
}

.notch-achievement-desc {
  font-size: 0.65rem;
  color: var(--muted-color);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
}

.notch-achievement-item.is-completed .notch-achievement-desc {
  color: var(--theme-text-faint, rgba(139, 125, 107, 0.5));
}

/* 三态按钮 */
.notch-state-btn {
  appearance: none;
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.2s ease;
  position: relative;
}

/* 线框态 */
.notch-state-btn.is-pending {
  color: var(--muted-color);
}

.notch-state-btn.is-pending:hover {
  color: var(--text-color);
}

/* 加载态 */
.notch-state-btn.is-loading {
  color: var(--progress-fill);
}

.notch-state-btn.is-loading:hover {
  opacity: 0.8;
}

/* 完成态 */
.notch-state-btn.is-done {
  color: var(--progress-fill);
}

.notch-state-btn.is-done:hover {
  opacity: 0.8;
}

/* 加载小球动画 */
.loading-balls {
  animation: float-around 2s ease-in-out infinite;
}

.loading-balls circle {
  fill: var(--progress-fill);
  animation: pulse-opacity 1.5s ease-in-out infinite;
}

.loading-balls circle:nth-child(1) {
  animation-delay: 0s;
}
.loading-balls circle:nth-child(2) {
  animation-delay: 0.2s;
}
.loading-balls circle:nth-child(3) {
  animation-delay: 0.4s;
}
.loading-balls circle:nth-child(4) {
  animation-delay: 0.6s;
}
.loading-balls circle:nth-child(5) {
  animation-delay: 0.8s;
}
.loading-balls circle:nth-child(6) {
  animation-delay: 1s;
}
.loading-balls circle:nth-child(7) {
  animation-delay: 1.2s;
}

@keyframes pulse-opacity {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

@keyframes float-around {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

/* 翻页控制 */
.notch-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 8px 4px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
  position: relative;
}

/* 扩大翻页点击区域的透明覆盖层 */
.notch-pagination-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 1;
}

.notch-pagination-zone--prev {
  left: 0;
  width: 50%;
  cursor: pointer;
}

.notch-pagination-zone--next {
  right: 0;
  width: 50%;
  cursor: pointer;
}

.notch-page-btn {
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  border: none;
  padding: 2px 4px;
  cursor: pointer;
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  transition: opacity 0.2s;
}

.notch-page-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.notch-page-dots {
  display: flex;
  align-items: center;
  gap: 5px;
}

.notch-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--theme-text-faint, rgba(139, 125, 107, 0.4));
  transition: all 0.2s;
}

.notch-dot.is-active {
  background: var(--progress-fill);
  transform: scale(1.2);
}

/* 小屏幕适配：占据屏幕宽度减去边距 */
@media (max-width: 400px) {
  .achievement-notch {
    left: 8px;
    right: 8px;
    transform: none;
    width: auto;
  }

  .achievement-notch__panel {
    left: 0;
    right: 0;
    width: auto;
  }

  .achievement-notch__toggle {
    left: 50%;
    transform: translateX(-50%);
  }
}

/* 中等屏幕适配：限制最大宽度 */
@media (min-width: 401px) and (max-width: 500px) {
  .achievement-notch {
    width: min(var(--panel-width), calc(100vw - 40px));
  }
}

/* 刘海按钮 */
.achievement-notch__toggle {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  width: var(--toggle-width);
  height: var(--toggle-height);
  box-sizing: border-box;

  padding: 0;
  margin: 0;
  border: 1px solid var(--border-color);
  outline: none;

  appearance: none;
  -webkit-appearance: none;
  background: var(--notch-bg);
  border-radius: var(--toggle-radius);

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  cursor: pointer;
  user-select: none;

  transition: top var(--anim);
}

.achievement-notch.is-open .achievement-notch__toggle {
  top: var(--panel-height);
}

/* 小三角 */
.notch-arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 7px solid var(--text-color);
  transition: transform var(--anim);
}

.achievement-notch.is-open .notch-arrow {
  transform: rotate(180deg);
}
</style>
