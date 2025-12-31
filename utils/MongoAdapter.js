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
        sessions: { ref: 'game_sessions', localField: '_id', foreignField: 'level_id' },
        artifacts: { ref: 'artifacts', localField: 'artifact_ids', foreignField: '_id' },
        heritage_site: { ref: 'heritage_sites', localField: 'heritage_site_id', foreignField: '_id', justOne: true }
      },
      game_sessions: {
        level: { ref: 'game_levels', localField: 'level_id', foreignField: '_id', justOne: true },
        user: { ref: 'users', localField: 'user_id', foreignField: '_id', justOne: true }
      },
      collections: {
        user: { ref: 'users', localField: 'user_id', foreignField: '_id', justOne: true },
        artifacts: { ref: 'artifacts', localField: 'artifact_ids', foreignField: '_id' }
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

    // Kiểm tra folder tồn tại
    if (!fs.existsSync(schemasDir)) {
      console.error('❌ Schemas directory not found:', schemasDir);
      return;
    }

    const files = fs.readdirSync(schemasDir);

    // Schema mapping đầy đủ hơn
    const modelMapping = {
      'user.schema.js': 'users',
      'heritage_site.schema.js': 'heritage_sites',
      'artifact.schema.js': 'artifacts',
      'cultural_category.schema.js': 'cultural_categories',
      'category.schema.js': 'categories', // ✅ THÊM
      'exhibition.schema.js': 'exhibitions',
      'timeline.schema.js': 'timelines',
      'collection.schema.js': 'collections',
      'favorite.schema.js': 'favorites',
      'review.schema.js': 'reviews',
      'notification.schema.js': 'notifications',
      'address.schema.js': 'addresses', // ✅ THÊM
      'game_chapter.schema.js': 'game_chapters',
      'game_level.schema.js': 'game_levels',
      'game_character.schema.js': 'game_characters',
      'game_progress.schema.js': 'game_progress',
      'game_session.schema.js': 'game_sessions', // ✅ THÊM
      'user_inventory.schema.js': 'user_inventory', // ✅ THÊM
      'scan_history.schema.js': 'scan_history', // ✅ THÊM
      'game_badge.schema.js': 'game_badges', // ✅ THÊM
      'game_achievement.schema.js': 'game_achievements', // ✅ THÊM
      'scan_object.schema.js': 'scan_objects',
      'shop_item.schema.js': 'shop_items'
    };

    files.forEach(file => {
      if (file === 'index.js') return;

      const entityName = modelMapping[file];

      // Skip nếu không có mapping
      if (!entityName) {
        console.warn(`⚠️  No mapping found for schema: ${file}`);
        return;
      }

      // Try-catch để tránh crash
      try {
        const schemaDef = require(path.join(schemasDir, file));

        // Validate schema definition
        if (!schemaDef || typeof schemaDef !== 'object') {
          console.warn(`⚠️  Invalid schema definition for ${file}`);
          return;
        }

        const mongooseFields = {};

        for (const [key, val] of Object.entries(schemaDef)) {
          if (key === 'custom') continue;

          let type = String;
          if (val.type === 'number') type = Number;
          if (val.type === 'boolean') type = Boolean;
          if (val.type === 'date') type = Date;
          if (val.type === 'array') type = Array;
          if (val.type === 'object') type = mongoose.Schema.Types.Mixed; // ✅ FIX

          if (val.foreignKey) type = Number;

          mongooseFields[key] = {
            type: type,
            required: val.required || false,
            default: val.default,
            unique: val.unique || false
          };

          // Enum constraint
          if (val.enum) mongooseFields[key].enum = val.enum;

          // Min/Max validation
          if (val.min !== undefined) mongooseFields[key].min = val.min;
          if (val.max !== undefined) mongooseFields[key].max = val.max;
          if (val.minLength) mongooseFields[key].minlength = val.minLength;
          if (val.maxLength) mongooseFields[key].maxlength = val.maxLength;
        }

        // ID as Number for compatibility
        mongooseFields._id = { type: Number };

        if (!mongoose.models[entityName]) {
          const schema = new mongoose.Schema(mongooseFields, {
            timestamps: true,
            toJSON: { virtuals: true },
            toObject: { virtuals: true }
          });

          // Virtual: _id -> id
          schema.virtual('id').get(function () {
            return this._id;
          });

          // Setup Virtuals for populate
          const rels = this.relations[entityName];
          if (rels) {
            for (const [field, config] of Object.entries(rels)) {
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
          console.log(`✅ Model created: ${entityName}`);
        } else {
          this.models[entityName] = mongoose.models[entityName];
        }
      } catch (error) {
        console.error(`❌ Error loading schema ${file}:`, error.message);
      }
    });

    console.log(`📦 Total models loaded: ${Object.keys(this.models).length}`);
  }

  getModel(collection) {
    const model = this.models[collection];
    if (!model) {
      console.warn(`⚠️  Model not found: ${collection}`);
    }
    return model;
  }

  // ==================== FIND ALL ADVANCED ====================
  async findAllAdvanced(collection, options = {}) {
    const Model = this.getModel(collection);
    if (!Model) {
      throw new Error(`Model not found for collection: ${collection}`);
    }

    const query = {};

    // Full-text search ở ngoài filter
    if (options.q) {
      query['$or'] = [
        { name: { $regex: options.q, $options: 'i' } },
        { title: { $regex: options.q, $options: 'i' } },
        { description: { $regex: options.q, $options: 'i' } },
        { comment: { $regex: options.q, $options: 'i' } }
      ];
    }

    // Build query filters
    if (options.filter) {
      for (const [key, val] of Object.entries(options.filter)) {
        if (key.endsWith('_gte')) {
          const field = key.replace('_gte', '');
          query[field] = { ...query[field], $gte: Number(val) };
        } else if (key.endsWith('_lte')) {
          const field = key.replace('_lte', '');
          query[field] = { ...query[field], $lte: Number(val) };
        } else if (key.endsWith('_gt')) { // ✅ THÊM
          const field = key.replace('_gt', '');
          query[field] = { ...query[field], $gt: Number(val) };
        } else if (key.endsWith('_lt')) { // ✅ THÊM
          const field = key.replace('_lt', '');
          query[field] = { ...query[field], $lt: Number(val) };
        } else if (key.endsWith('_ne')) {
          const field = key.replace('_ne', '');
          query[field] = { $ne: val };
        } else if (key.endsWith('_like')) {
          const field = key.replace('_like', '');
          query[field] = { $regex: val, $options: 'i' };
        } else if (key.endsWith('_in')) {
          const field = key.replace('_in', '');
          const values = Array.isArray(val) ? val : val.split(',');
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

    // Populate with error handling
    if (options.embed) {
      const embedFields = options.embed.split(',');
      embedFields.forEach(field => {
        try {
          queryBuilder = queryBuilder.populate(field);
        } catch (e) {
          console.warn(`⚠️  Cannot populate ${field}:`, e.message);
        }
      });
    }

    if (options.expand) {
      const expandFields = options.expand.split(',');
      expandFields.forEach(field => {
        try {
          queryBuilder = queryBuilder.populate(field);
        } catch (e) {
          console.warn(`⚠️  Cannot populate ${field}:`, e.message);
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
    if (!Model) return [];

    const items = await Model.find().lean();
    return items.map(item => ({ ...item, id: item._id }));
  }

  async findById(collection, id) {
    const Model = this.getModel(collection);
    if (!Model) return null;

    try {
      const item = await Model.findOne({ _id: parseInt(id) }).lean();
      if (!item) return null;
      return { ...item, id: item._id };
    } catch (e) {
      console.error(`Error findById ${collection}:`, e.message);
      return null;
    }
  }

  async findOne(collection, query) {
    const Model = this.getModel(collection);
    if (!Model) return null;

    try {
      const item = await Model.findOne(query).lean();
      if (!item) return null;
      return { ...item, id: item._id };
    } catch (e) {
      console.error(`Error findOne ${collection}:`, e.message);
      return null;
    }
  }

  async findMany(collection, query) {
    const Model = this.getModel(collection);
    if (!Model) return [];

    try {
      const items = await Model.find(query).lean();
      return items.map(item => ({ ...item, id: item._id }));
    } catch (e) {
      console.error(`Error findMany ${collection}:`, e.message);
      return [];
    }
  }

  async create(collection, data) {
    const Model = this.getModel(collection);
    if (!Model) {
      throw new Error(`Model not found: ${collection}`);
    }

    // Auto-generate ID
    if (!data._id && !data.id) {
      data._id = await this.getNextId(collection);
    } else if (data.id && !data._id) {
      data._id = data.id;
    }

    try {
      const created = await Model.create(data);
      const obj = created.toObject();
      return { ...obj, id: obj._id };
    } catch (error) {
      console.error(`Error creating ${collection}:`, error);
      throw error;
    }
  }

  async update(collection, id, data) {
    const Model = this.getModel(collection);
    if (!Model) return null;

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
      return { ...updated, id: updated._id };
    } catch (error) {
      console.error(`Error updating ${collection}:`, error);
      return null;
    }
  }

  async delete(collection, id) {
    const Model = this.getModel(collection);
    if (!Model) return false;

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
    if (!Model) return Date.now();

    try {
      const lastItem = await Model.findOne().sort({ _id: -1 }).lean();
      return lastItem ? lastItem._id + 1 : 1;
    } catch (error) {
      return Date.now();
    }
  }

  // getSlice method (missing in original)
  async getSlice(collection, start, end) {
    const Model = this.getModel(collection);
    if (!Model) return { data: [], total: 0 };

    try {
      const items = await Model.find()
        .skip(start)
        .limit(end - start)
        .lean();

      const total = await Model.countDocuments();

      return {
        data: items.map(item => ({ ...item, id: item._id })),
        total
      };
    } catch (error) {
      console.error(`Error getSlice ${collection}:`, error);
      return { data: [], total: 0 };
    }
  }

  // Save data (no-op for MongoDB)
  saveData() {
    return true;
  }
}

module.exports = new MongoAdapter();