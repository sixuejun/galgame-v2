/**
 * 对话单元类型定义
 * 用于存储所有楼层消息的基础单元数据
 */

export interface ChoiceOption {
  id: string;
  text: string;
  character?: string;
  response?: string;
}

export interface DialogueItem {
  // ===== 演出单元标识 =====
  unitId: string; // 唯一ID，格式：msg_{message_id}
  unitIndex: number; // 序号

  // ===== 酒馆消息信息 =====
  message_id?: number; // 酒馆消息ID
  role?: 'system' | 'assistant' | 'user'; // 消息角色

  // ===== 原始消息文本（用于按需解析） =====
  rawText: string; // 原始消息文本，按需解析为 blocks

  // ===== 主对话内容（可从 rawText 解析，暂不填充） =====
  character?: string;
  text?: string;
  type?: 'blackscreen' | 'choice' | 'narration' | 'user' | 'cg';

  // ===== 视觉效果 =====
  sprite?: {
    type: 'image' | 'none';
    imageUrl?: string;
  };
  scene?: string; // 场景ID
  sceneImageUrl?: string; // 背景图片URL
  motion?: string; // 动作
  expression?: string; // 表情
  isThrough?: boolean; // 是否穿透显示
  isCG?: boolean; // 是否是CG
  cgImageUrl?: string; // CG图片URL

  // ===== 选项相关 =====
  options?: ChoiceOption[]; // 选项列表
  choiceFormat?: 'format1' | 'format2'; // 选项格式
  isChoiceResponse?: boolean; // 是否是选项回复
  choiceParentId?: string; // 父选项ID

  // ===== 状态栏 =====
  statusBlock?: {
    地点?: string;
    关系?: string;
    心情?: string;
    吐槽?: string;
    待办?: string;
    小剧场?: string;
    [key: string]: string | undefined;
  } | null;

  // ===== 编辑状态 =====
  isEditable?: boolean; // 是否可编辑
  editedText?: string; // 编辑后的文本
  isDeleted?: boolean; // 是否已删除
  isRead?: boolean; // 是否已读
}

export interface ChoiceOption {
  id: string;
  text: string;
  character?: string; // 角色名（format1 时使用）
  response?: string; // format1 时 AI 的回复文本
}
