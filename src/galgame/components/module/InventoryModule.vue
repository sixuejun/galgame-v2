<template>
  <div class="px-5 py-4">
    <div v-if="store.inventory.length === 0" class="text-center py-8">
      <i class="fa-solid fa-box-open" style="font-size: 2rem; color: rgba(139, 125, 107, 0.2); margin-bottom: 8px" />
      <p style="font-size: 11px; color: var(--theme-text-muted, var(--vn-muted))">背包空空如也</p>
      <p style="font-size: 9px; color: var(--theme-text-faint, rgba(139, 125, 107, 0.4)); margin-top: 4px">
        前往商店购买物品
      </p>
    </div>

    <div v-else class="flex flex-col gap-2">
      <div v-for="item in store.inventory" :key="item.id" class="module-card p-3 flex items-center gap-3">
        <div
          class="w-10 h-10 border flex items-center justify-center shrink-0"
          :style="{ borderColor: 'rgba(90,79,64,0.3)', background: 'rgba(74,64,53,0.2)', borderRadius: '2px' }"
        >
          <i class="fa-solid fa-cube" style="color: rgba(139, 69, 19, 0.4)" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">{{
              item.name
            }}</span>
            <span
              v-if="item.quantity > 1"
              class="font-mono"
              style="font-size: 9px; color: var(--theme-accent, var(--rust))"
              >x{{ item.quantity }}</span
            >
          </div>
          <p style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted)); margin-top: 2px">
            {{ item.effect }}
          </p>
        </div>
      </div>
    </div>

    <!-- Item count -->
    <div
      v-if="store.inventory.length > 0"
      class="mt-4 pt-3 text-center"
      :style="{ borderTop: '1px solid rgba(90,79,64,0.15)' }"
    >
      <span style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted)); font-family: monospace">
        共 {{ store.inventory.reduce((s, i) => s + i.quantity, 0) }} 件物品
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVNStore } from '../../store';
const store = useVNStore();
</script>
