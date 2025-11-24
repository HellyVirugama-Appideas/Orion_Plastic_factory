const MaintenanceSchedule = require('../../models/MaintenanceSchedule');
const Vehicle = require('../../models/Vehicle');
const Expense = require('../../models/Expense');

exports.scheduleMaintenance = async (req, res) => {
  try {
    const {
      vehicleId, maintenanceType, scheduleType, intervalKm, intervalMonths,
      description, estimatedCost, serviceProvider, priority, notes
    } = req.body;
    const adminId = req.admin._id;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const currentKm = vehicle.currentMeterReading || 0;
    const lastMaintenance = await MaintenanceSchedule.findOne({
      vehicle: vehicleId, maintenanceType, status: 'completed'
    }).sort({ completedAt: -1 });

    const lastServiceKm = lastMaintenance ? lastMaintenance.distanceSchedule.nextServiceKm : currentKm;
    const lastServiceDate = lastMaintenance ? lastMaintenance.completedAt : new Date();

    const maintenance = new MaintenanceSchedule({
      vehicle: vehicleId,
      maintenanceType,
      scheduleType: scheduleType || 'distance_based',
      distanceSchedule: { intervalKm: intervalKm || 10000, lastServiceKm, currentKm },
      timeSchedule: { intervalMonths, lastServiceDate },
      serviceDetails: { description, estimatedCost, serviceProvider },
      priority: priority || 'medium',
      notes,
      createdBy: adminId,
      isRecurring: true
    });

    await maintenance.save();

    res.status(201).json({
      success: true,
      message: 'Maintenance scheduled successfully',
      data: { maintenance: await maintenance.populate('vehicle', 'vehicleNumber registrationNumber vehicleType') }
    });

  } catch (error) {
    console.error('Schedule maintenance error:', error);
    res.status(500).json({ success: false, message: 'Failed to schedule maintenance', error: error.message });
  }
};

exports.recordServiceDetails = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { actualCost, laborCost, partsCost, additionalCost, parts, serviceProvider, serviceLocation, duration, notes, adminComments } = req.body;
    const adminId = req.admin._id;

    const maintenance = await MaintenanceSchedule.findById(scheduleId);
    if (!maintenance) return res.status(404).json({ success: false, message: 'Maintenance schedule not found' });

    maintenance.serviceDetails.actualCost = actualCost;
    maintenance.serviceDetails.serviceProvider = serviceProvider || maintenance.serviceDetails.serviceProvider;
    maintenance.serviceDetails.serviceLocation = serviceLocation;
    maintenance.serviceDetails.duration = duration;
    if (parts) maintenance.serviceDetails.parts = parts;

    maintenance.costBreakdown = { laborCost: laborCost || 0, partsCost: partsCost || 0, additionalCost: additionalCost || 0 };
    maintenance.status = 'completed';
    maintenance.completedAt = Date.now();
    maintenance.completedBy = adminId;
    maintenance.notes = notes || maintenance.notes;
    maintenance.adminComments = adminComments;

    const vehicle = await Vehicle.findById(maintenance.vehicle);
    if (vehicle) {
      vehicle.lastServiceDate = Date.now();
      maintenance.distanceSchedule.currentKm = vehicle.currentMeterReading;
      await vehicle.save();
    }

    await maintenance.save();

    const serviceExpense = new Expense({
      expenseType: 'maintenance',
      driver: vehicle?.assignedDriver,
      vehicle: maintenance.vehicle,
      fuelDetails: { totalAmount: actualCost },
      description: `${maintenance.maintenanceType} - ${maintenance.serviceDetails.description}`,
      category: 'scheduled',
      approvalStatus: 'approved_by_finance',
      paymentStatus: 'paid'
    });
    await serviceExpense.save();

    maintenance.serviceHistoryId = serviceExpense._id;
    await maintenance.save();

    if (maintenance.isRecurring && !maintenance.nextScheduleCreated) {
      await MaintenanceSchedule.createNextSchedule(scheduleId);
    }

    res.status(200).json({
      success: true,
      message: 'Service recorded successfully',
      data: { maintenance: await maintenance.populate(['vehicle', 'completedBy']) }
    });

  } catch (error) {
    console.error('Record service error:', error);
    res.status(500).json({ success: false, message: 'Failed to record service', error: error.message });
  }
};

exports.uploadServiceDocuments = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const files = req.files;

    const maintenance = await MaintenanceSchedule.findById(scheduleId);
    if (!maintenance) return res.status(404).json({ success: false, message: 'Schedule not found' });

    const documents = [];
    const types = ['invoice', 'receipt', 'before_photo', 'after_photo', 'report', 'warranty'];

    types.forEach(type => {
      if (files[type]) {
        files[type].forEach(file => {
          documents.push({ type, url: `/uploads/maintenance/${file.filename}`, filename: file.filename });
        });
      }
    });

    maintenance.documents.push(...documents);
    await maintenance.save();

    res.status(200).json({
      success: true,
      message: 'Documents uploaded',
      data: { uploadedDocuments: documents }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

exports.updateMaintenanceSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const updates = req.body;

    const maintenance = await MaintenanceSchedule.findById(scheduleId);
    if (!maintenance) return res.status(404).json({ success: false, message: 'Not found' });

    const allowed = ['maintenanceType', 'priority', 'notes', 'adminComments', 'serviceDetails', 'distanceSchedule', 'timeSchedule'];
    allowed.forEach(field => {
      if (updates[field] !== undefined) {
        if (typeof updates[field] === 'object' && !Array.isArray(updates[field])) {
          maintenance[field] = { ...maintenance[field], ...updates[field] };
        } else {
          maintenance[field] = updates[field];
        }
      }
    });

    await maintenance.save();

    res.status(200).json({ success: true, message: 'Updated successfully', data: { maintenance } });

  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

exports.cancelMaintenanceSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { reason } = req.body;

    const maintenance = await MaintenanceSchedule.findById(scheduleId);
    if (!maintenance) return res.status(404).json({ success: false, message: 'Not found' });

    maintenance.status = 'cancelled';
    maintenance.adminComments = reason || 'Cancelled by admin';
    await maintenance.save();

    res.status(200).json({ success: true, message: 'Cancelled successfully' });

  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ success: false, message: 'Cancel failed' });
  }
};

exports.getMaintenanceCostSummary = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate, maintenanceType } = req.query;
    const match = { status: 'completed' };
    if (vehicleId) match.vehicle = vehicleId;
    if (maintenanceType) match.maintenanceType = maintenanceType;
    if (startDate || endDate) {
      match.completedAt = {};
      if (startDate) match.completedAt.$gte = new Date(startDate);
      if (endDate) match.completedAt.$lte = new Date(endDate);
    }

    const [summary, byType] = await Promise.all([
      MaintenanceSchedule.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalCost: { $sum: '$serviceDetails.actualCost' },
            count: { $sum: 1 }
          }
        }
      ]),
      MaintenanceSchedule.aggregate([
        { $match: match },
        { $group: { _id: '$maintenanceType', total: { $sum: '$serviceDetails.actualCost' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: { summary: summary[0] || {}, costByType: byType }
    });

  } catch (error) {
    console.error('Cost summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to get summary' });
  }
};
