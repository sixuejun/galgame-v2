<template>
  <div class="player-status">
    <div class="status-header font-headline">
      <span class="font-english" style="font-size: 0.6em; letter-spacing: 0.12em;">STATUS</span>
      <br>幸存者状态
    </div>

    <div class="stat-row">
      <div class="stat-label font-body">
        <span class="stat-icon">&#x2764;</span> 生命
      </div>
      <div class="stat-bar-container">
        <div class="stat-bar stat-bar-hp" :style="{ width: hpPercent + '%' }"></div>
      </div>
      <span class="stat-value font-english">{{ stats.hp }}/{{ stats.maxHp }}</span>
    </div>

    <div class="stat-row">
      <div class="stat-label font-body">
        <span class="stat-icon">&#x2738;</span> 精神
      </div>
      <div class="stat-bar-container">
        <div class="stat-bar stat-bar-sanity" :style="{ width: sanityPercent + '%' }"></div>
      </div>
      <span class="stat-value font-english">{{ stats.sanity }}/{{ stats.maxSanity }}</span>
    </div>

    <div class="stat-row">
      <div class="stat-label font-body">
        <span class="stat-icon">&#x2618;</span> 运气
      </div>
      <span class="stat-value luck-value font-english">{{ stats.luck }}</span>
    </div>

    <div class="status-divider"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()
const stats = computed(() => store.stats)
const hpPercent = computed(() => (stats.value.hp / stats.value.maxHp) * 100)
const sanityPercent = computed(() => (stats.value.sanity / stats.value.maxSanity) * 100)
</script>

<style scoped>
.player-status {
  padding: 14px 16px 8px;
}

.status-header {
  font-size: 0.85rem;
  color: var(--color-ink);
  margin-bottom: 12px;
  line-height: 1.3;
  text-align: center;
  border-bottom: 1px solid rgba(42, 33, 24, 0.15);
  padding-bottom: 8px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--color-ink-light);
  min-width: 52px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 0.8rem;
}

.stat-bar-container {
  flex: 1;
  height: 10px;
  background: rgba(42, 33, 24, 0.12);
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid rgba(42, 33, 24, 0.15);
}

.stat-bar {
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 1px;
}

.stat-bar-hp {
  background: linear-gradient(90deg, var(--color-blood), #a03020);
}

.stat-bar-sanity {
  background: linear-gradient(90deg, var(--color-transfer), #5a7a9a);
}

.stat-value {
  font-size: 0.65rem;
  color: var(--color-ash);
  min-width: 40px;
  text-align: right;
}

.luck-value {
  margin-left: auto;
}

.status-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-node-border), transparent);
  margin-top: 6px;
  opacity: 0.3;
}
</style>
