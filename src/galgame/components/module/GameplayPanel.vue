<template>
  <div data-ui="gameplay-panel" class="absolute inset-0 flex items-center justify-center" style="z-index: 50">
    <div
      data-ui="panel-backdrop"
      class="absolute inset-0 backdrop-blur-sm"
      style="background: var(--theme-panel-backdrop, rgba(42, 36, 32, 0.7))"
      @click="handleBackdropClick"
    />

    <ModuleView v-if="store.activeModuleId" :module-id="store.activeModuleId" @close="store.activeModuleId = null" />

    <div class="animate-fade-in-up relative mx-4 w-full max-w-2xl overflow-hidden border" :style="panelStyle">
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
              >GAMEPLAY</span
            >
          </div>
          <h2 class="text-lg font-bold tracking-widest" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">
            玩法
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

      <!-- Gold / Inventory Bar -->
      <div class="flex items-center gap-3 px-6 py-3" :style="{ borderBottom: '1px solid rgba(90,79,64,0.2)' }">
        <button class="gold-counter cursor-pointer" @click="store.activeModuleId = 'gold_log'">
          <i class="fa-solid fa-coins" style="font-size: 0.75rem" />
          <span class="font-bold">{{ store.gold }}</span>
          <i class="fa-solid fa-chevron-right" style="font-size: 0.5rem; opacity: 0.5" />
        </button>
        <button
          class="flex cursor-pointer items-center gap-1.5 border px-2.5 py-1 text-xs transition-all"
          style="
            border-color: rgba(90, 79, 64, 0.4);
            border-radius: 2px;
            color: var(--theme-text-muted, var(--vn-muted));
          "
          @click="store.activeModuleId = 'inventory'"
        >
          <i class="fa-solid fa-box-open" style="font-size: 0.7rem" />
          <span>背包</span>
          <span
            v-if="store.inventory.length > 0"
            style="color: var(--theme-accent, var(--rust)); font-family: monospace"
            >{{ store.inventory.length }}</span
          >
        </button>
        <div class="flex-1" />
        <div style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted)); font-family: monospace">
          Lv.{{ store.workshopLevel }} 工坊
        </div>
      </div>

      <!-- System Terminal Entry -->
      <div
        class="sys-terminal-entry"
        :style="{ borderBottom: '1px solid rgba(90,79,64,0.2)' }"
        @click="toggleSystemChat"
      >
        <div class="sys-terminal-inner">
          <div class="sys-terminal-scanline" />
          <div class="relative flex items-center justify-center gap-2.5 py-2.5">
            <span class="sys-terminal-dot" :class="{ 'sys-terminal-dot-active': chatMode }" />
            <span class="sys-terminal-label">
              {{ chatMode ? '◇ 返回功能面板 ◇' : '◈ 末世通讯终端 · 接入 ◈' }}
            </span>
            <span v-if="!chatMode" class="sys-terminal-badge">ONLINE</span>
          </div>
        </div>
      </div>

      <!-- Module Grid -->
      <div ref="moduleGridRef" class="no-scrollbar overflow-y-auto px-6 py-5" style="max-height: calc(100vh - 350px)">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <button
            v-for="mod in displayModules"
            :key="mod.moduleId"
            class="module-card-item relative border text-left transition-all duration-200"
            :style="{
              borderColor: mod.lockReason ? 'rgba(90,79,64,0.2)' : 'rgba(90,79,64,0.4)',
              opacity: mod.lockReason ? 0.4 : 1,
              cursor: mod.lockReason ? 'not-allowed' : 'pointer',
              borderRadius: '2px',
            }"
            :disabled="!!mod.lockReason"
            @click="!mod.lockReason && handleModuleClick(mod.moduleId)"
          >
            <div
              :style="{
                height: '1px',
                background: 'linear-gradient(to right, transparent, rgba(212,197,160,0.15), transparent)',
              }"
            />
            <div class="p-4">
              <div class="flex items-start gap-3">
                <div
                  class="shrink-0"
                  :style="{
                    color: mod.lockReason
                      ? 'var(--theme-text-faint, rgba(139,125,107,0.3))'
                      : 'var(--theme-accent-soft, rgba(139,69,19,0.7))',
                  }"
                >
                  <i :class="mod.lockReason ? 'fa-solid fa-lock' : 'fa-solid ' + mod.icon" style="font-size: 1.1rem" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span
                      class="text-sm font-bold"
                      :style="{
                        color: mod.lockReason
                          ? 'var(--theme-text-muted, var(--vn-muted))'
                          : 'var(--theme-text-main, rgba(212,197,160,0.9))',
                      }"
                      >{{ mod.displayName }}</span
                    >
                    <span
                      v-if="mod.badge"
                      class="border px-1"
                      style="
                        font-size: 8px;
                        color: var(--theme-accent, var(--rust));
                        border-color: rgba(139, 69, 19, 0.3);
                      "
                      >{{ mod.badge }}</span
                    >
                    <template v-if="mod.moduleId === 'idle_workshop' && store.workshopCharacterId">
                      <span
                        v-if="store.workshopProducing"
                        class="border px-1"
                        style="font-size: 8px; color: var(--vn-success); border-color: rgba(90, 122, 74, 0.3)"
                        >生产中</span
                      >
                      <span
                        v-else
                        class="border px-1"
                        style="font-size: 8px; color: var(--stain); border-color: rgba(196, 162, 101, 0.3)"
                        >已暂停</span
                      >
                      <button
                        class="flex h-5 w-5 cursor-pointer items-center justify-center border"
                        style="border-color: rgba(90, 79, 64, 0.3); border-radius: 2px; font-size: 0.55rem"
                        :style="{ color: store.workshopProducing ? 'var(--stain)' : 'var(--vn-success)' }"
                        @click.stop="store.workshopProducing ? store.pauseProduction() : store.resumeProduction()"
                      >
                        <i :class="store.workshopProducing ? 'fa-solid fa-pause' : 'fa-solid fa-play'" />
                      </button>
                    </template>
                  </div>
                  <p
                    style="
                      font-size: 11px;
                      color: var(--theme-text-muted, var(--vn-muted));
                      margin-top: 4px;
                      line-height: 1.6;
                    "
                  >
                    {{ mod.description }}
                  </p>
                  <p
                    v-if="mod.lockReason"
                    style="
                      font-size: 9px;
                      color: var(--theme-text-faint, rgba(139, 125, 107, 0.5));
                      margin-top: 6px;
                      font-family: monospace;
                    "
                  >
                    [ {{ mod.lockReason }} ]
                  </p>
                </div>
                <div v-if="mod.moduleId === 'puzzle_2048'" class="flex shrink-0 flex-col items-end justify-center">
                  <span style="font-size: 9px; color: var(--stain); font-family: monospace; font-weight: bold">
                    {{ puzzleFee > 0 ? `${puzzleFee}G` : '免费' }}
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div class="module-footer-note mt-6 pt-4 text-center" :style="{ borderTop: '1px solid rgba(90,79,64,0.2)' }">
          <p style="font-size: 9px; color: var(--theme-text-faint, rgba(139, 125, 107, 0.4)); font-family: monospace">
            模块不会影响当前剧情进度 · 关闭后返回此界面
          </p>
        </div>
      </div>

      <!-- System Chat -->
      <div ref="systemChatRef" class="sys-chat-wrapper" style="display: none">
        <div class="sys-chat-container">
          <!-- Contacts Header (Horizontal on mobile, Vertical on desktop) -->
          <div ref="contactsRef" class="sys-contacts-header">
            <div class="sys-contacts-title">
              <i class="fa-solid fa-tower-broadcast" style="font-size: 0.6rem" />
              <span>频道</span>
            </div>
            <div class="sys-contacts-list">
              <div
                v-for="p in store.SYSTEM_PERSONALITIES"
                :key="p.id"
                class="sys-contact-card"
                :class="{ 'sys-contact-active': store.activePersonalityId === p.id }"
                @click="store.selectSystemPersonality(p.id)"
              >
                <div class="sys-contact-avatar">
                  <span>{{ p.avatarChar || p.name.charAt(0) }}</span>
                  <div v-if="store.unreadPersonalityIds.has(p.id)" class="sys-contact-online-dot" />
                </div>
                <div class="sys-contact-name">{{ p.name }}</div>
              </div>
            </div>
          </div>

          <!-- Chat Area -->
          <div ref="chatAreaRef" class="sys-chat-main">
            <div ref="chatMessagesRef" class="sys-chat-messages">
              <template v-if="store.activePersonalityId">
                <template v-for="(msg, i) in currentChatHistory" :key="i">
                  <!-- 普通清理分割线 -->
                  <div
                    v-if="msg.role === 'divider'"
                    class="sys-chat-divider"
                    @click="store.clearHistoryBeforeDivider(store.activePersonalityId!)"
                  >
                    <span class="sys-chat-divider-text">—— ✦ 清除以上历史记录 ✦ ——</span>
                  </div>

                  <!-- 情报交换专用分割线（双线装饰，无文字无交互） -->
                  <div v-else-if="msg.role === 'riddle_divider'" class="sys-chat-riddle-divider">
                    <div class="sys-chat-riddle-divider-line" />
                  </div>

                  <!-- 情报交换开始分割线 -->
                  <div v-else-if="msg.role === 'riddle_start'" class="sys-chat-divider sys-chat-divider-riddle-start">
                    <span class="sys-chat-divider-text">—— ✧ 情报交换模块 ✧ ——</span>
                  </div>

                  <!-- 情报交换进行中结束线（可放弃） -->
                  <div
                    v-else-if="msg.role === 'riddle_end_pending'"
                    class="sys-chat-divider sys-chat-divider-riddle-end"
                    @click="openRiddleAbortConfirm()"
                  >
                    <div class="sys-riddle-settle">当前结算金额：{{ 50 + store.riddleRounds * 20 }}G</div>
                    <span class="sys-chat-divider-text">—— ✧ 放弃猜谜 ✧ ——</span>
                  </div>

                  <!-- 情报交换已结束 -->
                  <div
                    v-else-if="msg.role === 'riddle_end'"
                    class="sys-chat-divider sys-chat-divider-riddle-end-finished"
                  >
                    <span class="sys-chat-divider-text">—— ✧ 模块结束 ✧ ——</span>
                  </div>

                  <!-- 普通消息 -->
                  <div v-else class="sys-msg" :class="msg.role === 'user' ? 'sys-msg-right' : 'sys-msg-left'">
                    <div v-if="msg.role === 'proactive'" class="sys-proactive-tag">
                      <i class="fa-solid fa-bolt" style="font-size: 7px" />
                      吐槽
                    </div>
                    <div class="sys-msg-bubble" :class="msg.role === 'user' ? 'sys-bubble-user' : 'sys-bubble-system'">
                      {{ msg.text }}
                    </div>
                  </div>
                </template>
                <div v-if="currentChatHistory.length === 0" class="sys-empty-chat">
                  <i class="fa-solid fa-satellite-dish" style="font-size: 1.2rem; opacity: 0.3" />
                  <span>频道已接通，发送消息开始对话</span>
                </div>
              </template>
              <div v-else class="sys-empty-chat">
                <i class="fa-solid fa-signal" style="font-size: 1.2rem; opacity: 0.3" />
                <span>选择左侧频道接入通讯</span>
              </div>
            </div>

            <!-- Input Bar -->
            <div ref="inputBarRef" class="sys-input-bar">
              <!-- @ Context Tag -->
              <div v-if="atContextTag" class="sys-at-tag-row">
                <span class="sys-at-tag">
                  <i class="fa-solid fa-at" style="font-size: 8px" />
                  {{ atContextTag }}
                </span>
                <button class="sys-at-tag-remove" @click="clearAtContext">
                  <i class="fa-solid fa-xmark" style="font-size: 9px" />
                </button>
              </div>
              <!-- @ Floor Picker (inline popup) -->
              <div v-if="showAtPicker" class="sys-at-picker">
                <div class="sys-at-picker-title">
                  <i class="fa-solid fa-at" style="font-size: 9px" />
                  引用楼层（当前共 {{ maxFloorId + 1 }} 楼，0 ~ {{ maxFloorId }}）
                </div>
                <div class="sys-at-picker-row">
                  <input
                    v-model="atFloorInput"
                    class="sys-at-input"
                    placeholder="如：3 或 1-5"
                    @keydown.enter="confirmAtFloor"
                    @keydown.esc="showAtPicker = false"
                  />
                  <button class="sys-at-confirm-btn" @click="confirmAtFloor">确认</button>
                  <button class="sys-at-cancel-btn" @click="showAtPicker = false">取消</button>
                </div>
                <div
                  style="
                    font-size: 9px;
                    color: var(--theme-text-muted, var(--vn-muted));
                    margin-top: 4px;
                    font-family: monospace;
                  "
                >
                  提示：单楼层填数字，区间填"起-止"
                </div>
              </div>
              <div class="sys-input-wrapper">
                <!-- @ Button -->
                <button
                  class="sys-at-btn"
                  :class="{ 'sys-at-btn-active': atContextTag }"
                  :disabled="!store.activePersonalityId"
                  :title="'引用楼层内容作为剧情参考'"
                  @click="toggleAtPicker"
                >
                  <i class="fa-solid fa-at" style="font-size: 0.85rem" />
                </button>
                <input
                  v-model="systemChatInput"
                  class="sys-chat-input"
                  placeholder="输入消息…"
                  :disabled="!store.activePersonalityId || systemChatSending"
                  @keydown.enter="sendSystemMessage"
                />
                <button
                  class="sys-send-btn"
                  :disabled="!systemChatInput.trim() || !store.activePersonalityId || systemChatSending"
                  @click="sendSystemMessage"
                >
                  <template v-if="systemChatSending">
                    <i class="fa-solid fa-spinner fa-spin sys-send-icon" />
                  </template>
                  <template v-else>
                    <i class="fa-solid fa-paper-plane sys-send-icon" />
                  </template>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 放弃猜谜二次确认 -->
      <div v-if="showRiddleAbortConfirm" class="sys-riddle-confirm-mask" @click.self="showRiddleAbortConfirm = false">
        <div class="sys-riddle-confirm-panel">
          <div class="sys-riddle-confirm-title">确认放弃当前猜谜？</div>
          <div class="sys-riddle-confirm-sub">将结束本次情报交换并记录当前进度</div>
          <div class="sys-riddle-confirm-actions">
            <button class="sys-riddle-confirm-cancel" @click="showRiddleAbortConfirm = false">取消</button>
            <button class="sys-riddle-confirm-ok" @click="confirmAbortRiddle">确认放弃</button>
          </div>
        </div>
      </div>

      <div :style="decoBottomThin" />
      <div :style="decoBottom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { gsap } from 'gsap';
import ModuleView from './ModuleView.vue';
import { calcCommission, useVNStore } from '../../store';

const store = useVNStore();

const panelStyle = {
  maxHeight: 'min(700px, calc(100vh - 80px))',
  borderColor: 'rgba(90,79,64,0.6)',
  background: 'var(--vn-panel-bg)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  flexDirection: 'column',
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

const puzzleFee = computed(() => calcCommission(store.gold, store.workshopLevel, 0));

const systemChatInput = ref('');
const systemChatSending = ref(false);
const chatMode = ref(false);
const transitioning = ref(false);

// --- @ Floor picker ---
const showAtPicker = ref(false);
const atFloorInput = ref('');
const atContextTag = ref(''); // e.g. "楼层 3" or "楼层 1-5"
const atContextText = ref(''); // actual content to inject

const maxFloorId = computed(() => {
  try {
    return getLastMessageId();
  } catch {
    return 0;
  }
});

function toggleAtPicker() {
  showAtPicker.value = !showAtPicker.value;
  if (showAtPicker.value) atFloorInput.value = '';
}

async function confirmAtFloor() {
  const raw = atFloorInput.value.trim();
  if (!raw) return;
  const rangeMatch = raw.match(/^(\d+)-(\d+)$/);
  const singleMatch = raw.match(/^(\d+)$/);
  let floorRange = '';
  let messages: { role: string; message: string }[] = [];
  try {
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]!);
      const end = parseInt(rangeMatch[2]!);
      floorRange = `${start}-${end}`;
      messages = getChatMessages(`${start}-${end}`);
    } else if (singleMatch) {
      const floor = parseInt(singleMatch[1]!);
      floorRange = `${floor}`;
      messages = getChatMessages(floor);
    } else {
      return;
    }
  } catch {
    return;
  }
  if (!messages.length) {
    atContextTag.value = `楼层 ${floorRange}（无内容）`;
    atContextText.value = '';
    showAtPicker.value = false;
    return;
  }
  // Build context text from message bodies
  const parts = messages
    .map(m => {
      const role = m.role === 'assistant' ? 'AI' : '用户';
      const text = (m.message ?? '').replace(/<[^>]+>/g, '').trim();
      return `[${role}] ${text}`;
    })
    .filter(s => s.replace(/\[.*?\]\s*/, '').length > 0);
  atContextText.value = parts.join('\n\n');
  atContextTag.value = `楼层 ${floorRange}（${parts.length} 条）`;
  showAtPicker.value = false;
}

function clearAtContext() {
  atContextTag.value = '';
  atContextText.value = '';
}

// --- Prompt debug viewer ---
const showRiddleAbortConfirm = ref(false);

function openRiddleAbortConfirm() {
  if (!store.riddleActive || !store.activePersonalityId) return;
  if (store.riddlePersonalityId !== store.activePersonalityId) return;
  showRiddleAbortConfirm.value = true;
}

function confirmAbortRiddle() {
  const pid = store.activePersonalityId;
  if (!pid) return;
  store.abortRiddleByUser(pid);
  showRiddleAbortConfirm.value = false;
  scrollChatToBottom();
}

const moduleGridRef = ref<HTMLElement>();
const systemChatRef = ref<HTMLElement>();
const contactsRef = ref<HTMLElement>();
const chatAreaRef = ref<HTMLElement>();
const inputBarRef = ref<HTMLElement>();
const chatMessagesRef = ref<HTMLElement>();

const displayModules = computed(() =>
  store.gameModules
    .filter(m => m.moduleId !== 'inventory')
    .map(m => ({
      ...m,
      lockReason: store.getModuleLockReason(m.moduleId),
    })),
);

const currentChatHistory = computed(() => {
  if (!store.activePersonalityId) return [];
  return store.systemChatHistories[store.activePersonalityId] ?? [];
});

async function toggleSystemChat() {
  if (transitioning.value) return;
  transitioning.value = true;

  if (!chatMode.value) {
    await openSystemChat();
  } else {
    await closeSystemChat();
  }

  transitioning.value = false;
}

async function openSystemChat() {
  store.systemChatOpen = true;
  if (!store.activePersonalityId && store.SYSTEM_PERSONALITIES.length > 0) {
    store.selectSystemPersonality(store.SYSTEM_PERSONALITIES[0].id);
  }

  // 每次打开时为当前联系人插入分割线（情报交换进行中时不插入普通分割线）
  if (store.activePersonalityId && !(store.riddleActive && store.riddlePersonalityId === store.activePersonalityId)) {
    store.insertChatDivider(store.activePersonalityId);
  }

  const grid = moduleGridRef.value;
  if (!grid) return;

  // Keep grid height fixed during transition to prevent collapse
  const gridHeight = grid.offsetHeight;
  grid.style.height = `${gridHeight}px`;
  grid.style.overflow = 'hidden';

  const cards = grid.querySelectorAll('.module-card-item');
  if (cards.length) {
    await gsap.to(cards, {
      y: -25,
      opacity: 0,
      scale: 0.92,
      stagger: 0.05,
      duration: 0.28,
      ease: 'power2.in',
    });
  }

  const gridNote = grid.querySelector('.module-footer-note');
  if (gridNote) gsap.set(gridNote, { opacity: 0 });

  // Instead of collapsing height to 0, just hide it after cards are gone
  // This keeps the window size stable if we don't animate the container height
  // But we want the chat to appear in its place.
  // If we want window height unchanged, we should ensure chat container has similar height or
  // the parent container has fixed height.
  // The parent has `max-height: 85vh`.
  // Let's just hide the grid display and show chat.

  grid.style.display = 'none';

  chatMode.value = true;
  const chatContainer = systemChatRef.value;
  if (!chatContainer) return;
  chatContainer.style.display = 'flex';
  // Set a min-height to prevent collapse if chat is empty initially
  chatContainer.style.minHeight = `${gridHeight}px`;

  await nextTick();

  const tl = gsap.timeline();

  if (contactsRef.value) {
    tl.from(contactsRef.value, {
      y: -60,
      opacity: 0,
      duration: 0.4,
      ease: 'power3.out',
    });
  }

  if (chatAreaRef.value) {
    tl.from(
      chatAreaRef.value,
      {
        opacity: 0,
        y: 15,
        duration: 0.35,
        ease: 'power2.out',
      },
      '-=0.25',
    );
  }

  if (inputBarRef.value) {
    tl.from(
      inputBarRef.value,
      {
        y: 30,
        opacity: 0,
        duration: 0.35,
        ease: 'back.out(1.5)',
      },
      '-=0.2',
    );
  }

  await tl;
  scrollChatToBottom();
}

async function closeSystemChat() {
  const tl = gsap.timeline();

  if (inputBarRef.value) {
    tl.to(inputBarRef.value, {
      y: 25,
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
    });
  }

  if (chatAreaRef.value) {
    tl.to(
      chatAreaRef.value,
      {
        opacity: 0,
        y: 10,
        duration: 0.2,
      },
      '-=0.12',
    );
  }

  if (contactsRef.value) {
    tl.to(
      contactsRef.value,
      {
        y: -50,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
      },
      '-=0.12',
    );
  }

  await tl;

  const chatContainer = systemChatRef.value;
  if (chatContainer) chatContainer.style.display = 'none';

  chatMode.value = false;
  store.systemChatOpen = false;

  const grid = moduleGridRef.value;
  if (!grid) return;
  grid.style.display = '';
  grid.style.height = ''; // Reset height
  grid.style.overflow = '';

  const gridNote = grid.querySelector('.module-footer-note');
  if (gridNote) gsap.set(gridNote, { opacity: 1 });

  const cards = grid.querySelectorAll('.module-card-item');
  if (cards.length) {
    // Reset state
    gsap.set(cards, { y: 0, opacity: 1, scale: 1 });
    // Animate from top (pull down expand)
    // "Pull down from top" means they start higher (negative y) and move down to 0
    await gsap.from(cards, {
      y: -40,
      opacity: 0,
      scale: 0.95,
      stagger: 0.05,
      duration: 0.4,
      ease: 'back.out(1.2)',
    });
  }

  if (contactsRef.value) gsap.set(contactsRef.value, { clearProps: 'all' });
  if (chatAreaRef.value) gsap.set(chatAreaRef.value, { clearProps: 'all' });
  if (inputBarRef.value) gsap.set(inputBarRef.value, { clearProps: 'all' });
}

function scrollChatToBottom() {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
    }
  });
}

async function sendSystemMessage() {
  const text = systemChatInput.value.trim();
  const pid = store.activePersonalityId;
  if (!text || !pid) return;
  systemChatSending.value = true;
  systemChatInput.value = '';
  const context = atContextText.value || undefined;
  clearAtContext();
  try {
    await store.sendSystemUserMessage(pid, text, context ? { context } : undefined);
    scrollChatToBottom();
  } finally {
    systemChatSending.value = false;
  }
}

function handleModuleClick(moduleId: string) {
  if (moduleId === 'puzzle_2048') {
    if (!store.autoStart2048()) {
      store.showToast('金币不足');
      return;
    }
  }
  store.activeModuleId = moduleId;
}

function handleBackdropClick() {
  if (store.workshopProducing) return;
  store.setOverlay('none');
}

watch(
  () => store.activePersonalityId && currentChatHistory.value.length,
  () => scrollChatToBottom(),
);

// 允许其他模块（情报交换）直接请求打开末世通讯
watch(
  () => store.systemChatOpen,
  async open => {
    if (open && !chatMode.value && !transitioning.value) {
      await openSystemChat();
    }
  },
);
</script>

<style scoped>
/* === System Terminal Entry === */
.sys-terminal-entry {
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: background 0.3s;
}

.sys-terminal-entry:hover {
  background: transparent;
}

.sys-terminal-inner {
  position: relative;
  overflow: hidden;
}

.sys-terminal-scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(139, 69, 19, 0.025) 2px,
    rgba(139, 69, 19, 0.025) 4px
  );
  animation: sys-scanline-drift 6s linear infinite;
  pointer-events: none;
}

@keyframes sys-scanline-drift {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(4px);
  }
}

.sys-terminal-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--theme-text-muted, var(--vn-muted));
  transition: all 0.4s;
  flex-shrink: 0;
}

.sys-terminal-dot-active {
  background: var(--theme-accent, var(--rust));
  box-shadow: 0 0 6px var(--theme-accent-soft, rgba(139, 69, 19, 0.5));
  animation: sys-dot-pulse 2s ease-in-out infinite;
}

@keyframes sys-dot-pulse {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 4px rgba(139, 69, 19, 0.4);
  }
  50% {
    opacity: 0.6;
    box-shadow: 0 0 10px var(--theme-accent-soft, rgba(139, 69, 19, 0.6));
  }
}

.sys-terminal-label {
  font-size: 10px;
  font-family: monospace;
  color: var(--theme-text-muted, var(--vn-muted));
  letter-spacing: 0.12em;
  transition: color 0.3s;
  user-select: none;
}

.sys-terminal-entry:hover .sys-terminal-label {
  color: var(--theme-accent, var(--rust));
}

.sys-terminal-badge {
  font-size: 7px;
  font-family: monospace;
  font-weight: bold;
  letter-spacing: 0.15em;
  color: var(--vn-success);
  border: 1px solid rgba(90, 122, 74, 0.4);
  padding: 1px 5px;
  border-radius: 2px;
  animation: sys-badge-blink 3s ease-in-out infinite;
}

@keyframes sys-badge-blink {
  0%,
  80%,
  100% {
    opacity: 1;
  }
  90% {
    opacity: 0.4;
  }
}

/* === System Chat Wrapper === */
.sys-chat-wrapper {
  display: none;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  max-height: calc(100vh - 350px);
  overflow: hidden;
}

.sys-chat-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* === Contacts Header (Mobile: horizontal, Desktop: vertical) === */
.sys-contacts-header {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid rgba(90, 79, 64, 0.25);
  background: rgba(35, 30, 26, 0.4);
}

/* Desktop: vertical layout (sidebar style) */
@media (min-width: 640px) {
  .sys-chat-container {
    flex-direction: row;
  }

  .sys-contacts-header {
    width: 100px;
    flex-shrink: 0;
    flex-direction: column;
    border-bottom: none;
    border-right: 1px solid rgba(90, 79, 64, 0.25);
  }
}

.sys-contacts-title {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  font-size: 9px;
  font-family: monospace;
  letter-spacing: 0.15em;
  color: var(--theme-accent, var(--rust));
  border-bottom: 1px solid rgba(90, 79, 64, 0.2);
  text-transform: uppercase;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .sys-contacts-title {
    border-bottom: 1px solid rgba(90, 79, 64, 0.2);
  }
}

.sys-contacts-list {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 6px 12px;
  gap: 8px;
  justify-content: space-around;
}

/* Desktop: vertical scroll */
@media (min-width: 640px) {
  .sys-contacts-list {
    flex-wrap: nowrap;
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: auto;
    gap: 0;
    padding: 6px;
    justify-content: flex-start;
  }
}

.sys-contact-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 6px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.25s;
  flex-shrink: 0;
  position: relative;
  min-width: 56px;
}

.sys-contact-card:hover {
  background: rgba(139, 69, 19, 0.08);
}

.sys-contact-active {
  background: rgba(139, 69, 19, 0.12) !important;
}

.sys-contact-active::before {
  content: '';
  position: absolute;
  background: var(--theme-accent, var(--rust));
  border-radius: 2px;
}

/* Mobile: top indicator */
@media (max-width: 639px) {
  .sys-contact-active::before {
    left: 15%;
    right: 15%;
    top: 0;
    height: 2px;
  }
}

/* Desktop: left indicator */
@media (min-width: 640px) {
  .sys-contact-active::before {
    left: 0;
    top: 15%;
    bottom: 15%;
    width: 2px;
  }
}

.sys-contact-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: bold;
  position: relative;
  border: 1.5px solid rgba(90, 79, 64, 0.4);
  background: rgba(58, 51, 44, 0.5);
  color: var(--stain);
  transition: all 0.25s;
}

.sys-contact-active .sys-contact-avatar {
  border-color: var(--theme-accent, var(--rust));
  box-shadow: 0 0 8px rgba(139, 69, 19, 0.25);
  color: var(--theme-accent, var(--rust));
}

.sys-contact-online-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: var(--vn-success);
  border-radius: 50%;
  border: 1.5px solid rgba(51, 44, 38, 0.96);
}

.sys-contact-name {
  font-size: 9px;
  color: var(--theme-text-muted, var(--vn-muted));
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 80px;
  transition: color 0.25s;
}

.sys-contact-active .sys-contact-name {
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
}

/* === Chat Main Area === */
.sys-chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 180px;
}

@media (min-width: 640px) {
  .sys-chat-main {
    min-height: 200px;
  }
}

.sys-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.sys-empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--theme-text-muted, var(--vn-muted));
  font-size: 11px;
  font-family: monospace;
  letter-spacing: 0.05em;
}

.sys-msg {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.sys-msg-left {
  align-self: flex-start;
  align-items: flex-start;
}

.sys-msg-right {
  align-self: flex-end;
  align-items: flex-end;
}

.sys-chat-divider {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px 0;
  cursor: pointer;
  opacity: 0.45;
  transition: opacity 0.2s;
  flex-shrink: 0;
}
.sys-chat-divider:hover {
  opacity: 0.85;
}
.sys-chat-divider-text {
  font-size: 9px;
  letter-spacing: 0.05em;
  color: var(--theme-text-muted, var(--vn-muted));
  font-family: monospace;
  user-select: none;
}

.sys-chat-divider-riddle-start,
.sys-chat-divider-riddle-end,
.sys-chat-divider-riddle-end-finished {
  opacity: 0.8;
}

.sys-chat-divider-riddle-end {
  flex-direction: column;
  gap: 2px;
}

/* 情报交换专用的纯装饰性双线分割 */
.sys-chat-riddle-divider {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4px 0;
  flex-shrink: 0;
  gap: 3px;
}
.sys-chat-riddle-divider-line {
  height: 1px;
  background: rgba(212, 197, 160, 0.4);
}

.sys-riddle-settle {
  font-size: 9px;
  color: var(--theme-text-muted, var(--vn-muted));
  font-family: monospace;
  margin-bottom: 1px;
  text-align: center;
  align-self: center;
}

.sys-riddle-confirm-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sys-riddle-confirm-panel {
  width: min(320px, calc(100% - 32px));
  border: 1px solid rgba(90, 79, 64, 0.45);
  background: rgba(42, 36, 32, 0.95);
  border-radius: 2px;
  padding: 14px;
}

.sys-riddle-confirm-title {
  font-size: 12px;
  color: var(--theme-text-main, var(--vn-fg));
  margin-bottom: 6px;
}

.sys-riddle-confirm-sub {
  font-size: 10px;
  color: var(--theme-text-muted, var(--vn-muted));
  margin-bottom: 12px;
}

.sys-riddle-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.sys-riddle-confirm-cancel,
.sys-riddle-confirm-ok {
  border: 1px solid rgba(90, 79, 64, 0.45);
  border-radius: 2px;
  padding: 3px 10px;
  font-size: 11px;
  cursor: pointer;
  color: var(--theme-text-muted, var(--vn-muted));
}

.sys-riddle-confirm-ok {
  color: var(--theme-text-main, var(--vn-fg));
  border-color: rgba(139, 69, 19, 0.45);
}

.sys-proactive-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 8px;
  color: var(--stain);
  font-family: monospace;
  margin-bottom: 3px;
  padding-left: 2px;
  letter-spacing: 0.05em;
}

.sys-msg-bubble {
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.6;
  word-break: break-all;
  border-radius: 2px;
}

.sys-bubble-system {
  background: rgba(58, 51, 44, 0.55);
  border: 1px solid rgba(90, 79, 64, 0.3);
  color: var(--theme-text-main, var(--vn-fg));
  border-radius: 2px 10px 10px 2px;
}

.sys-bubble-user {
  background: rgba(139, 69, 19, 0.15);
  border: 1px solid rgba(139, 69, 19, 0.25);
  color: var(--theme-text-main, var(--vn-fg));
  border-radius: 10px 2px 2px 10px;
}

/* === Input Bar === */
.sys-input-bar {
  padding: 8px 16px 12px;
  border-top: 1px solid rgba(90, 79, 64, 0.2);
  background: rgba(35, 30, 26, 0.3);
}

.sys-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* @ tag row */
.sys-at-tag-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 5px;
}
.sys-at-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-family: monospace;
  color: var(--stain);
  background: rgba(196, 162, 101, 0.1);
  border: 1px solid rgba(196, 162, 101, 0.3);
  border-radius: 3px;
  padding: 2px 7px;
}
.sys-at-tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: none;
  background: rgba(90, 79, 64, 0.3);
  color: var(--theme-text-muted, var(--vn-muted));
  cursor: pointer;
  transition: background 0.2s;
}
.sys-at-tag-remove:hover {
  background: rgba(139, 69, 19, 0.3);
  color: var(--theme-accent, var(--rust));
}

/* @ picker */
.sys-at-picker {
  background: rgba(42, 36, 32, 0.95);
  border: 1px solid rgba(139, 69, 19, 0.3);
  border-radius: 4px;
  padding: 8px 10px;
  margin-bottom: 6px;
}
.sys-at-picker-title {
  font-size: 9px;
  font-family: monospace;
  color: var(--stain);
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}
.sys-at-picker-row {
  display: flex;
  gap: 5px;
  align-items: center;
}
.sys-at-input {
  flex: 1;
  height: 26px;
  background: rgba(74, 64, 53, 0.4);
  border: 1px solid rgba(90, 79, 64, 0.5);
  color: var(--theme-text-main, var(--vn-fg));
  padding: 0 8px;
  font-size: 11px;
  border-radius: 3px;
  outline: none;
  font-family: monospace;
}
.sys-at-input:focus {
  border-color: var(--theme-accent-soft, rgba(139, 69, 19, 0.6));
}
.sys-at-confirm-btn {
  height: 26px;
  padding: 0 10px;
  font-size: 10px;
  background: rgba(139, 69, 19, 0.2);
  border: 1px solid rgba(139, 69, 19, 0.4);
  color: var(--theme-accent, var(--rust));
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.2s;
}
.sys-at-confirm-btn:hover {
  background: rgba(139, 69, 19, 0.35);
}
.sys-at-cancel-btn {
  height: 26px;
  padding: 0 8px;
  font-size: 10px;
  background: transparent;
  border: 1px solid rgba(90, 79, 64, 0.3);
  color: var(--theme-text-muted, var(--vn-muted));
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.2s;
}
.sys-at-cancel-btn:hover {
  background: rgba(90, 79, 64, 0.15);
}

/* @ button */
.sys-at-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 34px;
  border: 1px solid rgba(90, 79, 64, 0.4);
  background: rgba(74, 64, 53, 0.25);
  color: var(--theme-text-muted, var(--vn-muted));
  border-radius: 17px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.sys-at-btn:hover:not(:disabled) {
  color: var(--stain);
  border-color: rgba(196, 162, 101, 0.5);
  background: rgba(196, 162, 101, 0.08);
}
.sys-at-btn-active {
  color: var(--stain) !important;
  border-color: rgba(196, 162, 101, 0.5) !important;
  background: rgba(196, 162, 101, 0.1) !important;
}
.sys-at-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.sys-chat-input {
  flex: 1;
  height: 34px;
  background: rgba(74, 64, 53, 0.35);
  border: 1px solid rgba(90, 79, 64, 0.4);
  color: var(--theme-text-main, var(--vn-fg));
  padding: 0 12px;
  font-size: 12px;
  border-radius: 17px;
  outline: none;
  font-family: 'Noto Serif SC', serif;
  transition: all 0.25s;
}

.sys-chat-input:focus {
  border-color: var(--theme-accent-soft, rgba(139, 69, 19, 0.5));
  background: rgba(74, 64, 53, 0.5);
}

.sys-chat-input::placeholder {
  color: rgba(139, 125, 107, 0.45);
}

.sys-chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sys-send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  min-width: 44px;
  padding: 0 14px;
  border: 1px solid rgba(139, 69, 19, 0.4);
  background: rgba(139, 69, 19, 0.12);
  color: var(--theme-accent, var(--rust));
  border-radius: 17px;
  cursor: pointer;
  transition: all 0.25s;
  flex-shrink: 0;
}

.sys-send-icon {
  font-size: 1.05rem;
}

.sys-send-btn:hover:not(:disabled) {
  background: rgba(139, 69, 19, 0.22);
  border-color: var(--theme-accent, var(--rust));
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.2);
}

.sys-send-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
