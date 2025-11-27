const Remark = require('../../models/Remark');
const Delivery = require("../../models/Delivery")



// Create Predefined Remark
exports.createPredefinedRemark = async (req, res) => {
  try {
    const {
      remarkText,
      category,
      severity,
      displayOrder,
      icon,
      color,
      description
    } = req.body;

    const adminId = req.admin._id; // protectAdmin se aayega

    if (!remarkText || !category) {
      return res.status(400).json({
        success: false,
        message: 'Remark text and category are required'
      });
    }

    const existingRemark = await Remark.findOne({
      remarkText: remarkText.trim(),
      isPredefined: true,
      isActive: true
    });

    if (existingRemark) {
      return res.status(400).json({
        success: false,
        message: 'This predefined remark already exists'
      });
    }

    const remark = new Remark({
      remarkType: 'predefined',
      remarkText: remarkText.trim(),
      category,
      severity: severity || 'medium',
      isPredefined: true,
      displayOrder: displayOrder || 0,
      icon,
      color: color || '#666666',
      description,
      createdBy: adminId,
      isActive: true,
      approvalStatus: 'approved'
    });

    await remark.save();

    res.status(201).json({
      success: true,
      message: 'Predefined remark created successfully',
      data: { remark }
    });

  } catch (error) {
    console.error('Create predefined remark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create predefined remark',
      error: error.message
    });
  }
};

// Get All Predefined Remarks (Public - for drivers)
exports.getAllPredefinedRemarks = async (req, res) => {
  try {
    const { category, search } = req.query;

    const query = { isPredefined: true, isActive: true };
    if (category) query.category = category;
    if (search) query.remarkText = { $regex: search, $options: 'i' };

    const remarks = await Remark.find(query)
      .sort({ displayOrder: 1, remarkText: 1 })
      .select('-editHistory -associatedDeliveries');

    const groupedByCategory = remarks.reduce((acc, remark) => {
      if (!acc[remark.category]) acc[remark.category] = [];
      acc[remark.category].push(remark);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: { remarks, groupedByCategory, total: remarks.length }
    });

  } catch (error) {
    console.error('Get predefined remarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch predefined remarks'
    });
  }
};

// Update Predefined Remark
exports.updatePredefinedRemark = async (req, res) => {
  try {
    const { remarkId } = req.params;
    const updates = req.body;

    const remark = await Remark.findById(remarkId);
    if (!remark || !remark.isPredefined) {
      return res.status(404).json({
        success: false,
        message: 'Predefined remark not found'
      });
    }

    const allowed = ['remarkText', 'category', 'severity', 'displayOrder', 'icon', 'color', 'description', 'isActive'];
    allowed.forEach(field => {
      if (updates[field] !== undefined) remark[field] = updates[field];
    });

    await remark.save();

    res.status(200).json({
      success: true,
      message: 'Predefined remark updated successfully',
      data: { remark }
    });

  } catch (error) {
    console.error('Update remark error:', error);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

// Delete (Soft) Predefined Remark
// exports.deletePredefinedRemark = async (req, res) => {
//   try {
//     const { remarkId } = req.params;
//     const remark = await Remark.findById(remarkId);

//     if (!remark || !remark.isPredefined) {
//       return res.status(404).json({
//         success: false,
//         message: 'Predefined remark not found'
//       });
//     }

//     remark.isActive = false;
//     await remark.save();

//     res.status(200).json({
//       success: true,
//       message: 'Predefined remark deleted successfully'
//     });

//   } catch (error) {
//     console.error('Delete remark error:', error);
//     res.status(500).json({ success: false, message: 'Delete failed' });
//   }
// };
exports.deletePredefinedRemark = async (req, res) => {
  try {
    const { remarkId } = req.params;

    const remark = await Remark.findOne({ 
      _id: remarkId, 
      isPredefined: true 
    });

    if (!remark) {
      return res.status(404).json({
        success: false,
        message: 'Predefined remark not found or already deleted'
      });
    }

    await Remark.deleteOne({ _id: remarkId });

    await Delivery.updateMany(
      { remarks: remarkId },
      { $pull: { remarks: remarkId } }
    );


    return res.status(200).json({
      success: true,
      message: 'Predefined remark permanently deleted from database!',
      data: {
        deletedRemarkId: remarkId,
        remarkText: remark.remarkText
      }
    });

  } catch (error) {
    console.error('Hard Delete Remark Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete remark',
      error: error.message
    });
  }
};

// Approve Custom Remark (Admin)
exports.approveCustomRemark = async (req, res) => {
  try {
    const { remarkId } = req.params;
    const { convertToPredefined, displayOrder } = req.body;
    const adminId = req.admin._id;

    const remark = await Remark.findById(remarkId);
    if (!remark || remark.isPredefined) {
      return res.status(404).json({
        success: false,
        message: 'Custom remark not found'
      });
    }

    remark.approvalStatus = 'approved';
    remark.approvedBy = adminId;
    remark.approvedAt = Date.now();

    if (convertToPredefined) {
      remark.isPredefined = true;
      remark.remarkType = 'predefined';
      remark.displayOrder = displayOrder ?? 0;
    }

    await remark.save();

    res.status(200).json({
      success: true,
      message: convertToPredefined
        ? 'Remark approved and converted to predefined'
        : 'Remark approved successfully',
      data: { remark }
    });

  } catch (error) {
    console.error('Approve remark error:', error);
    res.status(500).json({ success: false, message: 'Approval failed' });
  }
};

// Reject Custom Remark
exports.rejectCustomRemark = async (req, res) => {
  try {
    const { remarkId } = req.params;
    const { reason } = req.body;
    const adminId = req.admin._id;

    const remark = await Remark.findById(remarkId);
    if (!remark || remark.isPredefined) {
      return res.status(404).json({ success: false, message: 'Remark not found' });
    }

    remark.approvalStatus = 'rejected';
    remark.approvedBy = adminId;
    remark.approvedAt = Date.now();
    remark.isActive = false;
    if (reason) remark.description = `Rejected: ${reason}`;

    await remark.save();

    res.status(200).json({
      success: true,
      message: 'Custom remark rejected',
      data: { remark }
    });

  } catch (error) {
    console.error('Reject remark error:', error);
    res.status(500).json({ success: false, message: 'Rejection failed' });
  }
};

// Get Pending Custom Remarks (Admin Dashboard)
exports.getPendingCustomRemarks = async (req, res) => {
  try {
    const remarks = await Remark.find({
      isPredefined: false,
      approvalStatus: 'pending',
      requiresApproval: true
    })
      .populate('createdBy', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { remarks, total: remarks.length }
    });

  } catch (error) {
    console.error('Get pending remarks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending remarks' });
  }
};

// Remark Statistics (Admin Analytics)
exports.getRemarkStatistics = async (req, res) => {
  try {
    const [summary, categoryStats, recentlyUsed] = await Promise.all([
      Promise.all([
        Remark.countDocuments({ isActive: true }),
        Remark.countDocuments({ isPredefined: true, isActive: true }),
        Remark.countDocuments({ isPredefined: false, isActive: true }),
        Remark.countDocuments({ approvalStatus: 'pending' })
      ]),
      Remark.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 }, usage: { $sum: '$usageCount' } } },
        { $sort: { usage: -1 } }
      ]),
      Remark.find({ isActive: true })
        .sort({ lastUsedAt: -1 })
        .limit(5)
        .select('remarkText category usageCount lastUsedAt')
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total: summary[0],
          predefined: summary[1],
          custom: summary[2],
          pendingApproval: summary[3]
        },
        categoryStats,
        recentlyUsed
      }
    });

  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ success: false, message: 'Failed to load stats' });
  }
};
