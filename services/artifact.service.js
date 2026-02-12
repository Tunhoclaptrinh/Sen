const ReviewableService = require('../utils/ReviewableService');
const db = require('../config/database');

class ArtifactService extends ReviewableService {
  constructor() {
    super('artifacts');
  }

  /**
   * Transform data before create
   */
  async beforeCreate(data) {
    if (data.shortDescription && !data.short_description) {
      data.short_description = data.shortDescription;
    }

    // Ensure numeric fields
    if (data.categoryId) data.categoryId = Number(data.categoryId);
    if (data.heritageSiteId) data.heritageSiteId = Number(data.heritageSiteId);
    if (data.yearCreated) data.yearCreated = Number(data.yearCreated);
    if (data.weight) data.weight = Number(data.weight);

    return super.beforeCreate(data);
  }

  /**
   * Transform data before update
   */
  async beforeUpdate(id, data) {
    // Ensure numeric fields
    if (data.categoryId) data.categoryId = Number(data.categoryId);
    if (data.heritageSiteId) data.heritageSiteId = Number(data.heritageSiteId);
    if (data.yearCreated) data.yearCreated = Number(data.yearCreated);
    if (data.weight) data.weight = Number(data.weight);

    return super.beforeUpdate(id, data);
  }

  async findAll(options = {}) {
    // Handle comma-separated IDs (e.g. ?ids=1,2,3)
    if (options.ids) {
      const ids = String(options.ids).split(',').map(Number);
      // Modify filter to include these IDs
      // Note: This assumes underlying DB adapter handles { id: [1,2,3] } as IN query
      // or we filter results manually after fetching
      if (!options.filter) options.filter = {};
      options.filter.id = ids;
      delete options.ids; // Clean up so it doesn't confuse exact match logic
    }

    const result = await super.findAll(options);

    // Fallback: If DB didn't filter by IDs (result contains more items or wrong items), filter manually
    // This is safer if strict ID filtering is required but DB adapter is simple
    if (result.success && options.filter && Array.isArray(options.filter.id)) {
      const ids = options.filter.id;
      result.data = result.data.filter(item => ids.includes(item.id));
      result.pagination.total = result.data.length; // Update total roughly
    }

    return result;
  }

  async getByType(type) {
    const artifacts = await db.findMany('artifacts', { artifactType: type });
    return {
      success: true,
      data: artifacts
    };
  }

  async getRelated(artifactId) {
    const artifact = await db.findById('artifacts', artifactId);
    if (!artifact) {
      return { success: false, message: 'Artifact not found', statusCode: 404 };
    }

    const allArtifacts = await db.findAll('artifacts');
    const related = allArtifacts
      .filter(a =>
        a.id !== artifactId &&
        (a.heritageSiteId === artifact.heritageSiteId ||
          a.culturalCategoryId === artifact.culturalCategoryId)
      )
      .slice(0, 5);

    return {
      success: true,
      data: related
    };
  }

  async getStats() {
    const [allArtifacts, allSites, allReviews] = await Promise.all([
      db.findAll('artifacts'),
      db.findAll('heritage_sites'),
      db.findMany('reviews', { type: 'artifact' })
    ]);

    const siteMap = allSites.reduce((acc, site) => {
      acc[site.id] = site;
      return acc;
    }, {});

    // Calculate average rating
    const totalRating = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avgRating = allReviews.length > 0 ? (totalRating / allReviews.length).toFixed(1) : "0.0";

    const stats = {
      total: allArtifacts.length,
      onDisplay: allArtifacts.filter(a => a.isOnDisplay !== false).length,
      goodCondition: allArtifacts.filter(a => ['excellent', 'good'].includes(a.condition)).length,
      byCondition: {
        good: allArtifacts.filter(a => ['excellent', 'good'].includes(a.condition)).length,
        fair: allArtifacts.filter(a => a.condition === 'fair').length,
        poor: allArtifacts.filter(a => ['poor', 'damaged'].includes(a.condition)).length,
      },
      avgRating: avgRating,
      unesco: allArtifacts.filter(a => siteMap[a.heritageSiteId]?.unescoListed).length,
      region: {
        north: allArtifacts.filter(a => {
          const region = siteMap[a.heritageSiteId]?.region;
          return region === 'Bắc' || region === 'North';
        }).length,
        center: allArtifacts.filter(a => {
          const region = siteMap[a.heritageSiteId]?.region;
          return region === 'Trung' || region === 'Center';
        }).length,
        south: allArtifacts.filter(a => {
          const region = siteMap[a.heritageSiteId]?.region;
          return region === 'Nam' || region === 'South';
        }).length
      }
    };

    return {
      success: true,
      data: stats
    };
  }
}

module.exports = new ArtifactService();
