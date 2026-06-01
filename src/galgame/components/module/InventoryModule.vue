<template>
  <div class="im-module">
    <!-- Tab navigation -->
    <div class="im-tabs">
      <button
        class="im-tab"
        :class="{ 'im-tab-active': activeTab === 'items' }"
        @click="activeTab = 'items'"
      >
        <i class="fa-solid fa-box" />
        道具
        <span v-if="store.inventory.length > 0" class="im-tab-badge">
          {{ totalItemCount }}
        </span>
      </button>
      <button
        class="im-tab"
        :class="{ 'im-tab-active': activeTab === 'equipment' }"
        @click="activeTab = 'equipment'"
      >
        <i class="fa-solid fa-wand-magic-sparkles" />
        角色装备
        <span v-if="store.skillsInventory.length > 0" class="im-tab-badge">
          {{ store.skillsInventory.length }}
        </span>
      </button>
    </div>

    <!-- Content -->
    <div class="im-content">

      <!-- ====== Items Tab ====== -->
      <div v-show="activeTab === 'items'">
        <div v-if="store.inventory.length === 0" class="im-empty">
          <i class="fa-solid fa-box-open" />
          <p>背包空空如也</p>
          <span>前往商店购买物品</span>
        </div>

        <div v-else class="im-items-area">
          <!-- Grid -->
          <div class="im-item-grid">
            <button
              v-for="item in store.inventory"
              :key="item.name"
              class="im-item-cell"
              :class="{ 'im-item-selected': selectedItemName === item.name }"
              @click="selectedItemName = item.name"
            >
              <div class="im-item-icon">
                <span v-if="item.icon" class="im-item-emoji">{{ item.icon }}</span>
                <i v-else class="fa-solid fa-cube" style="color: rgba(139,69,19,0.3)" />
              </div>
              <div class="im-item-name">{{ item.name }}</div>
              <div class="im-item-qty">x{{ item.quantity }}</div>
            </button>
          </div>

          <!-- Detail panel -->
          <div class="im-detail-panel">
            <div v-if="!selectedItem" class="im-detail-hint">
              点击物品查看详情
            </div>
            <div v-else class="im-detail-content">
              <div class="im-detail-icon">
                <span v-if="selectedItem.icon" class="im-detail-emoji">{{ selectedItem.icon }}</span>
                <i v-else class="fa-solid fa-cube" style="color: rgba(139,69,19,0.4); font-size: 1.5rem" />
              </div>
              <div class="im-detail-info">
                <div class="im-detail-name-row">
                  <span class="im-detail-name">{{ selectedItem.name }}</span>
                  <span class="im-detail-qty">x{{ selectedItem.quantity }}</span>
                </div>
                <p class="im-detail-effect">{{ selectedItem.effect }}</p>
              </div>
            </div>
          </div>

          <!-- Footer count -->
          <div class="im-footer-count">
            共 {{ totalItemCount }} 件物品
          </div>
        </div>
      </div>

      <!-- ====== Equipment Tab ====== -->
      <div v-show="activeTab === 'equipment'">
        <div v-if="store.skillsInventory.length === 0" class="im-empty">
          <i class="fa-solid fa-wand-magic-sparkles" />
          <p>暂无角色装备</p>
          <span>在商店购买技能后可在此查看</span>
        </div>

        <div v-else class="im-skill-list">
          <div class="im-skill-hint">
            <i class="fa-solid fa-circle-info" />
            已购买的技能，可装备给角色
          </div>

          <div
            v-for="skill in store.skillsInventory"
            :key="skill.id"
            class="im-skill-card"
          >
            <div class="im-skill-header">
              <div class="im-skill-avatar">
                <span v-if="skill.emoji" class="im-skill-emoji">{{ skill.emoji }}</span>
                <i v-else class="fa-solid fa-wand-magic-sparkles" style="color: rgba(139,69,19,0.4); font-size: 1rem" />
              </div>
              <div class="im-skill-meta">
                <div class="im-skill-name">{{ skill.名称 }}</div>
                <div v-if="skill.效果?.length" class="im-skill-mods">
                  <span
                    v-for="eff in skill.效果"
                    :key="`${eff.域}.${eff.键}`"
                    class="im-mod-chip"
                  >
                    {{ eff.域 }}.{{ eff.键 }}+{{ eff.值 }}
                  </span>
                </div>
              </div>
            </div>
            <div class="im-skill-desc">{{ skill.描述 }}</div>
            <div v-if="getEquippedByRole(skill.名称)" class="im-skill-equipped">
              <i class="fa-solid fa-check-circle" />
              已装备于「{{ getEquippedByRole(skill.名称) }}」
            </div>
            <div v-else class="im-skill-not-equipped">
              <i class="fa-solid fa-circle" />
              未装备
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useVNStore } from '../../store';

const store = useVNStore();

const activeTab = ref<'items' | 'equipment'>('items');
const selectedItemName = ref<string>('');

const totalItemCount = computed(() =>
  store.inventory.reduce((s, i) => s + i.quantity, 0),
);

const selectedItem = computed(() =>
  store.inventory.find(i => i.name === selectedItemName.value) ?? null,
);

// Auto-select first item when inventory loads
if (store.inventory.length > 0) {
  selectedItemName.value = store.inventory[0]!.name;
}

function getEquippedByRole(skillName: string): string | null {
  for (const role of store.getAllRoles()) {
    if (role.已装备技能?.includes(skillName)) {
      return role.姓名;
    }
  }
  return null;
}
</script>

<style scoped>
.im-module {
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: calc(100vh - 180px);
  overflow: hidden;
}

/* Tabs */
.im-tabs {
  display: flex;
  border-bottom: 1px solid rgba(90, 79, 64, 0.3);
  flex-shrink: 0;
}
.im-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 10px 8px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--theme-text-muted, var(--vn-muted));
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.im-tab:hover { color: var(--theme-text-main, rgba(212, 197, 160, 0.8)); }
.im-tab-active {
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9)) !important;
  border-bottom-color: var(--theme-accent, var(--rust)) !important;
  font-weight: bold;
}
.im-tab i { font-size: 10px; }
.im-tab-badge {
  background: var(--theme-accent, var(--rust));
  color: var(--theme-fg, #fff);
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 8px;
  font-family: monospace;
}

/* Content */
.im-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

/* Empty */
.im-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 50px 0;
  color: var(--theme-text-muted, var(--vn-muted));
}
.im-empty i { font-size: 2.5rem; opacity: 0.2; }
.im-empty p { font-size: 14px; font-weight: bold; margin: 0; }
.im-empty span { font-size: 11px; opacity: 0.6; }

/* Items */
.im-items-area { display: flex; flex-direction: column; gap: 10px; }
.im-item-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.im-item-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 4px;
  border: 1px solid rgba(90, 79, 64, 0.2);
  background: rgba(74, 64, 53, 0.08);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}
.im-item-cell:hover { background: rgba(139, 69, 19, 0.1); border-color: rgba(139, 69, 19, 0.4); }
.im-item-selected {
  border-color: rgba(196, 162, 101, 0.55) !important;
  background: rgba(139, 69, 19, 0.12) !important;
}
.im-item-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(74, 64, 53, 0.16);
  border: 1px solid rgba(90, 79, 64, 0.28);
  border-radius: 2px;
}
.im-item-emoji { font-size: 1.5rem; }
.im-item-name {
  font-size: 9px;
  color: var(--theme-text-main, rgba(212, 197, 160, 0.92));
  text-align: center;
  line-height: 1.3;
  word-break: break-all;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  width: 100%;
}
.im-item-qty {
  font-size: 9px;
  font-family: monospace;
  color: var(--theme-accent, var(--rust));
}

/* Detail panel */
.im-detail-panel {
  padding: 10px;
  background: rgba(74, 64, 53, 0.08);
  border: 1px solid rgba(90, 79, 64, 0.2);
  border-radius: 2px;
}
.im-detail-hint {
  font-size: 11px;
  color: var(--theme-text-muted, var(--vn-muted));
  text-align: center;
  padding: 8px 0;
}
.im-detail-content { display: flex; align-items: flex-start; gap: 10px; }
.im-detail-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(74, 64, 53, 0.2);
  border: 1px solid rgba(90, 79, 64, 0.3);
  border-radius: 2px;
  flex-shrink: 0;
}
.im-detail-emoji { font-size: 1.8rem; }
.im-detail-name-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.im-detail-name { font-size: 13px; font-weight: bold; color: var(--theme-text-main, rgba(212, 197, 160, 0.92)); }
.im-detail-qty { font-size: 11px; font-family: monospace; color: var(--theme-accent, var(--rust)); }
.im-detail-effect { font-size: 11px; color: var(--theme-text-muted, var(--vn-muted)); line-height: 1.5; margin: 0; }

/* Footer */
.im-footer-count {
  text-align: center;
  font-size: 9px;
  color: var(--theme-text-muted, var(--vn-muted));
  font-family: monospace;
  padding-top: 6px;
  border-top: 1px solid rgba(90, 79, 64, 0.1);
}

/* Skills */
.im-skill-list { display: flex; flex-direction: column; gap: 8px; }
.im-skill-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--theme-text-muted, var(--vn-muted));
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(90, 79, 64, 0.1);
}
.im-skill-hint i { color: var(--theme-accent, var(--rust)); font-size: 10px; }
.im-skill-card {
  padding: 10px;
  background: rgba(74, 64, 53, 0.08);
  border: 1px solid rgba(90, 79, 64, 0.25);
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.im-skill-header { display: flex; align-items: flex-start; gap: 8px; }
.im-skill-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 69, 19, 0.15);
  border: 1px solid rgba(139, 69, 19, 0.3);
  border-radius: 2px;
  flex-shrink: 0;
}
.im-skill-emoji { font-size: 1.3rem; }
.im-skill-meta { flex: 1; min-width: 0; }
.im-skill-name { font-size: 12px; font-weight: bold; color: var(--theme-text-main, rgba(212, 197, 160, 0.92)); margin-bottom: 3px; }
.im-skill-mods { display: flex; flex-wrap: wrap; gap: 3px; }
.im-mod-chip {
  font-size: 8px;
  padding: 1px 5px;
  background: rgba(139, 69, 19, 0.15);
  border: 1px solid rgba(139, 69, 19, 0.3);
  color: var(--theme-accent, var(--rust));
  border-radius: 2px;
  font-family: monospace;
}
.im-skill-desc { font-size: 10px; color: var(--theme-text-muted, var(--vn-muted)); line-height: 1.5; }
.im-skill-equipped { font-size: 10px; color: var(--vn-success); }
.im-skill-equipped i { margin-right: 4px; }
.im-skill-not-equipped { font-size: 10px; color: var(--theme-text-muted, var(--vn-muted)); }
.im-skill-not-equipped i { margin-right: 4px; }
</style>
