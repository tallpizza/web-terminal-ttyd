import knex from 'knex';
import knexConfig from '../../knexfile.js';

class Database {
  constructor() {
    this.knex = null;
  }

  async init() {
    const environment = process.env.NODE_ENV || 'development';
    this.knex = knex(knexConfig[environment]);
    
    // Run migrations
    try {
      await this.knex.migrate.latest();
      console.log('✅ Database migrations complete');
    } catch (error) {
      console.error('Error running migrations:', error);
      throw error;
    }
    
    console.log('✅ Database connected');
  }

  async createSession(session) {
    try {
      await this.knex('sessions').insert({
        id: session.id,
        name: session.name,
        port: session.port,
        pid: session.pid,
        status: session.status || 'active',
        shell: session.shell,
        working_dir: session.workingDir,
        metadata: JSON.stringify(session.metadata || {})
      });
      return session;
    } catch (error) {
      console.error('Error creating session in DB:', error);
      throw error;
    }
  }

  async updateSession(id, updates) {
    try {
      // Convert camelCase to snake_case for database fields
      const dbUpdates = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.lastActivity !== undefined) dbUpdates.last_activity = updates.lastActivity;
      if (updates.metadata !== undefined) dbUpdates.metadata = JSON.stringify(updates.metadata);
      
      // Always update last_activity
      dbUpdates.last_activity = this.knex.fn.now();
      
      await this.knex('sessions')
        .where('id', id)
        .update(dbUpdates);
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  async deleteSession(id) {
    try {
      await this.knex('sessions')
        .where('id', id)
        .delete();
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  async getSession(id) {
    try {
      const session = await this.knex('sessions')
        .where('id', id)
        .first();
      
      if (session && session.metadata) {
        session.metadata = JSON.parse(session.metadata);
      }
      
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  async getAllSessions() {
    try {
      const sessions = await this.knex('sessions')
        .orderBy('created_at', 'desc');
      
      // Parse metadata for each session
      return sessions.map(session => {
        if (session.metadata) {
          session.metadata = JSON.parse(session.metadata);
        }
        return session;
      });
    } catch (error) {
      console.error('Error getting all sessions:', error);
      throw error;
    }
  }

  async getActiveSessions() {
    try {
      const sessions = await this.knex('sessions')
        .where('status', 'active')
        .orderBy('created_at', 'desc');
      
      return sessions.map(session => {
        if (session.metadata) {
          session.metadata = JSON.parse(session.metadata);
        }
        return session;
      });
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw error;
    }
  }

  async updateSessionActivity(id) {
    try {
      await this.knex('sessions')
        .where('id', id)
        .update({
          last_activity: this.knex.fn.now()
        });
    } catch (error) {
      console.error('Error updating session activity:', error);
      throw error;
    }
  }

  async cleanupStaleSessions(maxAgeMs = 3600000) { // 1 hour default
    try {
      const cutoffTime = new Date(Date.now() - maxAgeMs);
      
      const deleted = await this.knex('sessions')
        .where('last_activity', '<', cutoffTime)
        .andWhere('status', 'active')
        .update({ status: 'stale' });
      
      return deleted;
    } catch (error) {
      console.error('Error cleaning up stale sessions:', error);
      throw error;
    }
  }

  async close() {
    if (this.knex) {
      await this.knex.destroy();
      console.log('Database connection closed');
    }
  }
}

export default Database;