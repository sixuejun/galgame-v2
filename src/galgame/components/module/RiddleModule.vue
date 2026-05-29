<template>
  <div class="riddle-launch px-4 py-3">
    <section class="riddle-stage">
      <div class="riddle-contact-head">
        <div class="riddle-line-double" />
        <div class="riddle-contact-title">选择联系人</div>
        <div class="riddle-line-single" />
      </div>

      <div class="riddle-contact-grid">
        <button
          v-for="p in store.SYSTEM_PERSONALITIES"
          :key="p.id"
          class="riddle-contact-card"
          :class="{ 'riddle-contact-card-active': selectedPersonalityId === p.id }"
          @click="selectedPersonalityId = p.id"
        >
          <div class="riddle-contact-avatar">{{ p.avatarChar || p.name.charAt(0) }}</div>
          <div class="riddle-contact-name">{{ p.name }}</div>
        </button>
      </div>

      <div class="riddle-wrap-line" />
    </section>

    <section class="riddle-action">
      <input id="riddle-answer" v-model="answerInput" class="riddle-input" placeholder="谜底…" />
      <input id="riddle-hint" v-model="firstHint" class="riddle-input" placeholder="第一句提示…" />

      <button
        class="riddle-start-btn"
        :style="{
          borderColor: canStart ? 'var(--theme-accent, var(--rust))' : 'rgba(90,79,64,0.2)',
          color: canStart ? 'var(--theme-text-main, var(--vn-fg))' : 'var(--theme-text-muted, var(--vn-muted))',
          background: canStart ? 'rgba(139,69,19,0.1)' : 'transparent',
          opacity: canStart ? 1 : 0.52,
        }"
        @click="handleStart"
      >
        开始情报交换
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useVNStore } from '../../store';

const store = useVNStore();

const selectedPersonalityId = ref('');
const answerInput = ref('');
const firstHint = ref('');

// 记录上一个联系人 ID，切换时插入分割线
let prevPersonalityId = '';

watch(selectedPersonalityId, (newId, oldId) => {
  if (oldId && newId !== oldId) {
    store.insertChatDivider(oldId);
  }
  prevPersonalityId = oldId;
});

const canStart = computed(
  () =>
    !!selectedPersonalityId.value.trim() &&
    answerInput.value.trim().length > 0 &&
    firstHint.value.trim().length > 0 &&
    !store.riddleActive,
);

async function handleStart() {
  if (!canStart.value) return;

  const pid = selectedPersonalityId.value.trim();

  // 删除该联系人之前的猜谜聊天记录
  store.clearHistoryBeforeDivider(pid);

  store.selectSystemPersonality(pid);
  store.startRiddle(pid, answerInput.value.trim(), firstHint.value.trim());

  // 先打开末世通讯，避免等待首条回复时卡住界面
  store.activeModuleId = null;
  store.systemChatOpen = true;
  store.showToast('已进入末世通讯，正在等待回复…');

  try {
    await store.bootstrapRiddleFirstReply(pid);
  } catch {
    store.showToast('第一句回复请求失败');
  }
}
</script>

<style scoped>
.riddle-launch {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.riddle-stage,
.riddle-action {
  padding: 0;
  background: transparent;
}

.riddle-contact-head {
  margin-bottom: 8px;
}

.riddle-line-double {
  position: relative;
  height: 4px;
  margin-bottom: 4px;
}

.riddle-line-double::before,
.riddle-line-double::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(212, 197, 160, 0.48);
}

.riddle-line-double::before {
  top: 0;
}

.riddle-line-double::after {
  bottom: 0;
}

.riddle-contact-title {
  text-align: center;
  font-size: 11px;
  letter-spacing: 0.09em;
  color: var(--theme-text-soft, rgba(212, 197, 160, 0.8));
  line-height: 1.3;
}

.riddle-line-single {
  height: 1.5px;
  background: rgba(212, 197, 160, 0.54);
  margin-top: 4px;
}

.riddle-wrap-line {
  height: 0;
  background: transparent;
  margin-top: 8px;
}

.riddle-contact-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.riddle-contact-card {
  border: 1px solid rgba(90, 79, 64, 0.2);
  border-radius: 8px;
  min-height: 70px;
  padding: 12px 8px;
  background: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.riddle-contact-card:hover {
  transform: translateY(-1px);
  border-color: rgba(139, 69, 19, 0.4);
  background: rgba(139, 69, 19, 0.05);
}

.riddle-contact-card-active {
  border-color: rgba(139, 69, 19, 0.62);
  background: rgba(139, 69, 19, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.riddle-contact-avatar {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(90, 79, 64, 0.32);
  color: var(--theme-text-main, var(--vn-fg));
  font-size: 14px;
}

.riddle-contact-name {
  font-size: 10px;
  color: var(--theme-text-muted, var(--vn-muted));
  text-align: center;
}

.riddle-action {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.riddle-input {
  height: 30px;
  border: 1px solid rgba(90, 79, 64, 0.24);
  border-radius: 0;
  background: transparent;
  color: var(--theme-text-main, var(--vn-fg));
  padding: 0 10px;
  font-size: 12px;
  outline: none;
  transition:
    border-color 0.16s ease,
    background 0.16s ease;
}

.riddle-input:focus {
  border-color: var(--theme-accent-soft, rgba(139, 69, 19, 0.5));
  background: rgba(139, 69, 19, 0.04);
}

.riddle-start-btn {
  width: 100%;
  cursor: pointer;
  border: 1px solid;
  border-radius: 0;
  padding: 7px 10px;
  font-size: 12px;
  text-align: center;
}

@media (max-width: 820px) {
  .riddle-contact-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .riddle-contact-card {
    min-height: 65px;
  }
}

/* 竖屏模式适配 */
@media (max-height: 600px) {
  .riddle-launch {
    gap: 6px;
  }

  .riddle-contact-head {
    margin-bottom: 4px;
  }

  .riddle-contact-card {
    min-height: 55px;
    padding: 8px 6px;
  }

  .riddle-contact-avatar {
    width: 36px;
    height: 36px;
    font-size: 12px;
  }

  .riddle-wrap-line {
    margin-top: 4px;
  }

  .riddle-action {
    gap: 6px;
  }

  .riddle-input {
    height: 28px;
  }

  .riddle-start-btn {
    padding: 6px 10px;
  }
}
</style>
