<template>
  <div class="absolute inset-0 flex items-center justify-center" style="z-index: 50">
    <div class="absolute inset-0 backdrop-blur-sm" style="background: rgba(42, 36, 32, 0.7)" @click="$emit('close')" />

    <div
      class="flex flex-col relative w-full max-w-3xl mx-4 border overflow-hidden animate-fade-in-up"
      :style="panelStyle"
    >
      <div :style="decoTop" />
      <div :style="decoTopThin" />

      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4" :style="headerBorder">
        <div class="flex items-center gap-3">
          <div class="stamp-effect">
            <span style="color: var(--theme-accent, var(--rust)); font-size: 0.75rem; font-weight: bold; letter-spacing: 0.15em"
              >WORLDBOOK</span
            >
          </div>
          <h2 class="text-lg font-bold tracking-widest" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">世界书管理</h2>
        </div>
        <div class="flex items-center gap-2">
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
        class="px-6 py-3"
        :style="{ borderBottom: '1px solid rgba(90,79,64,0.2)', background: 'rgba(139,69,19,0.1)' }"
      >
        <div class="text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.8))">
          <i class="fa-solid fa-circle-info mr-2" style="color: var(--theme-accent, var(--rust))" />
          管理世界书条目的启用状态、关联功能和 API 分配。
          <strong style="color: var(--theme-text-main, rgba(212,197,160,0.9))">任务关联条目</strong>
          （弹幕/生图）会按「API 任务配置」自动路由，受对应功能开关控制；
          <strong style="color: var(--theme-text-main, rgba(212,197,160,0.9))">通用条目</strong>
          按"发送给"决定。
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 py-4 overflow-y-auto no-scrollbar" style="max-height: calc(100vh - 180px)">
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
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1 min-w-0 mr-3">
                  <div class="flex items-center gap-2 mb-1">
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
                <div class="flex items-center gap-2">
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
              <div class="grid grid-cols-2 gap-3">
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

const entries = computed(() => entryGroups.value.flatMap(g => g.entries));

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
  const { targetApi, linkedFeature, enabled } = updates;
  try {
    await updateWorldbookWith(
      worldbookName,
      wb =>
        wb.map(e => {
          if (e.uid !== entry.uid) return e;
          const extra = { ...e.extra };
          if (targetApi !== undefined) extra.targetApi = targetApi;
          if (linkedFeature !== undefined) extra.linkedFeature = linkedFeature;
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

// ====== Export / Import ======

interface ExportedEntry {
  uid: number;
  name: string;
  targetApi: 'main' | 'second' | 'both';
  linkedFeature?: string;
}
interface ExportedConfig {
  version: 2;
  worldbooks: Record<string, ExportedEntry[]>;
}

function exportConfig() {
  const config: ExportedConfig = { version: 2, worldbooks: {} };
  for (const group of entryGroups.value) {
    config.worldbooks[group.worldbookName] = group.entries.map(e => ({
      uid: e.uid,
      name: e.name,
      targetApi: e.targetApi,
      linkedFeature: e.linkedFeature,
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
    if (config.version !== 1 || typeof config.worldbooks !== 'object') throw new Error('格式不正确');
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
        if (Object.keys(updates).length > 0) {
          await updateEntry(entry, wbName, updates);
          applied++;
        }
      }
    }
    alert(`导入完成，已更新 ${applied} 个条目的增强配置。`);
  } catch (e: any) {
    alert(`导入出错：${e.message}`);
  } finally {
    loading.value = false;
  }
}

onMounted(loadEntries);

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
