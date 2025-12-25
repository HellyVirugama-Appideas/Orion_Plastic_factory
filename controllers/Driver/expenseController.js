const Expense = require('../../models/Expense');
const Driver = require('../../models/Driver');
const Journey = require('../../models/Journey');
const Delivery = require('../../models/Delivery');

// ==================== FUEL EXPENSES ====================

// GET PREVIOUS METER READING 
exports.getPreviousMeterReading = async (req, res) => {
  try {
    const { vehicleNumber } = req.query;

    const driver = await Driver.findById(req.user._id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    // Get last expense for this vehicle
    const lastExpense = await Expense.findOne({
      driver: driver._id,
      'vehicle.vehicleNumber': vehicleNumber,
      expenseType: 'fuel'
    }).sort({ 'meterReading.current': -1 });

    const previousMeterReading = lastExpense ? lastExpense.meterReading.current : 0;

    res.status(200).json({
      success: true,
      data: {
        previousMeterReading,
        vehicleNumber,
        lastExpenseDate: lastExpense ? lastExpense.expenseDate : null
      }
    });

  } catch (error) {
    console.error('Get previous meter reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch previous meter reading',
      error: error.message
    });
  }
};

// CREATE FUEL EXPENSE (Multi-step form submission)
// exports.createFuelExpense = async (req, res) => {
//   try {
//     const {
//       // Step 1: Vehicle Details
//       vehicleNumber,
//       vehicleType,

//       // Step 2: Fuel Details
//       fuelQuantity,
//       pricePerLitre,
//       totalFuelCost,
//       fuelType,

//       // Step 3: Meter Reading
//       currentMeterReading,

//       // Step 4: Station Details
//       stationName,
//       stationAddress,
//       stationLatitude,
//       stationLongitude,

//       // Optional
//       description,
//       category,
//       journeyId,
//       deliveryId
//     } = req.body;

//     // Validation
//     if (!vehicleNumber || !vehicleType) {
//       return res.status(400).json({
//         success: false,
//         message: 'Vehicle number and type are required'
//       });
//     }

//     if (!fuelQuantity || !pricePerLitre) {
//       return res.status(400).json({
//         success: false,
//         message: 'Fuel quantity and price per litre are required'
//       });
//     }

//     if (!currentMeterReading) {
//       return res.status(400).json({
//         success: false,
//         message: 'Current meter reading is required'
//       });
//     }

//     const driver = await Driver.findById(req.user._id);
//     if (!driver) {
//       return res.status(404).json({
//         success: false,
//         message: 'Driver profile not found'
//       });
//     }

//     // Get previous meter reading automatically
//     const lastExpense = await Expense.findOne({
//       driver: driver._id,
//       'vehicle.vehicleNumber': vehicleNumber,
//       expenseType: 'fuel'
//     }).sort({ 'meterReading.current': -1 });

//     const previousMeterReading = lastExpense ? lastExpense.meterReading.current : 0;

//     // Calculate total if not provided (for verification)
//     const calculatedTotal = parseFloat((fuelQuantity * pricePerLitre).toFixed(2));
//     const finalTotalCost = totalFuelCost || calculatedTotal;

//     // Create expense
//     const expense = new Expense({
//       expenseType: 'fuel',
//       driver: driver._id,

//       // Vehicle info
//       vehicle: {
//         vehicleNumber: vehicleNumber.toUpperCase(),
//         vehicleType,
//         model: driver.vehicleModel || 'N/A'
//       },

//       // Journey/Delivery reference
//       journey: journeyId || null,
//       delivery: deliveryId || null,

//       // Fuel details (Step 2)
//       fuelDetails: {
//         quantity: parseFloat(fuelQuantity),
//         pricePerLitre: parseFloat(pricePerLitre),
//         totalFuelCost: finalTotalCost,
//         fuelType: fuelType || 'petrol',
//         stationName: stationName || '',
//         stationAddress: stationAddress || '',
//         stationLocation: {
//           latitude: stationLatitude || null,
//           longitude: stationLongitude || null
//         }
//       },

//       // Meter reading (Step 3)
//       meterReading: {
//         current: parseFloat(currentMeterReading),
//         previous: previousMeterReading,
//         difference: parseFloat(currentMeterReading) - previousMeterReading
//       },

//       // Additional info
//       description: description || '',
//       category: category || 'operational',

//       // Approval workflow
//       approvalWorkflow: {
//         submittedBy: driver._id,
//         submittedAt: Date.now()
//       },

//       expenseDate: Date.now()
//     });

//     await expense.save();

//     // Populate driver details
//     await expense.populate('driver', 'name email phone vehicleNumber vehicleType');

//     res.status(201).json({
//       success: true,
//       message: 'Fuel expense created successfully. Please upload receipts to complete.',
//       data: { 
//         expense,
//         nextStep: 'uploadReceipts',
//         uploadUrl: `/api/driver/expenses/${expense._id}/receipts`
//       }
//     });

//   } catch (error) {
//     console.error('Create fuel expense error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create fuel expense',
//       error: error.message
//     });
//   }
// };

// exports.createFuelExpense = async (req, res) => {
//   try {
//     const {
//       vehicleNumber,
//       vehicleType,
//       fuelQuantity,
//       pricePerLitre,
//       totalFuelCost,
//       fuelType,
//       currentMeterReading,
//       stationName,
//       stationAddress,
//       stationLatitude,
//       stationLongitude,
//       description,
//       category,
//       journeyId,
//       deliveryId,
//       expenseDate,  
//       expenseTime  
//     } = req.body;

//     const files = req.files || {};

//     // Validation
//     if (!vehicleNumber ) {
//       return res.status(400).json({
//         success: false,
//         message: 'Vehicle number and type are required'
//       });
//     }

//     if (!fuelQuantity || !pricePerLitre) {
//       return res.status(400).json({
//         success: false,
//         message: 'Fuel quantity and price per litre are required'
//       });
//     }

//     if (!currentMeterReading) {
//       return res.status(400).json({
//         success: false,
//         message: 'Current meter reading is required'
//       });
//     }

//     const driver = await Driver.findById(req.user._id);
//     if (!driver) {
//       return res.status(404).json({
//         success: false,
//         message: 'Driver profile not found'
//       });
//     }

//     // Get previous meter reading automatically
//     const lastExpense = await Expense.findOne({
//       driver: driver._id,
//       'vehicle.vehicleNumber': vehicleNumber,
//       expenseType: 'fuel'
//     }).sort({ 'meterReading.current': -1 });

//     const previousMeterReading = lastExpense ? lastExpense.meterReading.current : 0;

//     // Calculate total if not provided (for verification)
//     const calculatedTotal = parseFloat((fuelQuantity * pricePerLitre).toFixed(2));
//     const finalTotalCost = totalFuelCost || calculatedTotal;

//     // Parse custom date and time, default to now
//     let finalExpenseDate = Date.now();
//     if (expenseDate) {
//       const dateTimeStr = expenseTime ? `${expenseDate}T${expenseTime}:00` : `${expenseDate}T00:00:00`;
//       finalExpenseDate = new Date(dateTimeStr);
//       if (isNaN(finalExpenseDate.getTime())) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid expense date or time format'
//         });
//       }
//     }

//     // Create expense
//     const expense = new Expense({
//       expenseType: 'fuel',
//       driver: driver._id,

//       // Vehicle info
//       vehicle: {
//         vehicleNumber: vehicleNumber.toUpperCase(),
//         vehicleType,
//         model: driver.vehicleModel || 'N/A'
//       },

//       // Journey/Delivery reference
//       journey: journeyId || null,
//       delivery: deliveryId || null,

//       // Fuel details
//       fuelDetails: {
//         quantity: parseFloat(fuelQuantity),
//         pricePerLitre: parseFloat(pricePerLitre),
//         totalFuelCost: finalTotalCost,
//         fuelType: fuelType || 'petrol',
//         stationName: stationName || '',
//         stationAddress: stationAddress || '',
//         stationLocation: {
//           latitude: stationLatitude || null,
//           longitude: stationLongitude || null
//         }
//       },

//       // Meter reading 
//       meterReading: {
//         current: parseFloat(currentMeterReading),
//         previous: previousMeterReading,
//         difference: parseFloat(currentMeterReading) - previousMeterReading
//       },

//       // Additional info
//       description: description || '',
//       category: category || 'operational',

//       approvalWorkflow: {
//         submittedBy: driver._id,
//         submittedAt: Date.now()
//       },

//       expenseDate: finalExpenseDate
//     });

//     // Handle optional file uploads during creation
//     const uploadedReceipts = [];

//     // Fuel Receipt Photo
//     if (files.fuel_receipt && files.fuel_receipt[0]) {
//       uploadedReceipts.push({
//         type: 'fuel_receipt',
//         url: `/uploads/expenses/${files.fuel_receipt[0].filename}`,
//         filename: files.fuel_receipt[0].filename
//       });
//     }

//     // Meter Reading Photo
//     if (files.meter_photo && files.meter_photo[0]) {
//       uploadedReceipts.push({
//         type: 'meter_photo',
//         url: `/uploads/expenses/${files.meter_photo[0].filename}`,
//         filename: files.meter_photo[0].filename
//       });
//     }

//     // Payment Receipt Photo
//     if (files.payment_receipt && files.payment_receipt[0]) {
//       expense.paymentReceiptPhoto.push({
//         url: `/uploads/expenses/${files.payment_receipt[0].filename}`,
//         filename: files.payment_receipt[0].filename
//       });
//     }

//     if (uploadedReceipts.length > 0) {
//       expense.receipts = [...expense.receipts, ...uploadedReceipts];
//     }

//     await expense.save();

//     await expense.populate('driver', 'name email phone vehicleNumber vehicleType');

//     res.status(201).json({
//       success: true,
//       message: 'Fuel expense created successfully. You can upload more receipts if needed.',
//       data: {
//         expense,
//         nextStep: uploadedReceipts.length > 0 ? 'submitted' : 'uploadReceipts',
//         uploadUrl: `/api/driver/expenses/${expense._id}/receipts`
//       }
//     });

//   } catch (error) {
//     console.error('Create fuel expense error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create fuel expense',
//       error: error.message
//     });
//   }
// };


exports.createFuelExpense = async (req, res) => {
  try {
    // 1. Form-data se saare fields safely lete hain
    const fuelQuantityStr     = req.body.fuelQuantity;
    const pricePerLitreStr    = req.body.pricePerLitre;
    const totalFuelCostStr    = req.body.totalFuelCost;
    const currentMeterReadingStr = req.body.currentMeterReading;
    const fuelType            = req.body.fuelType || 'petrol';
    const stationName         = req.body.stationName || '';
    const stationAddress      = req.body.stationAddress || '';
    const stationLatitudeStr  = req.body.stationLatitude;
    const stationLongitudeStr = req.body.stationLongitude;
    const description         = req.body.description || '';
    const category            = req.body.category || 'operational';
    const journeyId           = req.body.journeyId || null;
    const deliveryId          = req.body.deliveryId || null;
    const expenseDate         = req.body.expenseDate;
    const expenseTime         = req.body.expenseTime;

    const files = req.files || {};

    // 2. Required numeric fields validation
    const fuelQuantity       = fuelQuantityStr ? parseFloat(fuelQuantityStr) : NaN;
    const pricePerLitre      = pricePerLitreStr ? parseFloat(pricePerLitreStr) : NaN;
    const currentMeterReading = currentMeterReadingStr ? parseFloat(currentMeterReadingStr) : NaN;

    if (isNaN(fuelQuantity) || fuelQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Fuel quantity is required and must be a positive number'
      });
    }

    if (isNaN(pricePerLitre) || pricePerLitre <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price per litre is required and must be a positive number'
      });
    }

    if (isNaN(currentMeterReading) || currentMeterReading < 0) {
      return res.status(400).json({
        success: false,
        message: 'Current meter reading is required and must be valid'
      });
    }

    // 3. Get logged-in driver from token
    const driver = await Driver.findById(req.user._id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    // 4. Vehicle number automatically driver profile se le lo
    if (!driver.vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'No vehicle number found in your profile. Please update your profile first.'
      });
    }

    const vehicleNumber = driver.vehicleNumber.toString().trim().toUpperCase();

    // 5. Previous meter reading (same vehicle ke liye)
    const lastExpense = await Expense.findOne({
      driver: driver._id,
      'vehicle.vehicleNumber': vehicleNumber,
      expenseType: 'fuel'
    }).sort({ 'meterReading.current': -1 }).select('meterReading.current');

    const previousMeterReading = lastExpense ? lastExpense.meterReading.current : 0;

    // 6. Total cost calculate karo
    const calculatedTotal = parseFloat((fuelQuantity * pricePerLitre).toFixed(2));
    const finalTotalCost = totalFuelCostStr ? parseFloat(totalFuelCostStr) : calculatedTotal;

    // 7. Date handling
    let finalExpenseDate = new Date();
    if (expenseDate) {
      const timePart = expenseTime ? expenseTime : '00:00';
      const dateTimeStr = `${expenseDate}T${timePart}:00`;
      finalExpenseDate = new Date(dateTimeStr);
      if (isNaN(finalExpenseDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date/time format. Use YYYY-MM-DD and optional HH:MM'
        });
      }
    }

    // 8. Expense create karo
    const expense = new Expense({
      expenseType: 'fuel',
      driver: driver._id,
      vehicle: {
        vehicleNumber,
        model: driver.vehicleModel || 'N/A'
      },
      journey: journeyId,
      delivery: deliveryId,
      fuelDetails: {
        quantity: fuelQuantity,
        pricePerLitre: pricePerLitre,
        totalFuelCost: finalTotalCost,
        fuelType,
        stationName,
        stationAddress,
        stationLocation: {
          latitude: stationLatitudeStr ? parseFloat(stationLatitudeStr) : null,
          longitude: stationLongitudeStr ? parseFloat(stationLongitudeStr) : null
        }
      },
      meterReading: {
        current: currentMeterReading,
        previous: previousMeterReading,
        difference: currentMeterReading - previousMeterReading
      },
      description,
      category,
      approvalWorkflow: {
        submittedBy: driver._id,
        submittedAt: new Date()
      },
      expenseDate: finalExpenseDate
    });

    // 9. File handling
    const uploadedReceipts = [];

    if (files.fuel_receipt?.[0]) {
      uploadedReceipts.push({
        type: 'fuel_receipt',
        url: `/uploads/expenses/${files.fuel_receipt[0].filename}`,
        filename: files.fuel_receipt[0].filename
      });
    }

    if (files.meter_photo?.[0]) {
      uploadedReceipts.push({
        type: 'meter_photo',
        url: `/uploads/expenses/${files.meter_photo[0].filename}`,
        filename: files.meter_photo[0].filename
      });
    }

    if (files.payment_receipt?.[0]) {
      if (!expense.paymentReceiptPhoto) expense.paymentReceiptPhoto = [];
      expense.paymentReceiptPhoto.push({
        url: `/uploads/expenses/${files.payment_receipt[0].filename}`,
        filename: files.payment_receipt[0].filename
      });
    }

    if (uploadedReceipts.length > 0) {
      expense.receipts = uploadedReceipts;
    }

    // 10. Save & response
    await expense.save();
    await expense.populate('driver', 'name phone vehicleNumber');

    // 11. Frontend ko vehicle number bhej dete hain (pre-filled ke liye useful)
    res.status(201).json({
      success: true,
      message: 'Fuel expense created successfully!',
      data: {
        expense,
        vehicleNumber,               // ← Ye line important hai! Frontend isse use kar sakta hai
        
        totalAmount: finalTotalCost,
        receiptsUploaded: uploadedReceipts.length,
        nextStep: uploadedReceipts.length > 0 ? 'submitted' : 'uploadReceipts',
        uploadMoreUrl: `/api/driver/expenses/${expense._id}/receipts`
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

// ==================== VEHICLE EXPENSES ====================

// CREATE VEHICLE EXPENSE (Multi-step form)
// exports.createVehicleExpense = async (req, res) => {
//   try {
//     const {
//       // Step 1: Vehicle Details
//       vehicleNumber,
//       vehicleType,

//       // Step 2: Expense Details
//       expenseAmount,
//       expenseType, // maintenance, repair, etc.

//       // Step 3: Meter Reading
//       currentMeterReading,

//       // Step 4: Additional Information
//       additionalNotes,

//       // Optional
//       description,
//       category,
//       journeyId,
//       deliveryId
//     } = req.body;

//     // Validation
//     if (!vehicleNumber || !vehicleType) {
//       return res.status(400).json({
//         success: false,
//         message: 'Vehicle number and type are required'
//       });
//     }

//     if (!expenseAmount) {
//       return res.status(400).json({
//         success: false,
//         message: 'Expense amount is required'
//       });
//     }

//     if (!currentMeterReading) {
//       return res.status(400).json({
//         success: false,
//         message: 'Current meter reading is required'
//       });
//     }

//     const driver = await Driver.findById(req.user._id);
//     if (!driver) {
//       return res.status(404).json({
//         success: false,
//         message: 'Driver profile not found'
//       });
//     }

//     // Get previous meter reading
//     const lastExpense = await Expense.findOne({
//       driver: driver._id,
//       'vehicle.vehicleNumber': vehicleNumber
//     }).sort({ 'meterReading.current': -1 });

//     const previousMeterReading = lastExpense ? lastExpense.meterReading.current : 0;

//     // Create vehicle expense
//     const expense = new Expense({
//       expenseType: expenseType || 'vehicle',
//       driver: driver._id,

//       vehicle: {
//         vehicleNumber: vehicleNumber.toUpperCase(),
//         vehicleType,
//         model: driver.vehicleModel || 'N/A'
//       },

//       journey: journeyId || null,
//       delivery: deliveryId || null,

//       // Vehicle expense details
//       vehicleExpenseDetails: {
//         expenseAmount: parseFloat(expenseAmount),
//         expenseType: expenseType || 'maintenance',
//         additionalNotes: additionalNotes || ''
//       },

//       // Meter reading
//       meterReading: {
//         current: parseFloat(currentMeterReading),
//         previous: previousMeterReading,
//         difference: parseFloat(currentMeterReading) - previousMeterReading
//       },

//       description: description || '',
//       additionalNotes: additionalNotes || '',
//       category: category || 'operational',

//       approvalWorkflow: {
//         submittedBy: driver._id,
//         submittedAt: Date.now()
//       },

//       expenseDate: Date.now()
//     });

//     await expense.save();
//     await expense.populate('driver', 'name email phone vehicleNumber vehicleType');

//     res.status(201).json({
//       success: true,
//       message: 'Vehicle expense created successfully. Please upload receipts to complete.',
//       data: { 
//         expense,
//         nextStep: 'uploadReceipts',
//         uploadUrl: `/api/driver/expenses/${expense._id}/receipts`
//       }
//     });

//   } catch (error) {
//     console.error('Create vehicle expense error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create vehicle expense',
//       error: error.message
//     });
//   }
// };

// exports.createVehicleExpense = async (req, res) => {
//   try {
//     const {
//       vehicleNumber,
      
//       expenseAmount,
//       expenseType, 
//       currentMeterReading,
//       additionalNotes,
//       description,
//       category,
//       journeyId,
//       deliveryId,

//       // New: Custom date and time
//       expenseDate,  // Format: YYYY-MM-DD
//       expenseTime   // Format: HH:MM (24-hour)
//     } = req.body;

//     const files = req.files || {};

//     // Validation
//     if (!vehicleNumber) {
//       return res.status(400).json({
//         success: false,
//         message: 'Vehicle number and type are required'
//       });
//     }

//     if (!expenseAmount) {
//       return res.status(400).json({
//         success: false,
//         message: 'Expense amount is required'
//       });
//     }

//     if (!currentMeterReading) {
//       return res.status(400).json({
//         success: false,
//         message: 'Current meter reading is required'
//       });
//     }

//     const driver = await Driver.findById(req.user._id);
//     if (!driver) {
//       return res.status(404).json({
//         success: false,
//         message: 'Driver profile not found'
//       });
//     }

//     // Get previous meter reading
//     const lastExpense = await Expense.findOne({
//       driver: driver._id,
//       'vehicle.vehicleNumber': vehicleNumber
//     }).sort({ 'meterReading.current': -1 });

//     const previousMeterReading = lastExpense ? lastExpense.meterReading.current : 0;

//     // Parse custom date and time, default to now
//     let finalExpenseDate = Date.now();
//     if (expenseDate) {
//       const dateTimeStr = expenseTime ? `${expenseDate}T${expenseTime}:00` : `${expenseDate}T00:00:00`;
//       finalExpenseDate = new Date(dateTimeStr);
//       if (isNaN(finalExpenseDate.getTime())) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid expense date or time format'
//         });
//       }
//     }

//     // Create vehicle expense
//     const expense = new Expense({
//       expenseType: expenseType || 'vehicle',
//       driver: driver._id,

//       vehicle: {
//         vehicleNumber: vehicleNumber.toUpperCase(),
//         model: driver.vehicleModel || 'N/A'
//       },

//       journey: journeyId || null,
//       delivery: deliveryId || null,

//       // Vehicle expense details
//       vehicleExpenseDetails: {
//         expenseAmount: parseFloat(expenseAmount),
//         expenseType: expenseType || 'maintenance',
//         additionalNotes: additionalNotes || ''
//       },

//       // Meter reading
//       meterReading: {
//         current: parseFloat(currentMeterReading),
//         previous: previousMeterReading,
//         difference: parseFloat(currentMeterReading) - previousMeterReading
//       },

//       description: description || '',
//       additionalNotes: additionalNotes || '',
//       category: category || 'operational',

//       approvalWorkflow: {
//         submittedBy: driver._id,
//         submittedAt: Date.now()
//       },

//       expenseDate: finalExpenseDate
//     });

//     const uploadedReceipts = [];

//     // Expense Bill
//     if (files.expense_bill && files.expense_bill[0]) {
//       uploadedReceipts.push({
//         type: 'expense_bill',
//         url: `/uploads/expenses/${files.expense_bill[0].filename}`,
//         filename: files.expense_bill[0].filename
//       });
//     }

//     if (uploadedReceipts.length > 0) {
//       expense.receipts = [...expense.receipts, ...uploadedReceipts];
//     }

//     await expense.save();
//     await expense.populate('driver', 'name email phone vehicleNumber');

//     res.status(201).json({
//       success: true,
//       message: 'Vehicle expense created successfully. You can upload more receipts if needed.',
//       data: {
//         expense,
//         nextStep: uploadedReceipts.length > 0 ? 'submitted' : 'uploadReceipts',
//         uploadUrl: `/api/driver/expenses/${expense._id}/receipts`
//       }
//     });

//   } catch (error) {
//     console.error('Create vehicle expense error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create vehicle expense',
//       error: error.message
//     });
//   }
// };

exports.createVehicleExpense = async (req, res) => {
  try {
    // ========== FORM-DATA SAFE EXTRACTION ==========
    const expenseAmountStr      = req.body.expenseAmount;
    const expenseType           = req.body.expenseType || 'maintenance';
    const currentMeterReadingStr = req.body.currentMeterReading;
    const additionalNotes       = req.body.additionalNotes || '';
    const description           = req.body.description || '';
    const category              = req.body.category || 'operational';
    const journeyId             = req.body.journeyId || null;
    const deliveryId            = req.body.deliveryId || null;
    const expenseDate           = req.body.expenseDate;         // YYYY-MM-DD
    const expenseTime           = req.body.expenseTime;         // HH:MM

    const files = req.files || {};

    // ========== VALIDATION & NUMBER CONVERSION ==========
    const expenseAmount = expenseAmountStr ? parseFloat(expenseAmountStr) : NaN;
    const currentMeterReading = currentMeterReadingStr ? parseFloat(currentMeterReadingStr) : NaN;

    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expense amount is required and must be greater than 0'
      });
    }

    if (isNaN(currentMeterReading) || currentMeterReading < 0) {
      return res.status(400).json({
        success: false,
        message: 'Current meter reading is required and must be valid'
      });
    }

    // ========== GET DRIVER & AUTO-FILL VEHICLE NUMBER ==========
    const driver = await Driver.findById(req.user._id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    if (!driver.vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'No vehicle number found in your profile. Please update profile first.'
      });
    }

    const vehicleNumber = driver.vehicleNumber.toString().trim().toUpperCase();

    // ========== PREVIOUS METER READING ==========
    const lastExpense = await Expense.findOne({
      driver: driver._id,
      'vehicle.vehicleNumber': vehicleNumber
    })
      .sort({ 'meterReading.current': -1 })
      .select('meterReading.current');

    const previousMeterReading = lastExpense ? lastExpense.meterReading.current : 0;

    // ========== DATE HANDLING ==========
    let finalExpenseDate = new Date();
    if (expenseDate) {
      const timePart = expenseTime ? expenseTime : '00:00';
      const dateTimeStr = `${expenseDate}T${timePart}:00`;
      finalExpenseDate = new Date(dateTimeStr);

      if (isNaN(finalExpenseDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date/time format. Use YYYY-MM-DD and optional HH:MM'
        });
      }
    }

    // ========== CREATE EXPENSE DOCUMENT ==========
    const expense = new Expense({
      expenseType: expenseType || 'vehicle',
      driver: driver._id,

      vehicle: {
        vehicleNumber,
        model: driver.vehicleModel || 'N/A'
      },

      journey: journeyId,
      delivery: deliveryId,

      vehicleExpenseDetails: {
        expenseAmount,
        expenseType,
        additionalNotes
      },

      meterReading: {
        current: currentMeterReading,
        previous: previousMeterReading,
        difference: currentMeterReading - previousMeterReading
      },

      description,
      category,

      approvalWorkflow: {
        submittedBy: driver._id,
        submittedAt: new Date()
      },

      expenseDate: finalExpenseDate
    });

    // ========== FILE HANDLING ==========
    const uploadedReceipts = [];

    if (files.expense_bill?.[0]) {
      uploadedReceipts.push({
        type: 'expense_bill',
        url: `/uploads/expenses/${files.expense_bill[0].filename}`,
        filename: files.expense_bill[0].filename
      });
    }

    if (uploadedReceipts.length > 0) {
      expense.receipts = uploadedReceipts;
    }

    // ========== SAVE & RESPONSE ==========
    await expense.save();
    await expense.populate('driver', 'name phone vehicleNumber');

    res.status(201).json({
      success: true,
      message: 'Vehicle expense created successfully!',
      data: {
        expense,
        vehicleNumber,                // ← Frontend can use this (pre-filled)
        
        expenseAmount,
        meterDifference: currentMeterReading - previousMeterReading,
        receiptsUploaded: uploadedReceipts.length,
        nextStep: uploadedReceipts.length > 0 ? 'submitted' : 'uploadReceipts',
        uploadMoreUrl: `/api/driver/expenses/${expense._id}/receipts`
      }
    });

  } catch (error) {
    console.error('Create vehicle expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vehicle expense',
      error: error.message
    });
  }
};

// ==================== FILE UPLOADS ====================

// UPLOAD RECEIPTS & PHOTOS (Steps 5, 6, 7 of Add Expense forms)
exports.uploadReceipts = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const files = req.files;

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    const driver = await Driver.findById(req.user._id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    if (expense.driver.toString() !== driver._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only upload receipts for your own expenses'
      });
    }

    const uploadedReceipts = [];

    // Step 5: Fuel Receipt Photo (for fuel expenses)
    if (files.fuel_receipt && files.fuel_receipt[0]) {
      uploadedReceipts.push({
        type: 'fuel_receipt',
        url: `/uploads/expenses/${files.fuel_receipt[0].filename}`,
        filename: files.fuel_receipt[0].filename
      });
    }

    // Step 5: Meter Reading Photo
    if (files.meter_photo && files.meter_photo[0]) {
      uploadedReceipts.push({
        type: 'meter_photo',
        url: `/uploads/expenses/${files.meter_photo[0].filename}`,
        filename: files.meter_photo[0].filename
      });
    }

    // Expense Bill (for vehicle expenses)
    if (files.expense_bill && files.expense_bill[0]) {
      uploadedReceipts.push({
        type: 'expense_bill',
        url: `/uploads/expenses/${files.expense_bill[0].filename}`,
        filename: files.expense_bill[0].filename
      });
    }

    // Step 7: Payment Receipt Photo
    if (files.payment_receipt && files.payment_receipt[0]) {
      expense.paymentReceiptPhoto.push({
        url: `/uploads/expenses/${files.payment_receipt[0].filename}`,
        filename: files.payment_receipt[0].filename
      });
    }


    // Add receipts to array
    expense.receipts = [...expense.receipts, ...uploadedReceipts];
    await expense.save();
    await expense.populate('driver', 'name phone vehicleNumber');

    return res.status(200).json({
      success: true,
      message: 'Files uploaded successfully! Your expense is now submitted for approval.',
      data: {
        expenseId: expense._id,
        uploadedReceipts,
        totalReceipts: expense.receipts.length,
        browseUploadFiles: expense.browseUploadFiles.length,
        paymentReceiptPhoto: expense.paymentReceiptPhoto.length,
        status: expense.approvalStatus
      }
    });

  } catch (error) {
    console.error('Upload receipts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: error.message
    });
  }
};

// ==================== GET EXPENSES ====================

// GET MY EXPENSES - With tab filters (All, Fuel, Maintenance, Vehicle)
exports.getMyExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      expenseType = 'all',  // Tab filter: 'all', 'fuel', 'maintenance', 'vehicle'
      approvalStatus,
      startDate,
      endDate
    } = req.query;

    const driver = await Driver.findById(req.user._id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    const query = { driver: driver._id };

    // Apply tab filter
    if (expenseType && expenseType !== 'all') {
      query.expenseType = expenseType;
    }

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

    // Format expenses to match UI cards
    const formattedExpenses = expenses.map(exp => {
      const baseData = {
        _id: exp._id,
        expenseType: exp.expenseType,
        date: exp.expenseDate,
        vehicle: exp.vehicle,
        status: exp.approvalStatus,
        meterReading: exp.meterReading.current
      };

      if (exp.expenseType === 'fuel') {
        return {
          ...baseData,
          amount: exp.fuelDetails.totalFuelCost,
          quantity: exp.fuelDetails.quantity,
          stationName: exp.fuelDetails.stationName,
          fuelType: exp.fuelDetails.fuelType,
          mileage: exp.mileageData.averageMileage
        };
      } else {
        return {
          ...baseData,
          amount: exp.vehicleExpenseDetails?.expenseAmount || 0,
          notes: exp.vehicleExpenseDetails?.additionalNotes || exp.description
        };
      }
    });

    const total = await Expense.countDocuments(query);

    // Statistics for all tabs
    const stats = await Expense.aggregate([
      { $match: { driver: driver._id } },
      {
        $group: {
          _id: null,
          totalExpenses: {
            $sum: {
              $cond: [
                { $eq: ['$expenseType', 'fuel'] },
                '$fuelDetails.totalFuelCost',
                '$vehicleExpenseDetails.expenseAmount'
              ]
            }
          },
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
          },
          fuelCount: {
            $sum: { $cond: [{ $eq: ['$expenseType', 'fuel'] }, 1, 0] }
          },
          maintenanceCount: {
            $sum: { $cond: [{ $eq: ['$expenseType', 'maintenance'] }, 1, 0] }
          },
          vehicleCount: {
            $sum: { $cond: [{ $in: ['$expenseType', ['vehicle', 'repair', 'toll', 'parking', 'other']] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        expenses: formattedExpenses,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        },
        statistics: stats[0] || {},
        activeFilter: expenseType
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

// GET EXPENSE BY ID - Detailed view matching detail screens
exports.getExpenseById = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const driver = await Driver.findById(req.user._id);
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
      .populate('driver', 'name email phone vehicleNumber')
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

    // Format response exactly as shown in detail screens
    const response = {
      _id: expense._id,
      expenseType: expense.expenseType,
      date: expense.expenseDate,
      status: expense.approvalStatus,

      // Vehicle info
      vehicle: expense.vehicle,
      driver: {
        name: expense.driver.name,
        phone: expense.driver.phone,
        vehicleNumber: expense.driver.vehicleNumber
      },

      // Conditional fields based on expense type
      ...(expense.expenseType === 'fuel' ? {
        // Fuel expense specific fields
        fuelQuantity: expense.fuelDetails.quantity,
        pricePerLitre: expense.fuelDetails.pricePerLitre,
        totalFuelCost: expense.fuelDetails.totalFuelCost,
        fuelType: expense.fuelDetails.fuelType,
        stationName: expense.fuelDetails.stationName,
        stationAddress: expense.fuelDetails.stationAddress,
        mileage: expense.mileageData.averageMileage,
        distanceCovered: expense.mileageData.distanceCovered,
      } : {
        // Vehicle expense specific fields
        expenseAmount: expense.vehicleExpenseDetails?.expenseAmount,
        additionalNotes: expense.vehicleExpenseDetails?.additionalNotes,
      }),

      // Meter reading (common for both)
      currentMeterReading: expense.meterReading.current,
      previousMeterReading: expense.meterReading.previous,
      meterReadingDifference: expense.meterReading.difference,

      // Files
      receipts: expense.receipts,
      browseUploadFiles: expense.browseUploadFiles,
      paymentReceiptPhoto: expense.paymentReceiptPhoto,

      // Approval details
      approvalWorkflow: expense.approvalWorkflow,
      rejectionReason: expense.rejectionReason,

      // Additional info
      description: expense.description,
      remarks: expense.remarks,
      category: expense.category,

      // References
      journey: expense.journey,
      delivery: expense.delivery,

      // Timestamps
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt
    };

    res.status(200).json({
      success: true,
      data: { expense: response }
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

// ==================== MILEAGE & ANALYTICS ====================

// CALCULATE MY MILEAGE 
exports.calculateMyMileage = async (req, res) => {
  try {
    const { vehicleNumber, startDate, endDate } = req.query;

    const driver = await Driver.findById(req.user._id);
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

// GET MY EXPENSE SUMMARY
exports.getMyExpenseSummary = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    const driver = await Driver.findById(req.user._id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

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
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const matchStage = {
      driver: driver._id,
      expenseDate: { $gte: startDate }
    };

    const summary = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalExpenses: {
            $sum: {
              $cond: [
                { $eq: ['$expenseType', 'fuel'] },
                '$fuelDetails.totalFuelCost',
                '$vehicleExpenseDetails.expenseAmount'
              ]
            }
          },
          totalRecords: { $sum: 1 },
          avgExpense: {
            $avg: {
              $cond: [
                { $eq: ['$expenseType', 'fuel'] },
                '$fuelDetails.totalFuelCost',
                '$vehicleExpenseDetails.expenseAmount'
              ]
            }
          },
          totalFuel: { $sum: '$fuelDetails.quantity' },
          totalDistance: { $sum: '$mileageData.distanceCovered' },
          avgMileage: { $avg: '$mileageData.averageMileage' }
        }
      }
    ]);

    const byType = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$expenseType',
          total: {
            $sum: {
              $cond: [
                { $eq: ['$expenseType', 'fuel'] },
                '$fuelDetails.totalFuelCost',
                '$vehicleExpenseDetails.expenseAmount'
              ]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const approvalStatus = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 },
          totalAmount: {
            $sum: {
              $cond: [
                { $eq: ['$expenseType', 'fuel'] },
                '$fuelDetails.totalFuelCost',
                '$vehicleExpenseDetails.expenseAmount'
              ]
            }
          }
        }
      }
    ]);

    const dailyBreakdown = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$expenseDate' } },
          totalExpense: {
            $sum: {
              $cond: [
                { $eq: ['$expenseType', 'fuel'] },
                '$fuelDetails.totalFuelCost',
                '$vehicleExpenseDetails.expenseAmount'
              ]
            }
          },
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

// ==================== UPDATE & DELETE ====================

// UPDATE EXPENSE (Only if pending or rejected)
exports.updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const updates = req.body;

    const driver = await Driver.findById(req.user._id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const expense = await Expense.findOne({
      _id: expenseId,
      driver: driver._id
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (!['pending', 'rejected'].includes(expense.approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update expense that is already approved'
      });
    }

    let isResubmitted = false;
    let shouldRecalculateMileage = false;

    // === COMMON FIELDS (for all expense types) ===
    if (updates.description !== undefined) expense.description = updates.description;
    if (updates.category !== undefined) expense.category = updates.category;
    if (updates.remarks !== undefined) expense.remarks = updates.remarks;

    // === FUEL EXPENSE SPECIFIC ===
    if (expense.expenseType === 'fuel') {
      let shouldRecalculateTotal = false;

      if (updates.fuelQuantity !== undefined) {
        expense.fuelDetails.quantity = parseFloat(updates.fuelQuantity);
        shouldRecalculateTotal = true;
      }

      // Accept both naming conventions
      if (updates.pricePerLitre !== undefined || updates.pricePerUnit !== undefined) {
        expense.fuelDetails.pricePerLitre = parseFloat(updates.pricePerLitre || updates.pricePerUnit);
        shouldRecalculateTotal = true;
      }

      if (updates.fuelType !== undefined) expense.fuelDetails.fuelType = updates.fuelType;
      if (updates.stationName !== undefined) expense.fuelDetails.stationName = updates.stationName;
      if (updates.stationAddress !== undefined) expense.fuelDetails.stationAddress = updates.stationAddress;

      if (updates.stationLatitude !== undefined || updates.stationLongitude !== undefined) {
        expense.fuelDetails.stationLocation = expense.fuelDetails.stationLocation || {};
        if (updates.stationLatitude !== undefined) {
          expense.fuelDetails.stationLocation.coordinates.latitude = parseFloat(updates.stationLatitude);
        }
        if (updates.stationLongitude !== undefined) {
          expense.fuelDetails.stationLocation.coordinates.longitude = parseFloat(updates.stationLongitude);
        }
      }

      // Current meter reading update
      if (updates.currentMeterReading !== undefined) {
        expense.meterReading.current = parseFloat(updates.currentMeterReading);
        shouldRecalculateMileage = true;
      }

      // === TOTAL FUEL COST LOGIC ===
      // If driver sends exact total from receipt → use it directly
      if (updates.totalFuelCost !== undefined || updates.totalAmount !== undefined) {
        expense.fuelDetails.totalAmount = parseFloat(updates.totalFuelCost || updates.totalAmount);
      }
      // Otherwise, recalculate from quantity × price
      else if (shouldRecalculateTotal) {
        expense.fuelDetails.totalAmount = parseFloat(
          (expense.fuelDetails.quantity * expense.fuelDetails.pricePerLitre).toFixed(2)
        );
      }
    }

    // === VEHICLE EXPENSE SPECIFIC (maintenance, repair, toll, etc.) ===
    else {
      if (updates.expenseAmount !== undefined) {
        // Adjust based on your schema field name
        if (expense.vehicleExpenseDetails) {
          expense.vehicleExpenseDetails.expenseAmount = parseFloat(updates.expenseAmount);
        } else {
          // Fallback if you store amount elsewhere
          expense.fuelDetails = expense.fuelDetails || {};
          expense.fuelDetails.totalAmount = parseFloat(updates.expenseAmount);
        }
      }

      if (updates.additionalNotes !== undefined) {
        if (expense.vehicleExpenseDetails) {
          expense.vehicleExpenseDetails.additionalNotes = updates.additionalNotes;
        } else {
          expense.description = updates.additionalNotes;
        }
      }

      if (updates.currentMeterReading !== undefined) {
        expense.meterReading.current = parseFloat(updates.currentMeterReading);
      }
    }

    // === RECALCULATE MILEAGE IF METER READING CHANGED ===
    if (shouldRecalculateMileage) {
      const lastExpense = await Expense.findOne({
        driver: driver._id,
        'vehicle.vehicleNumber': expense.vehicle.vehicleNumber,
        expenseType: 'fuel',
        _id: { $ne: expense._id }
      }).sort({ 'meterReading.current': -1 });

      const previousReading = lastExpense ? lastExpense.meterReading.current : 0;
      expense.meterReading.previous = previousReading;
      expense.meterReading.difference = expense.meterReading.current - previousReading;

      if (expense.expenseType === 'fuel' && expense.meterReading.difference > 0 && expense.fuelDetails.quantity > 0) {
        expense.mileageData.distanceCovered = expense.meterReading.difference;
        expense.mileageData.fuelConsumed = expense.fuelDetails.quantity;
        expense.mileageData.averageMileage = parseFloat(
          (expense.meterReading.difference / expense.fuelDetails.quantity).toFixed(2)
        );
      }
    }

    // === HANDLE RESUBMISSION AFTER REJECTION ===
    if (expense.approvalStatus === 'rejected') {
      expense.approvalStatus = 'pending';
      expense.rejectionReason = null;
      expense.rejectedBy = null;
      expense.rejectedAt = null;
      expense.resubmittedAt = new Date();
      expense.resubmittedCount = (expense.resubmittedCount || 0) + 1;
      isResubmitted = true;
    }

    await expense.save();

    // Populate for clean response
    await expense.populate('driver', 'name phone vehicleNumber vehicleType');

    return res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      note: isResubmitted
        ? 'Your expense has been resubmitted for approval'
        : 'Expense details updated',
      data: { expense }
    });

  } catch (error) {
    console.error('Update expense error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: error.message || 'Internal server error'
    });
  }
};

//  DELETE EXPENSE (DRIVER - Only if pending) 
exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    // Get driver
    const driver = await Driver.findById(req.user._id);
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
