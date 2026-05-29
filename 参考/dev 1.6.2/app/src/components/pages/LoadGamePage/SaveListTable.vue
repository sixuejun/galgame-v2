<!--
  SaveListTable 组件

  存档列表表格组件，以表格形式显示存档列表。

  功能：
  - 显示存档列表（槽位、时间、操作）
  - 支持加载和删除存档
  - 空状态提示
  - 分页显示

  Props:
  - paginatedSaves (SaveSlot[]): 分页后的存档列表

  Emits:
  - load(slotId: number): 加载存档时触发
  - delete(slotId: number): 删除存档时触发
-->
<template>
  <div class="saves-table">
    <!-- 桌面端表格视图 -->
    <table class="desktop-table">
      <thead>
        <tr>
          <th>存档名称</th>
          <th>存档类型</th>
          <th>游戏阶段</th>
          <th>存档时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="save in saves" :key="save.name" class="save-row">
          <td class="save-name">
            <i class="fas" :class="getSaveIcon(save.saveType)"></i>
            {{ save.name }}
          </td>
          <td class="save-type">
            <span class="type-badge" :class="`type-${save.saveType}`">
              {{ getSaveTypeText(save.saveType) }}
            </span>
          </td>
          <td class="save-phase">{{ save.phase || '-' }}</td>
          <td class="save-time">{{ formatTime(save.saveTime) }}</td>
          <td class="save-actions">
            <button
              class="action-btn load-btn"
              :disabled="isOperating"
              :aria-disabled="isOperating"
              :aria-label="`读取存档 ${save.name}`"
              title="读取此存档"
              @click="$emit('load', save.name)"
            >
              <i class="fas fa-upload" aria-hidden="true"></i>
              读取
            </button>
            <button
              class="action-btn export-btn"
              :disabled="isOperating"
              :aria-disabled="isOperating"
              :aria-label="`导出存档 ${save.name}`"
              title="导出此存档"
              @click="$emit('export', save.name)"
            >
              <i class="fas fa-download" aria-hidden="true"></i>
              导出
            </button>
            <button
              v-if="save.saveType !== 'init'"
              class="action-btn delete-btn"
              :disabled="isOperating"
              :aria-disabled="isOperating"
              :aria-label="`删除存档 ${save.name}`"
              title="删除此存档"
              @click="$emit('delete', save.name)"
            >
              <i class="fas fa-trash" aria-hidden="true"></i>
              删除
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 移动端卡片视图 -->
    <div class="mobile-cards">
      <div v-for="save in saves" :key="save.name" class="save-card">
        <div class="card-header">
          <div class="card-title">
            <i class="fas" :class="getSaveIcon(save.saveType)"></i>
            <span class="save-name-text">{{ save.name }}</span>
          </div>
          <span class="type-badge" :class="`type-${save.saveType}`">
            {{ getSaveTypeText(save.saveType) }}
          </span>
        </div>

        <div class="card-info">
          <div class="info-item">
            <span class="info-label">游戏阶段:</span>
            <span class="info-value">{{ save.phase || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">存档时间:</span>
            <span class="info-value">{{ formatTime(save.saveTime) }}</span>
          </div>
        </div>

        <div class="card-actions">
          <button
            class="action-btn load-btn"
            :disabled="isOperating"
            :aria-disabled="isOperating"
            :aria-label="`读取存档 ${save.name}`"
            @click="$emit('load', save.name)"
          >
            <i class="fas fa-upload" aria-hidden="true"></i>
            <span>读取</span>
          </button>
          <button
            class="action-btn export-btn"
            :disabled="isOperating"
            :aria-disabled="isOperating"
            :aria-label="`导出存档 ${save.name}`"
            @click="$emit('export', save.name)"
          >
            <i class="fas fa-download" aria-hidden="true"></i>
            <span>导出</span>
          </button>
          <button
            v-if="save.saveType !== 'init'"
            class="action-btn delete-btn"
            :disabled="isOperating"
            :aria-disabled="isOperating"
            :aria-label="`删除存档 ${save.name}`"
            @click="$emit('delete', save.name)"
          >
            <i class="fas fa-trash" aria-hidden="true"></i>
            <span>删除</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SaveInfo } from '../../../services/worldbook'

// Props
defineProps<{
  saves: SaveInfo[]
  isOperating: boolean
  getSaveIcon: (saveType: string) => string
  getSaveTypeText: (saveType: string) => string
  formatTime: (timeStr: string) => string
}>()

// Emits
defineEmits<{
  load: [saveName: string]
  export: [saveName: string]
  delete: [saveName: string]
}>()
</script>

<style scoped>
.saves-table {
  overflow-x: auto;
  margin-bottom: var(--spacing-lg);
}

/* 桌面端表格 - 默认显示 */
.desktop-table {
  width: 100%;
  border-collapse: collapse;
  display: table;
}

/* 移动端卡片 - 默认隐藏 */
.mobile-cards {
  display: none;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: rgba(0, 128, 255, 0.1);
}

th {
  padding: var(--spacing-md);
  text-align: left;
  font-weight: var(--font-semibold);
  color: var(--primary-blue);
  border-bottom: 2px solid rgba(0, 128, 255, 0.3);
  white-space: nowrap;
}

tbody tr {
  border-bottom: 1px solid rgba(0, 128, 255, 0.1);
  transition: background-color var(--transition-base);
}

tbody tr:hover {
  background: rgba(0, 128, 255, 0.05);
}

td {
  padding: var(--spacing-md);
  color: var(--text-primary);
}

.save-name {
  font-weight: var(--font-medium);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.save-name i {
  color: var(--primary-blue);
}

.save-type {
  white-space: nowrap;
}

.type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

.type-auto {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.type-manual {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.type-init {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}

.save-phase {
  color: var(--text-secondary);
}

.save-time {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  white-space: nowrap;
}

.save-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.action-btn {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  border: 1px solid;
  cursor: pointer;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all var(--transition-base);
  white-space: nowrap;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.load-btn {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border-color: #4ade80;
  color: white;
}

.load-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #16a34a, #15803d);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
}

.export-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: #60a5fa;
  color: white;
}

.export-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

.delete-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border-color: #f87171;
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
}

/* ========================================
   移动端卡片样式
   ======================================== */
.save-card {
  background: white;
  border: 1px solid rgba(0, 128, 255, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  transition: all var(--transition-base);
}

.save-card:hover {
  border-color: rgba(0, 128, 255, 0.4);
  box-shadow: 0 2px 8px rgba(0, 128, 255, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-sm);
}

.card-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  min-width: 0;
}

.card-title i {
  color: var(--primary-blue);
  flex-shrink: 0;
}

.save-name-text {
  font-weight: var(--font-medium);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm);
  background: rgba(0, 128, 255, 0.05);
  border-radius: var(--radius-md);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
}

.info-label {
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

.info-value {
  color: var(--text-primary);
}

.card-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.card-actions .action-btn {
  flex: 1;
  min-width: 0;
  justify-content: center;
}

/* ========================================
   响应式设计
   ======================================== */

/* 平板端 (≤1024px) */
@media (max-width: 1024px) {
  th,
  td {
    padding: var(--spacing-sm);
    font-size: var(--text-sm);
  }

  .action-btn {
    padding: 5px 10px;
    font-size: var(--text-xs);
    gap: 3px;
  }
}

/* 移动端 (≤768px) - 切换到卡片布局 */
@media (max-width: 768px) {
  /* 隐藏桌面端表格 */
  .desktop-table {
    display: none;
  }

  /* 显示移动端卡片 */
  .mobile-cards {
    display: block;
  }

  .saves-table {
    overflow-x: visible;
    margin-bottom: var(--spacing-md);
  }

  .save-card {
    padding: var(--spacing-sm);
  }

  .card-header {
    margin-bottom: var(--spacing-sm);
  }

  .card-info {
    margin-bottom: var(--spacing-sm);
    padding: var(--spacing-xs);
  }

  .info-item {
    font-size: var(--text-xs);
  }

  .card-actions {
    gap: var(--spacing-xs);
  }

  .card-actions .action-btn {
    padding: 8px 12px;
    font-size: var(--text-sm);
  }
}

/* 小屏幕 (≤480px) */
@media (max-width: 480px) {
  .save-card {
    padding: var(--spacing-xs);
    margin-bottom: var(--spacing-sm);
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .card-title {
    width: 100%;
  }

  .save-name-text {
    font-size: var(--text-sm);
  }

  .type-badge {
    padding: 3px 10px;
    font-size: 0.65rem;
  }

  .card-info {
    gap: 6px;
    padding: 6px;
  }

  .info-item {
    font-size: 0.7rem;
  }

  .card-actions {
    flex-direction: column;
    gap: 6px;
  }

  .card-actions .action-btn {
    width: 100%;
    padding: 10px;
    font-size: var(--text-sm);
  }
}
</style>
