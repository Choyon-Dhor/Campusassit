const db = require('../config/database');

function getRecencyScore(createdAt) {
  const days = Math.floor((Date.now() - new Date(createdAt)) / 86400000);
  if (days <= 7) return 5.0;
  if (days <= 14) return 4.0;
  if (days <= 30) return 3.0;
  if (days <= 60) return 2.0;
  if (days <= 90) return 1.0;
  return 0.5;
}

function computeScore(downloads, rating, recencyScore, maxDownloads) {
  const normalizedDownloads = maxDownloads > 0 ? (downloads / maxDownloads) * 5 : 0;
  return parseFloat(
    (normalizedDownloads * 0.5 + (rating || 0) * 0.3 + recencyScore * 0.2).toFixed(4)
  );
}

class RecommendationService {
  async updateAllScores() {
    const resources = await db.query(
      `SELECT id, download_count, average_rating, created_at FROM resources`
    );
    if (!resources?.length) return;

    const maxDownloads = Math.max(...resources.map((r) => r.download_count), 1);

    for (const r of resources) {
      const score = computeScore(
        r.download_count,
        parseFloat(r.average_rating),
        getRecencyScore(r.created_at),
        maxDownloads
      );
      await db.query(`UPDATE resources SET recommendation_score = $1 WHERE id = $2`, [score, r.id]);
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

    if (filters.department) { params.push(filters.department); sql += ` AND r.department = $${params.length}`; }
    if (filters.course_code) { params.push(filters.course_code); sql += ` AND r.course_code = $${params.length}`; }
    if (filters.file_type) { params.push(filters.file_type); sql += ` AND r.file_type = $${params.length}`; }

    params.push(limit);
    sql += ` ORDER BY r.recommendation_score DESC LIMIT $${params.length}`;
    return db.query(sql, params);
  }

  async updateSingleScore(resourceId) {
    const r = await db.queryOne(
      `SELECT id, download_count, average_rating, created_at FROM resources WHERE id = $1`,
      [resourceId]
    );
    if (!r) return;

    const maxRow = await db.queryOne(`SELECT MAX(download_count) AS max FROM resources`);
    const maxDownloads = maxRow?.max || 1;

    const score = computeScore(
      r.download_count,
      parseFloat(r.average_rating),
      getRecencyScore(r.created_at),
      maxDownloads
    );
    await db.query(`UPDATE resources SET recommendation_score = $1 WHERE id = $2`, [score, resourceId]);
  }
}

module.exports = new RecommendationService();
