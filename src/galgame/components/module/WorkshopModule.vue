<template>
  <div class="px-5 py-4">
    <!-- Header: Workshop level & gold -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <span class="text-sm font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">
          工坊等级 {{ store.workshopLevel }}
        </span>
        <span
          v-if="store.workshopLevel < 10"
          style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted)); margin-left: 8px"
        >
          升级加成: {{ (store.workshopLevel - 1) * 10 }}%
        </span>
        <span v-else style="font-size: 9px; color: var(--theme-accent, var(--rust)); margin-left: 8px">已满级</span>
      </div>
      <div class="flex items-center gap-3">
        <div class="gold-counter">
          <i class="fa-solid fa-coins" style="font-size: 0.7rem" />
          <span class="font-bold">{{ store.gold }}</span>
        </div>
        <button
          v-if="store.workshopLevel < 10"
          class="flex items-center gap-1.5 px-2.5 py-1 border text-xs cursor-pointer transition-all"
          :style="{
            borderColor: canUpgrade ? 'var(--theme-accent, var(--rust))' : 'rgba(90,79,64,0.2)',
            color: canUpgrade ? 'var(--theme-text-main, var(--vn-fg))' : 'var(--theme-text-muted, var(--vn-muted))',
            background: canUpgrade ? 'rgba(139,69,19,0.15)' : 'transparent',
            borderRadius: '2px',
            opacity: canUpgrade ? 1 : 0.5,
          }"
          @click="handleUpgrade"
        >
          <i class="fa-solid fa-arrow-up" style="font-size: 0.6rem" />
          <span>升级 ({{ upgradeCost }}G)</span>
        </button>
      </div>
    </div>

    <!-- Level bar -->
    <div class="mb-4 h-1.5" style="background: rgba(90, 79, 64, 0.3); border-radius: 1px">
      <div
        class="h-full transition-all duration-300"
        :style="{
          width: store.workshopLevel * 10 + '%',
          background: 'var(--theme-accent, var(--rust))',
          borderRadius: '1px',
        }"
      />
    </div>

    <!-- Tab Navigation -->
    <div class="flex border-b mb-4" style="border-color: rgba(90,79,64,0.2)">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="px-4 py-2 text-xs cursor-pointer transition-all relative"
        :style="{
          color: activeTab === tab.id ? 'var(--theme-text-main, rgba(212, 197, 160, 0.9))' : 'var(--theme-text-muted, var(--vn-muted))',
          borderBottom: activeTab === tab.id ? '2px solid var(--theme-accent, var(--rust))' : '2px solid transparent',
          fontWeight: activeTab === tab.id ? 'bold' : 'normal',
        }"
        @click="activeTab = tab.id"
      >
        <i :class="tab.icon" style="margin-right: 4px; font-size: 0.65rem" />
        {{ tab.label }}
        <span
          v-if="tab.id === 'orders' && pendingOrders.length > 0"
          class="ml-1 px-1 py-0.5 text-xs"
          style="background: var(--theme-accent, var(--rust)); color: var(--theme-fg, #1a1a1a); border-radius: 2px; font-size: 9px"
        >
          {{ pendingOrders.length }}
        </span>
      </button>
    </div>

    <!-- ====== Tab: 订单 (Orders) ====== -->
    <div v-show="activeTab === 'orders'">
      <!-- Refresh Orders Bar -->
      <div class="flex items-center justify-between mb-3">
        <span style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted))">
          当前订单 ({{ pendingOrders.length }})
        </span>
        <button
          class="flex items-center gap-2 px-3 py-1.5 border text-xs cursor-pointer transition-all"
          :style="{
            borderColor: isGenerating ? 'rgba(90,79,64,0.2)' : 'var(--theme-accent, var(--rust))',
            background: isGenerating ? 'transparent' : 'rgba(139,69,19,0.15)',
            color: isGenerating ? 'var(--theme-text-muted, var(--vn-muted))' : 'var(--theme-text-main, var(--vn-fg))',
            borderRadius: '2px',
            opacity: isGenerating ? 0.6 : 1,
          }"
          :disabled="isGenerating"
          @click="handleRefreshOrders"
        >
          <i class="fa-solid fa-rotate" :class="{ 'fa-spin': isGenerating }" style="font-size: 0.7rem" />
          <span>{{ isGenerating ? '生成中…' : '刷新订单' }}</span>
        </button>
      </div>

      <!-- Order Cards -->
      <div v-if="pendingOrders.length === 0 && !isGenerating" class="text-center py-8">
        <i class="fa-solid fa-clipboard-list" style="font-size: 2rem; color: rgba(139, 125, 107, 0.2); margin-bottom: 8px" />
        <p style="font-size: 11px; color: var(--theme-text-muted, var(--vn-muted))">
          暂无订单，点击刷新获取新订单
        </p>
      </div>

      <div v-else class="flex flex-col gap-2">
        <div
          v-for="order in pendingOrders"
          :key="order.名称"
          class="module-card p-3"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="px-2 py-0.5 text-xs"
                  :style="{
                    background: getWorkTypeColor(order.技能类型),
                    color: '#fff',
                    borderRadius: '2px',
                    fontSize: '9px',
                  }"
                >
                  {{ order.技能类型 }}
                </span>
                <span class="text-sm font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">
                  {{ order.名称 }}
                </span>
              </div>
              <p style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted))">
                {{ order.描述 }}
              </p>
              <div v-if="order.建议属性" class="flex items-center gap-1 mt-1" style="font-size: 9px; color: var(--theme-text-faint, rgba(139, 125, 107, 0.6))">
                <i class="fa-solid fa-star" style="font-size: 0.55rem" />
                <span>建议属性: {{ order.建议属性 }}</span>
              </div>
            </div>
            <div class="text-right shrink-0 ml-3">
              <div class="font-mono font-bold" style="font-size: 12px; color: var(--theme-accent, var(--rust))">
                ~{{ order.预计价格 }}G
              </div>
              <div style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted))">
                预计价格
              </div>
            </div>
          </div>

          <!-- Order Actions -->
          <div class="flex items-center justify-between mt-2 pt-2" style="border-top: 1px solid rgba(90,79,64,0.15)">
            <div class="flex gap-2">
              <button
                class="px-2.5 py-1 border text-xs cursor-pointer transition-all"
                style="border-color: var(--theme-accent, var(--rust)); color: var(--theme-text-main, var(--vn-fg)); border-radius: 2px"
                @click="openOrderDetail(order)"
              >
                <i class="fa-solid fa-eye" style="margin-right: 3px; font-size: 0.6rem" />
                预览
              </button>
              <button
                class="px-2.5 py-1 border text-xs cursor-pointer transition-all"
                style="border-color: rgba(90,79,64,0.3); color: var(--theme-text-muted, var(--vn-muted)); border-radius: 2px"
                @click="handleDismissOrder(order)"
              >
                略过
              </button>
            </div>
            <button
              class="px-3 py-1 text-xs cursor-pointer transition-all"
              :style="{
                background: 'var(--theme-accent, var(--rust))',
                color: '#fff',
                borderRadius: '2px',
                opacity: store.gold >= 30 ? 1 : 0.5,
              }"
              :disabled="store.gold < 30"
              @click="handleAcceptOrder(order)"
            >
              接受订单
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ====== Tab: 商店 (Shop) ====== -->
    <div v-show="activeTab === 'shop'">
      <div class="flex items-center justify-between mb-3">
        <span style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted))">
          技能库 ({{ inventorySkills.length }})
        </span>
        <button
          class="flex items-center gap-2 px-3 py-1.5 border text-xs cursor-pointer transition-all"
          :style="{
            borderColor: 'var(--theme-accent, var(--rust))',
            background: 'rgba(139,69,19,0.15)',
            color: 'var(--theme-text-main, var(--vn-fg))',
            borderRadius: '2px',
          }"
          @click="handleGenerateSkill"
        >
          <i class="fa-solid fa-wand-magic-sparkles" style="font-size: 0.7rem" />
          <span>生成技能</span>
        </button>
      </div>

      <div v-if="inventorySkills.length === 0 && !isGeneratingSkill" class="text-center py-8">
        <i class="fa-solid fa-toolbox" style="font-size: 2rem; color: rgba(139, 125, 107, 0.2); margin-bottom: 8px" />
        <p style="font-size: 11px; color: var(--theme-text-muted, var(--vn-muted))">
          技能库为空，点击生成新技能
        </p>
      </div>

      <div v-else class="flex flex-col gap-2">
        <div
          v-for="skill in inventorySkills"
          :key="skill.id"
          class="module-card p-3"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span v-if="skill.emoji" style="font-size: 1rem">{{ skill.emoji }}</span>
                <span class="text-sm font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">
                  {{ skill.名称 }}
                </span>
              </div>
              <p v-if="skill.描述" style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted))">
                {{ skill.描述 }}
              </p>
              <!-- Skill Effects -->
              <div v-if="skill.效果 && skill.效果.length > 0" class="flex flex-wrap gap-1 mt-2">
                <span
                  v-for="(effect, idx) in skill.效果"
                  :key="idx"
                  class="px-1.5 py-0.5 text-xs"
                  style="background: rgba(139,69,19,0.15); color: var(--theme-accent, var(--rust)); border-radius: 2px; font-size: 9px"
                >
                  {{ effect.域 }}.{{ effect.键 }} {{ effect.值 > 0 ? '+' : '' }}{{ effect.值 }}
                </span>
              </div>
            </div>
            <div class="text-right shrink-0 ml-3">
              <div class="font-mono font-bold" style="font-size: 12px; color: var(--theme-accent, var(--rust))">
                {{ getSkillCost(skill) }}G
              </div>
              <div style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted))">
                价格
              </div>
            </div>
          </div>

          <!-- Purchase Actions -->
          <div class="flex items-center justify-between mt-2 pt-2" style="border-top: 1px solid rgba(90,79,64,0.15)">
            <div style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted))">
              {{ skill.效果?.length || 0 }} 个效果
            </div>
            <button
              class="px-3 py-1 text-xs cursor-pointer transition-all"
              :style="{
                background: store.gold >= getSkillCost(skill) ? 'var(--theme-accent, var(--rust))' : 'rgba(90,79,64,0.3)',
                color: store.gold >= getSkillCost(skill) ? '#fff' : 'var(--theme-text-muted)',
                borderRadius: '2px',
                opacity: store.gold >= getSkillCost(skill) ? 1 : 0.5,
              }"
              :disabled="store.gold < getSkillCost(skill)"
              @click="openSkillPurchase(skill)"
            >
              购买
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ====== Tab: 角色技能 (Character Skills) ====== -->
    <div v-show="activeTab === 'character'">
      <!-- Role Selector -->
      <div class="mb-3">
        <div class="flex items-center justify-between mb-2">
          <span style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted))">选择角色</span>
        </div>
        <select
          v-model="selectedRoleId"
          class="w-full px-3 py-2 text-xs border cursor-pointer"
          style="
            background: rgba(74,64,53,0.2);
            border-color: rgba(90,79,64,0.3);
            color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
            border-radius: 2px;
          "
        >
          <option value="">-- 选择角色 --</option>
          <option v-for="role in allRoles" :key="role.id" :value="role.id">
            {{ role.姓名 }} ({{ role.状态 }})
          </option>
        </select>
      </div>

      <div v-if="selectedRole" class="flex flex-col gap-3">
        <!-- Equipped Skills -->
        <div class="module-card p-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">
              已装备技能
            </span>
            <span style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted))">
              {{ selectedRole.已装备技能?.length || 0 }} 个
            </span>
          </div>

          <div v-if="!selectedRole.已装备技能 || selectedRole.已装备技能.length === 0" class="text-center py-4">
            <p style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted))">暂无装备技能</p>
          </div>

          <div v-else class="flex flex-col gap-2">
            <div
              v-for="skillId in selectedRole.已装备技能"
              :key="skillId"
              class="flex items-center justify-between p-2"
              style="background: rgba(139,69,19,0.1); border-radius: 2px"
            >
              <div class="flex items-center gap-2">
                <span v-if="getSkillById(skillId)?.emoji">{{ getSkillById(skillId)?.emoji }}</span>
                <div>
                  <div class="text-xs" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">
                    {{ getSkillById(skillId)?.名称 || skillId }}
                  </div>
                  <div v-if="getSkillById(skillId)?.描述" style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted))">
                    {{ getSkillById(skillId)?.描述 }}
                  </div>
                </div>
              </div>
              <button
                class="px-2 py-1 text-xs border cursor-pointer transition-all"
                style="border-color: var(--vn-danger); color: var(--vn-danger); border-radius: 2px"
                @click="handleUnequipSkill(skillId)"
              >
                卸下
              </button>
            </div>
          </div>
        </div>

        <!-- Inventory Skills (Can Equip) -->
        <div class="module-card p-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">
              可装备技能
            </span>
            <span style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted))">
              {{ availableSkillsForRole.length }} 个
            </span>
          </div>

          <div v-if="availableSkillsForRole.length === 0" class="text-center py-4">
            <p style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted))">无其他可装备技能</p>
          </div>

          <div v-else class="flex flex-col gap-2">
            <div
              v-for="skill in availableSkillsForRole"
              :key="skill.id"
              class="flex items-center justify-between p-2"
              style="background: rgba(90,79,64,0.1); border-radius: 2px"
            >
              <div class="flex items-center gap-2">
                <span v-if="skill.emoji">{{ skill.emoji }}</span>
                <div>
                  <div class="text-xs" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">
                    {{ skill.名称 }}
                  </div>
                  <div v-if="skill.描述" style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted))">
                    {{ skill.描述 }}
                  </div>
                </div>
              </div>
              <button
                class="px-2 py-1 text-xs cursor-pointer transition-all"
                :style="{
                  background: 'var(--theme-accent, var(--rust))',
                  color: '#fff',
                  borderRadius: '2px',
                }"
                @click="handleEquipSkill(skill.id)"
              >
                装备
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8">
        <i class="fa-solid fa-user-gear" style="font-size: 2rem; color: rgba(139, 125, 107, 0.2); margin-bottom: 8px" />
        <p style="font-size: 11px; color: var(--theme-text-muted, var(--vn-muted))">请选择角色查看技能</p>
      </div>
    </div>

    <!-- ====== Tab: 日志 (Log) ====== -->
    <div v-show="activeTab === 'log'">
      <div v-if="store.workshopLogs.length === 0" class="text-center py-8">
        <i class="fa-solid fa-scroll" style="font-size: 2rem; color: rgba(139, 125, 107, 0.2); margin-bottom: 8px" />
        <p style="font-size: 11px; color: var(--theme-text-muted, var(--vn-muted))">暂无工坊记录</p>
      </div>

      <div v-else class="flex flex-col gap-0">
        <div
          v-for="(log, i) in store.workshopLogs"
          :key="i"
          class="flex items-center gap-3 py-2.5 px-2"
          :style="{ borderBottom: i < store.workshopLogs.length - 1 ? '1px solid rgba(90,79,64,0.1)' : 'none' }"
        >
          <div
            class="w-16 shrink-0 text-center border px-1 py-1"
            :style="{
              borderColor: 'rgba(90,79,64,0.25)',
              borderRadius: '2px',
              fontSize: '8px',
              color: 'var(--theme-text-muted, var(--vn-muted))',
            }"
          >
            {{ log.操作 }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-xs truncate" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">
              {{ log.角色 }} · {{ log.技能 }}
            </div>
            <div
              style="
                font-size: 8px;
                color: var(--theme-text-faint, rgba(139, 125, 107, 0.4));
                font-family: monospace;
                margin-top: 2px;
              "
            >
              {{ log.时间 }}
            </div>
          </div>
          <div
            class="font-mono font-bold shrink-0"
            :style="{ fontSize: '12px', color: log.金币 >= 0 ? 'var(--vn-success)' : 'var(--vn-danger)' }"
          >
            {{ log.金币 >= 0 ? '+' : '' }}{{ log.金币 }}G
          </div>
        </div>

        <!-- Stats Summary -->
        <div class="mt-4 pt-3 flex items-center justify-between" style="border-top: 1px solid rgba(90,79,64,0.15)">
          <span style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted))">
            共 {{ store.workshopLogs.length }} 条记录
          </span>
          <div style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted))">
            总花费: {{ totalSpent }}G · 订单 {{ totalOrders }} 单
          </div>
        </div>
      </div>
    </div>

    <!-- ====== Divider: Stock Market Section ====== -->
    <div class="my-4 flex items-center gap-2">
      <div
        class="flex-1"
        style="height: 1px; background: linear-gradient(to right, transparent, rgba(139, 69, 19, 0.3), transparent)"
      />
      <span
        style="font-size: 9px; color: var(--theme-accent, var(--rust)); font-family: monospace; letter-spacing: 0.1em"
        >风险与机遇</span
      >
      <div
        class="flex-1"
        style="height: 1px; background: linear-gradient(to right, transparent, rgba(139, 69, 19, 0.3), transparent)"
      />
    </div>

    <StockMarketModule />

    <!-- ====== Order Detail Modal ====== -->
    <Teleport to="body">
      <div
        v-if="showOrderModal"
        class="fixed inset-0 flex items-center justify-center z-50"
        style="background: rgba(0,0,0,0.6)"
        @click.self="showOrderModal = false"
      >
        <div
          class="module-card p-5 max-w-sm w-full mx-4"
          style="max-height: 80vh; overflow-y: auto"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">
              订单预览
            </h3>
            <button
              class="cursor-pointer"
              style="color: var(--theme-text-muted, var(--vn-muted))"
              @click="showOrderModal = false"
            >
              <i class="fa-solid fa-xmark" style="font-size: 1rem" />
            </button>
          </div>

          <div v-if="selectedOrder" class="flex flex-col gap-4">
            <!-- Order Info -->
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span
                  class="px-2 py-0.5 text-xs"
                  :style="{
                    background: getWorkTypeColor(selectedOrder.技能类型),
                    color: '#fff',
                    borderRadius: '2px',
                  }"
                >
                  {{ selectedOrder.技能类型 }}
                </span>
                <span class="text-lg font-bold" style="color: var(--theme-text-main)">
                  {{ selectedOrder.名称 }}
                </span>
              </div>
              <p style="font-size: 12px; color: var(--theme-text-muted, var(--vn-muted))">
                {{ selectedOrder.描述 }}
              </p>
            </div>

            <!-- Suggested Attributes -->
            <div v-if="selectedOrder.建议属性" class="p-3" style="background: rgba(139,69,19,0.1); border-radius: 4px">
              <div style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted)); margin-bottom: 4px">
                建议属性
              </div>
              <div class="text-sm" style="color: var(--theme-accent, var(--rust))">
                {{ selectedOrder.建议属性 }}
              </div>
            </div>

            <!-- Role Selection for Order -->
            <div>
              <div style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted)); margin-bottom: 4px">
                指派角色
              </div>
              <select
                v-model="orderTargetRoleId"
                class="w-full px-3 py-2 text-xs border cursor-pointer"
                style="
                  background: rgba(74,64,53,0.2);
                  border-color: rgba(90,79,64,0.3);
                  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
                  border-radius: 2px;
                "
              >
                <option value="">-- 选择角色 --</option>
                <option v-for="role in availableRoles" :key="role.id" :value="role.id">
                  {{ role.姓名 }} ({{ role.状态 }})
                </option>
              </select>
            </div>

            <!-- Cost Preview -->
            <div class="flex items-center justify-between p-3" style="background: rgba(90,79,64,0.1); border-radius: 4px">
              <span style="font-size: 11px; color: var(--theme-text-muted, var(--vn-muted))">
                预计消耗
              </span>
              <span class="font-mono font-bold" style="font-size: 14px; color: var(--theme-accent, var(--rust))">
                {{ selectedOrder.预计价格 }}G
              </span>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                class="flex-1 py-2 text-xs cursor-pointer transition-all"
                style="
                  border: 1px solid rgba(90,79,64,0.3);
                  color: var(--theme-text-muted, var(--vn-muted));
                  border-radius: 2px;
                "
                @click="showOrderModal = false"
              >
                取消
              </button>
              <button
                class="flex-1 py-2 text-xs cursor-pointer transition-all"
                :style="{
                  background: store.gold >= selectedOrder.预计价格 ? 'var(--theme-accent, var(--rust))' : 'rgba(90,79,64,0.3)',
                  color: store.gold >= selectedOrder.预计价格 ? '#fff' : 'var(--theme-text-muted)',
                  borderRadius: '2px',
                  opacity: store.gold >= selectedOrder.预计价格 ? 1 : 0.5,
                }"
                :disabled="store.gold < selectedOrder.预计价格"
                @click="confirmOrderPurchase"
              >
                确认接受
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ====== Skill Purchase Modal ====== -->
    <Teleport to="body">
      <div
        v-if="showSkillModal"
        class="fixed inset-0 flex items-center justify-center z-50"
        style="background: rgba(0,0,0,0.6)"
        @click.self="showSkillModal = false"
      >
        <div
          class="module-card p-5 max-w-sm w-full mx-4"
          style="max-height: 80vh; overflow-y: auto"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">
              购买技能
            </h3>
            <button
              class="cursor-pointer"
              style="color: var(--theme-text-muted, var(--vn-muted))"
              @click="showSkillModal = false"
            >
              <i class="fa-solid fa-xmark" style="font-size: 1rem" />
            </button>
          </div>

          <div v-if="selectedSkill" class="flex flex-col gap-4">
            <!-- Skill Info -->
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span v-if="selectedSkill.emoji" style="font-size: 1.5rem">{{ selectedSkill.emoji }}</span>
                <span class="text-lg font-bold" style="color: var(--theme-text-main)">
                  {{ selectedSkill.名称 }}
                </span>
              </div>
              <p v-if="selectedSkill.描述" style="font-size: 12px; color: var(--theme-text-muted, var(--vn-muted))">
                {{ selectedSkill.描述 }}
              </p>
            </div>

            <!-- Skill Effects -->
            <div v-if="selectedSkill.效果 && selectedSkill.效果.length > 0" class="flex flex-col gap-2">
              <div style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted))">
                技能效果
              </div>
              <div
                v-for="(effect, idx) in selectedSkill.效果"
                :key="idx"
                class="flex items-center gap-2 p-2"
                style="background: rgba(139,69,19,0.1); border-radius: 2px"
              >
                <span class="text-xs" style="color: var(--theme-accent, var(--rust))">
                  {{ effect.域 }}.{{ effect.键 }}
                </span>
                <span class="font-mono text-xs" :style="{ color: effect.值 >= 0 ? 'var(--vn-success)' : 'var(--vn-danger)' }">
                  {{ effect.值 >= 0 ? '+' : '' }}{{ effect.值 }}
                </span>
              </div>
            </div>

            <!-- Cost Breakdown -->
            <div class="p-3" style="background: rgba(90,79,64,0.1); border-radius: 4px">
              <div style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted)); margin-bottom: 8px">
                价格明细
              </div>
              <div class="flex flex-col gap-1 text-xs">
                <div class="flex justify-between">
                  <span style="color: var(--theme-text-muted)">基础价格</span>
                  <span style="color: var(--theme-text-main)">50G</span>
                </div>
                <div class="flex justify-between">
                  <span style="color: var(--theme-text-muted">效果加成</span>
                  <span style="color: var(--theme-text-main)">+{{ selectedSkill.效果?.length || 0 }}×20 = +{{ (selectedSkill.效果?.length || 0) * 20 }}G</span>
                </div>
                <div class="flex justify-between">
                  <span style="color: var(--theme-text-muted">mod加成</span>
                  <span style="color: var(--theme-text-main)">+{{ (selectedSkill.效果?.length || 0) * 10 }}G</span>
                </div>
                <div class="flex justify-between font-bold pt-1" style="border-top: 1px dashed rgba(90,79,64,0.3)">
                  <span style="color: var(--theme-accent, var(--rust))">总计</span>
                  <span style="color: var(--theme-accent, var(--rust))">{{ getSkillCost(selectedSkill) }}G</span>
                </div>
              </div>
            </div>

            <!-- Role Selection -->
            <div>
              <div style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted)); margin-bottom: 4px">
                装备角色（可选）
              </div>
              <select
                v-model="skillTargetRoleId"
                class="w-full px-3 py-2 text-xs border cursor-pointer"
                style="
                  background: rgba(74,64,53,0.2);
                  border-color: rgba(90,79,64,0.3);
                  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
                  border-radius: 2px;
                "
              >
                <option value="">-- 不装备 --</option>
                <option v-for="role in equippableRoles" :key="role.id" :value="role.id">
                  {{ role.姓名 }} ({{ role.状态 }})
                </option>
              </select>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                class="flex-1 py-2 text-xs cursor-pointer transition-all"
                style="
                  border: 1px solid rgba(90,79,64,0.3);
                  color: var(--theme-text-muted, var(--vn-muted));
                  border-radius: 2px;
                "
                @click="showSkillModal = false"
              >
                取消
              </button>
              <button
                class="flex-1 py-2 text-xs cursor-pointer transition-all"
                :style="{
                  background: store.gold >= getSkillCost(selectedSkill) ? 'var(--theme-accent, var(--rust))' : 'rgba(90,79,64,0.3)',
                  color: store.gold >= getSkillCost(selectedSkill) ? '#fff' : 'var(--theme-text-muted)',
                  borderRadius: '2px',
                  opacity: store.gold >= getSkillCost(selectedSkill) ? 1 : 0.5,
                }"
                :disabled="store.gold < getSkillCost(selectedSkill)"
                @click="confirmSkillPurchase"
              >
                购买
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ====== Production Status (existing functionality) ====== -->
    <div v-if="store.workshopCharacterId" class="module-card p-4 mt-4">
      <div class="flex items-center justify-between mb-2">
        <span
          class="text-xs font-bold"
          :style="{ color: store.workshopProducing ? 'var(--vn-success)' : 'var(--stain)' }"
        >
          <i
            :class="store.workshopProducing ? 'fa-solid fa-gear fa-spin' : 'fa-solid fa-pause'"
            style="margin-right: 4px; font-size: 0.7rem"
          />
          {{ store.workshopProducing ? '正在生产' : '已暂停' }}
        </span>
        <span class="font-mono text-xs" style="color: var(--stain)">+{{ currentEarning }}G</span>
      </div>
      <p style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted))">
        {{ producingChar?.name ?? '???' }} · {{ elapsedStr }}
      </p>
      <div class="flex gap-2 mt-3">
        <button
          class="flex-1 py-1.5 border text-xs cursor-pointer transition-all text-center"
          :style="{
            borderColor: store.workshopProducing ? 'var(--stain)' : 'var(--vn-success)',
            color: store.workshopProducing ? 'var(--stain)' : 'var(--vn-success)',
            borderRadius: '2px',
          }"
          @click="store.workshopProducing ? store.pauseProduction() : store.resumeProduction()"
        >
          <i
            :class="store.workshopProducing ? 'fa-solid fa-pause' : 'fa-solid fa-play'"
            style="margin-right: 4px; font-size: 0.6rem"
          />
          {{ store.workshopProducing ? '暂停' : '继续' }}
        </button>
        <button
          class="flex-1 py-1.5 border text-xs cursor-pointer transition-all text-center"
          style="border-color: var(--vn-danger); color: var(--vn-danger); border-radius: 2px"
          @click="handleStop"
        >
          停止结算
        </button>
      </div>
    </div>

    <!-- Character selection (existing functionality) -->
    <div v-if="!store.workshopCharacterId && activeTab === 'orders'" class="mt-4">
      <div class="mb-2" style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted)); letter-spacing: 0.1em">
        --- 选择角色开始生产 ---
      </div>
      <div class="flex flex-col gap-2">
        <div v-for="char in unlockedChars" :key="char.id" class="module-card p-3 flex items-center gap-3">
          <div
            class="w-10 h-10 border flex items-center justify-center shrink-0"
            :style="{ borderColor: 'rgba(90,79,64,0.3)', background: 'rgba(74,64,53,0.2)' }"
          >
            <i class="fa-solid fa-user" style="color: var(--theme-text-faint, rgba(139, 125, 107, 0.3))" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">
              {{ char.name }}
            </div>
            <p style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted))">
              速度 {{ char.productionSpeed }}x · 产出 {{ char.productionYield }}/s
            </p>
          </div>
          <button
            class="px-2.5 py-1 border text-xs cursor-pointer"
            style="
              border-color: var(--theme-accent, var(--rust));
              color: var(--theme-text-main, var(--vn-fg));
              border-radius: 2px;
            "
            @click="store.startProduction(char.id)"
          >
            生产
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import StockMarketModule from './StockMarketModule.vue';
import { useVNStore } from '../../store';
import { formatSkillInfo } from '../../utils/roleFormatter';
import type { 技能 } from '../../types/role';

const store = useVNStore();

// ====== Tab System ======
const tabs = [
  { id: 'orders', label: '订单', icon: 'fa-solid fa-clipboard-list' },
  { id: 'shop', label: '商店', icon: 'fa-solid fa-toolbox' },
  { id: 'character', label: '角色技能', icon: 'fa-solid fa-user-gear' },
  { id: 'log', label: '日志', icon: 'fa-solid fa-scroll' },
];
const activeTab = ref('orders');

// ====== Workshop Level & Upgrade =====
const upgradeCost = computed(() => store.workshopLevel * 200);
const canUpgrade = computed(() => store.gold >= upgradeCost.value && store.workshopLevel < 10);

function handleUpgrade() {
  if (canUpgrade.value) {
    const success = store.upgradeWorkshop?.();
    if (success) {
      store.showToast(`工坊升级至 ${store.workshopLevel} 级`);
    } else {
      store.showToast('金币不足或已达满级');
    }
  }
}

// ====== Production Status (existing) ======
// Use characterRoster for production (the store's internal character list with productionSpeed/productionYield)
const unlockedChars = computed(() => store.characterRoster.filter((c: any) => c.unlocked));
const producingChar = computed(() => store.characterRoster.find((c: any) => c.id === store.workshopCharacterId));

const currentEarning = ref(0);
const elapsedStr = ref('0s');
let ticker: ReturnType<typeof setInterval> | null = null;

function startTicker() {
  if (ticker) clearInterval(ticker);
  ticker = setInterval(() => {
    if (!store.workshopStartTime) {
      currentEarning.value = store.workshopAccumulated;
      return;
    }
    const elapsed = (Date.now() - store.workshopStartTime) / 1000;
    const char = producingChar.value as any;
    if (!char) return;
    const bonus = 1 + (store.workshopLevel - 1) * 0.1;
    currentEarning.value =
      store.workshopAccumulated + Math.floor(elapsed * char.productionSpeed * char.productionYield * bonus);
    const totalSec = Math.floor(elapsed);
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    elapsedStr.value = m > 0 ? `${m}m ${s}s` : `${s}s`;
  }, 500);
}

watch(
  () => store.workshopCharacterId,
  v => {
    if (v) startTicker();
    else if (ticker) {
      clearInterval(ticker);
      ticker = null;
      currentEarning.value = 0;
      elapsedStr.value = '0s';
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  if (ticker) clearInterval(ticker);
});

function handleStop() {
  const earned = store.stopProductionAndSettle();
  store.showToast(`结算收益: +${earned}G`);
}

// ====== Workshop V2: Orders =====
interface WorkshopOrder {
  名称: string;
  描述: string;
  技能类型: string;
  建议属性: string;
  预计价格: number;
  预计mod: string[];
}

const pendingOrders = ref<WorkshopOrder[]>([]);
const isGenerating = ref(false);

function getWorkTypeColor(type: string): string {
  const colors: Record<string, string> = {
    '冶炼': '#c0392b',
    '制药': '#27ae60',
    '改装': '#2980b9',
    '通用': '#7f8c8d',
  };
  return colors[type] || '#7f8c8d';
}

async function handleRefreshOrders() {
  if (isGenerating.value) return;
  isGenerating.value = true;
  try {
    const order = await store.generateWorkshopOrder();
    if (order) {
      pendingOrders.value = [order, ...pendingOrders.value].slice(0, 5);
      store.showToast('订单已刷新');
    } else {
      // Fallback orders
      pendingOrders.value = [
        {
          名称: '基础锻件',
          描述: '一份简单的锻造任务',
          技能类型: '冶炼',
          建议属性: '技巧',
          预计价格: 80,
          预计mod: [],
        },
        {
          名称: '止痛草药',
          描述: '配制一份止痛草药',
          技能类型: '制药',
          建议属性: '智慧',
          预计价格: 60,
          预计mod: [],
        },
        {
          名称: '工具修复',
          描述: '修好坏掉的工具',
          技能类型: '改装',
          建议属性: '技巧',
          预计价格: 100,
          预计mod: [],
        },
      ];
      store.showToast('使用默认订单');
    }
  } catch (e) {
    console.warn('[Workshop] 订单生成失败', e);
    store.showToast('订单生成失败');
  } finally {
    isGenerating.value = false;
  }
}

function handleDismissOrder(order: WorkshopOrder) {
  pendingOrders.value = pendingOrders.value.filter(o => o.名称 !== order.名称);
}

function openOrderDetail(order: WorkshopOrder) {
  selectedOrder.value = order;
  orderTargetRoleId.value = '';
  showOrderModal.value = true;
}

function confirmOrderPurchase() {
  if (!selectedOrder.value) return;
  const order = selectedOrder.value;

  if (store.gold < order.预计价格) {
    store.showToast('金币不足');
    return;
  }

  // Generate a skill from the order
  const skill: 技能 = {
    id: `skill_${Date.now()}`,
    名称: order.名称,
    描述: order.描述,
    emoji: getWorkTypeEmoji(order.技能类型),
    效果: order.预计mod.length > 0
      ? order.预计mod.map(mod => {
          const parts = mod.split('.');
          return { 域: parts[0] || '通用', 键: parts[1] || '效果', 值: 20 };
        })
      : [{ 域: '通用', 键: '效果', 值: 20 }],
  };

  const roleId = orderTargetRoleId.value;
  const success = store.purchaseSkill(roleId, skill, store.gold);

  if (success) {
    store.showToast(`技能「${order.名称}」已生成！`);
    pendingOrders.value = pendingOrders.value.filter(o => o.名称 !== order.名称);
  } else {
    store.showToast('购买失败');
  }

  showOrderModal.value = false;
}

function getWorkTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    '冶炼': '🔨',
    '制药': '💊',
    '改装': '⚙️',
    '通用': '✨',
  };
  return emojis[type] || '✨';
}

// ====== Workshop V2: Shop =====
const showSkillModal = ref(false);
const selectedSkill = ref<技能 | null>(null);
const skillTargetRoleId = ref('');
const isGeneratingSkill = ref(false);

const inventorySkills = computed(() => store.skillsInventory || []);

function getSkillCost(skill: 技能): number {
  if (store.getWorkshopSkillCost) {
    return store.getWorkshopSkillCost(skill);
  }
  // Default calculation: base 50 + 20 per effect + 10 per mod
  let cost = 50;
  if (skill.效果) {
    cost += skill.效果.length * 20;
    cost += skill.效果.length * 10;
  }
  return cost;
}

async function handleGenerateSkill() {
  if (isGeneratingSkill.value) return;
  isGeneratingSkill.value = true;
  try {
    const order = await store.generateWorkshopOrder();
    if (order) {
      const skill: 技能 = {
        id: `skill_${Date.now()}`,
        名称: order.名称,
        描述: order.描述,
        emoji: getWorkTypeEmoji(order.技能类型),
        效果: order.预计mod.length > 0
          ? order.预计mod.map(mod => {
              const parts = mod.split('.');
              return { 域: parts[0] || '通用', 键: parts[1] || '效果', 值: 20 };
            })
          : [{ 域: '通用', 键: '效果', 值: 20 }],
      };
      store.addSkill(skill);
      store.showToast(`技能「${skill.名称}」已添加到技能库`);
    }
  } catch (e) {
    console.warn('[Workshop] 技能生成失败', e);
    store.showToast('技能生成失败');
  } finally {
    isGeneratingSkill.value = false;
  }
}

function openSkillPurchase(skill: 技能) {
  selectedSkill.value = skill;
  skillTargetRoleId.value = '';
  showSkillModal.value = true;
}

const equippableRoles = computed(() =>
  store.getAllRoles().filter(r => r.状态 === '空闲' || r.状态 === '工坊中' || r.状态 === '休息中')
);

function confirmSkillPurchase() {
  if (!selectedSkill.value) return;

  const skill = selectedSkill.value;
  const cost = getSkillCost(skill);

  if (store.gold < cost) {
    store.showToast('金币不足');
    return;
  }

  const roleId = skillTargetRoleId.value;
  const success = store.purchaseSkill(roleId, skill, store.gold);

  if (success) {
    store.showToast(`技能「${skill.名称}」购买成功！`);
  } else {
    store.showToast('购买失败');
  }

  showSkillModal.value = false;
}

// ====== Workshop V2: Character Skills =====
const selectedRoleId = ref('');

const allRoles = computed(() => store.getAllRoles());
const selectedRole = computed(() => allRoles.value.find(r => r.id === selectedRoleId.value) || null);

const availableSkillsForRole = computed(() => {
  if (!selectedRole.value) return [];
  const equippedIds = selectedRole.value.已装备技能 || [];
  return inventorySkills.value.filter(s => !equippedIds.includes(s.id));
});

function getSkillById(skillId: string): 技能 | null {
  if (store.getSkill) {
    return store.getSkill(skillId);
  }
  return inventorySkills.value.find(s => s.id === skillId) || null;
}

function handleEquipSkill(skillId: string) {
  if (!selectedRoleId.value) {
    store.showToast('请先选择角色');
    return;
  }
  const success = store.equipSkill(selectedRoleId.value, skillId);
  if (success) {
    store.showToast('技能已装备');
  } else {
    store.showToast('装备失败');
  }
}

function handleUnequipSkill(skillId: string) {
  if (!selectedRoleId.value) {
    store.showToast('请先选择角色');
    return;
  }
  const success = store.unequipSkill(selectedRoleId.value, skillId);
  if (success) {
    store.showToast('技能已卸下');
  } else {
    store.showToast('卸下失败');
  }
}

// ====== Workshop V2: Log =====
const totalSpent = computed(() =>
  store.workshopLogs
    .filter(l => l.操作 === '购买')
    .reduce((sum, l) => sum + Math.abs(l.金币), 0)
);

const totalOrders = computed(() =>
  store.workshopLogs.filter(l => l.操作 === '购买').length
);

// ====== Order Modal State =====
const showOrderModal = ref(false);
const selectedOrder = ref<WorkshopOrder | null>(null);
const orderTargetRoleId = ref('');

const availableRoles = computed(() =>
  store.getAllRoles().filter(r => r.状态 === '空闲' || r.状态 === '工坊中' || r.状态 === '休息中')
);

// ====== Accept Order (handle accept button directly) =====
function handleAcceptOrder(order: WorkshopOrder) {
  if (store.gold < order.预计价格) {
    store.showToast('金币不足');
    return;
  }

  // Generate a skill from the order
  const skill: 技能 = {
    id: `skill_${Date.now()}`,
    名称: order.名称,
    描述: order.描述,
    emoji: getWorkTypeEmoji(order.技能类型),
    效果: order.预计mod.length > 0
      ? order.预计mod.map(mod => {
          const parts = mod.split('.');
          return { 域: parts[0] || '通用', 键: parts[1] || '效果', 值: 20 };
        })
      : [{ 域: '通用', 键: '效果', 值: 20 }],
  };

  // Use first available role if none selected
  const roleId = availableRoles.value[0]?.id || '';
  const success = store.purchaseSkill(roleId, skill, store.gold);

  if (success) {
    store.showToast(`技能「${order.名称}」已生成！`);
    pendingOrders.value = pendingOrders.value.filter(o => o.名称 !== order.名称);
  } else {
    store.showToast('接受订单失败');
  }
}
</script>

<style scoped>
.gold-counter {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid rgba(196, 162, 101, 0.3);
  border-radius: 2px;
  background: rgba(196, 162, 101, 0.1);
  font-size: 12px;
  color: var(--stain, #c0a265);
}

.module-card {
  background: rgba(74, 64, 53, 0.15);
  border: 1px solid rgba(90, 79, 64, 0.25);
  border-radius: 4px;
}
</style>
