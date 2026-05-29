<template>
  <div class="game-log">
    <div class="log-header font-headline">
      <span class="font-english" style="font-size: 0.6em; letter-spacing: 0.12em;">RECORD</span>
      <br>行路记录
    </div>
    <div class="log-entries" ref="logContainer">
      <div
        v-for="(entry, i) in logEntries"
        :key="i"
        class="log-entry font-body"
      >
        <span class="log-bullet">&#x25AA;</span>
        {{ entry }}
      </div>
      <div v-if="logEntries.length === 0" class="log-empty font-body">
        旅途尚未开始......
      </div>
    </div>

    <!-- Reset button -->
    <button class="reset-btn font-body" @click="store.resetGame()">
      <span class="font-english" style="font-size: 0.65em;">RESTART</span> 重新开始
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()
const logContainer = ref<HTMLElement>()

const logEntries = computed(() => {
  const entries: string[] = []

  if (store.moveHistory.length > 1) {
    entries.push(`起点出发，已行进 ${store.moveHistory.length - 1} 格`)
  }

  if (store.diceValue > 0 && store.phase !== 'idle') {
    entries.push(`骰子点数: ${store.diceValue}`)
  }

  if (store.phase === 'choosingPath') {
    entries.push(`剩余 ${store.stepsRemaining} 步，请选择路径`)
  }

  if (store.currentEvent) {
    entries.push(`触发事件: ${store.currentEvent.title}`)
  }

  if (store.resolveMessage) {
    entries.push(store.resolveMessage)
  }

  if (store.currentNode) {
    const node = store.currentNode
    if (node.label) {
      entries.push(`当前位置: ${node.label}`)
    }
  }

  return entries
})

watch(logEntries, async () => {
  await nextTick()
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
})
</script>

<style scoped>
.game-log {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10px 16px;
  min-height: 0;
}

.log-header {
  font-size: 0.8rem;
  color: var(--color-ink);
  text-align: center;
  margin-bottom: 8px;
  line-height: 1.3;
  border-top: 1px solid rgba(42, 33, 24, 0.15);
  padding-top: 10px;
}

.log-entries {
  flex: 1;
  overflow-y: auto;
  min-height: 60px;
  max-height: 160px;
}

.log-entry {
  font-size: 0.65rem;
  color: var(--color-ink-light);
  padding: 3px 0;
  border-bottom: 1px dotted rgba(42, 33, 24, 0.08);
  line-height: 1.5;
  display: flex;
  gap: 4px;
}

.log-bullet {
  color: var(--color-ash);
  flex-shrink: 0;
}

.log-empty {
  font-size: 0.65rem;
  color: var(--color-muted);
  font-style: italic;
  text-align: center;
  padding: 12px 0;
}

.reset-btn {
  margin-top: 10px;
  padding: 6px 12px;
  background: transparent;
  color: var(--color-ash);
  border: 1px solid var(--color-node-border);
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.65rem;
  letter-spacing: 0.05em;
  transition: all 0.2s ease;
  text-align: center;
}

.reset-btn:hover {
  background: rgba(42, 33, 24, 0.08);
  color: var(--color-ink);
}
</style>
