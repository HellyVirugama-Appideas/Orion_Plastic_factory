const jwtHelper = require('../utils/jwtHelper');
const Admin = require('../models/Admin');

exports.protectAdmin = async (req, res, next) => {
  try {
    const token = req.cookies['adminToken'];

    if (!token) {
      req.flash('red', 'Please login to access this page');
      return res.redirect('/admin/login');
    }

    const decoded = jwtHelper.verifyAccessToken(token);
    const admin = await Admin.findById(decoded.userId || decoded._id);

    if (!admin || !admin.isActive) {
      req.flash('red', 'Admin not found or inactive');
      res.clearCookie('adminToken');
      return res.redirect('/admin/login');
    }

    req.admin = admin;
    res.locals.admin = admin;
    res.locals.photo = admin.photo || '/default-avatar.png';

    next();
  } catch (error) {
    console.error('Auth Error:', error);
    req.flash('red', 'Authentication failed');
    res.clearCookie('adminToken');
    res.redirect('/admin/login');
  }
};