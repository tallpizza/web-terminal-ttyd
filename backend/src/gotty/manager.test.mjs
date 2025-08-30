import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import GoTTYManager from './manager.js';

describe('GoTTYManager', () => {
  let manager;

  beforeEach(() => {
    manager = new GoTTYManager();
  });

  afterEach(() => {
    // Clean up any sessions
    if (manager) {
      manager.killAllSessions();
    }
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      assert(manager.sessions instanceof Map);
      assert.strictEqual(manager.nextPort, 8081);
      assert(manager.gottyPath);
    });
  });

  describe('findGoTTY', () => {
    it('should return a gotty path', () => {
      const gottyPath = manager.findGoTTY();
      assert(gottyPath);
      assert(typeof gottyPath === 'string');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = manager.generateId();
      const id2 = manager.generateId();
      
      assert(id1);
      assert(id2);
      assert.notStrictEqual(id1, id2);
    });

    it('should generate IDs of correct length', () => {
      const id = manager.generateId();
      assert.strictEqual(id.length, 9);
    });
  });

  describe('session management', () => {
    it('should start with no sessions', () => {
      const sessions = manager.getAllSessions();
      assert.strictEqual(sessions.length, 0);
    });

    it('should return undefined for non-existent session', () => {
      const session = manager.getSession('non-existent');
      assert.strictEqual(session, undefined);
    });

    it('should return false when killing non-existent session', () => {
      const result = manager.killGoTTY('non-existent');
      assert.strictEqual(result, false);
    });
  });

  // Note: Actual GoTTY spawning tests would require the GoTTY binary
  // These are commented out but show the structure
  /*
  describe('spawnGoTTY (requires GoTTY binary)', () => {
    it('should spawn a new GoTTY process', async () => {
      const config = { name: 'Test Session' };
      const session = await manager.spawnGoTTY(config);

      assert(session);
      assert(session.id);
      assert(session.port);
      assert.strictEqual(session.name, 'Test Session');
      assert(manager.sessions.has(session.id));
      
      // Clean up
      manager.killGoTTY(session.id);
    });
  });
  */
});