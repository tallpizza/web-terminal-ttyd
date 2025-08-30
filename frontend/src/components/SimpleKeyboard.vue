<template>
  <div class="simple-keyboard">
    <div class="keyboard-container">
      <!-- Control Keys -->
      <div class="keyboard-row">
        <button @click="sendKey('Escape')" class="key-button">ESC</button>
        <button @click="sendKey('Tab')" class="key-button">TAB</button>
        <button 
          @click="toggleModifier('ctrl')" 
          :class="['key-button', { active: modifiers.ctrl }]"
        >CTRL</button>
        <button 
          @click="toggleModifier('alt')" 
          :class="['key-button', { active: modifiers.alt }]"
        >ALT</button>
        <button @click="sendKey('Enter')" class="key-button">ENTER</button>
      </div>

      <!-- Arrow Keys -->
      <div class="keyboard-row arrow-section">
        <div class="arrow-cluster">
          <button @click="sendKey('ArrowUp')" class="key-button arrow">↑</button>
          <div class="arrow-bottom">
            <button @click="sendKey('ArrowLeft')" class="key-button arrow">←</button>
            <button @click="sendKey('ArrowDown')" class="key-button arrow">↓</button>
            <button @click="sendKey('ArrowRight')" class="key-button arrow">→</button>
          </div>
        </div>
        <div class="nav-keys">
          <button @click="sendKey('Home')" class="key-button small">Home</button>
          <button @click="sendKey('End')" class="key-button small">End</button>
          <button @click="sendKey('PageUp')" class="key-button small">PgUp</button>
          <button @click="sendKey('PageDown')" class="key-button small">PgDn</button>
        </div>
      </div>

      <!-- Function Keys -->
      <div class="keyboard-row">
        <button 
          v-for="i in 12" 
          :key="`f${i}`"
          @click="sendKey(`F${i}`)" 
          class="key-button fn-key"
        >F{{ i }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['key-press'])

const modifiers = ref({
  ctrl: false,
  alt: false,
  shift: false
})

function toggleModifier(modifier: 'ctrl' | 'alt' | 'shift') {
  modifiers.value[modifier] = !modifiers.value[modifier]
}

function sendKey(key: string) {
  // Create keyboard event-like object
  const eventData = {
    key: key,
    code: key,
    ctrlKey: modifiers.value.ctrl,
    altKey: modifiers.value.alt,
    shiftKey: modifiers.value.shift,
    metaKey: false
  }

  // Send through parent component
  emit('key-press', eventData)

  // Reset modifiers after sending key with modifier
  if (modifiers.value.ctrl || modifiers.value.alt) {
    setTimeout(() => {
      modifiers.value.ctrl = false
      modifiers.value.alt = false
    }, 100)
  }
}
</script>

<style scoped>
.simple-keyboard {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid #444;
  padding: 8px;
  z-index: 1000;
}

.keyboard-container {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
}

.key-button {
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #444;
  padding: 8px 12px;
  min-width: 45px;
  height: 40px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.key-button:hover {
  background: #3a3a3a;
  transform: translateY(-1px);
}

.key-button:active {
  background: #4a4a4a;
  transform: translateY(0);
}

.key-button.active {
  background: #007acc;
  border-color: #0098ff;
}

.key-button.arrow {
  width: 40px;
  height: 40px;
  padding: 0;
  font-size: 18px;
}

.key-button.small {
  font-size: 10px;
  padding: 8px 8px;
  min-width: 35px;
}

.key-button.fn-key {
  min-width: 35px;
  padding: 8px 6px;
  font-size: 10px;
}

.arrow-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.arrow-cluster {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.arrow-bottom {
  display: flex;
  gap: 2px;
}

.nav-keys {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

@media (max-width: 768px) {
  .simple-keyboard {
    padding: 4px;
  }

  .key-button {
    min-width: 35px;
    height: 35px;
    padding: 4px 8px;
    font-size: 11px;
  }

  .key-button.fn-key {
    min-width: 28px;
    padding: 4px;
    font-size: 9px;
  }
}
</style>