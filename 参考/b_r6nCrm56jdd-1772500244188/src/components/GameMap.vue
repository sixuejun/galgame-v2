<template>
  <div
    class="game-map"
    :style="{ width: mapConfig.width + 'px', height: mapConfig.height + 'px' }"
  >
    <!-- SVG layer for connections -->
    <svg
      class="connections-layer"
      :viewBox="`0 0 ${mapConfig.width} ${mapConfig.height}`"
      :width="mapConfig.width"
      :height="mapConfig.height"
    >
      <defs>
        <!-- Glow filter for highlighted paths -->
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- All edges -->
      <line
        v-for="edge in edges"
        :key="edge.id"
        :x1="edge.x1" :y1="edge.y1"
        :x2="edge.x2" :y2="edge.y2"
        :class="[
          'edge-line',
          { 'edge-walkable': isEdgeWalkable(edge) }
        ]"
      />
    </svg>

    <!-- Node layer -->
    <div
      v-for="node in mapConfig.nodes"
      :key="node.id"
      class="map-node"
      :class="[
        `node-${node.type}`,
        {
          'node-current': node.id === store.currentNodeId,
          'node-walkable': store.walkableNodeIds.includes(node.id),
          'node-visited': store.moveHistory.includes(node.id),
        }
      ]"
      :style="{ left: node.x + 'px', top: node.y + 'px' }"
      @click="onNodeClick(node)"
    >
      <div class="node-icon">{{ nodeIcon(node.type) }}</div>
      <div v-if="node.label" class="node-label font-body">{{ node.label }}</div>
    </div>

    <!-- Player token -->
    <div
      ref="playerToken"
      class="player-token"
      :style="playerStyle"
    >
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import type { MapNode, NodeType } from '@/types'
import gsap from 'gsap'

const store = useGameStore()
const mapConfig = computed(() => store.mapConfig)
const playerToken = ref<HTMLElement>()

interface Edge {
  id: string
  x1: number; y1: number
  x2: number; y2: number
  fromId: string; toId: string
}

// Build edge list (deduplicated)
const edges = computed<Edge[]>(() => {
  const seen = new Set<string>()
  const result: Edge[] = []
  for (const node of mapConfig.value.nodes) {
    for (const nbId of node.neighbors) {
      const key = [node.id, nbId].sort().join('-')
      if (seen.has(key)) continue
      seen.add(key)
      const nb = store.nodeMap.get(nbId)
      if (!nb) continue
      result.push({
        id: key,
        x1: node.x, y1: node.y,
        x2: nb.x, y2: nb.y,
        fromId: node.id, toId: nbId,
      })
    }
  }
  return result
})

function isEdgeWalkable(edge: Edge): boolean {
  const cid = store.currentNodeId
  return (
    (edge.fromId === cid && store.walkableNodeIds.includes(edge.toId)) ||
    (edge.toId === cid && store.walkableNodeIds.includes(edge.fromId))
  )
}

const nodeIcon = (type: NodeType): string => {
  const icons: Record<NodeType, string> = {
    start: '\u2691',      // flag
    empty: '\u25CB',      // circle
    encounter: '\u2620',  // skull
    trap: '\u26A0',       // warning
    fortune: '\u2726',    // star
    transfer: '\u29C9',   // crossed circle
  }
  return icons[type] || '\u25CB'
}

// Player token position (centered on current node)
const playerStyle = computed(() => {
  const node = store.nodeMap.get(store.currentNodeId)
  if (!node) return { display: 'none' }
  return {
    left: node.x + 'px',
    top: node.y + 'px',
  }
})

// Watch for node changes and animate with GSAP
watch(
  () => store.currentNodeId,
  (newId, oldId) => {
    if (!playerToken.value || newId === oldId) return
    const oldNode = store.nodeMap.get(oldId)
    const newNode = store.nodeMap.get(newId)
    if (!oldNode || !newNode) return

    // Animate from old position to new
    gsap.fromTo(
      playerToken.value,
      { left: oldNode.x + 'px', top: oldNode.y + 'px' },
      {
        left: newNode.x + 'px',
        top: newNode.y + 'px',
        duration: 0.45,
        ease: 'power2.inOut',
        onComplete: () => {
          store.onMoveAnimationDone()
        },
      }
    )
  }
)

function onNodeClick(node: MapNode) {
  if (store.phase !== 'choosingPath') return
  if (!store.walkableNodeIds.includes(node.id)) return
  store.moveToNode(node.id)
}
</script>

<style scoped>
.game-map {
  position: relative;
  min-width: 100%;
  min-height: 100%;
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.edge-line {
  stroke: var(--color-node-border);
  stroke-width: 2;
  stroke-dasharray: 6 4;
  opacity: 0.4;
  transition: all 0.3s ease;
}

.edge-walkable {
  stroke: var(--color-highlight);
  stroke-width: 3;
  stroke-dasharray: none;
  opacity: 0.9;
  filter: url(#glow);
  animation: path-pulse 1.5s ease-in-out infinite;
}

@keyframes path-pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* Node styling */
.map-node {
  position: absolute;
  width: 40px;
  height: 40px;
  margin-left: -20px;
  margin-top: -20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
  cursor: default;
  transition: transform 0.2s ease, box-shadow 0.3s ease;
}

.node-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-node-bg);
  border: 2px solid var(--color-node-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow:
    inset 0 1px 3px rgba(42, 33, 24, 0.15),
    0 1px 4px rgba(42, 33, 24, 0.2);
  transition: all 0.3s ease;
}

.node-label {
  position: absolute;
  top: 100%;
  margin-top: 4px;
  font-size: 0.6rem;
  color: var(--color-ink-light);
  white-space: nowrap;
  letter-spacing: 0.05em;
  pointer-events: none;
  text-shadow: 0 0 4px var(--color-paper);
}

/* Node type colors */
.node-encounter .node-icon { border-color: var(--color-encounter); background: rgba(123, 110, 62, 0.25); }
.node-trap .node-icon { border-color: var(--color-trap); background: rgba(139, 37, 0, 0.2); }
.node-fortune .node-icon { border-color: var(--color-fortune); background: rgba(74, 103, 65, 0.2); }
.node-transfer .node-icon { border-color: var(--color-transfer); background: rgba(62, 84, 112, 0.2); }
.node-start .node-icon { border-color: var(--color-highlight); background: rgba(201, 169, 78, 0.25); font-size: 18px; }

/* Walkable state */
.node-walkable {
  cursor: pointer;
}
.node-walkable .node-icon {
  border-color: var(--color-highlight);
  box-shadow:
    0 0 8px rgba(201, 169, 78, 0.5),
    0 0 16px rgba(201, 169, 78, 0.25),
    inset 0 1px 3px rgba(42, 33, 24, 0.15);
  animation: pulse-glow 1.5s ease-in-out infinite;
}
.node-walkable:hover .node-icon {
  transform: scale(1.15);
  box-shadow:
    0 0 14px rgba(201, 169, 78, 0.7),
    0 0 24px rgba(201, 169, 78, 0.35),
    inset 0 1px 3px rgba(42, 33, 24, 0.15);
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 6px rgba(201, 169, 78, 0.4), inset 0 1px 3px rgba(42, 33, 24, 0.15); }
  50% { box-shadow: 0 0 14px rgba(201, 169, 78, 0.7), inset 0 1px 3px rgba(42, 33, 24, 0.15); }
}

/* Current node (player is here) */
.node-current .node-icon {
  border-color: var(--color-rust);
  box-shadow: 0 0 10px rgba(139, 69, 19, 0.4);
}

/* Visited trail */
.node-visited .node-icon {
  opacity: 0.7;
}

/* Player token */
.player-token {
  position: absolute;
  width: 32px;
  height: 32px;
  margin-left: -16px;
  margin-top: -42px;
  z-index: 10;
  color: var(--color-blood);
  filter: drop-shadow(0 2px 4px rgba(42, 33, 24, 0.5));
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
