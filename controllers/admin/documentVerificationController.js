// const Document = require('../../models/Document');
// const Driver = require('../../models/Driver');
// const Admin = require('../../models/Admin');
// const { successResponse, errorResponse } = require('../../utils/responseHelper');

// // Get All Documents for Verification
// exports.getAllDocuments = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, status, documentType, driverId } = req.query;

//     // Build query
//     const query = {};
//     if (status) query.status = status;
//     if (documentType) query.documentType = documentType;
//     if (driverId) query.driverId = driverId;

//     // Get documents
//     const documents = await Document.find(query)
//       .populate({
//         path: 'driverId',
//         populate: {
//           path: 'userId',
//           select: 'name email phone'
//         }
//       })
//       .populate('verifiedBy', 'name email')
//       .sort({ uploadedAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Document.countDocuments(query);

//     successResponse(res, 'Documents retrieved successfully', {
//       documents,
//       pagination: {
//         total,
//         page: parseInt(page),
//         pages: Math.ceil(total / limit)
//       }
//     });
//   } catch (error) {
//     errorResponse(res, error.message);
//   }
// };

// // Get Pending Documents
// exports.getPendingDocuments = async (req, res) => {
//   try {
//     const { page = 1, limit = 10 } = req.query;

//     const documents = await Document.find({ status: 'pending' })
//       .populate({ 
//         path: 'driverId',
//         populate: {
//           path: 'userId',
//           select: 'name email phone'
//         }
//       })
//       .sort({ uploadedAt: 1 }) // Oldest first
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Document.countDocuments({ status: 'pending' });
 
//     successResponse(res, 'Pending documents retrieved successfully', {
//       documents,
//       pagination: {
//         total,
//         page: parseInt(page),
//         pages: Math.ceil(total / limit)
//       }
//     });
//   } catch (error) {
//     errorResponse(res, error.message);
//   }
// };

// // Get Single Document
// exports.getDocumentDetails = async (req, res) => {
//   try {
//     const { documentId } = req.params;

//     const document = await Document.findById(documentId)
//       .populate({
//         path: 'driverId',
//         populate: {
//           path: 'userId',
//           select: 'name email phone profileImage'
//         }
//       })
//       .populate('verifiedBy', 'name email department');

//     if (!document) {
//       return errorResponse(res, 'Document not found', 404);
//     }

//     successResponse(res, 'Document details retrieved successfully', { document });
//   } catch (error) {
//     errorResponse(res, error.message);
//   }
// };

// // Get Driver Documents
// exports.getDriverDocuments = async (req, res) => {
//   try {
//     const { driverId } = req.params;

//     const driver = await Driver.findById(driverId);
//     if (!driver) {
//       return errorResponse(res, 'Driver not found', 404);
//     }

//     const documents = await Document.find({ driverId })
//       .populate('verifiedBy', 'name email')
//       .sort({ uploadedAt: -1 });

//     successResponse(res, 'Driver documents retrieved successfully', {
//       documents,
//       driver: {
//         id: driver._id,
//         profileStatus: driver.profileStatus
//       }
//     });
//   } catch (error) {
//     errorResponse(res, error.message);
//   }
// };

// // Verify Document (Approve)
// exports.verifyDocument = async (req, res) => {
//   try {
//     const { documentId } = req.params;

//     const document = await Document.findById(documentId);
//     if (!document) {
//       return errorResponse(res, 'Document not found', 404);
//     }

//     // Get admin
//     const admin = await Admin.findOne({ userId: req.user._id });
//     if (!admin) {
//       return errorResponse(res, 'Admin profile not found', 404);
//     }

//     // Update document status
//     document.status = 'verified';
//     document.verifiedBy = admin._id;
//     document.verifiedAt = new Date();
//     document.rejectionReason = null;
//     await document.save();

//     // Check if all driver documents are verified
//     const driver = await Driver.findById(document.driverId);
//     const allDocuments = await Document.find({ driverId: driver._id });
    
//     const allVerified = allDocuments.every(doc => doc.status === 'verified');
//     const hasRejected = allDocuments.some(doc => doc.status === 'rejected');

//     // Update driver profile status
//     if (allVerified && allDocuments.length >= 3) { // Assuming minimum 3 documents required
//       driver.profileStatus = 'approved';
//     } else if (hasRejected) {
//       driver.profileStatus = 'rejected';
//     } else {
//       driver.profileStatus = 'pending_verification';
//     }
//     await driver.save();

//     successResponse(res, 'Document verified successfully', {
//       document,
//       driverProfileStatus: driver.profileStatus
//     });
//   } catch (error) {
//     errorResponse(res, error.message);
//   }
// };

// // Reject Document
// exports.rejectDocument = async (req, res) => {
//   try {
//     const { documentId } = req.params;
//     const { rejectionReason } = req.body;

//     if (!rejectionReason) {
//       return errorResponse(res, 'Rejection reason is required', 400);
//     }

//     const document = await Document.findById(documentId);
//     if (!document) {
//       return errorResponse(res, 'Document not found', 404);
//     }

//     // Get admin
//     const admin = await Admin.findOne({ userId: req.user._id });
//     if (!admin) {
//       return errorResponse(res, 'Admin profile not found', 404);
//     }

//     // Update document status
//     document.status = 'rejected';
//     document.verifiedBy = admin._id;
//     document.verifiedAt = new Date();
//     document.rejectionReason = rejectionReason;
//     await document.save();

//     // Update driver profile status
//     const driver = await Driver.findById(document.driverId);
//     driver.profileStatus = 'rejected';
//     await driver.save();

//     successResponse(res, 'Document rejected successfully', {
//       document,
//       driverProfileStatus: driver.profileStatus
//     });
//   } catch (error) {
//     errorResponse(res, error.message);
//   }
// };

// // Approve Driver Profile
// exports.approveDriverProfile = async (req, res) => {
//   try {
//     const { driverId } = req.params;

//     const driver = await Driver.findById(driverId);
//     if (!driver) {
//       return errorResponse(res, 'Driver not found', 404);
//     }

//     // Check if all required documents are uploaded and verified
//     const documents = await Document.find({ driverId });
    
//     const requiredDocTypes = ['license', 'insurance', 'registration'];
//     const uploadedDocTypes = documents.map(doc => doc.documentType);
//     const missingDocs = requiredDocTypes.filter(type => !uploadedDocTypes.includes(type));

//     if (missingDocs.length > 0) {
//       return errorResponse(res, `Missing required documents: ${missingDocs.join(', ')}`, 400);
//     }

//     const allVerified = documents.every(doc => doc.status === 'verified');
//     if (!allVerified) {
//       return errorResponse(res, 'All documents must be verified before approving profile', 400);
//     }

//     // Approve profile
//     driver.profileStatus = 'approved';
//     await driver.save();

//     successResponse(res, 'Driver profile approved successfully', { driver });
//   } catch (error) {
//     errorResponse(res, error.message);
//   }
// };

// // Reject Driver Profile
// exports.rejectDriverProfile = async (req, res) => {
//   try {
//     const { driverId } = req.params;
//     const { rejectionReason } = req.body;

//     const driver = await Driver.findById(driverId);
//     if (!driver) {
//       return errorResponse(res, 'Driver not found', 404);
//     }

//     // Reject profile
//     driver.profileStatus = 'rejected';
//     await driver.save();

//     successResponse(res, 'Driver profile rejected successfully', { driver });
//   } catch (error) {
//     errorResponse(res, error.message);
//   }
// };



const Driver = require('../../models/Driver');
const Admin = require('../../models/Admin');
const { successResponse, errorResponse } = require('../../utils/responseHelper');

// Get All Documents (from all drivers)
exports.getAllDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, documentType, driverId } = req.query;

    const query = {};
    if (status) query['documents.status'] = status;
    if (documentType) query['documents.documentType'] = documentType;
    if (driverId) query._id = driverId;
    
    const drivers = await Driver.find(query)
      .select('name phone email licenseNumber vehicleNumber documents profileStatus')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Flatten documents for response
    const allDocuments = [];
    drivers.forEach(driver => {
      driver.documents.forEach(doc => {
        allDocuments.push({
          ...doc.toObject(),
          driver: {
            _id: driver._id,
            name: driver.name,
            email: driver.email,
            phone: driver.phone,
            licenseNumber: driver.licenseNumber,
            vehicleNumber: driver.vehicleNumber,
            profileStatus: driver.profileStatus
          }
        });
      });
    });

    const total = await Driver.aggregate([
      { $unwind: '$documents' },
      { $match: status ? { 'documents.status': status } : {} },
      { $count: 'total' }
    ]);

    successResponse(res, 'Documents retrieved successfully', {
      documents: allDocuments,
      pagination: {
        total: total[0]?.total || 0,
        page: parseInt(page),
        pages: Math.ceil((total[0]?.total || 0) / limit)
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 'Failed to fetch documents', 500);
  }
};

// Get Pending Documents
exports.getPendingDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const drivers = await Driver.find({ 'documents.status': 'pending' })
      .select('name email phone documents')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const pendingDocs = [];
    drivers.forEach(d => {
      d.documents
        .filter(doc => doc.status === 'pending')
        .forEach(doc => {
          pendingDocs.push({
            ...doc.toObject(),
            driver: { name: d.name, email: d.email, phone: d.phone, _id: d._id }
          });
        });
    });

    const total = await Driver.aggregate([
      { $unwind: '$documents' },
      { $match: { 'documents.status': 'pending' } },
      { $count: 'total' }
    ]);

    successResponse(res, 'Pending documents retrieved', {
      documents: pendingDocs,
      total: total[0]?.total || 0
    });
  } catch (error) {
    errorResponse(res, 'Error fetching pending documents', 500);
  }
};

// Get Single Document (by document _id inside array)
exports.getDocumentDetails = async (req, res) => {
  try {
    const { documentId } = req.params;

    const driver = await Driver.findOne({ 'documents._id': documentId })
      .select('name email phone licenseNumber documents');

    if (!driver) return errorResponse(res, 'Document not found', 404);

    const document = driver.documents.id(documentId);
    if (!document) return errorResponse(res, 'Document not found', 404);

    successResponse(res, 'Document found', {
      document: {
        ...document.toObject(),
        driver: {
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber
        }
      }
    });
  } catch (error) {
    errorResponse(res, 'Error', 500);
  }
};

// Get Driver's All Documents
exports.getDriverDocuments = async (req, res) => {
  try {
    const { driverId } = req.params;
    const driver = await Driver.findById(driverId)
      .select('name email phone licenseNumber vehicleNumber profileStatus documents');

    if (!driver) return errorResponse(res, 'Driver not found', 404);

    successResponse(res, 'Driver documents', {
      driver: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        profileStatus: driver.profileStatus
      },
      documents: driver.documents
    });
  } catch (error) {
    errorResponse(res, 'Error', 500);
  }
};

// Verify Document
exports.verifyDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const admin = req.admin; // from protectAdmin

    const driver = await Driver.findOne({ 'documents._id': documentId });
    if (!driver) return errorResponse(res, 'Document not found', 404);

    const doc = driver.documents.id(documentId);
    doc.status = 'verified';
    doc.verifiedBy = admin._id;
    doc.verifiedAt = new Date();
    doc.rejectionReason = null;

    await driver.save();

    // Check if all documents verified
    const allVerified = driver.documents.every(d => d.status === 'verified');
    const hasRejected = driver.documents.some(d => d.status === 'rejected');

    if (allVerified && driver.documents.length >= 5) {
      driver.profileStatus = 'approved';
    } else if (hasRejected) {
      driver.profileStatus = 'rejected';
    } else {
      driver.profileStatus = 'pending_verification';
    }
    await driver.save();

    successResponse(res, 'Document verified!', { profileStatus: driver.profileStatus });
  } catch (error) {
    errorResponse(res, 'Verification failed', 500);
  }
};

// Reject Document
exports.rejectDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { rejectionReason } = req.body;
    const admin = req.admin;

    if (!rejectionReason) return errorResponse(res, 'Reason required', 400);

    const driver = await Driver.findOne({ 'documents._id': documentId });
    if (!driver) return errorResponse(res, 'Document not found', 404);

    const doc = driver.documents.id(documentId);
    doc.status = 'rejected';0
    doc.verifiedAt = new Date();
    doc.rejectionReason = rejectionReason;

    driver.profileStatus = 'rejected';
    await driver.save();

    successResponse(res, 'Document rejected');
  } catch (error) {
    errorResponse(res, 'Rejection failed', 500);
  }
};
 
// Approve/Reject Driver Profile
exports.approveDriverProfile = async (req, res) => {
  try {
    const { driverId } = req.params;
    const driver = await Driver.findById(driverId);
    if (!driver) return errorResponse(res, 'Driver not found', 404);

    const allVerified = driver.documents.every(d => d.status === 'verified');
    if (!allVerified) return errorResponse(res, 'All documents must be verified', 400);

    driver.profileStatus = 'approved';
    await driver.save();

    successResponse(res, 'Driver approved!');
  } catch (error) {
    errorResponse(res, 'Approval failed', 500);
  }
};

exports.rejectDriverProfile = async (req, res) => {
  try {
    const { driverId } = req.params;
    const driver = await Driver.findById(driverId);
    if (!driver) return errorResponse(res, 'Driver not found', 404);

    driver.profileStatus = 'rejected';
    await driver.save();

    successResponse(res, 'Driver rejected');
  } catch (error) {
    errorResponse(res, 'Rejection failed', 500);
  }
};