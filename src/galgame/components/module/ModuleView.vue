<template>
  <div class="absolute inset-0 flex items-center justify-center" style="z-index: 55">
    <div
      class="absolute inset-0 backdrop-blur-sm"
      style="background: rgba(42, 36, 32, 0.8)"
      @click="handleBackdropClose"
    />

    <!-- Special: dispatch module with custom wide panel -->
    <template v-if="moduleId === 'dispatch'">
      <div class="relative mx-4 border overflow-hidden animate-fade-in-up" :style="dispatchPanel">
        <div
          :style="{
            height: '3px',
            background:
              'linear-gradient(to right, transparent, var(--theme-accent-soft, rgba(139,69,19,0.6)), transparent)',
          }"
        />
        <div
          class="flex items-center justify-between px-5 py-2.5"
          :style="{ borderBottom: '1px solid rgba(90,79,64,0.3)' }"
        >
          <div class="flex items-center gap-3">
            <span style="color: var(--theme-accent, var(--rust))"
              ><i class="fa-solid fa-route" style="font-size: 0.9rem"
            /></span>
            <h2
              class="text-sm font-bold tracking-widest"
              style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))"
            >
              废土行路
            </h2>
          </div>
          <button
            class="flex items-center gap-1 text-xs cursor-pointer"
            style="color: var(--theme-text-muted, var(--vn-muted))"
            @click="$emit('close')"
          >
            <i class="fa-solid fa-arrow-left" style="font-size: 0.75rem" />
            <span>返回</span>
          </button>
        </div>
        <DispatchModule @close="$emit('close')" />
      </div>
    </template>

    <!-- Special: 2048 fills the window with its own header -->
    <template v-else-if="moduleId === 'puzzle_2048'">
      <div class="relative mx-4 border overflow-hidden animate-fade-in-up" :style="puzzle2048Panel">
        <Puzzle2048Module @close="$emit('close')" />
      </div>
    </template>

    <!-- Standard module layout -->
    <template v-else-if="resolvedMod">
      <div class="relative w-full max-w-xl mx-4 border overflow-hidden animate-fade-in-up" :style="panelStyle">
        <div
          :style="{
            height: '3px',
            background:
              'linear-gradient(to right, transparent, var(--theme-accent-soft, rgba(139,69,19,0.6)), transparent)',
          }"
        />

        <!-- Header -->
        <div
          class="flex items-center justify-between px-6 py-3"
          :style="{ borderBottom: '1px solid rgba(90,79,64,0.3)' }"
        >
          <div class="flex items-center gap-3">
            <span style="color: var(--theme-accent, var(--rust))"
              ><i :class="'fa-solid ' + resolvedMod.icon" style="font-size: 1rem"
            /></span>
            <h2
              class="text-sm font-bold tracking-widest"
              style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))"
            >
              {{ resolvedMod.displayName }}
            </h2>
          </div>
          <button
            class="flex items-center gap-1 text-xs cursor-pointer transition-colors"
            style="color: var(--theme-text-muted, var(--vn-muted))"
            @click="$emit('close')"
          >
            <i class="fa-solid fa-arrow-left" style="font-size: 0.75rem" />
            <span>返回</span>
          </button>
        </div>

        <!-- Module content -->
        <div class="overflow-y-auto no-scrollbar flex-1" style="max-height: calc(100vh - 180px)">
          <ShopModule v-if="moduleId === 'shop'" />
          <WorkshopModule v-else-if="moduleId === 'idle_workshop'" />
          <RiddleModule v-else-if="moduleId === 'ai_riddle'" />
          <InventoryModule v-else-if="moduleId === 'inventory'" />
          <GoldLogModule v-else-if="moduleId === 'gold_log'" />
          <CharacterManagementModule v-else-if="moduleId === 'character_management'" />

          <!-- Fallback -->
          <div v-else class="px-6 py-12 flex flex-col items-center justify-center text-center">
            <div
              class="w-16 h-16 border flex items-center justify-center mb-4"
              :style="{
                borderColor: 'rgba(90,79,64,0.3)',
                background: 'rgba(74,64,53,0.1)',
              }"
            >
              <i :class="'fa-solid ' + resolvedMod.icon" style="color: rgba(139, 69, 19, 0.4); font-size: 1.5rem" />
            </div>
            <p class="text-sm" style="color: var(--theme-text-muted, var(--vn-muted))">
              {{ resolvedMod.description }}
            </p>
          </div>
        </div>

        <div
          :style="{
            height: '2px',
            background:
              'linear-gradient(to right, transparent, var(--theme-accent-soft, rgba(139,69,19,0.5)), transparent)',
          }"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import CharacterManagementModule from './CharacterManagementModule.vue';
import DispatchModule from '../../dispatch/DispatchModule.vue';
import GoldLogModule from './GoldLogModule.vue';
import InventoryModule from './InventoryModule.vue';
import Puzzle2048Module from './Puzzle2048Module.vue';
import RiddleModule from './RiddleModule.vue';
import ShopModule from './ShopModule.vue';
import type { GameModule } from './store';
import { useVNStore } from '../../store';
import WorkshopModule from './WorkshopModule.vue';

const props = defineProps<{ moduleId: string }>();
defineEmits<{ close: [] }>();

const store = useVNStore();

const FALLBACK_MODULES: Record<string, GameModule> = {
  gold_log: {
    moduleId: 'gold_log',
    displayName: '金币记录',
    description: '查看金币变动日志',
    icon: 'fa-scroll',
    openMode: 'overlay',
    closeBehavior: 'returnHub',
  },
};

const resolvedMod = computed(() => {
  const found = store.gameModules.find(m => m.moduleId === props.moduleId);
  if (found) return found;
  return FALLBACK_MODULES[props.moduleId] ?? null;
});

const panelStyle = {
  maxHeight: 'calc(100vh - 80px)',
  borderColor: 'rgba(90,79,64,0.6)',
  background: 'var(--vn-panel-bg)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const puzzle2048Panel = {
  maxHeight: 'calc(100vh - 80px)',
  maxWidth: '28rem',
  width: '100%',
  borderColor: 'var(--vn-border)',
  background: 'var(--vn-bg)',
  overflow: 'auto' as const,
  display: 'flex',
  flexDirection: 'column',
};

const dispatchPanel = {
  maxHeight: 'calc(100vh - 80px)',
  maxWidth: '800px',
  width: '100%',
  borderColor: 'rgba(90,79,64,0.6)',
  background: 'var(--vn-panel-bg)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  flexDirection: 'column',
};

function handleBackdropClose() {
  if (store.workshopProducing && props.moduleId === 'idle_workshop') return;
}
</script>
