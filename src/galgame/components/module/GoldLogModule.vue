<template>
  <div class="px-5 py-4">
    <div v-if="store.transactionLog.length === 0" class="text-center py-8">
      <i class="fa-solid fa-scroll" style="font-size: 2rem; color: rgba(139, 125, 107, 0.2); margin-bottom: 8px" />
      <p style="font-size: 11px; color: var(--theme-text-muted, var(--vn-muted))">暂无交易记录</p>
    </div>

    <div v-else class="flex flex-col gap-0">
      <div
        v-for="(tx, i) in store.transactionLog"
        :key="i"
        class="flex items-center gap-3 py-2.5 px-2"
        :style="{ borderBottom: i < store.transactionLog.length - 1 ? '1px solid rgba(90,79,64,0.1)' : 'none' }"
      >
        <div class="w-12 shrink-0">
          <div
            class="text-center border px-1 py-0.5"
            :style="{
              borderColor: 'rgba(90,79,64,0.25)',
              borderRadius: '2px',
              fontSize: '8px',
              color: 'var(--theme-text-muted, var(--vn-muted))',
              fontFamily: 'monospace',
            }"
          >
            {{ formatModule(tx.moduleId) }}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-xs truncate" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">
            {{ tx.reason }}
          </div>
          <div
            style="
              font-size: 8px;
              color: var(--theme-text-faint, rgba(139, 125, 107, 0.4));
              font-family: monospace;
              margin-top: 2px;
            "
          >
            {{ formatTime(tx.timestamp) }}
          </div>
        </div>
        <div
          class="font-mono font-bold shrink-0"
          :style="{ fontSize: '12px', color: tx.amount >= 0 ? 'var(--vn-success)' : 'var(--vn-danger)' }"
        >
          {{ tx.amount >= 0 ? '+' : '' }}{{ tx.amount }}G
        </div>
      </div>
    </div>

    <div
      v-if="store.transactionLog.length > 0"
      class="mt-4 pt-3 flex items-center justify-between"
      :style="{ borderTop: '1px solid rgba(90,79,64,0.15)' }"
    >
      <span style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted)); font-family: monospace">
        共 {{ store.transactionLog.length }}/50 条 · 余额 {{ store.gold }}G
      </span>
      <button
        class="flex items-center gap-1 px-2 py-1 border text-xs cursor-pointer transition-all"
        style="
          border-color: rgba(139, 37, 0, 0.3);
          border-radius: 2px;
          color: var(--vn-danger);
          font-size: 9px;
          font-family: monospace;
        "
        @click="handleClear"
      >
        <i class="fa-solid fa-trash-can" style="font-size: 0.55rem" />
        清空
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVNStore } from '../../store';
const store = useVNStore();

function handleClear() {
  store.clearTransactionLog();
  store.showToast('记录已清空');
}

function formatModule(id: string) {
  const map: Record<string, string> = {
    shop: '商店',
    idle_workshop: '工坊',
    stock_market: '交易',
    puzzle_2048: '2048',
    ai_riddle: '猜谜',
  };
  return map[id] ?? id;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}
</script>
