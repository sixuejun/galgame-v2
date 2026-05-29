/**
 * 消息块类型定义
 */
export interface MessageBlock {
  type: 'character' | 'narration' | 'blacktext' | 'user' | 'choice';

  // character 类型字段
  character?: string;
  scene?: string;
  motion?: string;
  expression?: string;
  text?: string;
  isCG?: boolean;

  // narration/blacktext/user 类型字段
  message?: string;

  // choice 类型字段
  options?: string[]; // 选项文本列表

  // 世界书资源匹配结果
  sceneImageUrl?: string; // 背景图片
  cgImageUrl?: string; // CG图片
  spriteImageUrl?: string; // 立绘图片
  motionFile?: string; // 动作文件
  expressionFile?: string; // 表情文件
}

/**
 * 世界书资源数据结构
 */
export interface BackgroundResource {
  name: string;
  file: string;
  textMappings?: string[];
}

export interface CGResource {
  name: string;
  file: string;
  textMappings?: string[];
}

export interface SpriteResource {
  name: string;
  file: string;
  textMappings?: string[];
}

export interface ModelResource {
  modelName: string;
  modelPath?: string;
  files?: {
    model3?: string;
    moc3?: string;
    textures?: string[];
  };
  textures?: string[];
  motions: Array<{
    name: string;
    file: string;
    textMappings?: string[];
  }>;
  defaultAnimation?: {
    motion?: string;
    expression?: string;
    autoLoop?: boolean;
  };
  touchAreas?: Array<{
    id: string;
    label?: string;
    hitbox: { x: number; y: number; width: number; height: number };
    motionGroup: string;
    longPressMotionGroup?: string;
    effectType?: 'ripple' | 'magic-circle' | 'heart' | 'none';
    shortPressThreshold?: number;
    effectDuration?: number;
  }>;
}

export interface WorldbookResources {
  backgrounds: BackgroundResource[];
  cgs: CGResource[];
  sprites: SpriteResource[];
  models: Map<string, ModelResource>;
}

/**
 * 生图标签块数据结构
 * 用于解析 <background> 和 <image> 标签内的内容
 *
 * @example
 * // 对应消息中的：
 * // <background>
 * // title###教室黄昏###
 * // image###empty classroom, sunset, dust, window light###
 * // </background>
 */
export interface ImageTagBlock {
  /** 图片类型：background（背景）或 cg（CG） */
  type: 'background' | 'cg';
  /** 叙事锚点，用于与 content 中的场景/CG 匹配 */
  title: string;
  /** 生图提示词（英文 tag，逗号分隔） */
  prompt: string;
}
