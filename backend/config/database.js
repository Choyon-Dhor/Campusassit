// ============================================================
// config/database.js — Singleton Pattern — PostgreSQL via pg
// ============================================================
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

class Database {
  constructor() {
    if (Database.instance) {
      return Database.instance;
    }
    this.pool = null;
    this._init();
    Database.instance = this;
  }

  _init() {
    const config = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        }
      : {
          host:     process.env.DB_HOST     || 'localhost',
          port:     parseInt(process.env.DB_PORT) || 5432,
          user:     process.env.DB_USER     || 'postgres',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME     || 'campusassist',
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        };

    this.pool = new Pool(config);

    this.pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL pool error:', err.message);
    });

    console.log('✅ PostgreSQL pool initialized (Singleton)');
  }

  getPool() { return this.pool; }

  /**
   * Run a parameterised query. pg uses $1,$2... positional placeholders.
   * Returns rows array directly to mirror old mysql2 behaviour.
   */
  async query(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('DB query error:', error.message, '\nSQL:', sql, '\nParams:', params);
      throw error;
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
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async testConnection() {
    try {
      const rows = await this.query('SELECT current_database() AS db');
      console.log(`✅ Connected to PostgreSQL — database: "${rows[0].db}"`);
      return true;
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error.message);
      return false;
    }
  }
}

const db = new Database();
module.exports = db;
