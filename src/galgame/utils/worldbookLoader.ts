import type {
  BackgroundResource,
  CGResource,
  ModelResource,
  SpriteResource,
  WorldbookResources,
} from '../types/message';

let cachedResources: WorldbookResources | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5秒缓存

function tryExtractFirstJsonObject(text: string): string | null {
  // 容错：允许世界书条目 content 里包含说明文字/Markdown 代码块。
  // 策略：从第一个 '{' 开始，做括号计数，截取出第一个完整 JSON 对象。
  const start = text.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function parseEntryJson(entryContent: string): unknown {
  // 先严格解析
  try {
    return JSON.parse(entryContent);
  } catch {
    // 再尝试容错提取
    const extracted = tryExtractFirstJsonObject(entryContent);
    if (!extracted) throw new Error('no-json-object');
    return JSON.parse(extracted);
  }
}


/**
 * 获取所有相关世界书的名称（角色卡 + 聊天 + 全局）
 */
function getAllWorldbookNames(): string[] {
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

/**
 * 从世界书加载资源数据
 * 参考 live2d与galgame界面前端 的实现：从角色卡绑定的世界书加载
 */
export async function loadWorldbookResources(): Promise<WorldbookResources> {
  const now = Date.now();

  // 检查缓存
  if (cachedResources && now - cacheTimestamp < CACHE_DURATION) {
    console.info('[WorldbookLoader] 使用缓存的资源数据');
    return cachedResources;
  }

  console.info('[WorldbookLoader] 开始加载世界书资源...');

  const resources: WorldbookResources = {
    backgrounds: [],
    cgs: [],
    sprites: [],
    models: new Map(),
  };

  // 获取所有世界书名称
  const worldbookNames = getAllWorldbookNames();
  console.info('[WorldbookLoader] 发现世界书:', worldbookNames);

  if (worldbookNames.length === 0) {
    console.warn('[WorldbookLoader] 未找到任何世界书');
    return resources;
  }

  // 遍历所有世界书加载资源
  for (const worldbookName of worldbookNames) {
    try {
      if (typeof getWorldbook !== 'function') {
        console.warn('[WorldbookLoader] getWorldbook 函数不存在，可能不在酒馆环境中');
        continue;
      }

      const entries = await getWorldbook(worldbookName);
      console.info(`[WorldbookLoader] 从 "${worldbookName}" 获取到 ${entries.length} 个条目`);

      for (const entry of entries) {
        if (!entry.enabled) continue;
        if (!entry.content) continue;

        console.info(`[WorldbookLoader] 尝试解析条目: "${entry.name}", content 前50字符: "${entry.content.substring(0, 50)}"`);

        try {
          // 尝试解析 JSON 内容（支持从混合文本中提取第一个 JSON 对象）
          const data = parseEntryJson(entry.content) as any;
          console.info(`[WorldbookLoader] 条目 "${entry.name}" 解析成功, type: ${data?.type}`);

          // 背景资源
          if (data.type === 'background' && Array.isArray(data.backgrounds)) {
            resources.backgrounds.push(...(data.backgrounds as BackgroundResource[]));
            console.info(
              `[WorldbookLoader] "${worldbookName}" 加载了 ${data.backgrounds.length} 个背景资源 (${entry.name})`,
            );
            continue;
          }

          // CG资源
          if (data.type === 'cg' && Array.isArray(data.cgs)) {
            resources.cgs.push(...(data.cgs as CGResource[]));
            console.info(`[WorldbookLoader] "${worldbookName}" 加载了 ${data.cgs.length} 个CG资源 (${entry.name})`);
            continue;
          }

          // 立绘资源
          if (data.type === 'sprite' && Array.isArray(data.sprites)) {
            resources.sprites.push(...(data.sprites as SpriteResource[]));
            console.info(
              `[WorldbookLoader] "${worldbookName}" 加载了 ${data.sprites.length} 个立绘资源 (${entry.name})`,
            );
            continue;
          }

          // Live2D模型资源（支持 type: 'model' 和 'live2d_model' 两种格式）
          if ((data.type === 'model' || data.type === 'live2d_model') && data.modelName) {
            resources.models.set(data.modelName, data as ModelResource);
            console.info(`[WorldbookLoader] "${worldbookName}" 加载了 Live2D 模型: ${data.modelName} (${entry.name})`);
            continue;
          }

          // 不是资源类型，跳过
          console.info(`[WorldbookLoader] 条目 "${entry.name}" type="${data.type}" 不是资源类型，跳过`);
        } catch (e) {
          // 输出解析失败的详细信息
          console.warn(`[WorldbookLoader] 条目 "${entry.name}" JSON 解析失败:`, e);
          continue;
        }
      }
    } catch (e) {
      console.warn(`[WorldbookLoader] 加载世界书 "${worldbookName}" 失败:`, e);
    }
  }

  console.info('[WorldbookLoader] 资源加载完成:', {
    backgrounds: resources.backgrounds.length,
    cgs: resources.cgs.length,
    sprites: resources.sprites.length,
    models: resources.models.size,
  });

  if (resources.backgrounds.length === 0 && resources.cgs.length === 0 && resources.sprites.length === 0 && resources.models.size === 0) {
    console.warn('[WorldbookLoader] 未加载到任何资源。常见原因：世界书条目未启用、JSON 格式不合法、或条目内容不是资源表 JSON。');
  }

  // 更新缓存
  cachedResources = resources;
  cacheTimestamp = now;

  return resources;
}

/**
 * 清除缓存（用于测试或强制刷新）
 */
export function clearResourceCache(): void {
  cachedResources = null;
  cacheTimestamp = 0;
  console.info('[WorldbookLoader] 缓存已清除');
}
