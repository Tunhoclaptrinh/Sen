const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class FavoriteService extends BaseService {
  constructor() {
    super('favorites');
  }

  async getFavorites(userId, options = {}) {
    const result = db.findAllAdvanced('favorites', {
      ...options,
      filter: {
        ...options.filter,
        user_id: userId
      }
    });

    const enriched = result.data.map(fav => {
      let item = null;
      if (fav.type === 'heritage_site') {
        item = db.findById('heritage_sites', fav.reference_id);
      } else if (fav.type === 'artifact') {
        item = db.findById('artifacts', fav.reference_id);
      } else if (fav.type === 'exhibition') {
        item = db.findById('exhibitions', fav.reference_id);
      }

      return {
        ...fav,
        item: item || null
      };
    }).filter(f => f.item !== null);

    return {
      success: true,
      data: enriched
    };
  }

  async addFavorite(userId, type, referenceId) {
    if (!['heritage_site', 'artifact', 'exhibition'].includes(type)) {
      return {
        success: false,
        message: 'Invalid type',
        statusCode: 400
      };
    }

    const existing = db.findOne('favorites', {
      user_id: userId,
      type,
      reference_id: parseInt(referenceId)
    });

    if (existing) {
      return {
        success: false,
        message: 'Already favorited',
        statusCode: 400
      };
    }

    const favorite = db.create('favorites', {
      user_id: userId,
      type,
      reference_id: parseInt(referenceId),
      created_at: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Added to favorites',
      data: favorite
    };
  }

  async removeFavorite(userId, type, referenceId) {
    const favorite = db.findOne('favorites', {
      user_id: userId,
      type,
      reference_id: parseInt(referenceId)
    });

    if (!favorite) {
      return {
        success: false,
        message: 'Favorite not found',
        statusCode: 404
      };
    }

    db.delete('favorites', favorite.id);

    return {
      success: true,
      message: 'Removed from favorites'
    };
  }
}

module.exports = new FavoriteService();