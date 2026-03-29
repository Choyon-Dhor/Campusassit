// ============================================================
// services/RecommendationService.js (pg)
// Score = (downloads * 0.5) + (rating * 0.3) + (recency * 0.2)
// ============================================================
const db = require('../config/database');

class RecommendationService {
  constructor() {
    if (RecommendationService.instance) return RecommendationService.instance;
    RecommendationService.instance = this;
  }

  calculateRecencyScore(createdAt) {
    const days = Math.floor((Date.now() - new Date(createdAt)) / 86_400_000);
    if (days <=  7) return 5.0;
    if (days <= 14) return 4.0;
    if (days <= 30) return 3.0;
    if (days <= 60) return 2.0;
    if (days <= 90) return 1.0;
    return 0.5;
  }

  normalizeDownloads(downloads, maxDownloads) {
    return maxDownloads > 0 ? (downloads / maxDownloads) * 5 : 0;
  }

  computeScore(downloads, rating, recencyScore, maxDownloads) {
    return parseFloat(
      (this.normalizeDownloads(downloads, maxDownloads) * 0.5 +
       (rating || 0) * 0.3 +
       recencyScore  * 0.2
      ).toFixed(4)
    );
  }

  async updateAllScores() {
    try {
      const res = await db.query(
        `SELECT id, download_count, average_rating, created_at FROM resources`
      );
      const resources = res.rows;
      if (!resources || resources.length === 0) return;

      const maxDownloads = Math.max(...resources.map(r => r.download_count));

      for (const r of resources) {
        const score = this.computeScore(
          r.download_count,
          parseFloat(r.average_rating),
          this.calculateRecencyScore(r.created_at),
          maxDownloads
        );
        await db.query(
          `UPDATE resources SET recommendation_score = $1 WHERE id = $2`,
          [score, r.id]
        );
      }
      console.log(`✅ Recommendation scores updated for ${resources.length} resources`);
    } catch (err) {
      console.error('RecommendationService.updateAllScores error:', err.message);
    }
  }

  async getTopRecommendations(limit = 10, filters = {}) {
    await this.updateAllScores();

    const params = [];
    let sql = `
      SELECT r.*, u.name AS uploader_name, u.department AS uploader_dept
      FROM resources r
      LEFT JOIN users u ON r.uploader_id = u.id
      WHERE 1=1`;

    if (filters.department)  { params.push(filters.department);  sql += ` AND r.department  = $${params.length}`; }
    if (filters.course_code) { params.push(filters.course_code); sql += ` AND r.course_code = $${params.length}`; }
    if (filters.file_type)   { params.push(filters.file_type);   sql += ` AND r.file_type   = $${params.length}`; }

    params.push(limit);
    sql += ` ORDER BY r.recommendation_score DESC LIMIT $${params.length}`;
    const res = await db.query(sql, params);
    return res.rows;
  }

  async updateSingleScore(resourceId) {
    try {
      const res = await db.query(
        `SELECT id, download_count, average_rating, created_at FROM resources WHERE id = $1`,
        [resourceId]
      );
      const r = res.rows[0];
      if (!r) return;

      const maxRes = await db.query(`SELECT MAX(download_count) AS max FROM resources`);
      const maxRow = maxRes.rows[0];
      const maxDownloads = maxRow?.max || 1;

      const score = this.computeScore(
        r.download_count,
        parseFloat(r.average_rating),
        this.calculateRecencyScore(r.created_at),
        maxDownloads
      );
      await db.query(
        `UPDATE resources SET recommendation_score = $1 WHERE id = $2`,
        [score, resourceId]
      );
    } catch (err) {
      console.error('updateSingleScore error:', err.message);
    }
  }
}

const recommendationService = new RecommendationService();
module.exports = recommendationService;
