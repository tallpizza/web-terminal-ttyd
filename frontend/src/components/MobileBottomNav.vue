<template>
  <div v-if="isMobile" class="mobile-bottom-nav">
    <div class="nav-item" @click="toggleKeyboard">
      <v-icon>mdi-keyboard</v-icon>
      <span>Keyboard</span>
    </div>
    
    <div class="nav-item" @click="toggleFullscreen">
      <v-icon>{{ isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
      <span>{{ isFullscreen ? 'Exit' : 'Fullscreen' }}</span>
    </div>
    
    <div class="nav-item" @click="showMoreOptions = true">
      <v-icon>mdi-dots-vertical</v-icon>
      <span>More</span>
    </div>
    
    <div class="nav-item" @click="createNewSession">
      <v-icon>mdi-plus</v-icon>
      <span>New</span>
    </div>
    
    <div class="nav-item" @click="showSessionList = true">
      <v-icon>mdi-view-list</v-icon>
      <span>Sessions</span>
    </div>
    
    <!-- More Options Bottom Sheet -->
    <v-bottom-sheet v-model="showMoreOptions">
      <v-card>
        <v-card-title>Options</v-card-title>
        <v-list>
          <v-list-item @click="showThemeSelector = true">
            <template v-slot:prepend>
              <v-icon>mdi-palette</v-icon>
            </template>
            <v-list-item-title>Change Theme</v-list-item-title>
          </v-list-item>
          
          <v-list-item @click="refreshTerminal">
            <template v-slot:prepend>
              <v-icon>mdi-refresh</v-icon>
            </template>
            <v-list-item-title>Refresh Terminal</v-list-item-title>
          </v-list-item>
          
          <v-list-item @click="showFontSizeDialog = true">
            <template v-slot:prepend>
              <v-icon>mdi-format-size</v-icon>
            </template>
            <v-list-item-title>Font Size</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-bottom-sheet>
    
    <!-- Session List Bottom Sheet -->
    <v-bottom-sheet v-model="showSessionList">
      <v-card>
        <v-card-title>Sessions</v-card-title>
        <v-list>
          <v-list-item
            v-for="session in sessions"
            :key="session.id"
            @click="switchSession(session.id)"
            :active="session.id === activeSessionId"
          >
            <v-list-item-title>{{ session.name }}</v-list-item-title>
            <template v-slot:append>
              <v-btn
                icon
                size="small"
                @click.stop="closeSession(session.id)"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-bottom-sheet>
    
    <!-- Font Size Dialog -->
    <v-dialog v-model="showFontSizeDialog" max-width="300">
      <v-card>
        <v-card-title>Font Size</v-card-title>
        <v-card-text>
          <v-slider
            v-model="fontSize"
            :min="10"
            :max="24"
            :step="2"
            thumb-label
            @update:modelValue="updateFontSize"
          >
            <template v-slot:append>
              <span>{{ fontSize }}px</span>
            </template>
          </v-slider>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showFontSizeDialog = false">Done</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
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
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showThemeSelector = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSessionStore } from '../stores/sessions'
import { useSettingsStore } from '../stores/settings'

const emit = defineEmits<{
  'toggle-keyboard': []
  'toggle-fullscreen': []
  'theme-change': [theme: any]
  'font-size-change': [size: number]
}>()

const sessionStore = useSessionStore()
const settingsStore = useSettingsStore()

const showMoreOptions = ref(false)
const showSessionList = ref(false)
const showFontSizeDialog = ref(false)
const showThemeSelector = ref(false)
const isFullscreen = ref(false)
const fontSize = ref(14)
const currentTheme = ref('monokai')

const sessions = computed(() => sessionStore.sessions)
const activeSessionId = computed(() => sessionStore.activeSessionId)

const isMobile = computed(() => {
  return window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0
})

const terminalThemes = [
  { id: 'monokai', name: 'Monokai', description: 'Dark theme with vibrant colors' },
  { id: 'solarized-dark', name: 'Solarized Dark', description: 'Popular dark theme' },
  { id: 'solarized-light', name: 'Solarized Light', description: 'Light theme' },
  { id: 'dracula', name: 'Dracula', description: 'Dark theme with purple accents' },
  { id: 'gruvbox', name: 'Gruvbox', description: 'Retro groove dark theme' },
  { id: 'nord', name: 'Nord', description: 'Arctic, north-bluish theme' }
]

function toggleKeyboard() {
  emit('toggle-keyboard')
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
  emit('toggle-fullscreen')
}

function createNewSession() {
  sessionStore.createSession()
  showSessionList.value = false
}

function switchSession(id: string) {
  sessionStore.switchSession(id)
  showSessionList.value = false
}

function closeSession(id: string) {
  if (confirm('Close this session?')) {
    sessionStore.closeSession(id)
  }
}

function refreshTerminal() {
  if (activeSessionId.value) {
    sessionStore.reloadSession(activeSessionId.value)
  }
  showMoreOptions.value = false
}

function selectTheme(theme: any) {
  currentTheme.value = theme.id
  settingsStore.setSetting('appearance', 'terminalTheme', theme.id)
  emit('theme-change', theme)
  showThemeSelector.value = false
}

function updateFontSize(size: number) {
  settingsStore.setSetting('appearance', 'fontSize', size)
  emit('font-size-change', size)
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', () => {
  isFullscreen.value = !!document.fullscreenElement
})
</script>

<style scoped>
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--v-theme-surface);
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 100;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;
  transition: background-color 0.2s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.nav-item:active {
  background-color: rgba(0, 0, 0, 0.1);
}

.nav-item .v-icon {
  font-size: 20px;
  margin-bottom: 2px;
}

.nav-item span {
  font-size: 10px;
  margin-top: 2px;
}

@media (min-width: 768px) {
  .mobile-bottom-nav {
    display: none;
  }
}
</style>