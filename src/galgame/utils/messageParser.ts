import type { ImageTagBlock, MessageBlock, SpriteResource, WorldbookResources } from '../types/message';
import { loadWorldbookResources } from './worldbookLoader';

/**
 * 标准化文本用于模糊匹配
 * 处理 <user> 前缀等特殊标记
 */
function normalizeText(text: string): string {
  return text
    .replace(/^<user>\s*/i, '') // 移除 <user> 前缀
    .replace(/[-/\\_.\s]/g, '') // 去除特殊符号
    .toLowerCase(); // 转小写
}

/**
 * 模糊匹配
 */
function fuzzyMatch(source: string, target: string): boolean {
  const a = normalizeText(source);
  const b = normalizeText(target);
  return a === b || a.includes(b) || b.includes(a);
}

/**
 * 匹配背景资源
 */
function matchBackground(scene: string, resources: WorldbookResources): string | undefined {
  if (!scene) return undefined;

  console.info(`[MessageParser] 尝试匹配背景: "${scene}"`);
  console.info(`[MessageParser] 可用背景数量: ${resources.backgrounds.length}`);

  for (const bg of resources.backgrounds) {
    // 直接匹配名称
    if (fuzzyMatch(bg.name, scene)) {
      console.info(`[MessageParser] 背景匹配成功(name): "${scene}" -> "${bg.name}"`);
      return bg.file;
    }

    // 匹配 textMappings
    if (bg.textMappings) {
      for (const mapping of bg.textMappings) {
        if (fuzzyMatch(mapping, scene)) {
          console.info(`[MessageParser] 背景匹配成功(textMapping): "${scene}" -> "${bg.name}" via "${mapping}"`);
          return bg.file;
        }
      }
    }
  }

  // 打印所有可用背景供调试
  console.warn(
    `[MessageParser] 未找到背景资源: "${scene}", 可用资源:`,
    resources.backgrounds.map(b => ({ name: b.name, textMappings: b.textMappings ?? [] })),
  );
  return undefined;
}

/**
 * 匹配CG资源
 */
function matchCG(cgScene: string, resources: WorldbookResources): string | undefined {
  if (!cgScene) return undefined;

  console.info(`[MessageParser] 尝试匹配CG: "${cgScene}"`);
  console.info(`[MessageParser] 可用CG数量: ${resources.cgs.length}`);

  for (const cg of resources.cgs) {
    // 直接匹配名称
    if (fuzzyMatch(cg.name, cgScene)) {
      console.info(`[MessageParser] CG匹配成功(name): "${cgScene}" -> "${cg.name}"`);
      return cg.file;
    }

    // 匹配 textMappings
    if (cg.textMappings) {
      for (const mapping of cg.textMappings) {
        if (fuzzyMatch(mapping, cgScene)) {
          console.info(`[MessageParser] CG匹配成功(textMapping): "${cgScene}" -> "${cg.name}" via "${mapping}"`);
          return cg.file;
        }
      }
    }
  }

  console.warn(
    `[MessageParser] 未找到CG资源: "${cgScene}", 可用资源:`,
    resources.cgs.map(c => ({ name: c.name, textMappings: c.textMappings ?? [] })),
  );
  return undefined;
}

/**
 * 匹配立绘资源
 * 匹配规则：只使用 textMappings 进行精确规范化匹配（name 字段仅用于显示，不参与匹配）
 */
function findMatchedSprite(character: string, resources: WorldbookResources): SpriteResource | undefined {
  if (!character) return undefined;

  console.info(`[MessageParser] 尝试匹配立绘: "${character}"`);
  console.info(`[MessageParser] 可用立绘数量: ${resources.sprites.length}`);

  // 规范化输入文本
  const normalizedInput = normalizeText(character);

  for (const sprite of resources.sprites) {
    // 只通过 textMappings 精确匹配
    if (sprite.textMappings) {
      for (const mapping of sprite.textMappings) {
        if (normalizeText(mapping) === normalizedInput) {
          console.info(
            `[MessageParser] 立绘匹配成功(textMapping): "${character}" -> "${sprite.name}" via "${mapping}"`,
          );
          return sprite;
        }
      }
    }
  }

  // 打印所有可用立绘供调试
  console.warn(
    `[MessageParser] 未找到立绘资源: "${character}", 可用资源:`,
    resources.sprites.map(s => ({ name: s.name, textMappings: s.textMappings ?? [] })),
  );
  return undefined;
}

function matchSprite(character: string, resources: WorldbookResources): string | undefined {
  return findMatchedSprite(character, resources)?.file;
}

/**
 * 根据匹配到的立绘资源，解析应显示的角色名
 * 约定：name 为显示名；textMappings 仅用于匹配输入文本
 */
function resolveSpriteDisplayName(character: string, resources: WorldbookResources): string {
  const matched = findMatchedSprite(character, resources);
  if (!matched) return character;

  const rawName = (matched.name || '').trim();
  if (!rawName) return character;

  // 兼容现有资源：若 name 为“角色_表情/状态”，显示时仅取角色名
  const displayName = rawName.split(/[_-]/)[0]?.trim();
  return displayName || rawName;
}

/**
 * 匹配嵌套的 [[...]] 块
 * 用于正确处理多行内容的格式块
 * 匹配规则：[[ 开头，对应数量（不嵌套）的 ]] 结尾
 *
 * 分隔符兼容：
 * - 标准：[[type||key：value||key2：value2]]
 * - 容错：AI 可能漏写一个 | 写成 [[type|key：value|key2：value2]]，
 *   此时优先使用 || 作为分隔符；若只有 | 才使用 | 作为分隔符。
 */
function matchBlock(text: string, startIndex: number): { type: string; content: string; endIndex: number } | null {
  // 检查是否以 [[ 开头
  if (text.slice(startIndex, startIndex + 2) !== '[[') return null;

  const afterBrackets = startIndex + 2;

  // 优先找 ||，找不到再找 |（AI 漏写一个 | 的容错）
  const doubleBarIdx = text.indexOf('||', afterBrackets);
  const singleBarIdx = text.indexOf('|', afterBrackets);

  let separatorIdx: number;
  let separatorLen: number;
  if (doubleBarIdx !== -1 && (singleBarIdx === -1 || doubleBarIdx <= singleBarIdx)) {
    separatorIdx = doubleBarIdx;
    separatorLen = 2;
  } else if (singleBarIdx !== -1) {
    separatorIdx = singleBarIdx;
    separatorLen = 1;
  } else {
    return null;
  }

  // 提取 type（在 [[ 和分隔符之间）
  const type = text.slice(afterBrackets, separatorIdx).trim();
  if (!type) return null;

  // 从分隔符之后开始搜索对应的 ]] 结尾
  const contentStart = separatorIdx + separatorLen;
  let depth = 1; // 遇到的第一个 [[ 增加深度，之后的每个 [[ 增加， 每个 ]] 减少
  let i = contentStart;

  while (i < text.length) {
    if (i < text.length - 1) {
      if (text[i] === '[' && text[i + 1] === '[') {
        depth++;
        i += 2;
        continue;
      }
      if (text[i] === ']' && text[i + 1] === ']') {
        depth--;
        if (depth === 0) {
          // 找到匹配的 ]]
          const content = text.slice(contentStart, i);
          return { type, content, endIndex: i + 2 };
        }
        i += 2;
        continue;
      }
    }
    i++;
  }

  // 没有找到匹配的结尾
  return null;
}

/**
 * 匹配所有嵌套的 [[...]] 块（支持多行内容）
 */
function matchAllBlocks(text: string): Array<{ type: string; content: string }> {
  const blocks: Array<{ type: string; content: string }> = [];
  let searchIndex = 0;

  while (searchIndex < text.length) {
    const match = matchBlock(text, searchIndex);
    if (!match) {
      // 不是格式块，跳过一个字符继续搜索
      searchIndex++;
      continue;
    }
    blocks.push({ type: match.type, content: match.content });
    searchIndex = match.endIndex;
  }

  return blocks;
}

/**
 * 解析键值对字符串
 *
 * 支持：
 * - || 分隔多对键值（标准）
 * - | 分隔（AI 漏写一个 | 的容错）—— 当 || 不存在时才用 | 分隔，避免误切值中的 |
 * - 值中包含换行（\\n 会保留为真实换行字符，供块内换行渲染）
 * - 多种冒号变体：英文 :（U+003A）、中文 / 日文 全角 ：（U+FF1A）、
 *   其他常见全角冒号变体（U+FE13 / U+2236 等）
 */
function parsePairs(content: string): { key: string; value: string }[] {
  // 优先按 || 分隔成多段；若只有 1 段（AI 漏写 |），则按 | 分隔
  const doubleSegments = content.split('||');
  const segments = doubleSegments.length > 1 ? doubleSegments : content.split('|');
  const pairs: { key: string; value: string }[] = [];

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    // 在每个 segment 中用冒号分隔键和值
    // 兼容冒号变体：英文 :（U+003A）、全角 ：（U+FF1A，中文/日文）、其他少见变体
    const colonIdx = trimmed.search(/[:：︓∶]/);
    if (colonIdx > 0) {
      const key = trimmed.slice(0, colonIdx).trim();
      // 不 trim value 中的换行符，只去掉首尾空白；并把字面 \\n 转为真实换行
      const value = trimmed.slice(colonIdx + 1).replace(/^\s+/, '').replace(/\s+$/, '').replace(/\\n/g, '\n');
      if (key) {
        pairs.push({ key, value });
      }
    }
  }

  return pairs;
}

/**
 * 标准化块类型字符串以用于模糊匹配
 * 去除非字母数字字符并转小写
 */
function normalizeForBlockTypeMatch(text: string): string {
  return text.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

/**
 * 计算 Levenshtein 编辑距离（越小越相似）
 * 用于容忍 AI 写错的块类型（如 'charcter' / 'narrtion' / 'blakctext'）
 */
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // 单行滚动数组版，空间 O(min(a,b))
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  const m = shorter.length;
  const n = longer.length;

  let prev = new Array<number>(m + 1);
  let curr = new Array<number>(m + 1);
  for (let i = 0; i <= m; i++) prev[i] = i;

  for (let j = 1; j <= n; j++) {
    curr[0] = j;
    for (let i = 1; i <= m; i++) {
      const cost = shorter[i - 1] === longer[j - 1] ? 0 : 1;
      curr[i] = Math.min(
        prev[i] + 1, // 删除
        curr[i - 1] + 1, // 插入
        prev[i - 1] + cost, // 替换
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[m];
}

/**
 * 规范化块类型为标准类型，支持拼写错误容忍
 *
 * 容忍策略：
 * 1. 精确匹配：与已知中英文别名完全一致（不区分大小写）
 * 2. 常见拼写错误查表：内置一组高频 LLM 拼写错误 → 标准类型的映射
 * 3. 模糊匹配：当 (3) 长度差 ≤ 2 且 Levenshtein 距离 ≤ 2 时，认为是该标准类型的拼写错误
 * 4. 兜底：返回原始字符串作为类型
 */
function normalizeBlockType(type: string): MessageBlock['type'] {
  const trimmed = type.trim();
  if (!trimmed) return 'narration';

  const normalized = trimmed.toLowerCase();

  // 1. 精确匹配
  if (['character', '角色', '人物', '对话', '台词'].includes(normalized)) return 'character';
  if (['narration', '旁白', '叙述', '叙述者'].includes(normalized)) return 'narration';
  if (
    ['blacktext', 'black', 'black_screen', 'black-screen', '黑屏', '黑屏文字', '黑幕', '黑幕文字'].includes(normalized)
  ) {
    return 'blacktext';
  }
  if (['choice', 'choices', '选项', '选择', '抉择'].includes(normalized)) return 'choice';
  if (['user', '<user>'].includes(normalized)) return 'user';

  // 2. 常见拼写错误查表（高频 LLM 输出错误）
  const misspellingMap: Record<string, MessageBlock['type']> = {
    // character 常见错误
    charcter: 'character',
    caracter: 'character',
    charecter: 'character',
    charactar: 'character',
    charater: 'character',
    charactor: 'character',
    charectr: 'character',
    chracater: 'character',
    characte: 'character',
    charactr: 'character',
    characterr: 'character',
    charactes: 'character',
    charaterr: 'character',
    charechter: 'character',
    charactrer: 'character',
    charact: 'character',
    chr: 'character',
    chare: 'character',
    dialogue: 'character',
    dialog: 'character',
    speaker: 'character',
    speakers: 'character',
    voice: 'character',
    line: 'character',
    speech: 'character',
    char: 'character',
    chars: 'character',

    // narration 常见错误
    narrtion: 'narration',
    naration: 'narration',
    naratration: 'narration',
    narrration: 'narration',
    narraion: 'narration',
    narratoin: 'narration',
    narative: 'narration',
    naratives: 'narration',
    narrate: 'narration',
    narates: 'narration',
    narrat: 'narration',
    narratn: 'narration',
    nara: 'narration',
    narr: 'narration',
    description: 'narration',
    desc: 'narration',
    narrative: 'narration',
    narrtive: 'narration',

    // blacktext 常见错误
    blakctext: 'blacktext',
    blcktext: 'blacktext',
    balcktext: 'blacktext',
    blacktxt: 'blacktext',
    blactext: 'blacktext',
    blacktex: 'blacktext',
    blackext: 'blacktext',
    blecktext: 'blacktext',
    blackscren: 'blacktext',
    blackcreen: 'blacktext',
    black: 'blacktext',
    bkack: 'blacktext',
    blakc: 'blacktext',
    blck: 'blacktext',

    // choice 常见错误
    choise: 'choice',
    coice: 'choice',
    chose: 'choice',
    chocies: 'choice',
    chioce: 'choice',
    option: 'choice',
    options: 'choice',
    select: 'choice',
  };
  if (misspellingMap[normalized]) return misspellingMap[normalized];

  // 3. 模糊匹配（编辑距离 ≤ 2 且长度差 ≤ 2）
  const cleanInput = normalizeForBlockTypeMatch(normalized);
  if (cleanInput.length >= 3) {
    const candidates: Array<{ name: string; type: MessageBlock['type'] }> = [
      { name: 'character', type: 'character' },
      { name: 'narration', type: 'narration' },
      { name: 'blacktext', type: 'blacktext' },
      { name: 'black', type: 'blacktext' },
      { name: 'choice', type: 'choice' },
      { name: 'choices', type: 'choice' },
    ];
    let bestMatch: { name: string; type: MessageBlock['type']; distance: number } | null = null;
    for (const c of candidates) {
      const lenDiff = Math.abs(cleanInput.length - c.name.length);
      if (lenDiff > 2) continue;
      const distance = levenshteinDistance(cleanInput, c.name);
      if (distance <= 2 && (!bestMatch || distance < bestMatch.distance)) {
        bestMatch = { name: c.name, type: c.type, distance };
      }
    }
    if (bestMatch) {
      console.info(
        `[MessageParser] 模糊匹配块类型: "${type}" -> "${bestMatch.name}" (距离=${bestMatch.distance})`,
      );
      return bestMatch.type;
    }
  }

  // 4. 兜底：原样返回（后续会被识别为无法识别的块并过滤掉）
  return normalized as MessageBlock['type'];
}

/**
 * 文本字段的候选键名（按优先级匹配）
 * - 用于兼容 AI 把台词误输出成"旁白"、把旁白误输出成"台词"等情况
 * - 中文别名 → 英文别名 → 通用字段名（text/line 等）
 */
const NARRATION_TEXT_KEYS = ['旁白', '台词', '叙述', '内容', '文字', 'narration', 'line', 'text', 'description'];
const CHARACTER_TEXT_KEYS = ['台词', '旁白', '对话', '内容', '文字', 'line', 'text', 'speech', 'dialogue'];
const BLACKTEXT_TEXT_KEYS = [
  '黑屏文字',
  '黑屏',
  '黑幕',
  '黑幕文字',
  '台词内容',
  '台词',
  '文字',
  '内容',
  'text',
];

/**
 * 根据键值对数组创建消息块
 */
function createBlock(
  rawType: string,
  pairs: { key: string; value: string }[],
  resources: WorldbookResources,
): MessageBlock {
  const type = normalizeBlockType(rawType);
  const block: MessageBlock = { type };

  if (type === 'character') {
    block.character = pairs.find(p => p.key === '角色名' || p.key === '角色' || p.key === '人物' || p.key === 'name')
      ?.value || '';
    block.scene = pairs.find(p => p.key === '场景')?.value || '';
    block.motion = pairs.find(p => p.key === '动作')?.value || '';
    block.expression = pairs.find(p => p.key === '表情')?.value || '';
    // 台词字段兼容：AI 偶尔会写成"对白/对话/line/speech"等
    block.text =
      pairs.find(p => CHARACTER_TEXT_KEYS.includes(p.key))?.value ||
      '';

    console.info(
      `[MessageParser] 创建 character 块: 角色="${block.character}", 场景="${block.scene}", 台词="${block.text}"`,
    );

    const cgScene = pairs.find(p => p.key === 'CG场景' || p.key === 'CG')?.value || '';
    if (cgScene) {
      block.isCG = true;
      block.cgImageUrl = matchCG(cgScene, resources);
    } else {
      if (block.scene) block.sceneImageUrl = matchBackground(block.scene, resources);
      if (block.character) {
        const originalCharacter = block.character;
        block.spriteImageUrl = matchSprite(originalCharacter, resources);
        block.character = resolveSpriteDisplayName(originalCharacter, resources);
      }
    }
  } else if (type === 'narration') {
    block.scene = pairs.find(p => p.key === '场景')?.value || '';
    // 旁白字段兼容：AI 偶尔会把台词误输出到旁白块（如 [[narration||台词：xxx]]），
    // 这里按 NARRATION_TEXT_KEYS 优先级依次匹配
    block.message =
      pairs.find(p => NARRATION_TEXT_KEYS.includes(p.key))?.value ||
      '';
    console.info(`[MessageParser] 创建 narration 块: 场景="${block.scene}", 旁白="${block.message}"`);
    if (block.scene) block.sceneImageUrl = matchBackground(block.scene, resources);
  } else if (type === 'blacktext') {
    block.message =
      pairs.find(p => BLACKTEXT_TEXT_KEYS.includes(p.key))?.value || '';
    console.info(`[MessageParser] 创建 blacktext 块: "${block.message}"`);
  } else if (type === 'choice') {
    // 格式：[[choice||选项1：xxx||选项2：yyy||选项3：zzz]]
    // 查找所有 "选项X：" 或 "选项X：" 格式的键
    const options: string[] = [];
    for (const pair of pairs) {
      if (/^选项\d+$/.test(pair.key)) {
        options.push(pair.value);
      }
    }
    if (options.length > 0) {
      block.options = options;
      console.info(`[MessageParser] 创建 choice 块: ${options.length} 个选项`);
    }
  }

  return block;
}

/**
 * 解析单个消息块
 *
 * 行为变更：
 * - 旧行为：如果文本字段中包含换行，会自动拆分成多个块
 * - 新行为：保留文本中的换行符（\n），输出为单个块，由 UI 层渲染为"块内换行"
 *
 * 理由：AI 经常在台词/旁白字段中输出多行内容（如多句对白、多行描述），
 *       拆成多个块会导致：
 *       1. 多个 character 块被分到不同的场景继承上下文
 *       2. 多次刷新头像/立绘
 *       3. UI 翻页节奏被打断
 *       改为块内换行后，这些问题消失，UI 渲染层只需 `white-space: pre-line` 即可显示。
 */
function parseBlock(blockInfo: { type: string; content: string }, resources: WorldbookResources): MessageBlock[] {
  const { type, content } = blockInfo;
  const pairs = parsePairs(content);

  // 直接返回单个块；文本字段的 \n 转义已由 parsePairs 处理为真实换行符，
  // UI 层使用 white-space: pre-line 渲染为块内换行。
  return [createBlock(type, pairs, resources)];
}

/**
 * 从消息中提取 <content>...</content> 标签内的内容
 * 若消息中没有 <content> 标签，返回空字符串（VN 主舞台不显示任何内容）
 */
export function extractContentTag(message: string): string {
  const match = message.match(/<content>([\s\S]*?)<\/content>/);
  return match ? match[1].trim() : '';
}

/**
 * 将正文包成 `<content>...</content>` 包裹的字符串
 * 用于把"内部正文"喂给第二 API user 段，使其与提示词中"严格基于 <content> 标签内的正文"对齐。
 *
 * 防御：
 * - 若已经包含 `<content>` 标签，原样返回（不重复包裹）
 * - 若文本为空，返回 `<content>\n</content>`（避免 user 段为空）
 */
export function wrapContentTag(inner: string): string {
  const trimmed = (inner ?? '').trim();
  if (!trimmed) return '<content>\n</content>';
  if (/<content>/i.test(trimmed)) return trimmed;
  return `<content>\n${trimmed}\n</content>`;
}

/**
 * 将 \n 转义序列转换为真实换行，并按换行拆分文本
 */
function splitByNewlineForPlainText(text: string): string[] {
  if (!text) return [];
  const normalized = text.replace(/\\n/g, '\n');
  return normalized
    .split(/\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * 从 character 块中提取角色名
 * 优先查找 角色名：xxx，其次是 角色名：xxx，最后回退到第一个 "角色名" 键的 value，
 * 否则回退到 "character"/"台词" 字段。
 */
function extractCharacterNameFromPairs(pairs: { key: string; value: string }[]): string {
  const namePair = pairs.find(p => ['角色名', '角色', '人物', 'name', 'character'].includes(p.key));
  if (namePair && namePair.value) return namePair.value.trim();

  // 兼容：segment 第一段就是名称，没有"角色名"前缀的情况
  const first = pairs[0]?.key;
  if (first && !['台词', '旁白', '黑屏文字', '场景', 'scene', 'line'].includes(first)) {
    return first.trim();
  }
  return '';
}

/**
 * 判断台词是否已经有 "X：" 或 'X：' 等引号包裹的发言形式
 * 如果有则保持原样；没有则补充为 角色名："台词" 格式
 */
function formatDialogueLine(characterName: string, line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return '';
  // 已经有引号包裹的发言：例如 殷姒："哈哈"、殷姒：'哈哈'、殷姒："哈哈"、殷姒：「哈哈」
  // 也包括 角色名："台词" 这种已经格式化好的形式
  if (/^[^：:]+[：:]["'“”‘’「」].*/.test(trimmed)) {
    return trimmed;
  }
  // 已经是 角色名：台词 形式（中文/英文冒号 + 非引号开头），保持原样
  if (/^[^：:]+[：:][^"'“”‘’「」]/.test(trimmed)) {
    return trimmed;
  }
  // 否则补充为 角色名："台词"
  const name = characterName.trim() || '未知';
  return `${name}："${trimmed}"`;
}

/**
 * 从消息中提取格式化的剧情文本：
 * - character 块的台词：输出为 角色名："台词"（已有引号或冒号的保持原样）
 * - narration 块的旁白：原样输出
 * - blacktext 块的黑屏文字：原样输出
 * - choice 选项：忽略（不进剧情文本）
 *
 * 支持换行分隔，每行视为一个独立段落
 * 支持 \n 转义序列
 */
export function extractFormattedPlotText(message: string): string {
  const content = extractContentTag(message);
  if (!content) return '';

  const lines: string[] = [];

  const blockPositions: Array<{ start: number; end: number }> = [];
  let searchPos = 0;
  while (searchPos < content.length) {
    const m = matchBlock(content, searchPos);
    if (m) {
      blockPositions.push({ start: searchPos, end: m.endIndex });
      searchPos = m.endIndex;
    } else {
      searchPos++;
    }
  }

  let currentPos = 0;
  for (const pos of blockPositions) {
    if (pos.start > currentPos) {
      const between = content.slice(currentPos, pos.start).trim();
      if (between) {
        lines.push(...splitByNewlineForPlainText(between));
      }
    }

    const blockAtPos = matchBlock(content, pos.start);
    if (blockAtPos) {
      const blockType = normalizeBlockType(blockAtPos.type);
      const pairs = parsePairs(blockAtPos.content);

      if (blockType === 'choice') {
        // 选项不进入剧情文本
      } else if (blockType === 'character') {
        const characterName = extractCharacterNameFromPairs(pairs);
        // 兼容多种台词字段名（与 createBlock 中的 CHARACTER_TEXT_KEYS 对齐）
        const linePair = pairs.find(p => CHARACTER_TEXT_KEYS.includes(p.key));
        if (linePair && linePair.value) {
          const lineParts = splitByNewlineForPlainText(linePair.value);
          for (const part of lineParts) {
            const formatted = formatDialogueLine(characterName, part);
            if (formatted) lines.push(formatted);
          }
        }
      } else if (blockType === 'narration') {
        // 兼容多种旁白字段名（与 createBlock 中的 NARRATION_TEXT_KEYS 对齐）
        const narrationPair = pairs.find(p => NARRATION_TEXT_KEYS.includes(p.key));
        if (narrationPair && narrationPair.value) {
          lines.push(...splitByNewlineForPlainText(narrationPair.value));
        }
      } else if (blockType === 'blacktext') {
        // 兼容多种黑屏文字字段名
        const blackPair = pairs.find(p => BLACKTEXT_TEXT_KEYS.includes(p.key));
        if (blackPair && blackPair.value) {
          lines.push(...splitByNewlineForPlainText(blackPair.value));
        }
      } else {
        // 其他类型：原样收集 台词/旁白/黑屏文字 字段
        for (const pair of pairs) {
          if (['台词', '旁白', '黑屏文字'].includes(pair.key) && pair.value) {
            lines.push(...splitByNewlineForPlainText(pair.value));
          }
        }
      }
    }

    currentPos = pos.end;
  }

  if (currentPos < content.length) {
    const remaining = content.slice(currentPos).trim();
    if (remaining) {
      lines.push(...splitByNewlineForPlainText(remaining));
    }
  }

  return lines.join('\n');
}

/**
 * 从消息中提取 <content>...</content> 标签内的纯文本对话内容
 * 提取对话台词、旁白等纯文本，过滤掉格式标记
 * 支持换行分隔，每行视为一个独立段落
 * 支持 \n 转义序列
 */
export function extractPlainTextFromContent(message: string): string {
  const content = extractContentTag(message);
  if (!content) return '';

  const lines: string[] = [];

  // 使用新的 matchAllBlocks 匹配所有格式块（支持多行内容）
  const matchedBlocks = matchAllBlocks(content);

  // 收集所有块的起始位置
  const blockPositions: Array<{ start: number; end: number }> = [];
  let searchPos = 0;
  while (searchPos < content.length) {
    const m = matchBlock(content, searchPos);
    if (m) {
      const blockEnd = m.endIndex;
      blockPositions.push({ start: searchPos, end: blockEnd });
      searchPos = blockEnd;
    } else {
      searchPos++;
    }
  }

  // 按位置顺序遍历，收集块之间的纯文本和块内的对话文本
  let currentPos = 0;
  for (const pos of blockPositions) {
    // 收集块之前的纯文本
    if (pos.start > currentPos) {
      const between = content.slice(currentPos, pos.start).trim();
      if (between) {
        const lineParts = splitByNewlineForPlainText(between);
        lines.push(...lineParts);
      }
    }

    // 收集块内的对话文本
    const block = matchedBlocks.find(m => {
      const parsedBlock = matchBlock(content, pos.start);
      return (
        parsedBlock &&
        normalizeBlockType(parsedBlock.type) === normalizeBlockType(m.type) &&
        parsedBlock.content === m.content
      );
    });
    if (block && normalizeBlockType(block.type) !== 'choice') {
      const pairs = parsePairs(block.content);
      // 兼容多种文本字段名（与 createBlock 中的 KEY 列表对齐）
      for (const pair of pairs) {
        if (
          CHARACTER_TEXT_KEYS.includes(pair.key) ||
          NARRATION_TEXT_KEYS.includes(pair.key) ||
          BLACKTEXT_TEXT_KEYS.includes(pair.key)
        ) {
          if (pair.value) {
            const lineParts = splitByNewlineForPlainText(pair.value);
            lines.push(...lineParts);
          }
        }
      }
    }

    currentPos = pos.end;
  }

  // 处理最后剩余的文本
  if (currentPos < content.length) {
    const remaining = content.slice(currentPos).trim();
    if (remaining) {
      const lineParts = splitByNewlineForPlainText(remaining);
      lines.push(...lineParts);
    }
  }

  return lines.join('\n');
}

/**
 * 解析消息为消息块数组
 *
 * 解析规则：
 * 1. 仅解析 <content>...</content> 标签内的内容，标签外的内容全部忽略
 * 2. 若消息中没有 <content> 标签，返回空数组（VN 主舞台不显示任何内容）
 * 3. 标签内按 [[...]] 格式解析对话块；无格式文本视为旁白
 * 4. 消息块内的换行会自动拆分为多个块
 */
export async function parseMessageBlocks(
  message: string,
  lastScene?: string,
  role: 'assistant' | 'system' | 'user' = 'assistant',
): Promise<MessageBlock[]> {
  console.info('[MessageParser] 开始解析消息:', message.substring(0, 100));

  const contentText = extractContentTag(message);
  if (!contentText) {
    // user/system 消息没有 <content> 标签时，整条消息作为旁白文本显示
    if (role === 'user') {
      console.info('[MessageParser] user 消息无 <content> 标签，将原始文本作为 user 类型处理');
      const trimmed = message.trim();
      return trimmed ? [{ type: 'user', message: trimmed, character: '你' }] : [];
    }
    console.info('[MessageParser] 消息中没有 <content> 标签，忽略不显示');
    return [];
  }

  console.info('[MessageParser] 提取到 <content> 内容:', contentText.substring(0, 200));

  let resources: Awaited<ReturnType<typeof loadWorldbookResources>>;
  try {
    resources = await loadWorldbookResources();
  } catch (err) {
    console.warn('[MessageParser] 加载世界书资源失败，使用空资源继续:', err);
    resources = { backgrounds: [], cgs: [], sprites: [], models: new Map() };
  }
  console.info('[MessageParser] 世界书资源已加载:', {
    backgrounds: resources.backgrounds.length,
    cgs: resources.cgs.length,
    sprites: resources.sprites.length,
    models: resources.models.size,
  });
  const blocks: MessageBlock[] = [];

  // 使用新的 matchAllBlocks 函数匹配所有格式块（支持多行内容）
  let matchedBlocks: Array<{ type: string; content: string }>;
  try {
    matchedBlocks = matchAllBlocks(contentText);
  } catch (err) {
    console.error('[MessageParser] matchAllBlocks 失败:', err);
    matchedBlocks = [];
  }
  console.info('[MessageParser] 匹配到', matchedBlocks.length, '个块');

  if (matchedBlocks.length === 0) {
    // 没有找到格式化块：只对 user 消息保留纯文本显示（让玩家看到自己输入的内容），
    // assistant 消息的纯文本一律不显示，避免 LLM 输出的注释/草稿/计划文本污染舞台
    if (role === 'user') {
      console.info('[MessageParser] user 消息 <content> 内未找到格式化块，返回纯文本作为 user 类型');
      const trimmed = contentText.trim();
      return trimmed ? [{ type: 'user', message: trimmed, character: '你' }] : [];
    }
    console.info('[MessageParser] assistant 消息 <content> 内未找到格式化块，舞台不显示任何内容');
    return [];
  }

  // 解析每个块（parseBlock 可能返回多个块）
  let currentScene = lastScene;

  for (const blockInfo of matchedBlocks) {
    let parsedBlocks: MessageBlock[];
    try {
      parsedBlocks = parseBlock(blockInfo, resources);
    } catch (err) {
      console.error('[MessageParser] parseBlock 失败:', err, 'blockInfo=', JSON.stringify(blockInfo).substring(0, 100));
      continue;
    }
    for (const block of parsedBlocks) {
      try {
        // 过滤无法识别的块类型（非 character/narration/blacktext/choice/user），
        // 避免 LLM 输出的任意 [[xxx||...]] 杂项被当成可显示块送进舞台
        if (
          block.type !== 'character' &&
          block.type !== 'narration' &&
          block.type !== 'blacktext' &&
          block.type !== 'choice' &&
          block.type !== 'user'
        ) {
          console.info(
            `[MessageParser] 跳过无法识别的块类型: type="${block.type}"`,
            JSON.stringify(block).substring(0, 100),
          );
          continue;
        }

        // 过滤内容为空的块（避免空台词/空旁白/空黑屏文字进入舞台）；
        // choice 类型必须有至少 1 个选项才保留
        const textContent = (block.text || block.message || '').trim();
        const hasOptions = block.type === 'choice' && Array.isArray(block.options) && block.options.length > 0;
        if (!hasOptions && !textContent) {
          console.info('[MessageParser] 跳过空内容块:', JSON.stringify(block).substring(0, 80));
          continue;
        }

        // 场景继承机制
        if (block.scene) {
          currentScene = block.scene;
        } else if (currentScene && !block.isCG) {
          block.scene = currentScene;
          if (!block.sceneImageUrl) {
            block.sceneImageUrl = matchBackground(currentScene, resources);
          }
        }

        // user 消息中无论解析出什么类型的块，都统一标记为 user 类型
        // 这确保了 user 消息（如 [[character||...]] 格式的玩家自定义内容）
        // 在界面上被正确识别为用户输入
        if (role === 'user') {
          block.type = 'user';
          block.message = block.text || block.message || '';
          delete (block as any).character;
          delete (block as any).spriteImageUrl;
          delete (block as any).sceneImageUrl;
          delete (block as any).isCG;
          delete (block as any).cgImageUrl;
          delete (block as any).motion;
          delete (block as any).expression;
          delete (block as any).text;
        }

        blocks.push(block);
      } catch (err) {
        console.error('[MessageParser] 处理块时失败:', err, 'block=', JSON.stringify(block).substring(0, 100));
      }
    }
  }

  // 汇总日志
  console.info(`[MessageParser] 解析完成，共 ${blocks.length} 个消息块:`);
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const typeLabel = b.type === 'choice' ? `choice(${b.options?.length ?? 0}个选项)` : b.type;
    console.info(
      `  [块${i}] type=${typeLabel}, scene="${b.scene}", text="${(b.text || b.message || '').substring(0, 30)}..."`,
    );
  }
  return blocks;
}

/**
 * 标准化文本用于模糊匹配
 */
function normalizeForFuzzyMatch(text: string): string {
  return text
    .replace(/[-/\\_.\s]/g, '') // 去除特殊符号
    .toLowerCase(); // 转小写
}

/**
 * 模糊匹配：检查 source 是否包含 target 或 target 包含 source
 * 用于 content 中的场景名与图像标签 title 的匹配
 */
export function fuzzyMatchTitle(source: string, target: string): boolean {
  const a = normalizeForFuzzyMatch(source);
  const b = normalizeForFuzzyMatch(target);
  return a === b || a.includes(b) || b.includes(a);
}

/**
 * 从消息中提取所有 <background> 和 <cg>/<image> 标签块
 *
 * 支持的标签（等价）：
 * - 背景：`<background>...</background>`
 * - CG：`<cg>...</cg>` 或旧写法 `<image>...</image>`（兼容历史实现）
 *
 * 格式：
 * <background>
 * title###场景名###
 * image###sfw, 1girl, sunset###
 * </background>
 *
 * <cg>
 * title###CG名###
 * image###sfw, 1boy, 1girl, rain###
 * </cg>
 *
 * <image>
 * title###CG名###
 * image###sfw, 1boy, 1girl, rain###
 * </image>
 *
 * 容错处理：
 * - 支持宽松标签闭合：`</background>`、`</background >`（忽略多余空格）
 * - title 缺失时设为空字符串（仍加入队列但不显示）
 * - prompt 缺失时忽略整个块
 */
export function extractImageTagBlocks(message: string): ImageTagBlock[] {
  const blocks: ImageTagBlock[] = [];

  // 匹配 <background>...</background>、<cg>...</cg> 和 <image>...</image>
  // 支持宽松闭合标签，如 </background> 或 </background >
  const tagRegex = /<(background|cg|image)>([\s\S]*?)<\/\1\s*>/gi;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(message)) !== null) {
    const typeStr = match[1].toLowerCase();
    const content = match[2];

    // 提取 type
    const type: 'background' | 'cg' = typeStr === 'background' ? 'background' : 'cg';

    // 提取 title（可选，缺失时设为空字符串）
    let title = '';
    const titleMatch = content.match(/title###([\s\S]*?)###/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    // 提取 prompt（必需，缺失时忽略整个块）
    const promptMatch = content.match(/image###([\s\S]*?)###/i);
    if (!promptMatch) {
      console.warn(`[MessageParser] 跳过图像块（缺少 image 字段）: <${typeStr}>...`);
      continue;
    }
    const prompt = promptMatch[1].trim();

    if (!prompt) {
      console.warn(`[MessageParser] 跳过图像块（空 prompt）: <${typeStr}>...`);
      continue;
    }

    blocks.push({ type, title, prompt });
    console.info(`[MessageParser] 解析图像块: type=${type}, title="${title}", prompt="${prompt.substring(0, 50)}..."`);
  }

  if (blocks.length > 0) {
    console.info(`[MessageParser] 共提取 ${blocks.length} 个图像块`);
  }

  return blocks;
}

/**
 * 从消息中提取弹幕标签内容
 *
 * 格式：<dm>弹幕内容|弹幕内容|弹幕内容</dm>
 * 弹幕内容用 | 分隔
 *
 * @returns 弹幕内容数组，若没有弹幕标签则返回空数组
 */
export function extractDanmakuBlock(message: string): string[] {
  const match = message.match(/<dm>([\s\S]*?)<\/dm>/);
  if (!match) return [];

  const content = match[1].trim();
  if (!content) return [];

  // 用 | 分隔多条弹幕
  const lines = content
    .split(/\|/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.info(`[MessageParser] 解析弹幕: ${lines.length} 条`);
  return lines;
}

/**
 * 清洗第二 API 返回的原始字符串，仅保留我们需要的内部标签块：
 *   - <dm>...</dm>
 *   - <background>...</background>
 *   - <image>...</image>
 *   - <cg>...</cg>
 *
 * LLM 容易"惯性输出"以下内容，必须被剥离：
 *   1. <content>...</content> 整段（剧情正文）—— 不应被追加到楼层末尾
 *   2. 任何不在标签内的自由文本（人话解释、Markdown、"以上是弹幕" 等）
 *   3. 残缺的 Unicode 替换字符 U+FFFD（生成截断的产物）
 *   4. 多余的空行
 *
 * 标签的合法性弱校验：
 *   - <dm>：原样保留块内全部内容，不做 split；下游 extractDanmakuBlock 会按 | 切
 *   - <background>/<image>/<cg>：必须包含 image###...### 字段才保留
 *     （参见 extractImageTagBlocks 的判断）
 *
 * @returns 清洗后的字符串，可安全追加到楼层末尾
 */
export function sanitizeSecondApiOutput(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  // 0. 移除残缺 Unicode 替换字符 (U+FFFD)，它们是模型生成截断的产物
  //    单独处理：用户给的样本里"他紧张了�"就是这种
  let cleaned = raw.replace(/\uFFFD/g, '');

  // 1. 完整提取我们要保留的标签
  const blocks: string[] = [];

  // 1a. <dm>...</dm> —— 完整保留块内原文（不做 split、不 trim 内容）。
  //     下游 extractDanmakuBlock 会按 | 切，且 UI 层有它自己的弹幕处理流程；
  //     我们这里只在写入楼层前剥掉 raw 外的自由文本 / <content> / U+FFFD。
  const dmRegex = /<dm>[\s\S]*?<\/dm\s*>/gi;
  let m: RegExpExecArray | null;
  while ((m = dmRegex.exec(cleaned)) !== null) {
    blocks.push(m[0]);
  }

  // 1b. <background>...</background>、<image>...</image>、<cg>...</cg>
  //     必须包含 image###...### 字段才算合法；缺则丢弃
  const imgTagRegex = /<(background|image|cg)>([\s\S]*?)<\/\1\s*>/gi;
  while ((m = imgTagRegex.exec(cleaned)) !== null) {
    const tag = m[1].toLowerCase();
    const content = m[2];
    if (!/image###[\s\S]*?###/i.test(content)) continue;
    blocks.push(`<${tag}>${content.trim()}</${tag}>`);
  }

  // 2. 用单个换行连接所有保留块
  return blocks.join('\n').trim();
}

/**
 * 从 [[...]] 块中提取场景名
 * 用于与图像标签 title 进行模糊匹配
 * 支持块内换行
 *
 * @example
 * // 输入: [[character||角色名：零||场景：教室黄昏||台词：你好]]
 * // 输出: "教室黄昏"
 */
export function extractSceneFromBlock(blockText: string): string | undefined {
  const m = matchBlock(blockText, 0);
  if (!m) return undefined;

  const pairs = parsePairs(m.content);
  const scenePair = pairs.find(p => p.key === '场景');
  return scenePair?.value;
}
