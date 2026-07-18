<template>
  <div class="sprite-layer absolute inset-0 pointer-events-none" :style="{ zIndex: 2 }">
    <!-- 角色立绘 -->
    <Transition name="fade">
      <div
        v-if="showSprite && currentSpriteImage"
        class="sprite-container absolute inset-0"
      >
        <!-- Live2D 模式 -->
        <canvas
          v-if="spriteType === 'live2d' && live2dCanvasId"
          :id="live2dCanvasId"
          ref="live2dCanvasRef"
          class="live2d-canvas absolute"
          :style="spriteStyle"
        />

        <!-- 图片模式 -->
        <img
          v-else
          :src="currentSpriteImage"
          alt="角色立绘"
          class="sprite-image absolute object-contain"
          :style="spriteStyle"
          @error="handleImageError"
        />
      </div>
    </Transition>

    <!-- 玩家头像立绘（仅当当前块为 user 类型且模式为 sprite 时显示） -->
    <Transition name="fade">
      <div
        v-if="showPlayerSprite"
        class="sprite-container absolute inset-0"
      >
        <img
          :src="playerAvatarUrl"
          :alt="playerName"
          class="sprite-image absolute object-contain"
          :style="spriteStyle"
        />
      </div>
    </Transition>

    <!-- Live2D 加载错误提示（开发时调试用） -->
    <div
      v-if="live2dError"
      class="live2d-error absolute bottom-4 left-4 rounded bg-black/50 px-2 py-1 text-xs text-white"
    >
      Live2D 加载失败，已回退到图片模式
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVNStore } from '../../store';
import { useLive2D } from '../../composables/useLive2D';

const props = withDefaults(
  defineProps<{
    /** 角色立绘 URL */
    spriteImage?: string;
    /** Live2D 模型 ID */
    live2dModelId?: string;
    /** 是否显示立绘 */
    visible?: boolean;
    /** 玩家头像 URL */
    playerAvatarUrl?: string;
    /** 玩家名称 */
    playerName?: string;
    /** 是否显示玩家立绘 */
    showPlayerSprite?: boolean;
  }>(),
  {
    spriteImage: '',
    live2dModelId: '',
    visible: true,
    playerAvatarUrl: '',
    playerName: 'Player',
    showPlayerSprite: false,
  }
);

const store = useVNStore();
const live2d = useLive2D();

/** Live2D Canvas ID */
const live2dCanvasId = 'live2d-canvas';
const live2dCanvasRef = ref<HTMLCanvasElement | null>(null);

/** 是否显示立绘 */
const showSprite = computed(() => props.visible && props.spriteImage);

/** 当前立绘图片 */
const currentSpriteImage = computed(() => {
  if (props.spriteImage) return props.spriteImage;
  return store.currentBlock?.spriteImageUrl;
});

/** 立绘样式：竖屏/横屏各自独立的 scale / x / y，避免互相污染。
 *  使用 transform: scale() 做"真正的"缩放（不改变元素 box 高度，因此不会因为高度变化
 *  导致 overflow:hidden 切到不同部分而被误认为"只是移动了"）。
 *  - 元素 box 固定为容器高度；width:auto 让宽度按图片原生长宽比算出。
 *  - transform-origin: center bottom 让缩放围绕"脚底中心"，scale>1 时头部向上延伸，
 *    scale<1 时向中心收缩，立绘的"脚"始终锚在 bottom: y% 处不会"飞起来"。
 *  - translateX(-50%) 配合 left: calc(50% + x%) 实现水平居中。 */
  const spriteStyle = computed(() => {
    const isPortrait = !!store.settings.portraitMode;
    const scale = store.getPortraitScale(isPortrait) / 100;
    const x = store.getPortraitX(isPortrait);
    const y = store.getPortraitY(isPortrait);
    return {
      height: '100%',
      width: 'auto',
      objectFit: 'contain' as const,
      left: `calc(50% + ${x}%)`,
      bottom: `${y}%`,
      transform: `translateX(-50%) scale(${scale})`,
      transformOrigin: 'center bottom',
    };
  });

/** Live2D 相关状态 */
const live2dError = ref(false);

/**
 * 判断当前应该使用哪种立绘渲染模式
 *
 * 检测逻辑：
 * 1. 如果 currentBlock 或 props 指定了 spriteType 为 'live2d'，使用 Live2D
 * 2. 如果配置了 live2dModelId 且模型已加载，使用 Live2D
 * 3. 否则使用图片模式
 */
const spriteType = computed<'image' | 'live2d' | 'none'>(() => {
  const block = store.currentBlock;

  // 如果有指定 spriteType
  if (block?.type === 'character') {
    // 检查是否有 Live2D 模型配置
    if (props.live2dModelId || (block as any).spriteType === 'live2d') {
      if (live2d.renderState.value.isLoaded) {
        return 'live2d';
      }
    }
  }

  // 回退到图片模式
  return currentSpriteImage.value ? 'image' : 'none';
});

/**
 * 初始化 Live2D 模型
 */
async function initializeLive2DModel() {
  if (!props.live2dModelId) return;

  try {
    live2dError.value = false;

    // 获取模型资源
    const model = live2d.getModel(props.live2dModelId);
    if (!model) {
      console.warn('[SpriteLayer] Live2D model not found:', props.live2dModelId);
      return;
    }

    // 如果模型有 .model3 路径，初始化 Live2D
    if (model.files?.model3) {
      await live2d.initializeModel({
        modelPath: model.files.model3,
        textures: model.textures,
        canvasId: live2dCanvasId,
      });
    }
  } catch (error) {
    console.warn('[SpriteLayer] Live2D initialization failed, falling back to image:', error);
    live2dError.value = true;
  }
}

/**
 * 处理图片加载错误
 */
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  console.warn('[SpriteLayer] Sprite image failed to load:', img.src);
}

/**
 * 设置立绘表情
 */
function setExpression(expression: string) {
  live2d.setExpression(expression);
}

/**
 * 播放立绘动作
 */
function playMotion(motionGroup: string, priority?: number) {
  live2d.startMotion(motionGroup, priority);
}

/**
 * 监听消息块变化，更新 Live2D 状态
 */
watch(
  () => store.currentBlock,
  block => {
    if (!block || block.type !== 'character') return;

    // 匹配动作
    if (block.motion) {
      const motion = live2d.findMotion(props.live2dModelId, block.motion);
      if (motion) {
        live2d.startMotion(motion.motionGroup);
      }
    }

    // 匹配表情
    if (block.expression) {
      const expr = live2d.findExpression(props.live2dModelId, block.expression);
      if (expr) {
        live2d.setExpression(expr);
      }
    }
  }
);

// 组件挂载时尝试初始化 Live2D
onMounted(() => {
  if (props.live2dModelId && spriteType.value !== 'image') {
    initializeLive2DModel();
  }
});

// 组件卸载时清理 Live2D
onUnmounted(() => {
  live2d.dispose();
});

defineExpose({
  setExpression,
  playMotion,
  initializeLive2DModel,
});
</script>

<style scoped>
.sprite-layer {
  overflow: hidden;
}

.sprite-container {
  overflow: visible;
}

.sprite-image {
  user-select: none;
  -webkit-user-drag: none;
  /* scale / x / y 通过 transform/position 实时改变，加 transition 让用户拖动滑块时
   * 立绘大小变化更"丝滑"，避免被瞬间切换误认为"只是移动了" */
  transition: transform 0.15s ease-out;
}

.live2d-canvas {
  user-select: none;
  transition: transform 0.15s ease-out;
}
</style>
