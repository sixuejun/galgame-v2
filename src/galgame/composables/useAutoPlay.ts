/**
 * Auto-play Composable
 *
 * Handles automatic progression through dialogue blocks
 * with configurable timing and pause conditions.
 */

import { useVNStore } from '../store';

export interface AutoPlayOptions {
  /** Minimum delay between advances (ms) */
  minDelay?: number;
  /** Maximum delay between advances (ms) */
  maxDelay?: number;
  /** Whether to respect user settings */
  useSettings?: boolean;
  /** Callback when auto-play starts */
  onStart?: () => void;
  /** Callback when auto-play stops */
  onStop?: () => void;
  /** Callback when advancing */
  onAdvance?: () => void;
}

export function useAutoPlay(options: AutoPlayOptions = {}) {
  const store = useVNStore();

  /** Whether auto-play is currently active */
  const isActive = ref(false);

  /** Timer reference */
  let autoPlayTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Calculate delay based on settings
   */
  function getDelay(): number {
    if (options.useSettings ?? true) {
      // Settings scale: 1-10, mapped to 5000-500ms
      return Math.max(
        options.minDelay ?? 500,
        (options.maxDelay ?? 5000) - store.settings.autoPlaySpeed * 400
      );
    }
    return options.minDelay ?? 1500;
  }

  /**
   * Start auto-play
   */
  function start(onAdvance: () => void): void {
    if (isActive.value) return;

    isActive.value = true;
    options.onStart?.();

    const tick = () => {
      if (!isActive.value) return;

      // Check if we should pause
      if (shouldPause()) {
        scheduleNext(tick);
        return;
      }

      options.onAdvance?.();
      onAdvance();
    };

    scheduleNext(tick);
  }

  /**
   * Stop auto-play
   */
  function stop(): void {
    isActive.value = false;
    if (autoPlayTimer) {
      clearTimeout(autoPlayTimer);
      autoPlayTimer = null;
    }
    options.onStop?.();
  }

  /**
   * Toggle auto-play state
   */
  function toggle(onAdvance: () => void): void {
    if (isActive.value) {
      stop();
    } else {
      start(onAdvance);
    }
  }

  /**
   * Check if auto-play should pause
   */
  function shouldPause(): boolean {
    // Pause if auto-play setting is disabled
    if (!store.settings.autoPlay) return true;

    // Pause if currently typing
    // Note: isTyping is managed by useTypewriter, not store

    // Pause if there are choices
    const currentBlock = store.currentBlock;
    if (currentBlock?.type === 'choice') return true;

    // Pause if at the last block
    const flat = store.allBlocksFlat;
    if (store.currentBlockFlatIndex >= (flat?.length ?? 1) - 1) return true;

    return false;
  }

  /**
   * Schedule next auto-play tick
   */
  function scheduleNext(callback: () => void): void {
    if (autoPlayTimer) {
      clearTimeout(autoPlayTimer);
    }
    autoPlayTimer = setTimeout(callback, getDelay());
  }

  onUnmounted(() => {
    stop();
  });

  return {
    isActive: readonly(isActive),
    start,
    stop,
    toggle,
    shouldPause,
  };
}
