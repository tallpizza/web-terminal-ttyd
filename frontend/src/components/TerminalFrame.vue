<template>
  <div class="terminal-frame" ref="terminalContainer" :class="{ 'fullscreen': isFullscreen }">
    <div class="terminal-toolbar" :class="{ 'mobile-toolbar': isMobile }" v-if="!isMobile">
      <v-btn-group :density="'compact'" variant="outlined">
        <v-btn 
          @click="toggleFullscreen" 
          :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
          size="small"
        >
          <v-tooltip activator="parent" location="bottom">
            {{ isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}
          </v-tooltip>
        </v-btn>
        
        <v-btn 
          @click="showThemeSelector = true" 
          icon="mdi-palette"
          size="small"
        >
          <v-tooltip activator="parent" location="bottom">Theme</v-tooltip>
        </v-btn>
        
        <v-btn 
          @click="decreaseFontSize" 
          icon="mdi-minus" 
          :disabled="fontSize <= 10"
          size="small"
        >
          <v-tooltip activator="parent" location="bottom">Decrease Font</v-tooltip>
        </v-btn>
        
        <v-chip size="small" class="mx-1">{{ fontSize }}px</v-chip>
        
        <v-btn 
          @click="increaseFontSize" 
          icon="mdi-plus" 
          :disabled="fontSize >= 24"
          size="small"
        >
          <v-tooltip activator="parent" location="bottom">Increase Font</v-tooltip>
        </v-btn>
        
        <v-btn 
          @click="refreshTerminal" 
          icon="mdi-refresh"
          size="small"
        >
          <v-tooltip activator="parent" location="bottom">Refresh</v-tooltip>
        </v-btn>
      </v-btn-group>
      
      <v-spacer />
      
      <v-chip size="small" :color="connectionColor">
        {{ session?.name || 'No Session' }}
      </v-chip>
    </div>
    
    <!-- Mobile-only minimal header -->
    <div class="mobile-header" v-if="isMobile">
      <v-chip size="small" :color="connectionColor">
        {{ session?.name || 'No Session' }}
      </v-chip>
    </div>
    
    <iframe
      v-if="sessionUrl && session"
      :src="sessionUrl"
      :key="session.id"
      class="gotty-iframe"
      :class="{ [`theme-${currentTheme}`]: true }"
      :style="iframeStyle"
      @load="onIframeLoad"
      allow="clipboard-write"
      frameborder="0"
    />
    
    <div v-else class="no-session">
      <v-icon size="64" color="grey">mdi-console</v-icon>
      <p>No session selected</p>
      <v-btn color="primary" @click="createNewSession">
        Create New Session
      </v-btn>
    </div>
    
    <!-- Touch keyboard toggle for mobile -->
    <v-btn 
      v-if="isMobile && !showKeyboard"
      class="keyboard-toggle"
      fab
      color="primary"
      @click="toggleKeyboard"
      icon="mdi-keyboard"
    >
      <v-tooltip activator="parent" location="top">Show Keyboard</v-tooltip>
    </v-btn>
    
    <!-- Virtual Keyboard (implemented) -->
    <VirtualKeyboard 
      v-if="showKeyboard" 
      @keypress="handleKeyPress"
      @close="showKeyboard = false"
    />
    
    <!-- Theme Selector Dialog -->
    <v-dialog v-model="showThemeSelector" max-width="500">
      <v-card>
        <v-card-title>Select Terminal Theme</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="theme in terminalThemes"
              :key="theme.id"
              @click="selectTheme(theme)"
              :active="currentTheme === theme.id"
            >
              <v-list-item-title>{{ theme.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ theme.description }}</v-list-item-subtitle>
              <template v-slot:append>
                <v-icon v-if="currentTheme === theme.id" color="primary">
                  mdi-check
                </v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showThemeSelector = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Mobile Bottom Navigation -->
    <MobileBottomNav 
      @toggle-keyboard="toggleKeyboard"
      @toggle-fullscreen="toggleFullscreen"
      @theme-change="selectTheme"
      @font-size-change="(size) => { fontSize = size; applyFontSize() }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useSessionStore, type Session } from '../stores/sessions'
import { useSettingsStore } from '../stores/settings'
import { useTouchGestures } from '../composables/useTouchGestures'
import VirtualKeyboard from './VirtualKeyboard.vue'
import MobileBottomNav from './MobileBottomNav.vue'

const props = defineProps<{
  session: Session | null
}>()

const store = useSessionStore()
const settingsStore = useSettingsStore()
const terminalContainer = ref<HTMLElement>()
const showKeyboard = ref(false)
const showThemeSelector = ref(false)
const currentScale = ref(1)
const isFullscreen = ref(false)
const fontSize = ref(14)
const currentTheme = ref('monokai')

const terminalThemes = [
  { id: 'monokai', name: 'Monokai', description: 'Dark theme with vibrant colors' },
  { id: 'solarized-dark', name: 'Solarized Dark', description: 'Popular dark theme' },
  { id: 'solarized-light', name: 'Solarized Light', description: 'Light theme with good contrast' },
  { id: 'dracula', name: 'Dracula', description: 'Dark theme with purple accents' },
  { id: 'gruvbox', name: 'Gruvbox', description: 'Retro groove dark theme' },
  { id: 'nord', name: 'Nord', description: 'Arctic, north-bluish theme' },
  { id: 'one-dark', name: 'One Dark', description: 'Atom One Dark theme' },
  { id: 'material', name: 'Material', description: 'Material Design theme' },
  { id: 'tomorrow-night', name: 'Tomorrow Night', description: 'Tomorrow Night theme' },
  { id: 'ayu', name: 'Ayu', description: 'Modern theme with vibrant colors' },
  { id: 'tokyo-night', name: 'Tokyo Night', description: 'Clean, dark theme' },
  { id: 'catppuccin', name: 'Catppuccin', description: 'Soothing pastel theme' }
]

const sessionUrl = computed(() => {
  if (!props.session) return ''
  return store.getSessionUrl(props.session.id)
})

const isMobile = computed(() => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
})

const connectionColor = computed(() => {
  if (!props.session) return 'grey'
  return props.session.status === 'active' ? 'success' : 'error'
})

const iframeStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  transform: `scale(${currentScale.value})`,
  transformOrigin: 'top left'
}))

function onIframeLoad() {
  console.log('Terminal iframe loaded for session:', props.session?.id)
  setupTouchGestures()
  // Wait a bit for iframe content to be ready
  setTimeout(() => {
    applyThemeToTerminal()
    applyFontSize()
  }, 1000)
}

function createNewSession() {
  store.createSession()
}

function toggleKeyboard() {
  showKeyboard.value = !showKeyboard.value
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    terminalContainer.value?.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

function increaseFontSize() {
  if (fontSize.value < 24) {
    fontSize.value += 2
    settingsStore.setSetting('appearance', 'fontSize', fontSize.value)
    applyFontSize()
  }
}

function decreaseFontSize() {
  if (fontSize.value > 10) {
    fontSize.value -= 2
    settingsStore.setSetting('appearance', 'fontSize', fontSize.value)
    applyFontSize()
  }
}

function selectTheme(theme: any) {
  currentTheme.value = theme.id
  settingsStore.setSetting('appearance', 'terminalTheme', theme.id)
  applyThemeToTerminal()
  showThemeSelector.value = false
}

function applyFontSize() {
  // Apply font size to the iframe content
  const iframe = terminalContainer.value?.querySelector('iframe') as HTMLIFrameElement
  if (iframe && iframe.contentDocument) {
    const style = iframe.contentDocument.createElement('style')
    style.textContent = `.terminal { font-size: ${fontSize.value}px !important; }`
    iframe.contentDocument.head.appendChild(style)
  }
}

function applyThemeToTerminal() {
  // Apply theme to the iframe content
  const iframe = terminalContainer.value?.querySelector('iframe') as HTMLIFrameElement
  if (iframe && iframe.contentDocument) {
    // Apply full width styles to GoTTY terminal
    let style = iframe.contentDocument.querySelector('#terminal-width-style')
    if (!style) {
      style = iframe.contentDocument.createElement('style')
      style.id = 'terminal-width-style'
      iframe.contentDocument.head.appendChild(style)
    }
    style.textContent = `
      body { 
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
        background: #000 !important;
      }
      .terminal, #terminal { 
        width: 100% !important; 
        height: 100% !important;
        margin: 0 !important;
        padding: 8px !important;
        background: #000 !important;
        font-family: 'Menlo', 'Monaco', 'Courier New', monospace !important;
        font-size: 14px !important;
        line-height: 1.2 !important;
      }
      .xterm, .xterm-screen { 
        width: 100% !important; 
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .xterm-viewport {
        width: 100% !important;
        overflow-y: auto !important;
      }
      .xterm-rows {
        width: 100% !important;
      }
      .xterm-cursor {
        background: #fff !important;
      }
    `
    
    // Force resize terminal
    const terminal = iframe.contentDocument.querySelector('.terminal, #terminal')
    if (terminal) {
      (terminal as HTMLElement).style.width = '100vw'
      ;(terminal as HTMLElement).style.maxWidth = '100vw'
      ;(terminal as HTMLElement).style.margin = '0'
      ;(terminal as HTMLElement).style.padding = '0'
    }
    
    console.log('Applied theme and full width styles:', currentTheme.value)
  }
}

function refreshTerminal() {
  if (props.session) {
    store.reloadSession(props.session.id)
  }
}

function handleKeyPress(event: KeyboardEvent) {
  // Send key press to the terminal iframe
  const iframe = terminalContainer.value?.querySelector('iframe') as HTMLIFrameElement
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({
      type: 'keyboard-input',
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey
    }, '*')
  }
}

// Touch gesture support
const touchGestures = useTouchGestures({
  onPinch: (scale) => {
    const iframe = terminalContainer.value?.querySelector('iframe')
    if (iframe) {
      currentScale.value = Math.min(Math.max(0.5, currentScale.value * scale), 3)
    }
  },
  onDoubleTap: () => {
    currentScale.value = 1
  },
  onLongPress: (event) => {
    // Show context menu on long press
    showContextMenu(event)
  },
  onPullToRefresh: async () => {
    // Reload the session
    if (props.session) {
      await store.reloadSession(props.session.id)
    }
  }
})

function setupTouchGestures() {
  if (!terminalContainer.value || !isMobile.value) return
  touchGestures.setup(terminalContainer.value)
}

function showContextMenu(event: TouchEvent) {
  // Context menu implementation would go here
  console.log('Long press detected - would show context menu')
}

// Watch for session changes
watch(() => props.session, () => {
  if (props.session) {
    // Reset zoom when switching sessions
    currentScale.value = 1
  }
})

// Handle window resize
function handleResize() {
  // Force iframe to resize
  const iframe = terminalContainer.value?.querySelector('iframe')
  if (iframe) {
    iframe.style.height = '0'
    setTimeout(() => {
      iframe.style.height = '100%'
    }, 0)
  }
}

// Load settings
onMounted(() => {
  window.addEventListener('resize', handleResize)
  setupTouchGestures()
  
  // Load saved settings
  fontSize.value = settingsStore.getSetting('appearance', 'fontSize')
  currentTheme.value = settingsStore.getSetting('appearance', 'terminalTheme')
  
  // Handle fullscreen changes
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.terminal-frame {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.terminal-frame.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.terminal-toolbar {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: var(--v-theme-surface);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.mobile-toolbar {
  padding: 0.2rem;
  min-height: 48px; /* Reduced mobile toolbar height */
}

.mobile-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  background: var(--v-theme-surface);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  min-height: 32px;
}

/* Ensure all touch targets are at least 44x44px on mobile */
@media (max-width: 768px) {
  .terminal-toolbar :deep(.v-btn) {
    min-width: 44px !important;
    min-height: 44px !important;
  }
  
  .terminal-toolbar :deep(.v-chip) {
    min-height: 32px !important;
    font-size: 14px !important;
  }
}

.gotty-iframe {
  width: 100%;
  flex: 1;
  border: none;
  background: #000;
  box-sizing: border-box;
}

/* Mobile optimizations for better terminal height */
@media (max-width: 768px) {
  .terminal-frame {
    height: 100vh;
  }
}

.no-session {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 18px;
  gap: 1rem;
}

.keyboard-toggle {
  position: absolute !important;
  bottom: 20px;
  right: 20px;
  z-index: 100;
}

/* Terminal themes */
.theme-monokai {
  filter: sepia(0.2) hue-rotate(60deg);
}

.theme-solarized-dark {
  filter: sepia(0.3) hue-rotate(180deg);
}

.theme-dracula {
  filter: hue-rotate(250deg) saturate(1.2);
}

.theme-gruvbox {
  filter: sepia(0.4) hue-rotate(30deg);
}

.theme-nord {
  filter: hue-rotate(200deg) brightness(1.1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .keyboard-toggle {
    bottom: 10px;
    right: 10px;
  }
  
  .terminal-toolbar {
    padding: 0.25rem;
  }
}
</style>