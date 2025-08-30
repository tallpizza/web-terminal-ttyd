<template>
  <div class="keyboard-view">
    <div class="header">
      <h1>Virtual Keyboard</h1>
      <p>Customize your virtual keyboard shortcuts and layout</p>
    </div>

    <div class="keyboard-container">
      <VirtualKeyboard 
        :show-editor="true"
        @key-press="handleKeyPress"
      />
    </div>

    <div class="shortcuts-editor">
      <ShortcutEditor />
    </div>
  </div>
</template>

<script setup lang="ts">
import VirtualKeyboard from '../components/VirtualKeyboard.vue'
import ShortcutEditor from '../components/ShortcutEditor.vue'

function handleKeyPress(event: any) {
  console.log('Key pressed:', event)
}
</script>

<style scoped>
.keyboard-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  color: #333;
  margin-bottom: 0.5rem;
}

.header p {
  color: #666;
}

.keyboard-container {
  margin-bottom: 3rem;
}

.shortcuts-editor {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>