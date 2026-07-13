<template>
  <!-- 黑屏文字：使用 BlacktextOverlay 子组件 -->
  <BlacktextOverlay
    :is-visible="currentBlock?.type === 'blacktext'"
    :displayed-text="displayedText"
    :is-typing="isTyping"
    :is-first-block="isFirstBlock"
    :is-last-block="isLastBlock"
    :text-visible="isBlacktextVisible"
    @click="handleBlacktextClick"
    @prev="prevBlock"
    @next="nextBlock"
  />

  <!-- 对话框主体（仅非黑屏时显示） -->
  <div
    v-if="currentBlock && currentBlock.type !== 'blacktext'"
    data-ui="dialogue-box"
    class="relative w-full"
    @click="handleClickText"
  >
    <!-- 外层：对话框背景 PNG 壳（仅作背景，不遮挡子组件） -->
    <div class="dialogue-shell-wrap relative" :style="dialogueOuterStyle">
      <!-- 背景 PNG 壳 -->
      <SkinShell :skin="dialogueSkin">
        <!-- 占位，保持壳的尺寸占满 -->
        <div class="h-full w-full" />
      </SkinShell>
    </div>

    <!-- ========== 对话框内部浮动组件层 ========== -->
    <!-- 所有子组件使用 absolute 定位，浮在对话框背景之上 -->

    <!-- 头像壳：使用 DialoguePortrait 子组件 -->
    <DialoguePortrait
      :avatar-url="store.userCharacter.avatarUrl"
      :avatar-name="store.userCharacter.name"
      :portrait-skin="portraitSkin"
      :show="showUserAvatarForCurrentBlock"
      :is-portrait-mode="isPortraitMode"
    />

    <!-- 名字框：使用 DialogueNameTag 子组件 -->
    <DialogueNameTag
      :character-name="currentBlock.type === 'character' ? currentBlock.character : undefined"
      :name-skin="nameSkin"
    />

    <!-- 主文本框：使用 TypewriterText 子组件 -->
    <TypewriterText
      :displayed-text="displayedText"
      :is-typing="isTyping"
      :text-type="textTypeForTypewriter"
      :disable-thought-parsing="currentBlock?.type !== 'character'"
      @scroll="handleTextScroll"
    />

    <!-- 左侧翻页按钮（浮动在对话框左侧） -->
    <div
      class="dialogue-nav-prev absolute flex items-center"
      :style="{
        top: 'var(--theme-dialogue-nav-prev-top, 50%)',
        left: 'var(--theme-dialogue-nav-prev-left, 0.5em)',
        transform: 'translateY(-50%)',
        zIndex: 15,
      }"
    >
      <DialogueNavButton
        :svg-content="DIALOGUE_NAV_SVG"
        :disabled="isFirstBlock"
        direction="prev"
        @click="!isFirstBlock && prevBlock()"
      />
    </div>

    <!-- 右侧翻页按钮（浮动在对话框右侧） -->
    <div
      class="dialogue-nav-next absolute flex items-center"
      :style="{
        top: 'var(--theme-dialogue-nav-next-top, 50%)',
        right: 'var(--theme-dialogue-nav-next-right, 0.5em)',
        transform: 'translateY(-50%)',
        zIndex: 15,
      }"
    >
      <DialogueNavButton
        :svg-content="DIALOGUE_NAV_SVG"
        :disabled="isLastBlock"
        direction="next"
        @click="!isLastBlock && nextBlock()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import DialogueNavButton from './DialogueNavButton.vue';
import SkinShell from './SkinShell.vue';
import BlacktextOverlay from './components/dialogue/BlacktextOverlay.vue';
import DialogueNameTag from './components/dialogue/DialogueNameTag.vue';
import DialoguePortrait from './components/dialogue/DialoguePortrait.vue';
import TypewriterText from './components/dialogue/TypewriterText.vue';
import { useVNStore } from './store';

/** 翻页按钮 SVG（指向右侧；左侧按钮在 DialogueNavButton 中通过 scaleX(-1) 左右翻转） */
const DIALOGUE_NAV_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" fill="#6e4736">
  <g transform="translate(179.542068,641.088520) scale(0.057334,-0.057334)">
    <path d="M3648 7596 c-104 -28 -142 -70 -282 -315 -208 -361 -338 -681 -434 -1066 -89 -356 -117 -592 -117 -995 1 -408 24 -602 121 -984 177 -704 531 -1324 1073 -1880 125 -128 163 -156 213 -156 60 0 95 20 203 117 652 584 1100 1340 1290 2178 39 170 42 245 15 317 -33 88 -83 132 -254 223 -174 92 -238 132 -361 225 -457 347 -799 850 -936 1378 -43 166 -66 314 -84 526 -15 192 -26 237 -74 311 -70 106 -233 159 -373 121z"/>
    <path d="M458 5920 c-139 -25 -258 -154 -275 -298 -14 -123 132 -620 279 -947 454 -1012 1333 -1809 2382 -2159 93 -31 186 -59 207 -62 121 -20 225 80 204 195 -9 46 -30 76 -140 192 -388 411 -676 882 -850 1389 -92 268 -160 547 -186 762 -21 168 -56 202 -226 219 -267 26 -492 106 -717 256 -99 66 -263 219 -361 337 -78 94 -197 138 -317 116z"/>
    <path d="M6369 3597 c-87 -37 -134 -82 -217 -207 -157 -240 -316 -435 -512 -630 -282 -280 -529 -471 -880 -682 -115 -69 -150 -108 -150 -167 0 -58 32 -96 137 -165 670 -437 1406 -670 2190 -693 295 -8 365 7 451 101 72 78 92 146 113 381 17 197 2 411 -47 660 -96 483 -311 888 -663 1248 -129 133 -190 168 -296 174 -57 3 -80 -1 -126 -20z"/>
    <path d="M2820 1909 c-233 -26 -581 -129 -646 -190 -31 -29 -32 -78 -1 -106 21 -21 31 -21 307 -20 161 0 328 -5 385 -11 684 -81 1235 -308 1788 -737 70 -53 97 -56 139 -15 26 26 30 36 25 66 -7 43 -112 201 -219 328 -311 374 -788 622 -1318 686 -98 12 -351 11 -460 -1z"/>
  </g>
</svg>`;

const props = defineProps<{
  choices: { choiceId: string; text: string; isCustomInput?: boolean }[];
  duringStreaming: boolean;
  isPortraitMode?: boolean;
}>();

const store = useVNStore();

const dialogueSkin = computed(() => store.getComponentSkinForCurrent('dialogue'));
const portraitSkin = computed(() => store.getComponentSkinForCurrent('dialoguePortrait'));
const nameSkin = computed(() => store.getComponentSkinForCurrent('dialogueName'));

const dialogueOuterStyle = computed(() => ({
  marginLeft: props.isPortraitMode
    ? 'var(--theme-dialogue-margin-x-portrait, 0.5vmin)'
    : 'var(--theme-dialogue-margin-x, 0.75em)',
  marginRight: props.isPortraitMode
    ? 'var(--theme-dialogue-margin-x-portrait, 0.5vmin)'
    : 'var(--theme-dialogue-margin-x, 0.75em)',
  background: 'var(--theme-dialogue-bg, var(--vn-dialogue-bg))',
  border: '1px solid var(--theme-dialogue-border, var(--vn-border))',
  borderRadius: 'var(--theme-dialogue-radius, 0px)',
  boxShadow: 'var(--theme-dialogue-shadow)',
  width: 'var(--theme-dialogue-width, 100%)',
  minHeight: props.isPortraitMode
    ? 'var(--theme-dialogue-min-height-portrait, 16vmin)'
    : 'var(--theme-dialogue-min-height, 12em)',
}));

const displayedText = ref('');
const isTyping = ref(false);
const isBlacktextVisible = ref(false);
let typingTimer: ReturnType<typeof setTimeout> | null = null;

const BLACKTEXT_MASK_IN_MS = 520;

const currentBlock = computed(() => store.currentBlock);

const isFirstBlock = computed(() => store.currentBlockFlatIndex === 0);

const isLastBlock = computed(() => {
  const flat = store.allBlocksFlat;
  const curIdx = store.currentBlockFlatIndex;
  const flatLen = flat.length;
  if (!Array.isArray(flat) || flatLen === 0) return true;
  // 还在扁平数组中段：明显不是末尾
  if (curIdx < flatLen - 1) return false;
  // 已在扁平数组末尾：但还需要检查 dialogues 中是否还有未解析的可见楼层
  // （这些楼层将来会进入 flat，所以 next 不该被禁用）
  const dialogues = store.dialogues;
  if (!Array.isArray(dialogues)) return true;
  const currentBlockRef = flat[curIdx];
  const currentFloor = currentBlockRef?.floorIndex ?? -1;
  for (let i = currentFloor + 1; i < dialogues.length; i++) {
    const u = dialogues[i];
    if (!u) continue;
    if (u.role === 'user' || u.isHidden) continue;
    // 找到后续还有的可见楼层，如果未解析或解析了但还没在 flat 中显现（理论上不应该），
    // 都视为"还有内容"，next 不应被禁用
    if (!u.parsed) return false;
    // 已解析但该楼层还没出现在 flat 中（不太可能，但保险起见检查）
    if (!flat.some(b => b.floorIndex === i)) return false;
  }
  return true;
});

const hasChoices = computed(() => props.choices.length > 0);

const showUserAvatarForCurrentBlock = computed(() => {
  const block = currentBlock.value;
  if (!block || block.type !== 'character' || !block.character) return false;
  if (!store.userCharacter.avatarUrl) return false;
  if (store.userCharacter.avatarDisplayMode !== 'avatar') return false;
  return /^(<user>|user)$/i.test(block.character.trim());
});

/** TypewriterText 的 textType prop：blacktext 和 narration 都映射为 narration */
const textTypeForTypewriter = computed<'character' | 'narration' | 'blacktext'>(() => {
  const type = currentBlock.value?.type;
  if (type === 'character') return 'character';
  return 'narration';
});

function prevBlock() {
  store.navigateBlock(-1);
}

function nextBlock() {
  store.navigateBlock(1);
}

function getBlockText() {
  if (!currentBlock.value) return '';

  switch (currentBlock.value.type) {
    case 'character':
      return currentBlock.value.text || '';
    case 'narration':
      return currentBlock.value.message || '';
    case 'blacktext':
      return currentBlock.value.message || '';
    default:
      return '';
  }
}

watch(
  currentBlock,
  block => {
    if (!block) return;
    if (typingTimer) clearTimeout(typingTimer);

    displayedText.value = '';
    isTyping.value = true;
    isBlacktextVisible.value = false;

    const fullText = getBlockText();
    const charDelay = store.settings.textSpeed >= 10 ? 0 : Math.max(10, 120 - store.settings.textSpeed * 12);
    let charIndex = 0;

    if (charDelay === 0) {
      displayedText.value = fullText;
      isTyping.value = false;
      if (block.type === 'blacktext') {
        setTimeout(() => {
          isBlacktextVisible.value = true;
          isTyping.value = false;
        }, BLACKTEXT_MASK_IN_MS);
      }
      return;
    }

    const typeNext = () => {
      if (charIndex < fullText.length) {
        charIndex++;
        displayedText.value = fullText.slice(0, charIndex);
        typingTimer = setTimeout(typeNext, charDelay);
      } else {
        isTyping.value = false;
      }
    };

    if (block.type === 'blacktext') {
      setTimeout(() => {
        isBlacktextVisible.value = true;
        typingTimer = setTimeout(typeNext, charDelay);
      }, BLACKTEXT_MASK_IN_MS);
    } else {
      typingTimer = setTimeout(typeNext, charDelay);
    }
  },
  { immediate: true },
);

watch(
  () =>
    [store.settings.autoPlay, isTyping.value, hasChoices.value, isLastBlock.value, store.currentBlockIndex] as const,
  ([autoPlay, typing, choices, last]) => {
    if (!autoPlay || typing || choices || last) return;
    const delay = Math.max(500, 5000 - store.settings.autoPlaySpeed * 400);
    const timer = setTimeout(nextBlock, delay);
    onScopeDispose(() => clearTimeout(timer));
  },
);

function handleTextScroll() {
  // TypewriterText 内部处理滚动状态，这里仅作为占位回调
}

function handleClickText() {
  if (isTyping.value) {
    if (typingTimer) clearTimeout(typingTimer);
    displayedText.value = getBlockText();
    isTyping.value = false;
  } else if (!isLastBlock.value) {
    nextBlock();
  }
}

function handleBlacktextClick(_event: MouseEvent) {
  // BlacktextOverlay 子组件处理点击逻辑，这里仅处理跳过打字
  if (isTyping.value) {
    if (typingTimer) clearTimeout(typingTimer);
    displayedText.value = getBlockText();
    isTyping.value = false;
  }
}

onUnmounted(() => {
  if (typingTimer) clearTimeout(typingTimer);
});
</script>

<style scoped>
@media (min-width: 768px) {
  [data-ui='dialogue-box'] .dialogue-shell-wrap {
    max-width: calc(100% - var(--theme-dialogue-margin-x-md, 1em) * 2);
    margin-left: var(--theme-dialogue-margin-x-md, 1em) !important;
    margin-right: var(--theme-dialogue-margin-x-md, 1em) !important;
  }
}

@media (min-width: 1024px) {
  [data-ui='dialogue-box'] .dialogue-shell-wrap {
    max-width: calc(100% - var(--theme-dialogue-margin-x-lg, 2em) * 2);
    margin-left: var(--theme-dialogue-margin-x-lg, 2em) !important;
    margin-right: var(--theme-dialogue-margin-x-lg, 2em) !important;
  }
}
</style>
