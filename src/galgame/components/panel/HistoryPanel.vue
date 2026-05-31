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

        <!-- Pagination bar: floor navigation (只更新预览索引，不触发主界面跳转) -->
        <div
          class="flex items-center gap-2 px-6 py-2"
          :style="{ borderBottom: '1px solid var(--theme-history-header-border, rgba(90,79,64,0.2))' }"
        >
          <button
            class="flex h-6 w-6 cursor-pointer items-center justify-center transition-colors"
            :style="{
              color: store.historyPreviewFloorIndex > 0 ? 'var(--theme-text-muted)' : 'var(--theme-text-faint, rgba(139,125,107,0.3))',
            }"
            :disabled="store.historyPreviewFloorIndex <= 0"
            @click="prevFloor"
          >
            <i class="fa-solid fa-chevron-left text-xs" />
          </button>

          <input
            type="number"
            :value="store.historyPreviewFloorIndex + 1"
            :min="1"
            :max="totalFloors"
            class="w-12 bg-transparent text-center outline-none"
            style="
              color: var(--theme-history-info-color, var(--theme-text-muted));
              font-size: 9px;
              font-family: monospace;
            "
            @change="onFloorInput"
            @keydown.enter.prevent="onFloorInput"
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
                store.historyPreviewFloorIndex < totalFloors - 1
                  ? 'var(--theme-text-muted)'
                  : 'var(--theme-text-faint, rgba(139,125,107,0.3))',
            }"
            :disabled="store.historyPreviewFloorIndex >= totalFloors - 1"
            @click="nextFloor"
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

        <!-- Info bar: block count of current preview floor + within-floor navigation -->
        <div
          class="flex items-center justify-between px-6 py-2"
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
            <span v-if="previewFloorBlocks.length > 0" class="ml-2">
              块 {{ store.historyPreviewBlockIndex + 1 }}/{{ previewFloorBlocks.length }}
            </span>
          </div>

          <!-- Within-floor block navigation -->
          <div v-if="previewFloorBlocks.length > 1" class="flex items-center gap-1">
            <button
              class="flex h-5 w-5 cursor-pointer items-center justify-center text-xs transition-colors"
              :style="{
                color: store.historyPreviewBlockIndex > 0 ? 'var(--theme-text-muted)' : 'var(--theme-text-faint)',
              }"
              :disabled="store.historyPreviewBlockIndex <= 0"
              @click="prevBlock"
            >
              <i class="fa-solid fa-caret-left" />
            </button>
            <button
              class="flex h-5 w-5 cursor-pointer items-center justify-center text-xs transition-colors"
              :style="{
                color: store.historyPreviewBlockIndex < previewFloorBlocks.length - 1 ? 'var(--theme-text-muted)' : 'var(--theme-text-faint)',
              }"
              :disabled="store.historyPreviewBlockIndex >= previewFloorBlocks.length - 1"
              @click="nextBlock"
            >
              <i class="fa-solid fa-caret-right" />
            </button>
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
                index === store.historyPreviewBlockIndex ? 'var(--theme-history-active-bg, rgba(139,69,19,0.1))' : 'transparent',
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
                v-if="index === store.historyPreviewBlockIndex"
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

// 当前预览楼层在 dialogues 中的实际物理索引
const previewFloorPhysicalIndex = computed(() => {
  const visible = visibleFloorIndices.value;
  const displayIdx = store.historyPreviewFloorIndex;
  return visible[displayIdx] ?? 0;
});

const previewFloor = computed(() => store.dialogues[previewFloorPhysicalIndex.value] ?? null);

// 当前预览楼层的可见块数组（过滤 user 类型）
const previewFloorBlocks = computed<MessageBlock[]>(() => {
  const floor = previewFloor.value;
  if (!floor?.blocks) return [];
  return floor.blocks.filter((block: MessageBlock) => block.type !== 'user');
});

// 当前预览楼层的对话行（用于列表展示）
const historyLines = computed<{ speaker?: string; text: string }[]>(() => {
  return previewFloorBlocks.value.map((block: MessageBlock) => {
    if (block.type === 'character') {
      return { speaker: block.character, text: block.text ?? '' };
    }
    return { text: block.message ?? '' };
  });
});

// Ensure preview floor is parsed
watch(
  previewFloor,
  async floor => {
    if (floor && !floor.parsed) {
      await store.parseCurrentFloor(previewFloorPhysicalIndex.value);
    }
  },
  { immediate: true },
);

// Floor-level pagination: only updates preview index, no main interface interaction
function prevFloor() {
  const idx = store.historyPreviewFloorIndex;
  if (idx > 0) {
    store.historyPreviewFloorIndex = idx - 1;
    store.historyPreviewBlockIndex = 0;
  }
}

function nextFloor() {
  const idx = store.historyPreviewFloorIndex;
  if (idx < totalFloors.value - 1) {
    store.historyPreviewFloorIndex = idx + 1;
    store.historyPreviewBlockIndex = 0;
  }
}

function onFloorInput(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value);
  if (!isNaN(val)) {
    store.historyPreviewFloorIndex = Math.max(0, Math.min(val - 1, totalFloors.value - 1));
    store.historyPreviewBlockIndex = 0;
  }
}

// Within-floor block navigation: only updates preview block index
function prevBlock() {
  const idx = store.historyPreviewBlockIndex;
  if (idx > 0) {
    store.historyPreviewBlockIndex = idx - 1;
  }
}

function nextBlock() {
  const idx = store.historyPreviewBlockIndex;
  if (idx < previewFloorBlocks.value.length - 1) {
    store.historyPreviewBlockIndex = idx + 1;
  }
}

// Jump to the currently previewed floor + block (main interface interaction)
function jumpToFloor() {
  store.navigateToHistoryPreview();
  store.setOverlay('none');
}

// Jump to a specific line within the preview floor
function goToLine(index: number) {
  store.historyPreviewBlockIndex = index;
  store.navigateToHistoryPreview();
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
