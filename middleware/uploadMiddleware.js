// const { documentUpload, profileUpload } = require('../config/multer');

// // Single document upload
// exports.uploadDocument = documentUpload.single('document');

// // Multiple documents upload
// exports.uploadMultipleDocuments = documentUpload.array('documents', 5);

// // Profile image upload
// exports.uploadProfileImage = profileUpload.single('profileImage');

// // Handle multer errors
// exports.handleUploadError = (err, req, res, next) => {
//   if (err) {
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({
//         success: false,
//         message: 'File too large. Maximum size is 5MB for documents and 2MB for profile images.'
//       });
//     }
    
//     return res.status(400).json({
//       success: false,
//       message: err.message || 'File upload failed'
//     });
//   }
//   next();
// };

// middleware/uploadMiddleware.js → YE PURA FILE REPLACE KAR DO

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create folders
['public/uploads/documents', 'public/uploads/profiles', 'public/uploads/journey', 'public/uploads/signatures'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Only images & PDF allowed!'), false);
};

const imageOnlyFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Only image files allowed!'), false);
};

// Common storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname.includes('profile')) return cb(null, 'public/uploads/profiles/');
    if (file.fieldname.includes('journey') || file.fieldname === 'image') return cb(null, 'public/uploads/journey/');
    if (file.fieldname === 'signature') return cb(null, 'public/uploads/signatures/');
    cb(null, 'public/uploads/documents/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${unique}${path.extname(file.originalname)}`);
  }
});

// Multer instance
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

const uploadImageOnly = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: imageOnlyFilter
});

// SAB KUCH EXPORT KAR DO — AB KABHI ERROR NAHI AAYEGA
module.exports = {
  // Single uploads
  uploadDocument: upload.single('document'),
  uploadProfileImage: upload.single('profileImage'),
  uploadJourneyImage: uploadImageOnly.single('image'),        
  uploadSignature: uploadImageOnly.single('signature'),     

  // Multiple
  uploadMultipleDocuments: upload.array('documents', 10),
  uploadDriverDocuments: upload.fields([
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'licenseFront', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'vehicleRC', maxCount: 1 },
    { name: 'otherDocument', maxCount: 5 }
  ]),

  // Error handler
  handleUploadError: (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'File too large!' });
      if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ success: false, message: `Invalid field: ${err.field}` });
    }
    if (err) return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
    next();
  },

  // Optional: require file
  requireFile: (field = 'file') => (req, res, next) => {
    if (!req.file && !req.files) {
      return res.status(400).json({ success: false, message: `${field} is required` });
    }
    next();
  }
};