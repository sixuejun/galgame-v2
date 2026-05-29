<template>
  <div class="px-5 py-4">
    <div v-if="store.inventory.length === 0" class="text-center py-8">
      <i class="fa-solid fa-box-open" style="font-size: 2rem; color: rgba(139, 125, 107, 0.2); margin-bottom: 8px" />
      <p style="font-size: 11px; color: var(--theme-text-muted, var(--vn-muted))">背包空空如也</p>
      <p style="font-size: 9px; color: var(--theme-text-faint, rgba(139, 125, 107, 0.4)); margin-top: 4px">
        前往商店购买物品
      </p>
    </div>

    <div v-else class="flex flex-col gap-3">
      <!-- Grid of item cards -->
      <div
        class="grid gap-2"
        :style="{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }"
      >
        <button
          v-for="item in store.inventory"
          :key="item.name"
          type="button"
          class="module-card p-2 flex flex-col items-center gap-1 cursor-pointer transition-all"
          :style="{
            borderRadius: '2px',
            borderColor:
              selectedName === item.name ? 'rgba(196,162,101,0.55)' : 'rgba(90,79,64,0.2)',
            background:
              selectedName === item.name ? 'rgba(139,69,19,0.12)' : 'rgba(74,64,53,0.08)',
          }"
          @click="selectedName = item.name"
        >
          <div
            class="w-10 h-10 border flex items-center justify-center shrink-0"
            :style="{ borderColor: 'rgba(90,79,64,0.28)', background: 'rgba(74,64,53,0.16)', borderRadius: '2px' }"
          >
            <span v-if="item.icon" class="text-xl">{{ item.icon }}</span>
            <i v-else class="fa-solid fa-cube" style="color: rgba(139, 69, 19, 0.45)" />
          </div>
          <div class="w-full text-center">
            <div class="truncate" style="font-size: 10px; color: var(--theme-text-main, rgba(212, 197, 160, 0.92))">
              {{ item.name }}
            </div>
            <div class="font-mono" style="font-size: 9px; color: var(--theme-accent, var(--rust))">x{{ item.quantity }}</div>
          </div>
        </button>
      </div>

      <!-- Detail panel -->
      <div class="module-card p-3" :style="{ borderRadius: '2px' }">
        <div v-if="!selectedItem" style="font-size: 11px; color: var(--theme-text-muted, var(--vn-muted))">
          点击上方物品查看详情
        </div>
        <div v-else class="flex items-start gap-3">
          <div
            class="w-12 h-12 border flex items-center justify-center shrink-0"
            :style="{ borderColor: 'rgba(90,79,64,0.3)', background: 'rgba(74,64,53,0.2)', borderRadius: '2px' }"
          >
            <span v-if="selectedItem.icon" class="text-2xl">{{ selectedItem.icon }}</span>
            <i v-else class="fa-solid fa-cube" style="color: rgba(139, 69, 19, 0.45)" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.92))">
                {{ selectedItem.name }}
              </span>
              <span class="font-mono" style="font-size: 10px; color: var(--theme-accent, var(--rust))">
                x{{ selectedItem.quantity }}
              </span>
            </div>
            <p style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted)); margin-top: 6px; line-height: 1.5">
              {{ selectedItem.effect }}
            </p>
          </div>
        </div>
      </div>

      <!-- Item count -->
      <div class="pt-2 text-center" :style="{ borderTop: '1px solid rgba(90,79,64,0.15)' }">
        <span style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted)); font-family: monospace">
          共 {{ store.inventory.reduce((s, i) => s + i.quantity, 0) }} 件物品
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useVNStore } from '../../store';

const store = useVNStore();
const selectedName = ref<string>('');

const selectedItem = computed(() => store.inventory.find(i => i.name === selectedName.value) ?? null);

watchEffect(() => {
  if (store.inventory.length === 0) {
    selectedName.value = '';
    return;
  }
  if (!selectedName.value || !store.inventory.some(i => i.name === selectedName.value)) {
    selectedName.value = store.inventory[0]!.name;
  }
});
</script>
