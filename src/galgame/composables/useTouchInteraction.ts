/**
 * Touch Interaction Composable
 *
 * Handles touch/click interactions for dialogue navigation
 * with support for gesture detection and accessibility.
 */

export interface TouchInteractionOptions {
  /** Whether to enable swipe gestures */
  enableSwipe?: boolean;
  /** Swipe threshold in pixels */
  swipeThreshold?: number;
  /** Callback when left tap/click is detected */
  onLeftTap?: () => void;
  /** Callback when right tap/click is detected */
  onRightTap?: () => void;
  /** Callback when tap/click is detected */
  onTap?: () => void;
  /** Callback when swipe left is detected */
  onSwipeLeft?: () => void;
  /** Callback when swipe right is detected */
  onSwipeRight?: () => void;
}

export function useTouchInteraction(options: TouchInteractionOptions = {}) {
  /** Touch start position */
  const touchStartX = ref(0);
  const touchStartY = ref(0);

  /** Whether touch has moved past threshold */
  const hasSwiped = ref(false);

  /**
   * Handle touch/click start
   */
  function handleTouchStart(event: TouchEvent | MouseEvent): void {
    if (event instanceof TouchEvent) {
      touchStartX.value = event.touches[0]?.clientX ?? 0;
      touchStartY.value = event.touches[0]?.clientY ?? 0;
    } else {
      touchStartX.value = event.clientX;
      touchStartY.value = event.clientY;
    }
    hasSwiped.value = false;
  }

  /**
   * Handle touch/click move
   */
  function handleTouchMove(event: TouchEvent | MouseEvent): void {
    if (!options.enableSwipe) return;

    const currentX = event instanceof TouchEvent ? event.touches[0]?.clientX ?? 0 : event.clientX;
    const currentY = event instanceof TouchEvent ? event.touches[0]?.clientY ?? 0 : event.clientY;

    const deltaX = currentX - touchStartX.value;
    const deltaY = currentY - touchStartY.value;

    // Check if horizontal movement exceeds threshold
    if (Math.abs(deltaX) > (options.swipeThreshold ?? 50) && Math.abs(deltaX) > Math.abs(deltaY)) {
      hasSwiped.value = true;
    }
  }

  /**
   * Handle touch/click end
   */
  function handleTouchEnd(event: TouchEvent | MouseEvent): void {
    if (hasSwiped.value) {
      // Swipe handling
      const endX = event instanceof TouchEvent ? event.changedTouches[0]?.clientX ?? 0 : event.clientX;
      const deltaX = endX - touchStartX.value;

      if (deltaX < 0) {
        options.onSwipeLeft?.();
      } else if (deltaX > 0) {
        options.onSwipeRight?.();
      }
    } else {
      // Tap handling
      options.onTap?.();

      // Determine left/right based on initial position relative to viewport
      if (options.onLeftTap || options.onRightTap) {
        const tapX = touchStartX.value;
        const viewportWidth = window.innerWidth;
        const isLeft = tapX < viewportWidth / 2;

        if (isLeft) {
          options.onLeftTap?.();
        } else {
          options.onRightTap?.();
        }
      }
    }

    hasSwiped.value = false;
  }

  /**
   * Handle click event
   */
  function handleClick(event: MouseEvent): void {
    // If swipe tracking is enabled, ignore regular clicks during swipe
    if (options.enableSwipe && hasSwiped.value) return;

    options.onTap?.();

    if (options.onLeftTap || options.onRightTap) {
      const isLeft = event.clientX < window.innerWidth / 2;

      if (isLeft) {
        options.onLeftTap?.();
      } else {
        options.onRightTap?.();
      }
    }
  }

  /**
   * Create touch event handlers
   */
  function createTouchHandlers() {
    return {
      onTouchstart: handleTouchStart,
      onTouchmove: handleTouchMove,
      onTouchend: handleTouchEnd,
    };
  }

  /**
   * Create click event handler
   */
  function createClickHandler() {
    return {
      onClick: handleClick,
    };
  }

  return {
    hasSwiped: readonly(hasSwiped),
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClick,
    createTouchHandlers,
    createClickHandler,
  };
}
