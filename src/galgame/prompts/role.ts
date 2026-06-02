/**
 * 任务：role（角色档案格式）
 * 调用链：CharacterManagementModule.vue buildOutputFormatLine() → buildEditablePromptText()
 * 调用方：CharacterManagementModule.vue
 * 状态：✅ 已实现
 */

/** 各字段对应的说明性占位符（| 分隔符风格） */
const 字段占位符: Record<string, string> = {
  姓名: '角色姓名',
  外貌: '外貌描述',
  性格: '性格描述',
  出身: '背景出身',
  定位: '角色在社交或者工作中的定位',
  说话风格: '语气特点或者口癖',
  喜好: '喜好描述',
  特长: '特长描述',
  职业: '职业描述',
  背景故事: '背景故事描述',
  属性: '战力:X/技巧:X/智慧:X/社交:X/谨慎:X/运气:X',
};

/**
 * 构建角色输出的 CMD:ADD 格式行（动态拼接字段，带说明性占位符）
 */
export function buildRoleOutputFormatLine(selectedFields: string[]): string {
  const fieldParts: string[] = [];
  for (const field of selectedFields) {
    const placeholder = 字段占位符[field] ?? field;
    fieldParts.push(`${field}：{{${placeholder}}}`);
  }
  return `<Character>
CMD:ADD | ${fieldParts.join(' | ')}
</Character>`;
}
