import { ref, onMounted, onUnmounted } from 'vue'

export interface TouchGestureOptions {
  element?: HTMLElement | null
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onPinch?: (scale: number) => void
  onDoubleTap?: () => void
  onLongPress?: (event: TouchEvent) => void
  onPullToRefresh?: () => Promise<void>
  swipeThreshold?: number
  longPressDelay?: number
}

export function useTouchGestures(options: TouchGestureOptions = {}) {
  const {
    swipeThreshold = 50,
    longPressDelay = 500
  } = options

  const touchStartX = ref(0)
  const touchStartY = ref(0)
  const touchEndX = ref(0)
  const touchEndY = ref(0)
  const touchStartTime = ref(0)
  const lastTapTime = ref(0)
  const isPulling = ref(false)
  const pullDistance = ref(0)
  
  let longPressTimer: ReturnType<typeof setTimeout> | null = null
  let initialPinchDistance = 0
  let currentScale = 1
  let element: HTMLElement | null = null

  // Touch event handlers
  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      touchStartX.value = e.touches[0].clientX
      touchStartY.value = e.touches[0].clientY
      touchStartTime.value = Date.now()
      
      // Long press detection
      if (options.onLongPress) {
        longPressTimer = setTimeout(() => {
          options.onLongPress?.(e)
        }, longPressDelay)
      }
      
      // Pull-to-refresh detection
      if (options.onPullToRefresh && window.scrollY === 0) {
        isPulling.value = true
      }
    } else if (e.touches.length === 2 && options.onPinch) {
      // Pinch gesture start
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      initialPinchDistance = Math.sqrt(dx * dx + dy * dy)
    }
  }

  function handleTouchMove(e: TouchEvent) {
    // Clear long press on move
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }

    if (e.touches.length === 1) {
      touchEndX.value = e.touches[0].clientX
      touchEndY.value = e.touches[0].clientY
      
      // Pull-to-refresh handling
      if (isPulling.value && options.onPullToRefresh) {
        const deltaY = touchEndY.value - touchStartY.value
        if (deltaY > 0) {
          pullDistance.value = Math.min(deltaY, 150)
          e.preventDefault()
          
          // Visual feedback
          if (element) {
            element.style.transform = `translateY(${pullDistance.value * 0.5}px)`
            element.style.transition = 'none'
          }
        }
      }
    } else if (e.touches.length === 2 && options.onPinch && initialPinchDistance > 0) {
      // Pinch gesture move
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const scale = distance / initialPinchDistance
      
      if (Math.abs(scale - currentScale) > 0.01) {
        currentScale = scale
        options.onPinch(scale)
      }
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }

    const touchEndTime = Date.now()
    const timeDiff = touchEndTime - touchStartTime.value

    // Double tap detection
    if (options.onDoubleTap) {
      const tapTimeDiff = touchEndTime - lastTapTime.value
      if (tapTimeDiff < 300 && tapTimeDiff > 0) {
        options.onDoubleTap()
        lastTapTime.value = 0
        return
      }
      lastTapTime.value = touchEndTime
    }

    // Pull-to-refresh release
    if (isPulling.value && options.onPullToRefresh) {
      isPulling.value = false
      
      if (element) {
        element.style.transition = 'transform 0.3s ease'
        element.style.transform = 'translateY(0)'
      }
      
      if (pullDistance.value > 80) {
        options.onPullToRefresh().then(() => {
          pullDistance.value = 0
        })
      } else {
        pullDistance.value = 0
      }
      return
    }

    // Swipe detection (only for quick swipes)
    if (timeDiff < 300) {
      const deltaX = touchEndX.value - touchStartX.value
      const deltaY = touchEndY.value - touchStartY.value
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (absX > swipeThreshold || absY > swipeThreshold) {
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > swipeThreshold && options.onSwipeRight) {
            options.onSwipeRight()
          } else if (deltaX < -swipeThreshold && options.onSwipeLeft) {
            options.onSwipeLeft()
          }
        } else {
          // Vertical swipe
          if (deltaY > swipeThreshold && options.onSwipeDown) {
            options.onSwipeDown()
          } else if (deltaY < -swipeThreshold && options.onSwipeUp) {
            options.onSwipeUp()
          }
        }
      }
    }

    // Reset pinch
    initialPinchDistance = 0
    currentScale = 1
  }

  function handleTouchCancel() {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    isPulling.value = false
    pullDistance.value = 0
    initialPinchDistance = 0
    currentScale = 1
    
    if (element) {
      element.style.transform = 'translateY(0)'
    }
  }

  // Prevent default gestures
  function handleGestureStart(e: Event) {
    e.preventDefault()
  }

  function setup(el?: HTMLElement | null) {
    element = el || options.element || document.body
    
    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: false })
      element.addEventListener('touchmove', handleTouchMove, { passive: false })
      element.addEventListener('touchend', handleTouchEnd, { passive: false })
      element.addEventListener('touchcancel', handleTouchCancel, { passive: false })
      element.addEventListener('gesturestart', handleGestureStart, { passive: false })
    }
  }

  function cleanup() {
    if (element) {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchCancel)
      element.removeEventListener('gesturestart', handleGestureStart)
    }
    
    if (longPressTimer) {
      clearTimeout(longPressTimer)
    }
  }

  onMounted(() => {
    if (!element && options.element) {
      setup(options.element)
    }
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    setup,
    cleanup,
    isPulling,
    pullDistance,
    touchStartX,
    touchStartY,
    touchEndX,
    touchEndY
  }
}