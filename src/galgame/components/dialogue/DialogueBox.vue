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

  <!-- 虚拟块：选项 / 自定义输入触发生成后进入；DialogueBox 显示"等待生成"视图 -->
  <div
    v-if="store.virtualBlockActive"
    data-ui="virtual-block"
    class="relative w-full"
    :style="dialogueOuterStyle"
    @click="handleClickText"
  >
    <SkinShell :skin="dialogueSkin" :shell-style="dialogueOuterStyle">
      <div class="relative h-full w-full">
        <!-- 居中提示卡片 -->
        <div class="flex h-full min-h-[8em] w-full items-center justify-center px-6 py-5">
          <div class="text-center">
            <div class="mb-2 text-xs tracking-widest opacity-60" style="letter-spacing: 0.2em">
              {{ virtualBlockPhaseLabel }}
            </div>
            <div class="text-base font-medium">
              {{ virtualBlockHeadline }}
            </div>
            <div class="mt-3 text-xs opacity-60">左翻页可回退上一块</div>
          </div>
        </div>

        <!-- 左侧翻页按钮：虚拟块期间可点（退出虚拟块回退到上一真实块） -->
        <div
          class="dialogue-nav-prev absolute flex items-center"
          :style="{
            top: 'var(--theme-dialogue-nav-prev-top, 50%)',
            left: 'var(--theme-dialogue-nav-prev-left, 0.5rem)',
            transform: 'translateY(-50%)',
            zIndex: 15,
          }"
        >
          <DialogueNavButton
            :svg-content="DIALOGUE_NAV_SVG"
            :disabled="isFirstBlock"
            direction="prev"
            :is-portrait-mode="isPortraitMode"
            @click="!isFirstBlock && prevBlock()"
          />
        </div>

        <!-- 右侧翻页按钮：虚拟块期间禁用 -->
        <div
          class="dialogue-nav-next absolute flex items-center"
          :style="{
            top: 'var(--theme-dialogue-nav-next-top, 50%)',
            right: 'var(--theme-dialogue-nav-next-right, 0.5rem)',
            transform: 'translateY(-50%)',
            zIndex: 15,
          }"
        >
          <DialogueNavButton
            :svg-content="DIALOGUE_NAV_SVG"
            :disabled="true"
            direction="next"
            :is-portrait-mode="isPortraitMode"
            @click="() => {}"
          />
        </div>
      </div>
    </SkinShell>
  </div>

  <!-- 用户手动退出虚拟块后的提示：底部的 DialogueBox 主视图显示当前真实块；其右翻按钮会在
       virtualBlockExitedByUser=true 时自动变为可用（navigateBlock(+1) 重新进入虚拟块），
       并通过 .vn-dialogue-resumed-hint 在文本底部给出文字提示。 -->

  <!-- 对话框主体（非黑屏时显示） -->
  <div
    v-if="!store.virtualBlockActive && currentBlock && currentBlock.type !== 'blacktext'"
    data-ui="dialogue-box"
    class="relative w-full"
    @click="handleClickText"
  >
    <!-- 对话框壳 + 内容（包含关系，不再分离） -->
    <SkinShell :skin="dialogueSkin" :shell-style="dialogueOuterStyle">
      <div class="relative h-full w-full">
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
          :is-portrait-mode="isPortraitMode"
        />

        <!-- 主文本框：使用 TypewriterText 子组件 -->
        <TypewriterText
          :displayed-text="displayedText"
          :is-typing="isTyping"
          :text-type="textTypeForTypewriter"
          :disable-thought-parsing="currentBlock?.type !== 'character'"
          :is-portrait-mode="isPortraitMode"
          @scroll="handleTextScroll"
        />

        <!-- 用户主动退出虚拟块后的底部提示：点击右箭头重新进入虚拟块继续等待生成 -->
        <div
          v-if="store.virtualBlockExitedByUser"
          class="vn-dialogue-resumed-hint pointer-events-none absolute inset-x-0 text-center text-xs"
          :style="{
            bottom: 'var(--theme-dialogue-resumed-hint-bottom, 0.35rem)',
            color: 'var(--theme-dialogue-resumed-hint-color, rgba(212, 197, 160, 0.6))',
            letterSpacing: '0.1em',
          }"
        >
          右侧点击继续等待生成
        </div>

        <!-- 左侧翻页按钮（浮动在对话框左侧） -->
        <div
          class="dialogue-nav-prev absolute flex items-center"
          :style="{
            top: 'var(--theme-dialogue-nav-prev-top, 70%)',
            left: 'var(--theme-dialogue-nav-prev-left, 0.5rem)',
            transform: 'translateY(-50%)',
            zIndex: 15,
          }"
        >
          <DialogueNavButton
            :svg-content="DIALOGUE_NAV_SVG"
            :disabled="isFirstBlock"
            direction="prev"
            :is-portrait-mode="isPortraitMode"
            @click="!isFirstBlock && prevBlock()"
          />
        </div>

        <!-- 右侧翻页按钮（浮动在对话框右侧） -->
        <div
          class="dialogue-nav-next absolute flex items-center"
          :style="{
            top: 'var(--theme-dialogue-nav-next-top, 70%)',
            right: 'var(--theme-dialogue-nav-next-right, 0.5rem)',
            transform: 'translateY(-50%)',
            zIndex: 15,
          }"
        >
          <DialogueNavButton
            :svg-content="DIALOGUE_NAV_SVG"
            :disabled="isLastBlock && !store.virtualBlockExitedByUser"
            direction="next"
            :is-portrait-mode="isPortraitMode"
            @click="!(isLastBlock && !store.virtualBlockExitedByUser) && nextBlock()"
          />
        </div>
      </div>
    </SkinShell>
  </div>
</template>

<script setup lang="ts">
import { useVNStore } from '../../store';
import SkinShell from '../common/SkinShell.vue';
import BlacktextOverlay from './BlacktextOverlay.vue';
import DialogueNameTag from './DialogueNameTag.vue';
import DialogueNavButton from './DialogueNavButton.vue';
import DialoguePortrait from './DialoguePortrait.vue';
import TypewriterText from './TypewriterText.vue';

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
  marginLeft: 'var(--theme-dialogue-margin-x, var(--theme-dialogue-margin-x-lg, 0.75rem))',
  marginRight: 'var(--theme-dialogue-margin-x, var(--theme-dialogue-margin-x-lg, 0.75rem))',
  background: 'var(--theme-dialogue-bg, var(--vn-dialogue-bg, rgba(42,36,32,0.92)))',
  border: '1px solid var(--theme-dialogue-border, var(--vn-border, rgba(90,79,64,0.55)))',
  borderRadius: 'var(--theme-dialogue-radius, 0px)',
  boxShadow: 'var(--theme-dialogue-shadow, 0 0.25rem 0.75rem rgba(0,0,0,0.4))',
  width: 'var(--theme-dialogue-width, 100%)',
  // 高度策略：
  //  - 外层对话框不强制 minHeight——由各主题的 --theme-dialogue-min-height / -portrait 控制保底。
  //  - 长文本高度由 store.settings.fixedDialogueMinHeight（设置面板开关"固定对话框高度"）决定：
  //      开启 → TypewriterText 给文本区设 minHeight，保底 + 自由撑开（适合短文本多的情况）
  //      关闭 → TypewriterText 给文本区设 maxHeight，超出滚动（适合长文本不抖动的场景）
  //  - SkinShell 主题（如和蝶）由 PNG 外壳决定高度，开关只影响文本区。
  display: 'flex' as const,
  flexDirection: 'column' as const,
}));

const displayedText = ref('');
const isTyping = ref(false);
const isBlacktextVisible = ref(false);
let typingTimer: ReturnType<typeof setTimeout> | null = null;

const BLACKTEXT_MASK_IN_MS = 520;

const currentBlock = computed(() => store.currentBlock);

const isFirstBlock = computed(() => store.currentBlockFlatIndex === 0);
// 虚拟块期间：isLastBlock 也保持真实块的判定（虚拟块本身不算"末尾"），
// 否则右翻按钮会被错误地 disable（其实根本用不到右按钮）
const isLastBlock = computed(() => {
  const flat = store.allBlocksFlat;
  return store.currentBlockFlatIndex >= (flat?.length ?? 1) - 1;
});

/** 虚拟块阶段标签（显示在对话框上方） */
const virtualBlockPhaseLabel = computed(() => {
  const phase = store.virtualBlockPhase;
  switch (phase) {
    case 'streaming':
      return '生成中';
    case 'danmaku':
      return '弹幕生成中';
    case 'image':
      return '生图中';
    case 'done':
      return '即将进入下一段';
    default:
      return '';
  }
});

/** 虚拟块提示文案（根据是否有第二 API 调用） */
const virtualBlockHeadline = computed(() => {
  const phase = store.virtualBlockPhase;
  const hasDanmaku = store.settings.danmakuEnabled;
  const hasImage = store.settings.imageGenEnabled;
  if (phase === 'done') return '等待完成';
  if (phase === 'image') return hasImage ? '生成图片中...' : '整理中...';
  if (phase === 'danmaku') return hasDanmaku ? '准备弹幕中...' : '整理中...';
  // streaming
  if (hasDanmaku && hasImage) return 'AI 正在创作，生成完成后自动播放弹幕与场景图';
  if (hasDanmaku) return 'AI 正在创作，生成完成后自动播放弹幕';
  if (hasImage) return 'AI 正在创作，生成完成后自动生成场景图';
  return 'AI 正在创作';
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

function handleClickText(event: MouseEvent) {
  if (isTyping.value) {
    if (typingTimer) clearTimeout(typingTimer);
    displayedText.value = getBlockText();
    isTyping.value = false;
    return;
  }

  // 竖屏模式下，点击对话框的左/右半屏分别前进/后退（更宽容的点击区域）
  if (props.isPortraitMode) {
    const target = event.currentTarget as HTMLElement | null;
    if (target) {
      const rect = target.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const isLeftHalf = clickX < rect.width / 2;
      if (isLeftHalf) {
        if (!isFirstBlock.value) {
          prevBlock();
        }
        return;
      }
      // 右半屏：非末尾向前；末尾若用户曾退出虚拟块则允许重新进入
      if (!isLastBlock.value) {
        nextBlock();
        return;
      }
      if (store.virtualBlockExitedByUser) {
        nextBlock();
      }
      return;
    }
  }

  // 横屏保持原行为：任意位置点击 = 向前翻页
  if (!isLastBlock.value) {
    nextBlock();
    return;
  }
  // 末尾真实块：仅在『用户主动退出虚拟块』状态下，点文本也能重新进入虚拟块继续等待
  if (store.virtualBlockExitedByUser) {
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
    max-width: calc(100% - var(--theme-dialogue-margin-x-md, 1rem) * 2);
    margin-left: var(--theme-dialogue-margin-x-md, 1rem) !important;
    margin-right: var(--theme-dialogue-margin-x-md, 1rem) !important;
  }
}

@media (min-width: 1024px) {
  [data-ui='dialogue-box'] .dialogue-shell-wrap {
    max-width: calc(100% - var(--theme-dialogue-margin-x-lg, 2rem) * 2);
    margin-left: var(--theme-dialogue-margin-x-lg, 2rem) !important;
    margin-right: var(--theme-dialogue-margin-x-lg, 2rem) !important;
  }
}
</style>
