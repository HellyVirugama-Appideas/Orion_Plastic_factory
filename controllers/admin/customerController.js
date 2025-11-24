const Customer = require('../../models/Customer');
const Region = require('../../models/Region');
const { successResponse, errorResponse } = require('../../utils/responseHelper');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');

//  CREATE CUSTOMER 
exports.createCustomer = async (req, res) => {
  try {
    const {
      customerType,
      name,
      companyName,
      email,
      phone,
      alternatePhone,
      gstNumber,
      panNumber,
      locations,
      billingAddress,
      paymentTerms,
      creditLimit,
      preferences,
      tags,
      category,
      notes
    } = req.body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone }
      ]
    });

    if (existingCustomer) {
      if (existingCustomer.email === email.toLowerCase()) {
        return errorResponse(res, 'Email already exists', 400);
      }
      if (existingCustomer.phone === phone) {
        return errorResponse(res, 'Phone number already exists', 400);
      }
    }

    // Auto-assign regions based on zipcodes
    if (locations && locations.length > 0) {
      for (let location of locations) {
        if (location.zipcode && location.regionAutoAssigned !== false) {
          const region = await Region.findByZipcode(location.zipcode);
          if (region) {
            location.regionId = region._id;
            location.regionAutoAssigned = true;
          }
        }
      }
    }

    // Create customer
    const customer = await Customer.create({
      customerType,
      name,
      companyName,
      email: email.toLowerCase(),
      phone,
      alternatePhone,
      gstNumber: gstNumber?.toUpperCase(),
      panNumber: panNumber?.toUpperCase(),
      locations: locations || [],
      billingAddress,
      paymentTerms: paymentTerms || 'cod',
      creditLimit: creditLimit || 0,
      preferences: preferences || {},
      tags: tags || [],
      category: category || 'regular',
      notes,
      createdBy: req.user._id
    });

    return successResponse(res, 'Customer created successfully', {
      customer
    }, 201);

  } catch (error) {
    console.error('Create Customer Error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, messages.join(', '), 400);
    }
    if (error.code === 11000) {
      return errorResponse(res, 'Duplicate customer details', 400);
    }
    return errorResponse(res, 'Failed to create customer', 500);
  }
};

//  GET ALL CUSTOMERS 
exports.getAllCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      customerType,
      category,
      search,
      regionId,
      zipcode,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Filters
    if (status) query.status = status;
    if (customerType) query.customerType = customerType;
    if (category) query.category = category;
    if (regionId) query['locations.regionId'] = regionId;
    if (zipcode) query['locations.zipcode'] = zipcode;

    // Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .populate('locations.regionId', 'regionName regionCode')
        .populate('accountManager', 'name email')
        .populate('createdBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Customer.countDocuments(query)
    ]);

    return successResponse(res, 'Customers retrieved successfully', {
      customers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get All Customers Error:', error);
    return errorResponse(res, 'Failed to retrieve customers', 500);
  }
};

//  GET CUSTOMER BY ID 
exports.getCustomerById = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId)
      .populate('locations.regionId', 'regionName regionCode state')
      .populate('accountManager', 'name email phone')
      .populate('createdBy', 'name email');

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    return successResponse(res, 'Customer retrieved successfully', {
      customer
    });

  } catch (error) {
    console.error('Get Customer By ID Error:', error);
    return errorResponse(res, 'Failed to retrieve customer', 500);
  }
};

//  UPDATE CUSTOMER 
exports.updateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.customerId;
    delete updates.stats;
    delete updates.createdBy;

    const customer = await Customer.findByIdAndUpdate(
      customerId,
      updates,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    return successResponse(res, 'Customer updated successfully', {
      customer
    });

  } catch (error) {
    console.error('Update Customer Error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, messages.join(', '), 400);
    }
    return errorResponse(res, 'Failed to update customer', 500);
  }
};

//  DELETE CUSTOMER 
exports.deleteCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    // Soft delete - change status
    customer.status = 'inactive';
    await customer.save();

    return successResponse(res, 'Customer deleted successfully', {
      customerId: customer._id
    });

  } catch (error) {
    console.error('Delete Customer Error:', error);
    return errorResponse(res, 'Failed to delete customer', 500);
  }
};

//  ADD LOCATION 
exports.addLocation = async (req, res) => {
  try {
    const { customerId } = req.params;
    const locationData = req.body;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    // Auto-assign region if zipcode provided
    if (locationData.zipcode && locationData.regionAutoAssigned !== false) {
      const region = await Region.findByZipcode(locationData.zipcode);
      if (region) {
        locationData.regionId = region._id;
        locationData.regionAutoAssigned = true;
      }
    }

    customer.addLocation(locationData);
    await customer.save();

    return successResponse(res, 'Location added successfully', {
      customer: {
        id: customer._id,
        name: customer.name,
        locations: customer.locations
      }
    });

  } catch (error) {
    console.error('Add Location Error:', error);
    return errorResponse(res, 'Failed to add location', 500);
  }
};

//  UPDATE LOCATION 
exports.updateLocation = async (req, res) => {
  try {
    const { customerId, locationId } = req.params;
    const updates = req.body;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    const location = customer.locations.id(locationId);

    if (!location) {
      return errorResponse(res, 'Location not found', 404);
    }

    // Update location fields
    Object.keys(updates).forEach(key => {
      location[key] = updates[key];
    });

    // Auto-assign region if zipcode changed
    if (updates.zipcode && location.regionAutoAssigned !== false) {
      const region = await Region.findByZipcode(updates.zipcode);
      if (region) {
        location.regionId = region._id;
        location.regionAutoAssigned = true;
      }
    }

    await customer.save();

    return successResponse(res, 'Location updated successfully', {
      customer: {
        id: customer._id,
        name: customer.name,
        locations: customer.locations
      }
    });

  } catch (error) {
    console.error('Update Location Error:', error);
    return errorResponse(res, 'Failed to update location', 500);
  }
};

//  DELETE LOCATION 
exports.deleteLocation = async (req, res) => {
  try {
    const { customerId, locationId } = req.params;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    const locationIndex = customer.locations.findIndex(
      loc => loc._id.toString() === locationId
    );

    if (locationIndex === -1) {
      return errorResponse(res, 'Location not found', 404);
    }

    if (customer.locations.length === 1) {
      return errorResponse(res, 'Cannot delete the only location', 400);
    }

    const locationToDelete = customer.locations[locationIndex];

    // Agar primary location delete ho rahi hai
    if (locationToDelete.isPrimary) {
      // Koi aur location ko primary bana do
      const newPrimaryIndex = locationIndex === 0 ? 1 : 0;
      customer.locations[newPrimaryIndex].isPrimary = true;
    }

    // YE SABSE SAFE AUR WORKING TAREEKA HAI
    customer.locations.splice(locationIndex, 1);
    // Ya phir: customer.locations.pull(locationId);

    await customer.save();

    return successResponse(res, 'Location deleted successfully', {
      customerId,
      totalLocationsLeft: customer.locations.length
    });

  } catch (error) {
    console.error('Delete Location Error:', error);
    return errorResponse(res, 'Failed to delete location', 500);
  }
};

//  OVERRIDE REGION 
exports.overrideRegion = async (req, res) => {
  try {
    const { customerId, locationId } = req.params;
    const { regionId } = req.body;

    if (!regionId) {
      return errorResponse(res, 'Region ID is required', 400);
    }

    const customer = await Customer.findById(customerId);
    const region = await Region.findById(regionId);

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    if (!region) {
      return errorResponse(res, 'Region not found', 404);
    }

    const location = customer.locations.id(locationId);

    if (!location) {
      return errorResponse(res, 'Location not found', 404);
    }

    // Override region
    location.regionId = region._id;
    location.regionAutoAssigned = false; // Mark as manually assigned

    await customer.save();

    return successResponse(res, 'Region overridden successfully', {
      location: {
        id: location._id,
        locationName: location.locationName,
        zipcode: location.zipcode,
        regionId: location.regionId,
        regionAutoAssigned: location.regionAutoAssigned
      }
    });

  } catch (error) {
    console.error('Override Region Error:', error);
    return errorResponse(res, 'Failed to override region', 500);
  }
};

//  TOGGLE FEEDBACK NOTIFICATION 
exports.toggleFeedbackNotification = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    customer.toggleFeedbackNotification();
    await customer.save();

    return successResponse(res, 'Feedback notification preference updated', {
      customer: {
        id: customer._id,
        name: customer.name,
        feedbackNotification: customer.preferences.feedbackNotification
      }
    });

  } catch (error) {
    console.error('Toggle Feedback Notification Error:', error);
    return errorResponse(res, 'Failed to update notification preference', 500);
  }
};

//  UPDATE PREFERENCES 
exports.updatePreferences = async (req, res) => {
  try {
    const { customerId } = req.params;
    const preferences = req.body;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    customer.preferences = {
      ...customer.preferences,
      ...preferences
    };

    await customer.save();

    return successResponse(res, 'Preferences updated successfully', {
      customer: {
        id: customer._id,
        name: customer.name,
        preferences: customer.preferences
      }
    });

  } catch (error) {
    console.error('Update Preferences Error:', error);
    return errorResponse(res, 'Failed to update preferences', 500);
  }
};

// BULK IMPORT (CSV) 
// exports.bulkImport = async (req, res) => {
//   try {
//     if (!req.file) {
//       return errorResponse(res, 'CSV file is required', 400);
//     }

//     const filePath = req.file.path;
//     const results = [];
//     const errors = [];

//     // Read CSV file
//     fs.createReadStream(filePath)
//       .pipe(csv())
//       .on('data', async (row) => {
//         try {
//           // Map CSV columns to customer schema
//           const customerData = {
//             customerType: row.customerType || 'individual',
//             name: row.name,
//             companyName: row.companyName,
//             email: row.email?.toLowerCase(),
//             phone: row.phone,
//             alternatePhone: row.alternatePhone,
//             gstNumber: row.gstNumber?.toUpperCase(),
//             panNumber: row.panNumber?.toUpperCase(),
//             paymentTerms: row.paymentTerms || 'cod',
//             creditLimit: parseFloat(row.creditLimit) || 0,
//             category: row.category || 'regular',
//             notes: row.notes,
//             createdBy: req.user._id
//           };

//           // Add location if provided
//           if (row.addressLine1 && row.city && row.zipcode) {
//             const locationData = {
//               locationName: row.locationName || 'Primary Location',
//               addressLine1: row.addressLine1,
//               addressLine2: row.addressLine2,
//               city: row.city,
//               state: row.state,
//               zipcode: row.zipcode,
//               isPrimary: true,
//               contactPerson: {
//                 name: row.contactPersonName,
//                 phone: row.contactPersonPhone,
//                 email: row.contactPersonEmail
//               }
//             };

//             // Auto-assign region
//             if (row.zipcode) {
//               const region = await Region.findByZipcode(row.zipcode);
//               if (region) {
//                 locationData.regionId = region._id;
//                 locationData.regionAutoAssigned = true;
//               }
//             }

//             customerData.locations = [locationData];
//           }

//           results.push(customerData);

//         } catch (error) {
//           errors.push({
//             row: row,
//             error: error.message
//           });
//         }
//       })
//       .on('end', async () => {
//         try {
//           // Bulk insert customers
//           const customers = await Customer.insertMany(results, {
//             ordered: false, // Continue on error
//             rawResult: true
//           });

//           // Delete uploaded file
//           fs.unlinkSync(filePath);

//           return successResponse(res, 'Bulk import completed', {
//             imported: customers.insertedCount || results.length - errors.length,
//             failed: errors.length,
//             errors: errors.slice(0, 10) // Show first 10 errors
//           }, 201);

//         } catch (error) {
//           console.error('Bulk Insert Error:', error);

//           // Delete uploaded file
//           if (fs.existsSync(filePath)) {
//             fs.unlinkSync(filePath);
//           }

//           return errorResponse(res, 'Bulk import failed', 500);
//         }
//       });

//   } catch (error) {
//     console.error('Bulk Import Error:', error);

//     // Delete uploaded file
//     if (req.file && fs.existsSync(req.file.path)) {
//       fs.unlinkSync(req.file.path);
//     }

//     return errorResponse(res, 'Failed to import customers', 500);
//   }
// };
exports.bulkImport = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'CSV file is required', 400);
    }

    const filePath = req.file.path;
    const results = [];
    const errors = [];

    const parsePromise = new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            // Clean row
            const cleanRow = {};
            Object.keys(row).forEach(key => {
              const value = row[key];
              cleanRow[key] = typeof value === 'string' ? value.trim() : value;
            });

            // Required fields
            if (!cleanRow.name || !cleanRow.phone) {
              errors.push({ row: cleanRow, error: 'Name and phone are required' });
              return;
            }

            // Generate customerId manually (to avoid null duplicate error)
            const tempCustomerId = `TEMP_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

            const customerData = {
              customerId: tempCustomerId, // Manually set
              customerType: cleanRow.customerType || 'individual',
              name: cleanRow.name,
              companyName: cleanRow.companyName || null,
              email: cleanRow.email ? cleanRow.email.toLowerCase() : null,
              phone: cleanRow.phone,
              alternatePhone: cleanRow.alternatePhone || null,
              gstNumber: cleanRow.gstNumber ? cleanRow.gstNumber.toUpperCase() : null,
              panNumber: cleanRow.panNumber ? cleanRow.panNumber.toUpperCase() : null,

              // Fix enum values
              paymentTerms: cleanRow.paymentTerms === '0' || !cleanRow.paymentTerms ? 'cod' : cleanRow.paymentTerms,
              creditLimit: parseFloat(cleanRow.creditLimit) || 0,

              // Fix category enum
              category: ['vip', 'regular', 'wholesale', 'retail', 'distributor'].includes(cleanRow.category)
                ? cleanRow.category
                : 'regular',

              notes: cleanRow.notes || null,
              createdBy: req.user._id,

              // Fix zipcode — force 6 digit string
              ...(cleanRow.addressLine1 && cleanRow.city && cleanRow.zipcode && {
                locations: [{
                  locationName: cleanRow.locationName || 'Primary Location',
                  addressLine1: cleanRow.addressLine1,
                  addressLine2: cleanRow.addressLine2 || null,
                  city: cleanRow.city,
                  state: cleanRow.state || 'Maharashtra',
                  zipcode: String(cleanRow.zipcode).padStart(6, '0').slice(0, 6), // Force 6 digit
                  country: 'India',
                  isPrimary: true,
                  regionAutoAssigned: false,
                  contactPerson: {
                    name: cleanRow.contactPersonName || cleanRow.name,
                    phone: cleanRow.contactPersonPhone || cleanRow.phone,
                    email: cleanRow.contactPersonEmail || cleanRow.email || null
                  }
                }]
              })
            };

            results.push(customerData);

          } catch (error) {
            errors.push({ row, error: error.message });
          }
        })
        .on('end', () => resolve({ results, errors }))
        .on('error', reject);
    });

    const { results: parsedResults, errors: parseErrors } = await parsePromise;

    let imported = 0;
    if (parsedResults.length > 0) {
      // Insert with validation OFF to avoid enum/zipcode issues
      const insertResult = await Customer.insertMany(parsedResults, {
        ordered: false,
        rawResult: true,
        // validation skip nahi hota, lekin humne sab fix kar diya
      });
      imported = Object.keys(insertResult.insertedIds).length;
    }

    // Cleanup
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    return successResponse(res, 'Bulk import completed!', {
      imported,
      failed: parseErrors.length,
      total: parsedResults.length,
      errors: parseErrors.slice(0, 10)
    }, 201);

  } catch (error) {
    console.error('Bulk Import Error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return errorResponse(res, 'Import failed: ' + error.message, 500);
  }
};

// BULK EXPORT (CSV) 
exports.bulkExport = async (req, res) => {
  try {
    const {
      status,
      customerType,
      category,
      regionId
    } = req.query;

    const query = {};

    // Apply filters
    if (status) query.status = status;
    if (customerType) query.customerType = customerType;
    if (category) query.category = category;
    if (regionId) query['locations.regionId'] = regionId;

    // Get customers
    const customers = await Customer.find(query)
      .populate('locations.regionId', 'regionName regionCode')
      .lean();

    if (customers.length === 0) {
      return errorResponse(res, 'No customers found to export', 404);
    }

    // Flatten data for CSV
    const flattenedData = customers.map(customer => {
      const primaryLocation = customer.locations.find(loc => loc.isPrimary) || customer.locations[0];

      return {
        customerId: customer.customerId,
        customerType: customer.customerType,
        name: customer.name,
        companyName: customer.companyName || '',
        email: customer.email,
        phone: customer.phone,
        alternatePhone: customer.alternatePhone || '',
        gstNumber: customer.gstNumber || '',
        panNumber: customer.panNumber || '',
        status: customer.status,
        category: customer.category,
        paymentTerms: customer.paymentTerms,
        creditLimit: customer.creditLimit,
        currentCredit: customer.currentCredit,
        locationName: primaryLocation?.locationName || '',
        addressLine1: primaryLocation?.addressLine1 || '',
        addressLine2: primaryLocation?.addressLine2 || '',
        city: primaryLocation?.city || '',
        state: primaryLocation?.state || '',
        zipcode: primaryLocation?.zipcode || '',
        regionName: primaryLocation?.regionId?.regionName || '',
        regionCode: primaryLocation?.regionId?.regionCode || '',
        contactPersonName: primaryLocation?.contactPerson?.name || '',
        contactPersonPhone: primaryLocation?.contactPerson?.phone || '',
        contactPersonEmail: primaryLocation?.contactPerson?.email || '',
        totalOrders: customer.stats?.totalOrders || 0,
        totalDeliveries: customer.stats?.totalDeliveries || 0,
        totalSpent: customer.stats?.totalSpent || 0,
        feedbackNotification: customer.preferences?.feedbackNotification || false,
        notes: customer.notes || '',
        createdAt: customer.createdAt
      }; 
    });

    // Define CSV fields
    const fields = [
      'customerId', 'customerType', 'name', 'companyName', 'email', 'phone',
      'alternatePhone', 'gstNumber', 'panNumber', 'status', 'category',
      'paymentTerms', 'creditLimit', 'currentCredit', 'locationName',
      'addressLine1', 'addressLine2', 'city', 'state', 'zipcode',
      'regionName', 'regionCode', 'contactPersonName', 'contactPersonPhone',
      'contactPersonEmail', 'totalOrders', 'totalDeliveries', 'totalSpent',
      'feedbackNotification', 'notes', 'createdAt'
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(flattenedData);

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=customers_export_${Date.now()}.csv`);

    return res.status(200).send(csv);

  } catch (error) {
    console.error('Bulk Export Error:', error);
    return errorResponse(res, 'Failed to export customers', 500);
  }
};


// GET CUSTOMER STATISTICS 
exports.getCustomerStatistics = async (req, res) => {
  try {
    const [
      totalCustomers,
      activeCustomers,
      blockedCustomers,
      customersByType,
      customersByCategory,
      topCustomers,
      recentCustomers
    ] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ status: 'active' }),
      Customer.countDocuments({ status: 'blocked' }),
      Customer.aggregate([
        { $group: { _id: '$customerType', count: { $sum: 1 } } }
      ]),
      Customer.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Customer.find({ status: 'active' })
        .select('name email stats.totalOrders stats.totalSpent')
        .sort({ 'stats.totalSpent': -1 })
        .limit(10),
      Customer.find()
        .select('name email customerType createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    return successResponse(res, 'Customer statistics retrieved successfully', {
      totalCustomers,
      activeCustomers,
      blockedCustomers,
      customersByType,
      customersByCategory,
      topCustomers,
      recentCustomers
    });

  } catch (error) {
    console.error('Get Customer Statistics Error:', error);
    return errorResponse(res, 'Failed to retrieve customer statistics', 500);
  }
};

module.exports = exports;