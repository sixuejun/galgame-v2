<template>
  <div class="absolute inset-0 flex items-center justify-center" style="z-index: 50">
    <div class="absolute inset-0 backdrop-blur-sm" style="background: rgba(42, 36, 32, 0.7)" @click="$emit('close')" />

    <div
      class="flex flex-col relative w-full max-w-2xl portrait:max-w-xs mx-2 sm:mx-4 border overflow-hidden animate-fade-in-up"
      :style="panelStyle"
    >
      <div :style="decoTop" />
      <div :style="decoTopThin" />

      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 gap-2" :style="headerBorder">
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
          <div v-if="!store.settings.portraitMode" class="stamp-effect shrink-0">
            <span style="color: var(--theme-accent, var(--rust)); font-size: 0.75rem; font-weight: bold; letter-spacing: 0.15em"
              >WORLDBOOK</span
            >
          </div>
          <h2 class="text-sm sm:text-lg font-bold tracking-widest truncate" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">世界书管理</h2>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <!-- Snapshot -->
          <button
            class="px-2 py-1 text-xs border cursor-pointer flex items-center gap-1"
            style="border-color: rgba(90, 79, 64, 0.4); border-radius: 2px; color: var(--theme-text-muted, var(--vn-muted))"
            :disabled="loading || entries.length === 0"
            :title="hasSnapshot ? '已保存快照，可用于恢复' : '保存当前世界书条目的启用状态为快照'"
            @click="createSnapshot"
          >
            <i class="fa-solid fa-camera" style="font-size: 0.65rem" />
            <span>快照</span>
            <span v-if="hasSnapshot" class="text-accent" style="color: var(--theme-accent, var(--rust)); font-size: 0.6rem">●</span>
          </button>
          <!-- Restore Snapshot -->
          <button
            v-if="hasSnapshot"
            class="px-2 py-1 text-xs border cursor-pointer flex items-center gap-1"
            style="border-color: rgba(90, 79, 64, 0.4); border-radius: 2px; color: var(--theme-text-muted, var(--vn-muted))"
            :disabled="loading"
            title="将所有世界书条目恢复到快照时的启用状态"
            @click="restoreSnapshot"
          >
            <i class="fa-solid fa-rotate-left" style="font-size: 0.65rem" />
            <span>恢复</span>
          </button>
          <!-- Export -->
          <button
            class="px-2 py-1 text-xs border cursor-pointer flex items-center gap-1"
            style="border-color: rgba(90, 79, 64, 0.4); border-radius: 2px; color: var(--theme-text-muted, var(--vn-muted))"
            :disabled="loading || entries.length === 0"
            title="导出当前增强配置为 JSON"
            @click="exportConfig"
          >
            <i class="fa-solid fa-file-export" style="font-size: 0.65rem" />
            <span>导出</span>
          </button>
          <!-- Import -->
          <button
            class="px-2 py-1 text-xs border cursor-pointer flex items-center gap-1"
            style="border-color: rgba(90, 79, 64, 0.4); border-radius: 2px; color: var(--theme-text-muted, var(--vn-muted))"
            :disabled="loading"
            title="从 JSON 文件导入增强配置"
            @click="triggerImport"
          >
            <i class="fa-solid fa-file-import" style="font-size: 0.65rem" />
            <span>导入</span>
          </button>
          <input ref="importInputRef" type="file" accept=".json" style="display: none" @change="onImportFile" />
          <!-- Refresh -->
          <button
            class="px-2 py-1 text-xs border cursor-pointer"
            style="border-color: rgba(90, 79, 64, 0.4); border-radius: 2px; color: var(--theme-text-muted, var(--vn-muted))"
            :disabled="loading"
            @click="loadEntries"
          >
            <i :class="loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate'" style="font-size: 0.65rem" />
          </button>
          <button
            class="w-8 h-8 flex items-center justify-center cursor-pointer"
            style="color: var(--theme-text-muted, var(--vn-muted))"
            @click="$emit('close')"
          >
            <i class="fa-solid fa-xmark" />
          </button>
        </div>
      </div>

      <!-- Info Banner -->
      <div
        class="px-4 py-2 border-bottom"
        :style="{ paddingLeft: store.settings.portraitMode ? '0.75rem' : '1.5rem', paddingRight: store.settings.portraitMode ? '0.75rem' : '1.5rem', borderBottom: '1px solid rgba(90,79,64,0.2)', background: 'rgba(139,69,19,0.1)' }"
      >
        <div class="text-xs leading-relaxed" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.8))">
          <i class="fa-solid fa-circle-info mr-1 sm:mr-2" style="color: var(--theme-accent, var(--rust))" />
          管理世界书条目的启用状态、关联功能和 API 分配。
          <span v-if="!store.settings.portraitMode">
            <strong style="color: var(--theme-text-main, rgba(212,197,160,0.9))">任务关联条目</strong>
            （弹幕/生图）会按「API 任务配置」自动路由，受对应功能开关控制；
            <strong style="color: var(--theme-text-main, rgba(212,197,160,0.9))">通用条目</strong>
            按"发送给"决定。
          </span>
        </div>
      </div>

      <!-- Content -->
      <div class="px-3 py-3 overflow-y-auto no-scrollbar" style="max-height: calc(100vh - 180px)">
        <!-- Loading -->
        <div v-if="loading" class="text-center py-8">
          <i class="fa-solid fa-spinner fa-spin text-2xl mb-3" style="color: rgba(90, 79, 64, 0.5)" />
          <p class="text-xs mt-2" style="color: var(--theme-text-muted, var(--vn-muted))">加载中…</p>
        </div>

        <!-- Empty -->
        <div v-else-if="entries.length === 0" class="text-center py-8">
          <i class="fa-solid fa-book-open text-4xl mb-3" style="color: rgba(90, 79, 64, 0.3)" />
          <p class="text-sm" style="color: var(--theme-text-muted, var(--vn-muted))">暂无世界书条目</p>
          <p class="text-xs mt-1" style="color: var(--theme-text-faint, rgba(139, 125, 107, 0.5))">
            请在酒馆中为当前角色绑定世界书，或添加全局世界书
          </p>
        </div>

        <div v-else class="space-y-3">
          <!-- Worldbook group header when multiple books -->
          <template v-for="(group, groupIdx) in entryGroups" :key="group.worldbookName">
            <div
              v-if="entryGroups.length > 1"
              class="px-2 py-1 text-xs font-bold"
              :style="{ color: 'var(--theme-accent, var(--rust))', borderBottom: '1px solid rgba(139,69,19,0.2)', marginBottom: '4px' }"
            >
              <i class="fa-solid fa-book mr-1" />
              {{ group.worldbookName }}
            </div>
            <div
              v-for="entry in group.entries"
              :key="`${group.worldbookName}-${entry.uid}`"
              class="p-4 border transition-all"
              :style="{
                borderColor: entry.enabled ? 'rgba(139,69,19,0.4)' : 'rgba(90,79,64,0.2)',
                background: entry.enabled ? 'rgba(139,69,19,0.05)' : 'transparent',
                opacity: entry.enabled ? 1 : 0.6,
              }"
            >
                <!-- Entry Header -->
              <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <span class="text-sm font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">
                      {{ entry.name || `条目 #${entry.uid}` }}
                    </span>
                    <span
                      v-if="entry.linkedFeature"
                      class="px-2 py-0.5 text-xs"
                      :style="{
                        background: getFeatureColor(entry.linkedFeature),
                        color: 'rgba(42,36,32,0.9)',
                        fontWeight: 'bold',
                      }"
                    >
                      {{ getFeatureLabel(entry.linkedFeature) }}
                    </span>
                  </div>
                  <p v-if="entry.content" class="text-xs truncate" style="color: var(--theme-text-muted, var(--vn-muted))">
                    {{ entry.content.slice(0, 80) }}{{ entry.content.length > 80 ? '…' : '' }}
                  </p>
                </div>
                <div class="flex items-center gap-2 sm:self-start">
                  <button
                    class="shrink-0 px-3 py-1.5 text-xs border transition-all"
                    :disabled="entry.updating"
                    :style="{
                      borderColor: entry.enabled ? 'var(--theme-accent, var(--rust))' : 'rgba(90,79,64,0.4)',
                      color: entry.enabled ? 'var(--theme-accent, var(--rust))' : 'var(--theme-text-muted, var(--vn-muted))',
                      fontWeight: entry.enabled ? 'bold' : 'normal',
                      opacity: entry.updating ? 0.5 : 1,
                    }"
                    :title="isTaskEntry(entry)
                      ? '此条目由 API 任务配置自动管理，设置变更后会自动更新路由'
                      : '手动开关'"
                    @click="toggleEntry(entry, group.worldbookName)"
                  >
                    {{ entry.updating ? '…' : entry.enabled ? '已启用' : '已禁用' }}
                  </button>
                </div>
              </div>

              <!-- Entry Controls -->
              <div :class="['grid gap-3', store.settings.portraitMode ? 'grid-cols-1' : 'grid-cols-2']">
                <!-- 实际发送目标（任务关联条目：实时计算；通用条目：回显 targetApi） -->
                <div>
                  <label class="block text-xs mb-1.5" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">
                    实际发送
                    <span
                      v-if="isTaskEntry(entry)"
                      class="ml-1"
                      style="color: var(--theme-text-faint, rgba(139, 125, 107, 0.5))"
                      title="由 API 任务配置自动决定，不受手动 targetApi 控制"
                    >(自动)</span>
                  </label>
                  <div
                    class="w-full px-2 py-1.5 text-xs border flex items-center"
                    :style="{
                      background: 'rgba(42,36,32,0.3)',
                      borderColor: 'rgba(90,79,64,0.3)',
                      color: 'var(--theme-text-main, rgba(212,197,160,0.9))',
                    }"
                  >
                    <span
                      class="inline-block w-2 h-2 mr-2"
                      :style="{ background: getActualTargetColor(resolveActualTarget(entry)) }"
                    />
                    {{ getActualTargetLabel(resolveActualTarget(entry)) }}
                  </div>
                </div>

                <!-- Linked Feature -->
                <div>
                  <label class="block text-xs mb-1.5" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">关联功能</label>
                  <select
                    :value="entry.linkedFeature || ''"
                    class="w-full px-2 py-1.5 text-xs border cursor-pointer"
                    :style="{
                      background: 'rgba(42,36,32,0.5)',
                      borderColor: 'rgba(90,79,64,0.4)',
                      color: 'var(--theme-text-main, rgba(212,197,160,0.9))',
                    }"
                    @change="
                      updateEntry(entry, group.worldbookName, {
                        linkedFeature: ($event.target as HTMLSelectElement).value || undefined,
                      })
                    "
                  >
                    <option value="">无</option>
                    <option value="universal">通用</option>
                    <option value="danmaku">弹幕</option>
                    <option value="imageGen">生图</option>
                  </select>
                </div>
              </div>

              <!-- 通用条目：手动 targetApi；任务关联条目：targetApi 被弱化 -->
              <div class="mt-3 pt-3 space-y-3" :style="{ borderTop: '1px solid rgba(90,79,64,0.15)' }">
                <!-- 通用条目的 targetApi 选择器（任务关联条目不显示：被弱化） -->
                <div v-if="!isTaskEntry(entry)">
                  <label class="block text-xs mb-1.5" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">发送给</label>
                  <select
                    :value="entry.targetApi"
                    class="w-full px-2 py-1.5 text-xs border cursor-pointer"
                    :style="{
                      background: 'rgba(42,36,32,0.5)',
                      borderColor: 'rgba(90,79,64,0.4)',
                      color: 'var(--theme-text-main, rgba(212,197,160,0.9))',
                    }"
                    @change="
                      updateEntry(entry, group.worldbookName, {
                        targetApi: ($event.target as HTMLSelectElement).value as any,
                      })
                    "
                  >
                    <option value="main">主 API</option>
                    <option value="second">第二 API</option>
                    <option value="both">两者都发送</option>
                  </select>
                </div>

                <!-- 任务关联条目显示说明 -->
                <div
                  v-if="isTaskEntry(entry)"
                  class="flex items-center gap-2 text-xs"
                  style="color: var(--theme-text-muted, var(--vn-muted))"
                >
                  <i class="fa-solid fa-circle-info" style="color: var(--theme-accent, var(--rust))" />
                  <span>
                    此条目关联到
                    <strong>{{ getFeatureLabel(entry.linkedFeature!) }}</strong>
                    任务，会根据「API 任务配置」自动路由到对应 API。
                    即使关掉对应功能开关，此条目也不会被发送。
                  </span>
                </div>

                <!-- 排除任务配置（可折叠） -->
                <div>
                  <button
                    class="flex items-center gap-2 text-xs w-full cursor-pointer transition-opacity hover:opacity-80"
                    style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))"
                    @click="toggleExcludeSection(entry)"
                  >
                    <i
                      :class="entry._excludeExpanded
                        ? 'fa-solid fa-chevron-down'
                        : 'fa-solid fa-chevron-right'"
                      style="font-size: 0.6rem"
                    />
                    <span>排除任务</span>
                    <span
                      v-if="entry.excludeFromTasks.length > 0"
                      class="px-1.5 py-0.5 text-xs"
                      style="background: rgba(139,69,19,0.3); color: var(--theme-accent, var(--rust))"
                    >
                      已排除 {{ entry.excludeFromTasks.length }} 个
                    </span>
                    <span
                      v-else
                      class="text-xs"
                      style="color: var(--theme-text-faint, rgba(139, 125, 107, 0.5))"
                    >
                      （点击展开）
                    </span>
                  </button>
                  <div v-show="entry._excludeExpanded" class="mt-2 flex flex-wrap gap-1.5">
                    <button
                      v-for="task in AVAILABLE_TASKS"
                      :key="task.id"
                      class="px-2 py-1 text-xs border transition-all"
                      :style="{
                        borderColor: isTaskExcluded(entry, task.id)
                          ? 'rgba(180,60,60,0.6)'
                          : 'rgba(90,79,64,0.3)',
                        background: isTaskExcluded(entry, task.id)
                          ? 'rgba(180,60,60,0.2)'
                          : 'rgba(42,36,32,0.3)',
                        color: isTaskExcluded(entry, task.id)
                          ? 'rgba(220,140,140,0.9)'
                          : 'var(--theme-text-muted, var(--vn-muted))',
                      }"
                      :title="isTaskExcluded(entry, task.id)
                        ? `点击取消排除「${task.label}」`
                        : `点击排除「${task.label}」`"
                      @click="
                        toggleTaskExclude(entry, group.worldbookName, task.id)
                      "
                    >
                      <i
                        :class="isTaskExcluded(entry, task.id)
                          ? 'fa-solid fa-ban mr-1'
                          : 'fa-solid fa-plus mr-1'"
                        style="font-size: 0.6rem"
                      />
                      {{ task.label }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div :style="decoBottomThin" />
      <div :style="decoBottom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVNStore } from '../../store';

defineEmits<{
  close: [];
}>();

interface EnhancedEntry {
  uid: number;
  name: string;
  enabled: boolean;
  content: string;
  targetApi: 'main' | 'second' | 'both';
  linkedFeature?: string;
  /** 排除的任务列表，这些任务调用时该条目不会被注入 */
  excludeFromTasks: string[];
  /** UI 状态：排除任务区域是否展开 */
  _excludeExpanded?: boolean;
  updating?: boolean;
}

interface EntryGroup {
  worldbookName: string;
  entries: EnhancedEntry[];
}

type ResolvedTarget = 'main' | 'second' | 'none' | 'both';

const loading = ref(false);
const entryGroups = ref<EntryGroup[]>([]);
const importInputRef = ref<HTMLInputElement>();
const store = useVNStore();
/** 当前是否已有持久化稳定快照（决定「快照」按钮的提示文案） */
const hasSnapshot = ref(false);

const entries = computed(() => entryGroups.value.flatMap(g => g.entries));

/** 可用的任务列表，用于排除配置 */
const AVAILABLE_TASKS = [
  { id: 'danmaku', label: '弹幕生成', color: 'rgba(139,69,19,0.6)' },
  { id: 'imageTag', label: '生图标签', color: 'rgba(212,197,160,0.6)' },
  { id: 'shop', label: '商店商品', color: 'rgba(120,140,160,0.6)' },
  { id: 'workshopOrder', label: '工坊订单', color: 'rgba(100,180,100,0.6)' },
  { id: 'boardGameEvent', label: '行路事件', color: 'rgba(180,120,180,0.6)' },
  { id: 'roleProfile', label: '角色生成', color: 'rgba(200,150,100,0.6)' },
  { id: 'dispatchStory', label: '派遣总结', color: 'rgba(100,150,200,0.6)' },
  { id: 'system', label: '末世通讯', color: 'rgba(150,100,150,0.6)' },
];

/** 规范化任务标识符（与 store.ts 中的 normalizeTaskId 保持一致） */
function normalizeTaskId(taskId: string): string {
  const normalized = taskId.toLowerCase().trim();
  const aliasMap: Record<string, string> = {
    imagetag: 'imagetag',
    'image tag': 'imagetag',
    imagetagonly: 'imagetag',
    生图: 'imagetag',
    生图标签: 'imagetag',
    cg: 'imagetag',
    background: 'imagetag',
    danmaku: 'danmaku',
    弹幕: 'danmaku',
    弹幕生成: 'danmaku',
    shop: 'shop',
    商店: 'shop',
    商店商品: 'shop',
    workshoporder: 'workshoporder',
    workshop_order: 'workshoporder',
    工坊订单: 'workshoporder',
    工坊: 'workshoporder',
    boardgameevent: 'boardgameevent',
    board_game_event: 'boardgameevent',
    行路事件: 'boardgameevent',
    事件: 'boardgameevent',
    roleprofile: 'roleprofile',
    role_profile: 'roleprofile',
    角色生成: 'roleprofile',
    角色档案: 'roleprofile',
    dispatchstory: 'dispatchstory',
    dispatch_story: 'dispatchstory',
    派遣总结: 'dispatchstory',
    派遣: 'dispatchstory',
    system: 'system',
    末世通讯: 'system',
    npc聊天: 'system',
  };
  return aliasMap[normalized] ?? normalized;
}

/** 检查条目是否排除了指定任务 */
function isTaskExcluded(entry: EnhancedEntry, taskId: string): boolean {
  if (!entry.excludeFromTasks || entry.excludeFromTasks.length === 0) return false;
  const normalizedExclude = entry.excludeFromTasks.map(t => normalizeTaskId(t));
  return normalizedExclude.includes(normalizeTaskId(taskId));
}

/**
 * 计算条目在当前设置下**实际**会被发往哪个 API。
 * 与 store.resolveApiTarget 同源（仅作为 UI 提示使用），规则：
 *
 * - 任务关联条目（linkedFeature=弹幕/生图）：由 (功能总开关 + 任务路由) 决定。
 *   - 功能总开关关 / 任务禁用 → 'none'
 *   - 任务路由到主 API → 'main'
 *   - 任务路由到第二 API → 'second'
 *   **targetApi 字段被忽略（弱化）**。
 * - 通用条目（universal / 未设置）：按 targetApi 决定 → 'main' | 'second' | 'both'。
 */
function resolveActualTarget(entry: EnhancedEntry): ResolvedTarget {
  const feature = entry.linkedFeature;
  if (feature === 'danmaku') {
    if (!store.settings.danmakuEnabled) return 'none';
    if (store.settings.apiTaskDanmaku === 'main') return 'main';
    if (store.settings.apiTaskDanmaku === 'second') return 'second';
    return 'none';
  }
  if (feature === 'imageGen') {
    if (!store.settings.imageGenEnabled) return 'none';
    if (store.settings.apiTaskImageTag === 'main') return 'main';
    if (store.settings.apiTaskImageTag === 'second') return 'second';
    return 'none';
  }
  return entry.targetApi; // 'main' | 'second' | 'both'
}

function getActualTargetLabel(target: ResolvedTarget): string {
  switch (target) {
    case 'main':
      return '主 API';
    case 'second':
      return '第二 API';
    case 'both':
      return '两者都发';
    case 'none':
      return '不发送';
  }
}

function getActualTargetColor(target: ResolvedTarget): string {
  switch (target) {
    case 'main':
      return 'rgba(120,140,160,0.6)';
    case 'second':
      return 'rgba(139,69,19,0.6)';
    case 'both':
      return 'rgba(212,197,160,0.7)';
    case 'none':
      return 'rgba(90,79,64,0.5)';
  }
}

function isTaskEntry(entry: EnhancedEntry): boolean {
  return entry.linkedFeature === 'danmaku' || entry.linkedFeature === 'imageGen';
}

function getAllCurrentWorldbookNames(): string[] {
  const names: string[] = [];
  try {
    const charWbs = getCharWorldbookNames('current');
    if (charWbs.primary) names.push(charWbs.primary);
    names.push(...charWbs.additional);
  } catch {}
  try {
    const chatWbName = getChatWorldbookName('current');
    if (chatWbName && !names.includes(chatWbName)) names.push(chatWbName);
  } catch {}
  try {
    for (const n of getGlobalWorldbookNames()) {
      if (!names.includes(n)) names.push(n);
    }
  } catch {}
  return names;
}

async function loadEntries() {
  loading.value = true;
  try {
    const names = getAllCurrentWorldbookNames();
    const groups: EntryGroup[] = [];
    for (const name of names) {
      try {
        const wbEntries = await getWorldbook(name);
        groups.push({
          worldbookName: name,
          entries: wbEntries.map(entry => ({
            uid: entry.uid,
            name: entry.name || `条目 #${entry.uid}`,
            enabled: entry.enabled,
            content: entry.content ?? '',
            targetApi: (entry.extra?.targetApi as 'main' | 'second' | 'both') ?? 'main',
            linkedFeature: entry.extra?.linkedFeature,
            excludeFromTasks: entry.extra?.excludeFromTasks ?? [],
          })),
        });
      } catch (e) {
        console.warn(`[WorldbookManager] 加载世界书 "${name}" 失败:`, e);
      }
    }
    entryGroups.value = groups;
  } finally {
    loading.value = false;
  }
}

async function toggleEntry(entry: EnhancedEntry, worldbookName: string) {
  entry.updating = true;
  const newEnabled = !entry.enabled;
  try {
    await updateWorldbookWith(
      worldbookName,
      wb => wb.map(e => (e.uid === entry.uid ? { ...e, enabled: newEnabled } : e)),
      { render: 'debounced' },
    );
    entry.enabled = newEnabled;
  } catch (e) {
    console.error('[WorldbookManager] 切换条目状态失败:', e);
  } finally {
    entry.updating = false;
  }
}

async function updateEntry(entry: EnhancedEntry, worldbookName: string, updates: Partial<EnhancedEntry>) {
  const { targetApi, linkedFeature, excludeFromTasks, enabled } = updates;
  try {
    await updateWorldbookWith(
      worldbookName,
      wb =>
        wb.map(e => {
          if (e.uid !== entry.uid) return e;
          const extra = { ...e.extra };
          if (targetApi !== undefined) extra.targetApi = targetApi;
          if (linkedFeature !== undefined) extra.linkedFeature = linkedFeature;
          if (excludeFromTasks !== undefined) extra.excludeFromTasks = excludeFromTasks;
          const result: any = { ...e, extra };
          if (enabled !== undefined) result.enabled = enabled;
          return result;
        }),
      { render: 'debounced' },
    );
    Object.assign(entry, updates);
  } catch (e) {
    console.error('[WorldbookManager] 更新条目失败:', e);
  }
}

function getFeatureLabel(feature: string): string {
  const labels: Record<string, string> = { danmaku: '弹幕', imageGen: '生图', universal: '通用' };
  return labels[feature] || feature;
}

function getFeatureColor(feature: string): string {
  const colors: Record<string, string> = {
    danmaku: 'var(--theme-accent-soft, rgba(139,69,19,0.6))',
    imageGen: 'rgba(212,197,160,0.6)',
    universal: 'rgba(120,140,160,0.5)',
  };
  return colors[feature] || 'rgba(90,79,64,0.6)';
}

/** 切换任务的排除状态 */
function toggleTaskExclude(entry: EnhancedEntry, worldbookName: string, taskId: string) {
  const current = entry.excludeFromTasks ?? [];
  const normalizedId = normalizeTaskId(taskId);
  // 去除已有的规范化匹配项
  const filtered = current.filter(t => normalizeTaskId(t) !== normalizedId);
  // 如果之前没有被排除，则添加（使用原始输入的格式）
  if (filtered.length === current.length) {
    filtered.push(taskId);
  }
  updateEntry(entry, worldbookName, { excludeFromTasks: filtered });
}

/** 切换排除任务区域的展开/折叠状态 */
function toggleExcludeSection(entry: EnhancedEntry) {
  entry._excludeExpanded = !entry._excludeExpanded;
}

// ====== Export / Import ======

interface ExportedEntry {
  uid: number;
  name: string;
  targetApi: 'main' | 'second' | 'both';
  linkedFeature?: string;
  /** 排除的任务列表 */
  excludeFromTasks: string[];
}
interface ExportedConfig {
  version: 3;
  worldbooks: Record<string, ExportedEntry[]>;
}

function exportConfig() {
  const config: ExportedConfig = { version: 3, worldbooks: {} };
  for (const group of entryGroups.value) {
    config.worldbooks[group.worldbookName] = group.entries.map(e => ({
      uid: e.uid,
      name: e.name,
      targetApi: e.targetApi,
      linkedFeature: e.linkedFeature,
      excludeFromTasks: e.excludeFromTasks,
    }));
  }
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `worldbook-config-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function triggerImport() {
  importInputRef.value?.click();
}

async function onImportFile(evt: Event) {
  const input = evt.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  let config: ExportedConfig;
  try {
    const text = await file.text();
    config = JSON.parse(text) as ExportedConfig;
    if (typeof config.worldbooks !== 'object') throw new Error('格式不正确');
    // version 2 及以下不支持 excludeFromTasks，version 3 支持
    if (config.version !== 2 && config.version !== 3) throw new Error('格式不正确（期望 version: 2 或 3）');
  } catch (e: any) {
    alert(`导入失败：${e.message || '文件格式错误'}`);
    return;
  }

  loading.value = true;
  let applied = 0;
  try {
    for (const [wbName, exportedEntries] of Object.entries(config.worldbooks)) {
      const group = entryGroups.value.find(g => g.worldbookName === wbName);
      if (!group) continue;
      // Build uid → exported map
      const exportMap = new Map(exportedEntries.map(e => [e.uid, e]));
      for (const entry of group.entries) {
        const ex = exportMap.get(entry.uid);
        if (!ex) continue;
        const updates: Partial<EnhancedEntry> = {};
        if (ex.targetApi !== entry.targetApi) updates.targetApi = ex.targetApi;
        if (ex.linkedFeature !== entry.linkedFeature) updates.linkedFeature = ex.linkedFeature;
        // version 3 才导入 excludeFromTasks
        if (config.version === 3 && ex.excludeFromTasks) {
          updates.excludeFromTasks = ex.excludeFromTasks;
        }
        if (Object.keys(updates).length > 0) {
          await updateEntry(entry, wbName, updates);
          applied++;
        }
      }
    }
    // 导入完成后自动创建持久化稳定快照
    await createSnapshot();
    alert(`导入完成，已更新 ${applied} 个条目的增强配置。`);
  } catch (e: any) {
    alert(`导入出错：${e.message}`);
  } finally {
    loading.value = false;
  }
}

// ====== Snapshot ======

/** 创建快照：调用 store 制作并持久化稳定快照 */
async function createSnapshot() {
  loading.value = true;
  try {
    await store.setWorldbookSnapshot();
    hasSnapshot.value = true;
  } catch (e) {
    console.error('[WorldbookManager] 创建快照失败', e);
    alert('创建快照失败');
  } finally {
    loading.value = false;
  }
}

/** 恢复快照：将所有条目恢复到持久化快照时的 enabled 状态 */
async function restoreSnapshot() {
  if (!hasSnapshot.value) {
    alert('没有可用的快照');
    return;
  }

  const confirmed = confirm('确定要将所有世界书条目恢复到快照时的启用状态吗？');
  if (!confirmed) return;

  const snap = store.getWorldbookSnapshot() as Record<string, Record<number, boolean>> | null;
  if (!snap || Object.keys(snap).length === 0) {
    alert('没有可用的快照');
    return;
  }

  loading.value = true;
  let restored = 0;
  let failed = 0;
  try {
    for (const [wbName, inner] of Object.entries(snap)) {
      try {
        await updateWorldbookWith(
          wbName,
          wb =>
            wb.map(e => {
              const expected = inner[e.uid];
              if (expected === undefined) return e;
              if (e.enabled === expected) return e;
              restored++;
              return { ...e, enabled: expected };
            }),
          { render: 'debounced' },
        );
      } catch (e) {
        console.warn(`[WorldbookManager] 恢复快照时更新世界书 "${wbName}" 失败`, e);
        failed++;
      }
    }
    // 重新加载以刷新 UI
    await loadEntries();
    alert(`快照恢复完成：已恢复 ${restored} 个条目${failed > 0 ? `，${failed} 本书更新失败` : ''}`);
  } catch (e: any) {
    alert(`恢复快照出错：${e.message}`);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  hasSnapshot.value = !!store.getWorldbookSnapshot();
  await loadEntries();
});

const panelStyle = {
  maxHeight: 'calc(100vh - 80px)',
  borderColor: 'rgba(90,79,64,0.6)',
  background: 'var(--vn-panel-bg)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  flexDirection: 'column',
};
const headerBorder = { borderBottom: '1px solid rgba(90,79,64,0.3)' };
const decoTop = {
  height: '3px',
  background: 'linear-gradient(to right, transparent, var(--theme-accent-soft, rgba(139,69,19,0.6)), transparent)',
};
const decoTopThin = {
  height: '1px',
  marginTop: '1px',
  background: 'linear-gradient(to right, transparent, rgba(139,69,19,0.3), transparent)',
};
const decoBottomThin = {
  height: '1px',
  background: 'linear-gradient(to right, transparent, rgba(139,69,19,0.3), transparent)',
};
const decoBottom = {
  height: '2px',
  marginTop: '1px',
  background: 'linear-gradient(to right, transparent, var(--theme-accent-soft, rgba(139,69,19,0.5)), transparent)',
};
</script>
