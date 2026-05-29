<template>
  <div class="app-root vignette" style="width: 100%; height: 100%; position: relative; overflow: hidden;">
    <!-- Header banner -->
    <header class="header-banner">
      <div class="header-line"></div>
      <h1 class="header-title font-headline text-shadow-ink">
        <span class="font-english" style="font-size: 0.55em; letter-spacing: 0.15em; display: block; margin-bottom: 2px;">
          DOOMSDAY MARCH
        </span>
        末日行路
      </h1>
      <div class="header-subtitle font-body">
        第 {{ turnCount }} 步 &middot; 
        <span :style="{ color: phaseLabel.color }">{{ phaseLabel.text }}</span>
      </div>
      <div class="header-line"></div>
    </header>

    <!-- Main game area -->
    <div class="game-layout">
      <!-- Map container with scroll -->
      <div class="map-viewport" ref="mapViewport">
        <GameMap />
      </div>

      <!-- Right sidebar panel -->
      <aside class="sidebar-panel">
        <PlayerStatus />
        <DicePanel />
        <GameLog />
      </aside>
    </div>

    <!-- Event overlay -->
    <Transition name="fade">
      <EventOverlay v-if="store.phase === 'event' || store.phase === 'resolving'" />
    </Transition>

    <!-- Death / Insanity overlay -->
    <Transition name="fade">
      <GameOverOverlay v-if="store.isPlayerDead || store.isPlayerInsane" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import GameMap from '@/components/GameMap.vue'
import PlayerStatus from '@/components/PlayerStatus.vue'
import DicePanel from '@/components/DicePanel.vue'
import GameLog from '@/components/GameLog.vue'
import EventOverlay from '@/components/EventOverlay.vue'
import GameOverOverlay from '@/components/GameOverOverlay.vue'

const store = useGameStore()
const mapViewport = ref<HTMLElement>()

const turnCount = computed(() => store.moveHistory.length > 0 ? store.moveHistory.length - 1 : 0)

const phaseLabel = computed(() => {
  const labels: Record<string, { text: string; color: string }> = {
    idle:         { text: '等待掷骰', color: 'var(--color-muted)' },
    rolling:      { text: '掷骰中...', color: 'var(--color-highlight)' },
    choosingPath: { text: `选择路径 (剩余${store.stepsRemaining}步)`, color: 'var(--color-rust)' },
    event:        { text: '事件触发', color: 'var(--color-blood)' },
    resolving:    { text: '结算中...', color: 'var(--color-rust-glow)' },
  }
  return labels[store.phase] || labels.idle
})
</script>

<style scoped>
.header-banner {
  text-align: center;
  padding: 8px 16px 6px;
  background: linear-gradient(180deg, rgba(42, 33, 24, 0.08), transparent);
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}
.header-line {
  height: 1.5px;
  background: linear-gradient(90deg, transparent, var(--color-ink), transparent);
  margin: 4px auto;
  max-width: 600px;
  opacity: 0.3;
}
.header-title {
  font-size: 1.3rem;
  color: var(--color-ink);
  line-height: 1.2;
  margin: 4px 0;
}
.header-subtitle {
  font-size: 0.75rem;
  color: var(--color-ash);
  letter-spacing: 0.08em;
}

.game-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: calc(100% - 80px);
}

.map-viewport {
  flex: 1;
  overflow: auto;
  position: relative;
  border-right: 1.5px solid rgba(42, 33, 24, 0.15);
}

.sidebar-panel {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  background: rgba(42, 33, 24, 0.04);
  border-left: 1px solid rgba(42, 33, 24, 0.08);
}

/* Transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
