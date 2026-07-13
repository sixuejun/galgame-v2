import { klona } from 'klona';
import _ from 'lodash';
import { z } from 'zod';
import type { GameEvent } from './boardgame/types';
import { useLatestMvuStore } from './latestMvuStore';
import { PROMPT_BOARD_GAME_EVENT_POOL } from './prompts/boardGameEvent';
import { PROMPT_DANMAKU, PROMPT_DANMAKU_AND_IMAGE } from './prompts/danmaku';
import { buildDispatchPrompt } from './prompts/dispatch';
import { buildRiddlePrompt } from './prompts/riddle';
import { PROMPT_SHOP } from './prompts/shop';
import { DEFAULT_PERSONALITY_PROMPT, SYSTEM_PERSONALITIES, type SystemPersonality } from './prompts/system';
import { buildWorkshopOrdersUserPrompt, PROMPT_WORKSHOP_ORDERS } from './prompts/workshopOrder';
import type { ComponentKey, ComponentSkin, ThemeDefinition } from './themes';
import { getComponentSkin, getTheme } from './themes';
import type { ImageTagBlock, MessageBlock } from './types/message';
import type { DispatchActive, DispatchRun, 地图配置, 技能, 结算结果, 角色 } from './types/role';
import {
  extractContentTag,
  extractDanmakuBlock,
  extractImageTagBlocks,
  extractPlainTextFromContent,
  fuzzyMatchTitle,
  parseMessageBlocks,
} from './utils/messageParser';
import { createVNLogger } from './utils/vnLogger';

// ====== Types ======

export interface DialogueLine {
  id: string;
  speaker?: string;
  text: string;
  isNarration?: boolean;
}

/** dialogues[] 中的楼层数据单元 */
export interface DialogueUnit {
  messageId: number; // 物理楼层号（mes_id）
  role: 'assistant' | 'user' | 'system'; // 消息角色
  isHidden: boolean; // 是否被隐藏
  message: string; // 原始文本
  blocks: MessageBlock[]; // 解析后的块（按需解析，缓存）
  danmaku: string[]; // 从 <dm> 提取的弹幕文本数组
  imageTags: ImageTagBlock[]; // 从 <background>/<image> 提取的生图标签
  parsed: boolean; // 是否已解析过 blocks/danmaku/imageTags
}

export interface Choice {
  choiceId: string;
  text: string;
  isCustomInput?: boolean;
}

export interface CharacterStatus {
  id: string;
  name: string;
  avatarUrl: string;
  affection: number;
  unlocked: boolean;
  description?: string;
  productionSpeed: number;
  productionYield: number;
  level: number;
}

export interface GameModule {
  moduleId: string;
  displayName: string;
  description: string;
  icon: string;
  openMode: 'overlay' | 'fullscreen';
  closeBehavior: 'returnHub' | 'returnVN';
  badge?: string;
}

export interface UserCharacter {
  name: string;
  avatarUrl: string;
  showSprite: boolean;
  avatarDisplayMode: 'off' | 'avatar' | 'sprite';
}

const UserCharacterSchema = z
  .object({
    name: z.string().default('旅人'),
    avatarUrl: z.string().default(''),
    showSprite: z.boolean().default(false),
    avatarDisplayMode: z.enum(['off', 'avatar', 'sprite']).default('off'),
  })
  .default({ name: '旅人', avatarUrl: '', showSprite: false, avatarDisplayMode: 'off' });

export interface InventoryItem {
  id: string;
  name: string;
  effect: string;
  quantity: number;
  icon?: string;
}

export interface TransactionRecord {
  moduleId: string;
  reason: string;
  amount: number;
  timestamp: number;
}

export interface ShopItem {
  id: string;
  name: string;
  effect: string;
  price: number;
  icon?: string;
  tags?: string[];
}

export interface DanmakuItem {
  id: string;
  text: string;
  track: number; // 轨道号
  progress: number; // 进度 0-1
  speed: number; // 速度 px/ms
  width: number; // 弹幕宽度(px)
  duration: number; // 动画时长(ms)
  version: number; // 版本号，用于设置变化时重新渲染
}

export interface RiddleRecord {
  answer: string;
  rounds: number;
  reward: number;
  timestamp: number;
}

export type OverlayPanel = 'none' | 'settings' | 'history' | 'character' | 'gameplay' | 'input';
export type ProviderStatus = 'available' | 'degraded' | 'disabled';

export interface SystemChatMessage {
  role:
    | 'user'
    | 'assistant'
    | 'proactive'
    | 'divider'
    | 'riddle_divider'
    | 'riddle_start'
    | 'riddle_end_pending'
    | 'riddle_end';
  text: string;
}

export interface SecondApiGeneration {
  id: string;
  type: 'danmaku' | 'imageTag' | 'variable' | 'boardGameEvent';
  content: string;
  timestamp: number;
  messageId: number;
  inserted: boolean;
}

export interface ImageCard {
  id: string;
  imageData: string;
  type: 'background' | 'cg';
  timestamp: number;
  prompt?: string; // 保存生成时的提示词，用于重试
  title?: string; // 保存标题，用于显示
}

// ====== Worldbook Enhancement Types ======

export interface WorldbookEntryEnhanced {
  uid: number;
  enabled: boolean;
  targetApi: 'main' | 'second' | 'both';
  autoControl: boolean;
  linkedFeature?: 'danmaku' | 'imageGen';
  /** Source worldbook name - set by getEnhancedWorldbook */
  _worldbookName?: string;
  // Original worldbook entry fields will be preserved
  [key: string]: any;
}

// ====== Schemas ======

const VNSettings = z
  .object({
    textSpeed: z.number().min(1).max(10).default(5),
    autoPlaySpeed: z.number().min(1).max(10).default(5),
    autoPlay: z.boolean().default(false),
    bgmVolume: z.number().min(0).max(100).default(70),
    sfxVolume: z.number().min(0).max(100).default(80),
    voiceVolume: z.number().min(0).max(100).default(100),
    // 立绘设置
    portraitScale: z.number().min(10).max(200).default(100),
    portraitX: z.number().min(-50).max(50).default(0),
    portraitY: z.number().min(-50).max(50).default(0),
    portraitMode: z.boolean().default(false),
    narrationSpriteInherit: z.boolean().default(true),
    skinId: z.string().default('newspaper-default'),
    themeId: z.enum(['newspaper', 'hedie', 'animal-island', 'liquid-glass']).default('newspaper'),
    themeEnabled: z.boolean().default(true),
    themeCustomCss: z.string().default(''),
    themeCustomCssSource: z.string().default(''),
    themeImportedCssName: z.string().default(''),
    themeImportedCssContent: z.string().default(''),
    themeOverrides: z
      .object({
        button: z.boolean().default(true),
        dialogue: z.boolean().default(true),
        toast: z.boolean().default(true),
        panel: z.boolean().default(true),
        stage: z.boolean().default(true),
      })
      .default({ button: true, dialogue: true, toast: true, panel: true, stage: true }),
    danmakuEnabled: z.boolean().default(false),
    danmakuSpeed: z.number().min(1).max(10).default(5),
    danmakuLoop: z.boolean().default(false),
    // 循环时长（秒）：一轮弹幕从开始到全部消失的间隔
    danmakuLoopDuration: z.number().min(2).max(60).default(10),
    danmakuDisplay: z.enum(['full', 'half', 'third']).default('third'),
    danmakuColor: z.string().default('#ffffff'),
    danmakuFontSize: z.number().min(0.8).max(2.5).default(1.2),
    danmakuOpacity: z.number().min(0.1).max(1).default(0.9),
    secondApiUrl: z.string().default(''),
    secondApiKey: z.string().default(''),
    secondApiModel: z.string().default(''),
    secondApiPreset: z.string().default(''),
    secondApiStream: z.boolean().default(false),
    secondApiTemperature: z.union([z.number(), z.literal('unset')]).default(1.0),
    secondApiMaxTokens: z.union([z.number(), z.literal('unset')]).default(6200),
    secondApiTopP: z.union([z.number(), z.literal('unset')]).default('unset'),
    secondApiTopK: z.union([z.number(), z.literal('unset')]).default('unset'),
    imageApiUrl: z.string().default(''),
    imageApiKey: z.string().default(''),
    imageGenEnabled: z.boolean().default(false),
    backgroundGenEnabled: z.boolean().default(false),
    cgGenEnabled: z.boolean().default(false),
    imageCardWheelEnabled: z.boolean().default(true), // 卡片轮盘开关（默认开启）
    imageGenPriority: z.enum(['cg', 'background']).default('cg'),
    autoStageGeneratedImage: z.boolean().default(false), // 生图完成后自动将第一张图片绑定到当前场景并显示到舞台
    // API task config
    apiTaskDanmaku: z.enum(['main', 'second', 'disabled']).default('second'),
    apiTaskImageTag: z.enum(['main', 'second', 'disabled']).default('second'),
    apiTaskVariable: z.enum(['main', 'second', 'disabled']).default('main'),
    // Board game settings
    boardGameEventGenEnabled: z.boolean().default(false),
    boardGameEventSendMode: z.enum(['direct', 'choice']).default('choice'),
    // Achievement settings
    achievementListEnabled: z.boolean().default(true),
    achievementShowCondition: z.boolean().default(true),
    achievementPageSize: z.number().min(1).max(20).default(5),
  })
  .prefault({});

const SECOND_API_TIMEOUT_MS = 30000;
const SECOND_API_RETRY_COUNT = 2;

// 生图：通过前端助手事件与外部插件通信，无需自配 API
export const ImageGenEventType = {
  GENERATE_IMAGE_REQUEST: 'generate-image-request',
  GENERATE_IMAGE_RESPONSE: 'generate-image-response',
} as const;

export type ImageGenRequestData = {
  id: string;
  prompt: string;
  width: number | null;
  height: number | null;
};

export type ImageGenResponseData = {
  id: string;
  success: boolean;
  imageData?: string;
  error?: string;
  prompt?: string;
  change?: string;
};

type OrderedPrompt = { role: 'system' | 'assistant' | 'user'; content: string };

export type SecondApiPayload = {
  ordered_prompts: OrderedPrompt[];
};

// ====== Second API Config Types ======

/** 所有 task 标识的联合类型 */
export type SecondApiTask =
  | 'danmaku'
  | 'shop'
  | 'system'
  | 'riddle'
  | 'imageTag'
  | 'danmakuAndImageGen'
  | 'boardGameEvent'
  | 'roleProfile'
  | 'workshopOrder'
  | 'dispatchStory';

/** 通用基础配置 */
interface BaseTaskConfig {
  task: SecondApiTask;
  silent?: boolean;
}

interface DispatchStoryConfig extends BaseTaskConfig {
  task: 'dispatchStory';
  userPrompt: string;
}

interface WorkshopOrderConfig extends BaseTaskConfig {
  task: 'workshopOrder';
  userPrompt: string;
}

interface ShopConfig extends BaseTaskConfig {
  task: 'shop';
}

interface BoardGameEventConfig extends BaseTaskConfig {
  task: 'boardGameEvent';
  sceneText: string;
}

interface RoleProfileConfig extends BaseTaskConfig {
  task: 'roleProfile';
  systemPrompt: string;
}

interface RiddleConfig extends BaseTaskConfig {
  task: 'riddle';
  personalityPrompt: string;
  chatLogText: string;
  latestHint: string;
}

interface SystemConfig extends BaseTaskConfig {
  task: 'system';
  personalityId: string;
  manualHistory: { role: 'assistant' | 'user'; content: string }[];
  userInput: string;
  context?: string;
}

interface DanmakuConfig extends BaseTaskConfig {
  task: 'danmaku' | 'danmakuAndImageGen';
  contentText: string;
}

interface ImageTagConfig extends BaseTaskConfig {
  task: 'imageTag';
  sceneDescription: string;
}

/** 第二 API 调用配置的联合类型 */
export type SecondApiConfig =
  | DispatchStoryConfig
  | WorkshopOrderConfig
  | ShopConfig
  | BoardGameEventConfig
  | RoleProfileConfig
  | RiddleConfig
  | SystemConfig
  | DanmakuConfig
  | ImageTagConfig;

const VNGameData = z
  .object({
    gold: z.number().default(500),
    inventory: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          effect: z.string(),
          quantity: z.number(),
        }),
      )
      .default([]),
    transactionLog: z
      .array(
        z.object({
          moduleId: z.string(),
          reason: z.string(),
          amount: z.number(),
          timestamp: z.number(),
        }),
      )
      .default([]),
    workshopLevel: z.number().min(1).max(10).default(1),
    puzzle2048Tiles: z.array(z.object({ value: z.number(), row: z.number(), col: z.number() })).default([]),
    puzzle2048Score: z.number().default(0),
    puzzle2048BestScore: z.number().default(0),
    puzzle2048Size: z.number().default(4),
    riddleLastRecord: z
      .object({
        answer: z.string(),
        rounds: z.number(),
        reward: z.number(),
        timestamp: z.number(),
      })
      .nullable()
      .default(null),
  })
  .prefault({});

// ====== Constants ======

const DEMO_CHARACTERS: CharacterStatus[] = [
  {
    id: 'c1',
    name: '???',
    avatarUrl: '',
    affection: 0,
    unlocked: true,
    description: '神秘的引路人。',
    productionSpeed: 1,
    productionYield: 10,
    level: 1,
  },
  {
    id: 'c2',
    name: '旧报童',
    avatarUrl: '',
    affection: 0,
    unlocked: false,
    description: '在废墟中收集旧报纸的少年。',
    productionSpeed: 1.2,
    productionYield: 12,
    level: 1,
  },
  {
    id: 'c3',
    name: '铁匠',
    avatarUrl: '',
    affection: 0,
    unlocked: false,
    description: '末日中仅存的工匠之一。',
    productionSpeed: 0.8,
    productionYield: 18,
    level: 1,
  },
];

const DEMO_MODULES: GameModule[] = [
  {
    moduleId: 'inventory',
    displayName: '背包',
    description: '查看已获得的物品',
    icon: 'fa-box-open',
    openMode: 'overlay',
    closeBehavior: 'returnHub',
  },
  {
    moduleId: 'idle_workshop',
    displayName: '工坊',
    description: '订单制生产金币，角色在工坊持续工作获取收益',
    icon: 'fa-hammer',
    openMode: 'overlay',
    closeBehavior: 'returnHub',
  },
  {
    moduleId: 'puzzle_2048',
    displayName: '思绪整理',
    description: '2048 合成小游戏，理清思路',
    icon: 'fa-puzzle-piece',
    openMode: 'overlay',
    closeBehavior: 'returnHub',
  },
  {
    moduleId: 'shop',
    displayName: '商店',
    description: '购买生存物资和特殊道具',
    icon: 'fa-shop',
    openMode: 'overlay',
    closeBehavior: 'returnHub',
  },
  {
    moduleId: 'ai_riddle',
    displayName: '情报交换',
    description: '与 AI 对话猜谜获取情报',
    icon: 'fa-comments',
    openMode: 'overlay',
    closeBehavior: 'returnHub',
  },
  {
    moduleId: 'character_management',
    displayName: '角色管理',
    description: '生成角色、查看档案、装备技能、管理状态',
    icon: 'fa-users',
    openMode: 'overlay',
    closeBehavior: 'returnHub',
  },
  {
    moduleId: 'dispatch',
    displayName: '废土行路',
    description: '派遣角色在末日废墟格子地图中探索，获取资源与故事',
    icon: 'fa-route',
    openMode: 'overlay',
    closeBehavior: 'returnHub',
  },
];

// ====== Utility: Commission / Fee ======

export function calcCommission(gold: number, workshopLevel: number, basePrice: number, threshold = 500): number {
  if (gold <= threshold) return basePrice;
  const rate = Math.min(0.05, workshopLevel * 0.005);
  return basePrice + Math.floor(gold * rate);
}

export function calcStockFee(workshopLevel: number): number {
  return Math.min(50, workshopLevel * 5);
}

export function get2048Size(workshopLevel: number): number[] {
  const sizes = [4];
  if (workshopLevel >= 4) sizes.push(6);
  if (workshopLevel >= 8) sizes.push(8);
  return sizes;
}

// ====== Parsers ======

export function parseDialogueLines(rawText: string): DialogueLine[] {
  const cleaned = rawText.replace(/<roleplay_options>[\s\S]*?(<\/roleplay_options>|$)/g, '').trim();
  if (!cleaned) return [];
  const paragraphs = cleaned.split(/\n{2,}/).filter(p => p.trim());
  const lines: DialogueLine[] = [];
  let idx = 0;
  for (const para of paragraphs) {
    const trimmed = para.trim();
    const speakerMatch = trimmed.match(/^\*\*(.+?)\*\*[：:]\s*/);
    if (speakerMatch) {
      lines.push({ id: String(idx++), speaker: speakerMatch[1], text: trimmed.slice(speakerMatch[0].length) });
    } else {
      lines.push({ id: String(idx++), text: trimmed, isNarration: true });
    }
  }
  return lines.length > 0 ? lines : [{ id: '0', text: cleaned, isNarration: true }];
}

export function parseChoices(rawText: string): Choice[] {
  const optionsMatch = rawText.match(/<roleplay_options>([\s\S]*?)(<\/roleplay_options>|$)/);
  if (!optionsMatch) return [];
  const choices: Choice[] = [];
  const optionRegex = /<option>([\s\S]*?)<\/option>/g;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = optionRegex.exec(optionsMatch[1])) !== null) {
    choices.push({ choiceId: `c${idx}`, text: match[1].trim() });
    idx++;
  }
  choices.push({ choiceId: 'custom', text: '', isCustomInput: true });
  return choices;
}

// ====== Stock Price Simulation ======

export function createStockSimulator(initialPrice = 100) {
  let price = initialPrice;
  let drift = 0;
  let impact = 0;
  let anchorPrice = initialPrice;
  const history: number[] = [price];

  function tick() {
    drift += (Math.random() - 0.5) * 0.3;
    drift = Math.max(-2, Math.min(2, drift)) * 0.95;
    const noise = (Math.random() - 0.5) * 4;
    const reversion = (anchorPrice - price) * 0.02;
    impact *= 0.85;
    price = Math.max(1, price + drift + noise + reversion + impact);
    price = Math.round(price * 100) / 100;
    history.push(price);
    if (history.length > 120) history.shift();
    return price;
  }

  function applyTradeImpact(direction: 'buy' | 'sell', amount: number) {
    impact += direction === 'buy' ? amount * 0.1 : -amount * 0.1;
  }

  function reset(newPrice?: number) {
    price = newPrice ?? Math.round((50 + Math.random() * 100) * 100) / 100;
    anchorPrice = price;
    drift = 0;
    impact = 0;
    history.length = 0;
    history.push(price);
  }

  return { tick, applyTradeImpact, getPrice: () => price, getHistory: () => history, reset };
}

// ====== 2048 Tile-based Logic ======

export type Tile2048 = {
  value: number;
  id: string;
  row: number;
  col: number;
  isNew?: boolean;
  justMerged?: boolean;
};

export type Direction2048 = 'up' | 'down' | 'left' | 'right';

let _tileIdCounter = 0;
function createTileId(): string {
  return `t${Date.now()}-${_tileIdCounter++}`;
}

function getEmptyCells(tiles: Tile2048[], gridSize: number): { row: number; col: number }[] {
  const occupied = new Set(tiles.map(t => `${t.row},${t.col}`));
  const empty: { row: number; col: number }[] = [];
  for (let r = 0; r < gridSize; r++)
    for (let c = 0; c < gridSize; c++) if (!occupied.has(`${r},${c}`)) empty.push({ row: r, col: c });
  return empty;
}

export function addNewTile2048(tiles: Tile2048[], gridSize: number): Tile2048[] {
  const empty = getEmptyCells(tiles, gridSize);
  if (empty.length === 0) return tiles;
  const { row, col } = empty[Math.floor(Math.random() * empty.length)];
  return [...tiles, { value: Math.random() < 0.9 ? 2 : 4, id: createTileId(), row, col, isNew: true }];
}

export function isGameOver2048(tiles: Tile2048[], gridSize: number): boolean {
  if (tiles.length < gridSize * gridSize) return false;
  for (const tile of tiles) {
    const { row, col, value } = tile;
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
        const neighbor = tiles.find(t => t.row === r && t.col === c);
        if (neighbor && neighbor.value === value) return false;
      }
    }
  }
  return true;
}

export function hasWon2048(tiles: Tile2048[]): boolean {
  return tiles.some(t => t.value >= 2048);
}

export function moveTiles2048(
  tiles: Tile2048[],
  direction: Direction2048,
  gridSize: number,
): { newTiles: Tile2048[]; scored: number; changed: boolean } {
  let sorted = tiles.map(t => ({ ...t, isNew: false, justMerged: false }));
  let scored = 0;
  let changed = false;

  sorted.sort((a, b) => {
    if (direction === 'up') return a.row - b.row;
    if (direction === 'down') return b.row - a.row;
    if (direction === 'left') return a.col - b.col;
    return b.col - a.col;
  });

  for (const tile of sorted) {
    let newRow = tile.row;
    let newCol = tile.col;

    while (true) {
      const nextRow = newRow + (direction === 'up' ? -1 : direction === 'down' ? 1 : 0);
      const nextCol = newCol + (direction === 'left' ? -1 : direction === 'right' ? 1 : 0);
      if (nextRow < 0 || nextRow >= gridSize || nextCol < 0 || nextCol >= gridSize) break;

      const target = sorted.find(t => t !== tile && t.row === nextRow && t.col === nextCol);
      if (target) {
        if (target.value === tile.value && !target.justMerged) {
          sorted = sorted.filter(t => t !== target && t !== tile);
          sorted.push({
            value: tile.value * 2,
            id: tile.id,
            row: nextRow,
            col: nextCol,
            isNew: false,
            justMerged: true,
          });
          scored += tile.value * 2;
          changed = true;
        }
        break;
      }

      newRow = nextRow;
      newCol = nextCol;
    }

    if (newRow !== tile.row || newCol !== tile.col) {
      tile.row = newRow;
      tile.col = newCol;
      changed = true;
    }
  }

  return { newTiles: sorted, scored, changed };
}

function initTiles2048(gridSize: number): Tile2048[] {
  let tiles: Tile2048[] = [];
  tiles = addNewTile2048(tiles, gridSize);
  tiles = addNewTile2048(tiles, gridSize);
  return tiles;
}

function tilesToSave(tiles: Tile2048[]): { value: number; row: number; col: number }[] {
  return tiles.map(t => ({ value: t.value, row: t.row, col: t.col }));
}

function tilesFromSave(saved: { value: number; row: number; col: number }[]): Tile2048[] {
  return saved.map(t => ({ value: t.value, row: t.row, col: t.col, id: createTileId() }));
}

// ====== Main Store ======

export const useVNStore = defineStore('vn', () => {
  const vnLog = createVNLogger('[VN]');
  const activeOverlay = ref<OverlayPanel>('none');
  const leftMenuExpanded = ref(false);
  const rightMenuExpanded = ref(false);
  const activeModuleId = ref<string | null>(null);
  const selectedChoiceId = ref<string | null>(null);
  const choiceLocked = ref(false);
  const customInputText = ref('');
  const tempOptions = ref<Choice[]>([]); // Temporary options from board game events
  const toastMessage = ref<string | null>(null);
  const toastVisible = ref(false);

  // --- Persisted settings (localStorage, key固定避免流式楼层iframe id不一致) ---
  function loadSettingsFromStorage(): z.infer<typeof VNSettings> {
    try {
      const raw = localStorage.getItem('vn_galgame_settings');
      if (raw) return VNSettings.parse(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    return VNSettings.parse({});
  }
  const settings = ref(loadSettingsFromStorage());
  watchEffect(() => {
    try {
      localStorage.setItem('vn_galgame_settings', JSON.stringify(klona(settings.value)));
    } catch {
      /* ignore */
    }
  });

  // --- Theme ---
  const currentTheme = computed<ThemeDefinition>(() => getTheme(settings.value.themeId));
  function getComponentSkinForCurrent(componentKey: ComponentKey): ComponentSkin | undefined {
    return getComponentSkin(settings.value.themeId, componentKey);
  }

  // --- Persisted game data ---
  // gold / inventory moved to MVU (message latest stat_data)
  const gameData = ref(VNGameData.parse({}));

  const _rawChatVars = getVariables({ type: 'chat' });
  const defaultUnlockedId = SYSTEM_PERSONALITIES[0]?.id ?? '';
  const systemChatHistories = ref<Record<string, SystemChatMessage[]>>(
    typeof _rawChatVars?.vn_system_chats === 'object' && _rawChatVars.vn_system_chats !== null
      ? (_rawChatVars.vn_system_chats as Record<string, SystemChatMessage[]>)
      : {},
  );
  const unlockedPersonalityIds = ref<Set<string>>(
    Array.isArray(_rawChatVars?.vn_unlocked_personality_ids)
      ? new Set(_rawChatVars.vn_unlocked_personality_ids as string[])
      : new Set(defaultUnlockedId ? [defaultUnlockedId] : []),
  );
  const unreadPersonalityIds = ref<Set<string>>(new Set());
  const lastActiveUnlockedPersonalityId = ref<string | null>(
    typeof _rawChatVars?.vn_last_active_unlocked_personality_id === 'string' &&
      _rawChatVars.vn_last_active_unlocked_personality_id
      ? _rawChatVars.vn_last_active_unlocked_personality_id
      : defaultUnlockedId || null,
  );
  watchEffect(() => {
    insertOrAssignVariables(
      {
        vn_system_chats: klona(systemChatHistories.value),
        vn_unlocked_personality_ids: Array.from(unlockedPersonalityIds.value),
        vn_last_active_unlocked_personality_id: lastActiveUnlockedPersonalityId.value,
      },
      { type: 'chat' },
    );
  });

  // 生图：同步到聊天变量供世界书条目启用（打开后自动启用对应世界书条目）
  watchEffect(() => {
    const on = settings.value.imageGenEnabled;
    const bg = on && settings.value.backgroundGenEnabled;
    const cg = on && settings.value.cgGenEnabled;
    insertOrAssignVariables({ vn_bg_gen_enabled: bg, vn_cg_gen_enabled: cg }, { type: 'chat' });
  });

  const systemChatOpen = ref(false);
  const activePersonalityId = ref<string | null>(null);

  // --- Last system prompt debug (for inspection) ---
  const lastSystemPrompts = ref<{ role: string; content: string }[]>([]);

  // --- Second API Generations Tracking ---
  const _rawGenVars = getVariables({ type: 'chat' });
  const secondApiGenerations = ref<SecondApiGeneration[]>(
    Array.isArray(_rawGenVars?.vn_second_api_generations) ? _rawGenVars.vn_second_api_generations : [],
  );

  watchEffect(() => {
    insertOrAssignVariables(
      {
        vn_second_api_generations: klona(secondApiGenerations.value),
      },
      { type: 'chat' },
    );
  });

  // --- Second API Error Tracking ---
  const secondApiLastErrorType = ref<'timeout' | 'network' | null>(null);
  const secondApiConsecutiveFailures = ref(0);
  const secondApiStatusOverride = ref<ProviderStatus>('available');
  const SECOND_API_DEGRADED_THRESHOLD = 3;

  // --- Character System State ---
  const _rawRoleVars = getVariables({ type: 'chat' });
  const roleMaxId = ref<number>(typeof _rawRoleVars?.role_max_id === 'number' ? _rawRoleVars.role_max_id : 0);
  const roles = ref<Record<string, 角色>>(
    typeof _rawRoleVars?.roles === 'object' && _rawRoleVars?.roles !== null
      ? (_rawRoleVars.roles as Record<string, 角色>)
      : {},
  );
  const skillsInventory = ref<技能[]>(Array.isArray(_rawRoleVars?.skillsInventory) ? _rawRoleVars.skillsInventory : []);
  const skillMaxId = ref<number>(typeof _rawRoleVars?.skill_max_id === 'number' ? _rawRoleVars.skill_max_id : 0);
  const skillDbMap = ref<Record<string, 技能>>(
    typeof _rawRoleVars?.skill_db_map === 'object' && _rawRoleVars?.skill_db_map !== null
      ? (_rawRoleVars.skill_db_map as Record<string, 技能>)
      : {},
  );
  const dispatchRuns = ref<DispatchRun[]>(Array.isArray(_rawRoleVars?.dispatchRuns) ? _rawRoleVars.dispatchRuns : []);

  // --- Dispatch System State ---
  const dispatchActive = ref<DispatchActive | null>(null);
  const dispatchMapConfig = ref<地图配置 | null>(null);
  const dispatchEventPool = ref<GameEvent[]>([]);
  const isDispatchRunning = ref(false);

  // 同步角色数据到聊天变量
  watchEffect(() => {
    insertOrAssignVariables(
      klona({
        role_max_id: roleMaxId.value,
        roles: klona(roles.value),
        skillsInventory: klona(skillsInventory.value),
        skill_max_id: skillMaxId.value,
        skill_db_map: klona(skillDbMap.value),
        dispatchRuns: klona(dispatchRuns.value),
      }),
      { type: 'chat' },
    );
  });

  // ====== Character System Actions ======

  function getRole(id: string): 角色 | null {
    return roles.value[id] ?? null;
  }

  function getRoleByName(name: string): 角色 | null {
    return Object.values(roles.value).find(r => r.姓名 === name) ?? null;
  }

  function getAllRoles(): 角色[] {
    return Object.values(roles.value);
  }

  function addRole(role: 角色): void {
    const numPart = parseInt(role.id.split('_')[1] ?? '0', 10);
    if (numPart > roleMaxId.value) roleMaxId.value = numPart;
    roles.value[role.id] = klona(role);
  }

  function updateRole(role: 角色): void {
    roles.value[role.id] = klona(role);
  }

  /**
   * 向角色追加一条记录（派遣/工坊/通讯等）
   *
   * @param roleId - 角色 ID
   * @param type - 记录类型
   * @param content - 内容（建议传 JSON 字符串，便于后续解析）
   */
  function appendRoleLog(roleId: string, type: '派遣' | '工坊' | '通讯' | '其他', content: string): void {
    const role = roles.value[roleId];
    if (!role) {
      console.warn(`[store] appendRoleLog: 角色 ${roleId} 不存在`);
      return;
    }

    const updated = klona(role);
    if (!updated.记录) updated.记录 = [];

    updated.记录.push({
      时间: Date.now(),
      类型: type,
      内容: content,
    });

    // 限制记录数量（最多保留最近 100 条）
    if (updated.记录.length > 100) {
      updated.记录 = updated.记录.slice(-100);
    }

    updateRole(updated);
  }

  function deleteRole(id: string): void {
    delete roles.value[id];
  }

  function equipSkill(roleId: string, skillId: string): boolean {
    const role = roles.value[roleId];
    if (!role) return false;
    if (!role.已装备技能.includes(skillId)) {
      const updated = klona(role);
      updated.已装备技能 = [...role.已装备技能, skillId];
      updateRole(updated);
    }
    return true;
  }

  function unequipSkill(roleId: string, skillId: string): boolean {
    const role = roles.value[roleId];
    if (!role) return false;
    const idx = role.已装备技能.indexOf(skillId);
    if (idx === -1) return false;
    const updated = klona(role);
    updated.已装备技能 = [...role.已装备技能];
    updated.已装备技能.splice(idx, 1);
    updateRole(updated);
    return true;
  }

  function getSkill(id: string): 技能 | null {
    return skillDbMap.value[id] ?? null;
  }

  function getSkillByName(name: string): 技能 | null {
    return Object.values(skillDbMap.value).find(s => s.名称 === name) ?? null;
  }

  function getAllSkills(): 技能[] {
    return Object.values(skillDbMap.value);
  }

  function addSkill(skill: 技能): void {
    skillDbMap.value[skill.id] = klona(skill);
    if (!skillsInventory.value.find(s => s.id === skill.id)) {
      skillsInventory.value = [...skillsInventory.value, klona(skill)];
    }
    const numPart = parseInt(skill.id.split('_')[1] ?? '0', 10);
    if (numPart > skillMaxId.value) skillMaxId.value = numPart;
  }

  function deleteSkill(id: string): void {
    delete skillDbMap.value[id];
    skillsInventory.value = skillsInventory.value.filter(s => s.id !== id);
  }

  function appendDispatchRun(run: DispatchRun): void {
    dispatchRuns.value = [...dispatchRuns.value, klona(run)];
  }

  function getAvailableRoles(): 角色[] {
    return Object.values(roles.value).filter(r => r.状态 === '空闲' || r.状态 === '休息中');
  }

  /**
   * 从扫描器批量同步角色/技能数据到 pinia ref
   *
   * 扫描器在扫描完成后调用此函数，确保 store 的 ref 与聊天变量保持一致，
   * 避免 store 的 watchEffect 把旧状态写回聊天变量导致数据丢失。
   */
  function syncRolesFromScanner(params: {
    roles: Record<string, 角色>;
    roleMaxId: number;
    skillDbMap: Record<string, 技能>;
    skillsInventory: 技能[];
  }): void {
    roles.value = klona(params.roles);
    roleMaxId.value = params.roleMaxId;
    skillsInventory.value = klona(params.skillsInventory);
    skillDbMap.value = klona(params.skillDbMap);
  }

  /**
   * 处理聊天扫描器解析出的 CMD 结果
   *
   * scanner.ts 在扫描消息后，将解析结果通过此函数 dispatch 回 store，
   * 由 store 统一更新 roles / skillDbMap / skillsInventory 等状态。
   * 后续 watchEffect 自动将状态同步到聊天变量。
   *
   * @param action - 扫描到的操作类型
   * @param data - 操作数据
   */
  function scanDispatch(
    action:
      | { type: 'ADD_ROLE'; role: 角色 }
      | { type: 'MOD_ROLE'; id: string; updates: Partial<角色> }
      | { type: 'DEL_ROLE'; id: string }
      | { type: 'EQUIP_SKILL'; roleId: string; skillId: string }
      | { type: 'UNEQUIP_SKILL'; roleId: string; skillId: string }
      | { type: 'ADD_SKILL'; skill: 技能 }
      | { type: 'DEL_SKILL'; id: string },
  ): void {
    switch (action.type) {
      case 'ADD_ROLE': {
        addRole(action.role);
        break;
      }
      case 'MOD_ROLE': {
        const existing = roles.value[action.id];
        if (existing) {
          updateRole({ ...existing, ...action.updates } as 角色);
        }
        break;
      }
      case 'DEL_ROLE': {
        deleteRole(action.id);
        break;
      }
      case 'EQUIP_SKILL': {
        equipSkill(action.roleId, action.skillId);
        break;
      }
      case 'UNEQUIP_SKILL': {
        unequipSkill(action.roleId, action.skillId);
        break;
      }
      case 'ADD_SKILL': {
        addSkill(action.skill);
        break;
      }
      case 'DEL_SKILL': {
        deleteSkill(action.id);
        break;
      }
    }
  }

  // ====== Dispatch System Actions ======

  function startDispatch(roleId: string, mapConfig: 地图配置): boolean {
    const role = roles.value[roleId];
    if (!role) return false;
    if (role.状态 !== '空闲' && role.状态 !== '休息中') return false;

    const updatedRole = klona(role);
    updatedRole.状态 = '派遣中';
    updateRole(updatedRole);

    dispatchActive.value = {
      派遣id: `dispatch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      角色id: roleId,
      状态: '派遣中',
      开始时间: Date.now(),
      地图配置: mapConfig,
      当前节点: 0,
      步数: 0,
      hp: 100,
      sanity: 100,
      事件历史: [],
      触发战斗次数: 0,
    };
    dispatchMapConfig.value = mapConfig;
    isDispatchRunning.value = true;

    return true;
  }

  function endDispatch(result: 结算结果, story?: string): void {
    if (!dispatchActive.value) return;

    const role = roles.value[dispatchActive.value.角色id];
    if (role) {
      const updatedRole = klona(role);
      updatedRole.状态 = '空闲';
      updatedRole.金币 = (updatedRole.金币 ?? 0) + result.总金币;
      updateRole(updatedRole);
    }

    const run: DispatchRun = {
      派遣id: dispatchActive.value.派遣id,
      角色id: dispatchActive.value.角色id,
      状态: result.状态 === '成功' ? '成功' : result.状态 === '强制结算' ? '强制结算' : '失败',
      开始时间: dispatchActive.value.开始时间,
      结束时间: Date.now(),
      地图配置: dispatchActive.value.地图配置,
      事件历史: dispatchActive.value.事件历史,
      触发战斗次数: dispatchActive.value.触发战斗次数,
      结算结果: {
        ...result,
        小故事: story ?? result.小故事,
      },
    };
    appendDispatchRun(run);

    dispatchActive.value = null;
    dispatchMapConfig.value = null;
    isDispatchRunning.value = false;
  }

  function getDispatchActive(): DispatchActive | null {
    return dispatchActive.value;
  }

  function cancelDispatch(roleId: string): void {
    if (!dispatchActive.value || dispatchActive.value.角色id !== roleId) return;

    const role = roles.value[roleId];
    if (role) {
      const updatedRole = klona(role);
      updatedRole.状态 = '休息中';
      updateRole(updatedRole);
    }

    const run: DispatchRun = {
      派遣id: dispatchActive.value.派遣id,
      角色id: roleId,
      状态: '失败',
      开始时间: dispatchActive.value.开始时间,
      结束时间: Date.now(),
      地图配置: dispatchActive.value.地图配置,
      事件历史: dispatchActive.value.事件历史,
      触发战斗次数: dispatchActive.value.触发战斗次数,
      结算结果: {
        状态: '失败',
        基础金币: 0,
        战斗加成: 0,
        总金币: 0,
        纪念品: [],
      },
    };
    appendDispatchRun(run);

    dispatchActive.value = null;
    dispatchMapConfig.value = null;
    isDispatchRunning.value = false;
  }

  function modifyDispatchHp(delta: number): void {
    if (!dispatchActive.value) return;
    dispatchActive.value.hp = Math.max(0, Math.min(100, dispatchActive.value.hp + delta));
    if (dispatchActive.value.hp <= 0) {
      endDispatch({ 状态: '失败', 基础金币: 0, 战斗加成: 0, 总金币: 0, 纪念品: [] });
    }
  }

  function modifyDispatchSanity(delta: number): void {
    if (!dispatchActive.value) return;
    dispatchActive.value.sanity = Math.max(0, Math.min(100, dispatchActive.value.sanity + delta));
    if (dispatchActive.value.sanity <= 0) {
      endDispatch({ 状态: '强制结算', 基础金币: 0, 战斗加成: 0, 总金币: 0, 纪念品: [] });
    }
  }

  function triggerDispatchEvent(event: GameEvent): void {
    if (!dispatchActive.value) return;

    const entry = {
      时间戳: Date.now(),
      节点: event.id,
      事件类型: event.tendency,
      描述: event.description,
    };
    dispatchActive.value.事件历史 = [...dispatchActive.value.事件历史, entry];
    dispatchActive.value.步数 += 1;

    if (event.effect.hp) {
      modifyDispatchHp(event.effect.hp);
    }
    if (event.effect.sanity) {
      modifyDispatchSanity(event.effect.sanity);
    }
  }

  async function generateDispatchStory(run: DispatchRun): Promise<string> {
    const role = roles.value[run.角色id];
    if (!role) return '';

    const userPrompt = `【派遣记录】
角色：${role.姓名}
开始时间：${new Date(run.开始时间).toLocaleString()}
地图：${run.地图配置.区域}
路线：${run.地图配置.路线.join(' → ')}

【事件历史】
${run.事件历史.map(e => `- ${e.描述}`).join('\n')}

【结算结果】
状态：${run.结算结果?.状态 ?? '未知'}
总金币：${run.结算结果?.总金币 ?? 0}
纪念品：${run.结算结果?.纪念品?.join('、') || '无'}`;

    try {
      const raw = await callSecondApi({
        task: 'dispatchStory',
        userPrompt,
      });
      return typeof raw === 'string' ? raw : '';
    } catch {
      console.warn('[Dispatch] 故事生成失败');
      return '';
    }
  }

  // ====== Workshop V2 Backend ======

  type WorkshopOrder = {
    名称: string;
    描述: string;
    技能类型: string;
    建议属性: string;
    预计价格: number;
    预计mod: string[];
  };

  type WorkshopLogEntry = {
    时间: string;
    角色: string;
    操作: '购买' | '学习' | '遗忘';
    技能: string;
    金币: number;
  };

  type WorkshopStats = {
    总花费: number;
    总订单数: number;
    角色数: number;
  };

  const workshopLogs = ref<WorkshopLogEntry[]>([]);

  async function generateWorkshopOrder(scene?: string): Promise<WorkshopOrder | null> {
    const existingSkills = skillsInventory.value.map(s => `${s.名称}: ${s.描述}`).join('\n');
    const worldInfo = scene || '废土世界的日常工坊任务';
    const userPrompt = buildWorkshopOrdersUserPrompt(
      worldInfo,
      gameData.value.workshopLevel,
      Object.keys(roles.value).length,
      existingSkills,
    );

    try {
      const raw = await callSecondApi({
        task: 'workshopOrder',
        userPrompt,
      });
      if (typeof raw !== 'string' || !raw.trim()) return null;

      const lines = raw
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);
      for (const line of lines) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 4) {
          return {
            名称: parts[1] || '',
            描述: parts[2] || '',
            技能类型: parts[0] || '通用',
            建议属性: '',
            预计价格: Math.floor(Math.random() * 100) + 30,
            预计mod: parts[3] ? parts[3].split(',').map(m => m.trim()) : [],
          };
        }
      }
      return null;
    } catch {
      console.warn('[Workshop] 订单生成失败');
      return null;
    }
  }

  function getWorkshopSkillCost(skill: 技能): number {
    let cost = 50;
    cost += skill.效果.length * 20;
    for (const effect of skill.效果) {
      if (effect.域 && effect.键) {
        cost += 10;
      }
    }
    return cost;
  }

  function purchaseSkill(roleId: string, skill: 技能, gold: number): boolean {
    const cost = getWorkshopSkillCost(skill);
    if (gold < cost) return false;

    addSkill(skill);

    const role = roles.value[roleId];
    if (role && (role.状态 === '工坊中' || role.状态 === '空闲')) {
      equipSkill(roleId, skill.id);
    }

    changeGold(-cost, '工坊', `购买技能：${skill.名称}`);

    workshopLogs.value = [
      ...workshopLogs.value,
      {
        时间: new Date().toLocaleString(),
        角色: role?.姓名 ?? roleId,
        操作: '购买',
        技能: skill.名称,
        金币: -cost,
      },
    ];

    return true;
  }

  function addWorkshopLog(entry: WorkshopLogEntry): void {
    workshopLogs.value = [...workshopLogs.value, entry];
  }

  function getWorkshopStats(): WorkshopStats {
    const logs = workshopLogs.value;
    return {
      总花费: logs.filter(l => l.操作 === '购买').reduce((sum, l) => sum + Math.abs(l.金币), 0),
      总订单数: logs.filter(l => l.操作 === '购买').length,
      角色数: new Set(logs.map(l => l.角色)).size,
    };
  }

  // --- Dialogue Units (Multi-floor management) ---
  const dialogues = ref<DialogueUnit[]>([]);
  const previewDialogueIndex = ref(0);
  const currentScene = ref<string>('');

  // 扁平可见块数组（跳过 user 角色和隐藏楼层的块，按顺序排列）
  // 每次 dialogues 或某个单元的 blocks 变化时重建
  // narration 块会继承最近一次 character/user 块的立绘 URL，形成连续立绘显示
  const allBlocksFlat = computed<Array<{ floorIndex: number; blockIndex: number; block: MessageBlock }>>(() => {
    const result: Array<{ floorIndex: number; blockIndex: number; block: MessageBlock }> = [];
    let lastSpriteImageUrl: string | undefined = undefined;
    for (let fi = 0; fi < dialogues.value.length; fi++) {
      const unit = dialogues.value[fi];
      if (unit.role === 'user' || unit.isHidden) continue;
      if (!unit.parsed) continue;
      for (let bi = 0; bi < unit.blocks.length; bi++) {
        const block = unit.blocks[bi];
        if (block.type === 'character' || block.type === 'user') {
          lastSpriteImageUrl = block.spriteImageUrl;
          result.push({ floorIndex: fi, blockIndex: bi, block });
        } else if (block.type === 'narration') {
          const blockToPush =
            settings.value.narrationSpriteInherit && lastSpriteImageUrl !== undefined
              ? { ...block, spriteImageUrl: lastSpriteImageUrl }
              : block;
          result.push({ floorIndex: fi, blockIndex: bi, block: blockToPush });
        } else {
          result.push({ floorIndex: fi, blockIndex: bi, block });
        }
      }
    }
    return result;
  });

  // 当前在扁平数组中的索引
  const currentBlockFlatIndex = ref(0);

  // ============================================================
  // 预渲染系统：提前解析当前楼层上下各 2 层（共最多 5 层），保证播放流畅
  // ============================================================
  const _preRenderedFloors = new Set<number>();

  /**
   * 预渲染指定楼层附近的多层（当前楼层 ±2 层，最多 5 层）。
   * 已解析的楼层不会重复解析。
   */
  async function preRenderFloors(aroundFloor: number) {
    const promises: Promise<void>[] = [];
    for (let delta = -2; delta <= 2; delta++) {
      const idx = aroundFloor + delta;
      if (idx < 0 || idx >= dialogues.value.length) continue;
      const unit = dialogues.value[idx];
      if (unit && !unit.parsed) {
        promises.push(parseCurrentFloor(idx));
      }
    }
    if (promises.length > 0) {
      console.info('[PreRender] 开始预渲染楼层', aroundFloor, '附近，共', promises.length, '层');
      await Promise.all(promises);
      console.info('[PreRender] 预渲染完成');
    }
  }

  // 当某个楼层解析完成时，将其加入预渲染集合
  watch(
    () => dialogues.value.map(u => u.parsed),
    () => {
      dialogues.value.forEach((u, i) => {
        if (u.parsed) _preRenderedFloors.add(i);
      });
    },
    { immediate: true, deep: true },
  );

  // ============================================================
  // 历史浏览系统（重写）：历史面板只做预览，点击跳转才操作主界面
  // ============================================================

  /**
   * 可见楼层的物理索引列表（跳过 user 和隐藏楼层）。
   * 历史面板的显示序号、跳转逻辑都基于这个列表的索引（display index）。
   */
  const visibleFloorIndices = computed<number[]>(() =>
    dialogues.value
      .map((unit, i) => ({ unit, i }))
      .filter(({ unit }) => unit.role !== 'user' && !unit.isHidden)
      .map(({ i }) => i),
  );

  /** 把「物理索引」转换成「显示序号」（在可见楼层列表中的索引）。找不到返回 -1。 */
  function physicalToDisplayIndex(physicalIndex: number): number {
    return visibleFloorIndices.value.indexOf(physicalIndex);
  }

  /** 把「显示序号」转换成「物理索引」。超出范围时返回第一个/最后一个可见楼层。 */
  function displayToPhysicalIndex(displayIndex: number): number {
    const visible = visibleFloorIndices.value;
    if (visible.length === 0) return 0;
    if (displayIndex < 0) return visible[0]!;
    if (displayIndex >= visible.length) return visible[visible.length - 1]!;
    return visible[displayIndex]!;
  }

  /**
   * 当前正在观看的楼层对应的「显示序号」（-1 表示尚未定位）。
   * 用于打开历史面板时把光标定位到玩家当前所在的楼层。
   */
  const currentDisplayFloorIndex = computed<number>(() =>
    physicalToDisplayIndex(currentFloorIndex.value),
  );

  /**
   * 历史面板当前预览的「显示序号」（在可见楼层列表中的索引）。
   * 独立于主界面的 currentBlockFlatIndex，翻页不会触发主界面跳转。
   */
  const historyPreviewFloorIndex = ref(0);

  /**
   * 历史面板中当前预览楼层的块内索引（由面板内翻页操作）。
   */
  const historyPreviewBlockIndex = ref(0);

  /**
   * 进入历史浏览模式：把光标定位到指定「显示序号」。
   * 默认使用「玩家当前正在观看的楼层」，让面板打开时不打断上下文。
   */
  function enterHistoryBrowse(displayFloorIndex: number = currentDisplayFloorIndex.value) {
    const visible = visibleFloorIndices.value;
    const clampedFloor = visible.length === 0
      ? 0
      : Math.max(0, Math.min(displayFloorIndex, visible.length - 1));
    historyPreviewFloorIndex.value = clampedFloor;
    historyPreviewBlockIndex.value = 0;
  }

  /**
   * 退出历史浏览模式。
   */
  function exitHistoryBrowse() {
    // no-op，状态已在组件中独立管理
  }

  /**
   * 跳转到历史面板预览的楼层（主界面真正跳转）。
   * 若跳转距离过远（>5 层），先触发预渲染并延迟。
   */
  function navigateToHistoryPreview() {
    const targetDisplay = historyPreviewFloorIndex.value;
    const target = displayToPhysicalIndex(targetDisplay);
    const current = currentFloorIndex.value;
    const distance = Math.abs(target - current);

    if (distance <= 5) {
      navigateFloorTo(target, historyPreviewBlockIndex.value);
    } else {
      console.info('[History] 跳转距离', distance, '层，先预渲染');
      preRenderFloors(target).then(() => {
        navigateFloorTo(target, historyPreviewBlockIndex.value);
      });
    }
  }

  // 从扁平索引派生的当前楼层/块索引（供兼容层使用）
  const currentFloorIndex = computed(() => allBlocksFlat.value[currentBlockFlatIndex.value]?.floorIndex ?? 0);
  const currentBlockInnerIndex = computed(() => allBlocksFlat.value[currentBlockFlatIndex.value]?.blockIndex ?? 0);

  // 当前显示的块
  const currentBlock = computed(() => allBlocksFlat.value[currentBlockFlatIndex.value]?.block ?? null);

  // 初始化阶段：把光标的目标楼层锁定为“最新可见楼层的第一块”。
  // 该状态会在首次 pre-render 完成后清除。
  let _initTargetFloorIndex: number | null = null;

  // Load all dialogue units from chat history
  async function loadAllDialogues() {
    try {
      // 进入初始化阶段：把光标的目标楼层锁定为“最新可见楼层的第一块”。
      // 该状态会在首次 pre-render 完成后（或用户主动导航时）清除。
      _initTargetFloorIndex = null;
      const lastId = getLastMessageId();
      // 注意：酒馆助手 getChatMessages 在 hide_state: 'unhidden' 时可能有 bug，
      // 某些 is_hidden: undefined 的消息也会被过滤，所以改用 hide_state: 'all' 再手动过滤
      const messages = getChatMessages('0-' + lastId, { hide_state: 'all' }).filter(msg => !msg.is_hidden);
      if (!messages || messages.length === 0) {
        dialogues.value = [];
        currentBlockFlatIndex.value = 0;
        previewDialogueIndex.value = 0;
        console.info('[Dialogues] 聊天记录为空');
        return;
      }

      dialogues.value = messages.map(msg => ({
        messageId: msg.message_id,
        role: (msg.role as 'assistant' | 'user' | 'system') || 'assistant',
        isHidden: msg.is_hidden ?? false,
        message: msg.message ?? '',
        blocks: [],
        danmaku: [],
        imageTags: [],
        parsed: false,
      }));

      // 跳到最后一个可见楼层（倒序扫描，找第一个有块的 assistant 楼层）
      for (let i = dialogues.value.length - 1; i >= 0; i--) {
        const u = dialogues.value[i];
        if (u.role === 'user' || u.isHidden) continue;
        await parseCurrentFloor(i);
        if (u.blocks.length > 0) {
          // 找到最后一个有块的可见楼层后，currentBlockFlatIndex 会通过 watcher 更新
          previewDialogueIndex.value = i;
          _initTargetFloorIndex = i;
          break;
        }
      }

      // 初始化完成后：预渲染当前楼层附近的多层。
      // preRenderFloors 是异步的：等它结束后再清除“初始化目标”，
      // 避免在 pre-render 把较老楼层加进 allBlocksFlat 时，光标被错误地拉到 floor 0。
      preRenderFloors(previewDialogueIndex.value).finally(() => {
        _initTargetFloorIndex = null;
      });

      // 初始化时：如果最新楼层已经包含图像标签，则立刻触发生图
      try {
        const initUnit = dialogues.value[previewDialogueIndex.value];
        if (initUnit?.parsed && initUnit.imageTags.length > 0) {
          await processImageTagBlocks(initUnit.imageTags);
        }
      } catch (e) {
        console.warn('[ImageGen] 初始化触发生图失败:', e);
      }

      // currentBlockFlatIndex 已经在 watcher 中被设置到“最新楼层的第一个块”
      console.info('[Dialogues] 加载完成，共', dialogues.value.length, '个楼层');
    } catch (err) {
      console.error('[Dialogues] loadAllDialogues 失败:', err);
    }
  }

  // When allBlocksFlat changes, adjust currentBlockFlatIndex.
  // 初始化阶段：始终把光标定位到“最新楼层（previewDialogueIndex）的第一个块”。
  // 注意：preRenderFloors 会先把“比最新楼层更早”的楼层解析出来，allBlocksFlat 长度会随
  // 这些较早楼层的加入而增长，因此初始化期间光标需要在每次变化时重新定位，否则会停在 floor 0。
  watch(allBlocksFlat, newBlocks => {
    if (newBlocks.length === 0) {
      currentBlockFlatIndex.value = 0;
      _initTargetFloorIndex = null;
      return;
    }

    if (_initTargetFloorIndex !== null) {
      // 仍在初始化阶段：把光标定位到“目标楼层（最新楼层）的第一个块”。
      // 若该楼层还未被解析（pre-render 还没轮到），退回到当前扁平数组的第一个块。
      const firstIdxOfTarget = newBlocks.findIndex(x => x.floorIndex === _initTargetFloorIndex);
      if (firstIdxOfTarget >= 0) {
        currentBlockFlatIndex.value = firstIdxOfTarget;
      } else {
        currentBlockFlatIndex.value = 0;
      }
    } else if (currentBlockFlatIndex.value >= newBlocks.length) {
      currentBlockFlatIndex.value = newBlocks.length - 1;
    }
  });

  // 切换楼层时：清空弹幕，然后从新楼层读取并显示对应弹幕
  let _prevFloorIndexForDanmaku = -1;
  watch(currentBlockFlatIndex, () => {
    if (!settings.value.danmakuEnabled) return;
    const floorIdx = currentFloorIndex.value;
    if (floorIdx === _prevFloorIndexForDanmaku) return;
    _prevFloorIndexForDanmaku = floorIdx;

    const unit = dialogues.value[floorIdx];
    if (!unit) return;

    // 立即清空旧弹幕
    clearDanmaku();

    if (unit.parsed && unit.danmaku.length > 0) {
      displayDanmakuFromMessage(unit.message);
    }
  });

  // Parse a specific dialogue unit by index (lazy, cached)
  async function parseCurrentFloor(index: number) {
    const unit = dialogues.value[index];
    if (!unit) return;
    if (unit.parsed) return;

    try {
      let role: 'assistant' | 'user' | 'system' = 'assistant';
      try {
        const msg = getChatMessages(unit.messageId)[0];
        role = (msg?.role as typeof role) || 'assistant';
      } catch {
        // 如果 getChatMessages 失败（如开局消息），使用默认值
      }
      const blocks = await parseMessageBlocks(unit.message, currentScene.value, role);

      unit.blocks = blocks;
      unit.danmaku = extractDanmakuBlock(unit.message);
      unit.imageTags = extractImageTagBlocks(unit.message);
      unit.parsed = true;

      for (let i = blocks.length - 1; i >= 0; i--) {
        if (blocks[i].scene) {
          currentScene.value = blocks[i].scene!;
          break;
        }
      }

      // 注意：{{剧情文本}} 的写入在 index.ts 的 triggerDanmakuAndImageGen 中完成，
      // 由 GENERATION_ENDED 事件触发，写到当前楼层的 MVU 变量（stat_data.剧情文本）。
      // parseCurrentFloor 只负责解析结构化数据，不写变量。

      console.info('[Dialogues] 楼层', index, '解析完成，共', blocks.length, '个块');
    } catch (err) {
      console.error('[Dialogues] 解析楼层', index, '失败:', err);
      // 即使解析失败，也标记为已尝试（避免无限重试）
      unit.blocks = [];
      unit.parsed = true;
    }
  }

  // Append a new message to dialogues
  async function appendNewMessage(messageId: number) {
    try {
      // 防御性去重: 在极端情况下(例如酒馆 regenerate 走"删旧+建新"路径但 MESSAGE_DELETED
      // 因竞争未到达,或该 message_id 已经被用作占位单元),同一 messageId 多次 push 会造成
      // 界面上出现两个相同楼层号的"鬼影"。这里在 push 前再做一次检查:
      // - 如果已存在同 messageId 的单元,优先复用并刷新内容,避免堆叠;
      // - 这样既不影响正常 swipe(同 messageId 内容更新),也能保证 regenerate 后界面正确。
      const existingIdx = dialogues.value.findIndex(d => d.messageId === messageId);
      if (existingIdx >= 0) {
        // 已有该 messageId 的单元: 用最新酒馆内容刷新它。
        // updateDialogueUnit 内部会自动把光标跳到该楼层的第一个块(参见函数内注释)。
        // 因此这里无需再额外调整 currentBlockFlatIndex,
        // 也不需要 follow-up 检查越界 — 都由 updateDialogueUnit 兜底。
        await updateDialogueUnit(messageId);
        return;
      }

      // 尝试从酒馆获取消息内容、role、isHidden
      let message = '';
      let role: 'assistant' | 'user' | 'system' = 'assistant';
      let isHidden = false;
      try {
        const messages = getChatMessages(messageId);
        // 关键校验: 酒馆助手的 getChatMessages 在传入越界 messageId 时会返回"最新楼层"的占位内容
        // (例如 messageId=3 不存在时, 它会返回 [{message_id: 3, message: <最新楼层内容>}]),
        // 直接 push 会创建出一个内容复制、messageId 跟聊天文件对不上的"鬼打墙"楼层。
        // 这里要求返回结果的 message_id 必须严格等于传入的 messageId 才接受,否则拒绝 push。
        if (messages && messages.length > 0 && messages[0]?.message_id === messageId) {
          const msg = messages[0];
          if (msg.message !== undefined) message = msg.message;
          if (msg.role) role = msg.role as typeof role;
          if (msg.is_hidden !== undefined) isHidden = msg.is_hidden;
        } else {
          console.warn(
            '[Dialogues] appendNewMessage: getChatMessages 返回的 message_id 与入参不一致,跳过 push,',
            'input=', messageId, 'returned=', messages?.[0]?.message_id,
          );
          return;
        }
      } catch (err) {
        // API 失败时, 不 push (避免空单元污染 store), 等下一次事件/MESSAGE_UPDATED 再补回来
        console.warn('[Dialogues] appendNewMessage: getChatMessages 调用失败,跳过 push', messageId, err);
        return;
      }

      // 记录追加前的扁平块信息，用于判断“是否在看最新”
      const flatBefore = allBlocksFlat.value;
      const wasAtLastBeforeAppend = flatBefore.length > 0 && currentBlockFlatIndex.value === flatBefore.length - 1;

      dialogues.value.push({
        messageId,
        role,
        isHidden,
        message,
        blocks: [],
        danmaku: [],
        imageTags: [],
        parsed: false,
      });

      const newIndex = dialogues.value.length - 1;
      // 解析新楼层（user/隐藏楼层会被 allBlocksFlat 过滤，无需特殊处理）
      await parseCurrentFloor(newIndex);

      // 只有当用户在"最新位置"时，才自动跟随新楼层。
      if (wasAtLastBeforeAppend) {
        // 目标体验：新楼层到达后，进入该楼层的第一个块（而不是停在旧的 choice）。
        const flatAfter = allBlocksFlat.value;
        const firstIdxOfNewFloor = flatAfter.findIndex(x => x.floorIndex === newIndex);
        if (firstIdxOfNewFloor >= 0) {
          currentBlockFlatIndex.value = firstIdxOfNewFloor;
        }
        previewDialogueIndex.value = newIndex;
        clearChoices();
        // 新楼层到达后，预渲染附近的多层
        preRenderFloors(newIndex);
      }

      const unit = dialogues.value[newIndex];
      if (unit.parsed && unit.danmaku.length > 0) {
        displayDanmakuFromMessage(unit.message);
      }

      // 新楼层到达：如包含图像标签，触发生图（由 settings 决定是否真的发请求）
      if (unit.parsed && unit.imageTags.length > 0) {
        await processImageTagBlocks(unit.imageTags);
      }
    } catch (err) {
      console.error('[Dialogues] appendNewMessage 失败:', err);
    }
  }

  // Remove a dialogue unit by messageId (e.g. when the user deletes that chat message).
  // Adjusts currentBlockFlatIndex so the cursor does not point past the new end of the flat array,
  // and clamps previewDialogueIndex if it referenced the removed floor.
  function removeDialogueUnit(messageId: number) {
    const idx = dialogues.value.findIndex(d => d.messageId === messageId);
    if (idx < 0) return;

    const flat = allBlocksFlat.value;
    // Map current flat index -> (floorIndex, blockIndex)
    const cur = flat[currentBlockFlatIndex.value];
    const curFloorBefore = cur?.floorIndex ?? -1;

    dialogues.value.splice(idx, 1);

    // After removal, all floors with index > idx shift down by 1.
    // The blocks that belonged to the removed floor are gone; blocks after idx keep their
    // floorIndex value but the array entry's floorIndex now points to a different message.
    // For correctness, recompute currentBlockFlatIndex by anchoring on the floor we were on.
    const flatAfter = allBlocksFlat.value;
    if (flatAfter.length === 0) {
      currentBlockFlatIndex.value = 0;
      previewDialogueIndex.value = 0;
      return;
    }

    let targetFloor: number;
    if (curFloorBefore === idx) {
      // The cursor was on the removed floor -> jump to the new last visible block.
      targetFloor = flatAfter[flatAfter.length - 1].floorIndex;
      currentBlockFlatIndex.value = flatAfter.length - 1;
    } else if (curFloorBefore > idx) {
      // The cursor was on a floor that shifted down by 1; keep the same inner position.
      targetFloor = curFloorBefore - 1;
      const sameBlockIdx = cur?.blockIndex ?? 0;
      const flatIdx = flatAfter.findIndex(b => b.floorIndex === targetFloor && b.blockIndex === sameBlockIdx);
      currentBlockFlatIndex.value = flatIdx >= 0 ? flatIdx : Math.max(0, flatAfter.length - 1);
    } else {
      // Cursor was on an earlier floor: nothing to move.
      targetFloor = curFloorBefore;
      // But our old flat index may now point past the new array due to removed blocks.
      if (currentBlockFlatIndex.value >= flatAfter.length) {
        currentBlockFlatIndex.value = flatAfter.length - 1;
      }
    }

    if (previewDialogueIndex.value === idx) {
      previewDialogueIndex.value = targetFloor >= 0 ? targetFloor : 0;
    } else if (previewDialogueIndex.value > idx) {
      previewDialogueIndex.value = Math.max(0, previewDialogueIndex.value - 1);
    }
  }

  // When a chat message is deleted (manually, or as part of "retry from here" / "regenerate" that
  // removes then re-creates the floor), drop the corresponding unit so we don't keep a stale
  // "ghost floor" in dialogues.
  eventOn(tavern_events.MESSAGE_DELETED, (messageId: number) => {
    try {
      const idx = dialogues.value.findIndex(d => d.messageId === messageId);
      if (idx < 0) return;
      console.info('[Dialogues] 楼层被删除, 移除 dialogues 中对应单元:', messageId);
      removeDialogueUnit(messageId);
    } catch (err) {
      console.warn('[Dialogues] 处理 MESSAGE_DELETED 失败:', err);
    }
  });

  // When a message is swiped to a new variant (or its swipe index changes), make sure the unit
  // we hold is refreshed - same messageId, possibly new content. updateDialogueUnit already
  // handles content refresh; this is a defensive hook in case the swipe mechanism only fires
  // MESSAGE_SWIPED without MESSAGE_UPDATED.
  eventOn(tavern_events.MESSAGE_SWIPED, (messageId: number) => {
    try {
      // Only refresh content; don't create new units.
      updateDialogueUnit(messageId);
    } catch (err) {
      console.warn('[Dialogues] 处理 MESSAGE_SWIPED 失败:', err);
    }
  });

  // Update an existing dialogue unit when its message is modified externally
  async function updateDialogueUnit(messageId: number) {
    try {
      const unit = dialogues.value.find(d => d.messageId === messageId);
      if (!unit) return;

      // 尝试从酒馆获取最新消息内容和 role
      try {
        const messages = getChatMessages(messageId);
        // 同样要求 message_id 严格匹配, 避免越界查询时把"最新楼层"内容覆盖到错误单元上。
        if (messages && messages.length > 0 && messages[0]?.message_id === messageId) {
          const msg = messages[0];
          if (msg.message !== undefined) unit.message = msg.message;
          if (msg.role) unit.role = msg.role as typeof unit.role;
        }
      } catch {
        // API 失败时，跳过更新（消息内容可能已通过 watch 同步）
      }

      // 如果已经标记为未解析，跳过
      if (!unit.parsed) return;

      unit.parsed = false;
      const blocks = await parseMessageBlocks(unit.message, currentScene.value, unit.role);
      unit.blocks = blocks;
      unit.danmaku = extractDanmakuBlock(unit.message);
      unit.imageTags = extractImageTagBlocks(unit.message);
      unit.parsed = true;

      // 重新定位光标: swipe / 重新生成 / 编辑后,
      // 跳到被修改楼层的第一个块(blocks 数变化、顺序变了,继续停在原 inner 块意义不大)。
      // - 如果被修改的楼层在 flat 中仍有 blocks,跳到该楼层的第一个块。
      // - 如果被修改的楼层内容被清空(无 blocks),退到该楼层之前的最后一个块(原 anchorFloor 仍是有效参考)。
      const flatAfter = allBlocksFlat.value;
      const modifiedFloorIdx = dialogues.value.findIndex(d => d.messageId === messageId);
      if (flatAfter.length === 0) {
        currentBlockFlatIndex.value = 0;
      } else if (modifiedFloorIdx >= 0) {
        const firstInModified = flatAfter.findIndex(b => b.floorIndex === modifiedFloorIdx);
        if (firstInModified >= 0) {
          currentBlockFlatIndex.value = firstInModified;
        } else {
          // 该楼层解析后无可见 blocks(user / hidden / 解析为空等),
          // 退回 anchorFloor 之前的最后一个有效块。
          let target = -1;
          for (let i = flatAfter.length - 1; i >= 0; i--) {
            if (flatAfter[i].floorIndex < modifiedFloorIdx) {
              target = i;
              break;
            }
          }
          currentBlockFlatIndex.value = target >= 0 ? target : flatAfter.length - 1;
        }
      } else {
        currentBlockFlatIndex.value = flatAfter.length - 1;
      }
      // 同步把预览楼层标记成被修改的楼层,这样 panel 跟实际显示一致。
      previewDialogueIndex.value = modifiedFloorIdx >= 0 ? modifiedFloorIdx : previewDialogueIndex.value;

      // 楼层被编辑/重试/回滚后：如包含图像标签，触发生图（避免只更新 UI 不生图）
      if (unit.imageTags.length > 0) {
        await processImageTagBlocks(unit.imageTags);
      }

      console.info('[Dialogues] 楼层', messageId, '已更新，重新解析了', blocks.length, '个块');
    } catch (err) {
      console.error('[Dialogues] updateDialogueUnit 失败:', err);
    }
  }

  // ============================================================
  // 扁平块导航系统
  // 规则：
  // - user 角色和隐藏楼层的块不进入 allBlocksFlat（被 computed 过滤）
  // - 翻页按钮操作 allBlocksFlat 中的线性索引 currentBlockFlatIndex
  // - 加载/跳转时根据楼层上下文映射到正确的扁平索引
  // ============================================================

  /**
   * 线性翻页：+1 下一块，-1 上一块
   */
  function navigateBlock(delta: number) {
    const flat = allBlocksFlat.value;
    if (flat.length === 0) return;

    const from = flat[currentBlockFlatIndex.value];
    const prevIdx = currentBlockFlatIndex.value;

    const newIdx = prevIdx + delta;
    if (newIdx < 0) {
      currentBlockFlatIndex.value = 0;
    } else if (newIdx >= flat.length) {
      currentBlockFlatIndex.value = flat.length - 1;
    } else {
      currentBlockFlatIndex.value = newIdx;
    }

    const to = flat[currentBlockFlatIndex.value];
    vnLog.info('nav', 'navigateBlock', {
      delta,
      prevFlatIndex: prevIdx,
      nextFlatIndex: currentBlockFlatIndex.value,
      from: from ? { floorIndex: from.floorIndex, blockIndex: from.blockIndex, type: from.block?.type } : null,
      to: to ? { floorIndex: to.floorIndex, blockIndex: to.blockIndex, type: to.block?.type } : null,
    });

    // 翻页后：尝试预渲染附近的楼层
    const newFloorIdx = to?.floorIndex ?? 0;
    preRenderFloors(newFloorIdx);
  }

  /**
   * 跳转到指定楼层。
   * @param index 目标楼层在 dialogues 中的物理索引
   * @param blockIndex 可选，要定位到该楼层内的第几个可见块（默认最后一块）
   */
  function navigateFloorTo(index: number, blockIndex?: number) {
    if (index < 0 || index >= dialogues.value.length) return;
    const unit = dialogues.value[index];
    if (!unit) return;

    // user/隐藏楼层不需要导航
    if (unit.role === 'user' || unit.isHidden) return;

    const from = allBlocksFlat.value[currentBlockFlatIndex.value];

    previewDialogueIndex.value = index;

    // 如果当前已经在这个楼层，不需要切换
    const currentFlat = allBlocksFlat.value[currentBlockFlatIndex.value];
    if (currentFlat && currentFlat.floorIndex === index) return;

    if (unit.parsed && unit.blocks.length > 0) {
      // 已解析：找到该楼层在扁平数组中的块
      const flat = allBlocksFlat.value;
      const blocksOfTargetFloor = flat.filter(b => b.floorIndex === index);
      if (blocksOfTargetFloor.length === 0) return;

      let targetBlockFlatIdx: number;
      if (blockIndex !== undefined) {
        const clamped = Math.max(0, Math.min(blockIndex, blocksOfTargetFloor.length - 1));
        targetBlockFlatIdx = flat.indexOf(blocksOfTargetFloor[clamped]);
      } else {
        targetBlockFlatIdx = flat.indexOf(blocksOfTargetFloor[blocksOfTargetFloor.length - 1]);
      }

      currentBlockFlatIndex.value = targetBlockFlatIdx;
      const to = allBlocksFlat.value[currentBlockFlatIndex.value];
      vnLog.info('nav', 'navigateFloorTo', {
        targetFloorIndex: index,
        from: from ? { floorIndex: from.floorIndex, blockIndex: from.blockIndex, type: from.block?.type } : null,
        to: to ? { floorIndex: to.floorIndex, blockIndex: to.blockIndex, type: to.block?.type } : null,
      });
      return;
    }

    // 未解析：先解析，解析完成后再跳转
    parseCurrentFloor(index).then(() => {
      const flat = allBlocksFlat.value;
      const blocksOfTargetFloor = flat.filter(b => b.floorIndex === index);
      if (blocksOfTargetFloor.length === 0) return;

      let targetBlockFlatIdx: number;
      if (blockIndex !== undefined) {
        const clamped = Math.max(0, Math.min(blockIndex, blocksOfTargetFloor.length - 1));
        targetBlockFlatIdx = flat.indexOf(blocksOfTargetFloor[clamped]);
      } else {
        targetBlockFlatIdx = flat.indexOf(blocksOfTargetFloor[blocksOfTargetFloor.length - 1]);
      }

      currentBlockFlatIndex.value = targetBlockFlatIdx;
      const to = allBlocksFlat.value[currentBlockFlatIndex.value];
      vnLog.info('nav', 'navigateFloorTo (deferred)', {
        targetFloorIndex: index,
        from: from ? { floorIndex: from.floorIndex, blockIndex: from.blockIndex, type: from.block?.type } : null,
        to: to ? { floorIndex: to.floorIndex, blockIndex: to.blockIndex, type: to.block?.type } : null,
      });
    });
  }

  /**
   * 获取当前块所在楼层的可见块数量（用于判断边界）
   */
  function getVisibleBlockCountInFloor(floorIndex: number): number {
    return allBlocksFlat.value.filter(b => b.floorIndex === floorIndex).length;
  }

  /**
   * 获取当前块在其楼层内的索引
   */
  function getCurrentBlockInnerIndex(): number {
    return currentBlockInnerIndex.value;
  }

  /**
   * 获取当前楼层的可见块总数
   */
  function getTotalBlocksInFloor(floorIndex: number): number {
    const unit = dialogues.value[floorIndex];
    if (!unit || unit.role === 'user' || unit.isHidden || !unit.parsed) return 0;
    return unit.blocks.length;
  }

  // Get current danmaku list
  const currentDanmaku = computed(() => {
    const fi = currentFloorIndex.value;
    const unit = dialogues.value[fi];
    return unit?.danmaku ?? [];
  });

  // Get current image tags
  const currentImageTags = computed(() => {
    const fi = currentFloorIndex.value;
    const unit = dialogues.value[fi];
    return unit?.imageTags ?? [];
  });

  // 聊天文件变化时：以聊天文件为唯一权威，整页刷新一次。
  // 这样能彻底避免任何 store 内部 ref / 角色系统缓存 / imageGen 监听器 / 组件实例跨聊天残留,
  // 与 util/script.ts 中 reloadOnChatChange 的推荐做法一致。
  // 注意: 不需要在此手动重置 dialogues/scene/previewDialogueIndex 等局部状态,
  // 因为 reload 会让整个 iframe 重新执行 index.ts，重新调用 loadAllDialogues 从酒馆数据重建。
  let _lastChatId: string | null = null;
  try {
    _lastChatId = (window as any)?.SillyTavern?.getCurrentChatId?.() ?? null;
  } catch {
    _lastChatId = null;
  }
  eventOn(tavern_events.CHAT_CHANGED, (new_chat_id: string) => {
    try {
      if (_lastChatId !== null && _lastChatId !== new_chat_id) {
        console.info('[Dialogues] 聊天切换（', _lastChatId, '->', new_chat_id, '), 整页刷新以保证与聊天文件一致');
        window.location.reload();
      } else if (_lastChatId === null) {
        // 第一次进入前可能拿不到 chatId，记录即可（不主动刷新避免循环）
        _lastChatId = new_chat_id;
      }
    } catch (err) {
      console.warn('[Dialogues] CHAT_CHANGED 处理失败:', err);
    }
  });

  // --- Worldbook Scan Debugging ---
  eventOn(tavern_events.WORLDINFO_SCAN_DONE, data => {
    console.group('[Worldbook Scan]');
    console.info('扫描文本长度:', data.activated.text.length);
    console.info('候选条目数:', data.new.all.length);
    console.info('激活条目数:', data.new.successful.length);
    if (data.new.successful.length > 0) {
      for (const entry of data.new.successful) {
        console.info(
          `  激活: ${entry.comment ?? '(无标题)'} (keys: ${entry.key.join(', ')}, position: ${entry.position})`,
        );
      }
    }
    console.info('递归层级:', data.recursionDelay.currentLevel, '/', data.recursionDelay.availableLevels);
    console.info('Token 预算:', data.budget.current, '溢出:', data.budget.overflowed);
    console.groupEnd();
  });

  // --- Derived ---
  const latestMvu = useLatestMvuStore();
  latestMvu.startAutoSync();
  const gold = computed(() => Number(_.get(latestMvu.statData, '金币', 0)) || 0);
  const inventory = computed(() => {
    const raw = _.get(latestMvu.statData, '收集物', {});
    if (!raw || typeof raw !== 'object') return [] as InventoryItem[];

    return Object.entries(raw as Record<string, any>).map(([name, v]) => {
      const description =
        typeof v?.描述 === 'string' ? v.描述 : typeof v?.description === 'string' ? v.description : '';
      const quantity = Number(v?.数量 ?? v?.quantity ?? 0) || 0;
      const icon = typeof v?.图标 === 'string' ? v.图标 : typeof v?.icon === 'string' ? v.icon : undefined;
      return {
        id: String(name),
        name: String(name),
        effect: description,
        quantity,
        icon,
      } satisfies InventoryItem;
    });
  });
  const transactionLog = computed(() => gameData.value.transactionLog);
  const workshopLevel = computed(() => gameData.value.workshopLevel);

  // keep economy layer in sync with MVU
  watch(
    gold,
    g => {
      gameData.value.gold = g;
    },
    { immediate: true },
  );
  watch(
    inventory,
    inv => {
      gameData.value.inventory = klona(inv);
    },
    { immediate: true, deep: true },
  );

  // --- API Provider status (available | degraded | disabled) ---
  const secondApiStatus = computed<ProviderStatus>(() => {
    if (!settings.value.secondApiUrl || !settings.value.secondApiKey) return 'disabled';
    if (secondApiStatusOverride.value === 'degraded') return 'degraded';
    if (secondApiConsecutiveFailures.value >= SECOND_API_DEGRADED_THRESHOLD) return 'degraded';
    return 'available';
  });
  const imageApiStatus = computed<ProviderStatus>(() =>
    settings.value.imageApiUrl && settings.value.imageApiKey ? 'available' : 'disabled',
  );

  // --- Second API Model List ---
  const secondApiModelList = ref<string[]>(
    (() => {
      try {
        const cached = localStorage.getItem('vn_galgame_model_list');
        if (cached) return JSON.parse(cached) as string[];
      } catch {
        /* ignore */
      }
      return [];
    })(),
  );
  const secondApiModelListLoading = ref(false);

  watchEffect(() => {
    try {
      localStorage.setItem('vn_galgame_model_list', JSON.stringify(secondApiModelList.value));
    } catch {
      /* ignore */
    }
  });

  async function fetchSecondApiModelList(): Promise<void> {
    const url = settings.value.secondApiUrl?.trim();
    const key = settings.value.secondApiKey?.trim();

    if (!url || !key) {
      showToast('第二 API 未配置');
      return;
    }

    secondApiModelListLoading.value = true;

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);

      const res = await fetch(`${url.replace(/\/$/, '')}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${key}`,
        },
        signal: ctrl.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        showToast(`获取模型列表失败：${res.status} ${text}`);
        setSecondApiDegraded('model_fetch');
        return;
      }

      const body = await res.json();
      secondApiModelList.value = (body.data || []).map((m: any) => m.id).sort();
      showToast(`共获取 ${secondApiModelList.value.length} 个模型`);
      clearSecondApiDegraded();
    } catch (e: any) {
      showToast(`获取模型列表失败：${e.message || '网络错误'}`);
      setSecondApiDegraded('model_fetch');
    } finally {
      secondApiModelListLoading.value = false;
    }
  }

  async function testSecondApiConnection(): Promise<boolean> {
    const url = settings.value.secondApiUrl?.trim();
    const key = settings.value.secondApiKey?.trim();
    const model = settings.value.secondApiModel?.trim() || 'gpt-3.5-turbo';

    if (!url || !key) {
      showToast('请先填写接口地址与 API 密钥');
      return false;
    }

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);

      const res = await fetch(`${url.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: '你好' }],
          max_tokens: 20,
          stream: false,
        }),
        signal: ctrl.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        showToast(`连接失败：${res.status} ${text}`);
        return false;
      }

      const body = await res.json().catch(() => null);
      const reply = body?.choices?.[0]?.message?.content?.trim();
      if (!reply) {
        showToast('连接成功但收到空回复，请检查模型名称是否正确');
        return false;
      }

      showToast(`连接成功，模型 ${model} 可用 ✓`);
      return true;
    } catch (e: any) {
      if (e.name === 'AbortError') {
        showToast('连接超时，请检查 API 地址是否正确');
      } else {
        showToast(`网络错误：${e.message || '无法到达服务器'}`);
      }
      return false;
    }
  }

  // --- 生图（事件通信）---
  // 舞台基础图：由生成/直显流程写入，作为当前舞台的默认内容
  const stageBackgroundImage = ref<string | null>(null);
  const stageCgImage = ref<string | null>(null);
  let imageGenListenerStopped: (() => void) | null = null;

  /**
   * 场景切换时，同步绑定图到舞台。
   * 即使新消息没有 <background> 标签，也要确保当前场景对应的绑定图能正确显示。
   */
  watch(
    () => currentBlock.value?.scene,
    (newScene, oldScene) => {
      if (!newScene || newScene === oldScene) return;
      const scene = newScene.trim();
      if (!scene) return;

      // 场景切换时，强制清空舞台图片，让绑定逻辑重新接管
      stageBackgroundImage.value = null;
      stageCgImage.value = null;

      // 遍历所有绑定，用 fuzzyMatchTitle 匹配当前场景名
      // 因为绑定 key 是 image tag 的 title，不一定等于 scene 名称
      for (const [bindingTitle, binding] of Object.entries(sceneImageBindings.value)) {
        if (!fuzzyMatchTitle(scene, bindingTitle)) continue;
        if (binding.type === 'background') {
          stageBackgroundImage.value = binding.imageData;
          console.info('[Bindings] 场景切换同步背景:', scene, '匹配到绑定:', bindingTitle);
        } else {
          stageCgImage.value = binding.imageData;
          console.info('[Bindings] 场景切换同步CG:', scene, '匹配到绑定:', bindingTitle);
        }
      }

      // 没有绑定图时，舞台保持清空（由大气背景生效）
      // 不需要额外处理，null 值会触发大气背景显示
    },
  );

  // --- 场景 ↔ 图片绑定持久化（聊天变量） ---
  // 存储结构：{ [sceneTitle]: { imageData, type, timestamp } }
  // 内存缓存 + 持久化到聊天变量
  const sceneImageBindings = ref<
    Record<
      string,
      {
        imageData: string;
        type: 'background' | 'cg';
        timestamp: number;
      }
    >
  >({});

  const _bindingsLoaded = ref(false);

  function _loadBindings() {
    try {
      const raw = getVariables({ type: 'chat' })?.vn_scene_bindings;
      if (raw && typeof raw === 'object') {
        sceneImageBindings.value = raw as typeof sceneImageBindings.value;
        _bindingsLoaded.value = true;
        console.info('[Bindings] 从聊天变量加载绑定:', Object.keys(sceneImageBindings.value).length, '个');
      }
    } catch (e) {
      console.warn('[Bindings] 加载绑定失败:', e);
    }
  }

  function _saveBindings() {
    try {
      insertOrAssignVariables({ vn_scene_bindings: klona(sceneImageBindings.value) }, { type: 'chat' });
    } catch (e) {
      console.warn('[Bindings] 保存绑定失败:', e);
    }
  }

  /**
   * 获取所有绑定（用于相册 UI）
   */
  function getSceneBindings() {
    return sceneImageBindings.value;
  }

  /**
   * 绑定场景 ↔ 图片（同一场景名只保留一张，后覆盖前）
   * @param sceneTitle 场景名
   * @param imageData 完整 base64
   * @param type 图片类型
   */
  /**
   * 设置场景绑定图。仅当该 title 还未绑定时写入；已有绑定则不覆盖。
   * 这是自动流程（如生图完成、刷新恢复）使用的安全版本，避免破坏已有图。
   * 替换现有绑定请使用 replaceSceneImageBinding（仅供用户手动切换调用）。
   */
  function bindSceneImage(sceneTitle: string, imageData: string, type: 'background' | 'cg') {
    const key = sceneTitle.trim();
    if (!key) return;
    if (sceneImageBindings.value[key]) {
      console.info('[Bindings] bindSceneImage 跳过（已有绑定）:', key);
      return;
    }
    sceneImageBindings.value[key] = {
      imageData,
      type,
      timestamp: Date.now(),
    };
    _saveBindings();
    console.info('[Bindings] 绑定场景:', key, 'type=', type);
  }

  /**
   * 替换场景绑定图。强制覆盖现有绑定。
   * 仅供用户手动切换（如点击卡牌）使用，自动流程不应调用此函数。
   */
  function replaceSceneImageBinding(sceneTitle: string, imageData: string, type: 'background' | 'cg') {
    const key = sceneTitle.trim();
    if (!key) return;
    sceneImageBindings.value[key] = {
      imageData,
      type,
      timestamp: Date.now(),
    };
    _saveBindings();
    console.info('[Bindings] 替换绑定场景:', key, 'type=', type);
  }

  /**
   * 解除绑定
   */
  function unbindSceneImage(sceneTitle: string) {
    if (sceneImageBindings.value[sceneTitle]) {
      delete sceneImageBindings.value[sceneTitle];
      _saveBindings();
      console.info('[Bindings] 解除绑定:', sceneTitle);
    }
  }

  /**
   * 将绑定图片插入卡牌队列（如果队列中已有相同 base64 的卡则更新其 title）
   */
  function insertBindingToQueue(sceneTitle: string): boolean {
    const binding = sceneImageBindings.value[sceneTitle];
    if (!binding) return false;

    // 如果队列中已有相同 base64 的图，更新其 title 为当前场景名（覆盖旧绑定）
    const existingIdx = imageCardQueue.value.findIndex(c => c.imageData === binding.imageData);
    if (existingIdx !== -1) {
      const existing = imageCardQueue.value[existingIdx];
      if (existing.title !== sceneTitle) {
        existing.title = sceneTitle;
        console.info('[Bindings] 绑定图已在队列中，更新 title:', sceneTitle, '旧title=', existing.title);
      }
      return true;
    }

    const tempId = `bound-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    imageCardQueue.value.push({
      id: tempId,
      imageData: binding.imageData,
      type: binding.type,
      timestamp: binding.timestamp,
      title: sceneTitle,
    });
    if (imageCardQueue.value.length > MAX_IMAGE_CARDS) {
      imageCardQueue.value.shift();
    }
    console.info('[Bindings] 绑定图已插入队列:', sceneTitle, 'tempId=', tempId);
    return true;
  }

  /**
   * 查找队列中是否存在指定场景的绑定图
   */
  function findBoundCardInQueue(sceneTitle: string): ImageCard | null {
    return imageCardQueue.value.find(c => c.title === sceneTitle) ?? null;
  }

  // 聊天切换时清空绑定
  eventOn(tavern_events.CHAT_CHANGED, () => {
    sceneImageBindings.value = {};
    _bindingsLoaded.value = false;
  });

  // 初始加载绑定
  _loadBindings();

  // 图片卡牌队列（最多10张）
  const imageCardQueue = ref<ImageCard[]>([]);
  const MAX_IMAGE_CARDS = 10;
  // 记录正在生成的请求
  const activeImageRequests = new Map<string, { type: 'background' | 'cg'; prompt?: string; title?: string }>();
  // 记录每个请求已收到多少张图（用于区分第一张 vs 第二张）
  const imageResponseCounts = new Map<string, number>();
  // 是否有图片生成任务进行中（用于舞台加载态）
  const imageGenerating = ref(false);

  // --- 图像标签解析与手动覆盖 ---
  // 当前显示的图片标题（用于判断 title 变化）
  const currentImageTitle = ref<string | null>(null);
  // 当前显示的图片类型（用于判断类型变化）
  const currentImageType = ref<'background' | 'cg' | null>(null);

  // --- 重试弹窗状态 ---
  const retryPanelOpen = ref(false);
  // --- 相册弹窗状态 ---
  const albumPanelOpen = ref(false);
  function openAlbumPanel() {
    albumPanelOpen.value = true;
  }
  function closeAlbumPanel() {
    albumPanelOpen.value = false;
  }
  // 重试模式：'both' | 'background' | 'cg'
  const retryMode = ref<'both' | 'background' | 'cg'>('background');
  // 弹窗内当前激活的标签页（仅在 both 模式下有效）
  const retryActiveTab = ref<'background' | 'cg'>('background');
  const retryGeneratedImages = ref<
    Array<{
      tempId: string;
      requestId: string;
      imageData: string;
      status: 'generating' | 'done' | 'error';
      errorMsg?: string;
      title?: string; // 用户在面板中编辑的 title，用于插入队列和后续绑定
    }>
  >([]);
  const retrySelectedIndices = ref<Set<number>>(new Set());
  // 分别记录背景和 CG 的提示词
  const lastRetryPrompt = ref<{ background?: string; cg?: string }>({});
  // 仅属于当前重试会话的请求 ID（用于过滤响应）
  const retryActiveRequestIds = new Set<string>();

  /**
   * 打开重试弹窗：
   * - 优先从当前楼层（正在看的楼层）的 imageTags 中，用 currentBlock.scene fuzzyMatch title，
   *   找到匹配的 tag，取其 prompt 预填到弹窗输入框
   * - 未找到时回退：从 imageCardQueue 末尾取最近的对应类型提示词
   * - 自动判断生成模式（both / bg / cg）并预填提示词
   */
  function openRetryPanel() {
    console.info('[RetryPanel] openRetryPanel 被调用');

    // 优先：尝试从当前楼层的 imageTags 匹配当前 scene
    let bgPrompt = '';
    let cgPrompt = '';
    const scene = currentBlock.value?.scene?.trim() ?? '';

    if (scene) {
      const fi = currentFloorIndex.value;
      const unit = dialogues.value[fi];
      if (unit?.parsed && unit.imageTags.length > 0) {
        for (const block of unit.imageTags) {
          if (!block.title) continue;
          if (!fuzzyMatchTitle(scene, block.title.trim())) continue;
          if (block.type === 'background') {
            bgPrompt = block.prompt;
          } else {
            cgPrompt = block.prompt;
          }
        }
        if (bgPrompt || cgPrompt) {
          console.info(
            `[RetryPanel] 当前楼层 scene="${scene}" 匹配到 prompt, bg="${bgPrompt.substring(0, 40)}...", cg="${cgPrompt.substring(0, 40)}..."`,
          );
        }
      }
    }

    // 回退：从 imageCardQueue 末尾取最近的对应类型提示词
    if (!bgPrompt) {
      const lastBgCard = [...imageCardQueue.value].reverse().find(c => c.type === 'background');
      if (lastBgCard) bgPrompt = lastBgCard.prompt ?? '';
    }
    if (!cgPrompt) {
      const lastCgCard = [...imageCardQueue.value].reverse().find(c => c.type === 'cg');
      if (lastCgCard) cgPrompt = lastCgCard.prompt ?? '';
    }

    // 判断模式
    const hasBg = !!bgPrompt.trim();
    const hasCg = !!cgPrompt.trim();
    if (hasBg && hasCg) {
      retryMode.value = 'both';
      retryActiveTab.value = 'background';
    } else if (hasCg) {
      retryMode.value = 'cg';
      retryActiveTab.value = 'cg';
    } else {
      retryMode.value = 'background';
    }

    lastRetryPrompt.value = { background: bgPrompt, cg: cgPrompt };
    retryPanelOpen.value = true;
    retryGeneratedImages.value = [];
    retrySelectedIndices.value = new Set();
    console.info(
      '[RetryPanel] 弹窗已打开, mode=',
      retryMode.value,
      'bgPrompt=',
      bgPrompt.substring(0, 50),
      'cgPrompt=',
      cgPrompt.substring(0, 50),
    );
  }

  /**
   * 在重试弹窗中追加一张图片生成请求
   * 不改变 imageCardQueue（由 confirmRetryImages 统一插入）
   */
  function addRetryImageRequest(prompt: string, type: 'background' | 'cg') {
    // 先生成 ID 并注册，避免响应早于 ID 入集合而漏拦截
    const requestId = 'vn-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
    activeImageRequests.set(requestId, { type, prompt });
    retryActiveRequestIds.add(requestId);

    const tempId = `retry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    retryGeneratedImages.value.push({ tempId, requestId, imageData: '', status: 'generating' });
    const entryIndex = retryGeneratedImages.value.length - 1;

    let cleanedUp = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      if (timeout) clearTimeout(timeout);
      retryActiveRequestIds.delete(requestId);
      activeImageRequests.delete(requestId);
      if (window.eventRemoveListener) {
        window.eventRemoveListener(ImageGenEventType.GENERATE_IMAGE_RESPONSE, handler);
      }
    };

    const handler = (data: unknown) => {
      if (cleanedUp) return;
      const resp = data as ImageGenResponseData;
      if (!resp.id) return;
      // 只处理属于本次重试会话的响应
      if (!retryActiveRequestIds.has(resp.id)) return;

      cleanup();

      const entry = retryGeneratedImages.value[entryIndex];
      if (entry && entry.status === 'generating') {
        if (resp.success && resp.imageData) {
          entry.imageData = resp.imageData;
          entry.status = 'done';
        } else {
          entry.status = 'error';
          entry.errorMsg = resp.error ?? '生成失败';
        }
      }
    };

    if (window.eventOn) {
      window.eventOn(ImageGenEventType.GENERATE_IMAGE_RESPONSE, handler);
      // 发请求（requestId 已在 emit 之前注册好）
      const requestData: ImageGenRequestData = {
        id: requestId,
        prompt,
        width: null,
        height: null,
      };
      if (window.eventEmit) {
        window.eventEmit(ImageGenEventType.GENERATE_IMAGE_REQUEST, requestData);
      }
      lastRetryPrompt.value[type] = prompt;
      // 超时兜底
      timeout = setTimeout(() => {
        cleanup();
        const entry = retryGeneratedImages.value[entryIndex];
        if (entry?.status === 'generating') {
          entry.status = 'error';
          entry.errorMsg = '超时';
        }
      }, 60000);
    }
  }

  /**
   * 切换选中状态
   */
  function toggleRetryImageSelection(index: number) {
    const s = retrySelectedIndices.value;
    if (s.has(index)) s.delete(index);
    else s.add(index);
  }

  /**
   * 设置当前激活的标签页（仅在 both 模式下有效）
   */
  function setRetryActiveTab(tab: 'background' | 'cg') {
    retryActiveTab.value = tab;
  }

  /**
   * 清空选中状态
   */
  function clearRetrySelection() {
    retrySelectedIndices.value = new Set();
  }

  /**
   * 确认插入：选中的图插入 imageCardQueue 并显示在舞台上
   */
  function confirmRetryImages() {
    const stageType = retryMode.value === 'both' ? retryActiveTab.value : retryMode.value;
    if (!stageType) {
      closeRetryPanel();
      return;
    }

    const generated = retryGeneratedImages.value;
    const selected = retrySelectedIndices.value;

    if (selected.size === 0) {
      closeRetryPanel();
      return;
    }

    for (const idx of selected) {
      const img = generated[idx];
      if (!img || img.status !== 'done' || !img.imageData) continue;
      imageCardQueue.value.push({
        id: img.tempId,
        imageData: img.imageData,
        type: stageType,
        timestamp: Date.now(),
        prompt: lastRetryPrompt.value[stageType] ?? '',
        // 仅保存 title 用于显示，不自动写绑定（绑定必须由 switchToImageCard 触发）
        title: img.title ?? '',
      });
    }

    closeRetryPanel();
  }

  /**
   * 更新重试面板中某张图片的 title
   */
  function updateRetryImageTitle(tempId: string, newTitle: string) {
    const img = retryGeneratedImages.value.find(g => g.tempId === tempId);
    if (img) {
      img.title = newTitle;
    }
  }

  /**
   * 替换重试面板中某张图片的 base64 数据
   */
  function replaceRetryImageData(tempId: string, newBase64: string) {
    const img = retryGeneratedImages.value.find(g => g.tempId === tempId);
    if (img) {
      img.imageData = newBase64;
      img.status = 'done';
    }
  }

  /**
   * 获取绑定相册（按类型分组）
   */
  function getBindingAlbum(type: 'background' | 'cg'): Array<{ title: string; imageData: string; timestamp: number }> {
    return Object.entries(sceneImageBindings.value)
      .filter(([, v]) => v.type === type)
      .map(([title, v]) => ({ title, imageData: v.imageData, timestamp: v.timestamp }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 关闭弹窗并清理
   */
  function closeRetryPanel() {
    retryActiveRequestIds.clear();
    retryPanelOpen.value = false;
    retryGeneratedImages.value = [];
    retrySelectedIndices.value = new Set();
    retryMode.value = 'background';
    retryActiveTab.value = 'background';
  }

  /**
   * 将用户本地上传的图片（base64）直接追加到 retryGeneratedImages，
   * 无需调用生图 API，直接可确认插入到舞台。
   * 同时自动以当前场景名为 title，并追加到绑定存储。
   * @param base64Data 图片 base64 数据（data:image/...;base64,xxx 格式）
   */
  function importImageToRetry(base64Data: string) {
    const type = retryMode.value === 'both' ? retryActiveTab.value : retryMode.value;
    if (!type) return;

    const tempId = `import-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const scene = currentBlock.value?.scene?.trim() ?? '';
    retryGeneratedImages.value.push({
      tempId,
      requestId: tempId,
      imageData: base64Data,
      status: 'done',
    });

    // 自动选中新导入的那张（替换之前的选中）
    retrySelectedIndices.value = new Set([retryGeneratedImages.value.length - 1]);

    // 自动以当前场景名为 title，并追加到绑定
    if (scene) {
      bindSceneImage(scene, base64Data, type);
    }

    console.info('[RetryPanel] 导入图片完成, tempId=', tempId, 'type=', type, 'scene=', scene);
  }

  /**
   * 获取当前应该显示的背景图片
   */
  function getCurrentDisplayBackground(): string | null {
    return stageBackgroundImage.value;
  }

  /**
   * 获取当前应该显示的 CG 图片
   */
  function getCurrentDisplayCg(): string | null {
    return stageCgImage.value;
  }

  function getImageCardById(cardId: string) {
    return imageCardQueue.value.find(card => card.id === cardId);
  }

  /**
   * 处理图像标签块：
   * - 只决定要不要发生图请求，不再触碰舞台。
   * - 场景匹配且有绑定：跳过生图，绑定图恢复由场景 watcher 完成。
   * - 队列已有同 prompt 的图：跳过生图（不展示）。
   * - 其余：发请求。是否上舞台由 handleImageResponse 决定。
   * @param blocks 解析出的图像标签块数组
   */
  async function processImageTagBlocks(blocks: ImageTagBlock[]): Promise<void> {
    if (!settings.value.imageGenEnabled) return;

    const currentTitleAnchor = (currentBlock.value?.scene || '').trim();

    for (const block of blocks) {
      if (block.type === 'background' && !settings.value.backgroundGenEnabled) continue;
      if (block.type === 'cg' && !settings.value.cgGenEnabled) continue;

      const normalizedTitle = (block.title || '').trim();
      const canDirectDisplay =
        !!normalizedTitle && !!currentTitleAnchor && fuzzyMatchTitle(currentTitleAnchor, normalizedTitle);

      // 记录当前 title 和 type（保留旧行为，给其他 watcher 用）
      currentImageTitle.value = block.title;
      currentImageType.value = block.type;

      // 1. 场景匹配时优先查绑定图：已有绑定 → 跳过生图
      if (canDirectDisplay) {
        let matchedBindingKey: string | null = null;
        for (const [bindingKey, binding] of Object.entries(sceneImageBindings.value)) {
          if (binding.type !== block.type) continue;
          if (fuzzyMatchTitle(currentTitleAnchor, bindingKey)) {
            matchedBindingKey = bindingKey;
            break;
          }
        }
        if (matchedBindingKey) {
          // 确保绑定图在队列中（不在就插入），便于用户手动切换
          let boundCard = findBoundCardInQueue(matchedBindingKey);
          if (!boundCard) {
            insertBindingToQueue(matchedBindingKey);
          }
          console.info('[ImageGen] 命中已有绑定，跳过生图:', matchedBindingKey);
          continue;
        }
      }

      // 2. 队列已有同 prompt 的图：跳过生图，不展示
      const existing = imageCardQueue.value.find(c => c.prompt === block.prompt);
      if (existing) {
        console.info('[ImageGen] 队列中已有同 prompt，跳过生图:', block.title);
        continue;
      }

      // 3. 发请求。是否上舞台由 handleImageResponse 决定。
      const requestTitle = `${normalizedTitle}`;
      if (block.type === 'background') {
        requestBackgroundImage(block.prompt, requestTitle);
      } else {
        requestCgImage(block.prompt, requestTitle);
      }
    }
  }

  /**
   * 从酒馆消息系统重新解析并处理图像标签块
   * 用于测试控制台等场景，模拟 AI 生成消息后的完整流程
   */
  async function reparseImageTagsFromMessage(messageId: number): Promise<void> {
    const messages = getChatMessages(messageId);
    if (messages.length === 0) return;
    const raw = messages[0]?.message ?? '';
    const blocks = extractImageTagBlocks(raw);
    if (blocks.length > 0) {
      console.info('[ImageGen] 重新解析图像标签:', blocks);
      await processImageTagBlocks(blocks);
    }
  }

  function handleImageResponse(responseData: ImageGenResponseData) {
    if (!responseData || !responseData.id) return;

    // Retry 弹窗发起的请求由 addRetryImageRequest 的 handler 单独处理，
    // 此处跳过避免图片重复入库（进卡牌队列 & 进 retry 面板）
    if (retryActiveRequestIds.has(responseData.id)) return;

    const pending = activeImageRequests.get(responseData.id);
    if (!pending) return;

    if (responseData.success && responseData.imageData) {
      // 生图的 title 统一是原始值（无前缀），用于卡牌显示
      const title = pending.title || '';

      // 构造卡牌（用计数区分同一请求的多张图，避免 id 重复）
      const card: ImageCard = {
        id: responseData.id + '-img-' + imageResponseCounts.get(responseData.id),
        imageData: responseData.imageData,
        type: pending.type,
        timestamp: Date.now(),
        prompt: pending.prompt,
        title,
      };

      const isFirstImage = (imageResponseCounts.get(responseData.id) ?? 0) === 0;

      // 检查当前舞台该类型是否已被别的图占据（避免被新生成图顶掉）
      const stageOccupied =
        card.type === 'background' ? !!stageBackgroundImage.value : !!stageCgImage.value;

      // 第一张图且开启了自动上舞台：绑定到当前场景并显示到舞台
      // 条件：场景非空 + 当前舞台该类型为空（已被占则不动）
      if (isFirstImage && settings.value.autoStageGeneratedImage && !stageOccupied) {
        const scene = (currentBlock.value?.scene || '').trim();
        if (scene) {
          // 写入绑定存储（bindSceneImage 在已有绑定时不会覆盖，符合"无则写"语义）
          bindSceneImage(scene, card.imageData, card.type);
          // 让队列中这张卡的 title 与绑定场景一致（便于 UI 显示"已绑定"）
          card.title = scene;
          // 更新舞台显示
          if (card.type === 'background') stageBackgroundImage.value = card.imageData;
          else stageCgImage.value = card.imageData;
          // 同时加入队列（备选）
          imageCardQueue.value.push(card);
          if (imageCardQueue.value.length > MAX_IMAGE_CARDS) {
            imageCardQueue.value.shift();
          }
          console.info('[ImageGen] 自动绑定第一张图到场景:', scene);
          showToast(`${card.type === 'background' ? '背景' : 'CG'}已自动进入舞台：${scene}`);
        } else {
          // 无场景锚点时只入队列
          imageCardQueue.value.push(card);
          if (imageCardQueue.value.length > MAX_IMAGE_CARDS) {
            imageCardQueue.value.shift();
          }
          showToast(`${card.type === 'background' ? '背景' : 'CG'}生成完成：${title || '新图片'}`);
        }
      } else if (isFirstImage && settings.value.autoStageGeneratedImage && stageOccupied) {
        // 开关开启但舞台已被占：只入队列不覆盖
        imageCardQueue.value.push(card);
        if (imageCardQueue.value.length > MAX_IMAGE_CARDS) {
          imageCardQueue.value.shift();
        }
        console.info('[ImageGen] 自动上舞台跳过（舞台已被占据）:', title);
      } else {
        // 第二张及以后，或未开启开关：只入队列，绝不动绑定
        imageCardQueue.value.push(card);
        if (imageCardQueue.value.length > MAX_IMAGE_CARDS) {
          imageCardQueue.value.shift();
        }
        const typeLabel = pending.type === 'background' ? '背景' : 'CG';
        showToast(`${typeLabel}生成完成：${title || '新图片'}`);
      }
    } else if (responseData.error) {
      // 生图失败时也显示通知
      showToast(`生图失败：${responseData.error}`);
    }

    // 计数 +1，统一在这里处理
    const newCount = (imageResponseCounts.get(responseData.id) ?? 0) + 1;
    imageResponseCounts.set(responseData.id, newCount);

    // 收到两张或出错时清理该请求记录
    if (newCount >= 2 || responseData.error) {
      activeImageRequests.delete(responseData.id);
      imageResponseCounts.delete(responseData.id);
    }

    // 检查是否所有请求都已完成
    if (activeImageRequests.size === 0) {
      imageGenerating.value = false;
    }
  }

  function setupImageGenListener() {
    if (imageGenListenerStopped) return;
    const responseHandler = (data: unknown) => {
      handleImageResponse(data as ImageGenResponseData);
    };
    if (window.eventRemoveListener) {
      window.eventRemoveListener(ImageGenEventType.GENERATE_IMAGE_RESPONSE, responseHandler);
    }
    if (window.eventOn) {
      window.eventOn(ImageGenEventType.GENERATE_IMAGE_RESPONSE, responseHandler);
      imageGenListenerStopped = () => {
        if (window.eventRemoveListener) {
          window.eventRemoveListener(ImageGenEventType.GENERATE_IMAGE_RESPONSE, responseHandler);
        }
      };
    }
  }

  function requestImage(prompt: string, type: 'background' | 'cg', title?: string) {
    if (!settings.value.imageGenEnabled) return;
    if (type === 'background' && !settings.value.backgroundGenEnabled) return;
    if (type === 'cg' && !settings.value.cgGenEnabled) return;
    const requestId = 'vn-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
    activeImageRequests.set(requestId, { type, prompt, title });
    imageResponseCounts.set(requestId, 0);
    imageGenerating.value = true;
    const requestData: ImageGenRequestData = {
      id: requestId,
      prompt,
      width: null,
      height: null,
    };
    if (window.eventEmit) {
      window.eventEmit(ImageGenEventType.GENERATE_IMAGE_REQUEST, requestData);
    }
  }

  // 重试生成指定卡片的图片
  function retryImageCard(cardId: string) {
    const card = imageCardQueue.value.find(c => c.id === cardId);
    if (!card || !card.prompt) return;
    // 从队列中移除旧卡片
    imageCardQueue.value = imageCardQueue.value.filter(c => c.id !== cardId);
    // 重新生成
    requestImage(card.prompt, card.type);
  }

  // 获取当前正在生成中的请求
  function getActiveImageRequest() {
    const entries = Array.from(activeImageRequests.entries());
    imageGenerating.value = entries.length > 0;
    return entries.length > 0 ? { id: entries[0][0], ...entries[0][1] } : null;
  }

  function requestBackgroundImage(prompt: string, title?: string) {
    requestImage(prompt, 'background', title);
  }

  function requestCgImage(prompt: string, title?: string) {
    requestImage(prompt, 'cg', title);
  }

  // 将卡牌绑定到当前场景并展示到舞台（用户手动切换专用，会强制替换已有绑定）
  function switchToImageCard(cardId: string) {
    const card = getImageCardById(cardId);
    if (!card) return;

    const scene = (currentBlock.value?.scene || '').trim();
    if (!scene) {
      showToast('当前无场景，无法绑定');
      return;
    }

    // 清除当前场景的旧绑定
    if (sceneImageBindings.value[scene]) {
      unbindSceneImage(scene);
      console.info('[ImageGen] 清除旧绑定:', scene);
    }

    // 更新卡牌的 title
    card.title = scene;

    // 强制替换绑定存储（用户手动切换允许覆盖）
    replaceSceneImageBinding(scene, card.imageData, card.type);

    // 更新舞台显示
    if (card.type === 'background') stageBackgroundImage.value = card.imageData;
    else stageCgImage.value = card.imageData;

    console.info('[ImageGen] 手动绑定场景:', scene, 'cardId=', cardId);
  }

  /**
   * 判断卡牌是否已绑定（title 存在于绑定存储中）
   */
  function isCardBound(cardId: string): boolean {
    const card = getImageCardById(cardId);
    if (!card?.title) return false;
    const binding = sceneImageBindings.value[card.title];
    if (!binding) return false;
    return binding.imageData === card.imageData;
  }

  /**
   * 获取卡牌的绑定场景 title
   */
  function getBoundSceneTitle(cardId: string): string {
    const card = getImageCardById(cardId);
    return card?.title ?? '';
  }

  // 清空卡牌队列
  function clearImageCardQueue() {
    imageCardQueue.value = [];
    stageBackgroundImage.value = null;
    stageCgImage.value = null;
  }

  // --- Module locking ---
  function getModuleLockReason(moduleId: string): string | undefined {
    if (moduleId === 'shop' && secondApiStatus.value === 'disabled') return '需要配置第二 API';
    if (moduleId === 'shop' && secondApiStatus.value === 'degraded') return '第二 API 降级';
    if (moduleId === 'ai_riddle' && secondApiStatus.value === 'disabled') return '需要配置第二 API';
    if (moduleId === 'ai_riddle' && secondApiStatus.value === 'degraded') return '第二 API 降级';
    return undefined;
  }

  // --- Second API unified entry ---
  async function callSecondApi(config: SecondApiConfig): Promise<string[] | ShopItem[] | string> {
    const { task, silent = false } = config;

    // 配置检查
    const url = settings.value.secondApiUrl?.trim();
    const key = settings.value.secondApiKey?.trim();
    if (!url || !key) {
      if (!silent) showToast('第二 API 未配置');
      vnLog.warn('secondApi', 'second api not configured', { task });
      return task === 'shop' ? [] : '';
    }
    const model = settings.value.secondApiModel?.trim() || 'gpt-3.5-turbo';

    const custom_api = {
      apiurl: url,
      key,
      model,
      source: 'openai' as const,
      temperature: settings.value.secondApiTemperature === 'unset' ? undefined : settings.value.secondApiTemperature,
      max_tokens: settings.value.secondApiMaxTokens === 'unset' ? undefined : settings.value.secondApiMaxTokens,
      top_p: settings.value.secondApiTopP === 'unset' ? undefined : settings.value.secondApiTopP,
      top_k: settings.value.secondApiTopK === 'unset' ? undefined : settings.value.secondApiTopK,
    };

    const doRequest = async (ordered_prompts: OrderedPrompt[]): Promise<string> => {
      const result = await Promise.race([
        generateRaw({ custom_api, should_stream: false, should_silence: true, ordered_prompts }),
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            secondApiLastErrorType.value = 'timeout';
            reject(new Error('timeout'));
          }, SECOND_API_TIMEOUT_MS),
        ),
      ]);
      return typeof result === 'string' ? result : String(result ?? '');
    };

    vnLog.info('secondApi', 'request prepared', { task, model });

    // ========== 按 task 分发构建 ordered_prompts ==========

    switch (task) {
      case 'danmaku':
      case 'danmakuAndImageGen': {
        const { contentText } = config as DanmakuConfig;
        const ordered_prompts: OrderedPrompt[] = [
          { role: 'system', content: task === 'danmaku' ? PROMPT_DANMAKU : PROMPT_DANMAKU_AND_IMAGE },
          { role: 'user', content: contentText },
        ];
        try {
          const raw = await doRequest(ordered_prompts);
          if (task === 'danmaku') {
            const lines = raw
              .split(/\n/)
              .map(s => s.trim())
              .filter(Boolean);
            return lines;
          }
          return raw;
        } catch (e) {
          console.error('[SecondAPI] danmaku 请求异常:', e);
          return '';
        }
      }

      case 'shop': {
        const context = await buildSecondApiContext({ maxChatHistory: 20 });
        const ordered_prompts: OrderedPrompt[] = [
          ...context,
          { role: 'system', content: PROMPT_SHOP },
          { role: 'user', content: '请生成废土风格的商店商品列表。' },
        ];
        try {
          const raw = await doRequest(ordered_prompts);
          return parseShopResult(raw);
        } catch (e) {
          console.error('[SecondAPI] shop 请求异常:', e);
          return [];
        }
      }

      case 'boardGameEvent': {
        const { sceneText } = config as BoardGameEventConfig;
        const context = await buildSecondApiContext({ maxChatHistory: 20 });
        const ordered_prompts: OrderedPrompt[] = [
          ...context,
          { role: 'system', content: PROMPT_BOARD_GAME_EVENT_POOL },
          { role: 'user', content: `当前场景：${sceneText}` },
        ];
        try {
          return await doRequest(ordered_prompts);
        } catch (e) {
          console.error('[SecondAPI] boardGameEvent 请求异常:', e);
          return '';
        }
      }

      case 'roleProfile': {
        const { systemPrompt } = config as RoleProfileConfig;
        const context = await buildSecondApiContext({ maxChatHistory: 20 });
        const ordered_prompts: OrderedPrompt[] = [...context, { role: 'system', content: systemPrompt }];
        try {
          return await doRequest(ordered_prompts);
        } catch (e) {
          console.error('[SecondAPI] roleProfile 请求异常:', e);
          return '';
        }
      }

      case 'riddle': {
        const { personalityPrompt, chatLogText, latestHint } = config as RiddleConfig;
        const systemPrompt = buildRiddlePrompt(personalityPrompt, chatLogText, latestHint);
        const ordered_prompts: OrderedPrompt[] = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: '请回复你的猜测。' },
        ];
        try {
          return await doRequest(ordered_prompts);
        } catch (e) {
          console.error('[SecondAPI] riddle 请求异常:', e);
          return '';
        }
      }

      case 'system': {
        const { personalityId, manualHistory, userInput, context } = config as SystemConfig;
        const personality = SYSTEM_PERSONALITIES.find(p => p.id === personalityId);
        if (!personality) {
          if (!silent) showToast('未找到指定人格');
          return '';
        }
        const contextPrompts = await buildSecondApiContext({ includeChatHistory: false });
        const ordered_prompts: OrderedPrompt[] = [
          ...contextPrompts,
          { role: 'system', content: personality.systemPrompt },
          ...manualHistory,
        ];
        // 剧情参考注入：插入到用户输入之前
        if (context) {
          ordered_prompts.push(
            { role: 'user', content: `[剧情参考]\n${context}` },
            { role: 'assistant', content: '好的，我已了解相关剧情内容。' },
          );
        }
        ordered_prompts.push({ role: 'user', content: userInput });
        try {
          return await doRequest(ordered_prompts);
        } catch (e) {
          console.error('[SecondAPI] system 请求异常:', e);
          return '';
        }
      }

      case 'workshopOrder': {
        const { userPrompt } = config as WorkshopOrderConfig;
        const context = await buildSecondApiContext({ includeWorldbook: true });
        const ordered_prompts: OrderedPrompt[] = [
          ...context,
          { role: 'system', content: PROMPT_WORKSHOP_ORDERS },
          { role: 'user', content: userPrompt },
        ];
        try {
          return await doRequest(ordered_prompts);
        } catch (e) {
          console.error('[SecondAPI] workshopOrder 请求异常:', e);
          return '';
        }
      }

      case 'dispatchStory': {
        const { userPrompt } = config as DispatchStoryConfig;
        // dispatchStory 走 generate()，世界书自动注入
        try {
          const result = await generate({
            user_input: buildDispatchPrompt('', { 区域: '', 遭遇类型: '结算', 奖励: '' }) + '\n\n' + userPrompt,
          });
          return result;
        } catch (e) {
          console.error('[SecondAPI] dispatchStory 请求异常:', e);
          return '';
        }
      }

      default:
        throw new Error(`Unknown task: ${(config as any).task}`);
    }
  }

  /** 解析商店结果 */
  function parseShopResult(raw: string): ShopItem[] {
    const items: ShopItem[] = [];
    const lineRegex =
      /^(?:([^|｜]+?)\s*[|｜]\s*)?(.+?)\s*[|｜]\s*(.+?)\s*[|｜]\s*(.+?)\s*[|｜]\s*(\d+)\s*(?:[|｜]\s*(.+?)\s*)?$/;
    for (const line of raw
      .split(/\n/)
      .map(s => s.trim())
      .filter(Boolean)) {
      const m = line.match(lineRegex);
      if (!m) continue;
      const rawId = (m[1] ?? '').trim();
      const name = (m[2] ?? '').trim();
      const icon = (m[3] ?? '').trim();
      const effect = (m[4] ?? '').trim();
      const price = Number((m[5] ?? '').trim());
      const tagsRaw = (m[6] ?? '').trim();
      const tags = tagsRaw
        ? tagsRaw
            .split(/[,，\s]+/)
            .map(s => s.trim())
            .filter(Boolean)
        : undefined;
      items.push({
        id: rawId || `s${Date.now()}_${items.length}`,
        name,
        icon: icon || undefined,
        effect,
        price: Number.isFinite(price) ? price : 0,
        tags,
      });
    }
    if (items.length === 0) {
      try {
        const parsed = JSON.parse(raw) as {
          id?: string;
          name?: string;
          icon?: string;
          effect?: string;
          price?: number;
          tags?: string[];
        }[];
        if (Array.isArray(parsed))
          parsed.forEach((p2, i) =>
            items.push({
              id: p2.id || `s${Date.now()}_${i}`,
              name: p2.name ?? '',
              icon: p2.icon,
              effect: p2.effect ?? '',
              price: Number(p2.price) || 0,
              tags: Array.isArray(p2.tags) ? p2.tags : undefined,
            }),
          );
      } catch {
        /* ignore */
      }
    }
    return items;
  }

  function setSecondApiDegraded(reason: 'model_fetch' | 'timeout') {
    console.warn('[SecondAPI] Degraded:', reason);
  }

  function clearSecondApiDegraded() {
    console.info('[SecondAPI] Cleared degraded status');
  }

  // ====== Second API Context Builder ======
  // ordered_prompts 里的 PlaceholderPrompt 字符串（如 'world_info_after'、'char_personality'）
  // 会被 generateRaw 原样发给 AI，不会自动解析。
  // 因此需要手动获取实际内容，构建真实的 RolePrompt 数组。

  /**
   * 获取角色卡的角色设定文本
   */
  async function getCharPersonalityText(): Promise<string> {
    try {
      const char = await getCharacter('current');
      return char?.description ?? '';
    } catch {
      return '';
    }
  }

  /**
   * 获取聊天历史文本（格式：[角色名] 消息内容）
   */
  function getChatHistoryText(maxMessages: number = 20): string {
    try {
      const lastId = getLastMessageId();
      const messages = getChatMessages(`0-${lastId}`, { hide_state: 'unhidden' });
      const recent = messages.slice(-maxMessages);
      return recent.map(m => `[${m.name}] ${m.message}`).join('\n');
    } catch {
      return '';
    }
  }

  /**
   * 构建第二 API 调用所需的上下文 RolePrompt 数组。
   * 手动获取世界书（仅 targetApi='second' 或 'both' 的条目）、角色设定、聊天历史，
   * 避免依赖 generateRaw 无法解析的 PlaceholderPrompt 字符串。
   *
   * @param options.worldbookFilter - 过滤世界书条目的函数，默认仅包含 targetApi 为 'second' 或 'both' 的条目
   * @param options.maxChatHistory - 聊天历史最大条数，默认 20
   * @param options.includeWorldbook - 是否包含世界书，默认 true
   * @param options.includeChatHistory - 是否包含聊天历史，默认 true
   */
  async function buildSecondApiContext(
    options: {
      worldbookFilter?: (entry: WorldbookEntryEnhanced) => boolean;
      maxChatHistory?: number;
      includeWorldbook?: boolean;
      includeChatHistory?: boolean;
    } = {},
  ): Promise<{ role: 'system'; content: string }[]> {
    const { maxChatHistory = 20, includeWorldbook = true, includeChatHistory = true } = options;

    const prompts: { role: 'system'; content: string }[] = [];

    // 世界书
    if (includeWorldbook) {
      try {
        const entries = await getEnhancedWorldbook();
        const filter =
          options.worldbookFilter ??
          (e => {
            const target = e.targetApi ?? 'main';
            return target === 'second' || target === 'both';
          });
        const filtered = entries.filter(filter).filter(e => e.enabled);
        if (filtered.length > 0) {
          const worldbookText = filtered.map(e => `【${e.name}】\n${e.content}`).join('\n\n');
          prompts.push({ role: 'system', content: worldbookText });
        }
      } catch (e) {
        console.warn('[SecondAPI] 获取世界书失败:', e);
      }
    }

    // 角色设定
    try {
      const charText = await getCharPersonalityText();
      if (charText) {
        prompts.push({ role: 'system', content: charText });
      }
    } catch (e) {
      console.warn('[SecondAPI] 获取角色设定失败:', e);
    }

    // 聊天历史
    if (includeChatHistory) {
      const chatText = getChatHistoryText(maxChatHistory);
      if (chatText) {
        prompts.push({ role: 'system', content: chatText });
      }
    }

    return prompts;
  }

  /** Called from index.ts on GENERATION_ENDED; runs danmaku request and queues push with 200ms–3s spacing */
  async function triggerDanmakuForMessage(message_id: number) {
    if (!settings.value.danmakuEnabled) return;
    const messages = getChatMessages(message_id);
    const raw = messages[0]?.message ?? '';
    const contentText = extractContentTag(raw);
    if (!contentText) return;
    try {
      const lines = (await callSecondApi({
        task: 'danmaku',
        contentText,
      })) as string[];
      if (lines.length === 0) return;

      // 清空旧弹幕并初始化轨道
      danmakuItems.value = [];
      const trackCount = initTracks();

      const minGap = 200;
      const maxGap = 3000;
      lines.forEach((text, i) => {
        const delay = i === 0 ? 0 : minGap + Math.random() * (maxGap - minGap);
        setTimeout(() => spawnSingleDanmaku(text, trackCount), delay);
      });
    } catch {
      /* toast already in callSecondApi */
    }
  }

  // ====== Worldbook Management ======

  /** Get all worldbook names associated with current character and chat */
  function getAllCurrentWorldbookNames(): string[] {
    const names: string[] = [];
    try {
      const charWbs = getCharWorldbookNames('current');
      if (charWbs.primary) names.push(charWbs.primary);
      names.push(...charWbs.additional);
    } catch {
      /* ignore */
    }
    try {
      const chatWbName = getChatWorldbookName('current');
      if (chatWbName && !names.includes(chatWbName)) names.push(chatWbName);
    } catch {
      /* ignore */
    }
    try {
      for (const n of getGlobalWorldbookNames()) {
        if (!names.includes(n)) names.push(n);
      }
    } catch {
      /* ignore */
    }
    return names;
  }

  /** Get enhanced worldbook entries with our custom fields */
  async function getEnhancedWorldbook(): Promise<WorldbookEntryEnhanced[]> {
    const names = getAllCurrentWorldbookNames();
    const allEntries: WorldbookEntryEnhanced[] = [];
    for (const name of names) {
      try {
        const entries = await getWorldbook(name);
        for (const entry of entries) {
          allEntries.push({
            ...entry,
            enabled: entry.enabled,
            targetApi: (entry.extra?.targetApi as 'main' | 'second' | 'both') ?? 'main',
            autoControl: entry.extra?.autoControl ?? false,
            linkedFeature: entry.extra?.linkedFeature,
            _worldbookName: name,
          });
        }
      } catch (e) {
        console.warn(`[Worldbook] Failed to load worldbook "${name}":`, e);
      }
    }
    return allEntries;
  }

  /** Update worldbook entry enhancement fields */
  async function updateWorldbookEntry(uid: number, worldbookName: string, updates: Partial<WorldbookEntryEnhanced>) {
    const { targetApi, autoControl, linkedFeature, enabled } = updates;
    try {
      await updateWorldbookWith(
        worldbookName,
        wb =>
          wb.map(e => {
            if (e.uid !== uid) return e;
            const extra = { ...e.extra };
            if (targetApi !== undefined) extra.targetApi = targetApi;
            if (autoControl !== undefined) extra.autoControl = autoControl;
            if (linkedFeature !== undefined) extra.linkedFeature = linkedFeature;
            const result: any = { ...e, extra };
            if (enabled !== undefined) result.enabled = enabled;
            return result;
          }),
        { render: 'debounced' },
      );
      showToast('世界书条目已更新');
    } catch (e) {
      console.error('[Worldbook] Failed to update entry:', e);
      showToast('更新失败');
    }
  }

  /** Auto-control worldbook entries based on feature toggles */
  async function updateWorldbookAutoControl() {
    const names = getAllCurrentWorldbookNames();
    for (const name of names) {
      try {
        const entries = await getWorldbook(name);
        const hasAutoControl = entries.some(e => e.extra?.autoControl);
        if (!hasAutoControl) continue;
        let hasChange = false;
        await updateWorldbookWith(
          name,
          wb =>
            wb.map(e => {
              if (!e.extra?.autoControl) return e;
              let shouldEnable = false;
              switch (e.extra?.linkedFeature) {
                case 'danmaku':
                  shouldEnable = settings.value.danmakuEnabled;
                  break;
                case 'imageGen':
                  shouldEnable = settings.value.imageGenEnabled;
                  break;
              }
              if (e.enabled !== shouldEnable) {
                hasChange = true;
                return { ...e, enabled: shouldEnable };
              }
              return e;
            }),
          { render: 'debounced' },
        );
        if (hasChange) {
          console.info('[Worldbook] Auto-control updated entries in', name);
        }
      } catch (e) {
        console.warn(`[Worldbook] Failed to update auto-control for "${name}":`, e);
      }
    }
  }

  function loadUserCharacterFromStorage(): UserCharacter {
    try {
      const raw = localStorage.getItem('vn_galgame_user_character');
      if (raw) return UserCharacterSchema.parse(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    return UserCharacterSchema.parse({});
  }
  const userCharacter = ref<UserCharacter>(loadUserCharacterFromStorage());
  watchEffect(() => {
    try {
      localStorage.setItem('vn_galgame_user_character', JSON.stringify(klona(userCharacter.value)));
    } catch {
      /* ignore */
    }
  });

  // --- Characters / modules ---
  const characterRoster = ref<CharacterStatus[]>(DEMO_CHARACTERS);
  const gameModules = ref<GameModule[]>(DEMO_MODULES);

  // --- Workshop runtime ---
  const workshopProducing = ref(false);
  const workshopCharacterId = ref<string | null>(null);
  const workshopStartTime = ref<number | null>(null);
  const workshopAccumulated = ref(0);

  // --- Stock market runtime (merged into workshop, uses gold directly) ---
  const stockSimulator = createStockSimulator(Math.round((50 + Math.random() * 100) * 100) / 100);
  const stockPrice = ref(stockSimulator.getPrice());
  const stockHistory = ref<number[]>([...stockSimulator.getHistory()]);
  const stockPosition = ref(0);
  const stockInvested = ref(0);
  const stockPaused = ref(false);
  const stockActive = ref(false);
  const stockTickInterval = ref<ReturnType<typeof setInterval> | null>(null);
  const stockLastDirection = ref<'up' | 'down' | null>(null);

  // --- 2048 runtime ---
  const puzzle2048Active = ref(false);
  const puzzle2048Size = ref(gameData.value.puzzle2048Size || 4);
  const puzzle2048Tiles = ref<Tile2048[]>(
    gameData.value.puzzle2048Tiles.length > 0
      ? tilesFromSave(gameData.value.puzzle2048Tiles)
      : initTiles2048(puzzle2048Size.value),
  );
  const puzzle2048Score = ref(gameData.value.puzzle2048Score);
  const puzzle2048BestScore = ref(gameData.value.puzzle2048BestScore);
  const puzzle2048GameOver = ref(false);
  const puzzle2048Won = ref(false);
  const puzzle2048WonAcknowledged = ref(false);

  // --- Riddle runtime ---
  const riddleActive = ref(false);
  const riddleAnswer = ref('');
  const riddleChatHistory = ref<{ role: 'user' | 'ai'; text: string }[]>([]);
  const riddleRounds = ref(0);
  const riddlePersonalityId = ref<string | null>(null);

  // --- Danmaku runtime ---
  const danmakuItems = ref<DanmakuItem[]>([]);

  // ====== Economy Service ======

  const GOLD_WINDFALL_THRESHOLD = 400;
  function changeGold(amount: number, moduleId: string, reason: string) {
    const nextGold = (Number(_.get(latestMvu.statData, '金币', 0)) || 0) + amount;
    latestMvu.patch(stat => {
      _.set(stat, '金币', nextGold);
    });

    // keep local runtime state & logs
    gameData.value.gold = nextGold;
    gameData.value.transactionLog.unshift({ moduleId, reason, amount, timestamp: Date.now() });
    if (gameData.value.transactionLog.length > 50) gameData.value.transactionLog.length = 50;
    if (amount >= GOLD_WINDFALL_THRESHOLD) triggerProactive('gold_windfall');
  }

  /**
   * 写入指定楼层 MVU 变量中的某个 key。
   * 与项目内"角色走向选择"参考脚本一致，使用 getVariables + replaceVariables。
   * key 不存在则新增；存在则覆盖；stat_data 不存在则创建。
   *
   * @param messageId 目标楼层（数值 message_id 或 'latest'）
   * @param key 字段名（如 "剧情文本"），会写到 stat_data[key]
   * @param value 字段值
   */
  function writeMvuMessageField(
    messageId: number | 'latest',
    key: string,
    value: unknown,
  ): void {
    try {
      const vars = getVariables({ type: 'message', message_id: messageId }) || {};
      const nextVars: Record<string, any> =
        vars && typeof vars === 'object' && !Array.isArray(vars) ? { ...vars } : {};
      if (
        !nextVars.stat_data ||
        typeof nextVars.stat_data !== 'object' ||
        Array.isArray(nextVars.stat_data)
      ) {
        nextVars.stat_data = {};
      }
      nextVars.stat_data[key] = value;
      replaceVariables(nextVars, { type: 'message', message_id: messageId });
    } catch (err) {
      console.warn('[MVU] 写入楼层变量失败:', { messageId, key, err });
    }
  }

  function clearTransactionLog() {
    gameData.value.transactionLog = [];
  }

  function addInventoryItem(item: Omit<InventoryItem, 'quantity'>) {
    latestMvu.patch(stat => {
      const raw = _.get(stat, '收集物', {});
      const bag: Record<string, { 描述: string; 数量: number; 图标?: string }> =
        raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as any) : {};

      const nameKey = item.name.trim();
      const prev = bag[nameKey];
      const prevQty = Number(prev?.数量 ?? 0) || 0;

      // rule: name same => quantity + 1; other fields keep old
      if (prev) {
        bag[nameKey] = {
          ...prev,
          数量: prevQty + 1,
        };
      } else {
        bag[nameKey] = {
          描述: item.effect,
          数量: 1,
          ...(item.icon ? { 图标: item.icon } : {}),
        };
      }

      _.set(stat, '收集物', bag);

      // keep local runtime state aligned
      gameData.value.inventory = klona(
        Object.entries(bag).map(([name, v]) => ({
          id: name,
          name,
          effect: v.描述,
          quantity: v.数量,
          icon: v.图标,
        })),
      );
    });
  }

  // ====== Workshop ======

  function startProduction(characterId: string) {
    workshopCharacterId.value = characterId;
    workshopProducing.value = true;
    workshopStartTime.value = Date.now();
    workshopAccumulated.value = 0;
  }

  function pauseProduction() {
    if (!workshopProducing.value || !workshopStartTime.value) return;
    const char = characterRoster.value.find(c => c.id === workshopCharacterId.value);
    if (!char) return;
    const elapsed = (Date.now() - workshopStartTime.value) / 1000;
    const bonus = 1 + (gameData.value.workshopLevel - 1) * 0.1;
    workshopAccumulated.value += Math.floor(elapsed * char.productionSpeed * char.productionYield * bonus);
    workshopProducing.value = false;
    workshopStartTime.value = null;
  }

  function resumeProduction() {
    if (!workshopCharacterId.value || workshopProducing.value) return;
    workshopProducing.value = true;
    workshopStartTime.value = Date.now();
  }

  const WORKSHOP_IDLE_LONG_SECONDS = 300;
  function stopProductionAndSettle() {
    if (!workshopCharacterId.value) return 0;
    const char = characterRoster.value.find(c => c.id === workshopCharacterId.value);
    if (!char) return 0;
    let earned = workshopAccumulated.value;
    let elapsedSec = 0;
    if (workshopProducing.value && workshopStartTime.value) {
      elapsedSec = (Date.now() - workshopStartTime.value) / 1000;
      const bonus = 1 + (gameData.value.workshopLevel - 1) * 0.1;
      earned += Math.floor(elapsedSec * char.productionSpeed * char.productionYield * bonus);
    }
    if (earned > 0) changeGold(earned, 'idle_workshop', `${char.name} 生产结算`);
    if (elapsedSec >= WORKSHOP_IDLE_LONG_SECONDS) triggerProactive('workshop_idle_long');
    workshopProducing.value = false;
    workshopCharacterId.value = null;
    workshopStartTime.value = null;
    workshopAccumulated.value = 0;
    return earned;
  }

  function upgradeWorkshop() {
    if (gameData.value.workshopLevel >= 10) return false;
    const cost = gameData.value.workshopLevel * 200;
    if (gameData.value.gold < cost) return false;
    changeGold(-cost, 'idle_workshop', `工坊升至 ${gameData.value.workshopLevel + 1} 级`);
    gameData.value.workshopLevel++;
    triggerProactive('workshop_upgrade');
    return true;
  }

  // ====== Stock Market (uses gold directly) ======

  function doStockTick() {
    const prevPrice = stockSimulator.getPrice();
    stockSimulator.tick();
    stockPrice.value = stockSimulator.getPrice();
    stockHistory.value = [...stockSimulator.getHistory()];
    stockLastDirection.value =
      stockPrice.value > prevPrice ? 'up' : stockPrice.value < prevPrice ? 'down' : stockLastDirection.value;
  }

  function startStockTicker() {
    if (stockTickInterval.value) return;
    stockTickInterval.value = setInterval(() => {
      if (!stockPaused.value) doStockTick();
    }, 3000);
  }

  function stopStockTicker() {
    if (stockTickInterval.value) {
      clearInterval(stockTickInterval.value);
      stockTickInterval.value = null;
    }
  }

  function enterStockMarket() {
    stockActive.value = true;
    stockPaused.value = false;
    startStockTicker();
  }

  function stockBuy() {
    if (stockPaused.value) return false;
    const cost = Math.ceil(stockPrice.value);
    const fee = calcStockFee(gameData.value.workshopLevel);
    if (gameData.value.gold < cost + fee) return false;
    changeGold(-(cost + fee), 'stock_market', '买入 1 股');
    stockPosition.value += 1;
    stockInvested.value += cost;
    stockSimulator.applyTradeImpact('buy', 1);
    doStockTick();
    return true;
  }

  function stockSell() {
    if (stockPaused.value) return false;
    if (stockPosition.value < 1) return false;
    const revenue = Math.floor(stockPrice.value);
    const fee = calcStockFee(gameData.value.workshopLevel);
    changeGold(revenue - fee, 'stock_market', '卖出 1 股');
    stockPosition.value -= 1;
    stockInvested.value =
      stockPosition.value > 0 ? Math.floor(stockInvested.value * (stockPosition.value / (stockPosition.value + 1))) : 0;
    stockSimulator.applyTradeImpact('sell', 1);
    doStockTick();
    return true;
  }

  function exitStockMarket() {
    stopStockTicker();
    const fee = calcStockFee(gameData.value.workshopLevel);
    const invested = stockInvested.value;
    let totalReceived = 0;
    while (stockPosition.value > 0) {
      const revenue = Math.floor(stockPrice.value);
      const net = revenue - fee;
      changeGold(net, 'stock_market', '平仓卖出');
      totalReceived += net;
      stockPosition.value--;
    }
    if (invested > 0 && totalReceived < invested) triggerProactive('stock_bankruptcy');
    stockActive.value = false;
    stockInvested.value = 0;
    resetStock();
  }

  function resetStock() {
    stopStockTicker();
    stockSimulator.reset();
    stockPrice.value = stockSimulator.getPrice();
    stockHistory.value = [...stockSimulator.getHistory()];
    stockPosition.value = 0;
    stockInvested.value = 0;
    stockPaused.value = false;
    stockLastDirection.value = null;
  }

  function toggleStockPause() {
    stockPaused.value = !stockPaused.value;
  }

  // ====== 2048 ======

  function start2048(size: number) {
    const fee = calcCommission(gameData.value.gold, gameData.value.workshopLevel, 0);
    if (fee > 0 && gameData.value.gold < fee) return false;
    if (fee > 0) changeGold(-fee, 'puzzle_2048', '开启游戏');
    puzzle2048Size.value = size;
    puzzle2048Tiles.value = initTiles2048(size);
    puzzle2048Score.value = 0;
    puzzle2048GameOver.value = false;
    puzzle2048Won.value = false;
    puzzle2048WonAcknowledged.value = false;
    puzzle2048Active.value = true;
    gameData.value.puzzle2048Size = size;
    return true;
  }

  function autoStart2048() {
    const saved = gameData.value.puzzle2048Tiles;
    if (saved.length > 0) {
      puzzle2048Tiles.value = tilesFromSave(saved);
      puzzle2048Score.value = gameData.value.puzzle2048Score;
      puzzle2048BestScore.value = gameData.value.puzzle2048BestScore;
      puzzle2048Size.value = gameData.value.puzzle2048Size || 4;
      puzzle2048GameOver.value = false;
      puzzle2048Won.value = false;
      puzzle2048WonAcknowledged.value = false;
      puzzle2048Active.value = true;
      return true;
    }
    return start2048(puzzle2048Size.value);
  }

  function move2048Action(direction: Direction2048) {
    if (!puzzle2048Active.value || puzzle2048GameOver.value) return;
    const { newTiles, scored, changed } = moveTiles2048(puzzle2048Tiles.value, direction, puzzle2048Size.value);
    if (!changed) {
      if (isGameOver2048(puzzle2048Tiles.value, puzzle2048Size.value)) puzzle2048GameOver.value = true;
      return;
    }
    const finalTiles = addNewTile2048(newTiles, puzzle2048Size.value);
    puzzle2048Tiles.value = finalTiles;
    puzzle2048Score.value += scored;
    if (puzzle2048Score.value > puzzle2048BestScore.value) {
      puzzle2048BestScore.value = puzzle2048Score.value;
      gameData.value.puzzle2048BestScore = puzzle2048BestScore.value;
    }
    if (hasWon2048(finalTiles) && !puzzle2048Won.value) puzzle2048Won.value = true;
    if (isGameOver2048(finalTiles, puzzle2048Size.value)) puzzle2048GameOver.value = true;
  }

  function settle2048() {
    const reward = puzzle2048Score.value;
    if (reward > 0) changeGold(reward, 'puzzle_2048', '结算收益');
    puzzle2048Active.value = false;
    puzzle2048Tiles.value = initTiles2048(puzzle2048Size.value);
    puzzle2048Score.value = 0;
    puzzle2048GameOver.value = false;
    puzzle2048Won.value = false;
    puzzle2048WonAcknowledged.value = false;
    gameData.value.puzzle2048Tiles = [];
    gameData.value.puzzle2048Score = 0;
    return reward;
  }

  function save2048() {
    gameData.value.puzzle2048Tiles = tilesToSave(puzzle2048Tiles.value);
    gameData.value.puzzle2048Score = puzzle2048Score.value;
    showToast('已保存');
  }

  function acknowledge2048Win() {
    puzzle2048WonAcknowledged.value = true;
  }

  // ====== Riddle (normalize + block + onRiddleSolved) ======

  function normalizeForAnswer(s: string): string {
    return s
      .trim()
      .replace(/[\uFF01-\uFF5E]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
      .replace(/\s+/g, '')
      .toLowerCase();
  }

  const riddleStartTime = ref<number | null>(null);

  function startRiddle(personalityId: string, answer: string, firstHint: string) {
    riddlePersonalityId.value = personalityId;
    riddleAnswer.value = normalizeForAnswer(answer);
    riddleChatHistory.value = [{ role: 'user', text: firstHint }];
    riddleRounds.value = 1;
    riddleStartTime.value = Date.now();
    riddleActive.value = true;

    const hist = systemChatHistories.value[personalityId] ?? [];
    if (!systemChatHistories.value[personalityId]) systemChatHistories.value[personalityId] = hist;

    // 如果该联系人已有猜谜记录，在最末尾加一条分割线隔开
    const lastRiddleIdx = hist.findLastIndex(
      m => m.role === 'riddle_start' || m.role === 'riddle_end_pending' || m.role === 'riddle_end',
    );
    if (lastRiddleIdx >= 0) {
      hist.splice(lastRiddleIdx + 1, 0, { role: 'riddle_divider', text: '' });
    }

    hist.push({ role: 'riddle_divider', text: '' });
    hist.push({ role: 'riddle_start', text: '' });
    hist.push({ role: 'user', text: firstHint });
    hist.push({ role: 'riddle_end_pending', text: '' });
  }

  function riddleAnswerContains(userInput: string): boolean {
    const normalized = normalizeForAnswer(userInput);
    return normalized.includes(riddleAnswer.value) || riddleAnswer.value.includes(normalized);
  }

  function addRiddleUserMessage(text: string) {
    if (riddleAnswerContains(text)) return false;
    riddleChatHistory.value.push({ role: 'user', text });
    riddleRounds.value++;
    return true;
  }

  function onRiddleSolved(rounds: number, _elapsedMs: number) {
    const reward = 50 + rounds * 20;
    changeGold(reward, 'ai_riddle', `猜谜成功 (${rounds} 轮)`);
    gameData.value.riddleLastRecord = {
      answer: riddleAnswer.value,
      rounds,
      reward,
      timestamp: Date.now(),
    };
    riddleActive.value = false;
    riddleChatHistory.value = [];
    riddleStartTime.value = null;
    riddlePersonalityId.value = null;
    const personality = SYSTEM_PERSONALITIES.find(p => p.id === (lastActiveUnlockedPersonalityId.value ?? ''));
    const lines = personality?.proactiveLines?.riddle_solved;
    if (lines?.length) addProactiveToSystemChat(lines[Math.floor(Math.random() * lines.length)]!);
  }

  function addRiddleAiReply(text: string) {
    riddleChatHistory.value.push({ role: 'ai', text });
    const normalizedReply = normalizeForAnswer(text);
    if (normalizedReply.includes(riddleAnswer.value)) {
      const elapsedMs = riddleStartTime.value != null ? Date.now() - riddleStartTime.value : 0;
      onRiddleSolved(riddleRounds.value, elapsedMs);
      return { won: true, reward: 50 + riddleRounds.value * 20 };
    }
    return { won: false, reward: 0 };
  }

  function abortRiddleByUser(personalityId: string) {
    const hist = systemChatHistories.value[personalityId] ?? [];
    if (!systemChatHistories.value[personalityId]) systemChatHistories.value[personalityId] = hist;
    const idx = hist.findLastIndex(m => m.role === 'riddle_end_pending');
    if (idx >= 0) {
      hist[idx] = { role: 'riddle_end', text: '' };
      hist.splice(idx + 1, 0, { role: 'riddle_divider', text: '' });
    }

    // 放弃不结算金币，仅记录上次战绩为 0 奖励
    gameData.value.riddleLastRecord = {
      answer: riddleAnswer.value,
      rounds: riddleRounds.value,
      reward: 0,
      timestamp: Date.now(),
    };

    riddleActive.value = false;
    riddleChatHistory.value = [];
    riddleStartTime.value = null;
    riddlePersonalityId.value = null;
  }

  function endRiddle() {
    if (riddlePersonalityId.value) {
      abortRiddleByUser(riddlePersonalityId.value);
    } else {
      riddleActive.value = false;
      riddleChatHistory.value = [];
      riddleStartTime.value = null;
      riddlePersonalityId.value = null;
    }
  }

  async function requestRiddleAiReply(): Promise<{ won: boolean; reward: number; reply: string }> {
    const hist = riddleChatHistory.value;
    const pid = riddlePersonalityId.value;
    const personality = SYSTEM_PERSONALITIES.find(p => p.id === pid);
    const personalityPrompt = personality?.systemPrompt ?? DEFAULT_PERSONALITY_PROMPT;

    // 构造系统提示词：包含角色设定、猜谜规则、聊天记录、最新提示
    const chatLogText = hist.map(m => (m.role === 'ai' ? `对方：${m.text}` : `你：${m.text}`)).join('\n');
    const latestHint = hist.length > 0 ? hist[hist.length - 1]!.text : '';

    const raw = (await callSecondApi({
      task: 'riddle',
      personalityPrompt,
      chatLogText,
      latestHint,
    })) as string;
    const reply = raw?.trim() || '让我再想想…';
    const result = addRiddleAiReply(reply);
    return { ...result, reply };
  }

  async function bootstrapRiddleFirstReply(personalityId: string): Promise<string> {
    if (!riddleActive.value || riddlePersonalityId.value !== personalityId) return '';
    const hist = systemChatHistories.value[personalityId] ?? [];
    if (!systemChatHistories.value[personalityId]) systemChatHistories.value[personalityId] = hist;

    const result = await requestRiddleAiReply();
    const pendingIdx = hist.findLastIndex(m => m.role === 'riddle_end_pending');
    if (pendingIdx >= 0) hist.splice(pendingIdx, 0, { role: 'assistant', text: result.reply });
    else hist.push({ role: 'assistant', text: result.reply });

    if (result.won) {
      const idx = hist.findLastIndex(m => m.role === 'riddle_end_pending');
      if (idx >= 0) hist[idx] = { role: 'riddle_end', text: '' };
    }

    return result.reply;
  }

  // ====== Shop ======

  const shopItems = ref<ShopItem[]>([]);
  const shopRefreshing = ref(false);
  const shopGenerationId = ref(0);

  async function refreshShop() {
    if (secondApiStatus.value === 'disabled') {
      showToast('第二 API 未配置');
      return;
    }
    const cost = calcCommission(gameData.value.gold, gameData.value.workshopLevel, 50);
    if (gameData.value.gold < cost) {
      showToast('金币不足');
      return;
    }
    changeGold(-cost, 'shop', '刷新商店');
    shopRefreshing.value = true;
    shopGenerationId.value++;
    const genId = shopGenerationId.value;
    try {
      const result = await callSecondApi({ task: 'shop' });
      if (genId !== shopGenerationId.value) return;
      shopItems.value = result as ShopItem[];
      if (shopItems.value.length === 0) {
        shopItems.value = [
          { id: `s${Date.now()}_0`, name: '破旧绷带', effect: '恢复少量生命', price: 30 },
          { id: `s${Date.now()}_1`, name: '生锈罐头', effect: '恢复饱食度', price: 50 },
          { id: `s${Date.now()}_2`, name: '旧报纸碎片', effect: '可能包含线索', price: 80 },
          { id: `s${Date.now()}_3`, name: '煤油灯', effect: '照亮黑暗区域', price: 120 },
        ];
      }
    } catch {
      /* toast in callSecondApi */
    } finally {
      shopRefreshing.value = false;
    }
  }

  function purchaseShopItem(itemId: string) {
    const item = shopItems.value.find(i => i.id === itemId);
    if (!item) return false;
    if (gameData.value.gold < item.price) {
      showToast('金币不足');
      return false;
    }
    changeGold(-item.price, 'shop', `购买 ${item.name}`);
    addInventoryItem({ id: item.id, name: item.name, effect: item.effect, icon: (item as any).icon });
    shopItems.value = shopItems.value.filter(i => i.id !== itemId);
    return true;
  }

  // ====== Board Game Event Generation ======

  /**
   * 生成废土行路事件池（地图生成时调用一次）
   *
   * AI 返回 9-12 张卡，每行一个，管道分隔：
   * title|description|tendency|effect|hp|sanity
   *
   * @param sceneText - 当前场景描述，供 AI 参考生成风格匹配的事件
   * @returns 解析好的 GameEvent[]，失败返回空数组
   */
  async function generateBoardGameEventPool(sceneText: string): Promise<GameEvent[]> {
    if (secondApiStatus.value === 'disabled') {
      console.warn('[BoardGame] 第二 API 未配置，跳过事件池生成');
      return [];
    }

    try {
      const raw = (await callSecondApi({
        task: 'boardGameEvent',
        sceneText,
      })) as string;

      const lines = raw
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);
      const events: GameEvent[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 6) {
          console.warn(`[BoardGame] 第 ${i + 1} 行格式错误，跳过: ${line}`);
          continue;
        }

        const [title, description, tendency, effect, hpStr, sanityStr] = parts;
        const hp = parseInt(hpStr, 10);
        const sanity = parseInt(sanityStr, 10);

        if (!title || !tendency || isNaN(hp) || isNaN(sanity)) {
          console.warn(`[BoardGame] 第 ${i + 1} 行字段解析失败，跳过: ${line}`);
          continue;
        }

        events.push({
          id: `ai_pool_${Date.now()}_${i}`,
          nodeType: 'encounter',
          title,
          description,
          tendency: tendency as 'negative' | 'positive' | 'neutral',
          effect: {
            message: effect,
            hp: isNaN(hp) ? 0 : hp,
            sanity: isNaN(sanity) ? 0 : sanity,
          },
        });
      }

      if (events.length === 0) {
        console.warn('[BoardGame] 事件池生成失败，未解析到任何有效事件');
      } else {
        console.info(`[BoardGame] 事件池生成成功，共 ${events.length} 张卡`);
      }

      return events;
    } catch (e) {
      console.error('[BoardGame] 事件池生成失败:', e);
      return [];
    }
  }

  // ====== Danmaku ======

  // 弹幕设置常量
  const DANMAKU_SPEED_BASE = 0.15; // 基础速度：px/ms
  const DANMAKU_MIN_GAP = 50; // 轨道间最小间距(px)
  const DANMAKU_MAX_GAP = 200; // 轨道间最大间距(px)
  // 弹幕视口参考宽度：用于估算"飞过屏幕"的时长
  // 实际容器宽度可能不同，但作为时长基准是合理的近似
  const DANMAKU_VIEWPORT_WIDTH = 1280; // px

  // 轨道状态：每条轨道记录下一条弹幕可进入的时间
  const trackNextAvailableTime = ref<number[]>([]);

  // 当前楼层的弹幕缓存（用于循环播放）
  const currentFloorDanmaku = ref<string[]>([]);
  // 循环播放定时器
  let danmakuLoopTimer: ReturnType<typeof setTimeout> | null = null;
  // 弹幕生成定时器（用于控制密度）
  let danmakuSpawnTimer: ReturnType<typeof setTimeout> | null = null;

  let _danmakuIdCounter = 0;

  // 弹幕版本号：设置变化时递增，触发重新渲染
  const _danmakuVersion = 0;

  /** 通知弹幕根据新设置重新渲染 */
  function notifyDanmakuSettingsChanged() {
    // 先保存当前弹幕文本，避免被 clearDanmaku 清空
    const texts = currentFloorDanmaku.value;

    // 清空所有弹幕和定时器（不清 currentFloorDanmaku，保留内容用于重新生成）
    if (danmakuLoopTimer) {
      clearTimeout(danmakuLoopTimer);
      danmakuLoopTimer = null;
    }
    if (danmakuSpawnTimer) {
      clearTimeout(danmakuSpawnTimer);
      danmakuSpawnTimer = null;
    }
    danmakuItems.value = [];
    trackNextAvailableTime.value = [];

    // 如果有当前楼层的弹幕内容，重新生成
    if (texts.length > 0) {
      const trackCount = initTracks();
      const shuffledTexts = shuffleArray(texts);
      scheduleDanmakuBatch(shuffledTexts, trackCount);
      // 如果开启循环，重新调度
      if (settings.value.danmakuLoop) {
        scheduleDanmakuLoop(shuffledTexts, trackCount);
      }
    }
  }

  /**
   * 计算当前显示模式下的轨道数
   * 轨道数在 4~17 条之间均匀分布：
   * - full: 17 条
   * - half: 8 条（约 17/2）
   * - third: 6 条（约 17/3）
   */
  function getDanmakuTrackCount(): number {
    switch (settings.value.danmakuDisplay) {
      case 'full':
        return 17;
      case 'half':
        return 8;
      case 'third':
        return 6;
      default:
        return 6;
    }
  }

  /**
   * 初始化轨道状态
   * 根据显示区域计算轨道数
   */
  function initTracks() {
    const trackCount = getDanmakuTrackCount();
    trackNextAvailableTime.value = Array(trackCount).fill(0);
    return trackCount;
  }

  /**
   * 打乱数组顺序（Fisher-Yates 算法）
   */
  function shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * 获取弹幕速度倍率
   * 速度1最慢，10最快
   */
  function getDanmakuSpeedMultiplier(): number {
    // 速度1时倍率为0.06075（最慢），速度10时倍率为0.42525（最快），整体为原速度的约20%
    return 0.02025 + settings.value.danmakuSpeed * 0.0405;
  }

  /**
   * 获取弹幕动画时长（ms）
   * 参考 rc-bullets：duration 基于"飞过视口的总路程"计算，
   * 与文本宽度无关，确保所有弹幕的飞行时间一致
   * 速度1时约15秒，速度5时约5秒，速度10时约2.5秒
   */
  function getDanmakuDuration(_textWidth: number): number {
    const speedMultiplier = getDanmakuSpeedMultiplier();
    // 单条弹幕需要飞过的总路程 = 自身宽度 + 视口宽度（从右外进入，到左外消失）
    const totalDistance = _textWidth + DANMAKU_VIEWPORT_WIDTH;
    return totalDistance / (DANMAKU_SPEED_BASE * speedMultiplier);
  }

  /**
   * 估算弹幕文本宽度
   * 根据字体大小和字符数估算
   */
  function estimateTextWidth(text: string): number {
    const fontSize = settings.value.danmakuFontSize || 1.2;
    // 估算每个字符约 0.6em 宽度
    const avgCharWidth = fontSize * 0.6;
    // 加上内边距
    return (text.length * avgCharWidth + 2) * 16; // 转为 px，1em = 16px
  }

  /**
   * 推送弹幕到显示队列
   * @param texts 弹幕文本数组
   */
  function pushDanmaku(texts: string[]) {
    if (!settings.value.danmakuEnabled || texts.length === 0) return;

    // 清空旧的弹幕
    danmakuItems.value = [];
    currentFloorDanmaku.value = texts;

    // 初始化轨道
    const trackCount = initTracks();

    // 打乱顺序
    const shuffledTexts = shuffleArray(texts);

    // 逐条调度弹幕，控制密度
    scheduleDanmakuBatch(shuffledTexts, trackCount);

    // 如果开启循环
    if (settings.value.danmakuLoop) {
      scheduleDanmakuLoop(shuffledTexts, trackCount);
    }
  }

  /**
   * 调度弹幕批次，控制密度
   */
  function scheduleDanmakuBatch(texts: string[], trackCount: number) {
    if (!settings.value.danmakuEnabled || texts.length === 0) return;

    let index = 0;

    const spawnNext = () => {
      if (!settings.value.danmakuEnabled || index >= texts.length) return;

      const text = texts[index++];
      spawnSingleDanmaku(text, trackCount);

      // 控制密度：每条弹幕间隔 100-500ms
      const delay = 100 + Math.random() * 400;
      danmakuSpawnTimer = setTimeout(spawnNext, delay);
    };

    spawnNext();
  }

  /**
   * 生成单条弹幕
   */
  function spawnSingleDanmaku(text: string, trackCount: number) {
    if (!settings.value.danmakuEnabled) return;

    const now = Date.now();
    const textWidth = estimateTextWidth(text);
    const speedMultiplier = getDanmakuSpeedMultiplier();

    // 找一条可用的轨道
    let bestTrack = -1;
    let earliestTime = Infinity;

    // 随机打乱轨道顺序，增加随机性
    const trackIndices = shuffleArray(Array.from({ length: trackCount }, (_, i) => i));

    for (const track of trackIndices) {
      const availableTime = trackNextAvailableTime.value[track];
      if (availableTime <= now) {
        // 轨道可用
        if (availableTime < earliestTime) {
          earliestTime = availableTime;
          bestTrack = track;
        }
      }
    }

    // 如果没有立即可用的轨道，等待最早的
    if (bestTrack === -1) {
      for (let track = 0; track < trackCount; track++) {
        if (trackNextAvailableTime.value[track] < earliestTime) {
          earliestTime = trackNextAvailableTime.value[track];
          bestTrack = track;
        }
      }

      // 等待该轨道可用
      const waitTime = earliestTime - now;
      if (waitTime > 0) {
        setTimeout(() => spawnSingleDanmaku(text, trackCount), waitTime);
        return;
      }
    }

    // 分配到最佳轨道
    const track = bestTrack;
    const itemId = `d${_danmakuIdCounter++}`;
    const duration = getDanmakuDuration(textWidth);

    // 计算弹幕进入动画的延迟（留出间距）
    // 延迟 = 弹幕宽度 + 随机间距，然后根据速度调整
    const gap = DANMAKU_MIN_GAP + Math.random() * (DANMAKU_MAX_GAP - DANMAKU_MIN_GAP);
    const entryDelay = (textWidth + gap) / (DANMAKU_SPEED_BASE * speedMultiplier);

    // 更新轨道状态：下一条弹幕需要等当前弹幕完全离开入口
    trackNextAvailableTime.value[track] = now + entryDelay;

    danmakuItems.value.push({
      id: itemId,
      text,
      track,
      progress: 0,
      speed: DANMAKU_SPEED_BASE * speedMultiplier,
      width: textWidth,
      duration,
      version: _danmakuVersion,
    });

    // 设置定时器移除弹幕（动画结束后再移除）
    setTimeout(() => {
      removeDanmaku(itemId);
    }, duration);

    // 清理过期的轨道状态
    if (trackNextAvailableTime.value[track] < now) {
      trackNextAvailableTime.value[track] = now;
    }
  }

  /**
   * 调度循环播放
   * 使用用户设置的 danmakuLoopDuration（秒）作为循环间隔
   * 当间隔到达时，检查是否还有弹幕在飞：
   *  - 如果有，等待最晚的一条飞完再清空（避免裁断）
   *  - 如果没有，立即清空开始新一轮
   */
  function scheduleDanmakuLoop(texts: string[], trackCount: number) {
    if (!settings.value.danmakuLoop || !settings.value.danmakuEnabled) return;
    if (danmakuLoopTimer) return;

    // 优先使用用户设置的循环时长（秒 -> 毫秒）
    const baseDelayMs = (settings.value.danmakuLoopDuration || 10) * 1000;
    const jitter = 0.85 + Math.random() * 0.3;
    const loopDelay = baseDelayMs * jitter;

    danmakuLoopTimer = setTimeout(() => {
      danmakuLoopTimer = null;
      if (!settings.value.danmakuLoop || !settings.value.danmakuEnabled) return;

      // 计算"等待剩余弹幕飞完"的时间
      // 每条弹幕有一个 duration（ms），记录它创建时间
      // 但我们没有存 spawnTime，所以用 duration 的最大值近似估算剩余时间
      let maxRemaining = 0;
      const now = Date.now();
      for (const item of danmakuItems.value) {
        // 粗略估算：剩余时间 ≈ duration × 0.7（已经飞过约 30%）
        // 没有更精确的方式但足够避免粗暴裁断
        const remaining = Math.max(0, (item.duration || 0) * 0.7);
        if (remaining > maxRemaining) maxRemaining = remaining;
      }

      // 用户设置的循环时长即新一轮开始的"最早"时间；
      // 如果有弹幕在飞，则延后到所有弹幕飞完
      const startNewRound = () => {
        danmakuItems.value = [];
        initTracks();
        const shuffledTexts = shuffleArray(texts);
        scheduleDanmakuBatch(shuffledTexts, trackCount);
        scheduleDanmakuLoop(shuffledTexts, trackCount);
      };

      if (maxRemaining > 1000) {
        // 还有弹幕在飞：延后到飞完再清空
        setTimeout(startNewRound, maxRemaining);
      } else {
        // 没有弹幕在飞（或剩余 < 1 秒）：立即开始新一轮
        startNewRound();
      }
    }, loopDelay);
  }

  /**
   * 移除弹幕
   */
  function removeDanmaku(id: string) {
    danmakuItems.value = danmakuItems.value.filter(d => d.id !== id);
  }

  /**
   * 清空所有弹幕和定时器
   */
  function clearDanmaku() {
    if (danmakuLoopTimer) {
      clearTimeout(danmakuLoopTimer);
      danmakuLoopTimer = null;
    }
    if (danmakuSpawnTimer) {
      clearTimeout(danmakuSpawnTimer);
      danmakuSpawnTimer = null;
    }
    danmakuItems.value = [];
    trackNextAvailableTime.value = [];
    currentFloorDanmaku.value = [];
  }

  /**
   * 从消息楼层中提取并显示弹幕
   */
  function displayDanmakuFromMessage(message: string) {
    const texts = extractDanmakuBlock(message);
    if (texts.length > 0) {
      pushDanmaku(texts);
    }
  }

  // ====== System chat (contacts + unlock + send) ======

  function selectSystemPersonality(id: string) {
    unlockedPersonalityIds.value.add(id);
    lastActiveUnlockedPersonalityId.value = id;
    activePersonalityId.value = id;
    unreadPersonalityIds.value.delete(id);
  }

  async function sendSystemUserMessage(
    personalityId: string,
    userText: string,
    options?: { context?: string },
  ): Promise<string> {
    if (!unlockedPersonalityIds.value.has(personalityId)) {
      showToast('请先解锁该联系人');
      return '';
    }
    const hist = systemChatHistories.value[personalityId] ?? [];
    if (!systemChatHistories.value[personalityId]) systemChatHistories.value[personalityId] = hist;

    // 情报交换进行中：使用猜谜 API 流程
    if (riddleActive.value && riddlePersonalityId.value === personalityId) {
      if (riddleAnswerContains(userText)) {
        showToast('输入中包含谜底，已拦截');
        return '';
      }
      const ok = addRiddleUserMessage(userText);
      if (!ok) {
        showToast('输入中包含谜底，已拦截');
        return '';
      }

      // 始终插在“结束线”之前
      const pendingIdx = hist.findLastIndex(m => m.role === 'riddle_end_pending');
      if (pendingIdx >= 0) hist.splice(pendingIdx, 0, { role: 'user', text: userText });
      else hist.push({ role: 'user', text: userText });

      try {
        const result = await requestRiddleAiReply();
        const pendingIdx2 = hist.findLastIndex(m => m.role === 'riddle_end_pending');
        if (pendingIdx2 >= 0) hist.splice(pendingIdx2, 0, { role: 'assistant', text: result.reply });
        else hist.push({ role: 'assistant', text: result.reply });

        if (result.won) {
          // 将结束线由 pending -> end
          const idx = hist.findLastIndex(m => m.role === 'riddle_end_pending');
          if (idx >= 0) hist[idx] = { role: 'riddle_end', text: '' };
          // 在猜谜结束后追加一条分割线，与下一段普通聊天分隔
          hist.splice(idx + 1, 0, { role: 'riddle_divider', text: '' });
          const personality = SYSTEM_PERSONALITIES.find(p => p.id === personalityId);
          showToast(`[ ${personality?.name ?? '系统'} ] 猜谜结束，获得 ${result.reward}G`);
        }

        if (activePersonalityId.value !== personalityId) {
          unreadPersonalityIds.value.add(personalityId);
        }
        return result.reply;
      } catch {
        return '';
      }
    }

    // 普通末世通讯流程
    hist.push({ role: 'user', text: userText });
    const personality = SYSTEM_PERSONALITIES.find(p => p.id === personalityId);

    const historyPrompts = hist.slice(0, -1).reduce<{ role: 'assistant' | 'user'; content: string }[]>((acc, m) => {
      if (m.role === 'user') acc.push({ role: 'user', content: m.text });
      else if (m.role === 'assistant' || m.role === 'proactive') acc.push({ role: 'assistant', content: m.text });
      return acc;
    }, []);

    lastSystemPrompts.value = [
      { role: 'system', content: personality?.systemPrompt ?? '你是一个助手。' },
      ...historyPrompts,
    ];
    try {
      const reply = (await callSecondApi({
        task: 'system',
        personalityId,
        manualHistory: historyPrompts,
        userInput: userText,
        context: options?.context,
      })) as string;
      if (!reply) {
        const model = settings.value.secondApiModel?.trim();
        if (!model) {
          showToast('第二 API 返回空回复：未选择模型，请在设置中拉取并选择模型');
        } else {
          showToast(`第二 API 返回空回复：请检查模型「${model}」是否可用`);
        }
        hist.push({ role: 'assistant', text: '(无回复，请检查第二 API 配置)' });
        return '';
      }
      hist.push({ role: 'assistant', text: reply });
      if (activePersonalityId.value !== personalityId) {
        unreadPersonalityIds.value.add(personalityId);
      }
      const fromName = personality?.name ?? '系统';
      showToast(`[ ${fromName} ] 发来回复`);
      return reply;
    } catch {
      return '';
    }
  }

  function addProactiveToSystemChat(text: string) {
    const id = lastActiveUnlockedPersonalityId.value;
    if (!id) return;
    const hist = systemChatHistories.value[id] ?? [];
    if (!systemChatHistories.value[id]) systemChatHistories.value[id] = hist;
    hist.push({ role: 'proactive', text });
    const p = SYSTEM_PERSONALITIES.find(x => x.id === id);
    const fromName = p?.name ?? '系统';
    showToast(`[ ${fromName} ] 发来消息`);
  }

  function insertChatDivider(personalityId: string) {
    const hist = systemChatHistories.value[personalityId] ?? [];
    if (!systemChatHistories.value[personalityId]) systemChatHistories.value[personalityId] = hist;
    // 如果末尾已经是分割线则不重复插入
    if (hist.length > 0 && hist[hist.length - 1].role === 'divider') return;
    hist.push({ role: 'divider', text: '' });
  }

  function clearHistoryBeforeDivider(personalityId: string) {
    const hist = systemChatHistories.value[personalityId];
    if (!hist) return;
    const dividerIdx = hist.findLastIndex(
      m =>
        m.role === 'divider' || m.role === 'riddle_start' || m.role === 'riddle_end_pending' || m.role === 'riddle_end',
    );
    if (dividerIdx === -1) {
      systemChatHistories.value[personalityId] = [];
      return;
    }

    // 若清理到了进行中的猜谜，强制结束并不结算
    const remain = hist.slice(dividerIdx + 1);
    const removingRiddle = hist
      .slice(0, dividerIdx + 1)
      .some(m => m.role === 'riddle_start' || m.role === 'riddle_end_pending' || m.role === 'riddle_end');
    if (removingRiddle && riddlePersonalityId.value === personalityId) {
      riddleActive.value = false;
      riddleChatHistory.value = [];
      riddleStartTime.value = null;
      riddlePersonalityId.value = null;
    }

    systemChatHistories.value[personalityId] = remain;
  }

  type ProactiveEventKey = keyof NonNullable<SystemPersonality['proactiveLines']>;
  function triggerProactive(event: ProactiveEventKey) {
    const id = lastActiveUnlockedPersonalityId.value;
    if (!id) return;
    const p = SYSTEM_PERSONALITIES.find(x => x.id === id);
    const lines = p?.proactiveLines?.[event];
    if (lines?.length) addProactiveToSystemChat(lines[Math.floor(Math.random() * lines.length)]!);
  }

  // ====== UI Actions ======

  function setOverlay(panel: OverlayPanel) {
    const wasHistory = activeOverlay.value === 'history';
    activeOverlay.value = panel;
    leftMenuExpanded.value = false;
    rightMenuExpanded.value = false;

    if (panel === 'history' && !wasHistory) {
      // 打开历史面板：
      // 1) 优先把光标定位到「玩家当前正在观看的楼层」；找不到（如还没初始化）则用最新的可见楼层。
      // 2) 预解析当前楼层附近的 ±2 层，避免面板打开时出现「暂无对话记录」的空白闪烁。
      const fallbackDisplayIdx = Math.max(0, visibleFloorIndices.value.length - 1);
      const startDisplayIdx =
        currentDisplayFloorIndex.value >= 0 ? currentDisplayFloorIndex.value : fallbackDisplayIdx;
      enterHistoryBrowse(startDisplayIdx);

      const previewPhysical = displayToPhysicalIndex(startDisplayIdx);
      preRenderFloors(previewPhysical);
    } else if (wasHistory && panel !== 'history') {
      exitHistoryBrowse();
    }
  }

  function toggleLeftMenu() {
    leftMenuExpanded.value = !leftMenuExpanded.value;
    rightMenuExpanded.value = false;
  }
  function toggleRightMenu() {
    rightMenuExpanded.value = !rightMenuExpanded.value;
    leftMenuExpanded.value = false;
  }
  function selectChoice(id: string | null) {
    selectedChoiceId.value = id;
  }
  function lockChoice() {
    choiceLocked.value = true;
  }

  function setTempOptions(options: Choice[]) {
    tempOptions.value = options;
  }
  function clearChoices() {
    selectedChoiceId.value = null;
    choiceLocked.value = false;
    customInputText.value = '';
    tempOptions.value = []; // Clear temp options when clearing choices
  }

  function updateSettings(partial: Partial<z.infer<typeof VNSettings>>) {
    vnLog.info('action', 'updateSettings', { keys: Object.keys(partial) });
    Object.assign(settings.value, partial);
    // 弹幕设置变化时，通知弹幕重新渲染
    const danmakuSettings = [
      'danmakuSpeed',
      'danmakuLoop',
      'danmakuLoopDuration',
      'danmakuDisplay',
      'danmakuColor',
      'danmakuFontSize',
      'danmakuOpacity',
    ];
    if (Object.keys(partial).some(key => danmakuSettings.includes(key))) {
      notifyDanmakuSettingsChanged();
    }
  }

  function updateUserCharacter(partial: Partial<UserCharacter>) {
    Object.assign(userCharacter.value, partial);
    if (userCharacter.value.avatarDisplayMode === 'avatar' && !userCharacter.value.avatarUrl) {
      userCharacter.value.avatarDisplayMode = 'off';
    }
    if (userCharacter.value.avatarDisplayMode === 'sprite') {
      userCharacter.value.showSprite = !!userCharacter.value.avatarUrl;
    }
  }

  function showToast(msg: string) {
    toastMessage.value = msg;
    toastVisible.value = true;
    setTimeout(() => {
      toastVisible.value = false;
    }, 3000);
  }

  // Legacy compatibility: parseCurrentMessage delegates to parseCurrentFloor on last unit
  async function parseCurrentMessage(message: string) {
    const lastIdx = dialogues.value.length - 1;
    if (lastIdx >= 0 && dialogues.value[lastIdx]) {
      dialogues.value[lastIdx].message = message;
      dialogues.value[lastIdx].parsed = false;
      await parseCurrentFloor(lastIdx);
    }
  }

  // Legacy compatibility: nextDialogue delegates to navigateBlock(1)
  function nextDialogue() {
    navigateBlock(1);
  }

  // Legacy compatibility: prevDialogue delegates to navigateBlock(-1)
  function prevDialogue() {
    navigateBlock(-1);
  }

  return {
    activeOverlay,
    leftMenuExpanded,
    rightMenuExpanded,
    activeModuleId,
    selectedChoiceId,
    choiceLocked,
    customInputText,
    toastMessage,
    toastVisible,
    settings,
    currentTheme,
    getComponentSkinForCurrent,
    gameData,
    gold,
    inventory,
    transactionLog,
    workshopLevel,
    changeGold,
    clearTransactionLog,
    addInventoryItem,
    secondApiStatus,
    secondApiModelList,
    secondApiModelListLoading,
    fetchSecondApiModelList,
    testSecondApiConnection,
    setSecondApiDegraded,
    clearSecondApiDegraded,
    callSecondApi,
    buildSecondApiContext,
    triggerDanmakuForMessage,
    imageApiStatus,
    stageBackgroundImage,
    stageCgImage,
    imageGenerating,
    imageCardQueue,
    setupImageGenListener,
    requestBackgroundImage,
    requestCgImage,
    switchToImageCard,
    clearImageCardQueue,
    isCardBound,
    getBoundSceneTitle,
    retryImageCard,
    getActiveImageRequest,
    // Image tag parsing & scene bindings
    currentImageTitle,
    currentImageType,
    processImageTagBlocks,
    reparseImageTagsFromMessage,
    getCurrentDisplayBackground,
    getCurrentDisplayCg,
    // Retry panel
    retryPanelOpen,
    albumPanelOpen,
    openAlbumPanel,
    closeAlbumPanel,
    retryMode,
    retryActiveTab,
    retryGeneratedImages,
    retrySelectedIndices,
    lastRetryPrompt,
    openRetryPanel,
    addRetryImageRequest,
    toggleRetryImageSelection,
    clearRetrySelection,
    confirmRetryImages,
    closeRetryPanel,
    setRetryActiveTab,
    importImageToRetry,
    updateRetryImageTitle,
    replaceRetryImageData,
    getBindingAlbum,
    insertBindingToQueue,
    bindSceneImage,
    replaceSceneImageBinding,
    unbindSceneImage,
    getSceneBindings,
    getModuleLockReason,
    userCharacter,
    characterRoster,
    gameModules,
    // Message parsing (dialogues)
    dialogues,
    currentBlockFlatIndex,
    previewDialogueIndex,
    navigateBlock,
    navigateFloorTo,
    allBlocksFlat,
    enterHistoryBrowse,
    exitHistoryBrowse,
    navigateToHistoryPreview,
    historyPreviewFloorIndex,
    historyPreviewBlockIndex,
    visibleFloorIndices,
    currentDisplayFloorIndex,
    physicalToDisplayIndex,
    displayToPhysicalIndex,
    preRenderFloors,
    currentFloorIndex,
    currentBlockInnerIndex,
    getVisibleBlockCountInFloor,
    getCurrentBlockInnerIndex,
    getTotalBlocksInFloor,
    loadAllDialogues,
    appendNewMessage,
    updateDialogueUnit,
    removeDialogueUnit,
    parseCurrentFloor,
    currentDanmaku,
    currentImageTags,
    // Current block (flat computed)
    currentBlock,
    // Current floor index
    currentDialogueIndex: currentFloorIndex,
    // Current block index within floor (for backward compat)
    currentBlockIndex: currentBlockInnerIndex,
    // Legacy
    currentScene,
    parseCurrentMessage,
    nextDialogue,
    prevDialogue,
    // Workshop & Stock
    workshopProducing,
    workshopCharacterId,
    workshopStartTime,
    workshopAccumulated,
    startProduction,
    pauseProduction,
    resumeProduction,
    stopProductionAndSettle,
    upgradeWorkshop,
    stockPrice,
    stockHistory,
    stockPosition,
    stockInvested,
    stockPaused,
    stockActive,
    stockLastDirection,
    enterStockMarket,
    exitStockMarket,
    stockBuy,
    stockSell,
    startStockTicker,
    stopStockTicker,
    doStockTick,
    resetStock,
    toggleStockPause,
    puzzle2048Active,
    puzzle2048Tiles,
    puzzle2048Score,
    puzzle2048BestScore,
    puzzle2048Size,
    puzzle2048GameOver,
    puzzle2048Won,
    puzzle2048WonAcknowledged,
    start2048,
    autoStart2048,
    move2048Action,
    settle2048,
    save2048,
    acknowledge2048Win,
    riddleActive,
    riddleAnswer,
    riddleChatHistory,
    riddleRounds,
    riddlePersonalityId,
    startRiddle,
    normalizeForAnswer,
    riddleAnswerContains,
    addRiddleUserMessage,
    addRiddleAiReply,
    requestRiddleAiReply,
    bootstrapRiddleFirstReply,
    abortRiddleByUser,
    endRiddle,
    shopItems,
    shopRefreshing,
    refreshShop,
    purchaseShopItem,
    generateBoardGameEventPool,
    danmakuItems,
    notifyDanmakuSettingsChanged,
    pushDanmaku,
    removeDanmaku,
    clearDanmaku,
    displayDanmakuFromMessage,
    SYSTEM_PERSONALITIES,
    systemChatOpen,
    activePersonalityId,
    systemChatHistories,
    unlockedPersonalityIds,
    unreadPersonalityIds,
    lastActiveUnlockedPersonalityId,
    selectSystemPersonality,
    sendSystemUserMessage,
    lastSystemPrompts,
    addProactiveToSystemChat,
    triggerProactive,
    insertChatDivider,
    clearHistoryBeforeDivider,
    setOverlay,
    toggleLeftMenu,
    toggleRightMenu,
    selectChoice,
    lockChoice,
    clearChoices,
    setTempOptions,
    tempOptions,
    updateSettings,
    updateUserCharacter,
    showToast,
    // Second API generations
    secondApiGenerations,
    // Worldbook management
    getAllCurrentWorldbookNames,
    getEnhancedWorldbook,
    updateWorldbookEntry,
    updateWorldbookAutoControl,
    // Character system
    roleMaxId,
    roles,
    skillsInventory,
    skillMaxId,
    skillDbMap,
    dispatchRuns,
    getRole,
    getRoleByName,
    getAllRoles,
    addRole,
    updateRole,
    deleteRole,
    appendRoleLog,
    scanDispatch,
    equipSkill,
    unequipSkill,
    getSkill,
    getSkillByName,
    getAllSkills,
    addSkill,
    deleteSkill,
    appendDispatchRun,
    getAvailableRoles,
    syncRolesFromScanner,
    // Dispatch system
    dispatchActive,
    dispatchMapConfig,
    dispatchEventPool,
    isDispatchRunning,
    startDispatch,
    endDispatch,
    getDispatchActive,
    cancelDispatch,
    modifyDispatchHp,
    modifyDispatchSanity,
    triggerDispatchEvent,
    generateDispatchStory,
    // Workshop v2
    workshopLogs,
    generateWorkshopOrder,
    getWorkshopSkillCost,
    purchaseSkill,
    addWorkshopLog,
    getWorkshopStats,
    // MVU 楼层变量写入
    writeMvuMessageField,
  };
});
