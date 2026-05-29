import { defineStore } from 'pinia';
import { getRandomEvent } from './eventsConfig';
import { generateMap } from './mapGenerator';
import type { GameEvent, GamePhase, MapConfig, MapNode, PlayerStats } from './types';

export const useBoardGameStore = defineStore('boardGame', () => {
  // ── State machine ────────────────────────────────────────────
  const phase = ref<GamePhase>('idle');

  // ── Seed & Map ───────────────────────────────────────────────
  const seed = ref(1337);
  const mapConfig = ref<MapConfig>(generateMap(1337));

  // ── Player ───────────────────────────────────────────────────
  const currentNodeId = ref<string>(mapConfig.value.startNodeId);
  const stats = ref<PlayerStats>({ hp: 80, maxHp: 100, sanity: 70, maxSanity: 100, luck: 5 });

  // ── Dice / movement ──────────────────────────────────────────
  const diceValue = ref(0);
  const stepsRemaining = ref(0);
  const walkableNodeIds = ref<string[]>([]);
  // Path history: tracks the sequence of visited node IDs for back-prevention
  const moveHistory = ref<string[]>([mapConfig.value.startNodeId]);
  const isAnimating = ref(false);
  const totalSteps = ref(0);

  // ── Events ───────────────────────────────────────────────────
  // 统一事件格式：GameEvent 直接就是卡片
  const currentEvent = ref<GameEvent | null>(null);
  const selectedEvent = ref<GameEvent | null>(null);
  const resolveMessage = ref('');

  // ── AI Event Generation ──────────────────────────────────────
  const aiEventGenerating = ref(false);
  const aiEventError = ref<string | null>(null);
  const aiGeneratedEvent = ref<GameEvent | null>(null);
  const aiGenerationId = ref<string | null>(null); // Track generation ID for cancellation

  // ── Event Pool ───────────────────────────────────────────────
  // 事件池：地图生成时一次性填充，按格子类型从池中抽取，用掉即删除
  const eventPool = ref<GameEvent[]>([]);

  // ── Log ──────────────────────────────────────────────────────
  const gameLog = ref<string[]>(['□ 游戏开始，从起点出发。']);

  // ── Computed ─────────────────────────────────────────────────
  const nodeMap = computed<Map<string, MapNode>>(() => {
    const m = new Map<string, MapNode>();
    for (const n of mapConfig.value.nodes) m.set(n.id, n);
    return m;
  });

  const currentNode = computed(() => nodeMap.value.get(currentNodeId.value));

  const canRoll = computed(() => phase.value === 'idle' && !isAnimating.value);
  const canChoose = computed(() => phase.value === 'choosingPath' && !isAnimating.value);

  const visitedNodeIds = computed(() => new Set(moveHistory.value));

  // ── Actions ──────────────────────────────────────────────────

  function regenerateMap(newSeed?: number) {
    if (newSeed !== undefined) seed.value = newSeed;
    mapConfig.value = generateMap(seed.value);
    resetGame();
  }

  /**
   * 填充事件池（地图生成时调用一次）
   * 一次性调 API 拿到 9-12 张卡，存入池中
   */
  async function fillEventPool(
    sceneText: string,
    vnStore: any,
  ): Promise<void> {
    try {
      const events = await vnStore.generateBoardGameEventPool(sceneText);
      eventPool.value = events;
      if (events.length === 0) {
        console.warn('[BoardGame] 事件池为空，将使用备用事件');
      } else {
        console.info(`[BoardGame] 事件池已填充，共 ${events.length} 张卡`);
      }
    } catch (e) {
      console.error('[BoardGame] 填充事件池失败:', e);
      eventPool.value = [];
    }
  }

  /**
   * 从事件池中抽取一张匹配格子类型的卡，用掉即删除
   */
  function drawEventFromPool(nodeType: string): GameEvent | null {
    const filtered = eventPool.value.filter(e => e.nodeType === nodeType || nodeType === 'encounter');
    if (filtered.length === 0) {
      // 池空了，回退到手动事件
      console.info('[BoardGame] 事件池已空，回退到备用事件');
      return null;
    }
    const idx = Math.floor(Math.random() * filtered.length);
    const event = filtered[idx]!;
    eventPool.value = eventPool.value.filter(e => e.id !== event.id);
    console.info(`[BoardGame] 从池中抽取事件「${event.title}」，剩余 ${eventPool.value.length} 张`);
    return event;
  }

  /** idle → rolling */
  function rollDice() {
    if (phase.value !== 'idle') return;
    phase.value = 'rolling';
    diceValue.value = Math.floor(Math.random() * 6) + 1;
  }

  /** rolling → choosingPath (called after dice animation ends) */
  function finishRoll() {
    stepsRemaining.value = diceValue.value;
    addLog(`◈ 掷出 ${diceValue.value} 点`);
    phase.value = 'choosingPath';
    updateWalkable();
  }

  function updateWalkable() {
    const node = nodeMap.value.get(currentNodeId.value);
    if (!node) {
      walkableNodeIds.value = [];
      return;
    }
    // Prevent backtracking unless there's no other option
    const prev = moveHistory.value.length >= 2 ? moveHistory.value[moveHistory.value.length - 2] : null;
    let neighbors = [...node.neighbors];
    if (prev && neighbors.length > 1) neighbors = neighbors.filter(id => id !== prev);
    walkableNodeIds.value = neighbors;
  }

  /**
   * choosingPath → (still choosingPath if steps > 0) → event | idle
   * Returns { from, to } for the map component to animate.
   */
  function moveToNode(targetId: string): { from: string; to: string } | null {
    if (!canChoose.value) return null;
    if (!walkableNodeIds.value.includes(targetId)) return null;
    isAnimating.value = true;
    const from = currentNodeId.value;
    currentNodeId.value = targetId;
    stepsRemaining.value -= 1;
    totalSteps.value += 1;
    moveHistory.value.push(targetId);
    return { from, to: targetId };
  }

  /** Called by the map component after the move animation completes */
  function onMoveAnimationDone() {
    isAnimating.value = false;
    const node = nodeMap.value.get(currentNodeId.value);

    // Check if passed through end point (victory condition)
    if (node && node.type === 'end') {
      addLog(`★ 到达终点！地图即将刷新...`);
      setTimeout(() => {
        regenerateMap(Math.floor(Math.random() * 999999));
      }, 1500);
      return;
    }

    if (stepsRemaining.value <= 0) {
      // Only trigger event when steps are exhausted (and not on end point)
      if (node && node.type !== 'empty' && node.type !== 'start' && node.type !== 'end') {
        // Will trigger event - store node type for potential AI generation
        currentEventNodeType.value = node.type;
        triggerEvent(node);
      } else {
        addLog(`□ 停在空地`);
        phase.value = 'idle';
      }
    } else {
      // Still have steps remaining, update walkable nodes
      updateWalkable();
    }
  }

  const currentEventNodeType = ref<string | null>(null);

  /** choosingPath | idle → event */
  function triggerEvent(node: MapNode) {
    // 优先从事件池抽取
    const poolEvent = drawEventFromPool(node.type);
    if (poolEvent) {
      currentEvent.value = poolEvent;
      aiGeneratedEvent.value = null;
      phase.value = 'event';
      walkableNodeIds.value = [];
      addLog(`⚡ 触发事件：${poolEvent.title}`);
      return;
    }
    // 池空了，用手动事件
    const event = getRandomEvent(node.type);
    if (!event) {
      addLog(`□ 停在空地`);
      phase.value = 'idle';
      return;
    }
    currentEvent.value = event;
    aiGeneratedEvent.value = null;
    phase.value = 'event';
    walkableNodeIds.value = [];
    addLog(`⚡ 触发事件：${event.title}`);
  }

  function setAiGeneratedEvent(event: GameEvent) {
    aiGeneratedEvent.value = event;
    currentEvent.value = event;
  }

  function startAiEventGeneration(generationId: string) {
    aiEventGenerating.value = true;
    aiEventError.value = null;
    aiGenerationId.value = generationId;
  }

  function finishAiEventGeneration(success: boolean, error?: string) {
    aiEventGenerating.value = false;
    aiGenerationId.value = null;
    if (!success && error) {
      aiEventError.value = error;
    }
  }

  function retryAiEventGeneration() {
    aiEventError.value = null;
    aiEventGenerating.value = false;
    aiGenerationId.value = null;
  }

  function cancelAiEventGeneration() {
    // Stop the generation if it's still running
    if (aiGenerationId.value) {
      stopGenerationById(aiGenerationId.value);
    }
    aiEventGenerating.value = false;
    aiEventError.value = null;
    aiGenerationId.value = null;
    phase.value = 'idle';
  }

  /** event → resolving */
  function selectEvent(event: GameEvent) {
    if (phase.value !== 'event') return;
    selectedEvent.value = event;
    phase.value = 'resolving';
    applyEventEffect(event);
  }

  function applyEventEffect(event: GameEvent) {
    const e = event.effect;
    if (e.hp) stats.value.hp = Math.max(0, Math.min(stats.value.maxHp, stats.value.hp + e.hp));
    if (e.sanity) stats.value.sanity = Math.max(0, Math.min(stats.value.maxSanity, stats.value.sanity + e.sanity));
    resolveMessage.value = e.message;

    if (e.transfer) {
      // Transfer: teleport to a random empty node
      const emptyNodes = mapConfig.value.nodes.filter(n => n.type === 'empty' && n.id !== currentNodeId.value);
      if (emptyNodes.length > 0) {
        const target = emptyNodes[Math.floor(Math.random() * emptyNodes.length)]!;
        currentNodeId.value = target.id;
        moveHistory.value = [target.id]; // reset path history after teleport
        addLog(`⊙ 传送至新位置`);
      }
    }

    addLog(`  └ ${e.message}`);
  }

  /** resolving → idle */
  function finishResolve() {
    phase.value = 'idle';
    currentEvent.value = null;
    selectedEvent.value = null;
    resolveMessage.value = '';
    walkableNodeIds.value = [];
  }

  function addLog(text: string) {
    gameLog.value.push(text);
    if (gameLog.value.length > 120) gameLog.value = gameLog.value.slice(-120);
  }

  function resetGame() {
    phase.value = 'idle';
    currentNodeId.value = mapConfig.value.startNodeId;
    stats.value = { hp: 80, maxHp: 100, sanity: 70, maxSanity: 100, luck: 5 };
    diceValue.value = 0;
    stepsRemaining.value = 0;
    walkableNodeIds.value = [];
    moveHistory.value = [mapConfig.value.startNodeId];
    currentEvent.value = null;
    selectedEvent.value = null;
    resolveMessage.value = '';
    isAnimating.value = false;
    totalSteps.value = 0;
    eventPool.value = [];
    gameLog.value = ['□ 游戏重置，从起点出发。'];
  }

  return {
    phase,
    seed,
    mapConfig,
    currentNodeId,
    stats,
    diceValue,
    stepsRemaining,
    walkableNodeIds,
    moveHistory,
    isAnimating,
    totalSteps,
    currentEvent,
    selectedEvent,
    resolveMessage,
    aiEventGenerating,
    aiEventError,
    aiGeneratedEvent,
    aiGenerationId,
    currentEventNodeType,
    gameLog,
    nodeMap,
    currentNode,
    canRoll,
    canChoose,
    visitedNodeIds,
    regenerateMap,
    rollDice,
    finishRoll,
    updateWalkable,
    moveToNode,
    onMoveAnimationDone,
    triggerEvent,
    selectEvent,
    finishResolve,
    resetGame,
    addLog,
    setAiGeneratedEvent,
    startAiEventGeneration,
    finishAiEventGeneration,
    retryAiEventGeneration,
    cancelAiEventGeneration,
    // 事件池
    fillEventPool,
    drawEventFromPool,
    eventPool,
  };
});
