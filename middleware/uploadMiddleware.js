////////////////////////////////////////////////////working

// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Create upload directories
// ['public/uploads/documents', 'public/uploads/profiles', 'public/uploads/journey', 'public/uploads/signatures', 'public/uploads/maintenance'].forEach(dir => {
//   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
// });

// // File filters
// const fileFilter = (req, file, cb) => {
//   const allowed = /jpeg|jpg|png|pdf/;
//   const ext = allowed.test(path.extname(file.originalname).toLowerCase());
//   const mime = allowed.test(file.mimetype);
//   if (ext && mime) cb(null, true);
//   else cb(new Error('Only images (jpeg, jpg, png) & PDF allowed!'), false);
// };

// const imageOnlyFilter = (req, file, cb) => {
//   const allowed = /jpeg|jpg|png/;
//   const ext = allowed.test(path.extname(file.originalname).toLowerCase());
//   const mime = allowed.test(file.mimetype);
//   if (ext && mime) cb(null, true);
//   else cb(new Error('Only image files (jpeg, jpg, png) allowed!'), false);
// };

// // Storage configuration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     let folder = 'public/uploads/documents/';
//     if (file.fieldname.includes('profile')) folder = 'public/uploads/profiles/';
//     if (file.fieldname.includes('journey') || file.fieldname === 'image') folder = 'public/uploads/journey/';
//     if (file.fieldname === 'signature') folder = 'public/uploads/signatures/';
//     if (['invoice', 'receipt', 'before_photo', 'after_photo', 'report', 'warranty'].includes(file.fieldname)) {
//       folder = 'public/uploads/maintenance/';
//     }
//     cb(null, folder);
//   },
//   filename: (req, file, cb) => {
//     const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, `${file.fieldname}-${unique}${path.extname(file.originalname)}`);
//   }
// });

// // Multer instances
// const upload = multer({
//   storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
//   fileFilter
// });

// const uploadImageOnly = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for images
//   fileFilter: imageOnlyFilter
// });

// module.exports = {
//   uploadDocument: upload.single('document'),
//   uploadProfileImage: upload.single('profileImage'),
//   uploadJourneyImage: uploadImageOnly.single('image'),
//   uploadSignature: uploadImageOnly.single('signature'),

//   uploadMultipleDocuments: upload.array('documents', 15),

//   // Driver document upload
//   uploadDriverDocuments: upload.fields([
//     { name: 'aadhaarFront', maxCount: 1 },
//     { name: 'licenseFront', maxCount: 1 },
//     { name: 'panCard', maxCount: 1 },
//     { name: 'vehicleRC', maxCount: 1 },
//     { name: 'otherDocument', maxCount: 5 }
//   ]),

//   uploadMaintenanceDocuments: upload.fields([
//     { name: 'invoice', maxCount: 5 },
//     { name: 'receipt', maxCount: 5 },
//     { name: 'before_photo', maxCount: 10 },
//     { name: 'after_photo', maxCount: 10 },
//     { name: 'report', maxCount: 5 },
//     { name: 'warranty', maxCount: 5 }
//   ]),

//   // Error handler
//   handleUploadError: (err, req, res, next) => {
//     if (err instanceof multer.MulterError) {
//       if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'File too large! Max 10MB allowed.' });
//       if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ success: false, message: `Invalid field: ${err.field}` });
//     }
//     if (err) return res.status(400).json({ success: false, message: err.message || 'Upload failed!' });
//     next();
//   },

//   // Require file middleware
//   requireFile: (field = 'file') => (req, res, next) => {
//     if (!req.file && !req.files) {
//       return res.status(400).json({ success: false, message: `${field} is required` });
//     }
//     next();
//   }
// };

///////////////////////////////////////////////////////////////////////////

// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// [
//   'public/uploads/documents',
//   'public/uploads/profiles',
//   'public/uploads/journey',
//   'public/uploads/signatures',
//   'public/uploads/maintenance',
//   'public/uploads/expenses'
// ].forEach(dir => {
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//   }
// });

// // File filters
// const fileFilter = (req, file, cb) => {
//   const allowed = /jpeg|jpg|png|pdf/;
//   const ext = allowed.test(path.extname(file.originalname).toLowerCase());
//   const mime = allowed.test(file.mimetype);
//   if (ext && mime) cb(null, true);
//   else cb(new Error('Only images (jpeg, jpg, png) & PDF allowed!'), false);
// };

// const imageOnlyFilter = (req, file, cb) => {
//   const allowed = /jpeg|jpg|png/;
//   const ext = allowed.test(path.extname(file.originalname).toLowerCase());
//   const mime = allowed.test(file.mimetype);
//   if (ext && mime) cb(null, true);
//   else cb(new Error('Only image files (jpeg, jpg, png) allowed!'), false);
// };

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     let folder = 'public/uploads/documents/';

//     if (file.fieldname.includes('profile')) folder = 'public/uploads/profiles/';
//     if (file.fieldname.includes('journey') || file.fieldname === 'image') folder = 'public/uploads/journey/';
//     if (file.fieldname === 'signature') folder = 'public/uploads/signatures/';

//     // Maintenance documents
//     if (['invoice', 'receipt', 'before_photo', 'after_photo', 'report', 'warranty'].includes(file.fieldname)) {
//       folder = 'public/uploads/maintenance/';
//     }

//     if (['fuel_receipt', 'meter_photo', 'vehicle_photo'].includes(file.fieldname)) {
//       folder = 'public/uploads/expenses/';
//     }

//     cb(null, folder);
//   },
//   filename: (req, file, cb) => {
//     const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, `${file.fieldname}-${unique}${path.extname(file.originalname)}`);
//   }
// });

// // Multer instances
// const upload = multer({
//   storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
//   fileFilter
// });

// const uploadImageOnly = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: imageOnlyFilter
// });

// module.exports = {
//   // Single uploads
//   uploadDocument: upload.single('document'),
//   uploadProfileImage: upload.single('profileImage'),
//   uploadJourneyImage: uploadImageOnly.single('image'),
//   uploadSignature: uploadImageOnly.single('signature'),

//   // Multiple
//   uploadMultipleDocuments: upload.array('documents', 15),

//   // Driver documents
//   uploadDriverDocuments: upload.fields([
//     { name: 'aadhaarFront', maxCount: 1 },
//     { name: 'licenseFront', maxCount: 1 },
//     { name: 'panCard', maxCount: 1 },
//     { name: 'vehicleRC', maxCount: 1 },
//     { name: 'otherDocument', maxCount: 5 }
//   ]),

//   // Maintenance documents
//   uploadMaintenanceDocuments: upload.fields([
//     { name: 'invoice', maxCount: 5 },
//     { name: 'receipt', maxCount: 5 },
//     { name: 'before_service_photo', maxCount: 10 },
//     { name: 'after_service_photo', maxCount: 10 },
//     { name: 'report', maxCount: 5 },
//     { name: 'warranty', maxCount: 5 },
//     { name: 'service_receipt', maxCount: 1 }
//   ]),

//   uploadExpenseReceipts: upload.fields([
//     { name: 'fuel_receipt', maxCount: 1 },
//     { name: 'meter_photo', maxCount: 1 },
//     { name: 'vehicle_photo', maxCount: 1 }
//   ]),

//   // Error handler
//   handleUploadError: (err, req, res, next) => {
//     if (err instanceof multer.MulterError) {
//       if (err.code === 'LIMIT_FILE_SIZE') {
//         return res.status(400).json({ success: false, message: 'File too large! Max 10MB' });
//       }
//       if (err.code === 'LIMIT_UNEXPECTED_FILE') {
//         return res.status(400).json({ success: false, message: `Invalid field: ${err.field}` });
//       }
//     }
//     if (err) return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
//     next();
//   },

//   // Require file
//   requireFile: (field = 'file') => (req, res, next) => {
//     if (!req.file && !req.files) {
//       return res.status(400).json({ success: false, message: `${field} is required` });
//     }
//     next();
//   }
// };


const multer = require('multer');
const path = require('path');
const fs = require('fs');
[
  'public/uploads/documents',
  'public/uploads/profiles',
  'public/uploads/journey',
  'public/uploads/signatures',
  'public/uploads/maintenance',
  'public/uploads/expenses',
  'public/uploads/onboarding'
].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// COMMON FILE FILTERS

const allowImagesAndPdf = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Only images (jpg, png) & PDF allowed!'), false);
};

const allowImagesOnly = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Only image files allowed!'), false);
};

const allowOnboardingMedia = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/webm'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only images & videos (mp4, mov, webm) allowed for onboarding!'), false);
};


// DYNAMIC STORAGE (Smart Folder Detection)

const smartStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'public/uploads/documents/';

    if (file.fieldname.includes('profile')) folder = 'public/uploads/profiles/';
    if (file.fieldname.includes('journey') || file.fieldname === 'image') folder = 'public/uploads/journey/';
    if (file.fieldname === 'signature') folder = 'public/uploads/signatures/';
    if (['invoice', 'receipt', 'before_photo', 'after_photo', 'report', 'warranty', 'before_service_photo', 'after_service_photo', 'service_receipt'].includes(file.fieldname)) {
      folder = 'public/uploads/maintenance/';
    }
    if (['fuel_receipt', 'meter_photo', 'vehicle_photo'].includes(file.fieldname)) {
      folder = 'public/uploads/expenses/';
    }
    if (file.fieldname === 'media' && req.path.includes('onboarding')) {
      folder = 'public/uploads/onboarding/';
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${unique}${path.extname(file.originalname)}`);
  }
});

// ONBOARDING SPECIFIC STORAGE (Clean & Dedicated)

const onboardingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/onboarding/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `onboarding-${unique}${path.extname(file.originalname)}`);
  }
});

// MULTER INSTANCES

const upload = multer({
  storage: smartStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: allowImagesAndPdf
});

const uploadImageOnly = multer({
  storage: smartStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: allowImagesOnly
});

const uploadOnboarding = multer({
  storage: onboardingStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB (for video)
  fileFilter: allowOnboardingMedia
});

// EXPORTS — SAB KUCH YAHAN SE USE HOGA!

module.exports = {
  // General Uploads
  uploadDocument: upload.single('document'),
  uploadProfileImage: upload.single('profileImage'),
  uploadJourneyImage: uploadImageOnly.single('image'),
  uploadEndJourneyImage: upload.array("photos", 10),
  uploadSignature: uploadImageOnly.single('signature'),
  uploadMultipleDocuments: upload.array('documents', 15),

  // Driver Documents
  uploadDriverDocuments: upload.fields([
    { name: 'licenseFront', maxCount: 1 },
    { name: 'licenseBack', maxCount: 1 },
    { name: 'rcFront', maxCount: 1 },
    { name: 'rcBack', maxCount: 1 },
    // { name: 'aadhaarFront', maxCount: 1 },
    // { name: 'panCard', maxCount: 1 },
    // { name: 'otherDocument', maxCount: 5 }
  ]),

  // Maintenance Documents
  uploadMaintenanceDocuments: upload.fields([
    { name: 'invoice', maxCount: 5 },
    { name: 'receipt', maxCount: 5 },
    { name: 'before_service_photo', maxCount: 10 },
    { name: 'after_service_photo', maxCount: 10 },
    { name: 'report', maxCount: 5 },
    { name: 'warranty', maxCount: 5 },
    { name: 'service_receipt', maxCount: 1 }
  ]),

  // Expense Receipts
  uploadExpenseReceipts: upload.fields([
    { name: 'fuel_receipt', maxCount: 1 },
    { name: 'meter_photo', maxCount: 1 },
    { name: 'expense_bill', maxCount: 1 },
    { name: 'vehicle_photo', maxCount: 1 }
  ]),

  // ONBOARDING (SPLASH + TUTORIAL)
  uploadOnboardingMedia: uploadOnboarding.single('media'),

  // Error Handler (Use in Routes)
  handleUploadError: (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large!' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ success: false, message: `Invalid field: ${err.field}` });
      }
    }
    if (err) return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
    next();
  },

  // Require File Middleware
  requireFile: (field = 'file') => (req, res, next) => {
    if (!req.file && !req.files?.[field]) {
      return res.status(400).json({ success: false, message: `${field} is required` });
    }
    next();
  }
};