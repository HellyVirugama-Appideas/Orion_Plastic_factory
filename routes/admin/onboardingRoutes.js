// const express = require('express');
// const router = express.Router();
// const onboardingController = require('../../controllers/admin/onboardingController');
// const { protectAdmin, isAdmin } = require('../../middleware/authMiddleware');
// const multer = require('multer');
// const path = require('path');

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/uploads/onboarding/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, 'onboarding-' + Date.now() + path.extname(file.originalname));
//   }
// }); 

// const upload = multer({
//   storage,
//   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
//   fileFilter: (req, file, cb) => {
//     const allowed = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
//     if (allowed.includes(file.mimetype)) cb(null, true);
//     else cb(new Error('Invalid file type'));
//   }
// });

// router.post('/add',  upload.single('media'), onboardingController.addOrUpdateScreen);
// router.get('/list',  onboardingController.getAdminScreens);
// router.put('/:id',  upload.single('media'), onboardingController.updateScreen);
// router.delete('/:id',  onboardingController.deleteScreen);

// // Public API for Mobile App
// router.get('/public', onboardingController.getAllScreens);

// module.exports = router;



const express = require('express');
const router = express.Router();
const onboardingController = require('../../controllers/admin/onboardingController');
const { uploadOnboardingMedia } = require('../../middleware/uploadMiddleware');
const { protectAdmin, isAdmin } = require('../../middleware/authMiddleware');
const OnboardingScreen = require("../../models/OnboardingScreen")

router.get('/', protectAdmin, isAdmin, async (req, res) => {
  const screens = await OnboardingScreen.find().sort({ type: 1, order: 1 });
  res.render('list', { screens });
});

router.get('/add', protectAdmin, isAdmin, (req, res) => {
  res.render('add-edit', { screen: null });
});

router.get('/edit/:id', protectAdmin, isAdmin, async (req, res) => {
  const screen = await OnboardingScreen.findById(req.params.id);
  if (!screen) return res.redirect('/admin/onboarding');
  res.render('add-edit', { screen });
});

// 
router.post('/add',protectAdmin,isAdmin, uploadOnboardingMedia, onboardingController.addOrUpdateScreen);
router.get('/list',protectAdmin,isAdmin, onboardingController.getAdminScreens);
router.put('/:id',protectAdmin,isAdmin, uploadOnboardingMedia, onboardingController.updateScreen);
router.delete('/:id',protectAdmin,isAdmin, onboardingController.deleteScreen);
 
router.get('/public', onboardingController.getAllScreens);

module.exports = router;

