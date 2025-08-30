import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Shortcut {
  id: string
  label: string
  code: string
  keys: string[]
  color?: string
  icon?: string
  size?: 'small' | 'medium' | 'large'
  group?: string
  enabled: boolean
}

export interface ShortcutGroup {
  id: string
  name: string
  icon?: string
  enabled: boolean
  shortcuts: string[] // shortcut IDs
}

export const useShortcutsStore = defineStore('shortcuts', () => {
  const shortcuts = ref<Map<string, Shortcut>>(new Map())
  const groups = ref<Map<string, ShortcutGroup>>(new Map())
  const activeGroupId = ref<string | null>(null)

  // Default shortcuts
  const defaultShortcuts: Shortcut[] = [
    {
      id: 'copy',
      label: 'Copy',
      code: 'Ctrl+C',
      keys: ['Control', 'KeyC'],
      icon: '📋',
      enabled: true
    },
    {
      id: 'paste',
      label: 'Paste',
      code: 'Ctrl+V',
      keys: ['Control', 'KeyV'],
      icon: '📌',
      enabled: true
    },
    {
      id: 'cut',
      label: 'Cut',
      code: 'Ctrl+X',
      keys: ['Control', 'KeyX'],
      icon: '✂️',
      enabled: true
    },
    {
      id: 'undo',
      label: 'Undo',
      code: 'Ctrl+Z',
      keys: ['Control', 'KeyZ'],
      icon: '↩️',
      enabled: true
    },
    {
      id: 'redo',
      label: 'Redo',
      code: 'Ctrl+Shift+Z',
      keys: ['Control', 'Shift', 'KeyZ'],
      icon: '↪️',
      enabled: true
    },
    {
      id: 'save',
      label: 'Save',
      code: 'Ctrl+S',
      keys: ['Control', 'KeyS'],
      icon: '💾',
      enabled: true
    },
    {
      id: 'find',
      label: 'Find',
      code: 'Ctrl+F',
      keys: ['Control', 'KeyF'],
      icon: '🔍',
      enabled: true
    },
    {
      id: 'escape',
      label: 'ESC',
      code: 'Escape',
      keys: ['Escape'],
      color: '#ff6b6b',
      enabled: true
    }
  ]

  // Default preset groups
  const presetGroups = {
    basic: {
      id: 'basic',
      name: 'Basic',
      icon: '⌨️',
      enabled: true,
      shortcuts: ['copy', 'paste', 'cut', 'undo', 'redo', 'save', 'find', 'escape']
    },
    navigation: {
      id: 'navigation',
      name: 'Navigation',
      icon: '🧭',
      enabled: false,
      shortcuts: []
    },
    vim: {
      id: 'vim',
      name: 'Vim',
      icon: '📝',
      enabled: false,
      shortcuts: []
    },
    git: {
      id: 'git',
      name: 'Git',
      icon: '🔀',
      enabled: false,
      shortcuts: []
    },
    docker: {
      id: 'docker',
      name: 'Docker',
      icon: '🐳',
      enabled: false,
      shortcuts: []
    }
  }

  // Initialize with defaults
  function initializeDefaults() {
    defaultShortcuts.forEach(shortcut => {
      shortcuts.value.set(shortcut.id, shortcut)
    })
    
    Object.values(presetGroups).forEach(group => {
      groups.value.set(group.id, group)
    })
    
    // Load Vim shortcuts
    const vimShortcuts: Shortcut[] = [
      { id: 'vim-save', label: ':w', code: ':w', keys: ['Semicolon', 'KeyW'], enabled: true },
      { id: 'vim-quit', label: ':q', code: ':q', keys: ['Semicolon', 'KeyQ'], enabled: true },
      { id: 'vim-save-quit', label: ':wq', code: ':wq', keys: ['Semicolon', 'KeyW', 'KeyQ'], enabled: true },
      { id: 'vim-insert', label: 'i', code: 'i', keys: ['KeyI'], enabled: true },
      { id: 'vim-visual', label: 'v', code: 'v', keys: ['KeyV'], enabled: true },
      { id: 'vim-delete-line', label: 'dd', code: 'dd', keys: ['KeyD', 'KeyD'], enabled: true }
    ]
    
    vimShortcuts.forEach(shortcut => {
      shortcuts.value.set(shortcut.id, shortcut)
      const vimGroup = groups.value.get('vim')
      if (vimGroup) {
        vimGroup.shortcuts.push(shortcut.id)
      }
    })
    
    // Load Navigation shortcuts
    const navShortcuts: Shortcut[] = [
      { id: 'nav-up', label: '↑', code: '', keys: ['ArrowUp'], icon: '⬆️', enabled: true },
      { id: 'nav-down', label: '↓', code: '', keys: ['ArrowDown'], icon: '⬇️', enabled: true },
      { id: 'nav-left', label: '←', code: '', keys: ['ArrowLeft'], icon: '⬅️', enabled: true },
      { id: 'nav-right', label: '→', code: '', keys: ['ArrowRight'], icon: '➡️', enabled: true },
      { id: 'nav-home', label: 'Home', code: '', keys: ['Home'], icon: '🏠', enabled: true },
      { id: 'nav-end', label: 'End', code: '', keys: ['End'], icon: '🔚', enabled: true },
      { id: 'nav-pgup', label: 'PgUp', code: '', keys: ['PageUp'], icon: '⏫', enabled: true },
      { id: 'nav-pgdn', label: 'PgDn', code: '', keys: ['PageDown'], icon: '⏬', enabled: true }
    ]
    
    navShortcuts.forEach(shortcut => {
      shortcuts.value.set(shortcut.id, shortcut)
      const navGroup = groups.value.get('navigation')
      if (navGroup) {
        navGroup.shortcuts.push(shortcut.id)
      }
    })
    
    // Load Git shortcuts
    const gitShortcuts: Shortcut[] = [
      { id: 'git-status', label: 'status', code: 'git status', keys: [], icon: '📊', enabled: true },
      { id: 'git-add', label: 'add .', code: 'git add .', keys: [], icon: '➕', enabled: true },
      { id: 'git-commit', label: 'commit', code: 'git commit -m ""', keys: [], icon: '💾', enabled: true },
      { id: 'git-push', label: 'push', code: 'git push', keys: [], icon: '📤', enabled: true },
      { id: 'git-pull', label: 'pull', code: 'git pull', keys: [], icon: '📥', enabled: true }
    ]
    
    gitShortcuts.forEach(shortcut => {
      shortcuts.value.set(shortcut.id, shortcut)
      const gitGroup = groups.value.get('git')
      if (gitGroup) {
        gitGroup.shortcuts.push(shortcut.id)
      }
    })
    
    // Load Docker shortcuts
    const dockerShortcuts: Shortcut[] = [
      { id: 'docker-ps', label: 'ps', code: 'docker ps', keys: [], icon: '📋', enabled: true },
      { id: 'docker-ps-a', label: 'ps -a', code: 'docker ps -a', keys: [], icon: '📜', enabled: true },
      { id: 'docker-logs', label: 'logs', code: 'docker logs -f ', keys: [], icon: '📝', enabled: true },
      { id: 'docker-exec', label: 'exec', code: 'docker exec -it ', keys: [], icon: '💻', enabled: true },
      { id: 'docker-stop', label: 'stop', code: 'docker stop ', keys: [], icon: '🛑', enabled: true },
      { id: 'docker-start', label: 'start', code: 'docker start ', keys: [], icon: '▶️', enabled: true },
      { id: 'docker-rm', label: 'rm', code: 'docker rm ', keys: [], icon: '🗑️', enabled: true },
      { id: 'docker-images', label: 'images', code: 'docker images', keys: [], icon: '📦', enabled: true }
    ]
    
    dockerShortcuts.forEach(shortcut => {
      shortcuts.value.set(shortcut.id, shortcut)
      const dockerGroup = groups.value.get('docker')
      if (dockerGroup) {
        dockerGroup.shortcuts.push(shortcut.id)
      }
    })
  }

  // Computed
  const activeShortcuts = computed(() => {
    const active: Shortcut[] = []
    
    groups.value.forEach(group => {
      if (group.enabled) {
        group.shortcuts.forEach(shortcutId => {
          const shortcut = shortcuts.value.get(shortcutId)
          if (shortcut && shortcut.enabled) {
            active.push(shortcut)
          }
        })
      }
    })
    
    return active
  })

  const activeGroup = computed(() => {
    if (!activeGroupId.value) return null
    return groups.value.get(activeGroupId.value) || null
  })

  // Actions
  function addShortcut(shortcut: Omit<Shortcut, 'id'>) {
    const id = generateId()
    const newShortcut: Shortcut = {
      ...shortcut,
      id
    }
    shortcuts.value.set(id, newShortcut)
    
    if (shortcut.group) {
      const group = groups.value.get(shortcut.group)
      if (group) {
        group.shortcuts.push(id)
      }
    }
    
    saveToStorage()
    return id
  }

  function updateShortcut(id: string, updates: Partial<Shortcut>) {
    const shortcut = shortcuts.value.get(id)
    if (shortcut) {
      Object.assign(shortcut, updates)
      saveToStorage()
    }
  }

  function deleteShortcut(id: string) {
    shortcuts.value.delete(id)
    
    // Remove from groups
    groups.value.forEach(group => {
      const index = group.shortcuts.indexOf(id)
      if (index > -1) {
        group.shortcuts.splice(index, 1)
      }
    })
    
    saveToStorage()
  }

  function createGroup(name: string, icon?: string) {
    const id = generateId()
    const newGroup: ShortcutGroup = {
      id,
      name,
      icon,
      enabled: true,
      shortcuts: []
    }
    groups.value.set(id, newGroup)
    saveToStorage()
    return id
  }

  function toggleGroup(id: string) {
    const group = groups.value.get(id)
    if (group) {
      group.enabled = !group.enabled
      saveToStorage()
    }
  }

  function importShortcuts(data: any) {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data
      
      if (parsed.shortcuts) {
        parsed.shortcuts.forEach((shortcut: Shortcut) => {
          shortcuts.value.set(shortcut.id, shortcut)
        })
      }
      
      if (parsed.groups) {
        parsed.groups.forEach((group: ShortcutGroup) => {
          groups.value.set(group.id, group)
        })
      }
      
      saveToStorage()
      return true
    } catch (error) {
      console.error('Failed to import shortcuts:', error)
      return false
    }
  }

  function exportShortcuts() {
    return JSON.stringify({
      shortcuts: Array.from(shortcuts.value.values()),
      groups: Array.from(groups.value.values())
    }, null, 2)
  }

  function resetToDefaults() {
    shortcuts.value.clear()
    groups.value.clear()
    initializeDefaults()
    saveToStorage()
  }

  // Storage
  function saveToStorage() {
    try {
      localStorage.setItem('keyboard-shortcuts', JSON.stringify({
        shortcuts: Array.from(shortcuts.value.entries()),
        groups: Array.from(groups.value.entries())
      }))
    } catch (error) {
      console.error('Failed to save shortcuts:', error)
    }
  }

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem('keyboard-shortcuts')
      if (stored) {
        const data = JSON.parse(stored)
        if (data.shortcuts) {
          shortcuts.value = new Map(data.shortcuts)
        }
        if (data.groups) {
          groups.value = new Map(data.groups)
        }
      } else {
        initializeDefaults()
      }
    } catch (error) {
      console.error('Failed to load shortcuts:', error)
      initializeDefaults()
    }
  }

  // Utilities
  function generateId() {
    return Math.random().toString(36).substr(2, 9)
  }

  // Initialize on store creation
  loadFromStorage()

  return {
    shortcuts,
    groups,
    activeGroupId,
    activeShortcuts,
    activeGroup,
    addShortcut,
    updateShortcut,
    deleteShortcut,
    createGroup,
    toggleGroup,
    importShortcuts,
    exportShortcuts,
    resetToDefaults,
    initializeDefaults
  }
})