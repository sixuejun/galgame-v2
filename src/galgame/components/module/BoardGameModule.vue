<template>
  <div class="bg-root" @click.self="() => {}">
    <!-- ══ Layout ══════════════════════════════════════════════ -->
    <div class="bg-layout">
      <!-- Left: map area (viewport + pan arrows) -->
      <div class="bg-map-area">
        <div class="bg-map-container">
          <!-- 悬浮骰子（地图窗口内右上角） -->
          <WastelandDice
            :phase="phase"
            :dice-value="bgStore.diceValue"
            :can-roll="bgStore.canRoll"
            @roll="handleRoll"
            @finish-roll="bgStore.finishRoll()"
          />

          <!-- Pan arrows -->
          <div v-show="showPanArrows.top" class="bg-pan-arrow bg-pan-top">
            <i class="fa-solid fa-caret-up" />
          </div>
          <div v-show="showPanArrows.bottom" class="bg-pan-arrow bg-pan-bottom">
            <i class="fa-solid fa-caret-down" />
          </div>
          <div v-show="showPanArrows.left" class="bg-pan-arrow bg-pan-left">
            <i class="fa-solid fa-caret-left" />
          </div>
          <div v-show="showPanArrows.right" class="bg-pan-arrow bg-pan-right">
            <i class="fa-solid fa-caret-right" />
          </div>
          <div
            ref="mapViewportRef"
            class="bg-map-viewport"
            @mousemove="handleMouseMove"
            @mouseenter="handleMouseEnter"
            @mouseleave="handleMouseLeave"
          >
            <div
              class="bg-map-canvas"
              :style="{ width: bgStore.mapConfig.width + 'px', height: bgStore.mapConfig.height + 'px' }"
            >
              <!-- Nodes (cells) - only walkable path tiles -->
              <div
                v-for="node in bgStore.mapConfig.nodes"
                :key="node.id"
                class="bg-node"
                :class="[
                  `bg-node-${node.type}`,
                  {
                    'bg-node-current': node.id === bgStore.currentNodeId,
                    'bg-node-walkable': bgStore.walkableNodeIds.includes(node.id),
                    'bg-node-visited': bgStore.visitedNodeIds.has(node.id) && node.id !== bgStore.currentNodeId,
                  },
                ]"
                :style="nodeStyle(node)"
                :title="nodeLabel(node)"
                @click="handleNodeClick(node.id)"
              >
                <i v-if="nodeIcon(node.type)" :class="nodeIcon(node.type)" class="bg-node-icon" />
              </div>

              <!-- Player token -->
              <div ref="playerTokenRef" class="bg-player-token">
                <i class="fa-solid fa-person-walking" />
              </div>
            </div>
          </div>
        </div>

        <!-- Right: sidebar -->
        <aside class="bg-sidebar">
          <!-- Phase indicator -->
          <div class="bg-phase-badge" :class="`bg-phase-${bgStore.phase}`">
            <span class="bg-phase-dot" />
            <span>{{ phaseLabel }}</span>
            <span v-if="bgStore.phase === 'choosingPath'" class="bg-steps-badge">
              剩余 {{ bgStore.stepsRemaining }} 步
            </span>
          </div>

          <!-- Player Stats -->
          <div class="bg-stats-panel">
            <div class="bg-stat-row">
              <span class="bg-stat-label"><i class="fa-solid fa-heart" /> 生命</span>
              <div class="bg-stat-track">
                <div
                  class="bg-stat-fill bg-stat-hp"
                  :style="{ width: (bgStore.stats.hp / bgStore.stats.maxHp) * 100 + '%' }"
                />
              </div>
              <span class="bg-stat-val">{{ bgStore.stats.hp }}/{{ bgStore.stats.maxHp }}</span>
            </div>
            <div class="bg-stat-row">
              <span class="bg-stat-label"><i class="fa-solid fa-brain" /> 精神</span>
              <div class="bg-stat-track">
                <div
                  class="bg-stat-fill bg-stat-san"
                  :style="{ width: (bgStore.stats.sanity / bgStore.stats.maxSanity) * 100 + '%' }"
                />
              </div>
              <span class="bg-stat-val">{{ bgStore.stats.sanity }}/{{ bgStore.stats.maxSanity }}</span>
            </div>
            <div class="bg-stat-luck">
              <i class="fa-solid fa-clover" style="color: var(--vn-success); font-size: 0.65rem" />
              <span>运气 {{ bgStore.stats.luck }}</span>
              <span class="bg-steps-total">已行 {{ bgStore.totalSteps }} 格</span>
            </div>
          </div>

          <!-- Seed control -->
          <div class="bg-seed-panel">
            <div class="bg-seed-title">
              <i class="fa-solid fa-seedling" style="font-size: 0.6rem" />
              地图种子
            </div>
            <div class="bg-seed-row">
              <input
                v-model.number="seedInput"
                class="bg-seed-input"
                type="number"
                placeholder="种子数字"
                @keydown.enter="refreshMap"
              />
              <button class="bg-seed-btn" title="用当前种子重新生成地图" @click="refreshMap">
                <i class="fa-solid fa-rotate" />
              </button>
              <button class="bg-seed-btn" title="随机种子" @click="randomSeed">
                <i class="fa-solid fa-shuffle" />
              </button>
            </div>
            <div class="bg-seed-info">{{ bgStore.mapConfig.nodes.length }} 个格子</div>
          </div>

          <!-- AI Event Settings -->
          <div class="bg-ai-settings-panel">
            <div class="bg-ai-settings-title">
              <i class="fa-solid fa-wand-magic-sparkles" style="font-size: 0.6rem" />
              AI事件生成
            </div>
            <div class="bg-ai-settings-row">
              <span class="bg-ai-settings-label">启用</span>
              <button
                class="bg-ai-toggle"
                :class="{ 'bg-ai-toggle-on': vnStore.settings.boardGameEventGenEnabled }"
                @click="
                  vnStore.updateSettings({ boardGameEventGenEnabled: !vnStore.settings.boardGameEventGenEnabled })
                "
              >
                <div class="bg-ai-toggle-slider" />
              </button>
            </div>
            <template v-if="vnStore.settings.boardGameEventGenEnabled">
              <div class="bg-ai-settings-row">
                <span class="bg-ai-settings-label">发送方式</span>
                <div class="bg-ai-mode-btns">
                  <button
                    class="bg-ai-mode-btn"
                    :class="{ 'bg-ai-mode-btn-active': vnStore.settings.boardGameEventSendMode === 'choice' }"
                    title="事件选项将出现在VN界面的选择框中"
                    @click="vnStore.updateSettings({ boardGameEventSendMode: 'choice' })"
                  >
                    选项框
                  </button>
                  <button
                    class="bg-ai-mode-btn"
                    :class="{ 'bg-ai-mode-btn-active': vnStore.settings.boardGameEventSendMode === 'direct' }"
                    title="选择事件后直接调用主API生成剧情"
                    @click="vnStore.updateSettings({ boardGameEventSendMode: 'direct' })"
                  >
                    直接
                  </button>
                </div>
              </div>
              <div class="bg-ai-settings-hint">
                {{ vnStore.settings.boardGameEventSendMode === 'choice' ? '返回VN界面选择' : '直接生成剧情' }}
              </div>
            </template>
          </div>

          <!-- Game log -->
          <div class="bg-log-panel">
            <div class="bg-log-title">
              <i class="fa-solid fa-scroll" style="font-size: 0.6rem" />
              行路记录
            </div>
            <div ref="logScrollRef" class="bg-log-body">
              <div
                v-for="(entry, i) in bgStore.gameLog"
                :key="i"
                class="bg-log-entry"
                :class="{
                  'bg-log-event': entry.startsWith('⚡'),
                  'bg-log-transfer': entry.startsWith('⊙'),
                  'bg-log-indent': entry.startsWith('  └'),
                }"
              >
                {{ entry }}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <!-- ══ Event Overlay ══════════════════════════════════════ -->
      <Transition name="bg-overlay-fade">
        <div
          v-if="bgStore.phase === 'event' || bgStore.phase === 'resolving' || bgStore.aiEventGenerating"
          class="bg-event-overlay"
        >
          <!-- Loading state for AI generation -->
          <div v-if="bgStore.aiEventGenerating && !bgStore.currentEvent" class="bg-event-panel">
            <div class="bg-event-header">
              <div class="bg-event-type-badge bg-badge-loading">
                <i class="fa-solid fa-spinner fa-spin" style="margin-right: 4px" />
                生成中
              </div>
              <div class="bg-event-title">正在生成事件...</div>
              <div class="bg-event-flavor">第二API正在根据当前场景生成事件卡牌</div>
            </div>
            <div class="bg-loading-area">
              <div class="bg-loading-spinner">
                <i class="fa-solid fa-dice-d20 fa-spin" style="font-size: 2rem; color: var(--stain)" />
              </div>
              <div class="bg-loading-text">请稍候...</div>
              <div class="bg-loading-actions">
                <button class="bg-loading-btn bg-loading-btn-cancel" @click="bgStore.cancelAiEventGeneration">
                  <i class="fa-solid fa-pause" style="margin-right: 5px" />
                  暂停并返回
                </button>
              </div>
            </div>
          </div>

          <!-- Error state for AI generation -->
          <div v-else-if="bgStore.aiEventError" class="bg-event-panel">
            <div class="bg-event-header">
              <div class="bg-event-type-badge bg-badge-error">
                <i class="fa-solid fa-triangle-exclamation" style="margin-right: 4px" />
                生成失败
              </div>
              <div class="bg-event-title">事件生成失败</div>
              <div class="bg-event-flavor">{{ bgStore.aiEventError }}</div>
            </div>
            <div class="bg-error-area">
              <div class="bg-error-actions">
                <button class="bg-error-btn bg-error-btn-retry" @click="handleRetryAiGeneration">
                  <i class="fa-solid fa-rotate-right" style="margin-right: 5px" />
                  重试
                </button>
                <button class="bg-error-btn bg-error-btn-cancel" @click="bgStore.cancelAiEventGeneration">
                  <i class="fa-solid fa-xmark" style="margin-right: 5px" />
                  取消并返回
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="bgStore.currentEvent" class="bg-event-panel">
            <!-- Event header -->
            <div class="bg-event-header">
              <div class="bg-event-type-badge" :class="`bg-badge-${bgStore.currentEvent?.nodeType}`">
                {{ nodeTypeLabel(bgStore.currentEvent?.nodeType) }}
              </div>
              <div class="bg-event-title">{{ bgStore.currentEvent?.title }}</div>
              <div class="bg-event-flavor">{{ bgStore.currentEvent?.description }}</div>
            </div>

            <!-- Phase: event → show event selection -->
            <div v-if="bgStore.phase === 'event'" class="bg-cards-area">
              <div class="bg-cards-hint">· 选择命运 ·</div>
              <div class="bg-cards-row bg-cards-count-1">
                <div class="bg-tarot-wrapper" @click="handleEventClick">
                  <div class="bg-tarot-inner" :class="{ 'bg-tarot-flipped': eventFlipped }">
                    <!-- Back face -->
                    <div class="bg-tarot-face bg-tarot-back">
                      <div class="bg-tarot-back-deco">
                        <div class="bg-tarot-back-border" />
                        <div class="bg-tarot-back-center">
                          <div class="bg-tarot-back-symbol">✦</div>
                          <div class="bg-tarot-back-lines">
                            <div class="bg-tarot-back-line" />
                            <div class="bg-tarot-back-line" />
                            <div class="bg-tarot-back-line" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- Front face -->
                    <div class="bg-tarot-face bg-tarot-front">
                      <div class="bg-tarot-front-content">
                        <div class="bg-tarot-front-title">{{ bgStore.currentEvent?.title }}</div>
                        <div class="bg-tarot-front-divider" />
                        <div class="bg-tarot-front-desc">{{ bgStore.currentEvent?.description }}</div>
                        <div class="bg-tarot-front-tendency" :class="`bg-tendency-${bgStore.currentEvent?.tendency}`">
                          {{ tendencyLabel(bgStore.currentEvent?.tendency) }}
                        </div>
                        <div class="bg-tarot-front-confirm">
                          <span>点击确认</span>
                          <i class="fa-solid fa-hand-pointer" style="font-size: 0.6rem" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Phase: resolving → show result -->
            <div v-else-if="bgStore.phase === 'resolving'" class="bg-resolve-area">
              <div class="bg-resolve-card-title">{{ bgStore.selectedEvent?.title }}</div>
              <div class="bg-resolve-message">{{ bgStore.resolveMessage }}</div>
              <div class="bg-resolve-effects">
                <span
                  v-if="bgStore.selectedEvent?.effect.hp"
                  class="bg-effect-chip"
                  :class="(bgStore.selectedEvent.effect.hp ?? 0) > 0 ? 'bg-effect-pos' : 'bg-effect-neg'"
                >
                  ❤ {{ (bgStore.selectedEvent.effect.hp ?? 0) > 0 ? '+' : '' }}{{ bgStore.selectedEvent.effect.hp }}
                </span>
                <span
                  v-if="bgStore.selectedEvent?.effect.sanity"
                  class="bg-effect-chip"
                  :class="(bgStore.selectedEvent.effect.sanity ?? 0) > 0 ? 'bg-effect-pos' : 'bg-effect-neg'"
                >
                  🧠 {{ (bgStore.selectedEvent.effect.sanity ?? 0) > 0 ? '+' : ''
                  }}{{ bgStore.selectedEvent.effect.sanity }}
                </span>
                <span v-if="bgStore.selectedEvent?.effect.transfer" class="bg-effect-chip bg-effect-transfer">
                  ⊙ 传送
                </span>
              </div>
              <button class="bg-continue-btn" @click="handleContinue">
                <i class="fa-solid fa-person-walking" style="margin-right: 6px" />
                继续前行
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { gsap } from 'gsap';
import { useBoardGameStore } from '../../boardgame/boardGameStore';
import type { GameEvent, MapNode } from '../../boardgame/types';
import { useVNStore } from '../../store';
import WastelandDice from './WastelandDice.vue';

const bgStore = useBoardGameStore();
const vnStore = useVNStore();

// ── Constants ──────────────────────────────────────────────────
const CELL_SIZE = 70;
const TOKEN_SIZE = 40;
const TOKEN_HALF = TOKEN_SIZE / 2;

// ── Refs ───────────────────────────────────────────────────────
const playerTokenRef = ref<HTMLElement>();
const mapViewportRef = ref<HTMLElement>();
const logScrollRef = ref<HTMLElement>();
const seedInput = ref(bgStore.seed);
const phase = computed(() => bgStore.phase);

// ── Tarot card flip state ──────────────────────────────────────
const eventFlipped = ref(false);

// ── Pan arrows & auto-scroll ───────────────────────────────────
const showPanArrows = ref({ top: false, bottom: false, left: false, right: false });
const panInterval = ref<ReturnType<typeof setInterval> | null>(null);
const EDGE_THRESHOLD = 120; // pixels from edge to trigger pan (increased)
const PAN_SPEED = 8; // pixels per frame
const isMouseInViewport = ref(false);

/** 与 WastelandDice 右上角屏蔽区一致：此矩形内不触发边缘滚动（避免靠近骰子时误触） */
const DICE_PAN_DEAD_ZONE = { width: 240, height: 200 } as const;

function handleMouseMove(e: MouseEvent) {
  if (!mapViewportRef.value) return;
  const rect = mapViewportRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const { width: dzW, height: dzH } = DICE_PAN_DEAD_ZONE;
  const inDiceDeadZone = x >= rect.width - dzW && y >= 0 && y < dzH;

  const nearTop = !inDiceDeadZone && y < EDGE_THRESHOLD;
  const nearBottom = !inDiceDeadZone && y > rect.height - EDGE_THRESHOLD;
  const nearLeft = !inDiceDeadZone && x < EDGE_THRESHOLD;
  const nearRight = !inDiceDeadZone && x > rect.width - EDGE_THRESHOLD;

  showPanArrows.value.top = nearTop;
  showPanArrows.value.bottom = nearBottom;
  showPanArrows.value.left = nearLeft;
  showPanArrows.value.right = nearRight;

  // Auto-start panning when near edge
  if (nearTop && !panInterval.value) {
    startPan('top');
  } else if (nearBottom && !panInterval.value) {
    startPan('bottom');
  } else if (nearLeft && !panInterval.value) {
    startPan('left');
  } else if (nearRight && !panInterval.value) {
    startPan('right');
  } else if (!nearTop && !nearBottom && !nearLeft && !nearRight) {
    stopPan();
  }
}

function handleMouseEnter() {
  isMouseInViewport.value = true;
}

function handleMouseLeave() {
  isMouseInViewport.value = false;
  showPanArrows.value = { top: false, bottom: false, left: false, right: false };
  stopPan();
}

function startPan(direction: 'top' | 'bottom' | 'left' | 'right') {
  stopPan();
  panInterval.value = setInterval(() => {
    if (!mapViewportRef.value) return;
    const viewport = mapViewportRef.value;
    switch (direction) {
      case 'top':
        viewport.scrollTop -= PAN_SPEED;
        break;
      case 'bottom':
        viewport.scrollTop += PAN_SPEED;
        break;
      case 'left':
        viewport.scrollLeft -= PAN_SPEED;
        break;
      case 'right':
        viewport.scrollLeft += PAN_SPEED;
        break;
    }
  }, 16);
}

function stopPan() {
  if (panInterval.value) {
    clearInterval(panInterval.value);
    panInterval.value = null;
  }
}

onUnmounted(() => {
  stopPan();
});

// ── Helper functions ───────────────────────────────────────────
function nodeStyle(node: MapNode) {
  // Nodes are now square cells, not circles
  const halfSize = CELL_SIZE / 2;
  return {
    left: node.x - halfSize + 'px',
    top: node.y - halfSize + 'px',
    width: CELL_SIZE + 'px',
    height: CELL_SIZE + 'px',
  };
}

function nodeIcon(type: MapNode['type']): string {
  const icons: Record<string, string> = {
    start: 'fa-solid fa-flag-checkered',
    encounter: 'fa-solid fa-users',
    trap: 'fa-solid fa-triangle-exclamation',
    fortune: 'fa-solid fa-star',
    end: 'fa-solid fa-flag',
    empty: '',
  };
  return icons[type] ?? '';
}

function nodeLabel(node: MapNode): string {
  const labels: Record<string, string> = {
    start: '起点',
    empty: '空地',
    encounter: '遭遇',
    trap: '陷阱',
    fortune: '意外之喜',
    end: '终点',
  };
  return labels[node.type] ?? node.type;
}

function nodeTypeLabel(type?: string): string {
  const m: Record<string, string> = {
    encounter: '⚔ 遭遇',
    trap: '⚠ 陷阱',
    fortune: '✦ 意外之喜',
  };
  return m[type ?? ''] ?? '';
}

function tendencyLabel(tendency?: string): string {
  const m: Record<string, string> = {
    negative: '◆ 危险',
    positive: '◇ 有利',
    neutral: '◇ 中性',
  };
  return m[tendency ?? ''] ?? '';
}

const phaseLabel = computed(() => {
  const labels: Record<string, string> = {
    idle: '等待掷骰',
    rolling: '掷骰中…',
    choosingPath: '选择路径',
    event: '事件触发',
    resolving: '结算中…',
  };
  return labels[bgStore.phase] ?? '';
});

// ── Player token animation ─────────────────────────────────────
function setTokenPosition(nodeId: string, animate = false, fromNodeId?: string) {
  const newNode = bgStore.nodeMap.get(nodeId);
  if (!newNode || !playerTokenRef.value) return;
  const toL = newNode.x - TOKEN_HALF + 'px';
  const toT = newNode.y - TOKEN_HALF + 'px';

  if (!animate) {
    gsap.set(playerTokenRef.value, { left: toL, top: toT });
    centerViewOnPlayer(newNode);
    return;
  }

  const oldNode = fromNodeId ? bgStore.nodeMap.get(fromNodeId) : null;
  const fromL = oldNode ? oldNode.x - TOKEN_HALF + 'px' : toL;
  const fromT = oldNode ? oldNode.y - TOKEN_HALF + 'px' : toT;

  gsap.fromTo(
    playerTokenRef.value,
    { left: fromL, top: fromT },
    {
      left: toL,
      top: toT,
      duration: 0.38,
      ease: 'power2.inOut',
      onUpdate: () => {
        // Smoothly pan viewport during animation
        if (mapViewportRef.value && newNode) {
          const viewport = mapViewportRef.value;
          const targetScrollLeft = newNode.x - viewport.clientWidth / 2;
          const targetScrollTop = newNode.y - viewport.clientHeight / 2;
          const currentScrollLeft = viewport.scrollLeft;
          const currentScrollTop = viewport.scrollTop;

          // Smooth interpolation
          viewport.scrollLeft = currentScrollLeft + (targetScrollLeft - currentScrollLeft) * 0.1;
          viewport.scrollTop = currentScrollTop + (targetScrollTop - currentScrollTop) * 0.1;
        }
      },
      onComplete: () => {
        centerViewOnPlayer(newNode);
        bgStore.onMoveAnimationDone();
      },
    },
  );
}

function centerViewOnPlayer(node: MapNode) {
  if (!mapViewportRef.value) return;
  const viewport = mapViewportRef.value;
  const targetScrollLeft = node.x - viewport.clientWidth / 2;
  const targetScrollTop = node.y - viewport.clientHeight / 2;

  // Smooth scroll to center
  viewport.scrollTo({
    left: Math.max(0, targetScrollLeft),
    top: Math.max(0, targetScrollTop),
    behavior: 'smooth',
  });
}

watch(
  () => bgStore.currentNodeId,
  (newId, oldId) => {
    setTokenPosition(newId, bgStore.isAnimating, bgStore.isAnimating ? oldId : undefined);
  },
);

onMounted(() => {
  nextTick(() => {
    setTokenPosition(bgStore.currentNodeId);

    // 初始化时触发预生成事件
    if (vnStore.settings.boardGameEventGenEnabled) {
      const nodeTypeMap = new Map<string, string>();
      for (const node of bgStore.mapConfig.nodes) {
        if (node.type !== 'empty' && node.type !== 'start' && node.type !== 'end') {
          nodeTypeMap.set(node.id, node.type);
        }
      }

      // 填充事件池（一次性调 API 生成 9-12 张卡）
      bgStore.fillEventPool(vnStore.currentScene || '末日废墟', vnStore);
    }
  });
});

// ── Auto-scroll log ────────────────────────────────────────────
watch(
  () => bgStore.gameLog.length,
  () =>
    nextTick(() => {
      if (logScrollRef.value) logScrollRef.value.scrollTop = logScrollRef.value.scrollHeight;
    }),
);

// ── Dice ───────────────────────────────────────────────────────
function handleRoll() {
  if (!bgStore.canRoll) return;
  bgStore.rollDice();
  // 动画由 WastelandDice 组件内部 watch phase → rolling 自动驱动
  // finishRoll 也由组件的 emit('finishRoll') 触发
}

// ── Node click ─────────────────────────────────────────────────
function handleNodeClick(nodeId: string) {
  if (!bgStore.canChoose) return;
  if (!bgStore.walkableNodeIds.includes(nodeId)) return;
  bgStore.moveToNode(nodeId);
  // Auto-move logic: if only one path available and steps remaining, continue
  nextTick(() => {
    autoMoveIfSinglePath();
  });
}

// Auto-move when there's only one path and steps remaining
function autoMoveIfSinglePath() {
  if (bgStore.phase !== 'choosingPath') return;
  if (bgStore.isAnimating) return;
  if (bgStore.stepsRemaining <= 0) return;
  if (bgStore.walkableNodeIds.length !== 1) return;

  // Only one path available, auto-move after a short delay
  setTimeout(() => {
    if (
      bgStore.phase === 'choosingPath' &&
      bgStore.walkableNodeIds.length === 1 &&
      bgStore.stepsRemaining > 0 &&
      !bgStore.isAnimating
    ) {
      const nextNode = bgStore.walkableNodeIds[0];
      if (nextNode) {
        bgStore.moveToNode(nextNode);
      }
    }
  }, 600); // Slightly longer delay for better visual feedback
}

// Watch for animation completion to continue auto-moving
watch(
  () => bgStore.isAnimating,
  isAnimating => {
    if (!isAnimating && bgStore.phase === 'choosingPath') {
      nextTick(() => {
        autoMoveIfSinglePath();
      });
    }
  },
);

// ── Card interaction ───────────────────────────────────────────
function handleEventClick() {
  if (bgStore.phase !== 'event') return;
  if (!eventFlipped.value) {
    // First click: flip to reveal
    eventFlipped.value = true;
  } else {
    // Second click: select this event
    const event = bgStore.currentEvent;
    if (event) {
      // Check send mode
      if (vnStore.settings.boardGameEventSendMode === 'direct') {
        // Direct send: call main API to generate story
        handleDirectSend(event);
      } else {
        // Send to choice: go back to VN and add as temp option
        handleSendToChoice(event);
      }
    }
  }
}

async function handleDirectSend(event: GameEvent) {
  bgStore.selectEvent(event);

  try {
    // 构建用户输入，包含事件描述
    const userInput = `${event.title}：${event.description}`;

    // 调用主API生成剧情
    vnStore.showToast('正在生成剧情...');
    await generate({
      user_input: userInput,
      should_silence: false,
    });

    // 关闭废土行路界面
    vnStore.activeModuleId = null;
    vnStore.setOverlay('none');

    // 清理状态
    eventFlipped.value = false;
    bgStore.finishResolve();

    vnStore.showToast('剧情生成完成');
  } catch (error: any) {
    console.error('[废土行路] 直接发送失败:', error);
    vnStore.showToast(`生成失败: ${error.message || '未知错误'}`);
  }
}

function handleSendToChoice(event: GameEvent) {
  // 构建事件消息，格式：<user>触发了事件「title」，description，结果：effect，HP ±X、理智 ±Y
  if (!event) return;

  // 构建效果变化描述
  const effectParts: string[] = [];
  if (event.effect.hp !== undefined) {
    effectParts.push(`HP ${event.effect.hp > 0 ? '+' : ''}${event.effect.hp}`);
  }
  if (event.effect.sanity !== undefined) {
    effectParts.push(`理智 ${event.effect.sanity > 0 ? '+' : ''}${event.effect.sanity}`);
  }
  const effectChange = effectParts.length > 0 ? `，${effectParts.join('、')}` : '';

  // 完整的消息文本，填入自由输入框
  const eventMessage = `<user>触发了事件「${event.title}」，${event.description}，结果：${event.effect.message}${effectChange}`;
  vnStore.customInputText = eventMessage;

  // 添加到选项框中，作为自由输入选项（用户可以编辑后再发送）
  vnStore.setTempOptions([
    {
      choiceId: event.id,
      text: event.title + '：' + event.description,
      isCustomInput: true,
    },
  ]);

  // Close board game and return to VN
  vnStore.activeModuleId = null;
  vnStore.setOverlay('none');

  // Clear board game state
  eventFlipped.value = false;
  bgStore.finishResolve();

  vnStore.showToast('事件选项已添加到选择框');
}

// triggerAiEventGeneration 已废弃：事件池在地图生成时一次性填充，
// triggerEvent 会自动从池中抽取，无需手动调 API

function handleContinue() {
  eventFlipped.value = false;
  bgStore.finishResolve();
}

// ── Seed / map ─────────────────────────────────────────────────
function refreshMap() {
  // 触发地图重新生成
  bgStore.regenerateMap(seedInput.value);

  // 重新生成时也重新填充事件池
  nextTick(() => {
    if (vnStore.settings.boardGameEventGenEnabled) {
      bgStore.fillEventPool(vnStore.currentScene || '末日废墟', vnStore);
    }
    // 重置角色位置
    setTokenPosition(bgStore.currentNodeId);
  });
}

function randomSeed() {
  seedInput.value = Math.floor(Math.random() * 999999);
  refreshMap();
}

// Sync seedInput when store seed changes (e.g. on initial load)
watch(
  () => bgStore.seed,
  s => {
    seedInput.value = s;
  },
);

// Watch for phase change to choosingPath and trigger auto-move
watch(
  () => bgStore.phase,
  newPhase => {
    if (newPhase === 'choosingPath') {
      nextTick(() => {
        autoMoveIfSinglePath();
      });
    }
  },
);
</script>

<style scoped>
/* ── Root layout ──────────────────────────────────────────────── */
.bg-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--vn-bg);
  position: relative;
  overflow: hidden;
}

.bg-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 横屏：左侧地图 + 右侧侧边栏 */
.bg-map-area {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 竖屏：上方地图（55%） + 下方侧边栏 */
@media (orientation: portrait), (max-aspect-ratio: 4/3) {
  .bg-map-area {
    flex-direction: column;
  }
}

.bg-map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}

/* 竖屏：地图占上方约 55%（保留足够空间给侧边栏） */
@media (orientation: portrait), (max-aspect-ratio: 4/3) {
  .bg-map-container {
    height: 55%;
    min-height: 140px;
    flex: none;
    border-bottom: 1px solid rgba(90, 79, 64, 0.25);
  }
}

/* ── Map viewport ────────────────────────────────────────────── */
.bg-map-viewport {
  width: 100%;
  height: 100%;
  overflow: auto;
  background: linear-gradient(135deg, rgba(35, 30, 26, 0.2) 0%, rgba(42, 36, 32, 0.3) 100%);
  position: relative;
  z-index: 1; /* 低于骰子屏蔽层 (25)，保证右上角拦截鼠标 */
}

/* ── Pan arrows ──────────────────────────────────────────────── */
.bg-pan-arrow {
  position: absolute;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(196, 162, 101, 0.9);
  font-size: 1rem;
  pointer-events: none;
  filter: drop-shadow(0 0 8px rgba(196, 162, 101, 0.6));
}

.bg-pan-top,
.bg-pan-bottom {
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 40px;
}

.bg-pan-top {
  top: 0;
}

.bg-pan-top::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(to bottom, rgba(196, 162, 101, 0.7), transparent);
  box-shadow: 0 0 15px rgba(196, 162, 101, 0.8);
  animation: bg-edge-glow 1.5s ease-in-out infinite;
}

.bg-pan-top i {
  animation: bg-arrow-float-v 1.2s ease-in-out infinite;
}

.bg-pan-bottom {
  bottom: 0;
}

.bg-pan-bottom::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(to top, rgba(196, 162, 101, 0.7), transparent);
  box-shadow: 0 0 15px rgba(196, 162, 101, 0.8);
  animation: bg-edge-glow 1.5s ease-in-out infinite;
}

.bg-pan-bottom i {
  animation: bg-arrow-float-v 1.2s ease-in-out infinite;
}

.bg-pan-left,
.bg-pan-right {
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 80px;
}

.bg-pan-left {
  left: 0;
}

.bg-pan-left::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to right, rgba(196, 162, 101, 0.7), transparent);
  box-shadow: 0 0 15px rgba(196, 162, 101, 0.8);
  animation: bg-edge-glow 1.5s ease-in-out infinite;
}

.bg-pan-left i {
  animation: bg-arrow-float-h 1.2s ease-in-out infinite;
}

.bg-pan-right {
  right: 0;
}

.bg-pan-right::before {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to left, rgba(196, 162, 101, 0.7), transparent);
  box-shadow: 0 0 15px rgba(196, 162, 101, 0.8);
  animation: bg-edge-glow 1.5s ease-in-out infinite;
}

.bg-pan-right i {
  animation: bg-arrow-float-h 1.2s ease-in-out infinite;
}

@keyframes bg-edge-glow {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

@keyframes bg-arrow-float-v {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.8;
  }
  50% {
    transform: translateY(-3px);
    opacity: 1;
  }
}

@keyframes bg-arrow-float-h {
  0%,
  100% {
    transform: translateX(0);
    opacity: 0.8;
  }
  50% {
    transform: translateX(-3px);
    opacity: 1;
  }
}

.bg-map-canvas {
  position: relative;
}

/* ── Nodes (Sparse Grid Tiles) ───────────────────────────────── */
.bg-node {
  position: absolute;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  border: 2px solid rgba(90, 79, 64, 0.6);
  background: rgba(42, 36, 32, 0.95);
  transition:
    transform 0.15s,
    box-shadow 0.15s,
    border-color 0.15s;
  z-index: 2;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(212, 197, 160, 0.1);
}

.bg-node-icon {
  font-size: 1.2rem;
  pointer-events: none;
}

/* Type colours */
.bg-node-start {
  background: linear-gradient(135deg, rgba(196, 162, 101, 0.4) 0%, rgba(196, 162, 101, 0.25) 100%);
  border-color: var(--stain);
  color: var(--stain);
  box-shadow:
    0 3px 10px rgba(196, 162, 101, 0.3),
    inset 0 0 20px rgba(196, 162, 101, 0.2),
    inset 0 1px 0 rgba(212, 197, 160, 0.3);
}
.bg-node-end {
  background: linear-gradient(135deg, rgba(196, 162, 101, 0.5) 0%, rgba(212, 197, 160, 0.35) 100%);
  border-color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
  color: var(--theme-text-main, rgba(212, 197, 160, 0.95));
  box-shadow:
    0 4px 12px rgba(196, 162, 101, 0.4),
    inset 0 0 25px rgba(212, 197, 160, 0.25),
    inset 0 2px 0 rgba(255, 255, 255, 0.2);
  animation: bg-end-glow 2s ease-in-out infinite;
}
@keyframes bg-end-glow {
  0%,
  100% {
    box-shadow:
      0 4px 12px rgba(196, 162, 101, 0.4),
      inset 0 0 25px rgba(212, 197, 160, 0.25),
      inset 0 2px 0 rgba(255, 255, 255, 0.2);
  }
  50% {
    box-shadow:
      0 5px 15px rgba(196, 162, 101, 0.6),
      inset 0 0 30px rgba(212, 197, 160, 0.35),
      inset 0 2px 0 rgba(255, 255, 255, 0.3);
  }
}
.bg-node-empty {
  border-color: rgba(90, 79, 64, 0.4);
  background: linear-gradient(135deg, rgba(58, 51, 44, 0.9) 0%, rgba(42, 36, 32, 0.85) 100%);
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(212, 197, 160, 0.08);
}
.bg-node-encounter {
  background: linear-gradient(135deg, rgba(110, 26, 14, 0.5) 0%, rgba(110, 26, 14, 0.35) 100%);
  border-color: rgba(110, 26, 14, 0.8);
  color: #c46060;
  box-shadow:
    0 3px 10px rgba(110, 26, 14, 0.4),
    inset 0 0 15px rgba(110, 26, 14, 0.3),
    inset 0 1px 0 rgba(196, 96, 96, 0.2);
}
.bg-node-trap {
  background: linear-gradient(
    135deg,
    var(--theme-accent-soft, rgba(139, 69, 19, 0.5)) 0%,
    rgba(139, 69, 19, 0.35) 100%
  );
  border-color: var(--theme-accent, var(--rust));
  color: var(--theme-accent, var(--rust));
  box-shadow:
    0 3px 10px rgba(139, 69, 19, 0.3),
    inset 0 0 15px rgba(139, 69, 19, 0.25),
    inset 0 1px 0 rgba(196, 162, 101, 0.15);
}
.bg-node-fortune {
  background: linear-gradient(135deg, rgba(74, 103, 65, 0.5) 0%, rgba(74, 103, 65, 0.35) 100%);
  border-color: rgba(90, 140, 74, 0.8);
  color: var(--vn-success);
  box-shadow:
    0 3px 10px rgba(74, 103, 65, 0.4),
    inset 0 0 15px rgba(74, 103, 65, 0.3),
    inset 0 1px 0 rgba(144, 186, 130, 0.2);
}
.bg-node-transfer {
  background: linear-gradient(135deg, rgba(62, 84, 112, 0.5) 0%, rgba(62, 84, 112, 0.35) 100%);
  border-color: rgba(80, 120, 170, 0.8);
  color: #7ab0d4;
  box-shadow:
    0 3px 10px rgba(62, 84, 112, 0.4),
    inset 0 0 15px rgba(62, 84, 112, 0.3),
    inset 0 1px 0 rgba(122, 176, 212, 0.2);
}

/* States */
.bg-node-current {
  border-color: var(--stain) !important;
  border-width: 3px;
  box-shadow:
    0 0 25px rgba(196, 162, 101, 0.7),
    0 4px 12px rgba(0, 0, 0, 0.4),
    inset 0 0 25px rgba(196, 162, 101, 0.25),
    inset 0 2px 0 rgba(212, 197, 160, 0.4);
  z-index: 4;
  transform: translateY(-2px);
}

.bg-node-walkable {
  cursor: pointer;
  border-color: rgba(196, 162, 101, 0.9) !important;
  border-width: 3px;
  box-shadow:
    0 0 20px rgba(196, 162, 101, 0.6),
    0 3px 10px rgba(0, 0, 0, 0.3),
    inset 0 0 18px rgba(196, 162, 101, 0.2),
    inset 0 2px 0 rgba(212, 197, 160, 0.3);
  animation: bg-node-pulse 1.2s ease-in-out infinite;
  z-index: 3;
}

.bg-node-walkable:hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow:
    0 0 30px rgba(196, 162, 101, 0.9),
    0 5px 15px rgba(0, 0, 0, 0.4),
    inset 0 0 25px rgba(196, 162, 101, 0.3),
    inset 0 2px 0 rgba(212, 197, 160, 0.5);
}

@keyframes bg-node-pulse {
  0%,
  100% {
    box-shadow:
      0 0 15px rgba(196, 162, 101, 0.5),
      0 3px 8px rgba(0, 0, 0, 0.3),
      inset 0 0 15px rgba(196, 162, 101, 0.15),
      inset 0 2px 0 rgba(212, 197, 160, 0.25);
  }
  50% {
    box-shadow:
      0 0 25px rgba(196, 162, 101, 0.8),
      0 4px 12px rgba(0, 0, 0, 0.35),
      inset 0 0 22px rgba(196, 162, 101, 0.25),
      inset 0 2px 0 rgba(212, 197, 160, 0.35);
  }
}

.bg-node-visited {
  opacity: 0.5;
  filter: grayscale(0.3);
}

/* ── Player token ────────────────────────────────────────────── */
.bg-player-token {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--stain);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: var(--ink-black);
  z-index: 10;
  box-shadow:
    0 0 15px rgba(196, 162, 101, 0.7),
    0 3px 8px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  border: 3px solid var(--theme-text-soft, rgba(212, 197, 160, 0.8));
}

/* ── Sidebar ─────────────────────────────────────────────────── */
.bg-sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  border-left: 1px solid rgba(90, 79, 64, 0.3);
  background: rgba(35, 30, 26, 0.5);
  overflow-y: auto;
}

/* 竖屏：侧边栏改为横向滚动栏，占下方 45%，内容从左到右排列 */
@media (orientation: portrait), (max-aspect-ratio: 4/3) {
  .bg-sidebar {
    width: 100%;
    height: 45%;
    flex: none;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    border-left: none;
    border-top: 1px solid rgba(90, 79, 64, 0.3);
  }
}

/* 竖屏下：各子面板改为竖向一列，占满高度 */
@media (orientation: portrait), (max-aspect-ratio: 4/3) {
  .bg-stats-panel,
  .bg-seed-panel,
  .bg-ai-settings-panel {
    flex-shrink: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border-bottom: none;
    border-right: 1px solid rgba(90, 79, 64, 0.2);
    min-width: 120px;
  }
  .bg-seed-panel,
  .bg-ai-settings-panel {
    border-right: none;
  }
}

/* 竖屏下：状态面板内部压缩 */
@media (orientation: portrait), (max-aspect-ratio: 4/3) {
  .bg-stats-panel {
    gap: 3px;
  }
  .bg-stat-row {
    width: 100%;
  }
  .bg-stat-label {
    width: 36px;
    font-size: 8px;
  }
  .bg-stat-val {
    width: 34px;
    font-size: 8px;
  }
  .bg-stat-luck {
    font-size: 8px;
    gap: 3px;
  }
  .bg-stat-track {
    height: 4px;
  }
  .bg-steps-total {
    font-size: 8px;
  }
}

/* 竖屏下：种子面板压缩 */
@media (orientation: portrait), (max-aspect-ratio: 4/3) {
  .bg-seed-title {
    font-size: 7px;
    margin-bottom: 4px;
  }
  .bg-seed-row {
    width: 100%;
  }
  .bg-seed-input {
    height: 24px;
    font-size: 10px;
  }
  .bg-seed-btn {
    width: 24px;
    height: 24px;
  }
  .bg-seed-info {
    font-size: 7px;
  }
}

/* 竖屏下：AI设置面板压缩 */
@media (orientation: portrait), (max-aspect-ratio: 4/3) {
  .bg-ai-settings-title {
    font-size: 7px;
    margin-bottom: 5px;
  }
  .bg-ai-settings-row {
    margin-bottom: 4px;
  }
  .bg-ai-settings-label {
    font-size: 8px;
  }
  .bg-ai-toggle {
    width: 30px;
    height: 16px;
  }
  .bg-ai-toggle-slider {
    width: 10px;
    height: 10px;
    top: 2px;
    left: 2px;
  }
  .bg-ai-toggle-on .bg-ai-toggle-slider {
    left: 16px;
  }
  .bg-ai-mode-btns {
    flex-direction: column;
    gap: 2px;
  }
  .bg-ai-mode-btn {
    font-size: 8px;
    padding: 2px 6px;
  }
  .bg-ai-settings-hint {
    font-size: 7px;
  }
}

/* 竖屏下：日志面板占满剩余空间并横向滚动 */
@media (orientation: portrait), (max-aspect-ratio: 4/3) {
  .bg-log-panel {
    flex-shrink: 1;
    flex-direction: row;
    overflow: hidden;
    min-width: 140px;
  }
  .bg-log-title {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    padding: 10px 6px;
    font-size: 8px;
    border-bottom: none;
    border-right: 1px solid rgba(90, 79, 64, 0.15);
    flex-shrink: 0;
  }
  .bg-log-body {
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 6px 8px;
    flex-direction: column;
    gap: 1px;
  }
  .bg-log-entry {
    font-size: 8px;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    white-space: nowrap;
    max-height: none;
    line-height: 1.4;
  }
}

/* Phase badge */
.bg-phase-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 10px;
  font-family: monospace;
  letter-spacing: 0.08em;
  border-bottom: 1px solid rgba(90, 79, 64, 0.2);
  color: var(--theme-text-muted, var(--vn-muted));
}

.bg-phase-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--theme-text-muted, var(--vn-muted));
  flex-shrink: 0;
}

.bg-phase-choosingPath .bg-phase-dot {
  background: var(--stain);
  animation: bg-dot-pulse 1s infinite;
}
.bg-phase-event .bg-phase-dot,
.bg-phase-resolving .bg-phase-dot {
  background: var(--theme-accent, var(--rust));
  animation: bg-dot-pulse 0.8s infinite;
}
.bg-phase-rolling .bg-phase-dot {
  background: rgba(90, 140, 74, 0.8);
  animation: bg-dot-pulse 0.5s infinite;
}

@keyframes bg-dot-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.bg-steps-badge {
  margin-left: auto;
  background: rgba(196, 162, 101, 0.15);
  border: 1px solid rgba(196, 162, 101, 0.3);
  padding: 1px 6px;
  border-radius: 3px;
  color: var(--stain);
  font-weight: bold;
}

/* Stats */
.bg-stats-panel {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(90, 79, 64, 0.2);
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.bg-stat-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bg-stat-label {
  font-size: 9px;
  color: var(--theme-text-muted, var(--vn-muted));
  width: 42px;
  flex-shrink: 0;
}

.bg-stat-track {
  flex: 1;
  height: 5px;
  background: rgba(90, 79, 64, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.bg-stat-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.bg-stat-hp {
  background: linear-gradient(to right, #8b2500, #c46060);
}
.bg-stat-san {
  background: linear-gradient(to right, #3e5470, #7ab0d4);
}

.bg-stat-val {
  font-size: 9px;
  font-family: monospace;
  color: var(--theme-text-muted, var(--vn-muted));
  width: 40px;
  text-align: right;
  flex-shrink: 0;
}

.bg-stat-luck {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
  color: var(--theme-text-muted, var(--vn-muted));
}

.bg-steps-total {
  margin-left: auto;
  font-family: monospace;
  font-size: 9px;
  color: var(--theme-text-faint, rgba(139, 125, 107, 0.5));
}

/* Seed */
.bg-seed-panel {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(90, 79, 64, 0.2);
}

.bg-seed-title {
  font-size: 8px;
  font-family: monospace;
  letter-spacing: 0.15em;
  color: var(--theme-text-muted, rgba(139, 125, 107, 0.6));
  text-transform: uppercase;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.bg-seed-row {
  display: flex;
  gap: 4px;
}

.bg-seed-input {
  flex: 1;
  height: 26px;
  background: rgba(42, 36, 32, 0.6);
  border: 1px solid rgba(90, 79, 64, 0.4);
  color: var(--theme-text-main, var(--vn-fg));
  padding: 0 6px;
  font-size: 11px;
  font-family: monospace;
  border-radius: 2px;
  outline: none;
  min-width: 0;
}

.bg-seed-input:focus {
  border-color: var(--theme-accent-soft, rgba(139, 69, 19, 0.5));
}

.bg-seed-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(90, 79, 64, 0.4);
  background: rgba(74, 64, 53, 0.3);
  color: var(--theme-text-muted, var(--vn-muted));
  border-radius: 2px;
  cursor: pointer;
  font-size: 0.65rem;
  transition: all 0.2s;
  flex-shrink: 0;
}

.bg-seed-btn:hover {
  color: var(--stain);
  border-color: rgba(196, 162, 101, 0.4);
}

.bg-seed-info {
  font-size: 8px;
  font-family: monospace;
  color: var(--theme-text-faint, rgba(139, 125, 107, 0.4));
  margin-top: 4px;
}

/* AI Settings */
.bg-ai-settings-panel {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(90, 79, 64, 0.2);
}

.bg-ai-settings-title {
  font-size: 8px;
  font-family: monospace;
  letter-spacing: 0.15em;
  color: var(--theme-text-muted, rgba(139, 125, 107, 0.6));
  text-transform: uppercase;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.bg-ai-settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.bg-ai-settings-label {
  font-size: 9px;
  color: var(--theme-text-muted, var(--vn-muted));
  font-family: 'Noto Serif SC', serif;
}

.bg-ai-toggle {
  width: 36px;
  height: 18px;
  border-radius: 9px;
  background: rgba(90, 79, 64, 0.3);
  border: 1px solid rgba(90, 79, 64, 0.4);
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
}

.bg-ai-toggle:hover {
  background: rgba(90, 79, 64, 0.4);
}

.bg-ai-toggle-on {
  background: rgba(139, 69, 19, 0.3);
  border-color: var(--theme-accent-soft, rgba(139, 69, 19, 0.5));
}

.bg-ai-toggle-slider {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--theme-text-muted, rgba(139, 125, 107, 0.6));
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.3s;
}

.bg-ai-toggle-on .bg-ai-toggle-slider {
  left: 20px;
  background: var(--stain);
}

.bg-ai-mode-btns {
  display: flex;
  gap: 4px;
}

.bg-ai-mode-btn {
  padding: 3px 8px;
  font-size: 9px;
  font-family: monospace;
  border: 1px solid rgba(90, 79, 64, 0.4);
  background: rgba(74, 64, 53, 0.2);
  color: var(--theme-text-muted, var(--vn-muted));
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
}

.bg-ai-mode-btn:hover {
  background: rgba(74, 64, 53, 0.4);
  border-color: rgba(90, 79, 64, 0.6);
}

.bg-ai-mode-btn-active {
  background: rgba(139, 69, 19, 0.2);
  border-color: var(--theme-accent-soft, rgba(139, 69, 19, 0.5));
  color: var(--stain);
}

.bg-ai-settings-hint {
  font-size: 8px;
  color: var(--theme-text-faint, rgba(139, 125, 107, 0.5));
  font-family: monospace;
  margin-top: 2px;
  text-align: center;
}

/* Game log */
.bg-log-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0;
}

.bg-log-title {
  padding: 8px 12px 6px;
  font-size: 8px;
  font-family: monospace;
  letter-spacing: 0.15em;
  color: var(--theme-text-muted, rgba(139, 125, 107, 0.6));
  text-transform: uppercase;
  border-bottom: 1px solid rgba(90, 79, 64, 0.15);
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.bg-log-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bg-log-entry {
  font-size: 9px;
  font-family: monospace;
  color: var(--theme-text-muted, rgba(139, 125, 107, 0.7));
  line-height: 1.5;
  word-break: break-all;
}

.bg-log-event {
  color: rgba(196, 162, 101, 0.8);
}
.bg-log-transfer {
  color: rgba(122, 176, 212, 0.8);
}
.bg-log-indent {
  color: rgba(90, 122, 74, 0.7);
  padding-left: 4px;
}

/* ── Event overlay ───────────────────────────────────────────── */
.bg-event-overlay {
  position: absolute;
  inset: 0;
  background: rgba(20, 16, 12, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
  backdrop-filter: blur(4px);
}

.bg-event-panel {
  width: 100%;
  max-width: 520px;
  background: rgba(42, 36, 32, 0.98);
  border: 1px solid rgba(90, 79, 64, 0.5);
  border-top: 3px solid var(--theme-accent-soft, rgba(139, 69, 19, 0.6));
  display: flex;
  flex-direction: column;
  gap: 0;
}

.bg-event-header {
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(90, 79, 64, 0.25);
}

.bg-event-type-badge {
  display: inline-block;
  font-size: 9px;
  font-family: monospace;
  letter-spacing: 0.15em;
  padding: 2px 8px;
  border-radius: 2px;
  margin-bottom: 8px;
  font-weight: bold;
}

.bg-badge-encounter {
  background: rgba(110, 26, 14, 0.4);
  color: #c46060;
  border: 1px solid rgba(110, 26, 14, 0.5);
}
.bg-badge-trap {
  background: rgba(139, 69, 19, 0.3);
  color: var(--theme-accent, var(--rust));
  border: 1px solid rgba(139, 69, 19, 0.4);
}
.bg-badge-fortune {
  background: rgba(74, 103, 65, 0.3);
  color: var(--vn-success);
  border: 1px solid rgba(90, 140, 74, 0.4);
}
.bg-badge-transfer {
  background: rgba(62, 84, 112, 0.3);
  color: #7ab0d4;
  border: 1px solid rgba(80, 120, 170, 0.4);
}

.bg-badge-loading {
  background: rgba(196, 162, 101, 0.2);
  color: var(--stain);
  border: 1px solid rgba(196, 162, 101, 0.4);
}

.bg-badge-error {
  background: rgba(139, 69, 19, 0.3);
  color: var(--theme-accent, var(--rust));
  border: 1px solid var(--theme-accent-soft, rgba(139, 69, 19, 0.5));
}

.bg-event-title {
  font-size: 1rem;
  font-weight: bold;
  color: var(--theme-text-main, rgba(212, 197, 160, 0.92));
  font-family: 'Noto Serif SC', serif;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.bg-event-flavor {
  font-size: 11px;
  color: var(--theme-text-muted, var(--vn-muted));
  font-family: 'Noto Serif SC', serif;
  line-height: 1.7;
  font-style: italic;
}

/* Cards area */
.bg-cards-area {
  padding: 20px;
}

/* Loading area */
.bg-loading-area {
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.bg-loading-spinner {
  animation: bg-loading-pulse 2s ease-in-out infinite;
}

@keyframes bg-loading-pulse {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.bg-loading-text {
  font-size: 11px;
  color: var(--theme-text-muted, var(--vn-muted));
  font-family: monospace;
  letter-spacing: 0.1em;
}

.bg-loading-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.bg-loading-btn {
  padding: 6px 16px;
  font-size: 11px;
  font-family: 'Noto Serif SC', serif;
  border-radius: 3px;
  cursor: pointer;
  letter-spacing: 0.06em;
  transition: all 0.2s;
}

.bg-loading-btn-cancel {
  border: 1px solid rgba(90, 79, 64, 0.5);
  background: rgba(74, 64, 53, 0.3);
  color: var(--theme-text-muted, var(--vn-muted));
}

.bg-loading-btn-cancel:hover {
  background: rgba(74, 64, 53, 0.5);
  border-color: rgba(90, 79, 64, 0.7);
}

/* Error area */
.bg-error-area {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.bg-error-actions {
  display: flex;
  gap: 10px;
}

.bg-error-btn {
  padding: 7px 18px;
  font-size: 11px;
  font-family: 'Noto Serif SC', serif;
  border-radius: 3px;
  cursor: pointer;
  letter-spacing: 0.06em;
  transition: all 0.2s;
}

.bg-error-btn-retry {
  border: 1px solid var(--theme-accent-soft, rgba(139, 69, 19, 0.5));
  background: rgba(139, 69, 19, 0.18);
  color: var(--stain);
}

.bg-error-btn-retry:hover {
  background: rgba(139, 69, 19, 0.32);
  border-color: var(--theme-accent, var(--rust));
}

.bg-error-btn-cancel {
  border: 1px solid rgba(90, 79, 64, 0.5);
  background: rgba(74, 64, 53, 0.3);
  color: var(--theme-text-muted, var(--vn-muted));
}

.bg-error-btn-cancel:hover {
  background: rgba(74, 64, 53, 0.5);
  border-color: rgba(90, 79, 64, 0.7);
}

.bg-cards-hint {
  text-align: center;
  font-size: 9px;
  font-family: monospace;
  letter-spacing: 0.15em;
  color: var(--theme-text-muted, rgba(139, 125, 107, 0.6));
  margin-bottom: 20px;
}

.bg-cards-row {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 12px;
  min-height: 160px;
}

/* Tarot cards */
.bg-tarot-wrapper {
  transform-origin: bottom center;
  cursor: pointer;
  flex-shrink: 0;
}

.bg-tarot-inner {
  width: 100px;
  height: 155px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1.2);
}

.bg-tarot-flipped {
  transform: rotateY(180deg);
}

.bg-tarot-face {
  position: absolute;
  inset: 0;
  border-radius: 6px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border: 1.5px solid rgba(90, 79, 64, 0.6);
  overflow: hidden;
}

/* Back face (initially visible) */
.bg-tarot-back {
  background: rgba(35, 30, 26, 0.95);
  transform: rotateY(0deg);
}

.bg-tarot-back-deco {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-tarot-back-border {
  position: absolute;
  inset: 6px;
  border: 1px solid rgba(139, 69, 19, 0.3);
  border-radius: 3px;
}

.bg-tarot-back-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.bg-tarot-back-symbol {
  font-size: 1.4rem;
  color: var(--theme-accent-soft, rgba(139, 69, 19, 0.5));
}

.bg-tarot-back-lines {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.bg-tarot-back-line {
  height: 1px;
  width: 40px;
  background: rgba(139, 69, 19, 0.25);
}

.bg-tarot-back-line:nth-child(2) {
  width: 28px;
}
.bg-tarot-back-line:nth-child(3) {
  width: 18px;
}

/* Front face (revealed on flip) */
.bg-tarot-front {
  background: rgba(48, 42, 36, 0.98);
  transform: rotateY(180deg);
}

.bg-tarot-front-content {
  padding: 12px 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bg-tarot-front-title {
  font-size: 11px;
  font-weight: bold;
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
  font-family: 'Noto Serif SC', serif;
  text-align: center;
  letter-spacing: 0.04em;
}

.bg-tarot-front-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(139, 69, 19, 0.4), transparent);
}

.bg-tarot-front-desc {
  flex: 1;
  font-size: 9px;
  color: var(--theme-text-muted, var(--vn-muted));
  font-family: 'Noto Serif SC', serif;
  line-height: 1.6;
  overflow: hidden;
}

.bg-tarot-front-confirm {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 8px;
  font-family: monospace;
  color: rgba(196, 162, 101, 0.5);
  letter-spacing: 0.05em;
}

.bg-tarot-front-tendency {
  font-size: 8px;
  font-family: monospace;
  text-align: center;
  letter-spacing: 0.05em;
  padding: 2px 0;
}

.bg-tendency-negative {
  color: rgba(220, 80, 80, 0.8);
}

.bg-tendency-positive {
  color: rgba(100, 200, 120, 0.8);
}

.bg-tendency-neutral {
  color: rgba(180, 160, 120, 0.8);
}

.bg-tarot-wrapper:hover .bg-tarot-inner:not(.bg-tarot-flipped) {
  transform: translateY(-6px);
}

/* Resolve area */
.bg-resolve-area {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.bg-resolve-card-title {
  font-size: 0.95rem;
  font-weight: bold;
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
  font-family: 'Noto Serif SC', serif;
  letter-spacing: 0.06em;
}

.bg-resolve-message {
  font-size: 12px;
  color: var(--theme-text-muted, var(--vn-muted));
  font-family: 'Noto Serif SC', serif;
  line-height: 1.8;
  text-align: center;
  max-width: 360px;
  font-style: italic;
}

.bg-resolve-effects {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.bg-effect-chip {
  font-size: 10px;
  font-family: monospace;
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: bold;
  letter-spacing: 0.04em;
}

.bg-effect-pos {
  background: rgba(90, 122, 74, 0.25);
  color: var(--vn-success);
  border: 1px solid rgba(90, 122, 74, 0.4);
}
.bg-effect-neg {
  background: rgba(139, 69, 19, 0.2);
  color: #c46060;
  border: 1px solid rgba(139, 37, 14, 0.4);
}
.bg-effect-transfer {
  background: rgba(62, 84, 112, 0.25);
  color: #7ab0d4;
  border: 1px solid rgba(80, 120, 170, 0.35);
}

.bg-continue-btn {
  margin-top: 4px;
  padding: 8px 28px;
  font-size: 12px;
  font-family: 'Noto Serif SC', serif;
  border: 1px solid var(--theme-accent-soft, rgba(139, 69, 19, 0.5));
  background: rgba(139, 69, 19, 0.18);
  color: var(--stain);
  border-radius: 3px;
  cursor: pointer;
  letter-spacing: 0.08em;
  transition: all 0.2s;
}

.bg-continue-btn:hover {
  background: rgba(139, 69, 19, 0.32);
  border-color: var(--theme-accent, var(--rust));
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
}

/* ── Overlay transition ──────────────────────────────────────── */
.bg-overlay-fade-enter-active,
.bg-overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}

.bg-overlay-fade-enter-from,
.bg-overlay-fade-leave-to {
  opacity: 0;
}
</style>
