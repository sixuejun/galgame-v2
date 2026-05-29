<template>
  <div>
    <!-- Top bar: controls -->
    <div class="flex items-center gap-2 mb-3">
      <div class="gold-counter">
        <i class="fa-solid fa-coins" style="font-size: 0.65rem" />
        <span class="font-bold text-xs">{{ store.gold }}</span>
      </div>
      <div class="flex-1" />
      <button
        class="w-7 h-7 flex items-center justify-center border cursor-pointer"
        style="border-color: rgba(90, 79, 64, 0.3); border-radius: 2px"
        :style="{ color: store.stockActive && !store.stockPaused ? 'var(--stain)' : 'var(--vn-success)' }"
        title="暂停/继续"
        :disabled="!store.stockActive"
        @click="store.stockActive && store.toggleStockPause()"
      >
        <i :class="store.stockPaused ? 'fa-solid fa-play' : 'fa-solid fa-pause'" style="font-size: 0.6rem" />
      </button>
      <button
        class="w-7 h-7 flex items-center justify-center border cursor-pointer"
        style="border-color: rgba(90, 79, 64, 0.3); border-radius: 2px; color: var(--theme-text-muted, var(--vn-muted))"
        title="刷新行情"
        @click="handleRefresh"
      >
        <i class="fa-solid fa-rotate" style="font-size: 0.6rem" />
      </button>
    </div>

    <!-- Stats row -->
    <div class="flex items-center gap-3 mb-3">
      <div>
        <div style="font-size: 8px; color: var(--theme-text-muted, var(--vn-muted))">价格</div>
        <div class="flex items-center gap-1">
          <span class="font-mono font-bold text-sm" style="color: var(--theme-text-main, var(--vn-fg))">{{
            store.stockPrice.toFixed(2)
          }}</span>
          <i
            v-if="store.stockLastDirection === 'up'"
            class="fa-solid fa-arrow-up"
            style="font-size: 0.55rem; color: var(--vn-success)"
          />
          <i
            v-else-if="store.stockLastDirection === 'down'"
            class="fa-solid fa-arrow-down"
            style="font-size: 0.55rem; color: var(--vn-danger)"
          />
        </div>
      </div>
      <div>
        <div style="font-size: 8px; color: var(--theme-text-muted, var(--vn-muted))">持仓</div>
        <div class="font-mono text-sm" style="color: var(--theme-text-main, var(--vn-fg))">
          {{ store.stockPosition }}
        </div>
      </div>
      <div>
        <div style="font-size: 8px; color: var(--theme-text-muted, var(--vn-muted))">持仓价值</div>
        <div class="font-mono text-sm" style="color: var(--stain)">{{ positionValue.toFixed(0) }}</div>
      </div>
      <div class="flex-1" />
      <div>
        <div style="font-size: 8px; color: var(--theme-text-muted, var(--vn-muted))">预计收益</div>
        <div
          class="font-mono text-sm font-bold"
          :style="{ color: estimatedProfit >= 0 ? 'var(--vn-success)' : 'var(--vn-danger)' }"
        >
          {{ estimatedProfit >= 0 ? '+' : '' }}{{ estimatedProfit.toFixed(0) }}
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div class="stock-chart-container mb-3" ref="chartWrapper">
      <canvas ref="chartCanvas" />
    </div>

    <!-- Trade buttons: + / position / - -->
    <div class="flex items-center gap-2 mb-3">
      <button
        class="flex-1 py-2 border text-sm cursor-pointer text-center font-bold transition-all"
        :style="{
          borderColor: canBuy ? 'var(--vn-success)' : 'rgba(90,79,64,0.2)',
          color: canBuy ? 'var(--vn-success)' : 'var(--theme-text-muted, var(--vn-muted))',
          borderRadius: '2px',
          opacity: canBuy ? 1 : 0.5,
        }"
        :disabled="!canBuy"
        @click="handleBuy"
      >
        <i class="fa-solid fa-plus" style="font-size: 0.7rem; margin-right: 4px" />
        买入
      </button>
      <div
        class="px-3 py-2 text-center border"
        style="border-color: rgba(90, 79, 64, 0.3); border-radius: 2px; min-width: 60px"
      >
        <div style="font-size: 7px; color: var(--theme-text-muted, var(--vn-muted))">持仓</div>
        <div class="font-mono font-bold text-sm" style="color: var(--theme-text-main, var(--vn-fg))">
          {{ store.stockPosition }}
        </div>
      </div>
      <button
        class="flex-1 py-2 border text-sm cursor-pointer text-center font-bold transition-all"
        :style="{
          borderColor: canSell ? 'var(--vn-danger)' : 'rgba(90,79,64,0.2)',
          color: canSell ? 'var(--vn-danger)' : 'var(--theme-text-muted, var(--vn-muted))',
          borderRadius: '2px',
          opacity: canSell ? 1 : 0.5,
        }"
        :disabled="!canSell"
        @click="handleSell"
      >
        <i class="fa-solid fa-minus" style="font-size: 0.7rem; margin-right: 4px" />
        卖出
      </button>
    </div>

    <!-- Fee & Exit -->
    <div class="flex items-center justify-between">
      <span style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted)); font-family: monospace"
        >手续费: {{ fee }}G/笔</span
      >
      <button
        v-if="store.stockActive"
        class="px-3 py-1.5 border text-xs cursor-pointer text-center"
        style="border-color: rgba(90, 79, 64, 0.4); color: var(--theme-text-muted, var(--vn-muted)); border-radius: 2px"
        @click="handleExit"
      >
        退出股市 (自动平仓)
      </button>
      <button
        v-else
        class="px-3 py-1.5 border text-xs cursor-pointer text-center"
        style="
          border-color: var(--theme-accent, var(--rust));
          color: var(--theme-text-main, var(--vn-fg));
          background: rgba(139, 69, 19, 0.15);
          border-radius: 2px;
        "
        @click="store.enterStockMarket()"
      >
        进入股市
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { calcStockFee, useVNStore } from '../../store';

const store = useVNStore();
const chartCanvas = ref<HTMLCanvasElement | null>(null);
const chartWrapper = ref<HTMLDivElement | null>(null);

const fee = computed(() => calcStockFee(store.workshopLevel));
const positionValue = computed(() => store.stockPosition * store.stockPrice);
const estimatedProfit = computed(() => {
  if (store.stockPosition === 0) return 0;
  return store.stockPosition * store.stockPrice - fee.value * store.stockPosition - store.stockInvested;
});
const canBuy = computed(
  () => store.stockActive && !store.stockPaused && store.gold >= Math.ceil(store.stockPrice) + fee.value,
);
const canSell = computed(() => store.stockActive && !store.stockPaused && store.stockPosition > 0);

function handleBuy() {
  if (!store.stockBuy()) store.showToast('金币不足');
}

function handleSell() {
  if (!store.stockSell()) store.showToast('持仓不足');
}

function handleExit() {
  store.exitStockMarket();
  store.showToast('已退出股市');
}

function handleRefresh() {
  if (store.stockActive) store.exitStockMarket();
  store.resetStock();
  store.showToast('行情已刷新');
}

function drawChart() {
  const canvas = chartCanvas.value;
  const wrapper = chartWrapper.value;
  if (!canvas || !wrapper) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = wrapper.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = 'rgba(58,51,44,0.3)';
  ctx.fillRect(0, 0, w, h);

  const data = store.stockHistory;
  if (data.length < 2) return;
  const min = Math.min(...data) * 0.95;
  const max = Math.max(...data) * 1.05;
  const range = max - min || 1;

  // Grid lines
  ctx.strokeStyle = 'rgba(90,79,64,0.2)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 5; i++) {
    const y = (h / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    // Price labels
    const labelVal = max - (range / 5) * i;
    ctx.fillStyle = 'var(--theme-text-faint, rgba(139,125,107,0.4))';
    ctx.font = '9px monospace';
    ctx.fillText(labelVal.toFixed(0), 3, y - 2);
  }
  // Vertical grid
  const vLines = Math.min(data.length, 6);
  for (let i = 1; i < vLines; i++) {
    const x = (w / vLines) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // Price line
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
    const y = h - ((data[i] - min) / range) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  const lastPrice = data[data.length - 1];
  const prevPrice = data.length > 1 ? data[data.length - 2] : lastPrice;
  ctx.strokeStyle = lastPrice >= prevPrice ? 'rgba(90,122,74,0.9)' : 'rgba(139,37,0,0.9)';
  ctx.stroke();

  // Gradient fill under line
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  if (lastPrice >= prevPrice) {
    gradient.addColorStop(0, 'rgba(90,122,74,0.15)');
    gradient.addColorStop(1, 'rgba(90,122,74,0)');
  } else {
    gradient.addColorStop(0, 'rgba(139,37,0,0.15)');
    gradient.addColorStop(1, 'rgba(139,37,0,0)');
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Current dot
  const lastX = data.length === 1 ? w / 2 : w;
  const lastY = h - ((lastPrice - min) / range) * h;
  ctx.fillStyle = lastPrice >= prevPrice ? '#5a7a4a' : '#8b2500';
  ctx.beginPath();
  ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

watch(
  () => store.stockHistory,
  () => nextTick(drawChart),
  { deep: true },
);

onMounted(() => {
  nextTick(() => setTimeout(drawChart, 100));
});

let resizeObserver: ResizeObserver | null = null;
onMounted(() => {
  if (chartWrapper.value) {
    resizeObserver = new ResizeObserver(() => drawChart());
    resizeObserver.observe(chartWrapper.value);
  }
});
onUnmounted(() => {
  resizeObserver?.disconnect();
});
</script>
