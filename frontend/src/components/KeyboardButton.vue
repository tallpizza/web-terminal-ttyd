<template>
  <button
    :class="buttonClasses"
    :style="buttonStyles"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    @click="handleClick"
  >
    <span v-if="icon" class="key-icon">{{ icon }}</span>
    <span v-else class="key-label">{{ displayLabel }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  label: string
  code: string
  shifted?: string
  size?: 'small' | 'medium' | 'large' | 'space'
  color?: string
  icon?: string
  active?: boolean
}>()

const emit = defineEmits<{
  keypress: [event: { code: string; key: string }]
}>()

const pressed = ref(false)

const displayLabel = computed(() => {
  if (props.active && props.shifted) {
    return props.shifted
  }
  return props.label
})

const buttonClasses = computed(() => {
  return [
    'keyboard-button',
    `size-${props.size || 'medium'}`,
    {
      'active': props.active,
      'pressed': pressed.value
    }
  ]
})

const buttonStyles = computed(() => {
  const styles: any = {}
  if (props.color) {
    styles.backgroundColor = props.color
  }
  return styles
})

function handleMouseDown() {
  pressed.value = true
  triggerHaptic()
}

function handleMouseUp() {
  pressed.value = false
}

function handleTouchStart(e: TouchEvent) {
  e.preventDefault()
  pressed.value = true
  triggerHaptic()
}

function handleTouchEnd(e: TouchEvent) {
  e.preventDefault()
  pressed.value = false
  handleClick()
}

function handleClick() {
  const key = props.shifted || props.label
  emit('keypress', {
    code: props.code,
    key: key
  })
}

function triggerHaptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }
}
</script>

<style scoped>
.keyboard-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s ease;
  padding: 0;
  min-height: 40px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* Size variants */
.size-small {
  min-width: 30px;
  font-size: 12px;
}

.size-medium {
  min-width: 40px;
  font-size: 14px;
}

.size-large {
  min-width: 60px;
  font-size: 16px;
}

.size-space {
  min-width: 180px;
  font-size: 14px;
}

/* State styles */
.keyboard-button:hover {
  background: #3a3a3a;
  border-color: #555;
}

.keyboard-button.pressed {
  background: #1a1a1a;
  border-color: #666;
  transform: scale(0.95);
}

.keyboard-button.active {
  background: #0066ff;
  border-color: #4d94ff;
  color: #fff;
  box-shadow: 0 0 0 2px rgba(102, 166, 255, 0.5), inset 0 2px 4px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.key-icon {
  font-size: 18px;
}

.key-label {
  text-transform: uppercase;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .keyboard-button {
    min-height: 44px; /* Touch-friendly minimum height */
    border-radius: 6px; /* Slightly larger radius for mobile */
  }
  
  .size-small {
    min-width: 32px; /* Wider for better touch targets */
    font-size: 12px;
  }
  
  .size-medium {
    min-width: 38px; /* Touch-friendly width */
    font-size: 13px;
  }
  
  .size-large {
    min-width: 56px; /* Wider for modifier keys */
    font-size: 14px;
  }
  
  .size-space {
    min-width: 140px; /* Good space bar size */
    font-size: 14px;
  }
  
  .key-icon {
    font-size: 16px; /* Slightly smaller icons on mobile */
  }
}

/* Prevent text selection on touch */
@media (pointer: coarse) {
  .keyboard-button {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
  }
}
</style>