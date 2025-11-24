const Expense = require('../models/Expense');
const Driver = require('../models/Driver');
const Journey = require('../models/Journey');
const Delivery = require('../models/Delivery');

// CREATE FUEL EXPENSE (DRIVER) 
exports.createFuelExpense = async (req, res) => {
  try {
    const {
      vehicleNumber,
      vehicleType,
      quantity,
      pricePerUnit,
      fuelType,
      currentMeterReading,
      stationName,
      stationAddress,
      stationLatitude,
      stationLongitude,
      description,
      category,
      journeyId,
      deliveryId
    } = req.body;

    // Get driver from token
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    // Get previous meter reading for mileage calculation
    const lastExpense = await Expense.findOne({
      driver: driver._id,
      'vehicle.vehicleNumber': vehicleNumber,
      expenseType: 'fuel'
    }).sort({ 'meterReading.current': -1 });

    const previousMeterReading = lastExpense ? lastExpense.meterReading.current : 0;
    const totalAmount = quantity * pricePerUnit;

    // Create expense
    const expense = new Expense({
      expenseType: 'fuel',
      driver: driver._id,
      vehicle: {
        vehicleNumber,
        vehicleType,
        model: driver.vehicleModel
      },
      journey: journeyId || null,
      delivery: deliveryId || null,
      fuelDetails: {
        quantity,
        pricePerUnit,
        totalAmount,
        fuelType,
        stationName,
        stationLocation: {
          address: stationAddress,
          coordinates: {
            latitude: stationLatitude,
            longitude: stationLongitude
          }
        }
      },
      meterReading: {
        current: currentMeterReading,
        previous: previousMeterReading,
        difference: currentMeterReading - previousMeterReading
      },
      description,
      category: category || 'operational',
      approvalWorkflow: {
        submittedBy: driver._id,
        submittedAt: Date.now()
      }
    });

    // Auto-fetch date/time
    expense.expenseDate = Date.now();

    await expense.save();

    // Populate driver details
    await expense.populate('driver', 'name email phone vehicleNumber');

    res.status(201).json({
      success: true,
      message: 'Fuel expense recorded successfully. Awaiting admin approval.',
      data: {
        expense
      }
    });

  } catch (error) {
    console.error('Create fuel expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create fuel expense',
      error: error.message
    });
  }
};

//  UPLOAD RECEIPTS & METER PHOTOS (DRIVER) 
exports.uploadReceipts = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const files = req.files; // Using multer

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Get driver
    const driver = await Driver.findOne({ userId: req.user._id });
    
    // Verify ownership
    if (expense.driver.toString() !== driver._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Process uploaded files
    const receipts = [];
    
    if (files.fuel_receipt) {
      receipts.push({
        type: 'fuel_receipt',
        url: `/uploads/receipts/${files.fuel_receipt[0].filename}`,
        filename: files.fuel_receipt[0].filename
      });
    }

    if (files.meter_photo) {
      receipts.push({
        type: 'meter_photo',
        url: `/uploads/receipts/${files.meter_photo[0].filename}`,
        filename: files.meter_photo[0].filename
      });
    }

    if (files.vehicle_photo) {
      receipts.push({
        type: 'vehicle_photo',
        url: `/uploads/receipts/${files.vehicle_photo[0].filename}`,
        filename: files.vehicle_photo[0].filename
      });
    }

    // Add receipts to expense
    expense.receipts.push(...receipts);
    await expense.save();

    await expense.populate('driver', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Receipts uploaded successfully',
      data: {
        expense,
        uploadedReceipts: receipts
      }
    });

  } catch (error) {
    console.error('Upload receipts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload receipts',
      error: error.message
    });
  }
};

//  GET MY EXPENSES (DRIVER) 
exports.getMyExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 20, approvalStatus, startDate, endDate } = req.query;

    // Get driver
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    const query = { driver: driver._id };
    if (approvalStatus) query.approvalStatus = approvalStatus;
    
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const expenses = await Expense.find(query)
      .populate('journey', 'startTime endTime distance')
      .populate('delivery', 'trackingNumber orderId')
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(query);

    // Calculate statistics
    const stats = await Expense.aggregate([
      { $match: { driver: driver._id } },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$fuelDetails.totalAmount' },
          totalFuel: { $sum: '$fuelDetails.quantity' },
          totalDistance: { $sum: '$mileageData.distanceCovered' },
          avgMileage: { $avg: '$mileageData.averageMileage' },
          totalRecords: { $sum: 1 },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$approvalStatus', 'pending'] }, 1, 0] }
          },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$approvalStatus', 'approved_by_finance'] }, 1, 0] }
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ['$approvalStatus', 'rejected'] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        expenses,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        },
        statistics: stats[0] || {}
      }
    });

  } catch (error) {
    console.error('Get my expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
      error: error.message
    });
  }
};

//  GET EXPENSE BY ID (DRIVER) 
exports.getExpenseById = async (req, res) => {
  try {
    const { expenseId } = req.params;

    // Get driver
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    const expense = await Expense.findOne({
      _id: expenseId,
      driver: driver._id
    })
      .populate('journey', 'startTime endTime distance status')
      .populate('delivery', 'trackingNumber orderId status')
      .populate('approvalWorkflow.adminApproval.approvedBy', 'name')
      .populate('approvalWorkflow.financeApproval.approvedBy', 'name');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { expense }
    });

  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense',
      error: error.message
    });
  }
};

//  CALCULATE MY MILEAGE (DRIVER) 
exports.calculateMyMileage = async (req, res) => {
  try {
    const { vehicleNumber, startDate, endDate } = req.query;

    // Get driver
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    const query = {
      driver: driver._id,
      expenseType: 'fuel'
    };

    if (vehicleNumber) query['vehicle.vehicleNumber'] = vehicleNumber;

    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }

    const fuelExpenses = await Expense.find(query).sort({ expenseDate: 1 });

    if (fuelExpenses.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 refueling records required for mileage calculation'
      });
    }

    // Calculate mileage
    let totalDistance = 0;
    let totalFuel = 0;
    const mileageHistory = [];

    for (let i = 1; i < fuelExpenses.length; i++) {
      const current = fuelExpenses[i];
      const previous = fuelExpenses[i - 1];

      const distance = current.meterReading.current - previous.meterReading.current;
      const fuel = current.fuelDetails.quantity;

      if (distance > 0 && fuel > 0) {
        const mileage = (distance / fuel).toFixed(2);
        totalDistance += distance;
        totalFuel += fuel;

        mileageHistory.push({
          date: current.expenseDate,
          distance,
          fuel,
          mileage: parseFloat(mileage),
          meterReading: current.meterReading.current,
          stationName: current.fuelDetails.stationName
        });
      }
    }

    const averageMileage = totalFuel > 0 ? (totalDistance / totalFuel).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        vehicleNumber: vehicleNumber || driver.vehicleNumber,
        totalDistance,
        totalFuel,
        averageMileage: parseFloat(averageMileage),
        unit: 'km/l',
        recordsCount: mileageHistory.length,
        mileageHistory
      }
    });

  } catch (error) {
    console.error('Calculate mileage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate mileage',
      error: error.message
    });
  }
};

//  GET MY EXPENSE SUMMARY (DRIVER) 
exports.getMyExpenseSummary = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Get driver
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default: // month
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const matchStage = {
      driver: driver._id,
      expenseDate: { $gte: startDate }
    };

    // Get summary statistics
    const summary = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$fuelDetails.totalAmount' },
          totalRecords: { $sum: 1 },
          avgExpense: { $avg: '$fuelDetails.totalAmount' },
          totalFuel: { $sum: '$fuelDetails.quantity' },
          totalDistance: { $sum: '$mileageData.distanceCovered' },
          avgMileage: { $avg: '$mileageData.averageMileage' }
        }
      }
    ]);

    // Get expense by type
    const byType = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$expenseType',
          total: { $sum: '$fuelDetails.totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get approval status breakdown
    const approvalStatus = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$fuelDetails.totalAmount' }
        }
      }
    ]);

    // Daily breakdown
    const dailyBreakdown = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$expenseDate' } },
          totalExpense: { $sum: '$fuelDetails.totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        summary: summary[0] || {},
        byExpenseType: byType,
        approvalStatus,
        dailyBreakdown
      }
    });

  } catch (error) {
    console.error('Get expense summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense summary',
      error: error.message
    });
  }
};

//  UPDATE EXPENSE (DRIVER - Only if pending) 
exports.updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const updates = req.body;

    // Get driver
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    const expense = await Expense.findOne({
      _id: expenseId,
      driver: driver._id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Only allow updates if status is pending or rejected
    if (expense.approvalStatus !== 'pending' && expense.approvalStatus !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update expense that is already approved or in approval process'
      });
    }

    // Update allowed fields
    if (updates.description) expense.description = updates.description;
    if (updates.remarks) expense.remarks = updates.remarks;
    if (updates.category) expense.category = updates.category;

    // If updating fuel details, recalculate mileage
    if (updates.fuelDetails) {
      if (updates.fuelDetails.quantity) expense.fuelDetails.quantity = updates.fuelDetails.quantity;
      if (updates.fuelDetails.pricePerUnit) expense.fuelDetails.pricePerUnit = updates.fuelDetails.pricePerUnit;
      if (updates.fuelDetails.quantity && updates.fuelDetails.pricePerUnit) {
        expense.fuelDetails.totalAmount = updates.fuelDetails.quantity * updates.fuelDetails.pricePerUnit;
      }
    }

    // If resubmitting after rejection
    if (expense.approvalStatus === 'rejected' && updates.resubmit) {
      expense.approvalStatus = 'resubmitted';
      expense.rejectionReason = null;
      expense.rejectedBy = null;
      expense.rejectedAt = null;
    }

    await expense.save();

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense }
    });

  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: error.message
    });
  }
};

//  DELETE EXPENSE (DRIVER - Only if pending) 
exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    // Get driver
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    const expense = await Expense.findOne({
      _id: expenseId,
      driver: driver._id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Only allow deletion if status is pending
    if (expense.approvalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete expense that is already in approval process or approved'
      });
    }

    await Expense.deleteOne({ _id: expenseId });

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: error.message
    });
  }
};

module.exports = exports;