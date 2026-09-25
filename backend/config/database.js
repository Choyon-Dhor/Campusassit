const { Pool } = require('pg');
require('./env');

class Database {
  constructor() {
    if (Database.instance) return Database.instance;

    const databaseUrl = process.env.DATABASE_URL;
    const shouldUseSsl = process.env.DB_SSL
      ? process.env.DB_SSL === 'true'
      : Boolean(databaseUrl && /supabase\.co/i.test(databaseUrl)) || process.env.NODE_ENV === 'production';

    const config = databaseUrl
      ? {
          connectionString: databaseUrl,
          ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
        }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT, 10) || 5432,
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || 'campusassist',
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        };

    this.pool = new Pool(config);
    this.pool.on('error', (err) => console.error('Unexpected pool error:', err.message));
    Database.instance = this;
  }

  getPool() {
    return this.pool;
  }

  async query(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (err) {
      console.error('DB query error:', err.message, '\nSQL:', sql, '\nParams:', params);
      throw err;
    }
  }

  async queryOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async testConnection() {
    try {
      const rows = await this.query('SELECT current_database() AS db');
      console.log(`Connected to PostgreSQL: "${rows[0].db}"`);
      return true;
    } catch (err) {
      console.error('PostgreSQL connection failed:', err.message);
      return false;
    }
  }
}

module.exports = new Database();
