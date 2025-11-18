const { documentUpload, profileUpload } = require('../config/multer');

// Single document upload
exports.uploadDocument = documentUpload.single('document');

// Multiple documents upload
exports.uploadMultipleDocuments = documentUpload.array('documents', 5);

// Profile image upload
exports.uploadProfileImage = profileUpload.single('profileImage');

// Handle multer errors
exports.handleUploadError = (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB for documents and 2MB for profile images.'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed'
    });
  }
  next();
};