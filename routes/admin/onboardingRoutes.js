// const express = require('express');
// const router = express.Router();
// const onboardingController = require('../../controllers/admin/onboardingController');
// const { uploadOnboardingMedia } = require('../../middleware/uploadMiddleware');
// const { protectAdmin, isAdmin } = require('../../middleware/authMiddleware');
// const OnboardingScreen = require("../../models/OnboardingScreen")

// router.get('/', protectAdmin, isAdmin, async (req, res) => {
//   const screens = await OnboardingScreen.find().sort({ type: 1, order: 1 });
//   // res.render('list', { screens });
//   res.render('list', { 
//     screens,
//     url: req.originalUrl,         
//     title: 'Onboarding Screens'  
//   });
// });

// router.get('/add', protectAdmin, isAdmin, (req, res) => {
//   // res.render('add-edit', { screen: null });
//   res.render('add-edit', { 
//     screen: null,
//     url: req.originalUrl,
//     title: 'Add Onboarding Screen'
//   });
// });

// router.get('/edit/:id', protectAdmin, isAdmin, async (req, res) => {
//   const screen = await OnboardingScreen.findById(req.params.id);
//   if (!screen) return res.redirect('/admin/onboarding');
//   // res.render('add-edit', { screen });
//   res.render('add-edit', { 
//     screen,
//     url: req.originalUrl,
//     title: 'Edit Onboarding Screen'
//   });
// });

// // 
// router.post('/add',protectAdmin,isAdmin, uploadOnboardingMedia, onboardingController.addOrUpdateScreen);
// router.get('/list',protectAdmin,isAdmin, onboardingController.getAdminScreens);
// router.put('/:id',protectAdmin,isAdmin, uploadOnboardingMedia, onboardingController.updateScreen);
// router.delete('/:id',protectAdmin,isAdmin, onboardingController.deleteScreen);
 
// router.get('/public', onboardingController.getAllScreens);

// module.exports = router;

const express = require('express');
const router = express.Router();
const onboardingController = require('../../controllers/admin/onboardingController');
const { uploadOnboardingMedia } = require('../../middleware/uploadMiddleware');
const { protectAdmin, isAdmin } = require('../../middleware/authMiddleware');
const OnboardingScreen = require("../../models/OnboardingScreen");

// List all screens (Main page)
router.get('/', protectAdmin, isAdmin, async (req, res) => {
  const screens = await OnboardingScreen.find().sort({ type: 1, order: 1 });
  
  res.render('splash_screen', { 
    screens,
    url: req.originalUrl,
    title: 'Onboarding Screens Management'
  });
});

// Add new screen page
router.get('/add', protectAdmin, isAdmin, (req, res) => {
  res.render('splash_screen_add', { 
    url: req.originalUrl,
    title: 'Add Onboarding Screen'
  });
});

// Edit existing screen page
router.get('/edit/:id', protectAdmin, isAdmin, async (req, res) => {
  const screen = await OnboardingScreen.findById(req.params.id);
  if (!screen) return res.redirect('/admin/onboarding');
  
  res.render('splash_screen_edit', { 
    screen,
    url: req.originalUrl,
    title: 'Edit Onboarding Screen'
  });
});

// API / Form Actions
router.post('/add', protectAdmin, isAdmin, uploadOnboardingMedia, onboardingController.addOrUpdateScreen);

// Update route (using POST + _method=PUT or change to POST if you prefer)
// router.put('/:id', protectAdmin, isAdmin, uploadOnboardingMedia, onboardingController.updateScreen);

router.post('/:id', protectAdmin, isAdmin, uploadOnboardingMedia, onboardingController.updateScreen);

// Other routes remain same
router.get('/list', protectAdmin, isAdmin, onboardingController.getAdminScreens);
// router.delete('/:id/delete', protectAdmin, isAdmin, onboardingController.deleteScreen);

router.post('/:id/delete', protectAdmin, isAdmin, onboardingController.deleteScreen);

router.get('/public', onboardingController.getAllScreens);

module.exports = router;