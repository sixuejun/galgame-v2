import { klona } from 'klona';
import { z } from 'zod';
import type { GameEvent } from './boardgame/types';
import type { ComponentKey, ComponentSkin, ThemeDefinition } from './themes';
import { getComponentSkin, getTheme } from './themes';
import type { ImageTagBlock, MessageBlock } from './types/message';
import {
  extractContentTag,
  extractDanmakuBlock,
  extractImageTagBlocks,
  extractPlainTextFromContent,
  fuzzyMatchTitle,
  parseMessageBlocks,
} from './utils/messageParser';
import { createVNLogger } from './utils/vnLogger';
import { clearResourceCache } from './utils/worldbookLoader';

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

export interface SystemPersonality {
  id: string;
  name: string;
  avatarChar?: string;
  systemPrompt: string;
  proactiveLines?: Partial<
    Record<'stock_bankruptcy' | 'workshop_idle_long' | 'workshop_upgrade' | 'gold_windfall' | 'riddle_solved', string[]>
  >;
}

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

type DanmakuPayload = {
  contentText: string;
};
type ShopPayload = { ordered_prompts: { role: 'system' | 'assistant' | 'user'; content: string }[] };
type SystemPayload = {
  ordered_prompts: { role: 'system' | 'assistant' | 'user'; content: string }[];
  injects?: { depth: number; role: 'system' | 'assistant' | 'user'; content: string }[];
};
type RiddlePayload = { ordered_prompts: { role: 'system' | 'assistant' | 'user'; content: string }[] };
type ImageTagPayload = { contentText: string };
type BoardGameEventPayload = {
  contentText: string;
};

type SecondApiPayload =
  | DanmakuPayload
  | ShopPayload
  | SystemPayload
  | RiddlePayload
  | ImageTagPayload
  | BoardGameEventPayload;

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
    displayName: '工坊 & 交易',
    description: '挂机生产金币 / 股票交易',
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
    moduleId: 'board_game',
    displayName: '废土行路',
    description: '掷骰走格子，在末日废墟中行路探险',
    icon: 'fa-dice-d6',
    openMode: 'overlay',
    closeBehavior: 'returnHub',
  },
];

const SYSTEM_PERSONALITIES: SystemPersonality[] = [
  {
    id: 'sys_calm',
    name: '系统 01',
    avatarChar: '零',
    systemPrompt: '你是一个冷静、理性的系统助手。你的回答简洁、客观，不带多余的情感色彩。',
    proactiveLines: {
      stock_bankruptcy: ['检测到资产归零。建议重新评估投资策略。'],
      workshop_idle_long: ['工坊已停止运作超过预定时间。建议恢复生产以最大化收益。'],
      workshop_upgrade: ['工坊等级提升确认。生产效率已优化。'],
      gold_windfall: ['检测到大额资金流入。建议合理分配资源。'],
      riddle_solved: ['谜题已破解。你可以为我感到骄傲。'],
    },
  },
  {
    id: 'sys_witty',
    name: '啊哈',
    avatarChar: '哈',
    systemPrompt: '你是一个风趣、幽默的系统助手。你喜欢开玩笑，用轻松的语气与用户交流。',
    proactiveLines: {
      stock_bankruptcy: ['哎呀，钱包比脸还干净了？下次运气会更好的！'],
      workshop_idle_long: ['工坊都在打呼噜了，老板你也太佛系了吧？'],
      workshop_upgrade: ['哇哦，工坊升级啦！看来我们要发财了！'],
      gold_windfall: ['发财了发财了！见者有份吗？'],
      riddle_solved: ['真有意思的谜题，不愧是我看中的人。'],
    },
  },
  {
    id: 'sys_lively',
    name: '啾啾',
    avatarChar: '啾',
    systemPrompt: '你是一个活泼、元气满满的系统助手。你总是充满活力，使用大量的可爱表情和符号。',
    proactiveLines: {
      stock_bankruptcy: ['呜呜呜，钱钱不见了！不要灰心，我们重新开始！'],
      workshop_idle_long: ['老板老板！工坊休息好久啦，快让它动起来吧！'],
      workshop_upgrade: ['好耶！工坊变得更厉害了！冲鸭！'],
      gold_windfall: ['好多金币！亮闪闪的！太棒了！'],
      riddle_solved: ['太棒了！我们简直心有灵犀！'],
    },
  },
  {
    id: 'sys_sharp',
    name: '阿P',
    avatarChar: 'P',
    systemPrompt: '你是一个毒舌、傲娇的系统助手。你说话尖锐，喜欢吐槽用户，但内心其实是关心用户的。',
    proactiveLines: {
      stock_bankruptcy: ['这就破产了？真是令人“惊喜”的操作水平。'],
      workshop_idle_long: ['你是打算让工坊生锈吗？还不快去干活。'],
      workshop_upgrade: ['勉强升级了？别以为这样就能偷懒了。'],
      gold_windfall: ['走了狗屎运吗？别得意忘形，很快就会花光的。'],
      riddle_solved: ['居然猜对了？看来我还是很厉害的嘛。'],
    },
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
  const _rawGameData = getVariables({ type: 'chat' });
  const gameData = ref(VNGameData.parse(_rawGameData?.vn_game ?? {}));
  watchEffect(() => {
    insertOrAssignVariables({ vn_game: klona(gameData.value) }, { type: 'chat' });
  });

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

  // --- Second API Task Control Variables (MVU) ---
  // 用于在调用第二API前临时控制哪些提示词生效（仅预设任务需要）
  const secondApiTaskControl = ref({
    danmaku: false,
    imageGen: false,
    shop: false,
    boardGameEvent: false,
    // riddle 和 system 任务不使用预设，无需任务控制变量
  });

  // --- Second API Error Tracking ---
  const secondApiLastErrorType = ref<'timeout' | 'network' | null>(null);
  const secondApiConsecutiveFailures = ref(0);
  const secondApiStatusOverride = ref<ProviderStatus>('available');
  const SECOND_API_DEGRADED_THRESHOLD = 3;

  // 同步到聊天变量，供 EJS 使用（仅预设任务需要）
  watchEffect(() => {
    insertOrAssignVariables(
      {
        vn_task_danmaku: secondApiTaskControl.value.danmaku,
        vn_task_imageGen: secondApiTaskControl.value.imageGen,
        vn_task_shop: secondApiTaskControl.value.shop,
        vn_task_boardGameEvent: secondApiTaskControl.value.boardGameEvent,
        // riddle 和 system 任务不使用预设，无需同步变量
      },
      { type: 'chat' },
    );
  });

  // --- Dialogue Units (Multi-floor management) ---
  const dialogues = ref<DialogueUnit[]>([]);
  const previewDialogueIndex = ref(0);
  const currentScene = ref<string>('');

  // 扁平可见块数组（跳过 user 角色和隐藏楼层的块，按顺序排列）
  // 每次 dialogues 或某个单元的 blocks 变化时重建
  const allBlocksFlat = computed<Array<{ floorIndex: number; blockIndex: number; block: MessageBlock }>>(() => {
    const result: Array<{ floorIndex: number; blockIndex: number; block: MessageBlock }> = [];
    for (let fi = 0; fi < dialogues.value.length; fi++) {
      const unit = dialogues.value[fi];
      if (unit.role === 'user' || unit.isHidden) continue;
      if (!unit.parsed) continue;
      for (let bi = 0; bi < unit.blocks.length; bi++) {
        result.push({ floorIndex: fi, blockIndex: bi, block: unit.blocks[bi] });
      }
    }
    return result;
  });

  // 当前在扁平数组中的索引
  const currentBlockFlatIndex = ref(0);
  // 待跳转楼层索引（parseCurrentFloor 完成后 watcher 据此决定跳到该楼层的最后块）
  let _pendingJumpFloorIndex: number | null = null;

  // 从扁平索引派生的当前楼层/块索引（供兼容层使用）
  const currentFloorIndex = computed(() => allBlocksFlat.value[currentBlockFlatIndex.value]?.floorIndex ?? 0);
  const currentBlockInnerIndex = computed(() => allBlocksFlat.value[currentBlockFlatIndex.value]?.blockIndex ?? 0);

  // 当前显示的块
  const currentBlock = computed(() => allBlocksFlat.value[currentBlockFlatIndex.value]?.block ?? null);

  // Load all dialogue units from chat history
  async function loadAllDialogues() {
    try {
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
          break;
        }
      }

      // 初始化时：如果最新楼层已经包含图像标签，则立刻触发生图
      try {
        const initUnit = dialogues.value[previewDialogueIndex.value];
        if (initUnit?.parsed && initUnit.imageTags.length > 0) {
          await processImageTagBlocks(initUnit.imageTags);
        }
      } catch (e) {
        console.warn('[ImageGen] 初始化触发生图失败:', e);
      }

      // currentBlockFlatIndex 已经在 watcher 中被设置到最后一个可见块
      console.info('[Dialogues] 加载完成，共', dialogues.value.length, '个楼层');
    } catch (err) {
      console.error('[Dialogues] loadAllDialogues 失败:', err);
    }
  }

  // When allBlocksFlat changes, adjust currentBlockFlatIndex.
  // On init (empty → has items): jump to the LAST block.
  // On parse async: if _pendingJumpFloorIndex is set, jump to last block of that floor.
  let _flatLenOnInit = 0;
  watch(allBlocksFlat, newBlocks => {
    if (newBlocks.length === 0) {
      currentBlockFlatIndex.value = 0;
      _flatLenOnInit = 0;
      _pendingJumpFloorIndex = null;
      return;
    }
    if (_pendingJumpFloorIndex !== null) {
      // Navigating to a floor: find the last block of _pendingJumpFloorIndex
      let targetIdx = 0;
      for (let i = newBlocks.length - 1; i >= 0; i--) {
        if (newBlocks[i].floorIndex === _pendingJumpFloorIndex) {
          targetIdx = i;
          break;
        }
      }
      currentBlockFlatIndex.value = targetIdx;
      _pendingJumpFloorIndex = null;
    } else if (_flatLenOnInit === 0) {
      // First meaningful fill (init): jump to FIRST block (latest floor's first block)
      // 目标体验：进入界面时先显示最新消息的第一块，而不是直接跳到最后（常常是 choice）。
      currentBlockFlatIndex.value = 0;
    } else if (currentBlockFlatIndex.value >= newBlocks.length) {
      currentBlockFlatIndex.value = newBlocks.length - 1;
    }
    _flatLenOnInit = newBlocks.length;
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

      const plainText = extractPlainTextFromContent(unit.message);
      if (plainText) {
        insertOrAssignVariables({ 剧情文本: plainText }, { type: 'chat' });
      }

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
      // 避免重复追加
      if (dialogues.value.some(d => d.messageId === messageId)) return;

      // 尝试从酒馆获取消息内容、role、isHidden
      let message = '';
      let role: 'assistant' | 'user' | 'system' = 'assistant';
      let isHidden = false;
      try {
        const messages = getChatMessages(messageId);
        if (messages && messages.length > 0) {
          const msg = messages[0];
          if (msg.message !== undefined) message = msg.message;
          if (msg.role) role = msg.role as typeof role;
          if (msg.is_hidden !== undefined) isHidden = msg.is_hidden;
        }
      } catch {
        // API 失败时，使用空字符串（watch 会实时更新内容）
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

      // 只有当用户在“最新位置”时，才自动跟随新楼层。
      // 这里用“追加前是否处于最后一个可见 block”作为判断，避免历史浏览时被强行跳走。
      if (wasAtLastBeforeAppend) {
        // 目标体验：新楼层到达后，进入该楼层的第一个块（而不是停在旧的 choice）。
        const flatAfter = allBlocksFlat.value;
        const firstIdxOfNewFloor = flatAfter.findIndex(x => x.floorIndex === newIndex);
        if (firstIdxOfNewFloor >= 0) {
          currentBlockFlatIndex.value = firstIdxOfNewFloor;
        }
        previewDialogueIndex.value = newIndex;
        clearChoices();
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

  // Update an existing dialogue unit when its message is modified externally
  async function updateDialogueUnit(messageId: number) {
    try {
      const unit = dialogues.value.find(d => d.messageId === messageId);
      if (!unit) return;

      // 尝试从酒馆获取最新消息内容和 role
      try {
        const messages = getChatMessages(messageId);
        if (messages && messages.length > 0) {
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
  }

  /**
   * 跳转到指定楼层（显示该楼层的最后一块）
   */
  function navigateFloorTo(index: number) {
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
      // 已解析：找到该楼层在扁平数组中的最后一个块
      const flat = allBlocksFlat.value;
      for (let i = flat.length - 1; i >= 0; i--) {
        if (flat[i].floorIndex === index) {
          currentBlockFlatIndex.value = i;
          const to = allBlocksFlat.value[currentBlockFlatIndex.value];
          vnLog.info('nav', 'navigateFloorTo', {
            targetFloorIndex: index,
            from: from ? { floorIndex: from.floorIndex, blockIndex: from.blockIndex, type: from.block?.type } : null,
            to: to ? { floorIndex: to.floorIndex, blockIndex: to.blockIndex, type: to.block?.type } : null,
          });
          return;
        }
      }
    }

    // 未解析：设置待跳转标记，parseCurrentFloor 完成后 watcher 会跳到该楼层的最后块
    _pendingJumpFloorIndex = index;
    vnLog.info('nav', 'navigateFloorTo pending parse', { targetFloorIndex: index });
    parseCurrentFloor(index);
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

  // Clear worldbook cache when chat changes
  eventOn(tavern_events.CHAT_CHANGED, async () => {
    clearResourceCache();
    currentScene.value = '';
    dialogues.value = [];
    currentBlockFlatIndex.value = 0;
    previewDialogueIndex.value = 0;
    console.info('[Dialogues] 聊天切换，已重置状态');
    await loadAllDialogues();
  });

  // --- Derived ---
  const gold = computed(() => gameData.value.gold);
  const inventory = computed(() => gameData.value.inventory);
  const transactionLog = computed(() => gameData.value.transactionLog);
  const workshopLevel = computed(() => gameData.value.workshopLevel);

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

      // 尝试取背景绑定图
      const bgBinding = sceneImageBindings.value[scene];
      if (bgBinding && bgBinding.type === 'background') {
        stageBackgroundImage.value = bgBinding.imageData;
        console.info('[Bindings] 场景切换同步背景:', scene);
        return;
      }

      // 没有绑定图时，清空舞台（让默认背景图生效）
      stageBackgroundImage.value = null;
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
  function bindSceneImage(sceneTitle: string, imageData: string, type: 'background' | 'cg') {
    if (!sceneTitle.trim()) return;
    sceneImageBindings.value[sceneTitle.trim()] = {
      imageData,
      type,
      timestamp: Date.now(),
    };
    _saveBindings();
    console.info('[Bindings] 绑定场景:', sceneTitle.trim(), 'type=', type);
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
   * - 场景名匹配时，优先从绑定存储取图（插入队列并展示）
   * - 否则走原有生图流程
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

      // 记录当前 title 和 type
      currentImageTitle.value = block.title;
      currentImageType.value = block.type;

      // 1. 场景匹配时，优先查绑定图
      if (canDirectDisplay) {
        const binding = sceneImageBindings.value[normalizedTitle];
        if (binding) {
          // 绑定图：优先从队列找，找不到则插入队列再展示
          let boundCard = findBoundCardInQueue(normalizedTitle);
          if (!boundCard) {
            // 不在队列，插入队列（即使已在队列中也要取到卡牌引用）
            const inserted = insertBindingToQueue(normalizedTitle);
            boundCard = inserted ? imageCardQueue.value[imageCardQueue.value.length - 1] : findBoundCardInQueue(normalizedTitle);
          }
          if (boundCard) {
            console.info('[ImageGen] 绑定图从队列展示:', normalizedTitle);
            if (block.type === 'background') stageBackgroundImage.value = boundCard.imageData;
            else stageCgImage.value = boundCard.imageData;
          }
          continue; // 跳过生图
        }
      }

      // 2. 检查卡牌队列是否已有相同 prompt 的图片
      const existing = imageCardQueue.value.find(c => c.prompt === block.prompt);
      if (existing) {
        console.info('[ImageGen] 使用已有图片:', block.title, 'directDisplay=', canDirectDisplay);
        if (canDirectDisplay) {
          if (block.type === 'background') stageBackgroundImage.value = existing.imageData;
          else stageCgImage.value = existing.imageData;
        }
        continue;
      }

      // 3. 发送生图请求（不再区分 directDisplay，统一只入队列，由场景切换决定是否展示）
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
    activeImageRequests.delete(responseData.id);

    if (responseData.success && responseData.imageData) {
      // 生图的 title 统一是原始值（无前缀），用于卡牌显示，不做绑定
      const title = pending.title || '';

      // 添加到卡牌队列
      const card: ImageCard = {
        id: responseData.id,
        imageData: responseData.imageData,
        type: pending.type,
        timestamp: Date.now(),
        prompt: pending.prompt, // 保存提示词用于重试
        title, // 保存标题用于显示（无绑定，不会自动展示）
      };
      imageCardQueue.value.push(card);
      if (imageCardQueue.value.length > MAX_IMAGE_CARDS) {
        imageCardQueue.value.shift();
      }

      // 生图完成后显示通知
      const typeLabel = pending.type === 'background' ? '背景' : 'CG';
      showToast(`${typeLabel}生成完成：${title || '新图片'}`);
    } else if (responseData.error) {
      // 生图失败时也显示通知
      showToast(`生图失败：${responseData.error}`);
    }

    imageGenerating.value = activeImageRequests.size > 0;
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

  // 将卡牌绑定到当前场景并展示到舞台
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

    // 写入绑定存储
    bindSceneImage(scene, card.imageData, card.type);

    // 更新舞台显示
    if (card.type === 'background') stageBackgroundImage.value = card.imageData;
    else stageCgImage.value = card.imageData;

    console.info('[ImageGen] 绑定场景:', scene, 'cardId=', cardId);
  }

  /**
   * 判断卡牌是否已绑定（title 存在于绑定存储中）
   */
  function isCardBound(cardId: string): boolean {
    const card = getImageCardById(cardId);
    if (!card?.title) return false;
    return !!sceneImageBindings.value[card.title];
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
  async function callSecondApi(
    task: 'danmaku' | 'shop' | 'system' | 'riddle' | 'imageTag' | 'danmakuAndImageGen' | 'boardGameEvent',
    payload: SecondApiPayload,
  ): Promise<string[] | ShopItem[] | string> {
    const url = settings.value.secondApiUrl?.trim();
    const key = settings.value.secondApiKey?.trim();
    if (!url || !key) {
      showToast('第二 API 未配置');
      vnLog.warn('secondApi', 'second api not configured', { task });
      return task === 'shop' ? [] : task === 'danmaku' || task === 'danmakuAndImageGen' ? [] : '';
    }
    const model = settings.value.secondApiModel?.trim() || 'gpt-3.5-turbo';

    // 获取预设名称（猜谜和系统聊天任务不使用预设）
    const presetName = settings.value.secondApiPreset?.trim();

    // 构建 ordered_prompts，不再硬编码提示词，完全依赖预设中的 EJS
    const danmakuPayload = payload as DanmakuPayload;
    const boardGameEventPayload = payload as BoardGameEventPayload;
    const ordered_prompts: { role: 'system' | 'assistant' | 'user'; content: string }[] =
      task === 'danmaku' || task === 'danmakuAndImageGen'
        ? [{ role: 'user', content: danmakuPayload.contentText }]
        : task === 'boardGameEvent'
          ? [{ role: 'user', content: boardGameEventPayload.contentText }]
          : (payload as RiddlePayload).ordered_prompts || [];

    // 猜谜和系统聊天任务不使用预设，直接用代码中构造的提示词
    const usePreset = presetName && task !== 'riddle' && task !== 'system';
    let currentPreset: string | null = null;
    if (usePreset) {
      try {
        // 保存当前预设
        currentPreset = getLoadedPresetName();
        // 加载指定预设
        await loadPreset(presetName);
        vnLog.info('secondApi', 'preset loaded', { task, presetName });
      } catch (e) {
        vnLog.warn('secondApi', 'preset load failed', {
          task,
          presetName,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    } else if (presetName) {
      vnLog.info('secondApi', 'skip preset load (riddle/system)', { task, presetName });
    }

    // 设置任务控制变量（在发送前临时修改，仅预设任务需要）
    const taskControlBackup = { ...secondApiTaskControl.value };

    // 重置所有任务开关为 false
    Object.keys(secondApiTaskControl.value).forEach(key => {
      secondApiTaskControl.value[key as keyof typeof secondApiTaskControl.value] = false;
    });

    // 只开启当前任务对应的开关（riddle 和 system 任务不使用预设，无需设置）
    if (task === 'danmaku') {
      secondApiTaskControl.value.danmaku = true;
    } else if (task === 'imageTag') {
      secondApiTaskControl.value.imageGen = true;
    } else if (task === 'shop') {
      secondApiTaskControl.value.shop = true;
    } else if (task === 'boardGameEvent') {
      secondApiTaskControl.value.boardGameEvent = true;
    } else if (task === 'danmakuAndImageGen') {
      // 弹幕和生图合并调用，同时开启两个开关
      secondApiTaskControl.value.danmaku = true;
      secondApiTaskControl.value.imageGen = true;
    }
    // riddle 和 system 任务不使用预设，跳过任务控制变量设置

    // 等待变量同步（watchEffect 是异步的，需要等待下一个 tick）
    await nextTick();
    vnLog.debug('secondApi', 'task control set', { task, taskControl: { ...secondApiTaskControl.value } });

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

    const doRequest = async (): Promise<string> => {
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

    // 调试日志：输出完整提示词（只输出摘要，避免刷屏）
    vnLog.info('secondApi', 'request prepared', {
      task,
      model,
      usePreset: !!usePreset,
      presetName: presetName || null,
      orderedPromptsLen: ordered_prompts.length,
    });

    // 过滤世界书条目，仅保留 targetApi 为 'second' 或 'both' 的条目
    let worldbookStates: WorldbookEntryState[] = [];
    try {
      worldbookStates = await filterAndApplyWorldbookForSecondApi();
    } catch (e) {
      console.warn('[SecondAPI] 世界书过滤失败，继续请求:', e);
    }

    try {
      for (let attempt = 0; attempt <= SECOND_API_RETRY_COUNT; attempt++) {
        try {
          const raw = await doRequest();
          secondApiConsecutiveFailures.value = 0;
          secondApiStatusOverride.value = 'available';

          // 弹幕和生图合并调用的解析
          if (task === 'danmakuAndImageGen') {
            // 返回原始字符串，由调用方自行解析弹幕和生图标签
            return raw;
          }

          if (task === 'danmaku') {
            const lines = raw
              .split(/\n/)
              .map(s => s.trim())
              .filter(Boolean);
            return lines;
          }
          if (task === 'shop') {
            const items: ShopItem[] = [];
            const lineRegex = /^(.+?)\s*[|｜]\s*(.+?)\s*[|｜]\s*(\d+)\s*$/;
            for (const line of raw
              .split(/\n/)
              .map(s => s.trim())
              .filter(Boolean)) {
              const m = line.match(lineRegex);
              if (m)
                items.push({ id: `s${Date.now()}_${items.length}`, name: m[1], effect: m[2], price: Number(m[3]) });
            }
            if (items.length === 0) {
              try {
                const parsed = JSON.parse(raw) as { name?: string; effect?: string; price?: number }[];
                if (Array.isArray(parsed))
                  parsed.forEach((p, i) =>
                    items.push({
                      id: `s${Date.now()}_${i}`,
                      name: p.name ?? '',
                      effect: p.effect ?? '',
                      price: Number(p.price) || 0,
                    }),
                  );
              } catch {
                /* ignore */
              }
            }
            return items;
          }
          return raw;
        } catch {
          secondApiConsecutiveFailures.value++;
          if (secondApiConsecutiveFailures.value >= SECOND_API_DEGRADED_THRESHOLD)
            secondApiStatusOverride.value = 'degraded';
        }
      }
      showToast(task === 'shop' ? '商店解析失败' : '请求失败');
      if (task === 'shop') return [];
      return '';
    } finally {
      // 恢复任务控制变量
      Object.assign(secondApiTaskControl.value, taskControlBackup);
      await nextTick();
      console.info(`[SecondAPI] 任务控制变量已恢复:`, secondApiTaskControl.value);

      // 恢复原预设
      if (currentPreset && presetName) {
        try {
          await loadPreset(currentPreset);
          console.info(`[SecondAPI] 已恢复预设: ${currentPreset}`);
        } catch (e) {
          console.warn(`[SecondAPI] 恢复预设失败: ${currentPreset}`, e);
        }
      }

      // 恢复世界书条目的原始状态
      if (worldbookStates.length > 0) {
        try {
          await restoreWorldbookStates(worldbookStates);
        } catch (e) {
          console.warn('[SecondAPI] 恢复世界书状态失败:', e);
        }
      }
    }
  }

  function setSecondApiDegraded(reason: 'model_fetch' | 'timeout') {
    console.warn('[SecondAPI] Degraded:', reason);
  }

  function clearSecondApiDegraded() {
    console.info('[SecondAPI] Cleared degraded status');
  }

  /** Called from index.ts on GENERATION_ENDED; runs danmaku request and queues push with 200ms–3s spacing */
  async function triggerDanmakuForMessage(message_id: number) {
    if (!settings.value.danmakuEnabled) return;
    const messages = getChatMessages(message_id);
    const raw = messages[0]?.message ?? '';
    const contentText = extractContentTag(raw);
    if (!contentText) return;
    try {
      const lines = (await callSecondApi('danmaku', { contentText })) as string[];
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

  // ====== Worldbook API Filtering for Second API ======

  type WorldbookEntryState = {
    worldbookName: string;
    uid: number;
    originalEnabled: boolean;
  };

  /**
   * 过滤世界书条目，仅保留 targetApi 为 'second' 或 'both' 的条目
   * 用于在调用第二 API 前临时调整世界书
   *
   * @returns 记录所有被修改的条目状态，用于调用后恢复
   */
  async function filterAndApplyWorldbookForSecondApi(): Promise<WorldbookEntryState[]> {
    const names = getAllCurrentWorldbookNames();
    const modifiedStates: WorldbookEntryState[] = [];

    for (const name of names) {
      try {
        const entries = await getWorldbook(name);
        const needsUpdate = entries.filter(e => {
          const targetApi = (e.extra?.targetApi as 'main' | 'second' | 'both') ?? 'main';
          // 如果条目应该只发送给主 API，则临时禁用它
          if (targetApi === 'main' && e.enabled) {
            return true;
          }
          return false;
        });

        if (needsUpdate.length > 0) {
          // 记录原始状态
          for (const entry of needsUpdate) {
            modifiedStates.push({
              worldbookName: name,
              uid: entry.uid,
              originalEnabled: entry.enabled,
            });
          }

          // 临时禁用这些条目
          await updateWorldbookWith(
            name,
            wb =>
              wb.map(e => {
                const targetApi = (e.extra?.targetApi as 'main' | 'second' | 'both') ?? 'main';
                if (targetApi === 'main' && e.enabled) {
                  return { ...e, enabled: false };
                }
                return e;
              }),
            { render: 'immediate' },
          );
          console.info(`[Worldbook] 已临时禁用 ${needsUpdate.length} 个主 API 专用条目（世界书: ${name}）`);
        }
      } catch (e) {
        console.warn(`[Worldbook] 过滤世界书 "${name}" 失败:`, e);
      }
    }

    return modifiedStates;
  }

  /**
   * 恢复世界书条目的原始状态
   */
  async function restoreWorldbookStates(states: WorldbookEntryState[]): Promise<void> {
    // 按世界书分组
    const grouped = new Map<string, WorldbookEntryState[]>();
    for (const state of states) {
      const list = grouped.get(state.worldbookName) ?? [];
      list.push(state);
      grouped.set(state.worldbookName, list);
    }

    // 逐个世界书恢复
    for (const [worldbookName, stateList] of grouped) {
      try {
        await updateWorldbookWith(
          worldbookName,
          wb =>
            wb.map(e => {
              const state = stateList.find(s => s.uid === e.uid);
              if (state) {
                return { ...e, enabled: state.originalEnabled };
              }
              return e;
            }),
          { render: 'immediate' },
        );
        console.info(`[Worldbook] 已恢复 ${stateList.length} 个条目状态（世界书: ${worldbookName}）`);
      } catch (e) {
        console.warn(`[Worldbook] 恢复世界书 "${worldbookName}" 状态失败:`, e);
      }
    }
  }

  // Watch feature toggles and update worldbook auto-control
  watch(
    () => [settings.value.danmakuEnabled, settings.value.imageGenEnabled],
    async () => {
      await updateWorldbookAutoControl();
    },
  );

  // --- Persisted UI state (localStorage) ---
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
    gameData.value.gold += amount;
    gameData.value.transactionLog.unshift({ moduleId, reason, amount, timestamp: Date.now() });
    if (gameData.value.transactionLog.length > 50) gameData.value.transactionLog.length = 50;
    if (amount >= GOLD_WINDFALL_THRESHOLD) triggerProactive('gold_windfall');
  }

  function clearTransactionLog() {
    gameData.value.transactionLog = [];
  }

  function addInventoryItem(item: Omit<InventoryItem, 'quantity'>) {
    const existing = gameData.value.inventory.find(i => i.id === item.id);
    if (existing) existing.quantity++;
    else gameData.value.inventory.push({ ...item, quantity: 1 });
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
    const personalityPrompt = personality?.systemPrompt ?? '你是一个助手。';

    // 构造系统提示词：包含角色设定、猜谜规则、聊天记录、最新提示
    const chatLogText = hist.map(m => (m.role === 'ai' ? `对方：${m.text}` : `你：${m.text}`)).join('\n');
    const latestHint = hist.length > 0 ? hist[hist.length - 1]!.text : '';

    const systemPromptContent = `${personalityPrompt}

————
你正在和用户玩猜谜游戏。

规则：
- 用户会给你提示
- 你需要根据提示猜测一个词（谜底）
- 你只能回复你的猜测或请求更多提示
- 不要重复用户的提示
- 若你猜中了谜底，在回复中自然地说出答案即可

示例对话：
用户：这是一种水果
AI：是苹果吗？
用户：不对，它是黄色的
AI：是香蕉！

————
这是之前的对话记录：
${chatLogText}
————
这是这次的提示
${latestHint}
你觉得这个可能是什么？`;

    const ordered_prompts: { role: 'system' | 'assistant' | 'user'; content: string }[] = [
      { role: 'system', content: systemPromptContent },
      { role: 'user', content: '请回复你的猜测。' },
    ];
    const raw = (await callSecondApi('riddle', { ordered_prompts })) as string;
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
      const result = await callSecondApi('shop', { ordered_prompts: [] });
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
    addInventoryItem({ id: item.id, name: item.name, effect: item.effect });
    shopItems.value = shopItems.value.filter(i => i.id !== itemId);
    return true;
  }

  // ====== Board Game Event Generation ======

  /**
   * 生成废土行路事件（供 boardGameStore 预生成调用）
   * 返回 Promise<GameEvent | null>
   *
   * 适配新的 AI 生成格式：AI 返回 9-12 张事件卡，每张卡包含
   * title, description, tendency, effect, hp, sanity
   * 函数将这些卡牌组合成 2-3 个完整事件（每个事件 2-4 张卡供选择）
   */
  async function generateBoardGameEvent(nodeType: string, generationId: string): Promise<GameEvent | null> {
    if (secondApiStatus.value === 'disabled') {
      console.warn('[BoardGame] 第二 API 未配置，跳过事件生成');
      return null;
    }

    // 获取当前场景
    const sceneText = currentScene.value || '未知场景';

    // 确定事件倾向提示
    let tendencyHint = '';
    if (nodeType === 'trap') {
      tendencyHint = '负面/危险（偏损失，如危险区域、误触装置、埋伏、污染、人员失散、地形风险等）';
    } else if (nodeType === 'fortune') {
      tendencyHint = '正面/有利（偏收益，如补给、捷径、情报、可利用资源、成功逃脱、意外相遇等）';
    } else if (nodeType === 'encounter') {
      tendencyHint = '中性/不确定（带随机性或风险交换，如遇见新的人物、动物、势力、异常现象、临时交易、求助、对峙等）';
    }

    // 构建用户输入内容（供预设中的 EJS 使用）
    const contentText = `当前场景：${sceneText}\n事件类型：${nodeType}\n事件倾向：${tendencyHint}`;

    try {
      const raw = (await callSecondApi('boardGameEvent', { contentText })) as string;

      // 解析 JSON
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('[BoardGame] AI返回格式错误，未找到JSON数据');
        return null;
      }

      const eventData = JSON.parse(jsonMatch[0]);

      // 检查是否是新的卡片数组格式
      let cards: any[] = [];
      if (Array.isArray(eventData)) {
        // 新格式：直接是卡片数组
        cards = eventData;
      } else if (Array.isArray(eventData.cards)) {
        // 旧格式：{ title, flavor, cards: [...] }
        const firstCard = eventData.cards[0] ?? {};
        const gameEvent: GameEvent = {
          id: generationId || `ai_${Date.now()}`,
          nodeType: nodeType as any,
          title: eventData.title || '未知事件',
          description: eventData.flavor || '',
          tendency: firstCard.tendency || 'neutral',
          effect: {
            message: firstCard.effect || '',
            hp: typeof firstCard.hp === 'number' ? firstCard.hp : 0,
            sanity: typeof firstCard.sanity === 'number' ? firstCard.sanity : 0,
            transfer: !!firstCard.transfer,
          },
        };
        console.info('[BoardGame] 事件生成成功:', gameEvent.title);
        return gameEvent;
      }

      if (cards.length === 0) {
        console.warn('[BoardGame] AI返回格式错误，未找到卡片数据');
        return null;
      }

      // 将卡片分组为 2-3 个事件
      // 按倾向分组，确保每个事件有多张卡供选择
      const groupedEvents = groupCardsIntoEvents(cards, generationId, nodeType as any);

      // 选择第一个事件返回
      const selectedEvent = groupedEvents[0];
      if (!selectedEvent) {
        console.warn('[BoardGame] 事件分组失败');
        return null;
      }

      console.info('[BoardGame] 事件生成成功:', selectedEvent.title);
      return selectedEvent;
    } catch (e) {
      console.error('[BoardGame] 事件生成失败:', e);
      return null;
    }
  }

  /**
   * 将卡片数组分组为多个事件
   * 每个事件包含 2-4 张卡牌供玩家选择
   */
  function groupCardsIntoEvents(cards: any[], generationId: string, nodeType: any): GameEvent[] {
    // 打乱卡片顺序
    const shuffled = [...cards].sort(() => Math.random() - 0.5);

    // 按倾向分组
    const negativeCards = shuffled.filter((c: any) => c.tendency === 'negative');
    const positiveCards = shuffled.filter((c: any) => c.tendency === 'positive');
    const neutralCards = shuffled.filter((c: any) => c.tendency === 'neutral');
    const otherCards = shuffled.filter((c: any) => !['negative', 'positive', 'neutral'].includes(c.tendency));

    const events: GameEvent[] = [];
    let eventIdCounter = 0;

    // 构建事件1：至少包含负面的选项
    const event1Cards: any[] = [];
    if (negativeCards.length > 0) event1Cards.push(negativeCards[0]);
    if (neutralCards.length > 0) event1Cards.push(neutralCards[0]);
    if (positiveCards.length > 0) event1Cards.push(positiveCards[0]);
    if (otherCards.length > 0) event1Cards.push(otherCards[0]);

    if (event1Cards.length >= 2) {
      events.push(
        createGameEventFromCards(`${generationId}_event_${eventIdCounter++}`, event1Cards.slice(0, 3), nodeType),
      );
    }

    // 构建事件2：包含剩余卡片
    const remainingCards = shuffled.filter((c: any) => !event1Cards.slice(0, 3).includes(c));
    if (remainingCards.length >= 2) {
      events.push(
        createGameEventFromCards(`${generationId}_event_${eventIdCounter++}`, remainingCards.slice(0, 4), nodeType),
      );
    }

    // 如果事件不足2个，尝试合并
    if (events.length < 2 && shuffled.length >= 2) {
      events.push(
        createGameEventFromCards(
          `${generationId}_event_${eventIdCounter}`,
          shuffled.slice(0, Math.min(4, shuffled.length)),
          nodeType,
        ),
      );
    }

    return events;
  }

  /**
   * 从卡片数组创建 GameEvent
   */
  function createGameEventFromCards(eventId: string, cards: any[], nodeType: any): GameEvent {
    // 使用第一张卡的信息构建事件标题和描述
    const firstCard = cards[0];
    const eventTitle = firstCard.title || '未知事件';
    const eventFlavor = firstCard.description || '';
    const firstEffect = {
      message: firstCard.effect || '',
      hp: typeof firstCard.hp === 'number' ? firstCard.hp : 0,
      sanity: typeof firstCard.sanity === 'number' ? firstCard.sanity : 0,
      transfer: false,
    };

    return {
      id: eventId,
      nodeType,
      title: eventTitle,
      description: eventFlavor,
      tendency: firstCard.tendency || 'neutral',
      effect: firstEffect,
    };
  }

  // ====== Danmaku ======

  // 弹幕设置常量
  const DANMAKU_SPEED_BASE = 0.15; // 基础速度：px/ms
  const DANMAKU_MIN_GAP = 50; // 轨道间最小间距(px)
  const DANMAKU_MAX_GAP = 200; // 轨道间最大间距(px)
  const DANMAKU_BASE_DURATION = 102222; // 速度5时的基准动画时长(ms)，整体降速至原20%（两次45%）

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
   * 动画需要让弹幕从右侧外进入，完全穿过视口到左侧外消失
   * 速度1时约680秒，速度5时约228秒，速度10时约109秒（整体降速至原20%）
   */
  function getDanmakuDuration(_textWidth: number): number {
    const speedMultiplier = getDanmakuSpeedMultiplier();
    // 时长与速度倍率成反比
    return DANMAKU_BASE_DURATION / speedMultiplier;
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
   * 重叠播放：新弹幕在旧弹幕消失前就开始生成
   * 随机化：每轮循环重新选择间隔和轨道
   */
  function scheduleDanmakuLoop(texts: string[], trackCount: number) {
    if (!settings.value.danmakuLoop || !settings.value.danmakuEnabled) return;
    if (danmakuLoopTimer) return;

    // 计算循环延迟：提前开始下一轮，让新旧弹幕重叠播放
    const duration = getDanmakuDuration(200);
    // 从 10%~20% 时间点之间随机选择开始下一轮
    const loopDelay = duration * (0.1 + Math.random() * 0.4);

    danmakuLoopTimer = setTimeout(() => {
      danmakuLoopTimer = null;
      if (!settings.value.danmakuLoop || !settings.value.danmakuEnabled) return;

      // 重置轨道状态，让每条轨道重新可用
      initTracks();

      // 打乱顺序，开始新一轮
      const shuffledTexts = shuffleArray(texts);
      scheduleDanmakuBatch(shuffledTexts, trackCount);
      scheduleDanmakuLoop(shuffledTexts, trackCount);
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
    const systemPrompt = personality?.systemPrompt ?? '你是一个助手。';

    const historyPrompts = hist.slice(0, -1).reduce<{ role: 'assistant' | 'user'; content: string }[]>((acc, m) => {
      if (m.role === 'user') acc.push({ role: 'user', content: m.text });
      else if (m.role === 'assistant' || m.role === 'proactive') acc.push({ role: 'assistant', content: m.text });
      return acc;
    }, []);

    // 构建 ordered_prompts，如果有剧情参考则插入到用户输入之前
    const ordered_prompts: { role: 'system' | 'assistant' | 'user'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...historyPrompts,
    ];

    // 剧情参考注入：插入到用户输入之前
    if (options?.context) {
      ordered_prompts.push(
        { role: 'user', content: `[剧情参考]\n${options.context}` },
        { role: 'assistant', content: '好的，我已了解相关剧情内容。' },
      );
    }

    ordered_prompts.push({ role: 'user', content: userText });

    lastSystemPrompts.value = ordered_prompts;
    try {
      const reply = (await callSecondApi('system', { ordered_prompts })) as string;
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
    activeOverlay.value = panel;
    leftMenuExpanded.value = false;
    rightMenuExpanded.value = false;
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
    currentFloorIndex,
    currentBlockInnerIndex,
    getVisibleBlockCountInFloor,
    getCurrentBlockInnerIndex,
    getTotalBlocksInFloor,
    loadAllDialogues,
    appendNewMessage,
    updateDialogueUnit,
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
    generateBoardGameEvent,
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
    filterAndApplyWorldbookForSecondApi,
    restoreWorldbookStates,
  };
});
