<template>
  <div
    class="tarot-card-wrapper"
    :style="wrapperStyle"
    @click="handleClick"
  >
    <div
      ref="cardInner"
      class="tarot-card-inner"
      :class="{ 'is-flipped': isFlipped }"
    >
      <!-- Back face (default visible) -->
      <div class="tarot-face tarot-back">
        <div class="back-frame">
          <div class="back-ornament-top">&#x2735;</div>
          <div class="back-pattern">
            <div class="back-line"></div>
            <div class="back-line"></div>
            <div class="back-line"></div>
            <div class="back-diamond">&#x25C7;</div>
            <div class="back-line"></div>
            <div class="back-line"></div>
            <div class="back-line"></div>
          </div>
          <div class="back-center font-english">
            <span style="font-size: 1.6rem;">&#x2726;</span>
            <br>
            <span style="font-size: 0.55rem; letter-spacing: 0.2em;">FATE</span>
          </div>
          <div class="back-pattern">
            <div class="back-line"></div>
            <div class="back-line"></div>
            <div class="back-line"></div>
            <div class="back-diamond">&#x25C7;</div>
            <div class="back-line"></div>
            <div class="back-line"></div>
            <div class="back-line"></div>
          </div>
          <div class="back-ornament-bottom">&#x2735;</div>
        </div>
      </div>

      <!-- Front face (revealed on flip) -->
      <div class="tarot-face tarot-front">
        <div class="front-frame">
          <div class="front-header">
            <div class="front-ornament">&#x2736;</div>
            <h3 class="front-title font-headline">{{ card.title }}</h3>
            <div class="front-ornament">&#x2736;</div>
          </div>
          <div class="front-divider"></div>
          <p class="front-description font-body">{{ card.description }}</p>
          <div class="front-footer">
            <div class="front-effects">
              <span v-if="card.effect.hp" :class="card.effect.hp > 0 ? 'eff-good' : 'eff-bad'">
                &#x2764; {{ card.effect.hp > 0 ? '+' : '' }}{{ card.effect.hp }}
              </span>
              <span v-if="card.effect.sanity" :class="card.effect.sanity > 0 ? 'eff-good' : 'eff-bad'">
                &#x2738; {{ card.effect.sanity > 0 ? '+' : '' }}{{ card.effect.sanity }}
              </span>
              <span v-if="card.effect.luck" :class="card.effect.luck > 0 ? 'eff-good' : 'eff-bad'">
                &#x2618; {{ card.effect.luck > 0 ? '+' : '' }}{{ card.effect.luck }}
              </span>
              <span v-if="card.effect.transfer" class="eff-transfer">&#x29C9; 传送</span>
            </div>
            <div class="front-select-hint font-english">CHOOSE THIS FATE</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EventCard } from '@/types'
import gsap from 'gsap'

const props = defineProps<{
  card: EventCard
  index: number
  total: number
}>()

const emit = defineEmits<{
  select: [card: EventCard]
}>()

const cardInner = ref<HTMLElement>()
const isFlipped = ref(false)
const hasSelected = ref(false)

// Slight rotation variation for a natural "spread" look
const wrapperStyle = computed(() => {
  const mid = (props.total - 1) / 2
  const offset = props.index - mid
  const rotate = offset * 3 // degrees
  return {
    transform: `rotate(${rotate}deg)`,
  }
})

function handleClick() {
  if (hasSelected.value) return

  if (!isFlipped.value) {
    // Flip the card with GSAP for smooth 3D effect
    isFlipped.value = true
    if (cardInner.value) {
      gsap.fromTo(
        cardInner.value,
        { rotateY: 0 },
        {
          rotateY: 180,
          duration: 0.6,
          ease: 'power2.inOut',
        }
      )
    }
  } else {
    // Second click: select this card
    hasSelected.value = true
    emit('select', props.card)
  }
}
</script>

<style scoped>
.tarot-card-wrapper {
  width: 160px;
  height: 240px;
  perspective: 800px;
  cursor: pointer;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.tarot-card-wrapper:hover {
  transform: translateY(-8px) scale(1.03) !important;
}

.tarot-card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  /* transition handled by GSAP, but keep this as fallback */
}

.tarot-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 6px;
  overflow: hidden;
}

/* ===== BACK FACE ===== */
.tarot-back {
  background: var(--color-card-back);
  border: 2px solid var(--color-card-border);
  box-shadow:
    0 4px 12px rgba(42, 33, 24, 0.4),
    inset 0 0 20px rgba(0, 0, 0, 0.2);
}

.back-frame {
  width: 100%;
  height: 100%;
  border: 3px solid rgba(201, 169, 78, 0.3);
  border-radius: 4px;
  margin: 4px;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.back-ornament-top, .back-ornament-bottom {
  color: var(--color-highlight);
  font-size: 1rem;
  opacity: 0.6;
}

.back-pattern {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.back-line {
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(201, 169, 78, 0.4), transparent);
}

.back-diamond {
  color: var(--color-highlight);
  font-size: 0.8rem;
  opacity: 0.5;
}

.back-center {
  color: var(--color-highlight);
  text-align: center;
  opacity: 0.7;
  line-height: 1.5;
}

/* ===== FRONT FACE ===== */
.tarot-front {
  background:
    linear-gradient(165deg, var(--color-card-bg) 0%, var(--color-paper-dark) 100%);
  border: 2px solid var(--color-card-border);
  transform: rotateY(180deg);
  box-shadow:
    0 4px 12px rgba(42, 33, 24, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.front-frame {
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  margin: 4px;
  border: 1.5px solid rgba(42, 33, 24, 0.2);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 10px;
}

.front-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.front-ornament {
  color: var(--color-muted);
  font-size: 0.6rem;
}

.front-title {
  font-size: 0.85rem;
  color: var(--color-ink);
  text-align: center;
  line-height: 1.3;
}

.front-divider {
  width: 60%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-node-border), transparent);
  margin-bottom: 10px;
}

.front-description {
  font-size: 0.68rem;
  color: var(--color-ink-light);
  line-height: 1.6;
  text-align: center;
  flex: 1;
}

.front-footer {
  margin-top: auto;
  width: 100%;
  text-align: center;
}

.front-effects {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.front-effects span {
  font-size: 0.6rem;
  padding: 2px 6px;
  border-radius: 2px;
}

.eff-good {
  color: var(--color-fortune);
  background: rgba(74, 103, 65, 0.12);
}

.eff-bad {
  color: var(--color-trap);
  background: rgba(139, 37, 0, 0.1);
}

.eff-transfer {
  color: var(--color-transfer);
  background: rgba(62, 84, 112, 0.12);
}

.front-select-hint {
  font-size: 0.5rem;
  letter-spacing: 0.15em;
  color: var(--color-muted);
  border-top: 1px dotted rgba(42, 33, 24, 0.15);
  padding-top: 6px;
  opacity: 0.7;
}
</style>
