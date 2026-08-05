const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directory exists
const ensureDirectoryExistence = (dirPath) => {
  if (fs.existsSync(dirPath)) {
    return true;
  }
  ensureDirectoryExistence(path.dirname(dirPath));
  fs.mkdirSync(dirPath);
};

// Configure storage for user profile images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'public/uploads/misc';
    
    if (file.fieldname === 'profileImage') {
      folder = 'public/uploads/users/profileImages';
    }

    const fullPath = path.join(process.cwd(), folder);
    ensureDirectoryExistence(fullPath);
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = uploadMiddleware;
