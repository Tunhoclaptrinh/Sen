const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

class MongoAdapter {
  constructor() {
    this.models = {};
    this.relations = {
      heritage_sites: {
        artifacts: { ref: 'artifacts', localField: '_id', foreignField: 'heritage_site_id' },
        reviews: { ref: 'reviews', localField: '_id', foreignField: 'heritage_site_id' },
        timelines: { ref: 'timelines', localField: '_id', foreignField: 'heritage_site_id' },
        exhibitions: { ref: 'exhibitions', localField: '_id', foreignField: 'heritage_site_id' }
      },
      users: {
        collections: { ref: 'collections', localField: '_id', foreignField: 'user_id' },
        reviews: { ref: 'reviews', localField: '_id', foreignField: 'user_id' },
        favorites: { ref: 'favorites', localField: '_id', foreignField: 'user_id' },
        game_progress: { ref: 'game_progress', localField: '_id', foreignField: 'user_id' },
        notifications: { ref: 'notifications', localField: '_id', foreignField: 'user_id' }
      },
      artifacts: {
        heritage_site: { ref: 'heritage_sites', localField: 'heritage_site_id', foreignField: '_id', justOne: true },
        category: { ref: 'cultural_categories', localField: 'category_id', foreignField: '_id', justOne: true }
      },
      game_chapters: {
        levels: { ref: 'game_levels', localField: '_id', foreignField: 'chapter_id' }
      },
      game_levels: {
        chapter: { ref: 'game_chapters', localField: 'chapter_id', foreignField: '_id', justOne: true },
        sessions: { ref: 'game_sessions', localField: '_id', foreignField: 'level_id' }
      },
      game_sessions: {
        level: { ref: 'game_levels', localField: 'level_id', foreignField: '_id', justOne: true },
        user: { ref: 'users', localField: 'user_id', foreignField: '_id', justOne: true }
      }
    };

    this.initConnection();
    this.loadSchemasAsModels();
  }

  async initConnection() {
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(process.env.DATABASE_URL, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
        console.log('🔌 MongoDB Adapter Connected');
      } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        throw error;
      }
    }
  }

  loadSchemasAsModels() {
    const schemasDir = path.join(__dirname, '../schemas');
    const files = fs.readdirSync(schemasDir);

    // Schema mapping cho SEN project
    const modelMapping = {
      'user.schema.js': 'users',
      'heritage_site.schema.js': 'heritage_sites',
      'artifact.schema.js': 'artifacts',
      'cultural_category.schema.js': 'cultural_categories',
      'exhibition.schema.js': 'exhibitions',
      'timeline.schema.js': 'timelines',
      'collection.schema.js': 'collections',
      'favorite.schema.js': 'favorites',
      'review.schema.js': 'reviews',
      'notification.schema.js': 'notifications',
      'game_chapter.schema.js': 'game_chapters',
      'game_level.schema.js': 'game_levels',
      'game_character.schema.js': 'game_characters',
      'game_progress.schema.js': 'game_progress',
      'scan_object.schema.js': 'scan_objects',
      'shop_item.schema.js': 'shop_items'
    };

    files.forEach(file => {
      if (file === 'index.js') return;

      // Use mapping or fallback to simple 's' suffix
      const entityName = modelMapping[file] || file.replace('.schema.js', 's');

      const schemaDef = require(path.join(schemasDir, file));

      const mongooseFields = {};

      for (const [key, val] of Object.entries(schemaDef)) {
        if (key === 'custom') continue;

        let type = String;
        if (val.type === 'number') type = Number;
        if (val.type === 'boolean') type = Boolean;
        if (val.type === 'date') type = Date;
        if (val.type === 'array') type = Array;

        if (val.foreignKey) {
          type = Number;
        }

        mongooseFields[key] = {
          type: type,
          required: val.required || false,
          default: val.default,
          unique: val.unique || false
        };

        // Add enum constraint
        if (val.enum) {
          mongooseFields[key].enum = val.enum;
        }
      }

      // Keep ID as Number for frontend compatibility
      mongooseFields._id = { type: Number };

      if (!mongoose.models[entityName]) {
        const schema = new mongoose.Schema(mongooseFields, {
          timestamps: true,
          toJSON: { virtuals: true },
          toObject: { virtuals: true }
        });

        // Virtual field: _id -> id
        schema.virtual('id').get(function () {
          return this._id;
        });

        // Setup Virtuals for populate
        const rels = this.relations[entityName];
        if (rels) {
          for (const [field, config] of Object.entries(rels)) {
            // Only add virtual if it doesn't conflict with real field
            if (!mongooseFields[field]) {
              schema.virtual(field, {
                ref: config.ref,
                localField: config.localField,
                foreignField: config.foreignField,
                justOne: config.justOne || false
              });
            }
          }
        }

        this.models[entityName] = mongoose.model(entityName, schema);
      } else {
        this.models[entityName] = mongoose.models[entityName];
      }
    });
  }

  getModel(collection) {
    return this.models[collection];
  }

  // ==================== FIND ALL ADVANCED ====================
  async findAllAdvanced(collection, options = {}) {
    const Model = this.getModel(collection);
    if (!Model) {
      throw new Error(`Model not found for collection: ${collection}`);
    }

    const query = {};

    // Build query filters
    if (options.filter) {
      for (const [key, val] of Object.entries(options.filter)) {
        if (key === 'q') {
          // Full-text search
          query['$or'] = [
            { name: { $regex: val, $options: 'i' } },
            { description: { $regex: val, $options: 'i' } }
          ];
        } else if (key.endsWith('_gte')) {
          const field = key.replace('_gte', '');
          query[field] = { ...query[field], $gte: Number(val) };
        } else if (key.endsWith('_lte')) {
          const field = key.replace('_lte', '');
          query[field] = { ...query[field], $lte: Number(val) };
        } else if (key.endsWith('_ne')) {
          const field = key.replace('_ne', '');
          query[field] = { $ne: val };
        } else if (key.endsWith('_like')) {
          const field = key.replace('_like', '');
          query[field] = { $regex: val, $options: 'i' };
        } else if (key.endsWith('_in')) {
          const field = key.replace('_in', '');
          const values = typeof val === 'string' ? val.split(',') : val;
          query[field] = { $in: values };
        } else {
          query[key] = val;
        }
      }
    }

    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const skip = (page - 1) * limit;

    let queryBuilder = Model.find(query);

    // Sorting
    if (options.sort) {
      const sortFields = options.sort.split(',');
      const orders = options.order ? options.order.split(',') : [];
      const sortObj = {};

      sortFields.forEach((field, index) => {
        const order = orders[index] === 'desc' ? -1 : 1;
        sortObj[field] = order;
      });

      queryBuilder = queryBuilder.sort(sortObj);
    } else {
      queryBuilder = queryBuilder.sort({ createdAt: -1 });
    }

    // Populate relations
    if (options.embed) {
      const embedFields = options.embed.split(',');
      embedFields.forEach(field => {
        if (field !== 'items') {
          try {
            queryBuilder = queryBuilder.populate(field);
          } catch (e) {
            console.log(`Skip populate ${field}:`, e.message);
          }
        }
      });
    }

    if (options.expand) {
      const expandFields = options.expand.split(',');
      expandFields.forEach(field => {
        try {
          queryBuilder = queryBuilder.populate(field);
        } catch (e) {
          console.log(`Skip populate ${field}:`, e.message);
        }
      });
    }

    // Execute query
    const data = await queryBuilder.skip(skip).limit(limit).lean();
    const total = await Model.countDocuments(query);

    // Map _id -> id
    const mappedData = data.map(item => ({ ...item, id: item._id }));

    return {
      success: true,
      data: mappedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  // ==================== CRUD METHODS ====================
  async findAll(collection) {
    const Model = this.getModel(collection);
    const items = await Model.find().lean();
    return items.map(item => ({ ...item, id: item._id }));
  }

  async findById(collection, id) {
    const Model = this.getModel(collection);
    try {
      const item = await Model.findOne({ _id: parseInt(id) }).lean();
      if (!item) return null;
      return { ...item, id: item._id };
    } catch (e) {
      return null;
    }
  }

  async findOne(collection, query) {
    const Model = this.getModel(collection);
    try {
      const item = await Model.findOne(query).lean();
      if (!item) return null;
      return { ...item, id: item._id };
    } catch (e) {
      return null;
    }
  }

  async findMany(collection, query) {
    const Model = this.getModel(collection);
    try {
      const items = await Model.find(query).lean();
      // Map _id -> id 
      return items.map(item => ({ ...item, id: item._id }));
    } catch (e) {
      return [];
    }
  }

  async create(collection, data) {
    const Model = this.getModel(collection);

    // Auto-generate ID if not provided
    if (!data._id && !data.id) {
      data._id = Date.now() + Math.floor(Math.random() * 1000);
    } else if (data.id && !data._id) {
      // Nếu có id thì dùng id làm _id
      data._id = data.id;
    }

    try {
      const created = await Model.create(data);
      const obj = created.toObject();
      // Map _id -> id
      return { ...obj, id: obj._id };
    } catch (error) {
      console.error(`Error creating ${collection}:`, error);
      throw error;
    }
  }

  async update(collection, id, data) {
    const Model = this.getModel(collection);
    try {
      const updated = await Model.findOneAndUpdate(
        { _id: parseInt(id) },
        data,
        {
          new: true,
          runValidators: true
        }
      ).lean();

      if (!updated) return null;

      // Map _id -> id
      return { ...updated, id: updated._id };
    } catch (error) {
      console.error(`Error updating ${collection}:`, error);
      return null;
    }
  }

  async delete(collection, id) {
    const Model = this.getModel(collection);
    try {
      const deleted = await Model.findOneAndDelete({ _id: parseInt(id) });
      return deleted ? true : false;
    } catch (error) {
      console.error(`Error deleting ${collection}:`, error);
      return false;
    }
  }

  async getNextId(collection) {
    const Model = this.getModel(collection);
    try {
      const lastItem = await Model.findOne().sort({ _id: -1 }).lean();
      return lastItem ? lastItem._id + 1 : 1;
    } catch (error) {
      return Date.now();
    }
  }

  // ==================== APPLY RELATIONS ====================
  async applyRelations(items, collection, options) {
    if (!items || items.length === 0) return items;

    const Model = this.getModel(collection);
    let populatedItems = [...items];

    if (options.embed) {
      const fields = options.embed.split(',');
      for (const field of fields) {
        // Skip nếu là field thật trong schema (như items trong orders)
        if (collection === 'orders' && field === 'items') continue;

        try {
          populatedItems = await Model.populate(populatedItems, { path: field });
        } catch (e) {
          console.log('Populate error ignored:', e.message);
        }
      }
    }

    if (options.expand) {
      const fields = options.expand.split(',');
      for (const field of fields) {
        try {
          populatedItems = await Model.populate(populatedItems, { path: field });
        } catch (e) {
          console.log('Populate error ignored:', e.message);
        }
      }
    }

    return populatedItems;
  }

  // ==================== HELPER METHODS ====================

  applyFilters(items, filters) {
    return items.filter(item => {
      return Object.keys(filters).every(key => {
        if (key.endsWith('_gte')) {
          const field = key.replace('_gte', '');
          return item[field] >= filters[key];
        }
        if (key.endsWith('_lte')) {
          const field = key.replace('_lte', '');
          return item[field] <= filters[key];
        }
        if (key.endsWith('_ne')) {
          const field = key.replace('_ne', '');
          return item[field] !== filters[key];
        }
        if (key.endsWith('_like')) {
          const field = key.replace('_like', '');
          const regex = new RegExp(filters[key], 'i');
          return regex.test(item[field]);
        }
        return item[key] == filters[key];
      });
    });
  }

  // Apply pagination
  applyPagination(items, page = 1, limit = 10) {
    const total = items.length;
    const currentPage = Math.max(1, parseInt(page));
    const itemsPerPage = Math.max(1, parseInt(limit));
    const totalPages = Math.ceil(total / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
      data: items.slice(startIndex, endIndex),
      page: currentPage,
      limit: itemsPerPage,
      total,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1
    };
  }

  // Save data (for compatibility - not used in MongoDB)
  saveData() {
    return true; // No-op for MongoDB
  }
}

module.exports = new MongoAdapter();