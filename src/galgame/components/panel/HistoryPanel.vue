<template>
  <div data-ui="history-panel" class="absolute inset-0 flex items-center justify-center px-4" style="z-index: 50">
    <div
      data-ui="panel-backdrop"
      class="absolute inset-0"
      :style="{
        background: 'var(--theme-panel-backdrop, rgba(42, 36, 32, 0.7))',
        backdropFilter: 'blur(var(--theme-panel-backdrop-blur, 4px))',
      }"
      @click="store.setOverlay('none')"
    />

    <SkinShell :skin="historyPanelSkin" :shell-style="panelShellStyle">
      <div
        data-ui="panel"
        class="animate-fade-in-up relative flex w-full flex-col overflow-hidden border"
        :style="
          historyPanelSkin ? { ...panelStyle, borderColor: 'transparent', background: 'transparent' } : panelStyle
        "
      >
        <div :style="decoTop" />
        <div :style="decoTopThin" />

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4" :style="headerBorder">
          <div class="flex items-center gap-3">
            <div class="stamp-effect">
              <span
                style="
                  color: var(--theme-accent, var(--rust));
                  font-size: 0.75rem;
                  font-weight: bold;
                  letter-spacing: 0.15em;
                "
                >LOG</span
              >
            </div>
            <h2
              class="text-lg font-bold tracking-widest"
              style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))"
            >
              历史记录
            </h2>
          </div>
          <button
            class="flex h-8 w-8 cursor-pointer items-center justify-center"
            style="color: var(--theme-text-muted, var(--vn-muted))"
            @click="store.setOverlay('none')"
          >
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Pagination bar: floor navigation -->
        <div
          class="flex items-center gap-3 px-6 py-2"
          :style="{ borderBottom: '1px solid var(--theme-history-header-border, rgba(90,79,64,0.2))' }"
        >
          <button
            class="flex h-6 w-6 cursor-pointer items-center justify-center transition-colors"
            :style="{
              color: store.historyDisplayIndex > 0 ? 'var(--theme-text-muted)' : 'var(--theme-text-faint, rgba(139,125,107,0.3))',
            }"
            :disabled="store.historyDisplayIndex <= 0"
            @click="prevPage"
          >
            <i class="fa-solid fa-chevron-left text-xs" />
          </button>
          <input
            type="number"
            :value="store.historyDisplayIndex + 1"
            :min="1"
            :max="totalFloors"
            class="w-12 bg-transparent text-center outline-none"
            style="
              color: var(--theme-history-info-color, var(--theme-text-muted));
              font-size: 9px;
              font-family: monospace;
            "
            @change="onPageInput"
            @keydown.enter.prevent="onPageInput"
          />
          <span
            style="
              font-size: 9px;
              color: var(--theme-history-info-color, var(--theme-text-muted));
              font-family: monospace;
            "
          >
            / {{ totalFloors }}
          </span>
          <button
            class="flex h-6 w-6 cursor-pointer items-center justify-center transition-colors"
            :style="{
              color:
                store.historyDisplayIndex < totalFloors - 1
                  ? 'var(--theme-text-muted)'
                  : 'var(--theme-text-faint, rgba(139,125,107,0.3))',
            }"
            :disabled="store.historyDisplayIndex >= totalFloors - 1"
            @click="nextPage"
          >
            <i class="fa-solid fa-chevron-right text-xs" />
          </button>
          <button
            class="ml-auto cursor-pointer px-3 py-1 text-xs transition-colors"
            style="color: var(--theme-accent)"
            @click="jumpToFloor"
          >
            跳转到此楼层
          </button>
        </div>

        <!-- Info bar: block count of current preview floor -->
        <div
          class="flex items-center px-6 py-2"
          :style="{ borderBottom: '1px solid var(--theme-history-header-border, rgba(90,79,64,0.2))' }"
        >
          <div
            style="
              font-size: 9px;
              color: var(--theme-history-info-color, var(--theme-text-muted, var(--vn-muted)));
              font-family: monospace;
            "
          >
            共 {{ historyLines.length }} 条
          </div>
        </div>

        <!-- Dialogue list -->
        <div ref="scrollRef" class="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div
            v-for="(line, index) in historyLines"
            :key="index"
            :data-line="index"
            class="cursor-pointer py-2.5 transition-colors duration-150"
            :style="{
              borderBottom: '1px solid var(--theme-history-row-border, rgba(90,79,64,0.1))',
              background:
                index === activeBlockIndex ? 'var(--theme-history-active-bg, rgba(139,69,19,0.1))' : 'transparent',
            }"
            @click="goToLine(index)"
          >
            <div class="flex items-start gap-3">
              <span
                class="shrink-0 pt-0.5 text-right"
                style="
                  font-size: 9px;
                  color: var(--theme-history-index-color, var(--theme-text-faint, rgba(139, 125, 107, 0.5)));
                  font-family: monospace;
                  width: 1.5rem;
                "
              >
                {{ String(index + 1).padStart(3, '0') }}
              </span>
              <div class="min-w-0 flex-1">
                <template v-if="line.speaker">
                  <span
                    style="
                      color: var(--theme-history-speaker-color, var(--theme-accent, var(--rust)));
                      font-size: 0.75rem;
                      font-weight: bold;
                      letter-spacing: 0.1em;
                    "
                    >{{ line.speaker }}</span
                  >
                  <p
                    class="mt-0.5 text-sm leading-relaxed"
                    style="color: var(--theme-history-text-color, var(--theme-text-soft, rgba(212, 197, 160, 0.8)))"
                  >
                    {{ line.text }}
                  </p>
                </template>
                <p
                  v-else
                  class="text-sm leading-relaxed italic"
                  style="color: var(--theme-history-narration-color, rgba(212, 197, 160, 0.6)); padding-left: 2em"
                >
                  {{ line.text }}
                </p>
              </div>
              <div
                v-if="index === activeBlockIndex"
                class="mt-1.5 shrink-0"
                style="width: 6px; height: 6px; background: var(--theme-accent, var(--rust)); transform: rotate(45deg)"
              />
            </div>
          </div>
          <div
            v-if="historyLines.length === 0"
            class="py-8 text-center"
            style="color: var(--theme-text-muted, var(--vn-muted)); font-size: 0.75rem"
          >
            暂无对话记录
          </div>
        </div>

        <div :style="decoBottomThin" />
        <div :style="decoBottom" />
      </div>
    </SkinShell>
  </div>
</template>

<script setup lang="ts">
import SkinShell from '../common/SkinShell.vue';
import { useVNStore } from '../../store';
import type { MessageBlock } from '../../types/message';

const store = useVNStore();
const scrollRef = ref<HTMLDivElement | null>(null);

const historyPanelSkin = computed(() => store.getComponentSkinForCurrent('historyPanel'));

// 可见楼层索引（跳过 user 和隐藏楼层）
const visibleFloorIndices = computed(() => {
  return store.dialogues
    .map((unit, i) => ({ unit, i }))
    .filter(({ unit }) => unit.role !== 'user' && !unit.isHidden)
    .map(({ i }) => i);
});

const totalFloors = computed(() => visibleFloorIndices.value.length);

// 历史面板翻页索引，直接使用 store 中的独立状态（翻页不会触发主界面跳转）
const historyDisplayIndex = computed(() => store.historyDisplayIndex);

// 当前预览楼层在 dialogues 中的实际索引
const previewIndex = computed(() => {
  const visible = visibleFloorIndices.value;
  const displayIdx = store.historyDisplayIndex;
  return visible[displayIdx] ?? 0;
});
const previewFloor = computed(() => store.dialogues[previewIndex.value] ?? null);

// 当前楼层内的高亮块索引（由翻页按钮同步）
const activeBlockIndex = ref(0);

// 同步高亮块：当 previewIndex 变化时，重置到该楼层的第一块
watch(previewIndex, () => {
  activeBlockIndex.value = 0;
});

// Ensure preview floor is parsed when previewing
watch(
  previewFloor,
  async floor => {
    if (floor && !floor.parsed) {
      await store.parseCurrentFloor(previewIndex.value);
    }
  },
  { immediate: true },
);

const historyLines = computed<{ speaker?: string; text: string }[]>(() => {
  const floor = previewFloor.value;
  if (!floor?.blocks?.length) return [];
  return floor.blocks
    .filter((block: MessageBlock) => block.type !== 'user')
    .map((block: MessageBlock) => {
      if (block.type === 'character') {
        return { speaker: block.character, text: block.text ?? '' };
      }
      return { text: block.message ?? '' };
    });
});

function prevPage() {
  const idx = store.historyDisplayIndex;
  if (idx > 0) {
    store.historyDisplayIndex = idx - 1;
  }
}

function nextPage() {
  const idx = store.historyDisplayIndex;
  if (idx < totalFloors.value - 1) {
    store.historyDisplayIndex = idx + 1;
  }
}

function onPageInput(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value);
  if (!isNaN(val)) {
    store.historyDisplayIndex = Math.max(0, Math.min(val - 1, totalFloors.value - 1));
  }
}

function jumpToFloor() {
  store.navigateFloorTo(previewIndex.value);
  store.setOverlay('none');
}

function goToLine(index: number) {
  store.navigateFloorTo(previewIndex.value);
  store.currentBlockIndex = index;
  store.setOverlay('none');
}

const panelShellStyle = {
  maxWidth: 'var(--theme-history-panel-shell-max-width, var(--theme-panel-shell-max-width, min(100%, 42rem)))',
  maxHeight: 'var(--theme-history-panel-shell-max-height, var(--theme-panel-shell-max-height, 90%))',
};

const panelStyle: Record<string, string> = {
  width: '100%',
  height: '100%',
  maxHeight: 'var(--theme-panel-max-height, 100%)',
  borderColor: 'var(--theme-panel-border, rgba(90,79,64,0.6))',
  background: 'var(--theme-panel-bg, var(--vn-panel-bg))',
  backdropFilter: 'blur(var(--theme-panel-content-blur, 12px)) saturate(var(--theme-panel-content-saturate, 100%))',
  display: 'flex',
  flexDirection: 'column',
};
const headerBorder = { borderBottom: '1px solid var(--theme-history-header-border, rgba(90,79,64,0.3))' };
const decoTop = {
  height: '3px',
  background: 'linear-gradient(to right, transparent, var(--theme-accent-soft, rgba(139,69,19,0.6)), transparent)',
};
const decoTopThin = {
  height: '1px',
  marginTop: '1px',
  background:
    'linear-gradient(to right, transparent, var(--theme-history-header-border, rgba(139,69,19,0.3)), transparent)',
};
const decoBottomThin = {
  height: '1px',
  background:
    'linear-gradient(to right, transparent, var(--theme-history-header-border, rgba(139,69,19,0.3)), transparent)',
};
const decoBottom = {
  height: '2px',
  marginTop: '1px',
  background: 'linear-gradient(to right, transparent, var(--theme-accent-soft, rgba(139,69,19,0.5)), transparent)',
};
</script>
