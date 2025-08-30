import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionStore } from './sessions'

// Mock the fetch responses
const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('Session Store', () => {
  beforeEach(() => {
    // Create a fresh pinia instance before each test
    setActivePinia(createPinia())
    
    // Reset mocks
    vi.clearAllMocks()
  })

  describe('State', () => {
    it('should initialize with default values', () => {
      const store = useSessionStore()
      
      expect(store.sessions).toEqual([])
      expect(store.activeSessionId).toBe(null)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })
  })

  describe('Actions', () => {
    describe('fetchSessions', () => {
      it('should fetch sessions from API', async () => {
        const mockSessions = [
          { id: '1', name: 'Session 1', port: 8081 },
          { id: '2', name: 'Session 2', port: 8082 }
        ]
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockSessions
        })
        
        const store = useSessionStore()
        await store.fetchSessions()
        
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/sessions')
        )
        expect(store.sessions).toEqual(mockSessions)
        expect(store.isLoading).toBe(false)
      })

      it('should handle fetch error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))
        
        const store = useSessionStore()
        await store.fetchSessions()
        
        expect(store.error).toBe('Failed to fetch sessions')
        expect(store.isLoading).toBe(false)
        expect(store.sessions).toEqual([])
      })
    })

    describe('createSession', () => {
      it('should create a new session', async () => {
        const newSession = { 
          id: '3', 
          name: 'New Session', 
          port: 8083 
        }
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => newSession
        })
        
        const store = useSessionStore()
        await store.createSession('New Session')
        
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/sessions'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: 'New Session' })
          })
        )
        
        expect(store.sessions).toContainEqual(newSession)
        expect(store.activeSessionId).toBe('3')
      })

      it('should use default name if not provided', async () => {
        const newSession = { 
          id: '4', 
          name: 'Terminal Session', 
          port: 8084 
        }
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => newSession
        })
        
        const store = useSessionStore()
        await store.createSession()
        
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/sessions'),
          expect.objectContaining({
            body: JSON.stringify({ name: 'Terminal Session' })
          })
        )
      })
    })

    describe('closeSession', () => {
      it('should close a session', async () => {
        const store = useSessionStore()
        
        // Add some sessions first
        store.sessions = [
          { id: '1', name: 'Session 1', port: 8081, url: '', createdAt: new Date(), lastActivity: new Date(), status: 'running' },
          { id: '2', name: 'Session 2', port: 8082, url: '', createdAt: new Date(), lastActivity: new Date(), status: 'running' }
        ]
        store.activeSessionId = '1'
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        })
        
        await store.closeSession('1')
        
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/sessions/1'),
          expect.objectContaining({
            method: 'DELETE'
          })
        )
        
        expect(store.sessions).toHaveLength(1)
        expect(store.sessions[0].id).toBe('2')
        expect(store.activeSessionId).toBe('2') // Should switch to next session
      })

      it('should handle close error gracefully', async () => {
        const store = useSessionStore()
        
        store.sessions = [
          { id: '1', name: 'Session 1', port: 8081, url: '', createdAt: new Date(), lastActivity: new Date(), status: 'running' }
        ]
        
        mockFetch.mockRejectedValueOnce(new Error('Delete failed'))
        
        await store.closeSession('1')
        
        expect(store.error).toBe('Failed to close session')
        expect(store.sessions).toHaveLength(1) // Session should still be there
      })
    })

    describe('renameSession', () => {
      it('should rename a session', async () => {
        const store = useSessionStore()
        
        store.sessions = [
          { id: '1', name: 'Old Name', port: 8081, url: '', createdAt: new Date(), lastActivity: new Date(), status: 'running' }
        ]
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: '1', name: 'New Name' })
        })
        
        await store.renameSession('1', 'New Name')
        
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/sessions/1/rename'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ name: 'New Name' })
          })
        )
        
        expect(store.sessions[0].name).toBe('New Name')
      })
    })

    describe('setActiveSession', () => {
      it('should set the active session', () => {
        const store = useSessionStore()
        
        store.sessions = [
          { id: '1', name: 'Session 1', port: 8081, url: '', createdAt: new Date(), lastActivity: new Date(), status: 'running' },
          { id: '2', name: 'Session 2', port: 8082, url: '', createdAt: new Date(), lastActivity: new Date(), status: 'running' }
        ]
        
        store.setActiveSession('2')
        
        expect(store.activeSessionId).toBe('2')
      })

      it('should not set active session if ID does not exist', () => {
        const store = useSessionStore()
        
        store.sessions = [
          { id: '1', name: 'Session 1', port: 8081, url: '', createdAt: new Date(), lastActivity: new Date(), status: 'running' }
        ]
        store.activeSessionId = '1'
        
        store.setActiveSession('non-existent')
        
        expect(store.activeSessionId).toBe('1') // Should remain unchanged
      })
    })
  })

  describe('Getters', () => {
    describe('activeSession', () => {
      it('should return the active session', () => {
        const store = useSessionStore()
        
        const session1 = { id: '1', name: 'Session 1', port: 8081, url: '', createdAt: new Date(), lastActivity: new Date(), status: 'running' as const }
        const session2 = { id: '2', name: 'Session 2', port: 8082, url: '', createdAt: new Date(), lastActivity: new Date(), status: 'running' as const }
        
        store.sessions = [session1, session2]
        store.activeSessionId = '2'
        
        expect(store.activeSession).toBe(session2)
      })

      it('should return null if no active session', () => {
        const store = useSessionStore()
        
        expect(store.activeSession).toBe(null)
      })
    })

    describe('sessionCount', () => {
      it('should return the number of sessions', () => {
        const store = useSessionStore()
        
        expect(store.sessionCount).toBe(0)
        
        store.sessions = [
          { id: '1', name: 'Session 1', port: 8081, url: '', createdAt: new Date(), lastActivity: new Date(), status: 'running' },
          { id: '2', name: 'Session 2', port: 8082, url: '', createdAt: new Date(), lastActivity: new Date(), status: 'running' }
        ]
        
        expect(store.sessionCount).toBe(2)
      })
    })

    describe('getSessionUrl', () => {
      it('should return the correct session URL', () => {
        const store = useSessionStore()
        
        store.sessions = [
          { id: '1', name: 'Session 1', port: 8081, url: 'http://localhost:8081', createdAt: new Date(), lastActivity: new Date(), status: 'running' }
        ]
        
        expect(store.getSessionUrl('1')).toBe('http://localhost:8081')
      })

      it('should construct URL if not in session data', () => {
        const store = useSessionStore()
        
        store.sessions = [
          { id: '1', name: 'Session 1', port: 8082, url: '', createdAt: new Date(), lastActivity: new Date(), status: 'running' }
        ]
        
        const url = store.getSessionUrl('1')
        expect(url).toContain('8082')
      })

      it('should return empty string for non-existent session', () => {
        const store = useSessionStore()
        
        expect(store.getSessionUrl('non-existent')).toBe('')
      })
    })
  })
})