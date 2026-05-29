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
        <!-- Content -->
        <div class="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">
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

const store = useVNStore();
const fileInput = ref<HTMLInputElement | null>(null);
const showFullAvatar = ref(false);
const avatarModalOpen = ref(false);
const avatarUrlInput = ref('');
const avatarDraftPreviewUrl = ref('');
const editingName = ref(false);
const nameValue = ref(store.userCharacter.name);

const characterPanelSkin = computed(() => store.getComponentSkinForCurrent('characterPanel'));

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
