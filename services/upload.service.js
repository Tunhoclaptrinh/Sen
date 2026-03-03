/**
 * Upload Service
 * Handles file uploads, validation, processing, and storage
 * Supports both Local Disk and Cloudinary via UPLOAD_PROVIDER environment variable.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const sharp = require('sharp');

class UploadService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../database/uploads');
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    this.allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];

    this.useCloudinary = process.env.UPLOAD_PROVIDER === 'cloudinary';

    if (this.useCloudinary) {
      this.initCloudinary();
    } else {
      this.initUploadDirs();
    }
  }

  initCloudinary() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  initUploadDirs() {
    const dirs = [
      this.uploadDir,
      path.join(this.uploadDir, 'avatars'),
      path.join(this.uploadDir, 'categories'),
      path.join(this.uploadDir, 'heritage_sites'),
      path.join(this.uploadDir, 'artifacts'),
      path.join(this.uploadDir, 'exhibitions'),
      path.join(this.uploadDir, 'game_assets'),
      path.join(this.uploadDir, 'general'),
      path.join(this.uploadDir, 'temp')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  getMulterStorage(folder = 'temp') {
    if (this.useCloudinary) {
      return new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
          folder: `sen_web/${folder}`,
          resource_type: 'auto',
        }
      });
    } else {
      return multer.diskStorage({
        destination: (req, file, cb) => {
          const destPath = path.join(this.uploadDir, folder);
          if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
          }
          cb(null, destPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
      });
    }
  }

  fileFilter(req, file, cb) {
    if (this.allowedImageTypes.includes(file.mimetype) || this.allowedAudioTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: Images & Audio`), false);
    }
  }

  getSingleUpload(fieldName = 'image', folder = 'temp') {
    return multer({
      storage: this.getMulterStorage(folder),
      fileFilter: this.fileFilter.bind(this),
      limits: { fileSize: this.maxFileSize }
    }).single(fieldName);
  }

  getMultipleUpload(fieldName = 'images', maxCount = 5, folder = 'temp') {
    return multer({
      storage: this.getMulterStorage(folder),
      fileFilter: this.fileFilter.bind(this),
      limits: { fileSize: this.maxFileSize }
    }).array(fieldName, maxCount);
  }

  async processImage(filePath, options = {}) {
    try {
      const {
        width = null,
        height = null,
        quality = 80,
        format = 'jpeg',
        fit = 'cover'
      } = options;

      const processedPath = filePath.replace(
        path.extname(filePath),
        `-processed.${format}`
      );

      let sharpInstance = sharp(filePath);

      if (width || height) {
        sharpInstance = sharpInstance.resize(width, height, { fit });
      }

      if (format === 'jpeg') sharpInstance = sharpInstance.jpeg({ quality });
      else if (format === 'png') sharpInstance = sharpInstance.png({ quality });
      else if (format === 'webp') sharpInstance = sharpInstance.webp({ quality });

      await sharpInstance.toFile(processedPath);
      fs.unlinkSync(filePath);

      return {
        success: true,
        filePath: processedPath,
        filename: path.basename(processedPath)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async _handleUpload(file, { localFolder, localPrefix, localProcessor, cloudTransform }) {
    try {
      if (!file || !file.path) throw new Error('No uploaded file provided');

      if (this.useCloudinary) {
        // file.path already has the cloudinary URL if CloudinaryStorage is used
        // But we apply transformations to create an optimized URL
        const optimizeUrl = cloudinary.url(file.filename, cloudTransform);
        return {
          success: true,
          url: optimizeUrl,
          filename: file.filename,
          path: optimizeUrl
        };
      } else {
        const isAudio = file.mimetype.startsWith('audio/');
        const ext = isAudio ? path.extname(file.originalname) : `.${localProcessor.format || 'jpeg'}`;
        const newPath = path.join(this.uploadDir, localFolder, `${localPrefix}-${Date.now()}${ext}`);

        if (isAudio) {
          fs.renameSync(file.path, newPath);
        } else {
          const result = await this.processImage(file.path, localProcessor);
          if (!result.success) throw new Error(result.error);
          fs.renameSync(result.filePath, newPath);
        }

        const url = `/uploads/${localFolder}/${path.basename(newPath)}`;
        return {
          success: true,
          url,
          filename: path.basename(newPath),
          path: newPath
        };
      }
    } catch (error) {
      if (this.useCloudinary) {
        if (file && file.filename) await cloudinary.uploader.destroy(file.filename);
      } else {
        if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  async uploadAvatar(file, userId) {
    return this._handleUpload(file, {
      localFolder: 'avatars',
      localPrefix: `user-${userId}`,
      localProcessor: { width: 200, height: 200, quality: 85, format: 'jpeg', fit: 'cover' },
      cloudTransform: { width: 200, height: 200, crop: 'fill', quality: 85, format: 'jpg' }
    });
  }

  async uploadCategoryImage(file, categoryId) {
    return this._handleUpload(file, {
      localFolder: 'categories',
      localPrefix: `category-${categoryId}`,
      localProcessor: { width: 400, height: 300, quality: 80, format: 'jpeg' },
      cloudTransform: { width: 400, height: 300, crop: 'fill', quality: 80, format: 'jpg' }
    });
  }

  async uploadHeritageSiteImage(file, siteId) {
    return this._handleUpload(file, {
      localFolder: 'heritage_sites',
      localPrefix: `site-${siteId}`,
      localProcessor: { width: 800, height: 600, quality: 85, format: 'jpeg' },
      cloudTransform: { width: 800, height: 600, crop: 'fill', quality: 85, format: 'jpg' }
    });
  }

  async uploadArtifactImage(file, artifactId) {
    return this._handleUpload(file, {
      localFolder: 'artifacts',
      localPrefix: `artifact-${artifactId}`,
      localProcessor: { width: 800, height: 800, fit: 'inside', quality: 85, format: 'jpeg' },
      cloudTransform: { width: 800, height: 800, crop: 'fit', quality: 85, format: 'jpg' }
    });
  }

  async uploadExhibitionImage(file, exhibitionId) {
    return this._handleUpload(file, {
      localFolder: 'exhibitions',
      localPrefix: `exhibition-${exhibitionId}`,
      localProcessor: { width: 1200, height: 600, quality: 85, format: 'jpeg' },
      cloudTransform: { width: 1200, height: 600, crop: 'fill', quality: 85, format: 'jpg' }
    });
  }

  async uploadGeneralFile(file) {
    return this._handleUpload(file, {
      localFolder: 'general',
      localPrefix: 'file',
      localProcessor: { width: 1200, height: 1200, fit: 'inside', quality: 85, format: 'jpeg' },
      cloudTransform: { width: 1200, height: 1200, crop: 'fit', quality: 85, format: 'jpg' }
    });
  }

  async uploadGameAsset(file, type, id) {
    return this._handleUpload(file, {
      localFolder: 'game_assets',
      localPrefix: `${type}-${id}`,
      localProcessor: { width: 512, height: 512, fit: 'inside', quality: 90, format: 'png' },
      cloudTransform: { width: 512, height: 512, crop: 'fit', quality: 90, format: 'png' }
    });
  }

  async deleteFile(url) {
    try {
      if (this.useCloudinary && url.includes('cloudinary.com')) {
        const parts = url.split('/');
        const filenameWithExt = parts[parts.length - 1];
        const filename = filenameWithExt.split('.')[0];
        const folder = parts[parts.length - 2];
        const publicId = `sen_web/${folder}/${filename}`;
        
        await cloudinary.uploader.destroy(publicId);
        return { success: true, message: 'Cloudinary file deleted' };
      } else {
        const filename = url.split('/').pop();
        const folder = url.split('/').slice(-2, -1)[0];
        const filePath = path.join(this.uploadDir, folder, filename);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          return { success: true, message: 'Local file deleted' };
        }
        return { success: false, message: 'Local file not found' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getFileInfo(url) {
    if (this.useCloudinary && url.includes('cloudinary.com')) {
      return { success: true, data: { url, storedIn: 'cloudinary' } };
    }
    
    try {
      const filename = url.split('/').pop();
      const folder = url.split('/').slice(-2, -1)[0];
      const filePath = path.join(this.uploadDir, folder, filename);

      if (!fs.existsSync(filePath)) {
        return { success: false, message: 'File not found' };
      }

      const stats = fs.statSync(filePath);
      return {
        success: true,
        data: { filename, size: stats.size, created: stats.birthtime, modified: stats.mtime, path: filePath }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async cleanupOldFiles(days = 30) {
    if (this.useCloudinary) {
      return { success: true, message: 'Cloudinary manages old files via retention policies.' };
    }

    const folders = ['avatars', 'products', 'restaurants', 'categories', 'temp'];
    const now = Date.now();
    const maxAge = days * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const folder of folders) {
      const folderPath = path.join(this.uploadDir, folder);
      if (!fs.existsSync(folderPath)) continue;
      
      const files = fs.readdirSync(folderPath);
      for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    }

    return { success: true, message: `Deleted ${deletedCount} old files`, deletedCount };
  }

  async getStorageStats() {
    if (this.useCloudinary) {
      return { success: true, data: { message: 'Cloudinary stats not retrieved.' } };
    }

    const folders = ['avatars', 'products', 'restaurants', 'categories', 'temp'];
    const stats = { totalSize: 0, totalFiles: 0, byFolder: {} };

    for (const folder of folders) {
      const folderPath = path.join(this.uploadDir, folder);
      if (!fs.existsSync(folderPath)) continue;

      const files = fs.readdirSync(folderPath);
      let folderSize = 0;
      for (const file of files) {
        folderSize += fs.statSync(path.join(folderPath, file)).size;
      }

      stats.byFolder[folder] = {
        files: files.length,
        size: folderSize,
        sizeFormatted: this.formatBytes(folderSize)
      };

      stats.totalFiles += files.length;
      stats.totalSize += folderSize;
    }

    stats.totalSizeFormatted = this.formatBytes(stats.totalSize);
    return { success: true, data: stats };
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

module.exports = new UploadService();