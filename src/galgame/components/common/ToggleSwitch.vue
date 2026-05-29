<template>
  <button
    class="relative w-10 h-5 rounded-sm transition-colors duration-200 cursor-pointer"
    :style="{ background: checked ? 'var(--theme-accent, var(--rust))' : 'rgba(90,79,64,0.4)' }"
    @click="$emit('update', !checked)"
  >
    <div
      class="absolute top-0.5 w-4 h-4 rounded-sm transition-transform duration-200"
      :style="{
        background: checked ? 'var(--theme-text-main, var(--vn-fg))' : 'var(--theme-text-muted, var(--vn-muted))',
        transform: checked ? 'translateX(20px)' : 'translateX(2px)',
      }"
    />
  </button>
</template>

<script setup lang="ts">
defineProps<{ checked: boolean }>();
defineEmits<{ update: [value: boolean] }>();
</script>
