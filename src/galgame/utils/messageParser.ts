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
 * 将 \n 转义序列转换为真实换行，并按换行拆分文本
 */
function splitByNewline(text: string): string[] {
  if (!text) return [];
  // 将 \n 转义序列转换为真实换行
  const normalized = text.replace(/\\n/g, '\n');
  return normalized
    .split(/\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * 匹配嵌套的 [[...]] 块
 * 用于正确处理多行内容的格式块
 * 匹配规则：[[ 开头，对应数量（不嵌套）的 ]] 结尾
 */
function matchBlock(text: string, startIndex: number): { type: string; content: string; endIndex: number } | null {
  // 检查是否以 [[ 开头
  if (text.slice(startIndex, startIndex + 2) !== '[[') return null;

  // 找到第一个 || 的位置（在 [[ 之后）
  const firstBarBar = text.indexOf('||', startIndex + 2);
  if (firstBarBar === -1) return null;

  // 提取 type（在 [[ 和第一个 || 之间）
  const type = text.slice(startIndex + 2, firstBarBar).trim();
  if (!type) return null;

  // 从第一个 || 之后开始搜索对应的 ]] 结尾
  const contentStart = firstBarBar + 2;
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
 * 支持 || 分隔多对键值，支持值中包含换行
 * 支持 key：value 和 key：value 两种冒号格式
 */
function parsePairs(content: string): { key: string; value: string }[] {
  // 优先按 || 分隔成多段，再从每段中提取键值对
  const segments = content.split(/\|\|\s*/);
  const pairs: { key: string; value: string }[] = [];

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    // 在每个 segment 中用冒号分隔键和值
    const colonIdx = trimmed.search(/[:：]/);
    if (colonIdx > 0) {
      const key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();
      if (key) {
        pairs.push({ key, value });
      }
    }
  }

  return pairs;
}

function normalizeBlockType(type: string): MessageBlock['type'] {
  const normalized = type.trim().toLowerCase();
  if (['character', '角色', '人物', '对话', '台词'].includes(normalized)) return 'character';
  if (['narration', '旁白', '叙述'].includes(normalized)) return 'narration';
  if (
    ['blacktext', 'black', 'black_screen', 'black-screen', '黑屏', '黑屏文字', '黑幕', '黑幕文字'].includes(normalized)
  ) {
    return 'blacktext';
  }
  if (['choice', 'choices', '选项', '选择'].includes(normalized)) return 'choice';
  return normalized as MessageBlock['type'];
}

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
    block.character = pairs.find(p => p.key === '角色名' || p.key === '角色')?.value || '';
    block.scene = pairs.find(p => p.key === '场景')?.value || '';
    block.motion = pairs.find(p => p.key === '动作')?.value || '';
    block.expression = pairs.find(p => p.key === '表情')?.value || '';
    block.text = pairs.find(p => p.key === '台词')?.value || '';

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
    block.message = pairs.find(p => p.key === '旁白')?.value || '';
    console.info(`[MessageParser] 创建 narration 块: 场景="${block.scene}", 旁白="${block.message}"`);
    if (block.scene) block.sceneImageUrl = matchBackground(block.scene, resources);
  } else if (type === 'blacktext') {
    block.message =
      pairs.find(p => p.key === '黑屏文字')?.value ||
      pairs.find(p => p.key === '台词内容')?.value ||
      pairs.find(p => p.key === '台词')?.value ||
      pairs.find(p => p.key === '文字')?.value ||
      pairs.find(p => p.key === 'text')?.value ||
      '';
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
 * 如果文本字段中包含换行，会自动拆分成多个块
 */
function parseBlock(blockInfo: { type: string; content: string }, resources: WorldbookResources): MessageBlock[] {
  const { type, content } = blockInfo;
  const pairs = parsePairs(content);

  const normalizedType = normalizeBlockType(type);

  // 找出文本字段（不处理转义）
  let textField = '';
  if (normalizedType === 'character') {
    textField = pairs.find(p => p.key === '台词')?.value || '';
  } else if (normalizedType === 'narration') {
    textField = pairs.find(p => p.key === '旁白')?.value || '';
  } else if (normalizedType === 'blacktext') {
    textField =
      pairs.find(p => p.key === '黑屏文字')?.value ||
      pairs.find(p => p.key === '台词内容')?.value ||
      pairs.find(p => p.key === '台词')?.value ||
      pairs.find(p => p.key === '文字')?.value ||
      pairs.find(p => p.key === 'text')?.value ||
      '';
  }

  // 使用 splitByNewline 处理 \n 转义和换行拆分
  const lines = splitByNewline(textField);

  // 如果拆分后只有一个片段，直接返回一个块
  if (lines.length <= 1) {
    return [createBlock(type, pairs, resources)];
  }

  // 拆分成多个块
  return lines.map(line => {
    const newPairs = pairs.map(p => {
      if (
        p.key === '台词' ||
        p.key === '旁白' ||
        p.key === '黑屏文字' ||
        p.key === '台词内容' ||
        p.key === '文字' ||
        p.key === 'text'
      ) {
        return { key: p.key, value: line };
      }
      return { ...p };
    });
    return createBlock(type, newPairs, resources);
  });
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
      for (const pair of pairs) {
        if (['台词', '旁白', '黑屏文字'].includes(pair.key) && pair.value) {
          const lineParts = splitByNewlineForPlainText(pair.value);
          lines.push(...lineParts);
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
    // 没有找到格式化块，返回纯文本作为旁白
    // user 消息即使是纯文本也保持 user 类型
    console.info('[MessageParser] <content> 内未找到格式化块，返回纯文本');
    return [
      {
        type: role === 'user' ? 'user' : 'narration',
        message: contentText.trim(),
      },
    ];
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
