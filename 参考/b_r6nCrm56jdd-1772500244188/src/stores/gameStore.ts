import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GamePhase, PlayerStats, MapNode, GameEvent, EventCard, MapConfig } from '@/types'
import { defaultMap } from '@/data/mapConfig'
import { getRandomEvent } from '@/data/eventsConfig'

export const useGameStore = defineStore('game', () => {
  /* ================ State ================ */

  // State machine phase
  const phase = ref<GamePhase>('idle')

  // Map data
  const mapConfig = ref<MapConfig>(defaultMap)

  // Player position & stats
  const currentNodeId = ref<string>(defaultMap.startNodeId)
  const stats = ref<PlayerStats>({
    hp: 80,
    maxHp: 100,
    sanity: 70,
    maxSanity: 100,
    luck: 5,
  })

  // Dice
  const diceValue = ref<number>(0)
  const stepsRemaining = ref<number>(0)

  // Event state
  const currentEvent = ref<GameEvent | null>(null)
  const selectedCard = ref<EventCard | null>(null)
  const resolveMessage = ref<string>('')

  // Walkable neighbor highlights
  const walkableNodeIds = ref<string[]>([])

  // Movement history for current roll (for path rendering)
  const moveHistory = ref<string[]>([])

  // Animation lock
  const isAnimating = ref<boolean>(false)

  /* ================ Computed ================ */

  const currentNode = computed<MapNode | undefined>(() =>
    mapConfig.value.nodes.find(n => n.id === currentNodeId.value)
  )

  const nodeMap = computed<Map<string, MapNode>>(() => {
    const m = new Map<string, MapNode>()
    mapConfig.value.nodes.forEach(n => m.set(n.id, n))
    return m
  })

  const canRoll = computed(() => phase.value === 'idle' && !isAnimating.value)
  const canChoose = computed(() => phase.value === 'choosingPath' && !isAnimating.value)

  const isPlayerDead = computed(() => stats.value.hp <= 0)
  const isPlayerInsane = computed(() => stats.value.sanity <= 0)

  /* ================ Actions ================ */

  /** Roll the dice: transition idle -> rolling -> choosingPath */
  function rollDice() {
    if (phase.value !== 'idle') return
    phase.value = 'rolling'
    diceValue.value = Math.floor(Math.random() * 6) + 1
    stepsRemaining.value = diceValue.value
    moveHistory.value = [currentNodeId.value]
    selectedCard.value = null
    currentEvent.value = null
    resolveMessage.value = ''

    // rolling animation handled by component; after animation calls finishRoll()
  }

  /** Called after dice animation completes */
  function finishRoll() {
    phase.value = 'choosingPath'
    updateWalkable()
  }

  /** Update walkable highlights based on current node neighbors */
  function updateWalkable() {
    const node = nodeMap.value.get(currentNodeId.value)
    if (!node) {
      walkableNodeIds.value = []
      return
    }
    // Filter out the node we just came from (prevent backtracking in same roll),
    // unless it's the only option
    const prev = moveHistory.value.length >= 2
      ? moveHistory.value[moveHistory.value.length - 2]
      : null
    let neighbors = [...node.neighbors]
    if (prev && neighbors.length > 1) {
      neighbors = neighbors.filter(id => id !== prev)
    }
    walkableNodeIds.value = neighbors
  }

  /** Player clicks a walkable node: move there, steps-1 */
  function moveToNode(targetId: string) {
    if (phase.value !== 'choosingPath') return
    if (!walkableNodeIds.value.includes(targetId)) return
    if (isAnimating.value) return

    isAnimating.value = true
    const prevNodeId = currentNodeId.value
    currentNodeId.value = targetId
    stepsRemaining.value -= 1
    moveHistory.value.push(targetId)

    // Animation done callback is handled externally, calls onMoveAnimationDone()
    return { from: prevNodeId, to: targetId }
  }

  /** Called after GSAP move animation finishes */
  function onMoveAnimationDone() {
    isAnimating.value = false

    if (stepsRemaining.value <= 0) {
      // Check if landing node is an event node
      const node = nodeMap.value.get(currentNodeId.value)
      if (node && node.type !== 'empty' && node.type !== 'start') {
        triggerEvent(node)
      } else {
        phase.value = 'idle'
      }
    } else {
      updateWalkable()
    }
  }

  /** Trigger an event on the current node */
  function triggerEvent(node: MapNode) {
    const eventType = node.type as 'encounter' | 'trap' | 'fortune' | 'transfer'
    currentEvent.value = getRandomEvent(eventType)
    phase.value = 'event'
    walkableNodeIds.value = []
  }

  /** Player selects a card from the event */
  function selectCard(card: EventCard) {
    if (phase.value !== 'event') return
    selectedCard.value = card
    phase.value = 'resolving'
    applyCardEffect(card)
  }

  /** Apply the card's effect to player stats */
  function applyCardEffect(card: EventCard) {
    const e = card.effect
    if (e.hp) {
      stats.value.hp = clamp(stats.value.hp + e.hp, 0, stats.value.maxHp)
    }
    if (e.sanity) {
      stats.value.sanity = clamp(stats.value.sanity + e.sanity, 0, stats.value.maxSanity)
    }
    if (e.luck) {
      stats.value.luck += e.luck
    }
    resolveMessage.value = e.message

    if (e.transfer) {
      // Teleport to a random empty node
      const emptyNodes = mapConfig.value.nodes.filter(
        n => n.type === 'empty' && n.id !== currentNodeId.value
      )
      if (emptyNodes.length > 0) {
        const target = emptyNodes[Math.floor(Math.random() * emptyNodes.length)]
        currentNodeId.value = target.id
      }
    }
  }

  /** Finish resolving: back to idle */
  function finishResolve() {
    phase.value = 'idle'
    currentEvent.value = null
    selectedCard.value = null
    resolveMessage.value = ''
    walkableNodeIds.value = []
  }

  /** Reset the entire game */
  function resetGame() {
    phase.value = 'idle'
    currentNodeId.value = mapConfig.value.startNodeId
    stats.value = { hp: 80, maxHp: 100, sanity: 70, maxSanity: 100, luck: 5 }
    diceValue.value = 0
    stepsRemaining.value = 0
    currentEvent.value = null
    selectedCard.value = null
    resolveMessage.value = ''
    walkableNodeIds.value = []
    moveHistory.value = []
    isAnimating.value = false
  }

  /* ================ Helpers ================ */
  function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val))
  }

  return {
    // State
    phase,
    mapConfig,
    currentNodeId,
    stats,
    diceValue,
    stepsRemaining,
    currentEvent,
    selectedCard,
    resolveMessage,
    walkableNodeIds,
    moveHistory,
    isAnimating,

    // Computed
    currentNode,
    nodeMap,
    canRoll,
    canChoose,
    isPlayerDead,
    isPlayerInsane,

    // Actions
    rollDice,
    finishRoll,
    updateWalkable,
    moveToNode,
    onMoveAnimationDone,
    triggerEvent,
    selectCard,
    applyCardEffect,
    finishResolve,
    resetGame,
  }
})
