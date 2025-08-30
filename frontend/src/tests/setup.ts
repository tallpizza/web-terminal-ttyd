import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

global.localStorage = localStorageMock as Storage

// Mock IndexedDB
const indexedDBMock = {
  open: vi.fn(() => Promise.resolve({
    result: {
      createObjectStore: vi.fn(),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          get: vi.fn(() => ({ result: null })),
          put: vi.fn(),
          delete: vi.fn(),
          clear: vi.fn()
        }))
      }))
    }
  }))
}

global.indexedDB = indexedDBMock as any

// Mock WebSocket
class WebSocketMock {
  url: string
  readyState: number = 0
  
  constructor(url: string) {
    this.url = url
  }
  
  send = vi.fn()
  close = vi.fn()
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
}

global.WebSocket = WebSocketMock as any

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    statusText: 'OK',
    headers: new Headers()
  })
) as any

// Configure Vue Test Utils
config.global.mocks = {
  $t: (key: string) => key, // Mock i18n if needed
}