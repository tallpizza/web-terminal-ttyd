import { jest } from '@jest/globals';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import GoTTYManager from './manager.js';

// Mock child_process spawn
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

// Mock fs.existsSync
jest.mock('fs', () => ({
  existsSync: jest.fn()
}));

describe('GoTTYManager', () => {
  let manager;
  let mockProcess;

  beforeEach(() => {
    manager = new GoTTYManager();
    
    // Setup mock process
    mockProcess = {
      pid: 12345,
      kill: jest.fn(),
      on: jest.fn(),
      stdout: {
        on: jest.fn()
      },
      stderr: {
        on: jest.fn()
      }
    };
    
    spawn.mockReturnValue(mockProcess);
    fs.existsSync.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(manager.sessions).toBeInstanceOf(Map);
      expect(manager.nextPort).toBe(8081);
      expect(manager.gottyPath).toBeDefined();
    });
  });

  describe('findGoTTY', () => {
    it('should find GoTTY in project bin directory', () => {
      fs.existsSync.mockReturnValue(true);
      const gottyPath = manager.findGoTTY();
      expect(gottyPath).toContain('bin/gotty');
    });

    it('should return system gotty if project binary not found', () => {
      fs.existsSync.mockReturnValue(false);
      const gottyPath = manager.findGoTTY();
      expect(gottyPath).toBe('gotty');
    });
  });

  describe('spawnGoTTY', () => {
    it('should spawn a new GoTTY process', async () => {
      const config = { name: 'Test Session' };
      const session = await manager.spawnGoTTY(config);

      expect(spawn).toHaveBeenCalled();
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('port');
      expect(session).toHaveProperty('pid', 12345);
      expect(session.name).toBe('Test Session');
      expect(manager.sessions.has(session.id)).toBe(true);
    });

    it('should increment port for each new session', async () => {
      await manager.spawnGoTTY({ name: 'Session 1' });
      const session2 = await manager.spawnGoTTY({ name: 'Session 2' });
      
      expect(session2.port).toBe(8082);
    });

    it('should handle spawn errors', async () => {
      spawn.mockImplementation(() => {
        throw new Error('Spawn failed');
      });

      await expect(manager.spawnGoTTY()).rejects.toThrow('Spawn failed');
    });
  });

  describe('killGoTTY', () => {
    it('should kill an existing GoTTY process', async () => {
      const session = await manager.spawnGoTTY({ name: 'Test' });
      const result = manager.killGoTTY(session.id);

      expect(result).toBe(true);
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      expect(manager.sessions.has(session.id)).toBe(false);
    });

    it('should return false for non-existent session', () => {
      const result = manager.killGoTTY('non-existent');
      expect(result).toBe(false);
    });

    it('should handle kill errors gracefully', async () => {
      const session = await manager.spawnGoTTY({ name: 'Test' });
      mockProcess.kill.mockImplementation(() => {
        throw new Error('Kill failed');
      });

      const result = manager.killGoTTY(session.id);
      expect(result).toBe(false);
    });
  });

  describe('getSession', () => {
    it('should return existing session', async () => {
      const created = await manager.spawnGoTTY({ name: 'Test' });
      const session = manager.getSession(created.id);
      
      expect(session).toBeDefined();
      expect(session.id).toBe(created.id);
    });

    it('should return undefined for non-existent session', () => {
      const session = manager.getSession('non-existent');
      expect(session).toBeUndefined();
    });
  });

  describe('getAllSessions', () => {
    it('should return all active sessions', async () => {
      await manager.spawnGoTTY({ name: 'Session 1' });
      await manager.spawnGoTTY({ name: 'Session 2' });
      
      const sessions = manager.getAllSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions[0].name).toBe('Session 1');
      expect(sessions[1].name).toBe('Session 2');
    });

    it('should return empty array when no sessions', () => {
      const sessions = manager.getAllSessions();
      expect(sessions).toEqual([]);
    });
  });

  describe('killAllSessions', () => {
    it('should kill all active sessions', async () => {
      await manager.spawnGoTTY({ name: 'Session 1' });
      await manager.spawnGoTTY({ name: 'Session 2' });
      
      manager.killAllSessions();
      
      expect(mockProcess.kill).toHaveBeenCalledTimes(2);
      expect(manager.sessions.size).toBe(0);
    });
  });

  describe('healthCheck', () => {
    it('should check health of all sessions', async () => {
      const session = await manager.spawnGoTTY({ name: 'Test' });
      
      // Mock process.kill for health check (0 means check only)
      mockProcess.kill.mockReturnValue(undefined);
      
      manager.healthCheck();
      
      expect(mockProcess.kill).toHaveBeenCalledWith(0);
    });

    it('should remove dead sessions', async () => {
      const session = await manager.spawnGoTTY({ name: 'Test' });
      
      // Simulate dead process
      mockProcess.kill.mockImplementation(() => {
        throw new Error('Process not found');
      });
      
      manager.healthCheck();
      
      expect(manager.sessions.has(session.id)).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = manager.generateId();
      const id2 = manager.generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs of correct length', () => {
      const id = manager.generateId();
      expect(id.length).toBe(9);
    });
  });
});