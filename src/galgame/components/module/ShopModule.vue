<template>
  <div>
    <!-- Refresh bar -->
    <div class="flex items-center justify-between px-5 py-3" :style="{ borderBottom: '1px solid rgba(90,79,64,0.2)' }">
      <div class="gold-counter">
        <i class="fa-solid fa-coins" style="font-size: 0.7rem" />
        <span class="font-bold">{{ store.gold }}</span>
      </div>
      <button
        class="flex items-center gap-2 px-3 py-1.5 border text-xs cursor-pointer transition-all"
        :style="{
          borderColor: store.shopRefreshing ? 'rgba(90,79,64,0.2)' : 'var(--theme-accent, var(--rust))',
          background: store.shopRefreshing ? 'transparent' : 'rgba(139,69,19,0.15)',
          color: store.shopRefreshing
            ? 'var(--theme-text-muted, var(--vn-muted))'
            : 'var(--theme-text-main, var(--vn-fg))',
          borderRadius: '2px',
          opacity: store.shopRefreshing ? 0.5 : 1,
        }"
        :disabled="store.shopRefreshing"
        @click="store.refreshShop()"
      >
        <i class="fa-solid fa-rotate" :class="{ 'fa-spin': store.shopRefreshing }" style="font-size: 0.7rem" />
        <span>刷新 ({{ refreshCost }}G)</span>
      </button>
    </div>

    <!-- Shop items -->
    <div class="px-5 py-4">
      <div v-if="store.shopItems.length === 0" class="text-center py-8">
        <i class="fa-solid fa-shop" style="font-size: 2rem; color: rgba(139, 125, 107, 0.2); margin-bottom: 8px" />
        <p style="font-size: 11px; color: var(--theme-text-muted, var(--vn-muted))">
          {{ store.shopRefreshing ? '商品生成中…' : '点击刷新补充商品' }}
        </p>
      </div>
      <div v-else class="flex flex-col gap-2">
        <div v-for="item in store.shopItems" :key="item.id" class="module-card p-3 flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">
              {{ item.name }}
            </div>
            <p style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted)); margin-top: 2px">
              {{ item.effect }}
            </p>
          </div>
          <button
            class="flex items-center gap-1.5 px-2.5 py-1 border text-xs cursor-pointer transition-all shrink-0"
            :style="{
              borderColor: store.gold >= item.price ? 'rgba(196,162,101,0.5)' : 'rgba(90,79,64,0.2)',
              color: store.gold >= item.price ? 'var(--stain)' : 'var(--theme-text-muted, var(--vn-muted))',
              borderRadius: '2px',
              opacity: store.gold >= item.price ? 1 : 0.5,
            }"
            @click="store.purchaseShopItem(item.id)"
          >
            <i class="fa-solid fa-coins" style="font-size: 0.6rem" />
            <span>{{ item.price }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { calcCommission, useVNStore } from '../../store';

const store = useVNStore();

const refreshCost = computed(() => calcCommission(store.gold, store.workshopLevel, 50));
</script>
