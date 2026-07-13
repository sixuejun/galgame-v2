<template>
  <div data-ui="image-deck">
    <!-- 收起按钮必须放在无 transform 的祖先下，fixed 才相对视口贴边 -->
    <template v-if="store.settings.imageCardWheelEnabled">
      <button
        class="collapse-toggle"
        :class="{ 'is-visible': isCollapsed, 'is-expanding': !isCollapsed && isTransitioning }"
        type="button"
        title="展开卡片轮盘"
        aria-label="展开卡片轮盘"
        @click.stop="expandDeck"
      >
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true">
          <path
            d="M672 192L352 512l320 320"
            fill="none"
            stroke="currentColor"
            stroke-width="96"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <div class="deck-wrapper" :class="{ 'is-collapsed': isCollapsed, 'is-expanding': isTransitioning }">
        <div class="deck-glow" />

        <!-- 宽大悬停区：从左侧伸入画面，避免扇形被裁切 -->
        <div
          class="deck-hit-area"
          :class="{ 'is-hovered': isHovered }"
          @mouseenter="onHoverEnter"
          @mouseleave="onHoverLeave"
        >
          <div class="deck-stage">
            <!-- 旋转中心：屏幕左缘垂直中点 -->
            <div class="deck-pivot">
              <!-- 重试 + 收起按钮 -->
              <button v-if="!isCollapsed" title="收起卡片轮盘" class="collapse-btn" @click.stop="collapseDeck">
                <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                  <path
                    d="M672 192L352 512l320 320"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="96"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>

              <!-- 重试按钮始终可见，不受收起状态影响 -->
              <button title="重新生成最新图片" class="retry-btn" @click.stop="handleRetryLatest">
                <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                  <path
                    d="M502.714987 58.258904l-126.531056-54.617723a52.797131 52.797131 0 0 0-41.873587 96.855428A447.865322 447.865322 0 0 0 392.02307 946.707184a61.535967 61.535967 0 0 0 13.83649 1.820591 52.797131 52.797131 0 0 0 13.65443-103.773672 342.453118 342.453118 0 0 1-31.678278-651.771485l-8.374718 19.480321a52.615072 52.615072 0 0 0 27.855039 69.182448 51.522718 51.522718 0 0 0 20.572675 4.369418A52.797131 52.797131 0 0 0 476.498481 254.882703L530.205907 127.441352a52.979191 52.979191 0 0 0-27.49092-69.182448zM962.960326 509.765407A448.775617 448.775617 0 0 0 643.992829 68.090094a52.797131 52.797131 0 1 0-30.403866 101.042786A342.635177 342.635177 0 0 1 674.578753 801.059925a52.615072 52.615072 0 0 0-92.30395-50.612422l-71.913335 117.246043a52.433013 52.433013 0 0 0 17.295612 72.82363l117.063985 72.823629a52.797131 52.797131 0 1 0 54.617722-89.755123l-16.021198-10.013249A448.593558 448.593558 0 0 0 962.960326 509.765407z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              <!-- 整叠旋转 90°：把「底边为轴的摊牌」翻到贴左缘朝右展开 -->
              <div class="deck-orient">
                <div class="deck-scroll">
                  <div
                    v-for="(card, index) in renderCards"
                    :key="card.id"
                    class="deck-card"
                    :class="{
                      'deck-card-active': isCardBound(card.id),
                      'deck-card-hovered': hoveredCardId === card.id,
                      'deck-card-empty': card.id.startsWith('placeholder-'),
                    }"
                    :style="getCardStyle(index)"
                    @mouseenter="hoveredCardId = card.id"
                    @mouseleave="hoveredCardId = null"
                    @click="handleCardClick(card.id)"
                  >
                    <div class="card-face card-front">
                      <img :src="card.imageData || CARD_PLACEHOLDER_IMAGE" alt="" class="card-image" />
                      <div class="card-inner">
                        <span class="card-symbol">{{ getCardSymbol(card.type) }}</span>
                        <span class="card-label">{{ card.type === 'background' ? 'BG' : 'CG' }}</span>
                      </div>
                      <div class="card-shine" />
                      <div
                        v-if="isCardBound(card.id)"
                        class="card-binding-indicator"
                      >
                        {{ getBoundSceneTitle(card.id) }}
                      </div>
                    </div>
                    <div class="card-face card-back">
                      <div class="card-back-pattern" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useVNStore } from '../../store';

const store = useVNStore();
const isHovered = ref(false);
const hoveredCardId = ref<string | null>(null);
const isCollapsed = ref(false);
const isTransitioning = ref(false);

// 绑定图判定：卡的 title 在 sceneImageBindings 中即为绑定
function isCardBound(cardId: string): boolean {
  return store.isCardBound(cardId);
}

function getBoundSceneTitle(cardId: string): string {
  return store.getBoundSceneTitle(cardId);
}

// 展开时：卡牌防抖（过渡期间禁止选卡）
// 需覆盖扇形动画的最大延迟（4*42ms）+ 卡片过渡时长（550ms）+ 余量
const CARD_BLOCK_DURATION = 850;

// 闲置自动最小化：3秒无操作自动收起
const IDLE_TIMEOUT = 3000;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  if (isCollapsed.value) return;
  // 有卡牌处于悬停状态时不触发自动收起
  if (hoveredCardId.value !== null) return;
  idleTimer = setTimeout(() => {
    isCollapsed.value = true;
  }, IDLE_TIMEOUT);
}

function onHoverEnter() {
  isHovered.value = true;
  resetIdleTimer();
}

function onHoverLeave() {
  isHovered.value = false;
  resetIdleTimer();
}

// 切换到其他卡牌时也要重置计时器
watch(hoveredCardId, () => resetIdleTimer());

function collapseDeck() {
  if (idleTimer) clearTimeout(idleTimer);
  isCollapsed.value = true;
}

function expandDeck() {
  isCollapsed.value = false;
  isTransitioning.value = true;
  resetIdleTimer();
  setTimeout(() => {
    isTransitioning.value = false;
  }, CARD_BLOCK_DURATION);
}

// 初始化时也启动计时器
onMounted(() => resetIdleTimer());
// 开关关闭时清空计时器
watch(
  () => store.settings.imageCardWheelEnabled,
  enabled => {
    if (!enabled && idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  },
);

const CARD_PLACEHOLDER_IMAGE = 'https://pic1.imgdb.cn/item/69c857c5f2426dbb8efc5bde.png';

const CARD_TOTAL = 9;

/** 始终 9 张：真实卡 + 占位卡 */
const renderCards = computed(() => {
  const queue = store.imageCardQueue.slice(0, CARD_TOTAL);
  const cards: (typeof store.imageCardQueue)[0][] = [...queue];

  while (cards.length < CARD_TOTAL) {
    const i = cards.length;
    cards.push({
      id: `placeholder-${i}`,
      imageData: '',
      type: 'background' as const,
      timestamp: 0,
      title: '',
    });
  }
  return cards;
});

function getCardSymbol(type: string | undefined) {
  return type === 'background' ? '▣' : '✦';
}

function getCardColor(index: number): string {
  const colors = ['#8b4513', '#a0522d', '#6b3410', '#7a5c42', '#5a4f40', '#6b5f50', '#8b6b4a', '#5c4838', '#b8a880'];
  return colors[index % colors.length];
}

function getCardGlow(index: number): string {
  return `rgba(139, 69, 19, ${0.3 + (index % 3) * 0.1})`;
}

/**
 * --i: -4..4（9 张）
 * --stagger-delay: 中间先动，两侧略晚（模拟先抬中间再扇开）
 */
function getCardStyle(index: number) {
  const i = index - (CARD_TOTAL - 1) / 2;
  const absI = Math.abs(i);

  return {
    '--i': i,
    '--stagger-delay': `${absI * 42}ms`,
    '--card-color': getCardColor(index),
    '--card-glow': getCardGlow(index),
    zIndex: 10 + index,
  } as Record<string, string | number>;
}

function handleCardClick(cardId: string) {
  if (!cardId || cardId.startsWith('placeholder-')) return;
  if (isTransitioning.value) return;
  store.switchToImageCard(cardId);
  hoveredCardId.value = null;
  resetIdleTimer();
}

function handleRetryLatest() {
  store.openRetryPanel();
}
</script>

<style scoped>
/* =========================================
   左侧贴边扇心 + 摊牌默认 + 悬浮抽卡悬停
   deck-orient: rotate(90deg) 等价于把底边轴牌堆整体翻成贴左缘
   ========================================= */

.deck-wrapper {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%) translateX(60px);
  z-index: 30;
  pointer-events: none;
  overflow: visible;
}

/* 最小化状态：隐藏卡片，只留小箭头 */
.deck-wrapper.is-collapsed {
  pointer-events: none;
}

/* 展开过渡期间（0.5s）：禁止悬停触发的扇形动画和点击选卡 */
.deck-wrapper.is-expanding .deck-card {
  pointer-events: none !important;
  transition:
    opacity 0.45s ease,
    filter 0.45s ease !important;
  filter: brightness(0.85) !important;
}

.deck-wrapper.is-expanding .deck-hit-area {
  pointer-events: none;
}

/* 最小化：贴左半圆（右缘半圆弧、左缘竖直），fixed 相对视口（已移出含 transform 的 deck-wrapper） */
.collapse-toggle {
  --collapse-r: 24px;
  position: fixed;
  z-index: 250;
  width: var(--collapse-r);
  height: calc(var(--collapse-r) * 2);
  left: calc(-1 * (var(--collapse-r) + 3px));
  top: 50%;
  transform: translateY(-50%);
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  border-radius: 0 var(--collapse-r) var(--collapse-r) 0;
  border: 2px solid rgba(139, 69, 19, 0.55);
  border-left: none;
  background: var(--vn-panel-bg);
  color: var(--theme-text-main, var(--vn-fg));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  opacity: 0;
  transition:
    left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.3s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.collapse-toggle.is-visible {
  left: max(0px, env(safe-area-inset-left, 0px));
  opacity: 1;
  pointer-events: auto;
}

/* 展开动画：半圆弹性缩放回圆，0.4s 后自动收回圆角（模拟从尖头弹出变成圆） */
.collapse-toggle.is-expanding {
  border-radius: 50%;
  width: calc(var(--collapse-r) * 2);
  height: calc(var(--collapse-r) * 2);
  transition:
    left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s,
    height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s,
    border-radius 0.4s ease 0.25s,
    opacity 0.3s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.collapse-toggle:hover {
  background: rgba(139, 69, 19, 0.38);
  border-color: var(--theme-accent, var(--rust));
  color: var(--paper-light);
}

.collapse-toggle svg {
  transform: none;
}

/* 最小化时隐藏整个牌叠区域 */
.deck-wrapper.is-collapsed .deck-hit-area,
.deck-wrapper.is-collapsed .deck-glow {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}

.deck-glow {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 280px;
  height: 420px;
  border-radius: 50%;
  background: radial-gradient(ellipse at left center, rgba(139, 69, 19, 0.14) 0%, transparent 72%);
  pointer-events: none;
  filter: blur(22px);
  z-index: 0;
}

.deck-hit-area {
  pointer-events: auto;
  position: relative;
  width: min(58vw, 640px);
  height: min(88vh, 680px);
  margin-left: 0;
  overflow: visible;
  padding-left: 40px;
}

/* 扇心对齐左缘垂直中心 */
.deck-stage {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  overflow: visible;
}

.deck-pivot {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  overflow: visible;
}

/* 关键：相对「底边为轴的摊牌」整体旋转 90°，牌堆贴左侧朝右成弧 */
.deck-orient {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  transform: rotate(90deg);
  transform-origin: 0 0;
  overflow: visible;
}

/* 水平滚动容器：承载整叠卡牌，允许拖拽平移 */
.deck-scroll {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  transition: transform 0.06s linear;
  will-change: transform;
  cursor: grab;
}

.deck-scroll:active {
  cursor: grabbing;
}

/* 单卡：底边中点为轴（与摊牌 / 悬浮抽卡参考一致） */
.deck-card {
  position: absolute;
  left: 0;
  top: 0;
  width: 100px;
  height: 150px;
  margin-left: -50px;
  margin-top: -150px;
  border-radius: 10px;
  cursor: pointer;
  transform-style: preserve-3d;
  transform-origin: 50% 100%;
  overflow: hidden;
  transition:
    transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.45s ease,
    filter 0.45s ease;
  will-change: transform;
}

.deck-hit-area:not(.is-hovered) .deck-card {
  transition-delay: 0ms;
}

/* 默认：摊牌扇形堆叠（第二张参考 ::before 公式） */
.deck-card {
  transform: rotate(calc((var(--i) * 15deg) - 30deg));
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.45),
    inset 0 0 0 1px rgba(42, 36, 32, 0.25);
  filter: brightness(0.88);
}

/* 悬停：悬浮抽卡 — rotate(i*5) + translate 左右散开；错峰延迟中间先动 */
.deck-hit-area.is-hovered .deck-card {
  transition-delay: var(--stagger-delay, 0ms);
  transform: rotate(calc(var(--i) * 5deg)) translate(calc(var(--i) * 118px), -52px);
  box-shadow:
    0 16px 44px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(196, 162, 101, 0.22);
  filter: brightness(0.95);
}

/* 单卡悬停：参考 :active 再抬起 */
.deck-card.deck-card-hovered {
  transform: rotate(calc(var(--i) * 5deg)) translate(calc(var(--i) * 118px), -52px)
    translate(calc(var(--i) * 22px), -48px) !important;
  box-shadow:
    0 22px 50px rgba(0, 0, 0, 0.55),
    0 0 28px var(--card-glow) !important;
  filter: brightness(1.08) !important;
  z-index: 999 !important;
}

.deck-card.deck-card-active {
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.48),
    0 0 22px rgba(139, 69, 19, 0.55),
    0 0 0 2px rgba(196, 162, 101, 0.5) !important;
}

/* ========== 牌面 ========== */
.card-face {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  backface-visibility: hidden;
}

.card-front {
  background: linear-gradient(135deg, var(--card-color) 0%, color-mix(in srgb, var(--card-color) 55%, #2a2420) 100%);
  border: 1.5px solid rgba(196, 162, 101, 0.35);
  overflow: hidden;
}

.card-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 6px;
  position: relative;
  z-index: 1;
}

.card-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.92;
}

.card-symbol {
  font-size: 1.4rem;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(42, 36, 32, 0.9));
  position: relative;
  z-index: 2;
  color: var(--theme-text-main, var(--vn-fg));
}

.card-label {
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--paper-light);
  position: relative;
  z-index: 2;
}

.card-shine {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    rgba(212, 197, 160, 0.14) 0%,
    rgba(212, 197, 160, 0) 50%,
    rgba(42, 36, 32, 0.15) 100%
  );
  pointer-events: none;
  z-index: 3;
}

.card-back {
  background: #1a1818;
  border: 1.5px solid rgba(196, 162, 101, 0.25);
  transform: rotateY(180deg);
}

.card-back-pattern {
  position: absolute;
  inset: 5px;
  border-radius: 7px;
  border: 1px solid rgba(196, 162, 101, 0.2);
  background-image:
    repeating-linear-gradient(
      45deg,
      rgba(139, 69, 19, 0.14) 0px,
      rgba(139, 69, 19, 0.14) 1px,
      transparent 1px,
      transparent 8px
    ),
    repeating-linear-gradient(
      -45deg,
      rgba(196, 162, 101, 0.1) 0px,
      rgba(196, 162, 101, 0.1) 1px,
      transparent 1px,
      transparent 8px
    );
}

.card-binding-indicator {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 2px 6px;
  background: rgba(80, 60, 120, 0.85);
  color: rgba(220, 200, 255, 0.9);
  border-radius: 3px;
  font-size: 7px;
  font-weight: 600;
  letter-spacing: 0.04em;
  z-index: 10;
  border: 1px solid rgba(160, 130, 220, 0.4);
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
}

/* 扇心上的重试：逆旋转 90° 保持图标正向，常态可见 */
.retry-btn {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 200;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  transform: translate(-50%, -50%) rotate(-90deg);
  background: var(--vn-panel-bg);
  border: 2px solid rgba(139, 69, 19, 0.55);
  color: var(--theme-text-main, var(--vn-fg));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.retry-btn:hover {
  background: rgba(139, 69, 19, 0.38);
  border-color: var(--theme-accent, var(--rust));
  color: var(--paper-light);
}

.retry-btn:active svg {
  transform: rotate(180deg);
  transition: transform 0.4s ease;
}

/* 收起按钮：贴在扇心，最右侧 */
.collapse-btn {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 200;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transform: translate(-50%, -50%) rotate(-90deg);
  background: var(--vn-panel-bg);
  border: 2px solid rgba(139, 69, 19, 0.55);
  color: var(--theme-text-main, var(--vn-fg));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.collapse-btn:hover {
  background: rgba(139, 69, 19, 0.38);
  border-color: var(--theme-accent, var(--rust));
  color: var(--paper-light);
}

/* 占位卡：更暗更模糊 */
.deck-card.deck-card-empty {
  filter: brightness(0.55) saturate(0.5) !important;
}

@media (orientation: portrait) {
  .deck-wrapper {
    left: 2px;
    transform: translateY(-50%) translateX(40px);
  }

  .deck-hit-area {
    width: min(72vw, 520px);
    height: min(80vh, 560px);
    padding-left: 30px;
  }

  .deck-card {
    width: 82px;
    height: 124px;
    margin-left: -41px;
    margin-top: -124px;
  }

  .deck-hit-area.is-hovered .deck-card {
    transform: rotate(calc(var(--i) * 4deg)) translate(calc(var(--i) * 88px), -44px);
  }

  .deck-card.deck-card-hovered {
    transform: rotate(calc(var(--i) * 4deg)) translate(calc(var(--i) * 88px), -44px)
      translate(calc(var(--i) * 16px), -40px) !important;
  }
}

/* ====== 竖屏时滚动范围较大（屏幕上卡片更多被裁） ====== */
@media (orientation: portrait) {
  :root {
    --scroll-max: 280px;
  }
}

/* 横屏模式 / 小窗口：整体缩小（优先横屏判断，小窗口也适用） 中*/
@media (orientation: landscape) {
  .deck-wrapper {
    transform: translateY(-50%) translateX(-20px) scale(0.7);
  }

  .deck-hit-area {
    width: min(52vw, 560px);
    height: min(82vh, 600px);
  }

  .deck-card {
    width: 80px;
    height: 120px;
    margin-left: -40px;
    margin-top: -120px;
  }

  .deck-hit-area.is-hovered .deck-card {
    transform: rotate(calc(var(--i) * 4deg)) translate(calc(var(--i) * 72px), -36px);
  }

  .deck-card.deck-card-hovered {
    transform: rotate(calc(var(--i) * 4deg)) translate(calc(var(--i) * 72px), -36px)
      translate(calc(var(--i) * 12px), -32px) !important;
  }
}

/* 小窗口（宽 < 768px）通用缩放：横竖屏均适用 */
@media (max-width: 768px) {
  .deck-wrapper {
    transform: translateY(-50%) translateX(-20px) scale(0.65);
  }

  .deck-hit-area {
    width: min(52vw, 560px);
    height: min(82vh, 600px);
  }

  .deck-card {
    width: 72px;
    height: 108px;
    margin-left: -36px;
    margin-top: -108px;
  }

  .deck-hit-area.is-hovered .deck-card {
    transform: rotate(calc(var(--i) * 4deg)) translate(calc(var(--i) * 64px), -32px);
  }

  .deck-card.deck-card-hovered {
    transform: rotate(calc(var(--i) * 4deg)) translate(calc(var(--i) * 64px), -32px)
      translate(calc(var(--i) * 10px), -28px) !important;
  }
}
</style>
