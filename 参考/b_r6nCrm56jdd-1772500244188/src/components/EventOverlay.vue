<template>
  <div class="event-overlay" @click.self="/* no close on bg click during event */">
    <div class="event-modal">
      <!-- Event header -->
      <div class="event-header">
        <div class="event-type-badge font-english" :class="`badge-${event?.nodeType}`">
          {{ typeBadge }}
        </div>
        <h2 class="event-title font-headline text-shadow-ink">
          {{ event?.title }}
        </h2>
        <p class="event-flavor font-body">{{ event?.flavor }}</p>
        <div class="event-ornament">&#x2736; &#x2736; &#x2736;</div>
      </div>

      <!-- Card selection (event phase) -->
      <div v-if="store.phase === 'event'" class="cards-container">
        <p class="cards-hint font-body">选择一张命运之牌</p>
        <div class="cards-row">
          <TarotCard
            v-for="(card, index) in event?.cards"
            :key="card.id"
            :card="card"
            :index="index"
            :total="event?.cards.length || 1"
            @select="onCardSelect"
          />
        </div>
      </div>

      <!-- Resolution phase -->
      <div v-if="store.phase === 'resolving'" class="resolve-container">
        <div class="resolve-card-info">
          <h3 class="resolve-card-title font-headline">{{ store.selectedCard?.title }}</h3>
          <p class="resolve-card-desc font-body">{{ store.selectedCard?.description }}</p>
        </div>
        <div class="resolve-divider">&#x2014;&#x2014;&#x2014;</div>
        <p class="resolve-message font-body">{{ store.resolveMessage }}</p>
        <div class="resolve-effects">
          <span v-if="store.selectedCard?.effect.hp" class="effect-tag" :class="store.selectedCard.effect.hp > 0 ? 'effect-positive' : 'effect-negative'">
            &#x2764; {{ store.selectedCard.effect.hp > 0 ? '+' : '' }}{{ store.selectedCard.effect.hp }}
          </span>
          <span v-if="store.selectedCard?.effect.sanity" class="effect-tag" :class="store.selectedCard.effect.sanity > 0 ? 'effect-positive' : 'effect-negative'">
            &#x2738; {{ store.selectedCard.effect.sanity > 0 ? '+' : '' }}{{ store.selectedCard.effect.sanity }}
          </span>
          <span v-if="store.selectedCard?.effect.luck" class="effect-tag" :class="store.selectedCard.effect.luck > 0 ? 'effect-positive' : 'effect-negative'">
            &#x2618; {{ store.selectedCard.effect.luck > 0 ? '+' : '' }}{{ store.selectedCard.effect.luck }}
          </span>
          <span v-if="store.selectedCard?.effect.transfer" class="effect-tag effect-transfer">
            &#x29C9; 传送
          </span>
        </div>
        <button class="continue-btn font-headline" @click="store.finishResolve()">
          <span class="font-english" style="font-size: 0.7em;">CONTINUE</span>
          <br>继续前行
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import type { EventCard } from '@/types'
import TarotCard from '@/components/TarotCard.vue'

const store = useGameStore()
const event = computed(() => store.currentEvent)

const typeBadge = computed(() => {
  const badges: Record<string, string> = {
    encounter: 'ENCOUNTER',
    trap: 'TRAP',
    fortune: 'FORTUNE',
    transfer: 'TRANSFER',
  }
  return badges[event.value?.nodeType || ''] || 'EVENT'
})

function onCardSelect(card: EventCard) {
  store.selectCard(card)
}
</script>

<style scoped>
.event-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(42, 33, 24, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.event-modal {
  background:
    linear-gradient(135deg, var(--color-paper) 0%, var(--color-paper-dark) 100%);
  border: 2px solid var(--color-node-border);
  border-radius: 6px;
  max-width: 720px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow:
    0 8px 32px rgba(42, 33, 24, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  padding: 24px;
}

/* Event Header */
.event-header {
  text-align: center;
  margin-bottom: 20px;
}

.event-type-badge {
  display: inline-block;
  font-size: 0.6rem;
  letter-spacing: 0.2em;
  padding: 3px 12px;
  border: 1px solid;
  border-radius: 2px;
  margin-bottom: 8px;
}

.badge-encounter { border-color: var(--color-encounter); color: var(--color-encounter); }
.badge-trap { border-color: var(--color-trap); color: var(--color-trap); }
.badge-fortune { border-color: var(--color-fortune); color: var(--color-fortune); }
.badge-transfer { border-color: var(--color-transfer); color: var(--color-transfer); }

.event-title {
  font-size: 1.3rem;
  color: var(--color-ink);
  margin: 8px 0;
}

.event-flavor {
  font-size: 0.78rem;
  color: var(--color-ink-light);
  line-height: 1.6;
  max-width: 480px;
  margin: 0 auto;
  font-style: italic;
}

.event-ornament {
  margin-top: 10px;
  color: var(--color-muted);
  font-size: 0.7rem;
  letter-spacing: 0.5em;
}

/* Cards section */
.cards-container {
  text-align: center;
}

.cards-hint {
  font-size: 0.7rem;
  color: var(--color-ash);
  margin-bottom: 16px;
  letter-spacing: 0.08em;
}

.cards-row {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* Resolution section */
.resolve-container {
  text-align: center;
}

.resolve-card-info {
  margin-bottom: 12px;
}

.resolve-card-title {
  font-size: 1rem;
  color: var(--color-ink);
}

.resolve-card-desc {
  font-size: 0.75rem;
  color: var(--color-ink-light);
  margin-top: 4px;
  font-style: italic;
}

.resolve-divider {
  color: var(--color-muted);
  margin: 12px 0;
  letter-spacing: 0.3em;
}

.resolve-message {
  font-size: 0.8rem;
  color: var(--color-ink);
  line-height: 1.7;
  max-width: 440px;
  margin: 0 auto 16px;
}

.resolve-effects {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.effect-tag {
  font-size: 0.7rem;
  padding: 3px 10px;
  border-radius: 3px;
  border: 1px solid;
}

.effect-positive {
  color: var(--color-fortune);
  border-color: var(--color-fortune);
  background: rgba(74, 103, 65, 0.1);
}

.effect-negative {
  color: var(--color-trap);
  border-color: var(--color-trap);
  background: rgba(139, 37, 0, 0.08);
}

.effect-transfer {
  color: var(--color-transfer);
  border-color: var(--color-transfer);
  background: rgba(62, 84, 112, 0.1);
}

.continue-btn {
  padding: 10px 32px;
  background: var(--color-ink);
  color: var(--color-paper);
  border: 2px solid var(--color-node-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1.3;
  letter-spacing: 0.08em;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(42, 33, 24, 0.3);
}

.continue-btn:hover {
  background: var(--color-ink-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(42, 33, 24, 0.4);
}
</style>
