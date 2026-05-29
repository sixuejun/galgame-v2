<template>
  <!-- 右上角屏蔽区：拦截鼠标，避免下层视口边缘滚动误触；骰子置于区内偏上、偏内 -->
  <div class="wdice-shield" aria-hidden="true">
    <button
      class="wdice-root"
      :class="{
        'wdice-rolling': isRolling,
        'wdice-ready': !isRolling && canRoll,
      }"
      :disabled="!canRoll && !isRolling"
      :title="canRoll ? '点击投掷骰子' : ''"
      @click="handleClick"
    >
      <!-- 骰子面：9宫格布局，圆点根据当前数值显示 -->
      <div class="wdice-face">
        <div
          v-for="i in 9"
          :key="i"
          class="wdice-pip"
          :class="{ 'wdice-pip-on': currentPips.includes(i) }"
        />
      </div>

      <!-- 滚动时叠在上面的快速闪烁层 -->
      <div v-if="isRolling" class="wdice-roll-flash">
        <div class="wdice-face">
          <div
            v-for="i in 9"
            :key="i"
            class="wdice-pip"
            :class="{ 'wdice-pip-on': flashPips.includes(i) }"
          />
        </div>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  phase: string;
  diceValue: number;
  canRoll: boolean;
}>();

const emit = defineEmits<{
  roll: [];
  finishRoll: [];
}>();

// ── 骰子面数字对应9宫格点位（点位编号 1-9，左上→右下）───────────────
const PIP_PATTERNS: Record<number, number[]> = {
  1: [5],
  2: [3, 7],
  3: [3, 5, 7],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

const isRolling = computed(() => props.phase === 'rolling');

// 当前显示的点数（滚动时用 flashValue，停止时用 props.diceValue）
const flashValue = ref(1);
const displayValue = computed(() => isRolling.value ? flashValue.value : (props.diceValue || 1));
const currentPips = computed(() => PIP_PATTERNS[displayValue.value] ?? PIP_PATTERNS[1]);

// ── 滚动动画 ───────────────────────────────────────────────────────
let rollInterval: ReturnType<typeof setInterval> | null = null;
const flashPips = ref<number[]>(PIP_PATTERNS[1]);

// 监听 phase 从 idle → rolling 的时机，自动开始动画
watch(
  () => props.phase,
  (newPhase, oldPhase) => {
    if (newPhase === 'rolling' && oldPhase !== 'rolling') {
      startRollingAnimation();
    }
  },
);

function startRollingAnimation() {
  if (rollInterval) clearInterval(rollInterval);
  let count = 0;
  const totalFrames = 16;

  rollInterval = setInterval(() => {
    const v = Math.floor(Math.random() * 6) + 1;
    flashValue.value = v;
    flashPips.value = PIP_PATTERNS[v];
    count++;
    if (count >= totalFrames) {
      clearInterval(rollInterval!);
      rollInterval = null;
      flashValue.value = props.diceValue || 1;
      flashPips.value = PIP_PATTERNS[props.diceValue || 1];
      emit('finishRoll');
    }
  }, 65);
}

function handleClick() {
  if (!props.canRoll || isRolling.value) return;
  emit('roll');
}
</script>

<style scoped>
/*
 * 与 BoardGameModule 中 DICE_PAN_DEAD_ZONE 一致：240×200，右上角。
 * pointer-events: auto + z-index 高于地图视口，使该区域不触发下层边缘滚动。
 */
.wdice-shield {
  position: absolute;
  top: 0;
  right: 0;
  width: 240px;
  height: 200px;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 56px 56px 0 0;
  pointer-events: auto;
  z-index: 25;
}

/* ── 骰子本体 ─────────────────────────────────────────────────── */
.wdice-root {
  position: relative;
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 12px;
  border: 2.5px solid rgba(196, 162, 101, 0.4);
  background: rgba(42, 36, 32, 0.92);
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    inset 0 -3px 8px rgba(0, 0, 0, 0.35);
  transition: border-color 0.25s, box-shadow 0.25s, transform 0.1s;
}

.wdice-root:hover:not(:disabled) {
  border-color: rgba(196, 162, 101, 0.75);
  box-shadow:
    0 8px 28px rgba(0, 0, 0, 0.65),
    0 0 16px rgba(196, 162, 101, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -3px 8px rgba(0, 0, 0, 0.35);
}

/* 待机脉冲 */
.wdice-ready {
  animation: wdice-ready-pulse 2.5s ease-in-out infinite;
}

@keyframes wdice-ready-pulse {
  0%, 100% {
    border-color: rgba(196, 162, 101, 0.35);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.55), inset 0 -3px 8px rgba(0, 0, 0, 0.35);
  }
  50% {
    border-color: rgba(196, 162, 101, 0.6);
    box-shadow: 0 6px 28px rgba(0, 0, 0, 0.55), 0 0 14px rgba(196, 162, 101, 0.14), inset 0 -3px 8px rgba(0, 0, 0, 0.35);
  }
}

.wdice-root:disabled {
  cursor: default;
}

/* 滚动状态 */
.wdice-rolling {
  animation: wdice-shake 0.1s linear infinite;
  border-color: rgba(139, 69, 19, 0.9) !important;
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.55),
    0 0 22px rgba(139, 69, 19, 0.35),
    inset 0 -3px 8px rgba(0, 0, 0, 0.35) !important;
}

@keyframes wdice-shake {
  0%   { transform: rotate(-5deg) scale(1.04); }
  25%  { transform: rotate(4deg) scale(1.03); }
  50%  { transform: rotate(-4deg) scale(1.05); }
  75%  { transform: rotate(5deg) scale(1.03); }
  100% { transform: rotate(-5deg) scale(1.04); }
}

/* ── 骰子面（9宫格） ───────────────────────────────────────────── */
.wdice-face {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 0;
  padding: 12px;
  align-items: center;
  justify-items: center;
}

.wdice-pip {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: transparent;
  transition: background 0.12s;
}

.wdice-pip-on {
  background: rgba(212, 197, 160, 0.88);
  box-shadow: 0 0 4px rgba(212, 197, 160, 0.5);
}

/* 滚动闪烁层 */
.wdice-roll-flash {
  position: absolute;
  inset: 0;
  animation: wdice-flash-in 0.08s ease-out forwards;
}

@keyframes wdice-flash-in {
  from { opacity: 0.55; }
  to   { opacity: 1; }
}

/* ── 竖屏适配（死区与 BoardGameModule 仍用 240×200，略缩小内边距） ── */
@media (orientation: portrait), (max-aspect-ratio: 4/3) {
  .wdice-shield {
    padding: 8px 44px 0 0;
  }

  .wdice-root {
    width: 64px;
    height: 64px;
  }

  .wdice-pip {
    width: 8px;
    height: 8px;
  }

  .wdice-face {
    padding: 9px;
  }
}
</style>
