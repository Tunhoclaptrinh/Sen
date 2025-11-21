const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class ArtifactService extends BaseService {
  constructor() {
    super('artifacts');
  }

  async getByType(type) {
    const artifacts = db.findMany('artifacts', { artifact_type: type });
    return {
      success: true,
      data: artifacts
    };
  }

  async getRelated(artifactId) {
    const artifact = db.findById('artifacts', artifactId);
    if (!artifact) {
      return { success: false, message: 'Artifact not found', statusCode: 404 };
    }

    const related = db.findAll('artifacts')
      .filter(a =>
        a.id !== artifactId &&
        (a.heritage_site_id === artifact.heritage_site_id ||
          a.cultural_category_id === artifact.cultural_category_id)
      )
      .slice(0, 5);

    return {
      success: true,
      data: related
    };
  }
}

module.exports = new ArtifactService();
