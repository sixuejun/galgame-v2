<template>
  <div data-ui="character-panel" class="absolute inset-0 flex items-center justify-center px-4" style="z-index: 50">
    <div
      data-ui="panel-backdrop"
      class="absolute inset-0"
      :style="{
        background: 'var(--theme-panel-backdrop, rgba(42, 36, 32, 0.7))',
        backdropFilter: 'blur(var(--theme-panel-backdrop-blur, 4px))',
      }"
      @click="store.setOverlay('none')"
    />

    <!-- Full avatar preview -->
    <div
      v-if="showFullAvatar && store.userCharacter.avatarUrl"
      class="absolute inset-0 flex cursor-pointer items-center justify-center"
      style="z-index: 60; background: rgba(42, 36, 32, 0.9)"
      @click="showFullAvatar = false"
    >
      <img
        :src="store.userCharacter.avatarUrl"
        :alt="store.userCharacter.name"
        class="border object-contain"
        style="max-width: 80%; max-height: 600px; border-color: rgba(90, 79, 64, 0.3); filter: sepia(0.2) contrast(0.9)"
      />
    </div>

    <!-- Avatar import modal -->
    <div v-if="avatarModalOpen" class="absolute inset-0 flex items-center justify-center" style="z-index: 70">
      <div class="absolute inset-0 bg-black/65" @click="closeAvatarModal" />
      <div
        class="relative mx-4 w-full max-w-lg border p-4 shadow-2xl"
        :style="{ background: 'var(--vn-panel-bg)', borderColor: 'rgba(90,79,64,0.55)' }"
      >
        <div class="mb-3 flex items-center justify-between">
          <div>
            <h3
              class="text-sm font-bold tracking-widest"
              style="color: var(--theme-text-main, rgba(212, 197, 160, 0.92))"
            >
              上传玩家头像
            </h3>
            <p class="mt-1 text-xs" style="color: var(--theme-text-muted, var(--vn-muted))">
              建议使用 png / webp / jpeg，避免过大图片在预览时闪裂
            </p>
          </div>
          <button
            class="h-8 w-8 cursor-pointer"
            style="color: var(--theme-text-muted, var(--vn-muted))"
            @click="closeAvatarModal"
          >
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <div
          class="mb-4 flex items-center justify-center border p-3"
          style="min-height: 240px; border-color: rgba(90, 79, 64, 0.35); background: rgba(74, 64, 53, 0.18)"
        >
          <template v-if="avatarDraftPreviewUrl || store.userCharacter.avatarUrl">
            <img
              :src="avatarDraftPreviewUrl || store.userCharacter.avatarUrl"
              alt="头像预览"
              class="max-h-56 max-w-full object-contain"
              style="filter: sepia(0.2) contrast(0.95)"
            />
          </template>
          <div v-else class="text-center" style="color: var(--theme-text-muted, var(--vn-muted))">
            <i class="fa-solid fa-image mb-2 block text-2xl" />
            <span class="text-xs">暂无头像预览</span>
          </div>
        </div>

        <div class="mb-3">
          <button
            class="w-full border px-3 py-2 text-sm transition-colors"
            :style="buttonStyle"
            @click="openLocalPicker"
          >
            <i class="fa-solid fa-upload mr-2" />本地上传
          </button>
        </div>

        <div class="mb-3">
          <span class="mb-1 block text-xs" style="color: var(--theme-text-muted, var(--vn-muted))"></span>
          <input
            v-model="avatarUrlInput"
            type="text"
            class="w-full border px-3 py-2 text-sm outline-none"
            placeholder="粘贴图片链接，按回车或点击确认"
            :style="inputStyle"
            @keydown.enter.prevent="handleApplyDraft"
          />
        </div>

        <div class="mb-4 flex gap-3">
          <button
            class="flex-1 border px-3 py-2 text-sm transition-colors"
            :style="buttonStyle"
            @click="handleApplyDraft"
          >
            <i class="fa-solid fa-circle-check mr-2" />确认应用
          </button>
          <button
            class="flex-1 border px-3 py-2 text-sm transition-colors"
            :style="buttonStyle"
            @click="handleClearAvatar"
          >
            <i class="fa-solid fa-trash mr-2" />清除头像
          </button>
        </div>

        <input
          ref="fileInput"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          class="hidden"
          @change="handleAvatarUpload"
        />
      </div>
    </div>

    <!-- Role generation modal -->
    <div v-if="roleGenerationModalOpen" class="absolute inset-0 flex items-center justify-center" style="z-index: 70">
      <div class="absolute inset-0 bg-black/65" @click="closeRoleGenerationModal" />
      <div
        class="relative mx-4 w-full max-w-lg overflow-hidden border shadow-2xl"
        :style="{ background: 'var(--vn-panel-bg)', borderColor: 'rgba(90,79,64,0.55)' }"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b px-4 py-3" style="border-color: rgba(90,79,64,0.3)">
          <h3
            class="text-sm font-bold tracking-widest"
            style="color: var(--theme-text-main, rgba(212, 197, 160, 0.92))"
          >
            <i class="fa-solid fa-wand-magic-sparkles mr-2" style="color: var(--theme-accent, var(--rust))" />
            生成角色
          </h3>
          <button
            class="h-8 w-8 cursor-pointer"
            style="color: var(--theme-text-muted, var(--vn-muted))"
            @click="closeRoleGenerationModal"
          >
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Modal Content -->
        <div class="max-h-[60vh] overflow-y-auto p-4">
          <!-- Scene input -->
          <div class="mb-4">
            <label
              class="mb-1 block text-xs"
              style="color: var(--theme-text-muted, var(--vn-muted))"
            >
              场景描述（可选）
            </label>
            <textarea
              v-model="generationScene"
              class="w-full border px-3 py-2 text-sm outline-none resize-none"
              rows="3"
              placeholder="描述角色生成的背景，如：废土拾荒者、避难所居民、流浪商人..."
              :style="inputStyle"
            />
          </div>

          <!-- Number of roles -->
          <div class="mb-4">
            <label
              class="mb-1 block text-xs"
              style="color: var(--theme-text-muted, var(--vn-muted))"
            >
              生成数量
            </label>
            <div class="flex items-center gap-2">
              <button
                class="h-8 w-8 cursor-pointer border transition-colors"
                :style="buttonStyle"
                @click="generationCount = Math.max(1, generationCount - 1)"
              >
                <i class="fa-solid fa-minus" />
              </button>
              <span
                class="w-8 text-center text-lg font-bold"
                style="color: var(--theme-text-main, rgba(212, 197, 160, 0.92))"
              >
                {{ generationCount }}
              </span>
              <button
                class="h-8 w-8 cursor-pointer border transition-colors"
                :style="buttonStyle"
                @click="generationCount = Math.min(5, generationCount + 1)"
              >
                <i class="fa-solid fa-plus" />
              </button>
              <span class="ml-2 text-xs" style="color: var(--theme-text-muted, var(--vn-muted))">
                (1-5)
              </span>
            </div>
          </div>

          <!-- Loading state -->
          <div v-if="isGenerating" class="py-8 text-center">
            <div class="mb-3">
              <i class="fa-solid fa-spinner fa-spin text-3xl" style="color: var(--theme-accent, var(--rust))" />
            </div>
            <p class="text-sm" style="color: var(--theme-text-muted, var(--vn-muted))">
              正在生成角色...
            </p>
          </div>

          <!-- Error state -->
          <div v-else-if="generationError" class="mb-4 rounded border border-red-900/40 bg-red-900/10 p-3">
            <p class="text-sm text-red-400">
              <i class="fa-solid fa-circle-exclamation mr-2" />
              {{ generationError }}
            </p>
          </div>

          <!-- Generated preview -->
          <div v-else-if="generatedRoles.length > 0" class="space-y-3">
            <h4
              class="text-xs font-bold tracking-wider"
              style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))"
            >
              生成预览
            </h4>
            <div
              v-for="(role, idx) in generatedRoles"
              :key="idx"
              class="rounded border p-3 transition-colors hover:border-amber-800/50"
              :style="{
                borderColor: 'rgba(90,79,64,0.4)',
                background: 'rgba(212,197,160,0.02)',
              }"
            >
              <div class="mb-2 flex items-center justify-between">
                <span
                  class="font-bold"
                  style="color: var(--theme-text-main, rgba(212, 197, 160, 0.92))"
                >
                  {{ role.姓名 }}
                </span>
                <span
                  class="rounded px-2 py-0.5 text-xs"
                  style="background: rgba(139,69,19,0.2); color: var(--theme-accent, var(--rust))"
                >
                  {{ getStatusEmoji(role.状态) }} {{ role.状态 }}
                </span>
              </div>
              <div class="mb-2 text-xs" style="color: var(--theme-text-muted, var(--vn-muted))">
                <span v-if="role.定位">{{ role.定位 }}</span>
                <span v-if="role.出身"> · {{ role.出身 }}</span>
              </div>
              <!-- Attributes preview -->
              <div class="grid grid-cols-3 gap-1 text-xs">
                <div style="color: var(--theme-text-soft, rgba(212,197,160,0.7))">
                  战力 {{ getAttributeStars(role.属性.战力) }}
                </div>
                <div style="color: var(--theme-text-soft, rgba(212,197,160,0.7))">
                  技巧 {{ getAttributeStars(role.属性.技巧) }}
                </div>
                <div style="color: var(--theme-text-soft, rgba(212,197,160,0.7))">
                  智慧 {{ getAttributeStars(role.属性.智慧) }}
                </div>
                <div style="color: var(--theme-text-soft, rgba(212,197,160,0.7))">
                  社交 {{ getAttributeStars(role.属性.社交) }}
                </div>
                <div style="color: var(--theme-text-soft, rgba(212,197,160,0.7))">
                  谨慎 {{ getAttributeStars(role.属性.谨慎) }}
                </div>
                <div style="color: var(--theme-text-soft, rgba(212,197,160,0.7))">
                  运气 {{ getAttributeStars(role.属性.运气) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex gap-3 border-t p-4" style="border-color: rgba(90,79,64,0.3)">
          <button
            v-if="generatedRoles.length === 0 && !isGenerating"
            class="flex-1 border px-4 py-2 text-sm transition-colors"
            :style="buttonStyle"
            @click="handleGenerateRoles"
          >
            <i class="fa-solid fa-wand-magic-sparkles mr-2" />
            生成
          </button>
          <button
            v-if="generatedRoles.length > 0"
            class="flex-1 border px-4 py-2 text-sm transition-colors"
            :style="{ ...buttonStyle, background: 'rgba(139,69,19,0.3)' }"
            @click="handleConfirmGeneratedRoles"
          >
            <i class="fa-solid fa-check mr-2" />
            确认添加
          </button>
          <button
            class="flex-1 border px-4 py-2 text-sm transition-colors"
            :style="buttonStyle"
            @click="closeRoleGenerationModal"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- Skill management modal -->
    <div v-if="skillManagementModalOpen && selectedRoleForSkill" class="absolute inset-0 flex items-center justify-center" style="z-index: 70">
      <div class="absolute inset-0 bg-black/65" @click="closeSkillManagement" />
      <div
        class="relative mx-4 w-full max-w-lg overflow-hidden border shadow-2xl"
        :style="{ background: 'var(--vn-panel-bg)', borderColor: 'rgba(90,79,64,0.55)' }"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b px-4 py-3" style="border-color: rgba(90,79,64,0.3)">
          <div>
            <h3
              class="text-sm font-bold tracking-widest"
              style="color: var(--theme-text-main, rgba(212, 197, 160, 0.92))"
            >
              <i class="fa-solid fa-bolt mr-2" style="color: var(--theme-accent, var(--rust))" />
              管理技能
            </h3>
            <p class="mt-0.5 text-xs" style="color: var(--theme-text-muted, var(--vn-muted))">
              为「{{ selectedRoleForSkill.姓名 }}」装备技能
            </p>
          </div>
          <button
            class="h-8 w-8 cursor-pointer"
            style="color: var(--theme-text-muted, var(--vn-muted))"
            @click="closeSkillManagement"
          >
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Filter tabs -->
        <div class="flex border-b px-4" style="border-color: rgba(90,79,64,0.3)">
          <button
            v-for="tab in ['all', 'equipped', 'available']"
            :key="tab"
            class="flex-1 px-3 py-2 text-xs transition-colors"
            :style="{
              borderBottom: skillFilterTab === tab ? '2px solid var(--theme-accent, var(--rust))' : '2px solid transparent',
              color: skillFilterTab === tab
                ? 'var(--theme-text-main, rgba(212,197,160,0.92))'
                : 'var(--theme-text-muted, var(--vn-muted))',
            }"
            @click="skillFilterTab = tab as any"
          >
            {{ tab === 'all' ? '全部' : tab === 'equipped' ? '已装备' : '可装备' }}
          </button>
        </div>

        <!-- Skills list -->
        <div class="max-h-[50vh] overflow-y-auto p-4">
          <div v-if="filteredSkills.length === 0" class="py-8 text-center">
            <i class="fa-solid fa-inbox mb-2 block text-2xl" style="color: var(--theme-text-faint, rgba(139,125,107,0.3))" />
            <p class="text-sm" style="color: var(--theme-text-muted, var(--vn-muted))">
              暂无技能
            </p>
          </div>
          <div
            v-else
            class="space-y-2"
          >
            <div
              v-for="skill in filteredSkills"
              :key="skill.id"
              class="flex items-center justify-between rounded border p-3 transition-colors hover:border-amber-800/40"
              :style="{
                borderColor: isSkillEquipped(skill.id) ? 'rgba(139,69,19,0.5)' : 'rgba(90,79,64,0.3)',
                background: isSkillEquipped(skill.id) ? 'rgba(139,69,19,0.08)' : 'rgba(74,64,53,0.1)',
              }"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span
                    v-if="skill.emoji"
                    style="font-size: 1.1rem"
                  >
                    {{ skill.emoji }}
                  </span>
                  <span
                    class="text-sm font-medium"
                    style="color: var(--theme-text-main, rgba(212,197,160,0.92))"
                  >
                    {{ skill.名称 }}
                  </span>
                </div>
                <p
                  v-if="skill.描述"
                  class="mt-1 text-xs"
                  style="color: var(--theme-text-muted, var(--vn-muted))"
                >
                  {{ skill.描述 }}
                </p>
                <div v-if="skill.效果 && skill.效果.length > 0" class="mt-1">
                  <span
                    v-for="(effect, eIdx) in skill.效果"
                    :key="eIdx"
                    class="mr-1 rounded px-1.5 py-0.5 text-xs"
                    style="background: rgba(90,79,64,0.2); color: var(--theme-text-soft, rgba(212,197,160,0.7))"
                  >
                    {{ effect.域 }}.{{ effect.键 }}
                  </span>
                </div>
              </div>
              <button
                class="ml-3 shrink-0 border px-3 py-1.5 text-xs transition-colors"
                :style="isSkillEquipped(skill.id) ? {
                  background: 'rgba(220,38,38,0.2)',
                  borderColor: 'rgba(220,38,38,0.4)',
                  color: '#fca5a5',
                } : {
                  background: 'rgba(139,69,19,0.2)',
                  borderColor: 'rgba(139,69,19,0.4)',
                  color: 'var(--theme-accent, var(--rust))',
                }"
                @click="toggleSkill(skill.id)"
              >
                {{ isSkillEquipped(skill.id) ? '卸下' : '装备' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex gap-3 border-t p-4" style="border-color: rgba(90,79,64,0.3)">
          <button
            class="flex-1 border px-4 py-2 text-sm transition-colors"
            :style="buttonStyle"
            @click="closeSkillManagement"
          >
            完成
          </button>
        </div>
      </div>
    </div>

    <!-- Role history log modal -->
    <div v-if="historyModalOpen && selectedRoleForHistory" class="absolute inset-0 flex items-center justify-center" style="z-index: 70">
      <div class="absolute inset-0 bg-black/65" @click="closeHistoryModal" />
      <div
        class="relative mx-4 w-full max-w-md overflow-hidden border shadow-2xl"
        :style="{ background: 'var(--vn-panel-bg)', borderColor: 'rgba(90,79,64,0.55)' }"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b px-4 py-3" style="border-color: rgba(90,79,64,0.3)">
          <div>
            <h3
              class="text-sm font-bold tracking-widest"
              style="color: var(--theme-text-main, rgba(212, 197, 160, 0.92))"
            >
              <i class="fa-solid fa-clock-rotate-left mr-2" style="color: var(--theme-accent, var(--rust))" />
              角色记录
            </h3>
            <p class="mt-0.5 text-xs" style="color: var(--theme-text-muted, var(--vn-muted))">
              {{ selectedRoleForHistory.姓名 }} 的经历
            </p>
          </div>
          <button
            class="h-8 w-8 cursor-pointer"
            style="color: var(--theme-text-muted, var(--vn-muted))"
            @click="closeHistoryModal"
          >
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Timeline -->
        <div class="max-h-[60vh] overflow-y-auto p-4">
          <div v-if="selectedRoleForHistory.记录.length === 0" class="py-8 text-center">
            <i class="fa-solid fa-scroll mb-2 block text-2xl" style="color: var(--theme-text-faint, rgba(139,125,107,0.3))" />
            <p class="text-sm" style="color: var(--theme-text-muted, var(--vn-muted))">
              暂无记录
            </p>
          </div>
          <div v-else class="relative">
            <!-- Timeline line -->
            <div
              class="absolute left-4 top-0 h-full w-px"
              style="background: linear-gradient(to bottom, rgba(90,79,64,0.4), rgba(90,79,64,0.1))"
            />
            <div class="space-y-4">
              <div
                v-for="(record, idx) in sortedRoleRecords"
                :key="idx"
                class="relative pl-10"
              >
                <!-- Timeline dot -->
                <div
                  class="absolute left-3 top-1.5 h-2 w-2 rounded-full"
                  :style="{
                    background: getRecordTypeColor(record.类型),
                  }"
                />
                <!-- Record content -->
                <div
                  class="rounded border p-2"
                  :style="{
                    borderColor: 'rgba(90,79,64,0.3)',
                    background: 'rgba(74,64,53,0.1)',
                  }"
                >
                  <div class="mb-1 flex items-center justify-between">
                    <span
                      class="rounded px-1.5 py-0.5 text-xs"
                      :style="{
                        background: getRecordTypeBg(record.类型),
                        color: getRecordTypeColor(record.类型),
                      }"
                    >
                      {{ record.类型 }}
                    </span>
                    <span class="text-xs" style="color: var(--theme-text-faint, rgba(139,125,107,0.5))">
                      {{ formatRecordTime(record.时间) }}
                    </span>
                  </div>
                  <p class="text-sm" style="color: var(--theme-text-main, rgba(212,197,160,0.85))">
                    {{ record.内容 }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex gap-3 border-t p-4" style="border-color: rgba(90,79,64,0.3)">
          <button
            class="flex-1 border px-4 py-2 text-sm transition-colors"
            :style="buttonStyle"
            @click="closeHistoryModal"
          >
            关闭
          </button>
        </div>
      </div>
    </div>

    <SkinShell :skin="characterPanelSkin" :shell-style="panelShellStyle">
      <div
        class="animate-fade-in-up relative flex w-full flex-col overflow-hidden border"
        :style="
          characterPanelSkin ? { ...panelStyle, borderColor: 'transparent', background: 'transparent' } : panelStyle
        "
      >
        <div :style="decoTop" />
        <div :style="decoTopThin" />

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4" :style="headerBorder">
          <div class="flex items-center gap-3">
            <div class="stamp-effect">
              <span
                style="
                  color: var(--theme-accent, var(--rust));
                  font-size: 0.75rem;
                  font-weight: bold;
                  letter-spacing: 0.15em;
                "
                >PROFILE</span
              >
            </div>
            <h2
              class="text-lg font-bold tracking-widest"
              style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))"
            >
              角色
            </h2>
          </div>
          <button
            class="flex h-8 w-8 cursor-pointer items-center justify-center"
            style="color: var(--theme-text-muted, var(--vn-muted))"
            @click="store.setOverlay('none')"
          >
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Tab navigation -->
        <div class="flex border-b px-6" style="border-color: rgba(90,79,64,0.3)">
          <button
            class="px-4 py-2.5 text-sm font-medium transition-colors"
            :style="{
              borderBottom: activeTab === 'character' ? '2px solid var(--theme-accent, var(--rust))' : '2px solid transparent',
              color: activeTab === 'character'
                ? 'var(--theme-text-main, rgba(212,197,160,0.92))'
                : 'var(--theme-text-muted, var(--vn-muted))',
            }"
            @click="activeTab = 'character'"
          >
            <i class="fa-solid fa-user mr-1.5" />
            角色卡
          </button>
          <button
            class="px-4 py-2.5 text-sm font-medium transition-colors"
            :style="{
              borderBottom: activeTab === 'roleSystem' ? '2px solid var(--theme-accent, var(--rust))' : '2px solid transparent',
              color: activeTab === 'roleSystem'
                ? 'var(--theme-text-main, rgba(212,197,160,0.92))'
                : 'var(--theme-text-muted, var(--vn-muted))',
            }"
            @click="activeTab = 'roleSystem'"
          >
            <i class="fa-solid fa-users mr-1.5" />
            角色系统
          </button>
        </div>

        <!-- Content -->
        <div class="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <!-- Character tab -->
          <template v-if="activeTab === 'character'">
            <!-- User character section -->
            <div class="mb-8">
              <div class="mb-4 flex items-center gap-2">
                <i class="fa-solid fa-user" style="color: var(--theme-accent, var(--rust)); font-size: 0.875rem" />
                <h3
                  class="text-sm font-bold tracking-widest"
                  style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))"
                >
                  我的角色
                </h3>
                <div
                  class="flex-1"
                  :style="{ height: '1px', background: 'linear-gradient(to right, rgba(90,79,64,0.6), transparent)' }"
                />
              </div>

              <div class="flex gap-5">
                <!-- Avatar -->
                <div class="flex flex-col items-center gap-2">
                  <div
                    class="group relative h-24 w-24 cursor-pointer overflow-hidden border"
                    :style="{ borderColor: 'rgba(90,79,64,0.5)', background: 'rgba(74,64,53,0.2)' }"
                    @click="openAvatarModal"
                  >
                    <template v-if="store.userCharacter.avatarUrl">
                      <img
                        :src="store.userCharacter.avatarUrl"
                        :alt="store.userCharacter.name"
                        class="h-full w-full object-cover"
                        style="filter: sepia(0.3) contrast(0.9)"
                      />
                      <div
                        class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
                        style="background: rgba(42, 36, 32, 0.5)"
                      >
                        <i class="fa-solid fa-eye" style="color: var(--theme-text-main, var(--vn-fg))" />
                      </div>
                    </template>
                    <div
                      v-else
                      class="flex h-full w-full flex-col items-center justify-center"
                      style="color: var(--theme-text-muted, var(--vn-muted))"
                    >
                      <i class="fa-solid fa-upload mb-1" />
                      <span style="font-size: 9px">上传头像</span>
                    </div>
                  </div>
                  <button
                    class="cursor-pointer transition-colors"
                    style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted))"
                    @click="openAvatarModal"
                  >
                    {{ store.userCharacter.avatarUrl ? '更换头像' : '选择图片' }}
                  </button>
                </div>

                <!-- Info -->
                <div class="flex-1">
                  <div class="mb-3">
                    <span class="mb-1 block" style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted))"
                      >姓名</span
                    >
                    <input
                      v-if="editingName"
                      v-model="nameValue"
                      type="text"
                      class="w-full border px-2 py-1 text-sm outline-none"
                      :style="{
                        background: 'rgba(74,64,53,0.3)',
                        borderColor: 'rgba(90,79,64,0.4)',
                        color: 'var(--theme-text-main, var(--vn-fg))',
                        borderRadius: '2px',
                      }"
                      autofocus
                      @blur="handleNameSave"
                      @keydown.enter="handleNameSave"
                    />
                    <div
                      v-else
                      class="cursor-pointer text-sm transition-colors"
                      style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))"
                      @click="editingName = true"
                    >
                      {{ store.userCharacter.name }}
                      <span style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted)); margin-left: 8px"
                        >(点击编辑)</span
                      >
                    </div>
                  </div>

                  <div class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-2">
                      <i
                        :class="
                          store.userCharacter.avatarDisplayMode !== 'off' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'
                        "
                        :style="{
                          fontSize: '0.8rem',
                          color:
                            store.userCharacter.avatarDisplayMode !== 'off'
                              ? 'var(--theme-accent, var(--rust))'
                              : 'var(--theme-text-muted, var(--vn-muted))',
                        }"
                      />
                      <span class="text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))"
                        >显示玩家头像</span
                      >
                    </div>
                    <div
                      class="flex items-center overflow-hidden rounded border"
                      style="border-color: rgba(90, 79, 64, 0.45)"
                    >
                      <button
                        class="px-3 py-1 text-xs transition-colors"
                        :style="modeButtonStyle(store.userCharacter.avatarDisplayMode === 'avatar')"
                        @click="toggleAvatarDisplayMode('avatar')"
                      >
                        头像
                      </button>
                      <button
                        class="px-3 py-1 text-xs transition-colors"
                        :style="modeButtonStyle(store.userCharacter.avatarDisplayMode === 'sprite')"
                        @click="toggleAvatarDisplayMode('sprite')"
                      >
                        立绘
                      </button>
                    </div>
                  </div>
                  <p
                    v-if="!store.userCharacter.avatarUrl"
                    style="font-size: 9px; color: var(--theme-text-muted, rgba(139, 125, 107, 0.6)); margin-top: 4px"
                  >
                    请先上传头像才能开启立绘显示
                  </p>
                </div>
              </div>
            </div>

            <!-- Character roster divider -->
            <div class="headline-rule mb-6">
              <span
                style="
                  font-size: 9px;
                  color: var(--theme-text-muted, var(--vn-muted));
                  font-family: monospace;
                  letter-spacing: 0.15em;
                  padding: 0 8px;
                  background: var(--vn-panel-bg);
                  position: relative;
                  z-index: 10;
                "
              >
                --- 角色图鉴 ---
              </span>
            </div>

            <!-- Character roster -->
            <div class="flex flex-col gap-3">
              <div
                v-for="char in store.characterRoster"
                :key="char.id"
                class="border transition-all duration-200"
                :style="{
                  borderColor: char.unlocked ? 'rgba(90,79,64,0.4)' : 'rgba(90,79,64,0.2)',
                  background: char.unlocked ? 'rgba(212,197,160,0.02)' : 'rgba(74,64,53,0.1)',
                  opacity: char.unlocked ? 1 : 0.5,
                  borderRadius: '2px',
                }"
              >
                <div class="flex items-center gap-3 p-3">
                  <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border"
                    :style="{ borderColor: 'rgba(90,79,64,0.3)', background: 'rgba(74,64,53,0.2)' }"
                  >
                    <img
                      v-if="char.avatarUrl"
                      :src="char.avatarUrl"
                      :alt="char.name"
                      class="h-full w-full object-cover"
                      style="filter: sepia(0.4)"
                    />
                    <i v-else class="fa-solid fa-user" style="color: var(--theme-text-faint, rgba(139, 125, 107, 0.3))" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span
                        class="text-sm font-bold"
                        :style="{
                          color: char.unlocked
                            ? 'var(--theme-text-main, rgba(212,197,160,0.9))'
                            : 'var(--theme-text-muted, var(--vn-muted))',
                        }"
                      >
                        {{ char.unlocked ? char.name : '???' }}
                      </span>
                      <span
                        v-if="!char.unlocked"
                        class="border px-1"
                        style="
                          font-size: 8px;
                          color: var(--theme-text-muted, var(--vn-muted));
                          border-color: rgba(90, 79, 64, 0.3);
                        "
                        >未解锁</span
                      >
                    </div>
                    <p
                      v-if="char.unlocked && char.description"
                      class="truncate"
                      style="font-size: 11px; color: var(--theme-text-muted, var(--vn-muted)); margin-top: 2px"
                    >
                      {{ char.description }}
                    </p>
                  </div>
                  <div v-if="char.unlocked" class="flex shrink-0 items-center gap-1">
                    <i
                      class="fa-solid fa-heart"
                      style="font-size: 0.75rem; color: var(--theme-accent-soft, rgba(139, 69, 19, 0.6))"
                    />
                    <span class="font-mono text-xs" style="color: var(--theme-text-muted, var(--vn-muted))">{{
                      char.affection
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Role system tab -->
          <template v-else-if="activeTab === 'roleSystem'">
            <!-- Empty state -->
            <div v-if="allRoles.length === 0" class="py-12 text-center">
              <i
                class="fa-solid fa-users mb-4 block text-4xl"
                style="color: var(--theme-text-faint, rgba(139,125,107,0.3))"
              />
              <h3
                class="mb-2 text-base font-bold"
                style="color: var(--theme-text-main, rgba(212,197,160,0.85))"
              >
                暂无角色
              </h3>
              <p class="mb-6 text-sm" style="color: var(--theme-text-muted, var(--vn-muted))">
                生成你的第一个角色，开启废土冒险之旅
              </p>
              <button
                class="border px-6 py-2.5 text-sm transition-colors"
                :style="{ ...buttonStyle, background: 'rgba(139,69,19,0.25)' }"
                @click="openRoleGenerationModal"
              >
                <i class="fa-solid fa-wand-magic-sparkles mr-2" />
                生成角色
              </button>
            </div>

            <!-- Role list (when no role selected) -->
            <template v-else>
              <!-- Role list header -->
              <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-list" style="color: var(--theme-accent, var(--rust)); font-size: 0.875rem" />
                  <h3
                    class="text-sm font-bold tracking-widest"
                    style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))"
                  >
                    角色列表 ({{ allRoles.length }})
                  </h3>
                </div>
                <button
                  class="border px-3 py-1.5 text-xs transition-colors"
                  :style="{ ...buttonStyle, background: 'rgba(139,69,19,0.2)' }"
                  @click="openRoleGenerationModal"
                >
                  <i class="fa-solid fa-plus mr-1.5" />
                  生成角色
                </button>
              </div>

              <!-- Role cards grid -->
              <div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div
                  v-for="role in allRoles"
                  :key="role.id"
                  class="cursor-pointer rounded border p-3 transition-all hover:border-amber-800/50"
                  :style="{
                    borderColor: selectedRole?.id === role.id ? 'rgba(139,69,19,0.6)' : 'rgba(90,79,64,0.4)',
                    background: selectedRole?.id === role.id ? 'rgba(139,69,19,0.08)' : 'rgba(212,197,160,0.02)',
                  }"
                  @click="selectRole(role)"
                >
                  <!-- Role header -->
                  <div class="mb-2 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span
                        class="text-lg"
                      >
                        {{ getStatusEmoji(role.状态) }}
                      </span>
                      <span
                        class="font-bold"
                        style="color: var(--theme-text-main, rgba(212,197,160,0.92))"
                      >
                        {{ role.姓名 }}
                      </span>
                    </div>
                    <span
                      class="rounded px-2 py-0.5 text-xs font-medium"
                      :style="getStatusStyle(role.状态)"
                    >
                      {{ role.状态 }}
                    </span>
                  </div>

                  <!-- Role meta -->
                  <div class="mb-2 flex items-center gap-2 text-xs" style="color: var(--theme-text-muted, var(--vn-muted))">
                    <span v-if="role.定位">{{ role.定位 }}</span>
                    <span v-if="role.职业">· {{ role.职业 }}</span>
                  </div>

                  <!-- Attribute bars -->
                  <div class="mb-2 grid grid-cols-3 gap-1 text-xs">
                    <div style="color: var(--theme-text-soft, rgba(212,197,160,0.7))">
                      战力 {{ getAttributeStars(role.属性.战力) }}
                    </div>
                    <div style="color: var(--theme-text-soft, rgba(212,197,160,0.7))">
                      技巧 {{ getAttributeStars(role.属性.技巧) }}
                    </div>
                    <div style="color: var(--theme-text-soft, rgba(212,197,160,0.7))">
                      智慧 {{ getAttributeStars(role.属性.智慧) }}
                    </div>
                    <div style="color: var(--theme-text-soft, rgba(212,197,160,0.7))">
                      社交 {{ getAttributeStars(role.属性.社交) }}
                    </div>
                    <div style="color: var(--theme-text-soft, rgba(212,197,160,0.7))">
                      谨慎 {{ getAttributeStars(role.属性.谨慎) }}
                    </div>
                    <div style="color: var(--theme-text-soft, rgba(212,197,160,0.7))">
                      运气 {{ getAttributeStars(role.属性.运气) }}
                    </div>
                  </div>

                  <!-- Equipped skills count -->
                  <div
                    v-if="role.已装备技能.length > 0"
                    class="flex items-center gap-1 text-xs"
                    style="color: var(--theme-text-muted, var(--vn-muted))"
                  >
                    <i class="fa-solid fa-bolt" style="color: var(--theme-accent, var(--rust))" />
                    <span>{{ role.已装备技能.length }} 个技能</span>
                  </div>
                </div>
              </div>

              <!-- Role detail view -->
              <div v-if="selectedRole" class="rounded border p-4" style="border-color: rgba(90,79,64,0.4); background: rgba(74,64,53,0.1)">
                <!-- Detail header -->
                <div class="mb-4 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="text-2xl">{{ getStatusEmoji(selectedRole.状态) }}</span>
                    <div>
                      <h3
                        class="text-lg font-bold"
                        style="color: var(--theme-text-main, rgba(212,197,160,0.92))"
                      >
                        {{ selectedRole.姓名 }}
                      </h3>
                      <p class="text-xs" style="color: var(--theme-text-muted, var(--vn-muted))">
                        {{ selectedRole.定位 || '未设定定位' }}
                        <span v-if="selectedRole.职业"> · {{ selectedRole.职业 }}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    class="h-8 w-8 cursor-pointer"
                    style="color: var(--theme-text-muted, var(--vn-muted))"
                    @click="selectedRole = null"
                  >
                    <i class="fa-solid fa-xmark" />
                  </button>
                </div>

                <!-- Status section -->
                <div class="mb-4 flex items-center gap-3">
                  <span
                    class="rounded px-3 py-1 text-sm font-medium"
                    :style="getStatusStyle(selectedRole.状态)"
                  >
                    {{ selectedRole.状态 }}
                  </span>
                  <span
                    v-if="selectedRole.当前任务"
                    class="text-sm"
                    style="color: var(--theme-text-soft, rgba(212,197,160,0.7))"
                  >
                    任务：{{ selectedRole.当前任务 }}
                  </span>
                </div>

                <!-- Appearance & Personality -->
                <div v-if="selectedRole.外貌 || selectedRole.性格" class="mb-4">
                  <div v-if="selectedRole.外貌" class="mb-2">
                    <span class="text-xs font-medium" style="color: var(--theme-text-muted, var(--vn-muted))">外貌</span>
                    <p class="text-sm" style="color: var(--theme-text-main, rgba(212,197,160,0.85))">
                      {{ selectedRole.外貌 }}
                    </p>
                  </div>
                  <div v-if="selectedRole.性格">
                    <span class="text-xs font-medium" style="color: var(--theme-text-muted, var(--vn-muted))">性格</span>
                    <p class="text-sm" style="color: var(--theme-text-main, rgba(212,197,160,0.85))">
                      {{ selectedRole.性格 }}
                    </p>
                  </div>
                </div>

                <!-- Attributes -->
                <div class="mb-4">
                  <h4
                    class="mb-2 text-xs font-bold tracking-wider"
                    style="color: var(--theme-text-main, rgba(212,197,160,0.9))"
                  >
                    属性
                  </h4>
                  <div class="space-y-1.5">
                    <div v-for="attr in attributeList" :key="attr.key" class="flex items-center gap-3">
                      <span class="w-12 text-xs" style="color: var(--theme-text-muted, var(--vn-muted))">
                        {{ attr.label }}
                      </span>
                      <div class="flex-1">
                        <div class="flex gap-0.5">
                          <span
                            v-for="i in 5"
                            :key="i"
                            :style="{
                              color: i <= selectedRole.属性[attr.key as keyof typeof selectedRole.属性]
                                ? (i >= 4 ? '#ef4444' : i >= 2 ? '#eab308' : 'var(--theme-accent, var(--rust))')
                                : 'var(--theme-text-faint, rgba(139,125,107,0.3))',
                              fontSize: '0.9rem',
                            }"
                          >
                            ★
                          </span>
                        </div>
                      </div>
                      <span
                        class="w-4 text-right text-xs font-mono"
                        style="color: var(--theme-text-soft, rgba(212,197,160,0.7))"
                      >
                        {{ selectedRole.属性[attr.key as keyof typeof selectedRole.属性] ?? 0 }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Equipped skills -->
                <div v-if="selectedRole.已装备技能.length > 0" class="mb-4">
                  <h4
                    class="mb-2 text-xs font-bold tracking-wider"
                    style="color: var(--theme-text-main, rgba(212,197,160,0.9))"
                  >
                    装备技能
                  </h4>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="skillId in selectedRole.已装备技能"
                      :key="skillId"
                      class="rounded border px-2 py-1 text-xs"
                      style="background: rgba(139,69,19,0.15); border-color: rgba(139,69,19,0.4); color: var(--theme-text-main, rgba(212,197,160,0.85))"
                    >
                      {{ getSkillName(skillId) }}
                    </span>
                  </div>
                </div>

                <!-- Action buttons -->
                <div class="flex flex-wrap gap-2 border-t pt-4" style="border-color: rgba(90,79,64,0.3)">
                  <button
                    class="border px-3 py-1.5 text-xs transition-colors"
                    :style="buttonStyle"
                    @click="openHistoryModal(selectedRole)"
                  >
                    <i class="fa-solid fa-clock-rotate-left mr-1.5" />
                    查看记录
                  </button>
                  <button
                    class="border px-3 py-1.5 text-xs transition-colors"
                    :style="buttonStyle"
                    @click="openSkillManagement(selectedRole)"
                  >
                    <i class="fa-solid fa-bolt mr-1.5" />
                    管理技能
                  </button>
                  <button
                    v-if="selectedRole.状态 === '空闲' || selectedRole.状态 === '休息中'"
                    class="border px-3 py-1.5 text-xs transition-colors"
                    :style="{ ...buttonStyle, background: 'rgba(139,69,19,0.25)' }"
                    @click="handleDispatchRole(selectedRole)"
                  >
                    <i class="fa-solid fa-paper-plane mr-1.5" />
                    派遣
                  </button>
                </div>
              </div>
            </template>
          </template>
        </div>

        <div :style="decoBottomThin" />
        <div :style="decoBottom" />
      </div>
    </SkinShell>
  </div>
</template>

<script setup lang="ts">
import SkinShell from '../common/SkinShell.vue';
import { useVNStore } from '../../store';
import { getStatusEmoji, getAttributeEmoji } from '../../utils/roleFormatter';
import { generateRolesWithSkills, type RoleGenerationError } from '../../utils/roleGenerator';
import type { 角色, 技能, 角色状态 } from '../../types/role';

const store = useVNStore();
const fileInput = ref<HTMLInputElement | null>(null);
const showFullAvatar = ref(false);
const avatarModalOpen = ref(false);
const avatarUrlInput = ref('');
const avatarDraftPreviewUrl = ref('');
const editingName = ref(false);
const nameValue = ref(store.userCharacter.name);

// Tab state
const activeTab = ref<'character' | 'roleSystem'>('roleSystem');

// Role system state
const allRoles = computed(() => store.getAllRoles());
const allSkills = computed(() => store.getAllSkills());
const selectedRole = ref<角色 | null>(null);

// Generation modal state
const roleGenerationModalOpen = ref(false);
const generationScene = ref('');
const generationCount = ref(1);
const isGenerating = ref(false);
const generationError = ref('');
const generatedRoles = ref<角色[]>([]);

// Skill management modal state
const skillManagementModalOpen = ref(false);
const selectedRoleForSkill = ref<角色 | null>(null);
const skillFilterTab = ref<'all' | 'equipped' | 'available'>('all');

// History modal state
const historyModalOpen = ref(false);
const selectedRoleForHistory = ref<角色 | null>(null);

const characterPanelSkin = computed(() => store.getComponentSkinForCurrent('characterPanel'));

const attributeList = [
  { key: '战力', label: '战力' },
  { key: '技巧', label: '技巧' },
  { key: '智慧', label: '智慧' },
  { key: '社交', label: '社交' },
  { key: '谨慎', label: '谨慎' },
  { key: '运气', label: '运气' },
] as const;

const panelStyle = {
  width: '100%',
  height: '100%',
  maxHeight: 'var(--theme-panel-max-height, 100%)',
  borderColor: 'var(--theme-panel-border, rgba(90,79,64,0.6))',
  background: 'var(--theme-panel-bg, var(--vn-panel-bg))',
  backdropFilter: 'blur(var(--theme-panel-content-blur, 12px)) saturate(var(--theme-panel-content-saturate, 100%))',
  display: 'flex',
  flexDirection: 'column' as const,
};
const panelShellStyle = {
  maxWidth: 'var(--theme-character-panel-shell-max-width, var(--theme-panel-shell-max-width, min(100%, 68rem)))',
  maxHeight: 'var(--theme-character-panel-shell-max-height, var(--theme-panel-shell-max-height, 90%))',
};
const headerBorder = { borderBottom: '1px solid rgba(90,79,64,0.3)' };
const decoTop = {
  height: '3px',
  background: 'linear-gradient(to right, transparent, var(--theme-accent-soft, rgba(139,69,19,0.6)), transparent)',
};
const decoTopThin = {
  height: '1px',
  marginTop: '1px',
  background: 'linear-gradient(to right, transparent, rgba(139,69,19,0.3), transparent)',
};
const decoBottomThin = {
  height: '1px',
  background: 'linear-gradient(to right, transparent, rgba(139,69,19,0.3), transparent)',
};
const decoBottom = {
  height: '2px',
  marginTop: '1px',
  background: 'linear-gradient(to right, transparent, var(--theme-accent-soft, rgba(139,69,19,0.5)), transparent)',
};
const inputStyle = {
  background: 'rgba(74,64,53,0.3)',
  borderColor: 'rgba(90,79,64,0.4)',
  color: 'var(--theme-text-main, var(--vn-fg))',
  borderRadius: '2px',
};
const buttonStyle = {
  background: 'rgba(74,64,53,0.24)',
  borderColor: 'rgba(90,79,64,0.45)',
  color: 'var(--theme-text-main, rgba(212,197,160,0.9))',
};
const modeButtonStyle = (active: boolean) => ({
  background: active ? 'rgba(139,69,19,0.28)' : 'rgba(74,64,53,0.2)',
  color: active
    ? 'var(--theme-text-inverse, rgba(255,230,210,0.96))'
    : 'var(--theme-text-soft, rgba(212,197,160,0.72))',
});

function getStatusStyle(status: 角色状态): Record<string, string> {
  const styles: Record<角色状态, Record<string, string>> = {
    空闲: { background: 'rgba(34,197,94,0.15)', color: '#4ade80' },
    派遣中: { background: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
    工坊中: { background: 'rgba(168,85,247,0.15)', color: '#c084fc' },
    逃跑中: { background: 'rgba(249,115,22,0.15)', color: '#fb923c' },
    休息中: { background: 'rgba(236,72,153,0.15)', color: '#f472b6' },
    加班中: { background: 'rgba(245,158,11,0.15)', color: '#facc15' },
    受伤: { background: 'rgba(239,68,68,0.15)', color: '#f87171' },
  };
  return styles[status] || { background: 'rgba(90,79,64,0.2)', color: 'var(--theme-text-muted, var(--vn-muted))' };
}

function getAttributeStars(value: number): string {
  return getAttributeEmoji(value ?? 0);
}

function getSkillName(skillId: string): string {
  const skill = store.getSkill(skillId);
  return skill?.名称 ?? skillId;
}

const filteredSkills = computed(() => {
  if (!selectedRoleForSkill.value) return [];
  const equipped = selectedRoleForSkill.value.已装备技能;

  switch (skillFilterTab.value) {
    case 'equipped':
      return allSkills.value.filter(s => equipped.includes(s.id));
    case 'available':
      return allSkills.value.filter(s => !equipped.includes(s.id));
    default:
      return allSkills.value;
  }
});

function isSkillEquipped(skillId: string): boolean {
  if (!selectedRoleForSkill.value) return false;
  return selectedRoleForSkill.value.已装备技能.includes(skillId);
}

const sortedRoleRecords = computed(() => {
  if (!selectedRoleForHistory.value) return [];
  return [...selectedRoleForHistory.value.记录].sort((a, b) => b.时间 - a.时间);
});

function getRecordTypeColor(type: string): string {
  const colors: Record<string, string> = {
    派遣: '#60a5fa',
    工坊: '#c084fc',
    通讯: '#4ade80',
    其他: 'rgba(212,197,160,0.5)',
  };
  return colors[type] || colors.其他;
}

function getRecordTypeBg(type: string): string {
  const colors: Record<string, string> = {
    派遣: 'rgba(59,130,246,0.15)',
    工坊: 'rgba(168,85,247,0.15)',
    通讯: 'rgba(34,197,94,0.15)',
    其他: 'rgba(90,79,64,0.15)',
  };
  return colors[type] || colors.其他;
}

function formatRecordTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function selectRole(role: 角色) {
  selectedRole.value = selectedRole.value?.id === role.id ? null : role;
}

function openRoleGenerationModal() {
  roleGenerationModalOpen.value = true;
  generationScene.value = '';
  generationCount.value = 1;
  isGenerating.value = false;
  generationError.value = '';
  generatedRoles.value = [];
}

function closeRoleGenerationModal() {
  roleGenerationModalOpen.value = false;
}

async function handleGenerateRoles() {
  isGenerating.value = true;
  generationError.value = '';
  generatedRoles.value = [];

  try {
    const { roles } = await generateRolesWithSkills({
      count: generationCount.value,
      scene: generationScene.value || undefined,
      existingRoles: allRoles.value,
      existingSkills: allSkills.value,
    });
    generatedRoles.value = roles;
  } catch (err) {
    const error = err as RoleGenerationError;
    generationError.value = error.message || '生成失败，请重试';
  } finally {
    isGenerating.value = false;
  }
}

function handleConfirmGeneratedRoles() {
  for (const role of generatedRoles.value) {
    store.addRole(role);
  }
  closeRoleGenerationModal();
  store.showToast(`成功添加 ${generatedRoles.value.length} 个角色`);
}

function openSkillManagement(role: 角色) {
  selectedRoleForSkill.value = { ...role };
  skillFilterTab.value = 'all';
  skillManagementModalOpen.value = true;
}

function closeSkillManagement() {
  // Sync equipped skills back to store
  if (selectedRoleForSkill.value) {
    store.updateRole(selectedRoleForSkill.value);
  }
  skillManagementModalOpen.value = false;
  selectedRoleForSkill.value = null;
}

function toggleSkill(skillId: string) {
  if (!selectedRoleForSkill.value) return;
  const equipped = selectedRoleForSkill.value.已装备技能;
  const idx = equipped.indexOf(skillId);

  if (idx >= 0) {
    // Unequip
    selectedRoleForSkill.value = {
      ...selectedRoleForSkill.value,
      已装备技能: equipped.filter(id => id !== skillId),
    };
  } else {
    // Equip
    selectedRoleForSkill.value = {
      ...selectedRoleForSkill.value,
      已装备技能: [...equipped, skillId],
    };
  }
}

function openHistoryModal(role: 角色) {
  selectedRoleForHistory.value = role;
  historyModalOpen.value = true;
}

function closeHistoryModal() {
  historyModalOpen.value = false;
  selectedRoleForHistory.value = null;
}

function handleDispatchRole(role: 角色) {
  store.showToast(`${role.姓名} 派遣功能即将开放`);
}

function openAvatarModal() {
  avatarModalOpen.value = true;
  avatarUrlInput.value = store.userCharacter.avatarUrl;
  avatarDraftPreviewUrl.value = store.userCharacter.avatarUrl;
}

function closeAvatarModal() {
  avatarModalOpen.value = false;
}

function toggleAvatarDisplayMode(mode: 'avatar' | 'sprite') {
  const current = store.userCharacter.avatarDisplayMode;
  if (current === mode) {
    store.updateUserCharacter({ avatarDisplayMode: 'off', showSprite: false });
    return;
  }
  if (mode === 'avatar') {
    store.updateUserCharacter({ avatarDisplayMode: 'avatar', showSprite: false });
    return;
  }
  store.updateUserCharacter({ avatarDisplayMode: 'sprite', showSprite: false });
}

function openLocalPicker() {
  fileInput.value?.click();
}

function setDraftPreview(url: string) {
  avatarDraftPreviewUrl.value = url;
}

function handleAvatarUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file || !file.type.startsWith('image/')) return;
  const url = URL.createObjectURL(file);
  avatarUrlInput.value = '';
  avatarDraftPreviewUrl.value = url;
  avatarModalOpen.value = true;
  if (e.target instanceof HTMLInputElement) e.target.value = '';
}

function handleApplyDraft() {
  const input = avatarUrlInput.value.trim();
  const nextUrl = input || avatarDraftPreviewUrl.value;
  if (!nextUrl) {
    store.showToast('请先导入或输入头像链接');
    return;
  }
  store.updateUserCharacter({ avatarUrl: nextUrl });
  closeAvatarModal();
}

function handleClearAvatar() {
  store.updateUserCharacter({ avatarUrl: '', avatarDisplayMode: 'off', showSprite: false });
  avatarUrlInput.value = '';
  setDraftPreview('');
  closeAvatarModal();
}

function handleNameSave() {
  if (nameValue.value.trim()) {
    store.updateUserCharacter({ name: nameValue.value.trim() });
  }
  editingName.value = false;
}
</script>
