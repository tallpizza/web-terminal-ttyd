import Database from '../db/database.js';
import GoTTYManager from '../gotty/manager.js';

class SessionCleanup {
  constructor() {
    this.db = new Database();
    this.gottyManager = new GoTTYManager();
    this.cleanupInterval = null;
  }

  async init() {
    await this.db.init();
    await this.gottyManager.init();
  }

  /**
   * Start automatic cleanup process
   * @param {number} intervalMs - Cleanup interval in milliseconds (default: 1 hour)
   */
  startAutoCleanup(intervalMs = 3600000) {
    console.log(`Starting auto-cleanup with interval: ${intervalMs}ms`);
    
    // Run initial cleanup
    this.performCleanup();
    
    // Set up recurring cleanup
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, intervalMs);
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Auto-cleanup stopped');
    }
  }

  /**
   * Perform cleanup tasks
   */
  async performCleanup() {
    console.log('Performing cleanup tasks...');
    
    try {
      // 1. Clean up stale sessions (inactive for more than 24 hours)
      const staleCount = await this.cleanupStaleSessions(24 * 60 * 60 * 1000);
      console.log(`Cleaned up ${staleCount} stale sessions`);
      
      // 2. Clean up orphaned GoTTY processes
      const orphanedCount = await this.cleanupOrphanedProcesses();
      console.log(`Cleaned up ${orphanedCount} orphaned processes`);
      
      // 3. Clean up old session history (older than 7 days)
      const historyCount = await this.cleanupOldHistory(7 * 24 * 60 * 60 * 1000);
      console.log(`Cleaned up ${historyCount} old history entries`);
      
      // 4. Vacuum database to reclaim space
      await this.vacuumDatabase();
      console.log('Database vacuumed');
      
      return {
        staleSessions: staleCount,
        orphanedProcesses: orphanedCount,
        oldHistory: historyCount
      };
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Clean up stale sessions
   * @param {number} maxAgeMs - Maximum age in milliseconds
   */
  async cleanupStaleSessions(maxAgeMs) {
    const cutoffTime = new Date(Date.now() - maxAgeMs);
    
    // Get stale sessions from database
    const staleSessions = await this.db.knex('sessions')
      .where('last_activity', '<', cutoffTime)
      .andWhere('status', 'active')
      .select('id', 'pid');
    
    // Kill associated GoTTY processes
    for (const session of staleSessions) {
      try {
        await this.gottyManager.killGoTTY(session.id);
      } catch (error) {
        console.error(`Failed to kill GoTTY for session ${session.id}:`, error);
      }
    }
    
    // Mark sessions as terminated in database
    const updated = await this.db.knex('sessions')
      .where('last_activity', '<', cutoffTime)
      .andWhere('status', 'active')
      .update({ 
        status: 'terminated',
        metadata: this.db.knex.raw(`json_set(metadata, '$.terminated_at', '${new Date().toISOString()}')`)
      });
    
    return updated;
  }

  /**
   * Clean up orphaned GoTTY processes
   */
  async cleanupOrphanedProcesses() {
    // Get all active sessions from database
    const activeSessions = await this.db.knex('sessions')
      .where('status', 'active')
      .select('id', 'pid');
    
    const dbSessionIds = new Set(activeSessions.map(s => s.id));
    
    // Get all running GoTTY processes
    const runningProcesses = this.gottyManager.getAllSessions();
    
    // Find orphaned processes (running but not in database)
    let orphanedCount = 0;
    for (const process of runningProcesses) {
      if (!dbSessionIds.has(process.id)) {
        try {
          await this.gottyManager.killGoTTY(process.id);
          orphanedCount++;
        } catch (error) {
          console.error(`Failed to kill orphaned process ${process.id}:`, error);
        }
      }
    }
    
    return orphanedCount;
  }

  /**
   * Clean up old session history
   * @param {number} maxAgeMs - Maximum age in milliseconds
   */
  async cleanupOldHistory(maxAgeMs) {
    const cutoffTime = new Date(Date.now() - maxAgeMs);
    
    // Delete old history entries
    const deleted = await this.db.knex('sessions')
      .where('created_at', '<', cutoffTime)
      .andWhere('status', 'terminated')
      .delete();
    
    return deleted;
  }

  /**
   * Vacuum database to reclaim space
   */
  async vacuumDatabase() {
    await this.db.knex.raw('VACUUM');
  }

  /**
   * Get cleanup statistics
   */
  async getStats() {
    const stats = {
      totalSessions: 0,
      activeSessions: 0,
      staleSessions: 0,
      terminatedSessions: 0,
      databaseSize: 0
    };
    
    // Get session counts
    const sessionCounts = await this.db.knex('sessions')
      .select('status')
      .count('* as count')
      .groupBy('status');
    
    for (const row of sessionCounts) {
      stats.totalSessions += row.count;
      if (row.status === 'active') {
        stats.activeSessions = row.count;
      } else if (row.status === 'stale') {
        stats.staleSessions = row.count;
      } else if (row.status === 'terminated') {
        stats.terminatedSessions = row.count;
      }
    }
    
    // Get database size
    const dbInfo = await this.db.knex.raw('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()');
    stats.databaseSize = dbInfo[0].size;
    
    return stats;
  }

  /**
   * Close cleanup service
   */
  async close() {
    this.stopAutoCleanup();
    await this.db.close();
  }
}

export default SessionCleanup;