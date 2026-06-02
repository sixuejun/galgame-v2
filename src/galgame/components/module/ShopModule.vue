<template>
  <div class="sm-module">
    <!-- Loading overlay -->
    <div v-if="isLoading" class="sm-loading-overlay">
      <div class="sm-spinner" />
      <span class="sm-loading-text">{{ loadingMessage }}</span>
    </div>

    <!-- Search header -->
    <div class="sm-search-bar">
      <div class="sm-search-input-wrap">
        <i class="fa-solid fa-search sm-search-icon" />
        <input
          v-model="searchKeyword"
          class="sm-search-input"
          placeholder="搜索商品或技能…"
          @keydown.enter="handleSearch"
        />
      </div>
      <button
        class="sm-search-btn"
        :disabled="isLoading || !searchKeyword.trim()"
        @click="handleSearch"
      >
        搜索
      </button>
    </div>

    <!-- Balance bar -->
    <div class="sm-balance-bar">
      <div class="sm-balance-pill">
        <i class="fa-solid fa-coins" />
        <span class="sm-balance-num">{{ store.gold }}</span>
        <span class="sm-balance-unit">G</span>
      </div>
    </div>

    <!-- Tab navigation -->
    <div class="sm-tabs">
      <button
        class="sm-tab"
        :class="{ 'sm-tab-active': activeTab === 'items' }"
        @click="switchTab('items')"
      >
        <i class="fa-solid fa-box" />
        道具
        <span v-if="itemCount > 0" class="sm-tab-count">{{ itemCount }}</span>
      </button>
      <button
        class="sm-tab"
        :class="{ 'sm-tab-active': activeTab === 'skills' }"
        @click="switchTab('skills')"
      >
        <i class="fa-solid fa-wand-magic-sparkles" />
        技能
        <span v-if="skillCount > 0" class="sm-tab-count">{{ skillCount }}</span>
      </button>
    </div>

    <!-- Content area -->
    <div class="sm-content">

      <!-- ====== Items Tab ====== -->
      <div v-show="activeTab === 'items'">
        <div v-if="shopItems.length === 0 && !isLoading" class="sm-empty">
          <i class="fa-solid fa-store" />
          <p>{{ searchKeyword ? '没有找到相关商品' : '点击搜索按钮获取商品' }}</p>
        </div>
        <div v-else class="sm-item-grid">
          <div
            v-for="item in shopItems"
            :key="item.id"
            class="sm-item-card"
            :class="{ 'sm-item-sold-out': isSoldOut(item) }"
          >
            <div class="sm-item-img">
              <span v-if="item.icon" class="sm-item-emoji">{{ item.icon }}</span>
              <i v-else class="fa-solid fa-box" style="color: rgba(139,69,19,0.3); font-size: 1.5rem" />
            </div>
            <div class="sm-item-info">
              <div class="sm-item-name">{{ item.name }}</div>
              <div class="sm-item-effect">{{ item.effect }}</div>
              <div class="sm-item-footer">
                <div class="sm-item-price">
                  <i class="fa-solid fa-coins" />
                  {{ item.price }}G
                </div>
                <button
                  v-if="!isSoldOut(item)"
                  class="sm-btn-add-cart"
                  :disabled="store.gold < item.price"
                  @click="addItemToCart(item)"
                >
                  <i class="fa-solid fa-cart-plus" />
                </button>
                <span v-else class="sm-sold-out-tag">已售</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ====== Skills Tab ====== -->
      <div v-show="activeTab === 'skills'">
        <div class="sm-skills-hint">
          <i class="fa-solid fa-circle-info" />
          已购技能可装备给角色
        </div>
        <div v-if="store.skillsInventory.length === 0" class="sm-empty">
          <i class="fa-solid fa-wand-magic-sparkles" />
          <p>暂无可用技能</p>
          <span>在道具商城购买后会出现于此</span>
        </div>
        <div v-else class="sm-item-grid">
          <div
            v-for="skill in store.skillsInventory"
            :key="skill.id"
            class="sm-item-card sm-skill-card"
          >
            <div class="sm-item-img">
              <span v-if="skill.emoji" class="sm-item-emoji">{{ skill.emoji }}</span>
              <i v-else class="fa-solid fa-wand-magic-sparkles" style="color: rgba(139,69,19,0.3); font-size: 1.5rem" />
            </div>
            <div class="sm-item-info">
              <div class="sm-item-name">{{ skill.名称 }}</div>
              <div class="sm-item-effect">{{ skill.描述 }}</div>
              <div v-if="skill.效果?.length" class="sm-item-mods">
                <span
                  v-for="eff in skill.效果"
                  :key="`${eff.域}.${eff.键}`"
                  class="sm-mod-tag"
                >
                  {{ eff.域 }}.{{ eff.键 }}+{{ eff.值 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart bar -->
    <div
      class="sm-cart-bar"
      :class="{ 'sm-cart-bar-visible': cartTotalCount > 0 }"
    >
      <div class="sm-cart-info" @click="toggleCartDrawer">
        <span class="sm-cart-count-label">已选</span>
        <span class="sm-cart-count">{{ cartTotalCount }}</span>
        <span class="sm-cart-count-unit">件</span>
        <span class="sm-cart-divider">|</span>
        <i class="fa-solid fa-coins" style="color: #C73E3A; font-size: 10px" />
        <span class="sm-cart-price">{{ cartTotalPrice }}</span>
        <i class="fa-solid fa-chevron-up sm-cart-toggle" :class="{ 'sm-cart-toggle-down': cartDrawerOpen }" />
      </div>
      <button
        class="sm-checkout-btn"
        :disabled="cartTotalCount === 0 || store.gold < cartTotalPrice"
        @click="handleCheckout"
      >
        一键结算
      </button>
    </div>

    <!-- Cart drawer -->
    <div
      v-if="cartDrawerOpen"
      class="sm-cart-drawer"
    >
      <div class="sm-cart-drawer-head">
        <span class="sm-cart-drawer-title">已选商品</span>
        <button class="sm-cart-clear-btn" @click="clearCart">清空</button>
      </div>
      <div class="sm-cart-drawer-list">
        <div
          v-for="(entry, name) in cartItems"
          :key="name"
          class="sm-cart-drawer-item"
        >
          <div class="sm-cart-drawer-item-info">
            <div class="sm-cart-drawer-item-name">{{ name }}</div>
            <div class="sm-cart-drawer-item-price">
              <i class="fa-solid fa-coins" />
              {{ entry.price }}G
            </div>
          </div>
          <div class="sm-cart-drawer-qty">
            <button class="sm-qty-btn" @click="removeFromCart(String(name))">
              <i class="fa-solid fa-minus" />
            </button>
            <span class="sm-qty-num">{{ entry.count }}</span>
            <button class="sm-qty-btn" @click="addItemToCart(entry.originalItem)">
              <i class="fa-solid fa-plus" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart drawer overlay -->
    <div
      v-if="cartDrawerOpen"
      class="sm-cart-overlay"
      @click="toggleCartDrawer"
    />
  </div>
</template>

<script setup lang="ts">
import { calcCommission, useVNStore } from '../../store';

const store = useVNStore();

const activeTab = ref<'items' | 'skills'>('items');
const searchKeyword = ref('');
const isLoading = ref(false);
const loadingMessage = ref('加载中…');
const cartDrawerOpen = ref(false);

interface CartEntry {
  item: ShopItem | { id: string; name: string; effect: string; price: number; icon?: string };
  price: number;
  count: number;
}

const cartItems = ref<Record<string, CartEntry>>({});

const shopItems = computed(() => store.shopItems);
const itemCount = computed(() => store.shopItems.length);
const skillCount = computed(() => store.skillsInventory.length);

const cartTotalCount = computed(() =>
  Object.values(cartItems.value).reduce((sum, e) => sum + e.count, 0),
);

const cartTotalPrice = computed(() =>
  Object.values(cartItems.value).reduce((sum, e) => sum + e.price * e.count, 0),
);

function isSoldOut(item: ShopItem): boolean {
  return !store.shopItems.some(i => i.id === item.id);
}

function switchTab(tab: 'items' | 'skills') {
  activeTab.value = tab;
  cartDrawerOpen.value = false;
}

async function handleSearch() {
  const kw = searchKeyword.value.trim();
  if (!kw || isLoading.value) return;

  if (store.secondApiStatus === 'disabled') {
    toastr.warning('第二 API 未配置');
    return;
  }

  isLoading.value = true;
  loadingMessage.value = '正在生成商品列表…';

  try {
    const result = await store.callSecondApi({ task: 'shop' });
    const items = result as ShopItem[];
    if (items.length > 0) {
      store.shopItems.splice(0, store.shopItems.length, ...items);
    } else {
      toastr.info('未生成商品，请重试');
    }
  } catch (e) {
    console.error('[Shop] 搜索失败:', e);
    toastr.error('商品生成失败');
  } finally {
    isLoading.value = false;
  }
}

function addItemToCart(item: ShopItem) {
  const key = item.name;
  if (cartItems.value[key]) {
    cartItems.value[key] = { ...cartItems.value[key], count: cartItems.value[key].count + 1 };
  } else {
    cartItems.value[key] = { item, price: item.price, count: 1 };
  }
  cartItems.value = { ...cartItems.value };
}

function removeFromCart(name: string) {
  if (!cartItems.value[name]) return;
  if (cartItems.value[name].count <= 1) {
    const copy = { ...cartItems.value };
    delete copy[name];
    cartItems.value = copy;
  } else {
    cartItems.value[name] = { ...cartItems.value[name], count: cartItems.value[name].count - 1 };
  }
}

function clearCart() {
  cartItems.value = {};
  cartDrawerOpen.value = false;
}

function toggleCartDrawer() {
  cartDrawerOpen.value = !cartDrawerOpen.value;
}

async function handleCheckout() {
  const total = cartTotalPrice.value;
  if (total > store.gold) {
    toastr.warning(`余额不足！需要 ${total}G，当前 ${store.gold}G`);
    return;
  }

  const entries = Object.values(cartItems.value);
  if (entries.length === 0) return;

  // Deduct gold
  store.changeGold(-total, 'shop', '商店购物');

  // Add items to inventory
  for (const entry of entries) {
    const item = entry.item as ShopItem;
    store.addInventoryItem({ id: item.id, name: item.name, effect: item.effect, icon: item.icon });
  }

  // Generate checkout text
  const itemList = entries
    .map(e => `${e.count}个「${e.item.name}」`)
    .join('、');
  const totalStr = total.toString();
  const checkoutText = `{{user}}在商店购买了${itemList}，总共消费了${totalStr}金币。`;

  // Inject into chat input
  try {
    const textarea = window.parent.document.getElementById('send_textarea') as HTMLTextAreaElement | null;
    if (textarea) {
      const prev = textarea.value;
      textarea.value = prev ? prev + '\n' + checkoutText : checkoutText;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.focus();
    }
  } catch (e) {
    console.warn('[Shop] 无法注入文本到聊天框:', e);
  }

  clearCart();
  toastr.success('购买成功！');
}
</script>

<style scoped>
.sm-module {
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: calc(100vh - 180px);
  overflow: hidden;
  position: relative;
}

/* Loading */
.sm-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(42, 36, 32, 0.85);
  backdrop-filter: blur(4px);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.sm-spinner {
  width: 28px;
  height: 28px;
  border: 2px solid rgba(139, 69, 19, 0.2);
  border-top-color: var(--theme-accent, var(--rust));
  border-radius: 50%;
  animation: sm-spin 0.8s linear infinite;
}
@keyframes sm-spin { to { transform: rotate(360deg); } }
.sm-loading-text { font-size: 12px; color: var(--theme-text-main, rgba(212, 197, 160, 0.9)); }

/* Search bar */
.sm-search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(90, 79, 64, 0.2);
  flex-shrink: 0;
}
.sm-search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(74, 64, 53, 0.2);
  border: 1px solid rgba(90, 79, 64, 0.3);
  border-radius: 20px;
  padding: 0 12px;
  height: 32px;
}
.sm-search-icon { color: rgba(139, 125, 107, 0.6); font-size: 11px; flex-shrink: 0; }
.sm-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 12px;
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
}
.sm-search-input::placeholder { color: rgba(139, 125, 107, 0.5); }
.sm-search-btn {
  padding: 0 14px;
  height: 32px;
  border: 1px solid var(--theme-accent, var(--rust));
  background: rgba(139, 69, 19, 0.15);
  color: var(--theme-text-main, var(--vn-fg));
  border-radius: 16px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.sm-search-btn:hover:not(:disabled) { background: rgba(139, 69, 19, 0.28); }
.sm-search-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Balance bar */
.sm-balance-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 6px 12px;
  background: rgba(139, 69, 19, 0.05);
  border-bottom: 1px solid rgba(90, 79, 64, 0.12);
  flex-shrink: 0;
}
.sm-balance-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  background: rgba(42, 36, 32, 0.6);
  border: 1px solid rgba(196, 162, 101, 0.3);
  border-radius: 12px;
  font-size: 11px;
  color: var(--stain);
}
.sm-balance-pill i { color: var(--stain); font-size: 10px; }
.sm-balance-num { font-weight: 900; font-size: 14px; }
.sm-balance-unit { font-size: 10px; opacity: 0.7; }

/* Tabs */
.sm-tabs {
  display: flex;
  border-bottom: 1px solid rgba(90, 79, 64, 0.3);
  flex-shrink: 0;
}
.sm-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 9px 8px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--theme-text-muted, var(--vn-muted));
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.sm-tab:hover { color: var(--theme-text-main, rgba(212, 197, 160, 0.8)); }
.sm-tab-active {
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9)) !important;
  border-bottom-color: var(--theme-accent, var(--rust)) !important;
  font-weight: bold;
}
.sm-tab-count {
  background: var(--theme-accent, var(--rust));
  color: var(--theme-fg, #fff);
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 8px;
  font-family: monospace;
}

/* Content */
.sm-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px;
  padding-bottom: 70px;
}

/* Empty */
.sm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 0;
  color: var(--theme-text-muted, var(--vn-muted));
}
.sm-empty i { font-size: 2rem; opacity: 0.2; }
.sm-empty p { font-size: 13px; font-weight: bold; margin: 0; }
.sm-empty span { font-size: 11px; opacity: 0.6; }

/* Item grid */
.sm-item-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.sm-item-card {
  border: 1px solid rgba(90, 79, 64, 0.3);
  background: rgba(74, 64, 53, 0.08);
  border-radius: 4px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.2s;
}
.sm-item-sold-out { opacity: 0.45; }
.sm-item-img {
  width: 100%;
  height: 48px;
  background: rgba(74, 64, 53, 0.15);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sm-item-emoji { font-size: 1.8rem; }
.sm-item-name {
  font-size: 12px;
  font-weight: bold;
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
  line-height: 1.3;
}
.sm-item-effect {
  font-size: 10px;
  color: var(--theme-text-muted, var(--vn-muted));
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.sm-item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}
.sm-item-price {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  font-weight: 900;
  color: var(--theme-accent, var(--rust));
}
.sm-item-price i { font-size: 10px; }
.sm-btn-add-cart {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--theme-accent, var(--rust));
  background: rgba(139, 69, 19, 0.12);
  color: var(--theme-accent, var(--rust));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  transition: all 0.2s;
}
.sm-btn-add-cart:hover:not(:disabled) { background: rgba(139, 69, 19, 0.25); }
.sm-btn-add-cart:disabled { opacity: 0.35; cursor: not-allowed; }
.sm-sold-out-tag { font-size: 9px; color: var(--theme-text-muted, var(--vn-muted)); }

/* Skill mod tags */
.sm-item-mods { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 4px; }
.sm-mod-tag {
  font-size: 8px;
  padding: 1px 4px;
  background: rgba(139, 69, 19, 0.15);
  border: 1px solid rgba(139, 69, 19, 0.3);
  color: var(--theme-accent, var(--rust));
  border-radius: 2px;
  font-family: monospace;
}

/* Skills hint */
.sm-skills-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--theme-text-muted, var(--vn-muted));
  padding: 4px 0 8px;
  border-bottom: 1px solid rgba(90, 79, 64, 0.1);
  margin-bottom: 8px;
}
.sm-skills-hint i { color: var(--theme-accent, var(--rust)); font-size: 10px; }

/* Cart bar */
.sm-cart-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 52px;
  background: rgba(42, 36, 32, 0.95);
  border-top: 1px solid rgba(90, 79, 64, 0.4);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 10px;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  backdrop-filter: blur(8px);
  z-index: 10;
}
.sm-cart-bar-visible { transform: translateY(0); }
.sm-cart-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 12px;
  color: rgba(212, 197, 160, 0.8);
}
.sm-cart-count { font-weight: 900; font-size: 16px; color: var(--theme-accent, var(--rust)); }
.sm-cart-count-unit { font-size: 10px; }
.sm-cart-divider { color: rgba(139, 125, 107, 0.3); margin: 0 2px; }
.sm-cart-price { font-weight: 900; font-size: 16px; color: var(--theme-accent, var(--rust)); }
.sm-cart-toggle { font-size: 9px; color: rgba(139, 125, 107, 0.6); transition: transform 0.3s; margin-left: 4px; }
.sm-cart-toggle-down { transform: rotate(180deg); }
.sm-checkout-btn {
  padding: 0 20px;
  height: 38px;
  background: linear-gradient(135deg, var(--theme-accent, #a52a2a));
  border: none;
  color: #fff;
  border-radius: 19px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(199, 62, 58, 0.3);
  transition: all 0.2s;
}
.sm-checkout-btn:hover:not(:disabled) { opacity: 0.9; transform: scale(1.02); }
.sm-checkout-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Cart drawer */
.sm-cart-overlay {
  position: absolute;
  inset: 0;
  top: auto;
  height: calc(100% - 52px);
  background: rgba(0, 0, 0, 0.4);
  z-index: 9;
}
.sm-cart-drawer {
  position: absolute;
  bottom: 52px;
  left: 0;
  right: 0;
  background: rgba(50, 44, 40, 0.98);
  border-top: 1px solid rgba(90, 79, 64, 0.4);
  max-height: 55%;
  display: flex;
  flex-direction: column;
  z-index: 11;
}
.sm-cart-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 8px;
  border-bottom: 1px solid rgba(90, 79, 64, 0.2);
}
.sm-cart-drawer-title { font-size: 13px; font-weight: bold; color: var(--theme-text-main, rgba(212, 197, 160, 0.9)); }
.sm-cart-clear-btn { font-size: 11px; color: #C73E3A; background: transparent; border: none; cursor: pointer; }
.sm-cart-drawer-list { overflow-y: auto; flex: 1; padding: 4px 12px 8px; }
.sm-cart-drawer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(90, 79, 64, 0.1);
}
.sm-cart-drawer-item-info { flex: 1; }
.sm-cart-drawer-item-name { font-size: 12px; font-weight: bold; color: var(--theme-text-main, rgba(212, 197, 160, 0.9)); }
.sm-cart-drawer-item-price { display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--theme-accent, var(--rust)); margin-top: 2px; }
.sm-cart-drawer-qty { display: flex; align-items: center; gap: 8px; }
.sm-qty-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(90, 79, 64, 0.4);
  background: rgba(74, 64, 53, 0.2);
  color: var(--theme-text-main, rgba(212, 197, 160, 0.8));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  transition: all 0.2s;
}
.sm-qty-btn:hover { background: rgba(139, 69, 19, 0.2); }
.sm-qty-num { font-size: 14px; font-weight: 900; color: var(--theme-accent, var(--rust)); min-width: 20px; text-align: center; }
</style>
