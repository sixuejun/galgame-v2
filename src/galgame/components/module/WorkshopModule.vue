<template>
  <div class="px-5 py-4">
    <!-- Workshop level -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <span class="text-sm font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))"
          >工坊等级 {{ store.workshopLevel }}</span
        >
        <span
          v-if="store.workshopLevel < 10"
          style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted)); margin-left: 8px"
        >
          升级加成: {{ (store.workshopLevel - 1) * 10 }}%
        </span>
        <span v-else style="font-size: 9px; color: var(--theme-accent, var(--rust)); margin-left: 8px">已满级</span>
      </div>
      <button
        v-if="store.workshopLevel < 10"
        class="flex items-center gap-1.5 px-2.5 py-1 border text-xs cursor-pointer transition-all"
        :style="{
          borderColor: canUpgrade ? 'var(--theme-accent, var(--rust))' : 'rgba(90,79,64,0.2)',
          color: canUpgrade ? 'var(--theme-text-main, var(--vn-fg))' : 'var(--theme-text-muted, var(--vn-muted))',
          background: canUpgrade ? 'rgba(139,69,19,0.15)' : 'transparent',
          borderRadius: '2px',
          opacity: canUpgrade ? 1 : 0.5,
        }"
        @click="store.upgradeWorkshop()"
      >
        <i class="fa-solid fa-arrow-up" style="font-size: 0.6rem" />
        <span>升级 ({{ upgradeCost }}G)</span>
      </button>
    </div>

    <!-- Level bar -->
    <div class="mb-5 h-1.5" style="background: rgba(90, 79, 64, 0.3); border-radius: 1px">
      <div
        class="h-full transition-all duration-300"
        :style="{
          width: store.workshopLevel * 10 + '%',
          background: 'var(--theme-accent, var(--rust))',
          borderRadius: '1px',
        }"
      />
    </div>

    <!-- Production status -->
    <div v-if="store.workshopCharacterId" class="module-card p-4 mb-4">
      <div class="flex items-center justify-between mb-2">
        <span
          class="text-xs font-bold"
          :style="{ color: store.workshopProducing ? 'var(--vn-success)' : 'var(--stain)' }"
        >
          <i
            :class="store.workshopProducing ? 'fa-solid fa-gear fa-spin' : 'fa-solid fa-pause'"
            style="margin-right: 4px; font-size: 0.7rem"
          />
          {{ store.workshopProducing ? '正在生产' : '已暂停' }}
        </span>
        <span class="font-mono text-xs" style="color: var(--stain)">+{{ currentEarning }}G</span>
      </div>
      <p style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted))">
        {{ producingChar?.name ?? '???' }} · {{ elapsedStr }}
      </p>
      <div class="flex gap-2 mt-3">
        <button
          class="flex-1 py-1.5 border text-xs cursor-pointer transition-all text-center"
          :style="{
            borderColor: store.workshopProducing ? 'var(--stain)' : 'var(--vn-success)',
            color: store.workshopProducing ? 'var(--stain)' : 'var(--vn-success)',
            borderRadius: '2px',
          }"
          @click="store.workshopProducing ? store.pauseProduction() : store.resumeProduction()"
        >
          <i
            :class="store.workshopProducing ? 'fa-solid fa-pause' : 'fa-solid fa-play'"
            style="margin-right: 4px; font-size: 0.6rem"
          />
          {{ store.workshopProducing ? '暂停' : '继续' }}
        </button>
        <button
          class="flex-1 py-1.5 border text-xs cursor-pointer transition-all text-center"
          style="border-color: var(--vn-danger); color: var(--vn-danger); border-radius: 2px"
          @click="handleStop"
        >
          停止结算
        </button>
      </div>
    </div>

    <!-- Character selection -->
    <div v-if="!store.workshopCharacterId" class="mb-4">
      <div class="mb-2" style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted)); letter-spacing: 0.1em">
        --- 选择角色开始生产 ---
      </div>
      <div class="flex flex-col gap-2">
        <div v-for="char in unlockedChars" :key="char.id" class="module-card p-3 flex items-center gap-3">
          <div
            class="w-10 h-10 border flex items-center justify-center shrink-0"
            :style="{ borderColor: 'rgba(90,79,64,0.3)', background: 'rgba(74,64,53,0.2)' }"
          >
            <i class="fa-solid fa-user" style="color: var(--theme-text-faint, rgba(139, 125, 107, 0.3))" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">
              {{ char.name }}
            </div>
            <p style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted))">
              速度 {{ char.productionSpeed }}x · 产出 {{ char.productionYield }}/s
            </p>
          </div>
          <button
            class="px-2.5 py-1 border text-xs cursor-pointer"
            style="
              border-color: var(--theme-accent, var(--rust));
              color: var(--theme-text-main, var(--vn-fg));
              border-radius: 2px;
            "
            @click="store.startProduction(char.id)"
          >
            生产
          </button>
        </div>
      </div>
    </div>

    <!-- ====== Divider: Stock Market Section ====== -->
    <div class="my-4 flex items-center gap-2">
      <div
        class="flex-1"
        style="height: 1px; background: linear-gradient(to right, transparent, rgba(139, 69, 19, 0.3), transparent)"
      />
      <span
        style="font-size: 9px; color: var(--theme-accent, var(--rust)); font-family: monospace; letter-spacing: 0.1em"
        >风险与机遇</span
      >
      <div
        class="flex-1"
        style="height: 1px; background: linear-gradient(to right, transparent, rgba(139, 69, 19, 0.3), transparent)"
      />
    </div>

    <StockMarketModule />
  </div>
</template>

<script setup lang="ts">
import StockMarketModule from './StockMarketModule.vue';
import { useVNStore } from '../../store';

const store = useVNStore();

const upgradeCost = computed(() => store.workshopLevel * 200);
const canUpgrade = computed(() => store.gold >= upgradeCost.value && store.workshopLevel < 10);
const unlockedChars = computed(() => store.characterRoster.filter(c => c.unlocked));
const producingChar = computed(() => store.characterRoster.find(c => c.id === store.workshopCharacterId));

const currentEarning = ref(0);
const elapsedStr = ref('0s');
let ticker: ReturnType<typeof setInterval> | null = null;

function startTicker() {
  if (ticker) clearInterval(ticker);
  ticker = setInterval(() => {
    if (!store.workshopStartTime) {
      currentEarning.value = store.workshopAccumulated;
      return;
    }
    const elapsed = (Date.now() - store.workshopStartTime) / 1000;
    const char = producingChar.value;
    if (!char) return;
    const bonus = 1 + (store.workshopLevel - 1) * 0.1;
    currentEarning.value =
      store.workshopAccumulated + Math.floor(elapsed * char.productionSpeed * char.productionYield * bonus);
    const totalSec = Math.floor((store.workshopAccumulated > 0 ? 0 : 0) + elapsed);
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    elapsedStr.value = m > 0 ? `${m}m ${s}s` : `${s}s`;
  }, 500);
}

watch(
  () => store.workshopCharacterId,
  v => {
    if (v) startTicker();
    else if (ticker) {
      clearInterval(ticker);
      ticker = null;
      currentEarning.value = 0;
      elapsedStr.value = '0s';
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  if (ticker) clearInterval(ticker);
});

function handleStop() {
  const earned = store.stopProductionAndSettle();
  store.showToast(`结算收益: +${earned}G`);
}
</script>
