const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const uploadService = require('./services/upload.service');

async function test() {
  console.log("Testing Cloudinary Upload...");
  console.log("Provider:", process.env.UPLOAD_PROVIDER);
  console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
  
  // We don't have a real req.file object that multer-storage-cloudinary creates.
  // When multer-storage-cloudinary uploads, req.file has:
  // {
  //   fieldname: 'file',
  //   originalname: 'test.jpg',
  //   encoding: '7bit',
  //   mimetype: 'image/jpeg',
  //   path: 'https://res.cloudinary.com/...',
  //   size: 12345,
  //   filename: 'sen_web/general/abcdefg'
  // }
  
  // If we simulate the output of CloudinaryStorage:
  const mockFile = {
    path: 'https://res.cloudinary.com/dummy/image/upload/v12345/sen_web/general/dummy.jpg',
    filename: 'sen_web/general/dummy',
    mimetype: 'image/jpeg'
  };

  try {
    const result = await uploadService.uploadGeneralFile(mockFile);
    console.log("Upload Result:", result);
  } catch(e) {
    console.error("Error:", e);
  }
}

test();
