import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useShortcutsStore } from './shortcuts'

describe('Shortcuts Store', () => {
  beforeEach(() => {
    // Create a fresh pinia instance before each test
    setActivePinia(createPinia())
    
    // Clear localStorage mock
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('State', () => {
    it('should initialize with default shortcuts', () => {
      const store = useShortcutsStore()
      
      expect(store.shortcuts.length).toBeGreaterThan(0)
      expect(store.groups.length).toBeGreaterThan(0)
      expect(store.isRecording).toBe(false)
      expect(store.recordedKeys).toEqual([])
    })

    it('should have basic shortcuts by default', () => {
      const store = useShortcutsStore()
      
      const copyShortcut = store.shortcuts.find(s => s.label === 'Copy')
      expect(copyShortcut).toBeDefined()
      expect(copyShortcut?.keys).toContain('Ctrl')
      expect(copyShortcut?.keys).toContain('C')
      
      const pasteShortcut = store.shortcuts.find(s => s.label === 'Paste')
      expect(pasteShortcut).toBeDefined()
    })
  })

  describe('Actions', () => {
    describe('addShortcut', () => {
      it('should add a new shortcut', () => {
        const store = useShortcutsStore()
        const initialCount = store.shortcuts.length
        
        const newShortcut = {
          id: 'test-1',
          label: 'Test Shortcut',
          code: 'Ctrl+T',
          keys: ['Ctrl', 'T'],
          enabled: true
        }
        
        store.addShortcut(newShortcut)
        
        expect(store.shortcuts.length).toBe(initialCount + 1)
        expect(store.shortcuts).toContainEqual(newShortcut)
      })

      it('should save to localStorage', () => {
        const store = useShortcutsStore()
        
        const newShortcut = {
          id: 'test-2',
          label: 'Test Save',
          code: 'Alt+S',
          keys: ['Alt', 'S'],
          enabled: true
        }
        
        store.addShortcut(newShortcut)
        
        expect(localStorage.setItem).toHaveBeenCalled()
      })
    })

    describe('updateShortcut', () => {
      it('should update an existing shortcut', () => {
        const store = useShortcutsStore()
        
        const shortcut = store.shortcuts[0]
        const originalLabel = shortcut.label
        
        store.updateShortcut(shortcut.id, { label: 'Updated Label' })
        
        const updatedShortcut = store.shortcuts.find(s => s.id === shortcut.id)
        expect(updatedShortcut?.label).toBe('Updated Label')
        expect(updatedShortcut?.code).toBe(shortcut.code) // Other props unchanged
      })

      it('should not update non-existent shortcut', () => {
        const store = useShortcutsStore()
        const originalLength = store.shortcuts.length
        
        store.updateShortcut('non-existent', { label: 'Test' })
        
        expect(store.shortcuts.length).toBe(originalLength)
      })
    })

    describe('deleteShortcut', () => {
      it('should delete a shortcut', () => {
        const store = useShortcutsStore()
        
        const shortcutToDelete = store.shortcuts[0]
        const initialCount = store.shortcuts.length
        
        store.deleteShortcut(shortcutToDelete.id)
        
        expect(store.shortcuts.length).toBe(initialCount - 1)
        expect(store.shortcuts).not.toContainEqual(shortcutToDelete)
      })
    })

    describe('toggleShortcut', () => {
      it('should toggle shortcut enabled state', () => {
        const store = useShortcutsStore()
        
        const shortcut = store.shortcuts[0]
        const originalState = shortcut.enabled
        
        store.toggleShortcut(shortcut.id)
        
        const updated = store.shortcuts.find(s => s.id === shortcut.id)
        expect(updated?.enabled).toBe(!originalState)
      })
    })

    describe('recording', () => {
      it('should start and stop recording', () => {
        const store = useShortcutsStore()
        
        expect(store.isRecording).toBe(false)
        
        store.startRecording()
        expect(store.isRecording).toBe(true)
        expect(store.recordedKeys).toEqual([])
        
        store.stopRecording()
        expect(store.isRecording).toBe(false)
      })

      it('should add keys during recording', () => {
        const store = useShortcutsStore()
        
        store.startRecording()
        store.addRecordedKey('Ctrl')
        store.addRecordedKey('Shift')
        store.addRecordedKey('T')
        
        expect(store.recordedKeys).toEqual(['Ctrl', 'Shift', 'T'])
      })

      it('should not add duplicate keys', () => {
        const store = useShortcutsStore()
        
        store.startRecording()
        store.addRecordedKey('Ctrl')
        store.addRecordedKey('Ctrl') // Duplicate
        store.addRecordedKey('T')
        
        expect(store.recordedKeys).toEqual(['Ctrl', 'T'])
      })

      it('should clear recorded keys when starting new recording', () => {
        const store = useShortcutsStore()
        
        store.startRecording()
        store.addRecordedKey('Ctrl')
        store.addRecordedKey('A')
        
        store.startRecording() // Start new recording
        
        expect(store.recordedKeys).toEqual([])
      })
    })

    describe('groups', () => {
      it('should add a new group', () => {
        const store = useShortcutsStore()
        const initialCount = store.groups.length
        
        const newGroup = {
          id: 'test-group',
          name: 'Test Group',
          icon: '🧪',
          shortcuts: [],
          enabled: true
        }
        
        store.addGroup(newGroup)
        
        expect(store.groups.length).toBe(initialCount + 1)
        expect(store.groups).toContainEqual(newGroup)
      })

      it('should toggle group enabled state', () => {
        const store = useShortcutsStore()
        
        const group = store.groups[0]
        const originalState = group.enabled
        
        store.toggleGroup(group.id)
        
        const updated = store.groups.find(g => g.id === group.id)
        expect(updated?.enabled).toBe(!originalState)
      })

      it('should delete a group', () => {
        const store = useShortcutsStore()
        
        const groupToDelete = store.groups[0]
        const initialCount = store.groups.length
        
        store.deleteGroup(groupToDelete.id)
        
        expect(store.groups.length).toBe(initialCount - 1)
        expect(store.groups).not.toContainEqual(groupToDelete)
      })
    })

    describe('export/import', () => {
      it('should export shortcuts and groups', () => {
        const store = useShortcutsStore()
        
        const exported = store.exportShortcuts()
        
        expect(exported).toHaveProperty('shortcuts')
        expect(exported).toHaveProperty('groups')
        expect(exported).toHaveProperty('version')
        expect(exported.shortcuts).toEqual(store.shortcuts)
        expect(exported.groups).toEqual(store.groups)
      })

      it('should import shortcuts and groups', () => {
        const store = useShortcutsStore()
        
        const importData = {
          shortcuts: [
            {
              id: 'import-1',
              label: 'Imported',
              code: 'F1',
              keys: ['F1'],
              enabled: true
            }
          ],
          groups: [
            {
              id: 'import-group',
              name: 'Imported Group',
              icon: '📦',
              shortcuts: ['import-1'],
              enabled: true
            }
          ],
          version: '1.0.0'
        }
        
        store.importShortcuts(importData)
        
        expect(store.shortcuts).toContainEqual(importData.shortcuts[0])
        expect(store.groups).toContainEqual(importData.groups[0])
      })
    })

    describe('persistence', () => {
      it('should save to localStorage', () => {
        const store = useShortcutsStore()
        
        store.saveToStorage()
        
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'shortcuts',
          expect.any(String)
        )
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'shortcut-groups',
          expect.any(String)
        )
      })

      it('should load from localStorage', () => {
        const savedShortcuts = [
          {
            id: 'saved-1',
            label: 'Saved',
            code: 'F2',
            keys: ['F2'],
            enabled: true
          }
        ]
        
        localStorage.getItem = vi.fn((key) => {
          if (key === 'shortcuts') {
            return JSON.stringify(savedShortcuts)
          }
          return null
        })
        
        const store = useShortcutsStore()
        store.loadFromStorage()
        
        expect(store.shortcuts).toContainEqual(savedShortcuts[0])
      })
    })
  })

  describe('Getters', () => {
    describe('enabledShortcuts', () => {
      it('should return only enabled shortcuts', () => {
        const store = useShortcutsStore()
        
        // Disable some shortcuts
        store.shortcuts[0].enabled = false
        store.shortcuts[1].enabled = true
        
        const enabled = store.enabledShortcuts
        
        expect(enabled.every(s => s.enabled)).toBe(true)
        expect(enabled).not.toContainEqual(store.shortcuts[0])
      })
    })

    describe('getShortcutById', () => {
      it('should return shortcut by ID', () => {
        const store = useShortcutsStore()
        
        const shortcut = store.shortcuts[0]
        const found = store.getShortcutById(shortcut.id)
        
        expect(found).toBe(shortcut)
      })

      it('should return undefined for non-existent ID', () => {
        const store = useShortcutsStore()
        
        const found = store.getShortcutById('non-existent')
        
        expect(found).toBeUndefined()
      })
    })

    describe('getGroupById', () => {
      it('should return group by ID', () => {
        const store = useShortcutsStore()
        
        const group = store.groups[0]
        const found = store.getGroupById(group.id)
        
        expect(found).toBe(group)
      })
    })

    describe('recordedKeyString', () => {
      it('should return formatted key string', () => {
        const store = useShortcutsStore()
        
        store.startRecording()
        store.addRecordedKey('Ctrl')
        store.addRecordedKey('Shift')
        store.addRecordedKey('T')
        
        expect(store.recordedKeyString).toBe('Ctrl+Shift+T')
      })

      it('should return empty string when no keys recorded', () => {
        const store = useShortcutsStore()
        
        expect(store.recordedKeyString).toBe('')
      })
    })
  })
})