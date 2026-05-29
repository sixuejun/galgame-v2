<template>
  <!-- Size selector (when starting new game with multiple sizes) -->
  <div v-if="showSizeSelect" class="flex flex-col items-center justify-center select-none" :style="rootStyle">
    <div class="flex flex-col items-center" style="max-width: 24rem; width: 100%">
      <div class="mb-6 w-full border-b-2 border-(--vn-border) pb-1">
        <div class="flex items-center justify-between">
          <div class="masthead-text">第 MMXLVIII 期</div>
          <button class="masthead-text cursor-pointer" @click="$emit('close')">←返回</button>
        </div>
      </div>

      <h1 class="game-title ink-text-2048">废土 2048</h1>
      <div class="mb-8 flex w-full items-center gap-2">
        <div class="rule-line flex-1" />
        <p class="subtitle-text">合并求生·重建文明</p>
        <div class="rule-line flex-1" />
      </div>

      <div class="size-select-label">选择棋盘大小</div>
      <div class="flex gap-3">
        <button
          v-for="s in availableSizes"
          :key="s"
          class="vn-2048-btn"
          style="padding: 0.5rem 1.2rem; font-size: 0.8rem"
          @click="startWithSize(s)"
        >
          {{ s }}×{{ s }}
        </button>
      </div>
    </div>
  </div>

  <!-- Full game -->
  <div
    v-else
    class="flex flex-col items-center select-none"
    :style="rootStyle"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @mouseleave="onMouseLeave"
  >
    <div class="flex flex-col items-center" style="max-width: 24rem; width: 100%">
      <!-- Masthead -->
      <div class="mb-2 w-full border-b-2 border-(--vn-border) pb-1">
        <div class="flex items-center justify-between">
          <div class="masthead-text">第 MMXLVIII 期</div>
          <button class="masthead-text cursor-pointer" @click="handleBack">←返回</button>
        </div>
      </div>

      <!-- Title -->
      <h1 class="game-title ink-text-2048">废土 2048</h1>
      <div class="mb-3 flex w-full items-center gap-2">
        <div class="rule-line flex-1" />
        <p class="subtitle-text">合并求生·重建文明</p>
        <div class="rule-line flex-1" />
      </div>

      <!-- Score boxes + buttons row -->
      <div class="mb-3 flex w-full items-center justify-between">
        <div class="flex gap-2">
          <div class="score-box">
            <div class="score-label">得分</div>
            <div class="score-value ink-text-2048">
              {{ store.puzzle2048Score }}
            </div>
          </div>
          <div class="score-box">
            <div class="score-label">最高</div>
            <div class="score-value ink-text-2048">
              {{ store.puzzle2048BestScore }}
            </div>
          </div>
        </div>
        <div class="flex gap-2" style="margin-right: 0.5rem">
          <div class="vn-2048-btn-wrap rounded border px-2 py-1" style="border-color: rgba(90, 79, 64, 0.5)">
            <button class="vn-2048-btn" @click="handleSave">SAVE</button>
          </div>
          <div class="vn-2048-btn-wrap rounded border px-2 py-1" style="border-color: rgba(90, 79, 64, 0.5)">
            <button class="vn-2048-btn" @click="handleSettle">SETTLE</button>
          </div>
        </div>
      </div>

      <!-- Board -->
      <div class="distressed-border-2048 relative" :style="boardStyle">
        <!-- Empty cell grid -->
        <div
          v-for="idx in gridSize * gridSize"
          :key="'cell-' + idx"
          class="vn-2048-empty-cell absolute"
          :style="emptyCellStyle(Math.floor((idx - 1) / gridSize), (idx - 1) % gridSize)"
        />

        <!-- Tiles layer (same origin as empty cells for alignment) -->
        <div class="absolute" :style="tilesLayerStyle">
          <div
            v-for="tile in store.puzzle2048Tiles"
            :key="tile.id"
            class="vn-2048-tile-num absolute flex items-center justify-center"
            :class="{
              'tile-new-2048': tile.isNew,
              'tile-merged-2048': tile.justMerged,
            }"
            :style="[tileOuterStyle(tile), tileNumStyle(tile.value)]"
          >
            {{ tile.value }}
          </div>
        </div>
      </div>

      <!-- Grid size indicator -->
      <div class="grid-size-hint">{{ gridSize }}×{{ gridSize }} · 得分即结算金额</div>
    </div>

    <!-- Game Over overlay -->
    <div v-if="store.puzzle2048GameOver" class="vn-2048-overlay absolute inset-0 flex items-center justify-center">
      <div class="vn-2048-dialog">
        <div class="mb-2 w-full border-b border-(--vn-border) pb-2">
          <div class="masthead-text">紧急公告</div>
        </div>
        <h2 class="ink-text-2048 vn-2048-dialog-title">任务失败</h2>
        <p class="vn-2048-dialog-desc">废土已将你吞噬。最终得分：{{ store.puzzle2048Score }}</p>
        <div class="flex gap-3 rounded border px-2 py-1.5" style="border-color: rgba(90, 79, 64, 0.5)">
          <button class="vn-2048-btn" @click="handleSettle">结算退出</button>
        </div>
      </div>
    </div>

    <!-- Win overlay -->
    <div
      v-if="store.puzzle2048Won && !store.puzzle2048WonAcknowledged"
      class="vn-2048-overlay absolute inset-0 flex items-center justify-center"
    >
      <div class="vn-2048-dialog">
        <div class="mb-2 w-full border-b border-(--vn-border) pb-2">
          <div class="vn-2048-dialog-accent">特别号外</div>
        </div>
        <h2 class="ink-text-2048 vn-2048-dialog-title">文明重生</h2>
        <p class="vn-2048-dialog-desc">在绝境中，你集齐了重建所需的一切。得分：{{ store.puzzle2048Score }}</p>
        <div class="flex gap-3 rounded border px-2 py-1.5" style="border-color: rgba(90, 79, 64, 0.5)">
          <button class="vn-2048-btn" @click="store.acknowledge2048Win()">继续探索</button>
          <button class="vn-2048-btn" @click="handleSettle">结算退出</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Tile2048, get2048Size, useVNStore } from '../../store';

const emit = defineEmits<{ close: [] }>();
const store = useVNStore();

const showSizeSelect = ref(false);

const availableSizes = computed(() => get2048Size(store.workshopLevel));
const gridSize = computed(() => store.puzzle2048Size);

/* Dark theme tile colors: from muted paper to rust, harmonized with --vn-* */
const TILE_COLORS: Record<number, string> = {
  2: 'rgba(90, 79, 64, 0.5)',
  4: 'rgba(107, 92, 72, 0.6)',
  8: 'rgba(139, 115, 85, 0.55)',
  16: 'rgba(139, 69, 19, 0.4)',
  32: 'rgba(139, 69, 19, 0.55)',
  64: 'rgba(139, 52, 0, 0.5)',
  128: 'rgba(160, 82, 45, 0.55)',
  256: 'rgba(139, 37, 0, 0.45)',
  512: 'rgba(139, 37, 0, 0.6)',
  1024: 'rgba(107, 52, 16, 0.75)',
  2048: 'rgba(107, 52, 16, 0.9)',
};

function getTileColor(value: number): string {
  return TILE_COLORS[value] ?? TILE_COLORS[2];
}

const rootStyle = {
  background: 'var(--vn-bg)',
  color: 'var(--theme-text-main, var(--vn-fg))',
  padding: '1rem',
  minHeight: '100%',
  position: 'relative' as const,
};

const cellSizeRem = computed(() => {
  const n = gridSize.value;
  if (n <= 4) return 5;
  if (n <= 6) return 3.2;
  return 2.3;
});

const cellGapRem = computed(() => {
  const n = gridSize.value;
  if (n <= 4) return 0.4;
  if (n <= 6) return 0.3;
  return 0.25;
});

/* Grid total size (cells + gaps between), no outer padding */
const gridInnerSize = computed(() => cellSizeRem.value * gridSize.value + cellGapRem.value * (gridSize.value - 1));

/* Board: padding creates inner area = gridInnerSize, so border box = gridInnerSize + 2*gap */
const boardStyle = computed(() => ({
  width: `${gridInnerSize.value + cellGapRem.value * 2}rem`,
  height: `${gridInnerSize.value + cellGapRem.value * 2}rem`,
  padding: `${cellGapRem.value}rem`,
  background: 'var(--vn-choice-bg)',
  borderColor: 'var(--vn-border)',
  position: 'relative' as const,
}));

function emptyCellStyle(row: number, col: number) {
  const gap = cellGapRem.value;
  const cell = cellSizeRem.value;
  return {
    width: `${cell}rem`,
    height: `${cell}rem`,
    left: `${gap + col * (cell + gap)}rem`,
    top: `${gap + row * (cell + gap)}rem`,
  };
}

/* Tiles layer: same origin as empty cells (gap, gap), size = grid inner */
const tilesLayerStyle = computed(() => ({
  left: `${cellGapRem.value}rem`,
  top: `${cellGapRem.value}rem`,
  width: `${gridInnerSize.value}rem`,
  height: `${gridInnerSize.value}rem`,
}));

function tileOuterStyle(tile: Tile2048) {
  const cell = cellSizeRem.value;
  const gap = cellGapRem.value;
  return {
    width: `${cell}rem`,
    height: `${cell}rem`,
    left: `${tile.col * (cell + gap)}rem`,
    top: `${tile.row * (cell + gap)}rem`,
    transition: 'left 150ms ease-in-out, top 150ms ease-in-out',
  };
}

function tileNumStyle(value: number) {
  const n = gridSize.value;
  let fontSize = '1.1rem';
  if (n > 4) fontSize = n <= 6 ? '0.9rem' : '0.65rem';
  if (value >= 1024) fontSize = n <= 4 ? '0.85rem' : n <= 6 ? '0.75rem' : '0.55rem';
  const isLight = value <= 8;
  return {
    background: getTileColor(value),
    color: value >= 2048 ? 'var(--stain)' : isLight ? 'var(--theme-text-main, var(--vn-fg))' : 'var(--paper-light)',
    fontSize,
    fontFamily: 'monospace',
    fontWeight: '900',
    border: '1px solid var(--vn-border)',
  };
}

onMounted(() => {
  if (!store.puzzle2048Active) {
    if (availableSizes.value.length > 1) {
      showSizeSelect.value = true;
    }
  }
  window.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
});

function startWithSize(size: number) {
  if (!store.start2048(size)) {
    store.showToast('金币不足');
    return;
  }
  showSizeSelect.value = false;
}

function handleBack() {
  if (store.puzzle2048Active) {
    store.save2048();
  }
  emit('close');
}

function handleSettle() {
  const reward = store.settle2048();
  store.showToast(`结算收益: +${reward}G`);
  emit('close');
}

function handleSave() {
  store.save2048();
}

function onKeyDown(e: KeyboardEvent) {
  if (!store.puzzle2048Active || store.puzzle2048GameOver) return;
  const dirMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    s: 'down',
    a: 'left',
    d: 'right',
  };
  const dir = dirMap[e.key];
  if (dir) {
    e.preventDefault();
    store.move2048Action(dir);
  }
}

const MIN_SWIPE = 30;
let startX = 0;
let startY = 0;
let isMouseDown = false;

function onTouchStart(e: TouchEvent) {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - startX;
  const dy = e.changedTouches[0].clientY - startY;
  resolveSwipe(dx, dy);
}

function onMouseDown(e: MouseEvent) {
  isMouseDown = true;
  startX = e.clientX;
  startY = e.clientY;
  e.preventDefault();
}

function onMouseMove(e: MouseEvent) {
  if (!isMouseDown) return;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) >= MIN_SWIPE) {
    resolveSwipe(dx, dy);
    isMouseDown = false;
  }
}

function onMouseUp() {
  isMouseDown = false;
}

function onMouseLeave() {
  isMouseDown = false;
}

function resolveSwipe(dx: number, dy: number) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < MIN_SWIPE) return;
  if (!store.puzzle2048Active || store.puzzle2048GameOver) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    store.move2048Action(dx > 0 ? 'right' : 'left');
  } else {
    store.move2048Action(dy > 0 ? 'down' : 'up');
  }
}
</script>

<style scoped>
.masthead-text {
  font-size: 0.55rem;
  font-family: monospace;
  letter-spacing: 0.15em;
  color: var(--theme-text-muted, var(--vn-muted));
  text-transform: uppercase;
}

.game-title {
  font-family: serif;
  font-weight: 900;
  font-size: 1.8rem;
  letter-spacing: -0.02em;
  color: var(--theme-text-main, var(--vn-fg));
  text-align: center;
  line-height: 1;
  margin-bottom: 4px;
}

.subtitle-text {
  font-family: monospace;
  font-size: 0.6rem;
  letter-spacing: 0.2em;
  color: var(--theme-text-muted, var(--vn-muted));
  text-transform: uppercase;
  white-space: nowrap;
}

.rule-line {
  height: 1px;
  background: var(--vn-border);
}

.size-select-label {
  font-size: 0.7rem;
  font-family: monospace;
  color: var(--theme-text-muted, var(--vn-muted));
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
}

.grid-size-hint {
  font-size: 0.5rem;
  font-family: monospace;
  color: var(--theme-text-muted, var(--vn-muted));
  letter-spacing: 0.1em;
  margin-top: 0.5rem;
  text-align: center;
}

.score-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.2rem 0.75rem;
  border: 1px solid var(--vn-border);
  background: rgba(58, 51, 44, 0.5);
  min-width: 3.5rem;
}

.score-label {
  font-family: monospace;
  font-size: 0.5rem;
  letter-spacing: 0.15em;
  color: var(--theme-text-muted, var(--vn-muted));
  text-transform: uppercase;
}

.score-value {
  font-family: serif;
  font-weight: 900;
  font-size: 1.1rem;
  line-height: 1.2;
  color: var(--theme-text-main, var(--vn-fg));
}

.vn-2048-empty-cell {
  background: rgba(74, 64, 53, 0.35);
  border: 1px dashed rgba(90, 79, 64, 0.4);
}

.vn-2048-tile-num {
  border-radius: 2px;
  box-sizing: border-box;
}

.vn-2048-overlay {
  z-index: 10;
  background: rgba(42, 36, 32, 0.85);
}

.vn-2048-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 2px solid var(--vn-border);
  padding: 1.5rem;
  max-width: 20rem;
  width: 90%;
  background: var(--vn-panel-bg);
}

.vn-2048-dialog-title {
  font-family: serif;
  font-weight: 900;
  font-size: 1.5rem;
  color: var(--theme-text-main, var(--vn-fg));
}

.vn-2048-dialog-desc {
  font-family: monospace;
  font-size: 0.7rem;
  color: var(--theme-text-muted, var(--vn-muted));
  letter-spacing: 0.05em;
  margin: 0.5rem 0 1rem;
}

.vn-2048-dialog-accent {
  font-size: 0.55rem;
  font-family: monospace;
  letter-spacing: 0.2em;
  color: var(--theme-accent, var(--rust));
  text-transform: uppercase;
}

.vn-2048-btn-wrap {
  transition: transform 0.2s ease;
}

.vn-2048-btn-wrap:hover {
  transform: translateY(-2px);
}
</style>
