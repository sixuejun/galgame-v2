<template>
  <div class="flex items-center gap-2 mb-4">
    <span style="color: var(--theme-accent, var(--rust))"><i :class="'fa-solid ' + icon" style="font-size: 0.875rem" /></span>
    <h3 class="text-sm font-bold tracking-widest" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">{{ title }}</h3>
    <div
      class="flex-1"
      :style="{ height: '1px', background: 'linear-gradient(to right, rgba(90,79,64,0.6), transparent)' }"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{ icon: string; title: string }>();
</script>
