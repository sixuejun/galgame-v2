<!--
  StatusSidebar 组件

  状态侧边栏组件，显示玩家状态信息。

  功能：
  - 多标签页切换（状态、背包、成就）
  - 显示玩家基本信息（名称、等级、经验）
  - 显示玩家属性（生命、魔法、体力等）
  - 显示货币和背包物品
  - 显示成就列表
  - 可折叠/展开
  - 响应式布局
  - 无障碍支持

  Props:
  - player (Player): 玩家数据对象
  - isCollapsed (boolean): 是否折叠

  Emits:
  - toggle(): 切换折叠状态时触发
-->
<template>
  <div :class="['status-sidebar', { collapsed: isCollapsed }]">
    <!-- 桌面端切换按钮 -->
    <button class="sidebar-toggle-desktop" aria-label="切换侧边栏" @click="$emit('toggle')">
      <i :class="['fas', isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left']"></i>
    </button>

    <div class="sidebar-content">
      <div
        v-for="(tab, key) in tabs"
        :key="key"
        :class="['sidebar-item', { active: activeTab === tab.id }]"
        @click="$emit('selectTab', tab.id)"
      >
        <div class="sidebar-item-icon">
          <Icon :icon-data="tab.icon || 'fa-user-circle'" :alt="`${tab.name}图标`" />
        </div>
        <div v-if="!isCollapsed" class="sidebar-item-content">
          <div class="sidebar-item-name">{{ tab.name }}</div>
          <div class="sidebar-item-status">查看详情</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '../../common/Icon.vue'

interface Tab {
  id: string
  name: string
  icon?: string
}

defineProps<{
  tabs: { [key: string]: Tab }
  activeTab: string
  isCollapsed: boolean
}>()

defineEmits<{
  toggle: []
  selectTab: [tabId: string]
}>()
</script>

<style scoped>
/* 侧边栏样式 */
.status-sidebar {
  width: 280px;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--gray-200);
  transition: all var(--transition-base) ease;
  position: relative;
  overflow: hidden;
}

.status-sidebar.collapsed {
  width: 80px;
}

/* 桌面端切换按钮 */
.sidebar-toggle-desktop {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-sm);
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  border: none;
  border-radius: var(--radius-full);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base) ease;
  box-shadow: var(--shadow-sm);
  z-index: 10;
}

.sidebar-toggle-desktop:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

.sidebar-content {
  padding: var(--spacing-lg) 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  transition: all var(--transition-base) ease;
  position: relative;
  overflow: hidden;
}

.sidebar-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  transform: scaleY(0);
  transition: transform var(--transition-base) ease;
}

.sidebar-item:hover {
  background: linear-gradient(90deg, rgba(0, 128, 255, 0.05), transparent);
}

.sidebar-item.active {
  background: linear-gradient(90deg, rgba(0, 128, 255, 0.1), transparent);
}

.sidebar-item.active::before {
  transform: scaleY(1);
}

.sidebar-item-icon {
  font-size: var(--text-2xl);
  color: var(--primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgba(0, 128, 255, 0.1), rgba(0, 191, 255, 0.05));
  border-radius: var(--radius-lg);
  transition: all var(--transition-base) ease;
}

.sidebar-item:hover .sidebar-item-icon {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 128, 255, 0.2);
}

.sidebar-item.active .sidebar-item-icon {
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  color: white;
  box-shadow: 0 4px 12px rgba(0, 128, 255, 0.3);
}

.sidebar-item-content {
  flex: 1;
  min-width: 0;
}

.sidebar-item-name {
  font-weight: var(--font-semibold);
  color: var(--text-dark);
  font-size: var(--text-base);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-item-status {
  font-size: var(--text-xs);
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-item.active .sidebar-item-name {
  color: var(--primary-blue);
}

.sidebar-item.active .sidebar-item-status {
  color: var(--secondary-blue);
}

/* 响应式设计 - 移动端抽屉式侧边栏 */
@media (max-width: 768px) {
  /* 隐藏桌面端切换按钮 */
  .sidebar-toggle-desktop {
    display: none;
  }

  /* 侧边栏 - 抽屉式 */
  .status-sidebar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 280px;
    height: 100%;
    z-index: 10;
    border-radius: 0 var(--radius-xl) var(--radius-xl) 0;
    transition: transform var(--transition-base) ease;
  }

  /* 折叠状态 - 隐藏在左侧 */
  .status-sidebar.collapsed {
    width: 280px;
    transform: translateX(-100%);
  }

  /* 展开状态 - 显示侧边栏 */
  .status-sidebar:not(.collapsed) {
    transform: translateX(0);
  }
}

/* 超小屏优化 */
@media (max-width: 480px) {
  .status-sidebar {
    width: 260px;
  }

  .status-sidebar.collapsed {
    width: 260px;
  }
}

/* 极小屏优化 */
@media (max-width: 360px) {
  .status-sidebar {
    width: calc(100vw - 40px);
    max-width: 240px;
  }

  .status-sidebar.collapsed {
    width: calc(100vw - 40px);
    max-width: 240px;
  }
}
</style>
