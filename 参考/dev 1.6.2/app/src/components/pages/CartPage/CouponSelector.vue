<!--
  CouponSelector 组件

  优惠券选择器组件，用于选择和应用优惠券。

  功能：
  - 显示可用优惠券列表
  - 选择优惠券
  - 取消选择
  - 显示优惠券详情
  - 可折叠/展开
  - 无障碍支持

  Props:
  - coupons (Coupon[]): 可用优惠券列表
  - selectedCouponId (string | null): 已选优惠券 ID

  Emits:
  - selectCoupon(couponId: string | null): 选择优惠券时触发
-->
<template>
  <div v-if="coupons.length > 0" class="coupons-section">
    <CouponSelectorHeader
      :coupon-count="coupons.length"
      :has-selected-coupon="!!selectedCouponId"
      :is-expanded="isExpanded"
      @toggle="toggleExpanded"
      @cancel="$emit('selectCoupon', null)"
    />
    <transition name="expand">
      <div v-show="isExpanded" class="coupons-list">
        <CouponCard
          v-for="coupon in coupons"
          :key="coupon.id"
          :coupon="coupon"
          :is-selected="selectedCouponId === coupon.id"
          @select="$emit('selectCoupon', $event)"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Item } from '../../../types'
import CouponSelectorHeader from './CouponSelectorHeader.vue'
import CouponCard from './CouponCard.vue'

defineProps<{
  coupons: Item[]
  selectedCouponId: string | null
}>()

defineEmits<{
  selectCoupon: [couponId: string | null]
}>()

// 移动端默认折叠，桌面端默认展开
const isMobile = ref(window.innerWidth <= 768)
const isExpanded = ref(!isMobile.value)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

// 监听窗口大小变化
const handleResize = () => {
  const wasMobile = isMobile.value
  isMobile.value = window.innerWidth <= 768

  // 如果从桌面切换到移动端，折叠优惠券
  if (!wasMobile && isMobile.value) {
    isExpanded.value = false
  }
  // 如果从移动端切换到桌面端，展开优惠券
  else if (wasMobile && !isMobile.value) {
    isExpanded.value = true
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.coupons-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.coupons-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: 300px;
  overflow-y: auto;
  padding: var(--spacing-xs);
}

/* 滚动条样式 */
.coupons-list::-webkit-scrollbar {
  width: 6px;
}

.coupons-list::-webkit-scrollbar-track {
  background: var(--gray-100);
  border-radius: var(--radius-full);
}

.coupons-list::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: var(--radius-full);
}

.coupons-list::-webkit-scrollbar-thumb:hover {
  background: var(--gray-400);
}

/* 展开/折叠动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all var(--transition-base) ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 300px;
  opacity: 1;
}

/* 响应式设计 - 移动端 (<768px) */
@media (max-width: 768px) {
  .coupons-section {
    gap: var(--spacing-sm);
    margin-bottom: 0;
  }

  .coupons-list {
    max-height: 200px;
    gap: 6px;
    padding: 4px;
  }
}

/* 小屏模式优化 (<480px) */
@media (max-width: 480px) {
  .coupons-list {
    max-height: 180px;
    gap: 4px;
    padding: 2px;
  }
}
</style>
