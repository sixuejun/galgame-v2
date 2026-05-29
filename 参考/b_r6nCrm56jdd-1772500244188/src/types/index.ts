/* ==================== Map & Game Types ==================== */

/** Node event types that trigger when a player lands on them */
export type NodeType = 'empty' | 'encounter' | 'trap' | 'fortune' | 'transfer' | 'start'

/** A single map node */
export interface MapNode {
  id: string
  x: number          // coordinate in the map grid (px from left)
  y: number          // coordinate in the map grid (px from top)
  type: NodeType
  label?: string     // optional display name
  neighbors: string[] // IDs of connected nodes (bidirectional)
}

/** The complete map configuration */
export interface MapConfig {
  nodes: MapNode[]
  width: number      // total map width in px
  height: number     // total map height in px
  startNodeId: string
}

/** Player stats (simplified) */
export interface PlayerStats {
  hp: number
  maxHp: number
  sanity: number
  maxSanity: number
  luck: number
}

/** A single card option within an event */
export interface EventCard {
  id: string
  title: string
  description: string
  effect: CardEffect
}

/** The effect a card applies */
export interface CardEffect {
  hp?: number        // positive = heal, negative = damage
  sanity?: number
  luck?: number
  transfer?: boolean // if true, trigger random teleport
  message: string    // result text shown to player
}

/** An event that triggers on a node */
export interface GameEvent {
  id: string
  nodeType: NodeType
  title: string
  flavor: string     // atmospheric text
  cards: EventCard[] // 1~3 cards to choose from
}

/** Game state machine phases */
export type GamePhase =
  | 'idle'          // waiting for dice roll
  | 'rolling'       // dice animation
  | 'choosingPath'  // player selecting next node
  | 'event'         // event card popup
  | 'resolving'     // applying card effect

/** Direction of player's last movement for animation */
export interface MoveAnimation {
  fromX: number
  fromY: number
  toX: number
  toY: number
}
