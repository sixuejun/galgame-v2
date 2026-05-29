<template>
  <div class="gameover-overlay">
    <div class="gameover-modal">
      <div class="gameover-ornament">&#x2620;</div>
      <h2 class="gameover-title font-headline text-shadow-ink">
        {{ store.isPlayerDead ? '生命殆尽' : '精神崩溃' }}
      </h2>
      <p class="gameover-subtitle font-english">
        {{ store.isPlayerDead ? 'LIFE EXHAUSTED' : 'SANITY LOST' }}
      </p>
      <div class="gameover-divider">&#x2014;&#x2014;&#x2014;</div>
      <p class="gameover-text font-body">
        {{ store.isPlayerDead
          ? '你的身体终于承受不住这末日的重压，倒在了冰冷的废墟中。'
          : '无尽的恐惧与绝望吞噬了你的意识，你再也无法分清现实与幻觉。'
        }}
      </p>
      <button class="gameover-btn font-headline" @click="store.resetGame()">
        <span class="font-english" style="font-size: 0.7em;">RESTART</span>
        <br>再试一次
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
const store = useGameStore()
</script>

<style scoped>
.gameover-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(20, 15, 10, 0.85);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.gameover-modal {
  background: linear-gradient(135deg, #3d3425, #2a2118);
  border: 2px solid var(--color-rust);
  border-radius: 6px;
  max-width: 400px;
  width: 100%;
  padding: 32px;
  text-align: center;
  box-shadow:
    0 0 40px rgba(110, 26, 14, 0.3),
    0 8px 32px rgba(0, 0, 0, 0.5);
}

.gameover-ornament {
  font-size: 2.5rem;
  margin-bottom: 12px;
  opacity: 0.8;
}

.gameover-title {
  font-size: 1.5rem;
  color: var(--color-rust-glow);
  margin-bottom: 4px;
}

.gameover-subtitle {
  font-size: 0.65rem;
  letter-spacing: 0.25em;
  color: var(--color-muted);
  margin-bottom: 12px;
}

.gameover-divider {
  color: var(--color-ash);
  margin: 12px 0;
  letter-spacing: 0.3em;
  opacity: 0.5;
}

.gameover-text {
  font-size: 0.8rem;
  color: var(--color-paper-dark);
  line-height: 1.7;
  margin-bottom: 24px;
}

.gameover-btn {
  padding: 10px 32px;
  background: var(--color-rust);
  color: var(--color-paper);
  border: 2px solid var(--color-rust-glow);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1.3;
  letter-spacing: 0.08em;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(110, 26, 14, 0.3);
}

.gameover-btn:hover {
  background: var(--color-rust-glow);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(110, 26, 14, 0.5);
}
</style>
