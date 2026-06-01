<template>
  <div class="cm-module">
    <!-- Loading overlay -->
    <div v-if="isGenerating" class="cm-loading-overlay">
      <div class="cm-loading-spinner" />
      <span class="cm-loading-text">{{ generatingMessage }}</span>
    </div>

    <!-- Tab navigation -->
    <div class="cm-tabs">
      <button class="cm-tab" :class="{ 'cm-tab-active': activeTab === 'list' }" @click="activeTab = 'list'">
        <i class="fa-solid fa-list" />
        角色列表
        <span class="cm-tab-badge">{{ allRoles.length }}</span>
      </button>
      <button class="cm-tab" :class="{ 'cm-tab-active': activeTab === 'generate' }" @click="activeTab = 'generate'">
        <i class="fa-solid fa-wand-magic-sparkles" />
        生成角色
      </button>
      <button
        class="cm-tab"
        :class="{ 'cm-tab-active': activeTab === 'detail' }"
        :disabled="!selectedRole"
        @click="selectedRole && (activeTab = 'detail')"
      >
        <i class="fa-solid fa-id-card" />
        角色详情
      </button>
    </div>

    <!-- ====== Tab: 角色列表 ====== -->
    <div v-show="activeTab === 'list'" class="cm-content">
      <!-- Action bar -->
      <div class="cm-action-bar">
        <div class="cm-stat-chip">
          <i class="fa-solid fa-users" />
          <span>共 {{ allRoles.length }} 名角色</span>
        </div>
        <button class="cm-btn-primary" :disabled="isGenerating" @click="activeTab = 'generate'">
          <i class="fa-solid fa-plus" />
          生成新角色
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="allRoles.length === 0" class="cm-empty">
        <i class="fa-solid fa-user-slash" />
        <p>暂无角色</p>
        <span>点击「生成角色」创建第一个角色</span>
      </div>

      <!-- Role grid -->
      <div v-else class="cm-role-list">
        <button
          v-for="role in allRoles"
          :key="role.id"
          class="cm-role-card"
          :class="{ 'cm-role-selected': selectedRoleId === role.id }"
          @click="selectRole(role)"
        >
          <div class="cm-role-avatar">
            {{ role.姓名?.charAt(0) || '?' }}
          </div>
          <div class="cm-role-info">
            <div class="cm-role-name-row">
              <span class="cm-role-name">{{ role.姓名 || '未知' }}</span>
              <span class="cm-status-badge" :class="`cm-status-${role.状态 || '空闲'}`">
                {{ role.状态 || '空闲' }}
              </span>
            </div>
            <div class="cm-role-attrs">
              <span v-for="(val, key) in role.属性" :key="key" class="cm-attr-chip" :title="`${key}: ${val}`">
                {{ key }}:{{ val }}
              </span>
            </div>
            <div v-if="role.已装备技能?.length" class="cm-role-skills">
              <i class="fa-solid fa-star" />
              {{ role.已装备技能.length }} 个技能
            </div>
            <div v-if="role.定位" class="cm-role-tag">
              {{ role.定位 }}
            </div>
          </div>
          <div v-if="selectedRoleId === role.id" class="cm-role-check">
            <i class="fa-solid fa-check" />
          </div>
        </button>
      </div>
    </div>

    <!-- ====== Tab: 生成角色 ====== -->
    <div v-show="activeTab === 'generate'" class="cm-content">
      <button class="cm-back-btn" @click="resetGenerateTab">
        <i class="fa-solid fa-arrow-left" />
        返回列表
      </button>

      <!-- API not available -->
      <div v-if="!isApiAvailable" class="cm-api-warning">
        <i class="fa-solid fa-triangle-exclamation" />
        <div>
          <strong>第二 API 未配置</strong>
          <p>请在设置中配置第二 API 以使用角色生成功能</p>
        </div>
      </div>

      <!-- ====== Step 1: 生成配置 ====== -->
      <div v-else-if="genStep === 'config'" class="cm-gen-form">
        <div class="cm-gen-section">
          <h4 class="cm-section-title">
            <i class="fa-solid fa-sliders" />
            生成配置
          </h4>

          <!-- Field selection -->
          <div class="cm-gen-fields">
            <p class="cm-gen-hint">选择要生成的档案字段（姓名、属性默认包含）</p>
            <div class="cm-gen-toggles">
              <button
                v-for="field in optionalFields"
                :key="field.key"
                class="cm-gen-toggle"
                :class="{ 'cm-gen-toggle-active': selectedFields.has(field.key) }"
                @click="toggleField(field.key)"
              >
                <i :class="selectedFields.has(field.key) ? 'fa-solid fa-check-square' : 'fa-regular fa-square'" />
                {{ field.label }}
              </button>
            </div>
          </div>

          <!-- Scene description -->
          <div class="cm-gen-scene">
            <label class="cm-gen-label">场景描述（可选）</label>
            <textarea
              v-model="sceneDescription"
              class="cm-gen-textarea"
              placeholder="例如：在废土边缘的避难所遇到的角色..."
              rows="3"
            />
          </div>

          <!-- Extra custom fields -->
          <div class="cm-gen-scene">
            <label class="cm-gen-label">自定义字段要求（可选）</label>
            <textarea
              v-model="extraFieldRequirements"
              class="cm-gen-textarea"
              placeholder="例如：年龄：角色的年龄&#10;特殊能力：角色拥有的特殊能力"
              rows="2"
            />
          </div>
        </div>

        <!-- Prompt preview -->
        <div class="cm-gen-section">
          <h4 class="cm-section-title">
            <i class="fa-solid fa-code" />
            提示词预览（可编辑）
          </h4>
          <div class="cm-gen-preview">
            <pre class="cm-gen-preview-text">{{ editablePrompt }}</pre>
          </div>
        </div>

        <!-- Generate button -->
        <div class="cm-gen-actions">
          <button class="cm-btn-primary cm-btn-generate" :disabled="isGenerating" @click="handleGenerateStep1">
            <i :class="isGenerating ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-wand-magic-sparkles'" />
            {{ isGenerating ? '生成中...' : '发送预览' }}
          </button>
        </div>
      </div>

      <!-- ====== Step 2: 预览确认 ====== -->
      <div v-else-if="genStep === 'preview'" class="cm-gen-form">
        <div class="cm-gen-section">
          <h4 class="cm-section-title">
            <i class="fa-solid fa-sparkles" />
            角色预览
          </h4>

          <div v-if="!previewRole" class="cm-empty" style="padding: 20px 0;">
            <i class="fa-solid fa-circle-exclamation" />
            <p>解析失败</p>
            <span>无法从 AI 输出中解析出角色，请重试</span>
          </div>

          <div v-else class="cm-preview-card">
            <!-- Avatar + name -->
            <div class="cm-preview-header">
              <div class="cm-preview-avatar">
                {{ previewRole.姓名?.charAt(0) || '?' }}
              </div>
              <div>
                <div class="cm-preview-name">{{ previewRole.姓名 }}</div>
                <div v-if="previewRole.定位" class="cm-preview-tag">{{ previewRole.定位 }}</div>
              </div>
            </div>

            <!-- Attributes -->
            <div class="cm-preview-section">
              <div class="cm-preview-section-title">属性</div>
              <div class="cm-attr-grid">
                <div v-for="(val, key) in previewRole.属性" :key="key" class="cm-attr-item">
                  <span class="cm-attr-name">{{ key }}</span>
                  <div class="cm-attr-bar-wrap">
                    <div class="cm-attr-bar" :style="{ width: (Number(val) / 5) * 100 + '%' }" />
                  </div>
                  <span class="cm-attr-val">{{ val }}</span>
                </div>
              </div>
            </div>

            <!-- Profile fields -->
            <div v-if="previewFields.length > 0" class="cm-preview-section">
              <div class="cm-preview-section-title">档案</div>
              <div class="cm-preview-fields">
                <div v-for="field in previewFields" :key="field.key" class="cm-preview-field-item">
                  <span class="cm-field-label">{{ field.label }}</span>
                  <span class="cm-field-value">{{ field.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CMD preview -->
        <div v-if="previewCmdString" class="cm-gen-section">
          <h4 class="cm-section-title">
            <i class="fa-solid fa-terminal" />
            插入内容
          </h4>
          <div class="cm-gen-preview">
            <pre class="cm-gen-preview-text">{{ previewCmdString }}</pre>
          </div>
        </div>

        <!-- Actions -->
        <div class="cm-gen-actions">
          <button class="cm-btn-secondary" :disabled="isGenerating" @click="genStep = 'config'">
            <i class="fa-solid fa-pen" />
            重新编辑
          </button>
          <button class="cm-btn-primary cm-btn-generate" :disabled="isGenerating" @click="handleConfirmInsert">
            <i :class="isGenerating ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'" />
            {{ isGenerating ? '插入中...' : '确认并插入聊天' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ====== Tab: 角色详情 ====== -->
    <div v-if="activeTab === 'detail' && selectedRole" class="cm-content">
      <!-- Back button -->
      <button class="cm-back-btn" @click="activeTab = 'list'">
        <i class="fa-solid fa-arrow-left" />
        返回列表
      </button>

      <!-- Role profile header -->
      <div class="cm-profile-header">
        <div class="cm-profile-avatar">
          {{ selectedRole!.姓名?.charAt(0) || '?' }}
        </div>
        <div class="cm-profile-meta">
          <div class="cm-profile-name-row">
            <input
              v-if="editingName"
              v-model="nameEditValue"
              class="cm-name-input"
              autofocus
              @blur="saveNameEdit"
              @keydown.enter="saveNameEdit"
              @keydown.esc="cancelNameEdit"
            />
            <h3 v-else class="cm-profile-name" @click="startNameEdit">
              {{ selectedRole!.姓名 }}
              <i class="fa-solid fa-pen cm-edit-icon" />
            </h3>
            <span class="cm-status-badge" :class="`cm-status-${selectedRole!.状态 || '空闲'}`">
              {{ selectedRole!.状态 || '空闲' }}
            </span>
          </div>
          <div class="cm-profile-id">{{ selectedRole!.id }}</div>
        </div>
      </div>

      <!-- Status change -->
      <div class="cm-section">
        <h4 class="cm-section-title">
          <i class="fa-solid fa-gear" />
          状态管理
        </h4>
        <div class="cm-status-grid">
          <button
            v-for="status in availableStatuses"
            :key="status"
            class="cm-status-btn"
            :class="{ 'cm-status-btn-active': selectedRole!.状态 === status }"
            @click="handleChangeStatus(status)"
          >
            <span class="cm-status-badge" :class="`cm-status-${status}`">{{ status }}</span>
          </button>
        </div>
      </div>

      <!-- Attributes -->
      <div class="cm-section">
        <h4 class="cm-section-title">
          <i class="fa-solid fa-chart-bar" />
          属性
        </h4>
        <div class="cm-attr-grid">
          <div v-for="(val, key) in selectedRole!.属性" :key="key" class="cm-attr-item">
            <span class="cm-attr-name">{{ key }}</span>
            <div class="cm-attr-bar-wrap">
              <div class="cm-attr-bar" :style="{ width: (Number(val) / 5) * 100 + '%' }" />
            </div>
            <div class="cm-attr-val-row">
              <button class="cm-attr-btn" @click="adjustAttr(String(key), -1)">
                <i class="fa-solid fa-minus" />
              </button>
              <span class="cm-attr-val">{{ val }}</span>
              <button class="cm-attr-btn" @click="adjustAttr(String(key), 1)">
                <i class="fa-solid fa-plus" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile fields -->
      <div class="cm-section">
        <h4 class="cm-section-title">
          <i class="fa-solid fa-user-pen" />
          角色档案
        </h4>
        <div class="cm-profile-fields">
          <div v-for="field in profileFields" :key="field.key" class="cm-profile-field-item">
            <span class="cm-field-label">{{ field.label }}</span>
            <input
              v-if="editingField === field.key"
              v-model="fieldEditValue"
              class="cm-field-input"
              autofocus
              @blur="saveFieldEdit"
              @keydown.enter="saveFieldEdit"
              @keydown.esc="cancelFieldEdit"
            />
            <span
              v-else
              class="cm-field-value cm-field-clickable"
              @click="startFieldEdit(field.key, String(selectedRole![field.key as keyof typeof selectedRole] || ''))"
            >
              {{ selectedRole![field.key as keyof typeof selectedRole] || '——' }}
              <i class="fa-solid fa-pen cm-edit-icon-sm" />
            </span>
          </div>
        </div>
      </div>

      <!-- Skills -->
      <div class="cm-section">
        <h4 class="cm-section-title">
          <i class="fa-solid fa-star" />
          装备技能
          <span class="cm-section-count">{{ selectedRole!.已装备技能?.length || 0 }}</span>
        </h4>

        <div v-if="!selectedRole!.已装备技能?.length" class="cm-empty-skill">暂无装备技能（前往商店购买技能后在此装配）</div>

        <div v-else class="cm-skill-list">
          <div v-for="skillId in selectedRole!.已装备技能" :key="skillId" class="cm-skill-card">
            <div class="cm-skill-icon">
              {{ getSkillEmoji(skillId) }}
            </div>
            <div class="cm-skill-info">
              <div class="cm-skill-name">{{ getSkillName(skillId) }}</div>
              <div v-if="getSkillDesc(skillId)" class="cm-skill-desc">
                {{ getSkillDesc(skillId) }}
              </div>
              <div v-if="getSkillMods(skillId).length" class="cm-skill-mods">
                <span v-for="mod in getSkillMods(skillId)" :key="mod.key" class="cm-mod-tag">
                  {{ mod.domain }}.{{ mod.key }} +{{ mod.value }}{{ mod.type === 'percent' ? '%' : '' }}
                </span>
              </div>
            </div>
            <button class="cm-btn-unequip" @click="handleUnequipSkill(selectedRole!.id, skillId)">
              <i class="fa-solid fa-unlink" />
              卸下
            </button>
          </div>
        </div>

        <!-- Equip skill from inventory -->
        <div class="cm-equip-section">
          <div class="cm-equip-header">
            <i class="fa-solid fa-plus-circle" />
            <span>装配已购技能</span>
          </div>
          <div v-if="availableSkills.length === 0" class="cm-no-skills">
            <i class="fa-solid fa-ban" />
            无可装配的技能（前往商店购买）
          </div>
          <div v-else class="cm-skill-pool">
            <button
              v-for="skill in availableSkills"
              :key="skill.id"
              class="cm-skill-pool-item"
              @click="handleEquipSkill(selectedRole!.id, skill.id)"
            >
              <span class="cm-skill-pool-emoji">{{ skill.emoji || '⚡' }}</span>
              <span class="cm-skill-pool-name">{{ skill.名称 }}</span>
              <i class="fa-solid fa-plus cm-skill-pool-add" />
            </button>
          </div>
        </div>
      </div>

      <!-- Records -->
      <div v-if="selectedRole!.记录?.length" class="cm-section">
        <h4 class="cm-section-title">
          <i class="fa-solid fa-scroll" />
          历史记录
          <span class="cm-section-count">{{ selectedRole!.记录.length }}</span>
        </h4>
        <div class="cm-record-list">
          <div
            v-for="(record, idx) in groupedRecords"
            :key="idx"
            class="cm-record-group"
          >
            <div class="cm-record-group-header">{{ record.type }}</div>
            <div
              v-for="(r, i) in record.items"
              :key="i"
              class="cm-record-item"
            >
              <span class="cm-record-content">{{ r.内容 }}</span>
              <span class="cm-record-time">{{ formatTime(r.时间) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Danger zone -->
      <div class="cm-section cm-danger-zone">
        <h4 class="cm-section-title cm-danger-title">
          <i class="fa-solid fa-skull" />
          危险操作
        </h4>
        <button class="cm-btn-danger" @click="handleDeleteRole(selectedRole!.id)">
          <i class="fa-solid fa-trash" />
          删除此角色
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { klona } from 'klona';
import { useVNStore } from '../../store';
import type { 技能, 角色 } from '../../types/role';
import { 角色状态枚举 } from '../../types/role';
import { parseCharacterCMD, fieldsToRole } from '../../utils/roleParser';

const store = useVNStore();

// ============================================================
// Tab state
// ============================================================
const activeTab = ref<'list' | 'generate' | 'detail'>('list');
const selectedRoleId = ref<string>('');

// ============================================================
// Generation state
// ============================================================
const isGenerating = ref(false);
const generatingMessage = ref('正在生成角色…');
const selectedFields = ref<Set<string>>(new Set(['外貌', '性格', '出身', '定位', '说话风格']));
const sceneDescription = ref('');
const extraFieldRequirements = ref('');
const genStep = ref<'config' | 'preview'>('config');

/** 预览用角色对象（从 AI 输出解析而来） */
const previewRole = ref<角色 | null>(null);
/** 预览用 CMD 字符串（待插入聊天） */
const previewCmdString = ref<string>('');

const optionalFields = [
  { key: '外貌', label: '外貌' },
  { key: '性格', label: '性格' },
  { key: '出身', label: '出身' },
  { key: '定位', label: '定位' },
  { key: '说话风格', label: '说话风格' },
  { key: '喜好', label: '喜好' },
  { key: '特长', label: '特长' },
  { key: '职业', label: '职业' },
  { key: '背景故事', label: '背景故事' },
];

const profileFields = [
  { key: '外貌', label: '外貌' },
  { key: '性格', label: '性格' },
  { key: '出身', label: '出身' },
  { key: '定位', label: '定位' },
  { key: '说话风格', label: '说话风格' },
  { key: '喜好', label: '喜好' },
  { key: '特长', label: '特长' },
  { key: '职业', label: '职业' },
  { key: '背景故事', label: '背景故事' },
];

// ============================================================
// Computed
// ============================================================
const allRoles = computed(() => store.getAllRoles());

const selectedRole = computed(() => {
  if (!selectedRoleId.value) return null;
  return store.getRole(selectedRoleId.value) ?? null;
});

const isApiAvailable = computed(() => store.secondApiStatus !== 'disabled');

const availableStatuses = 角色状态枚举.options;

/** 预览界面展示的档案字段（非空字段） */
const previewFields = computed(() => {
  if (!previewRole.value) return [];
  return profileFields
    .map(f => ({ key: f.key, label: f.label, value: (previewRole.value as any)[f.key] }))
    .filter(f => f.value && f.value.trim());
});

/** 可装备技能：从技能库存中过滤已装备的 */
const availableSkills = computed(() => {
  if (!selectedRole.value) return [];
  const equippedIds = new Set(selectedRole.value.已装备技能 || []);
  return store.getAllSkills().filter((s: 技能) => !equippedIds.has(s.id));
});

/** 按类型分组的记录 */
const groupedRecords = computed(() => {
  if (!selectedRole.value?.记录?.length) return [];
  const records = [...selectedRole.value.记录].reverse();
  const groups: Record<string, typeof records> = {};
  for (const r of records) {
    const key = r.类型;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }
  return Object.entries(groups).map(([type, items]) => ({ type, items }));
});

/** 构建输出格式行（根据选中的字段动态拼接） */
function buildOutputFormatLine(selected: Set<string>): string {
  const fieldParts: string[] = ['姓名：'];
  for (const f of optionalFields) {
    if (selected.has(f.key)) {
      fieldParts.push(`${f.label}：`);
    }
  }
  fieldParts.push('属性：战力:X/技巧:X/智慧:X/社交:X/谨慎:X/运气:X');
  return `CMD:ADD | ${fieldParts.join(' | ')}`;
}

const editablePrompt = computed(() => {
  const fields = ['属性', ...selectedFields.value].join('、');
  const extra = extraFieldRequirements.value.trim() || '玩家可以在这里添加自定义字段要求，如：\n- 年龄：角色的年龄\n- 特殊能力：角色拥有的特殊能力\n（在此行上方添加自定义字段要求）';
  const scene = sceneDescription.value.trim() ? `\n当前场景：${sceneDescription.value.trim()}` : '';

  return `<system>
需要生成的字段：${fields}
${scene}

额外要求：
${extra}

输出格式（严格遵守，仅输出一组角色档案）：
<Character>
${buildOutputFormatLine(selectedFields.value)}
</Character>

格式说明：
- 属性数值范围 0~5，每项必须为整数
- 仅输出一组角色档案
</system>`;
});

// ============================================================
// Actions
// ============================================================

/** 重置生成 tab 到初始状态 */
function resetGenerateTab() {
  activeTab.value = 'list';
  genStep.value = 'config';
  previewRole.value = null;
  previewCmdString.value = '';
  sceneDescription.value = '';
  extraFieldRequirements.value = '';
  selectedFields.value = new Set(['外貌', '性格', '出身', '定位', '说话风格']);
  generationResult.value = null;
}

function selectRole(role: 角色) {
  selectedRoleId.value = role.id;
  activeTab.value = 'detail';
}

function toggleField(key: string) {
  if (selectedFields.value.has(key)) {
    selectedFields.value.delete(key);
  } else {
    selectedFields.value.add(key);
  }
  selectedFields.value = new Set(selectedFields.value);
}

// ============================================================
// Generation flow: Step 1 — AI 生成 → 预览
// ============================================================

async function handleGenerateStep1() {
  if (isGenerating.value || !isApiAvailable.value) return;
  isGenerating.value = true;
  generatingMessage.value = '正在生成角色档案…';
  previewRole.value = null;
  previewCmdString.value = '';

  try {
    const result = (await store.callSecondApi('roleProfile', {
      ordered_prompts: [
        { role: 'system', content: 'world_info' },
        { role: 'system', content: 'char_persona' },
        { role: 'system', content: 'chat_history' },
        { role: 'system', content: editablePrompt.value },
      ],
    })) as string;

    if (!result || typeof result !== 'string') {
      toastr.error('角色生成失败，请检查第二 API 是否可用');
      return;
    }

    // 解析 <Character>CMD:ADD|...</Character> 块
    const parsed = parseCharacterCMD(result);
    if (!parsed) {
      toastr.error('无法从返回内容中解析出角色，请重试');
      return;
    }

    // 转换为角色对象用于预览（不分配 ID，只预览）
    const role = fieldsToRole(parsed.fields);
    if (!role) {
      toastr.error('角色数据解析失败，请重试');
      return;
    }

    previewRole.value = role;
    previewCmdString.value = parsed.cmdString;
    genStep.value = 'preview';
  } catch (e) {
    console.error('[CharacterManagement] 生成角色失败:', e);
    toastr.error('角色生成出错：' + (e instanceof Error ? e.message : String(e)));
  } finally {
    isGenerating.value = false;
  }
}

// ============================================================
// Generation flow: Step 2 — 玩家确认 → 插入聊天 → 扫描器入库
// ============================================================

async function handleConfirmInsert() {
  if (!previewCmdString.value) return;
  isGenerating.value = true;
  generatingMessage.value = '正在插入聊天…';

  try {
    // 获取最后一条消息，追加角色 CMD
    const messages = getChatMessages('all');
    const lastMsg = messages[messages.length - 1];
    const currentContent = lastMsg?.message || '';
    const newContent = currentContent
      ? `${currentContent.trimEnd()}\n\n${previewCmdString.value}`
      : previewCmdString.value;

    setChatMessages(
      messages.map((m, i) => (i === messages.length - 1 ? { ...m, message: newContent } : m)),
    );

    // 手动触发增量扫描（从插入的消息 ID 之后开始）
    try {
      const { manualIncrementalScan } = await import('../../utils/roleScanner');
      manualIncrementalScan();
    } catch (e) {
      console.warn('[CharacterManagement] 扫描引擎手动触发失败', e);
    }

    toastr.success('角色已插入聊天并入库');

    // 重置到列表 tab，选中第一个角色
    resetGenerateTab();
    if (allRoles.value.length > 0) {
      selectedRoleId.value = allRoles.value[0].id;
      activeTab.value = 'detail';
    } else {
      activeTab.value = 'list';
    }
  } catch (e) {
    console.error('[CharacterManagement] 插入聊天失败:', e);
    toastr.error('插入聊天失败：' + (e instanceof Error ? e.message : String(e)));
  } finally {
    isGenerating.value = false;
  }
}

// ============================================================
// Detail view actions
// ============================================================

function handleEquipSkill(roleId: string, skillId: string) {
  const ok = store.equipSkill(roleId, skillId);
  if (ok) {
    const skill = store.getSkill(skillId);
    toastr.success(`技能「${skill?.名称 || skillId}」已装配`);
  } else {
    toastr.error('装配失败，角色或技能不存在');
  }
}

function handleUnequipSkill(roleId: string, skillId: string) {
  const ok = store.unequipSkill(roleId, skillId);
  if (ok) {
    const skill = store.getSkill(skillId);
    toastr.info(`技能「${skill?.名称 || skillId}」已卸下`);
  } else {
    toastr.error('卸下失败');
  }
}

function handleChangeStatus(status: string) {
  if (!selectedRole.value) return;
  const updated = klona(selectedRole.value);
  updated.状态 = status as any;
  store.updateRole(updated);
  toastr.success(`状态已更新为「${status}」`);
}

function adjustAttr(key: string, delta: number) {
  if (!selectedRole.value) return;
  const currentVal = Number(selectedRole.value.属性[key as keyof typeof selectedRole.value.属性] ?? 0);
  const newVal = Math.max(0, Math.min(5, currentVal + delta));
  if (newVal === currentVal) return;
  const updated = klona(selectedRole.value);
  updated.属性 = { ...updated.属性, [key]: newVal };
  store.updateRole(updated);
}

function startNameEdit() {
  nameEditValue.value = selectedRole.value?.姓名 || '';
  editingName.value = true;
}

function saveNameEdit() {
  if (!selectedRole.value || !nameEditValue.value.trim()) {
    editingName.value = false;
    return;
  }
  const updated = klona(selectedRole.value);
  updated.姓名 = nameEditValue.value.trim();
  store.updateRole(updated);
  editingName.value = false;
}

function cancelNameEdit() {
  editingName.value = false;
}

function startFieldEdit(key: string, currentVal: string) {
  editingField.value = key;
  fieldEditValue.value = currentVal;
}

function saveFieldEdit() {
  if (!selectedRole.value || !editingField.value) {
    editingField.value = null;
    return;
  }
  const updated = klona(selectedRole.value);
  (updated as any)[editingField.value] = fieldEditValue.value;
  store.updateRole(updated);
  editingField.value = null;
}

function cancelFieldEdit() {
  editingField.value = null;
}

function handleDeleteRole(roleId: string) {
  const role = store.getRole(roleId);
  if (!role) return;
  const name = role.姓名;
  if (!confirm(`确定要删除角色「${name}」吗？\n此操作无法撤销。`)) return;

  const currentStatus = role.状态 || '空闲';
  if (currentStatus !== '空闲' && currentStatus !== '休息中') {
    toastr.warning(`角色「${name}」当前状态为「${currentStatus}」，无法删除`);
    return;
  }

  store.deleteRole(roleId);
  selectedRoleId.value = '';
  activeTab.value = 'list';
  toastr.success(`角色「${name}」已删除`);
}

// ============================================================
// Edit state
// ============================================================
const editingName = ref(false);
const nameEditValue = ref('');
const editingField = ref<string | null>(null);
const fieldEditValue = ref('');
const generationResult = ref<角色[] | null>(null);

// ============================================================
// Skill helpers
// ============================================================
function getSkillName(skillId: string): string {
  const skill = store.getSkill(skillId);
  return skill?.名称 || skillId;
}

function getSkillEmoji(skillId: string): string {
  const skill = store.getSkill(skillId);
  return skill?.emoji || '⚡';
}

function getSkillDesc(skillId: string): string {
  const skill = store.getSkill(skillId);
  return skill?.描述 || '';
}

function getSkillMods(skillId: string): Array<{ domain: string; key: string; value: number; type: string }> {
  const skill = store.getSkill(skillId);
  if (!skill?.效果) return [];
  return skill.效果.map((e: { 域: string; 键: string; 值: number }) => ({
    domain: e.域,
    key: e.键,
    value: e.值,
    type: 'percent',
  }));
}

function formatTime(timestamp: number): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
</script>

<style scoped>
.cm-module {
  display: flex;
  flex-direction: column;
  min-height: 400px;
  max-height: calc(100vh - 180px);
  overflow: hidden;
  position: relative;
}

/* Loading overlay */
.cm-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(42, 36, 32, 0.85);
  backdrop-filter: blur(4px);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.cm-loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(139, 69, 19, 0.2);
  border-top-color: var(--theme-accent, var(--rust));
  border-radius: 50%;
  animation: cm-spin 0.8s linear infinite;
}
@keyframes cm-spin {
  to { transform: rotate(360deg); }
}
.cm-loading-text {
  font-size: 12px;
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
}

/* Tabs */
.cm-tabs {
  display: flex;
  border-bottom: 1px solid rgba(90, 79, 64, 0.3);
  flex-shrink: 0;
}
.cm-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--theme-text-muted, var(--vn-muted));
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.cm-tab:hover:not(:disabled) {
  color: var(--theme-text-main, rgba(212, 197, 160, 0.8));
}
.cm-tab:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.cm-tab-active {
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9)) !important;
  border-bottom-color: var(--theme-accent, var(--rust)) !important;
  font-weight: bold;
}
.cm-tab-badge {
  background: var(--theme-accent, var(--rust));
  color: var(--theme-fg, #fff);
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 8px;
  font-family: monospace;
}

/* Content */
.cm-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cm-content::-webkit-scrollbar { width: 4px; }
.cm-content::-webkit-scrollbar-track { background: transparent; }
.cm-content::-webkit-scrollbar-thumb { background: rgba(90, 79, 64, 0.3); border-radius: 2px; }

/* Action bar */
.cm-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(90, 79, 64, 0.15);
}
.cm-stat-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--theme-text-muted, var(--vn-muted));
}
.cm-stat-chip i {
  color: var(--theme-accent, var(--rust));
  font-size: 10px;
}

/* Buttons */
.cm-btn-primary {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: bold;
  border: 1px solid var(--theme-accent, var(--rust));
  background: rgba(139, 69, 19, 0.15);
  color: var(--theme-text-main, var(--vn-fg));
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
}
.cm-btn-primary:hover:not(:disabled) {
  background: rgba(139, 69, 19, 0.28);
  box-shadow: 0 0 8px rgba(139, 69, 19, 0.2);
}
.cm-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.cm-btn-secondary {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  font-size: 12px;
  border: 1px solid rgba(90, 79, 64, 0.4);
  background: rgba(74, 64, 53, 0.15);
  color: var(--theme-text-main, rgba(212, 197, 160, 0.8));
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
}
.cm-btn-secondary:hover:not(:disabled) {
  background: rgba(74, 64, 53, 0.25);
  border-color: rgba(90, 79, 64, 0.6);
}
.cm-btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

/* Empty state */
.cm-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 40px 0;
  color: var(--theme-text-muted, var(--vn-muted));
}
.cm-empty i { font-size: 2.5rem; opacity: 0.2; }
.cm-empty p { font-size: 14px; font-weight: bold; margin: 0; }
.cm-empty span { font-size: 11px; opacity: 0.7; }

/* Role list */
.cm-role-list { display: flex; flex-direction: column; gap: 8px; }
.cm-role-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(90, 79, 64, 0.3);
  background: rgba(74, 64, 53, 0.08);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
  position: relative;
}
.cm-role-card:hover {
  background: rgba(139, 69, 19, 0.1);
  border-color: rgba(139, 69, 19, 0.5);
}
.cm-role-selected {
  border-color: var(--theme-accent, var(--rust)) !important;
  background: rgba(139, 69, 19, 0.15) !important;
}
.cm-role-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(139, 69, 19, 0.2);
  border: 1.5px solid rgba(139, 69, 19, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: var(--theme-accent, var(--rust));
  flex-shrink: 0;
}
.cm-role-info { flex: 1; min-width: 0; }
.cm-role-name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.cm-role-name { font-size: 13px; font-weight: bold; color: var(--theme-text-main, rgba(212, 197, 160, 0.9)); }
.cm-role-attrs { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 3px; }
.cm-attr-chip {
  display: inline-block;
  font-size: 9px;
  padding: 1px 4px;
  background: rgba(90, 79, 64, 0.2);
  color: var(--theme-text-muted, var(--vn-muted));
  border-radius: 2px;
  font-family: monospace;
}
.cm-role-skills { font-size: 10px; color: var(--theme-accent, var(--rust)); margin-top: 2px; }
.cm-role-skills i { margin-right: 3px; }
.cm-role-tag {
  font-size: 9px;
  color: var(--theme-text-muted, var(--vn-muted));
  margin-top: 2px;
  padding: 1px 5px;
  border: 1px solid rgba(90, 79, 64, 0.2);
  border-radius: 2px;
  display: inline-block;
}
.cm-role-check {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--theme-accent, var(--rust));
  font-size: 12px;
}

/* Status badges */
.cm-status-badge {
  display: inline-block;
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 2px;
  font-family: monospace;
}
.cm-status-空闲 { background: rgba(90, 122, 74, 0.2); color: var(--vn-success); border: 1px solid rgba(90, 122, 74, 0.3); }
.cm-status-派遣中 { background: rgba(139, 69, 19, 0.2); color: var(--theme-accent, var(--rust)); border: 1px solid rgba(139, 69, 19, 0.3); }
.cm-status-工坊中 { background: rgba(196, 162, 101, 0.15); color: var(--stain); border: 1px solid rgba(196, 162, 101, 0.3); }
.cm-status-逃跑中 { background: rgba(199, 62, 58, 0.15); color: #c73e3a; border: 1px solid rgba(199, 62, 58, 0.3); }
.cm-status-休息中 { background: rgba(90, 79, 64, 0.2); color: var(--theme-text-muted, var(--vn-muted)); border: 1px solid rgba(90, 79, 64, 0.3); }
.cm-status-加班中 { background: rgba(199, 62, 58, 0.1); color: #c73e3a; border: 1px solid rgba(199, 62, 58, 0.25); }
.cm-status-受伤 { background: rgba(199, 62, 58, 0.1); color: #c73e3a; border: 1px solid rgba(199, 62, 58, 0.25); }

/* Back button */
.cm-back-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--theme-text-muted, var(--vn-muted));
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
  align-self: flex-start;
}
.cm-back-btn:hover { color: var(--theme-accent, var(--rust)); }

/* API warning */
.cm-api-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: rgba(139, 69, 19, 0.1);
  border: 1px solid rgba(139, 69, 19, 0.3);
  border-radius: 2px;
  color: var(--theme-text-muted, var(--vn-muted));
}
.cm-api-warning i { font-size: 1.2rem; color: var(--theme-accent, var(--rust)); flex-shrink: 0; margin-top: 2px; }
.cm-api-warning strong { font-size: 12px; color: var(--theme-text-main, rgba(212, 197, 160, 0.9)); }
.cm-api-warning p { font-size: 11px; margin: 4px 0 0; }

/* Generation form */
.cm-gen-form { display: flex; flex-direction: column; gap: 16px; }
.cm-gen-section { padding: 0; }
.cm-section { padding: 12px 0; border-bottom: 1px solid rgba(90, 79, 64, 0.15); }
.cm-section:last-child { border-bottom: none; }
.cm-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: bold;
  color: var(--theme-text-main, rgba(212, 197, 160, 0.85));
  margin-bottom: 10px;
}
.cm-section-title i { color: var(--theme-accent, var(--rust)); font-size: 10px; }
.cm-section-count {
  margin-left: auto;
  font-size: 9px;
  color: var(--theme-text-muted, var(--vn-muted));
  font-family: monospace;
  background: rgba(90, 79, 64, 0.2);
  padding: 1px 5px;
  border-radius: 2px;
}

/* Generation config */
.cm-gen-fields { margin-bottom: 12px; }
.cm-gen-hint { font-size: 11px; color: var(--theme-text-muted, var(--vn-muted)); margin-bottom: 8px; }
.cm-gen-toggles { display: flex; flex-wrap: wrap; gap: 6px; }
.cm-gen-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 11px;
  border: 1px solid rgba(90, 79, 64, 0.3);
  background: rgba(74, 64, 53, 0.1);
  color: var(--theme-text-muted, var(--vn-muted));
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
}
.cm-gen-toggle:hover { border-color: rgba(139, 69, 19, 0.4); color: var(--theme-text-main, rgba(212, 197, 160, 0.8)); }
.cm-gen-toggle-active {
  border-color: var(--theme-accent, var(--rust));
  color: var(--theme-accent, var(--rust));
  background: rgba(139, 69, 19, 0.1);
}
.cm-gen-scene { margin-bottom: 12px; }
.cm-gen-label { font-size: 11px; color: var(--theme-text-muted, var(--vn-muted)); margin-bottom: 6px; display: block; }
.cm-gen-textarea {
  width: 100%;
  padding: 8px 10px;
  font-size: 12px;
  background: rgba(74, 64, 53, 0.2);
  border: 1px solid rgba(90, 79, 64, 0.35);
  color: var(--theme-text-main, var(--vn-fg));
  border-radius: 2px;
  resize: vertical;
  outline: none;
  font-family: inherit;
}
.cm-gen-textarea:focus { border-color: rgba(139, 69, 19, 0.5); }

/* Prompt preview */
.cm-gen-preview {
  background: rgba(42, 36, 32, 0.6);
  border: 1px solid rgba(90, 79, 64, 0.2);
  border-radius: 2px;
  padding: 10px;
  max-height: 200px;
  overflow-y: auto;
}
.cm-gen-preview-text {
  font-size: 10px;
  font-family: monospace;
  color: var(--theme-text-muted, var(--vn-muted));
  white-space: pre-wrap;
  margin: 0;
  line-height: 1.6;
}
.cm-gen-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 4px 0;
}
.cm-btn-generate { padding: 10px 28px; font-size: 13px; }

/* Preview card */
.cm-preview-card {
  background: rgba(139, 69, 19, 0.06);
  border: 1px solid rgba(90, 79, 64, 0.25);
  border-radius: 2px;
  padding: 14px;
}
.cm-preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.cm-preview-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(139, 69, 19, 0.2);
  border: 1.5px solid rgba(139, 69, 19, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  color: var(--theme-accent, var(--rust));
  flex-shrink: 0;
}
.cm-preview-name {
  font-size: 15px;
  font-weight: bold;
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
}
.cm-preview-tag {
  font-size: 10px;
  color: var(--theme-text-muted, var(--vn-muted));
  padding: 1px 6px;
  border: 1px solid rgba(90, 79, 64, 0.2);
  border-radius: 2px;
  display: inline-block;
  margin-top: 3px;
}
.cm-preview-section { margin-bottom: 10px; }
.cm-preview-section-title {
  font-size: 10px;
  color: var(--theme-text-muted, var(--vn-muted));
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.cm-preview-fields { display: flex; flex-direction: column; gap: 4px; }
.cm-preview-field-item { display: flex; gap: 8px; font-size: 11px; }
.cm-preview-field-item .cm-field-label { color: var(--theme-text-muted, var(--vn-muted)); min-width: 50px; flex-shrink: 0; }
.cm-preview-field-item .cm-field-value { color: var(--theme-text-main, rgba(212, 197, 160, 0.8)); }

/* Profile header */
.cm-profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: rgba(139, 69, 19, 0.08);
  border: 1px solid rgba(90, 79, 64, 0.25);
  border-radius: 2px;
}
.cm-profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(139, 69, 19, 0.2);
  border: 2px solid rgba(139, 69, 19, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: var(--theme-accent, var(--rust));
  flex-shrink: 0;
}
.cm-profile-meta { flex: 1; min-width: 0; }
.cm-profile-name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.cm-profile-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.cm-profile-id { font-size: 9px; color: var(--theme-text-faint, rgba(139, 125, 107, 0.5)); font-family: monospace; }
.cm-name-input {
  font-size: 14px;
  font-weight: bold;
  padding: 2px 6px;
  background: rgba(74, 64, 53, 0.3);
  border: 1px solid rgba(139, 69, 19, 0.5);
  color: var(--theme-text-main, var(--vn-fg));
  border-radius: 2px;
  outline: none;
  font-family: inherit;
}
.cm-edit-icon { font-size: 10px; color: var(--theme-text-muted, var(--vn-muted)); opacity: 0; transition: opacity 0.2s; }
.cm-profile-name:hover .cm-edit-icon { opacity: 1; }
.cm-edit-icon-sm { font-size: 8px; color: var(--theme-text-muted, var(--vn-muted)); opacity: 0; transition: opacity 0.2s; margin-left: 4px; }

/* Status grid */
.cm-status-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.cm-status-btn { padding: 2px; background: transparent; border: none; cursor: pointer; border-radius: 2px; transition: all 0.2s; opacity: 0.5; }
.cm-status-btn:hover { opacity: 0.8; }
.cm-status-btn-active { opacity: 1; }

/* Attribute grid */
.cm-attr-grid { display: flex; flex-direction: column; gap: 6px; }
.cm-attr-item { display: flex; align-items: center; gap: 8px; }
.cm-attr-name { font-size: 11px; color: var(--theme-text-muted, var(--vn-muted)); width: 32px; flex-shrink: 0; font-family: monospace; }
.cm-attr-bar-wrap { flex: 1; height: 6px; background: rgba(90, 79, 64, 0.2); border-radius: 3px; overflow: hidden; }
.cm-attr-bar {
  height: 100%;
  background: linear-gradient(to right, var(--theme-accent, var(--rust)), rgba(196, 162, 101, 0.8));
  border-radius: 3px;
  transition: width 0.3s;
}
.cm-attr-val-row { display: flex; align-items: center; gap: 4px; }
.cm-attr-btn {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  border: 1px solid rgba(90, 79, 64, 0.3);
  background: rgba(74, 64, 53, 0.15);
  color: var(--theme-text-muted, var(--vn-muted));
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.15s;
}
.cm-attr-btn:hover { background: rgba(139, 69, 19, 0.2); border-color: rgba(139, 69, 19, 0.4); color: var(--theme-accent, var(--rust)); }
.cm-attr-val { font-size: 11px; color: var(--theme-accent, var(--rust)); font-family: monospace; font-weight: bold; width: 16px; text-align: center; }

/* Profile fields */
.cm-profile-fields { display: flex; flex-direction: column; gap: 6px; }
.cm-profile-field-item { display: flex; align-items: flex-start; gap: 10px; }
.cm-field-label { font-size: 10px; color: var(--theme-text-muted, var(--vn-muted)); flex-shrink: 0; min-width: 56px; font-family: monospace; }
.cm-field-value { font-size: 11px; color: var(--theme-text-main, rgba(212, 197, 160, 0.8)); flex: 1; line-height: 1.5; }
.cm-field-clickable { cursor: pointer; display: flex; align-items: flex-start; gap: 4px; }
.cm-field-clickable:hover .cm-edit-icon-sm { opacity: 1; }
.cm-field-input {
  flex: 1;
  font-size: 11px;
  padding: 2px 6px;
  background: rgba(74, 64, 53, 0.3);
  border: 1px solid rgba(139, 69, 19, 0.5);
  color: var(--theme-text-main, var(--vn-fg));
  border-radius: 2px;
  outline: none;
  font-family: inherit;
}

/* Skills */
.cm-empty-skill { font-size: 11px; color: var(--theme-text-muted, var(--vn-muted)); padding: 8px 0; font-style: italic; }
.cm-skill-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.cm-skill-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 8px 10px;
  background: rgba(74, 64, 53, 0.1);
  border: 1px solid rgba(90, 79, 64, 0.2);
  border-radius: 2px;
  gap: 8px;
}
.cm-skill-icon { font-size: 16px; flex-shrink: 0; }
.cm-skill-info { flex: 1; min-width: 0; }
.cm-skill-name { font-size: 12px; font-weight: bold; color: var(--theme-text-main, rgba(212, 197, 160, 0.9)); }
.cm-skill-desc { font-size: 10px; color: var(--theme-text-muted, var(--vn-muted)); margin-top: 2px; }
.cm-skill-mods { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 4px; }
.cm-mod-tag {
  font-size: 9px;
  padding: 1px 4px;
  background: rgba(90, 122, 74, 0.1);
  color: var(--vn-success);
  border: 1px solid rgba(90, 122, 74, 0.2);
  border-radius: 2px;
  font-family: monospace;
}
.cm-btn-unequip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  padding: 4px 8px;
  border: 1px solid rgba(199, 62, 58, 0.3);
  background: rgba(199, 62, 58, 0.08);
  color: #c73e3a;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}
.cm-btn-unequip:hover { background: rgba(199, 62, 58, 0.18); }

/* Equip section */
.cm-equip-section {
  padding: 10px;
  background: rgba(90, 122, 74, 0.06);
  border: 1px dashed rgba(90, 122, 74, 0.25);
  border-radius: 2px;
}
.cm-equip-header {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--vn-success);
  margin-bottom: 8px;
  font-weight: bold;
}
.cm-no-skills { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--theme-text-muted, var(--vn-muted)); padding: 8px 0; }
.cm-skill-pool { display: flex; flex-wrap: wrap; gap: 6px; }
.cm-skill-pool-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: 1px solid rgba(90, 79, 64, 0.25);
  background: rgba(74, 64, 53, 0.08);
  border-radius: 2px;
  font-size: 11px;
  color: var(--theme-text-main, rgba(212, 197, 160, 0.85));
  cursor: pointer;
  transition: all 0.2s;
}
.cm-skill-pool-item:hover { background: rgba(90, 122, 74, 0.12); border-color: rgba(90, 122, 74, 0.4); }
.cm-skill-pool-emoji { font-size: 13px; }
.cm-skill-pool-name { font-size: 11px; }
.cm-skill-pool-add { color: var(--vn-success); font-size: 9px; margin-left: 3px; }

/* Records */
.cm-record-list { display: flex; flex-direction: column; gap: 8px; }
.cm-record-group { }
.cm-record-group-header {
  font-size: 10px;
  color: var(--theme-text-muted, var(--vn-muted));
  padding: 0 4px;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.cm-record-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(74, 64, 53, 0.05);
  border: 1px solid rgba(90, 79, 64, 0.12);
  border-radius: 2px;
  font-size: 11px;
}
.cm-record-content { flex: 1; color: var(--theme-text-main, rgba(212, 197, 160, 0.8)); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cm-record-time { font-size: 9px; color: var(--theme-text-faint, rgba(139, 125, 107, 0.5)); flex-shrink: 0; font-family: monospace; }

/* Danger zone */
.cm-danger-zone { border-top: 1px solid rgba(199, 62, 58, 0.15); margin-top: 8px; padding-top: 12px; }
.cm-danger-title { color: #c73e3a !important; }
.cm-danger-title i { color: #c73e3a !important; }
.cm-btn-danger {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  font-size: 12px;
  border: 1px solid rgba(199, 62, 58, 0.4);
  background: rgba(199, 62, 58, 0.08);
  color: #c73e3a;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
}
.cm-btn-danger:hover { background: rgba(199, 62, 58, 0.18); }
</style>
