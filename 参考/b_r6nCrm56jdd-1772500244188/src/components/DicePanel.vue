<template>
  <div class="dice-panel">
    <div class="dice-header font-headline">
      <span class="font-english" style="font-size: 0.6em; letter-spacing: 0.12em;">FATE</span>
      <br>命运骰
    </div>

    <!-- Dice display -->
    <div class="dice-display" :class="{ 'dice-rolling': isRolling }">
      <div class="dice-face font-english">
        {{ displayValue }}
      </div>
    </div>

    <!-- Steps remaining -->
    <div v-if="store.stepsRemaining > 0 && store.phase === 'choosingPath'" class="steps-info font-body">
      剩余步数: <span class="steps-count font-english">{{ store.stepsRemaining }}</span>
    </div>

    <!-- Roll button -->
    <button
      class="roll-btn font-headline"
      :class="{ 'roll-btn-disabled': !store.canRoll }"
      :disabled="!store.canRoll"
      @click="handleRoll"
    >
      <span class="font-english" style="font-size: 0.7em;">ROLL</span>
      <br>掷骰
    </button>

    <div class="dice-divider"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()
const isRolling = ref(false)
const displayValue = ref('?')

const handleRoll = () => {
  if (!store.canRoll) return
  store.rollDice()
  isRolling.value = true
  displayValue.value = '?'

  // Dice rolling animation: show random numbers rapidly then settle
  let count = 0
  const maxCount = 12
  const interval = setInterval(() => {
    displayValue.value = String(Math.floor(Math.random() * 6) + 1)
    count++
    if (count >= maxCount) {
      clearInterval(interval)
      displayValue.value = String(store.diceValue)
      isRolling.value = false
      // Small delay then finish roll
      setTimeout(() => {
        store.finishRoll()
      }, 300)
    }
  }, 80)
}
</script>

<style scoped>
.dice-panel {
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dice-header {
  font-size: 0.8rem;
  color: var(--color-ink);
  text-align: center;
  margin-bottom: 10px;
  line-height: 1.3;
}

.dice-display {
  width: 64px;
  height: 64px;
  background: var(--color-card-back);
  border: 2px solid var(--color-node-border);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(42, 33, 24, 0.3);
  margin-bottom: 10px;
  transition: transform 0.1s ease;
}

.dice-rolling {
  animation: dice-shake 0.1s infinite;
}

@keyframes dice-shake {
  0% { transform: rotate(-5deg) scale(1.05); }
  25% { transform: rotate(5deg) scale(0.95); }
  50% { transform: rotate(-3deg) scale(1.02); }
  75% { transform: rotate(3deg) scale(0.98); }
  100% { transform: rotate(-5deg) scale(1.05); }
}

.dice-face {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-paper);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  user-select: none;
}

.steps-info {
  font-size: 0.7rem;
  color: var(--color-rust);
  margin-bottom: 8px;
  text-align: center;
}

.steps-count {
  font-weight: 700;
  font-size: 0.9rem;
}

.roll-btn {
  width: 100%;
  padding: 8px 16px;
  background: var(--color-ink);
  color: var(--color-paper);
  border: 2px solid var(--color-node-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1.3;
  letter-spacing: 0.08em;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(42, 33, 24, 0.3);
}

.roll-btn:hover:not(.roll-btn-disabled) {
  background: var(--color-ink-light);
  box-shadow: 0 3px 10px rgba(42, 33, 24, 0.4);
  transform: translateY(-1px);
}

.roll-btn:active:not(.roll-btn-disabled) {
  transform: translateY(0);
}

.roll-btn-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dice-divider {
  height: 1px;
  width: 100%;
  background: linear-gradient(90deg, transparent, var(--color-node-border), transparent);
  margin-top: 12px;
  opacity: 0.3;
}
</style>
