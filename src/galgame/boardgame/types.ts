// ===== Board Game Types =====

// 格子类型（仅作为"结果倾向权重"）
export type NodeType = 'start' | 'empty' | 'encounter' | 'trap' | 'fortune' | 'end';

// 事件倾向
export type EventTendency = 'negative' | 'positive' | 'neutral';

export interface MapNode {
  id: string;
  x: number;
  y: number;
  type: NodeType;
  label?: string;
  neighbors: string[];
}

export interface MapConfig {
  nodes: MapNode[];
  width: number;
  height: number;
  startNodeId: string;
}

export interface EventEffect {
  hp?: number;
  sanity?: number;
  transfer?: boolean;
  message: string;
}

/**
 * 统一事件格式
 * 每个事件就是一张独立卡片，包含：
 * - title: 事件标题（同时也是选项标题）
 * - description: 事件描述
 * - tendency: 结果倾向
 * - effect: 结果效果
 */
export interface GameEvent {
  id: string;
  nodeType: NodeType;
  title: string;
  description: string;
  tendency: EventTendency;
  effect: EventEffect;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  sanity: number;
  maxSanity: number;
  luck: number;
}

export type GamePhase = 'idle' | 'rolling' | 'choosingPath' | 'event' | 'resolving';
