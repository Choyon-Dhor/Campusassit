// ============================================================
// repositories/BaseRepository.js — Repository Pattern (pg)
// ============================================================
const db = require('../config/database');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = db;
  }

  /**
   * Build WHERE clause + positional params starting at $startIdx.
   * Returns { clause: 'col1 = $1 AND col2 = $2', params: [...], nextIdx }
   */
  _buildWhere(conditions, startIdx = 1) {
    const keys = Object.keys(conditions);
    if (keys.length === 0) return { clause: '', params: [], nextIdx: startIdx };
    const params = Object.values(conditions);
    const clause = keys.map((k, i) => `${k} = $${startIdx + i}`).join(' AND ');
    return { clause, params, nextIdx: startIdx + keys.length };
  }

  async findAll(conditions = {}, options = {}) {
    const { clause, params, nextIdx } = this._buildWhere(conditions);
    let idx = nextIdx;
    let sql = `SELECT * FROM ${this.tableName}`;
    if (clause) sql += ` WHERE ${clause}`;
    if (options.orderBy) sql += ` ORDER BY ${options.orderBy}`;
    if (options.limit !== undefined)  { sql += ` LIMIT $${idx++}`;  params.push(options.limit);  }
    if (options.offset !== undefined) { sql += ` OFFSET $${idx++}`; params.push(options.offset); }
    return await this.db.query(sql, params);
  }

  async findById(id) {
    const rows = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`, [id]
    );
    return rows[0] || null;
  }

  async findOne(conditions) {
    const keys   = Object.keys(conditions);
    const vals   = Object.values(conditions);
    const clause = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
    const rows   = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE ${clause} LIMIT 1`, vals
    );
    return rows[0] || null;
  }

  async create(data) {
    const keys   = Object.keys(data);
    const vals   = Object.values(data);
    const cols   = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const rows   = await this.db.query(
      `INSERT INTO ${this.tableName} (${cols}) VALUES (${placeholders}) RETURNING *`,
      vals
    );
    return rows[0];
  }

  async update(id, data) {
    const keys = Object.keys(data);
    const vals = Object.values(data);
    const set  = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const rows = await this.db.query(
      `UPDATE ${this.tableName} SET ${set} WHERE id = $${keys.length + 1} RETURNING *`,
      [...vals, id]
    );
    return rows[0] || null;
  }

  async delete(id) {
    return await this.db.query(
      `DELETE FROM ${this.tableName} WHERE id = $1`, [id]
    );
  }

  async count(conditions = {}) {
    const { clause, params } = this._buildWhere(conditions);
    let sql = `SELECT COUNT(*)::int AS count FROM ${this.tableName}`;
    if (clause) sql += ` WHERE ${clause}`;
    const rows = await this.db.query(sql, params);
    return rows[0]?.count || 0;
  }
}

module.exports = BaseRepository;
