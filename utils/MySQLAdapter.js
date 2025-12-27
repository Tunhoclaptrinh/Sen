const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

class MySQLAdapter {
  constructor() {
    this.pool = null;
    this.schemas = {};

    // JSONB fields that should NOT be converted
    this.jsonFields = ['items', 'screens', 'clues', 'quizzes', 'rewards',
      'unlocked_chapters', 'completed_levels', 'collected_characters',
      'badges', 'achievements', 'artifact_ids', 'collected_items',
      'answered_questions', 'timeline_order', 'completed_screens'];

    this.relations = {
      heritage_sites: {
        artifacts: { ref: 'artifacts', localField: 'id', foreignField: 'heritage_site_id' },
        reviews: { ref: 'reviews', localField: 'id', foreignField: 'heritage_site_id' },
        timelines: { ref: 'timelines', localField: 'id', foreignField: 'heritage_site_id' }
      },
      users: {
        collections: { ref: 'collections', localField: 'id', foreignField: 'user_id' },
        game_progress: { ref: 'game_progress', localField: 'id', foreignField: 'user_id' }
      },
      game_chapters: {
        levels: { ref: 'game_levels', localField: 'id', foreignField: 'chapter_id' }
      },
      game_levels: {
        chapter: { ref: 'game_chapters', localField: 'chapter_id', foreignField: 'id', justOne: true },
        sessions: { ref: 'game_sessions', localField: 'id', foreignField: 'level_id' }
      }
    };

    this.initConnection();
    this.loadSchemas();
  }

  async initConnection() {
    try {
      let config;

      if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        config = {
          host: url.hostname,
          port: url.port || 3306,
          user: url.username,
          password: url.password,
          database: url.pathname.slice(1),
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          timezone: '+00:00',
          dateStrings: false
        };
      } else {
        config = {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 3306,
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || 'sen_heritage',
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          timezone: '+00:00',
          dateStrings: false
        };
      }

      this.pool = mysql.createPool(config);
      const connection = await this.pool.getConnection();
      console.log('🐬 MySQL Adapter Connected');
      connection.release();

      await this.createTables();
    } catch (error) {
      console.error('❌ MySQL Connection Error:', error);
      throw error;
    }
  }

  loadSchemas() {
    const schemasDir = path.join(__dirname, '../schemas');
    if (!fs.existsSync(schemasDir)) return;

    const files = fs.readdirSync(schemasDir);
    files.forEach(file => {
      if (file === 'index.js') return;
      const entityName = file.replace('.schema.js', 's');
      const schemaDef = require(path.join(schemasDir, file));
      this.schemas[entityName] = schemaDef;
    });
  }

  async createTables() {
    const connection = await this.pool.getConnection();

    try {
      // Users table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(15),
          avatar TEXT,
          role VARCHAR(20) DEFAULT 'customer',
          bio TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          last_login DATETIME NULL,
          INDEX idx_email (email),
          INDEX idx_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Cultural Categories table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS cultural_categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL,
          icon VARCHAR(10),
          image TEXT,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Heritage Sites table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS heritage_sites (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(200) UNIQUE NOT NULL,
          description TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          cultural_period VARCHAR(100),
          region VARCHAR(100),
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          address VARCHAR(300),
          year_established INT,
          year_restored INT,
          image TEXT,
          gallery JSON,
          rating DECIMAL(2, 1) DEFAULT 0,
          total_reviews INT DEFAULT 0,
          visit_hours VARCHAR(50),
          entrance_fee INT DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          unesco_listed BOOLEAN DEFAULT false,
          significance VARCHAR(20) DEFAULT 'local',
          historical_events JSON,
          legends JSON,
          visit_count INT DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_type (type),
          INDEX idx_region (region),
          INDEX idx_location (latitude, longitude),
          INDEX idx_rating (rating)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Artifacts table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS artifacts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          description TEXT NOT NULL,
          heritage_site_id INT,
          category_id INT,
          artifact_type VARCHAR(50),
          year_created INT,
          year_discovered INT,
          creator VARCHAR(200),
          material VARCHAR(200),
          dimensions VARCHAR(100),
          weight DECIMAL(10, 2),
          \`condition\` VARCHAR(20) DEFAULT 'fair',
          image TEXT,
          is_on_display BOOLEAN DEFAULT true,
          location_in_site VARCHAR(200),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (heritage_site_id) REFERENCES heritage_sites(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES cultural_categories(id),
          INDEX idx_heritage_site (heritage_site_id),
          INDEX idx_category (category_id),
          INDEX idx_type (artifact_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Game Chapters table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS game_chapters (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          description TEXT,
          theme VARCHAR(200),
          \`order\` INT NOT NULL,
          layer_index INT NOT NULL,
          petal_state VARCHAR(20) DEFAULT 'locked',
          required_petals INT DEFAULT 0,
          thumbnail TEXT,
          color VARCHAR(20) DEFAULT '#D35400',
          is_active BOOLEAN DEFAULT true,
          petal_image_closed TEXT,
          petal_image_bloom TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_order (\`order\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Game Levels table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS game_levels (
          id INT AUTO_INCREMENT PRIMARY KEY,
          chapter_id INT NOT NULL,
          name VARCHAR(150) NOT NULL,
          description TEXT,
          type VARCHAR(20) NOT NULL,
          difficulty VARCHAR(20) DEFAULT 'medium',
          \`order\` INT NOT NULL,
          required_level INT,
          background_image TEXT,
          background_music TEXT,
          ai_character_id INT,
          knowledge_base TEXT,
          screens JSON NOT NULL,
          clues JSON,
          quizzes JSON,
          artifact_ids JSON,
          heritage_site_id INT,
          rewards JSON,
          time_limit INT,
          passing_score INT DEFAULT 70,
          thumbnail TEXT,
          is_active BOOLEAN DEFAULT true,
          created_by INT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (chapter_id) REFERENCES game_chapters(id) ON DELETE CASCADE,
          FOREIGN KEY (heritage_site_id) REFERENCES heritage_sites(id),
          FOREIGN KEY (ai_character_id) REFERENCES game_characters(id),
          INDEX idx_chapter (chapter_id),
          INDEX idx_order (\`order\`),
          INDEX idx_type (type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Game Characters table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS game_characters (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          persona TEXT NOT NULL,
          speaking_style TEXT NOT NULL,
          avatar TEXT,
          avatar_uncolored TEXT,
          avatar_locked TEXT,
          avatar_unlocked TEXT,
          rarity VARCHAR(20) DEFAULT 'common',
          origin VARCHAR(200),
          is_collectible BOOLEAN DEFAULT true,
          persona_amnesia TEXT,
          persona_restored TEXT,
          museum_interaction TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Game Progress table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS game_progress (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT UNIQUE NOT NULL,
          current_chapter INT DEFAULT 1,
          total_sen_petals INT DEFAULT 0,
          total_points INT DEFAULT 0,
          level INT DEFAULT 1,
          coins INT DEFAULT 1000,
          unlocked_chapters JSON,
          completed_levels JSON,
          collected_characters JSON,
          badges JSON,
          achievements JSON,
          museum_open BOOLEAN DEFAULT false,
          museum_income INT DEFAULT 0,
          last_museum_collection DATETIME,
          streak_days INT DEFAULT 0,
          last_login DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Game Sessions table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS game_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          level_id INT NOT NULL,
          status VARCHAR(20) DEFAULT 'in_progress',
          current_screen_id VARCHAR(50),
          current_screen_index INT DEFAULT 0,
          collected_items JSON,
          answered_questions JSON,
          timeline_order JSON,
          score INT DEFAULT 0,
          total_screens INT DEFAULT 0,
          completed_screens JSON,
          screen_states JSON,
          time_spent INT DEFAULT 0,
          hints_used INT DEFAULT 0,
          started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (level_id) REFERENCES game_levels(id) ON DELETE CASCADE,
          INDEX idx_user (user_id),
          INDEX idx_level (level_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Other tables (collections, favorites, reviews, etc.)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS collections (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          name VARCHAR(150) NOT NULL,
          description TEXT,
          artifact_ids JSON,
          heritage_site_ids JSON,
          exhibition_ids JSON,
          total_items INT DEFAULT 0,
          is_public BOOLEAN DEFAULT false,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS favorites (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          type VARCHAR(20) NOT NULL,
          reference_id INT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_favorite (user_id, type, reference_id),
          INDEX idx_user (user_id),
          INDEX idx_type (type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          type VARCHAR(20) NOT NULL,
          heritage_site_id INT,
          artifact_id INT,
          rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (heritage_site_id) REFERENCES heritage_sites(id) ON DELETE CASCADE,
          FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE,
          INDEX idx_user (user_id),
          INDEX idx_heritage_site (heritage_site_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      console.log('✅ MySQL tables created/verified');
    } catch (error) {
      console.error('❌ Error creating tables:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // ==================== CONVERSION METHODS ====================

  toMySQLDateTime(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return null;

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  fromMySQLDateTime(value) {
    if (!value) return null;
    const date = new Date(value);
    return date.toISOString();
  }

  isJsonField(key) {
    return this.jsonFields.includes(key);
  }

  toCamelCase(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.toCamelCase(item));

    const camelObj = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

      if ((key.endsWith('_at') || key === 'last_login') && value) {
        camelObj[camelKey] = this.fromMySQLDateTime(value);
      } else if (this.isJsonField(camelKey) && typeof value === 'string') {
        try {
          camelObj[camelKey] = JSON.parse(value);
        } catch (e) {
          camelObj[camelKey] = value;
        }
      } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        camelObj[camelKey] = this.toCamelCase(value);
      } else {
        camelObj[camelKey] = value;
      }
    }
    return camelObj;
  }

  toSnakeCase(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.toSnakeCase(item));

    const snakeObj = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

      if (value instanceof Date) {
        snakeObj[snakeKey] = this.toMySQLDateTime(value);
      } else if ((key.endsWith('At') || key === 'lastLogin') && value) {
        snakeObj[snakeKey] = this.toMySQLDateTime(value);
      } else if (this.isJsonField(key)) {
        snakeObj[snakeKey] = value;
      } else if (value && typeof value === 'object' && !Array.isArray(value) && !this.isJsonField(key)) {
        snakeObj[snakeKey] = this.toSnakeCase(value);
      } else {
        snakeObj[snakeKey] = value;
      }
    }
    return snakeObj;
  }

  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // ==================== CRUD METHODS ====================

  async findAll(collection) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.query(`SELECT * FROM ${collection} ORDER BY id`);
      return rows.map(row => this.toCamelCase(row));
    } catch (error) {
      console.error('❌ findAll error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async findById(collection, id) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.query(`SELECT * FROM ${collection} WHERE id = ?`, [id]);
      return rows[0] ? this.toCamelCase(rows[0]) : null;
    } catch (error) {
      console.error('❌ findById error:', error);
      return null;
    } finally {
      connection.release();
    }
  }

  async findOne(collection, query) {
    const connection = await this.pool.getConnection();
    try {
      const snakeQuery = this.toSnakeCase(query);
      const conditions = Object.keys(snakeQuery).map(key => `${key} = ?`);
      const values = Object.values(snakeQuery);

      const sql = `SELECT * FROM ${collection} WHERE ${conditions.join(' AND ')} LIMIT 1`;
      const [rows] = await connection.query(sql, values);

      return rows[0] ? this.toCamelCase(rows[0]) : null;
    } catch (error) {
      console.error('❌ findOne error:', error);
      return null;
    } finally {
      connection.release();
    }
  }

  async findMany(collection, query) {
    const connection = await this.pool.getConnection();
    try {
      const snakeQuery = this.toSnakeCase(query);

      if (Object.keys(snakeQuery).length === 0) {
        const [rows] = await connection.query(`SELECT * FROM ${collection}`);
        return rows.map(row => this.toCamelCase(row));
      }

      const conditions = Object.keys(snakeQuery).map(key => `${key} = ?`);
      const values = Object.values(snakeQuery);

      const sql = `SELECT * FROM ${collection} WHERE ${conditions.join(' AND ')}`;
      const [rows] = await connection.query(sql, values);

      return rows.map(row => this.toCamelCase(row));
    } catch (error) {
      console.error('❌ findMany error:', error);
      return [];
    } finally {
      connection.release();
    }
  }

  async create(collection, data) {
    const connection = await this.pool.getConnection();
    try {
      const snakeData = this.toSnakeCase(data);
      delete snakeData.id;

      const keys = Object.keys(snakeData);
      const values = Object.values(snakeData).map(val => {
        if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
          return JSON.stringify(val);
        }
        return val;
      });
      const placeholders = keys.map(() => '?');

      const sql = `INSERT INTO ${collection} (${keys.join(', ')}) VALUES (${placeholders.join(', ')})`;
      const [result] = await connection.query(sql, values);

      const [rows] = await connection.query(`SELECT * FROM ${collection} WHERE id = ?`, [result.insertId]);
      return this.toCamelCase(rows[0]);
    } catch (error) {
      console.error('❌ create error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async update(collection, id, data) {
    const connection = await this.pool.getConnection();
    try {
      const snakeData = this.toSnakeCase(data);
      delete snakeData.id;
      snakeData.updated_at = this.toMySQLDateTime(new Date());

      const keys = Object.keys(snakeData);
      const values = Object.values(snakeData).map(val => {
        if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
          return JSON.stringify(val);
        }
        return val;
      });
      const setClauses = keys.map(key => `${key} = ?`);

      const sql = `UPDATE ${collection} SET ${setClauses.join(', ')} WHERE id = ?`;
      await connection.query(sql, [...values, id]);

      const [rows] = await connection.query(`SELECT * FROM ${collection} WHERE id = ?`, [id]);
      return rows[0] ? this.toCamelCase(rows[0]) : null;
    } catch (error) {
      console.error('❌ update error:', error);
      return null;
    } finally {
      connection.release();
    }
  }

  async delete(collection, id) {
    const connection = await this.pool.getConnection();
    try {
      const [result] = await connection.query(`DELETE FROM ${collection} WHERE id = ?`, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ delete error:', error);
      return false;
    } finally {
      connection.release();
    }
  }

  async getNextId(collection) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.query(`SELECT MAX(id) as max_id FROM ${collection}`);
      return (rows[0].max_id || 0) + 1;
    } catch (error) {
      console.error('❌ getNextId error:', error);
      return Date.now();
    } finally {
      connection.release();
    }
  }

  async findAllAdvanced(collection, options = {}) {
    const connection = await this.pool.getConnection();

    try {
      const { filter = {}, page = 1, limit = 10, sort, order = 'asc', q } = options;

      let query = `SELECT * FROM ${collection} WHERE 1=1`;
      const params = [];

      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          if (key.endsWith('_gte')) {
            const field = this.camelToSnake(key.replace('_gte', ''));
            query += ` AND ${field} >= ?`;
            params.push(value);
          } else if (key.endsWith('_lte')) {
            const field = this.camelToSnake(key.replace('_lte', ''));
            query += ` AND ${field} <= ?`;
            params.push(value);
          } else if (key.endsWith('_ne')) {
            const field = this.camelToSnake(key.replace('_ne', ''));
            query += ` AND ${field} != ?`;
            params.push(value);
          } else if (key.endsWith('_like')) {
            const field = this.camelToSnake(key.replace('_like', ''));
            query += ` AND ${field} LIKE ?`;
            params.push(`%${value}%`);
          } else if (key.endsWith('_in')) {
            const field = this.camelToSnake(key.replace('_in', ''));
            const values = typeof value === 'string' ? value.split(',') : value;
            query += ` AND ${field} IN (${values.map(() => '?').join(',')})`;
            params.push(...values);
          } else {
            const snakeKey = this.camelToSnake(key);
            query += ` AND ${snakeKey} = ?`;
            params.push(value);
          }
        }
      }

      if (q) {
        query += ` AND (name LIKE ? OR description LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`);
      }

      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
      const [countResult] = await connection.query(countQuery, params);
      const total = countResult[0].count;

      if (sort) {
        const sortFields = sort.split(',');
        const orders = order.split(',');
        const sortClauses = sortFields.map((field, idx) => {
          const snakeField = this.camelToSnake(field);
          return `${snakeField} ${(orders[idx] || 'asc').toUpperCase()}`;
        });
        query += ` ORDER BY ${sortClauses.join(', ')}`;
      } else {
        query += ` ORDER BY created_at DESC`;
      }

      const offset = (page - 1) * limit;
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [rows] = await connection.query(query, params);
      const data = rows.map(row => this.toCamelCase(row));

      return {
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('❌ findAllAdvanced error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  saveData() {
    return true; // No-op for MySQL
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = new MySQLAdapter();