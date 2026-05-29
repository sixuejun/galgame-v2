/**
 * Typewriter Composable
 *
 * Handles character-by-character text display with configurable speed,
 * skip-on-click functionality, and auto-play support.
 */

import { useVNStore } from '../store';

export interface TypewriterOptions {
  /** Text speed (1-10), higher is faster */
  speed?: number;
  /** Whether auto-play is enabled */
  autoPlay?: boolean;
  /** Auto-play delay multiplier (ms) */
  autoPlayDelay?: number;
  /** Callback when typing completes */
  onComplete?: () => void;
  /** Callback when text is skipped */
  onSkip?: () => void;
}

export function useTypewriter(options: TypewriterOptions = {}) {
  const store = useVNStore();

  /** Current displayed text */
  const displayedText = ref('');

  /** Whether typing animation is in progress */
  const isTyping = ref(false);

  /** The full text to type */
  const fullText = ref('');

  /** Timer reference */
  let typingTimer: ReturnType<typeof setTimeout> | null = null;

  /** Auto-play timer reference */
  let autoPlayTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Calculate character delay based on speed setting
   */
  function getCharDelay(): number {
    const speed = options.speed ?? store.settings.textSpeed;
    // Speed 10 = instant (0ms), speed 1 = slowest (120ms)
    // Linear interpolation: delay = 120 - (speed - 1) * 12
    return speed >= 10 ? 0 : Math.max(10, 120 - (speed - 1) * 12);
  }

  /**
   * Start typing animation for the given text
   */
  function startTyping(text: string, skipToEnd: boolean = false): void {
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }

    fullText.value = text;
    displayedText.value = skipToEnd ? text : '';
    isTyping.value = !skipToEnd;

    if (skipToEnd || getCharDelay() === 0) {
      displayedText.value = text;
      isTyping.value = false;
      options.onComplete?.();
      return;
    }

    let charIndex = skipToEnd ? text.length : 0;

    const typeNext = () => {
      if (charIndex < fullText.value.length) {
        charIndex++;
        displayedText.value = fullText.value.slice(0, charIndex);
        typingTimer = setTimeout(typeNext, getCharDelay());
      } else {
        isTyping.value = false;
        options.onComplete?.();
      }
    };

    typingTimer = setTimeout(typeNext, getCharDelay());
  }

  /**
   * Skip typing animation - show full text immediately
   */
  function skip(): void {
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }
    displayedText.value = fullText.value;
    isTyping.value = false;
    options.onSkip?.();
  }

  /**
   * Handle click event - skip if typing, otherwise return false
   * @returns true if click was handled (skipped), false if no typing to skip
   */
  function handleClick(): boolean {
    if (isTyping.value) {
      skip();
      return true;
    }
    return false;
  }

  /**
   * Start auto-play timer
   */
  function startAutoPlay(onAdvance: () => void): void {
    if (!(options.autoPlay ?? store.settings.autoPlay)) {
      return;
    }

    const delay = options.autoPlayDelay ?? Math.max(500, 5000 - store.settings.autoPlaySpeed * 400);

    if (autoPlayTimer) {
      clearTimeout(autoPlayTimer);
    }

    autoPlayTimer = setTimeout(() => {
      onAdvance();
    }, delay);
  }

  /**
   * Stop auto-play timer
   */
  function stopAutoPlay(): void {
    if (autoPlayTimer) {
      clearTimeout(autoPlayTimer);
      autoPlayTimer = null;
    }
  }

  /**
   * Reset state
   */
  function reset(): void {
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }
    stopAutoPlay();
    displayedText.value = '';
    fullText.value = '';
    isTyping.value = false;
  }

  onUnmounted(() => {
    reset();
  });

  return {
    displayedText: readonly(displayedText),
    isTyping: readonly(isTyping),
    fullText: readonly(fullText),
    startTyping,
    skip,
    handleClick,
    startAutoPlay,
    stopAutoPlay,
    reset,
  };
}
