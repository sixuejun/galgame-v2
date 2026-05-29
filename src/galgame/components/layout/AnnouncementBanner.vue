<template>
  <Transition name="announcement-slide">
    <div v-if="store.announcementVisible && store.announcementData" class="announcement-banner" :style="bannerStyle">
      <div class="announcement-content">
        <span v-if="store.announcementData.title" class="announcement-title">{{ store.announcementData.title }}</span>
        <span class="announcement-message">{{ store.announcementData.message }}</span>
      </div>
      <button class="announcement-close" @click="store.hideAnnouncement()" aria-label="关闭">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useVNStore } from '../../store';

const store = useVNStore();

const bannerStyle = computed(() => ({
  background: 'var(--theme-announcement-bg, rgba(42,36,32,0.95))',
  color: 'var(--theme-announcement-color, var(--theme-text-main, var(--vn-fg)))',
  borderBottom: '1px solid var(--theme-announcement-border, rgba(90,79,64,0.55))',
}));
</script>

<style scoped>
.announcement-banner {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  z-index: 10000;
  box-sizing: border-box;
  box-shadow: var(--theme-announcement-shadow, 0 4px 12px rgba(0, 0, 0, 0.3));
  font-size: 0.875rem;
}

.announcement-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
  text-align: center;
}

.announcement-title {
  font-weight: bold;
  color: var(--theme-accent, var(--rust));
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: var(--theme-accent-bg, rgba(90, 79, 64, 0.2));
  border-radius: 4px;
}

.announcement-message {
  flex: 1;
}

.announcement-close {
  background: transparent;
  border: none;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition:
    opacity 0.2s,
    background 0.2s;
}

.announcement-close:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

/* 滑入/滑出动画 */
.announcement-slide-enter-active {
  animation: slide-down 0.3s ease-out;
}

.announcement-slide-leave-active {
  animation: slide-up 0.3s ease-in;
}

@keyframes slide-down {
  from {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@keyframes slide-up {
  from {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  to {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
}
</style>
