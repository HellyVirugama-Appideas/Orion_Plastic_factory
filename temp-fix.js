// // temp-fix.js (ek baar run karo)
// const mongoose = require('mongoose');
// require('./models/Driver');

// mongoose.connect('mongodb+srv://hellytheappideas_db_user:heE9LLxOIlp9u05h@cluster0.t3eqcoo.mongodb.net/?appName=Cluster0');

// mongoose.connection.on('connected', async () => {
//   console.log('Dropping old email index...');
//   try {
//     await mongoose.connection.db.collection('drivers').dropIndex('email_1');
//     console.log('Old index dropped!');
//     process.exit(0);
//   } catch (err) {
//     console.log('Index already dropped or error:', err.message);
//     process.exit(0);
//   }
// });


// temp-fix-sessions.js
// const mongoose = require('mongoose');

// require('./models/Session');

// mongoose.connect('mongodb+srv://hellytheappideas_db_user:heE9LLxOIlp9u05h@cluster0.t3eqcoo.mongodb.net/?appName=Cluster0', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });

// mongoose.connection.on('connected', async () => {
//   console.log('Connected to MongoDB...');
//   console.log('Dropping old token_1 index from sessions collection...');

//   try {
//     await mongoose.connection.db.collection('sessions').dropIndex('token_1');
//     console.log('✅ Old token_1 index successfully dropped!');
//     console.log('Ab aapka server restart karo — naya sparse index ban jayega.');
//     process.exit(0);
//   } catch (err) {
//     if (err.message.includes('index not found')) {
//       console.log('ℹ️  Index already dropped or does not exist.');
//     } else {
//       console.log('❌ Error dropping index:', err.message);
//     }
//     process.exit(0);
//   }
// });

// mongoose.connection.on('error', (err) => {
//   console.error('MongoDB connection error:', err);
//   process.exit(1);
// });


// temp-drop-index.js
// const mongoose = require('mongoose');
// require('dotenv').config();

// const connectDB = require('./config/db'); // tumhara db connect file ka path

// connectDB();

// const Session = require('./models/Session');

// mongoose.connection.on('connected', async () => {
//   console.log('Connected to MongoDB...');
//   console.log('Dropping old problematic indexes from sessions collection...');

//   try {
//     // Purane indexes drop kar do
//     await mongoose.connection.db.collection('sessions').dropIndex('driverId_1');
//     console.log('✅ driverId_1 index dropped!');

//     // Agar adminId_1 bhi ho to
//     try {
//       await mongoose.connection.db.collection('sessions').dropIndex('adminId_1');
//       console.log('✅ adminId_1 index dropped!');
//     } catch (e) {
//       console.log('ℹ️ adminId_1 index nahi tha');
//     }

//     try {
//       await mongoose.connection.db.collection('sessions').dropIndex('driverId_1_type_1');
//       console.log('✅ driverId_1_type_1 index dropped!');
//     } catch (e) {
//       console.log('ℹ️ driverId_1_type_1 index nahi tha');
//     }

//     try {
//       await mongoose.connection.db.collection('sessions').dropIndex('adminId_1_type_1');
//       console.log('✅ adminId_1_type_1 index dropped!');
//     } catch (e) {
//       console.log('ℹ️ adminId_1_type_1 index nahi tha');
//     }

//     console.log('🎉 Sab purane indexes drop ho gaye!');
//     console.log('Ab server restart karo – naye indexes ban jayenge.');
//     process.exit(0);

//   } catch (err) {
//     console.log('❌ Error:', err.message);
//     if (err.message.includes('index not found')) {
//       console.log('ℹ️ Index already nahi hai – safe hai');
//     }
//     process.exit(0);
//   }
// });



// fix-registration-index.js
// Run this file ONCE to drop the old unique index causing duplicate key error on null

// const mongoose = require('mongoose');

// // ── CHANGE THIS ── Your real MongoDB connection string
// const MONGO_URI = 'mongodb+srv://hellytheappideas_db_user:heE9LLxOIlp9u05h@cluster0.t3eqcoo.mongodb.net/?appName=Cluster0';  // ← example
// // For MongoDB Atlas: 'mongodb+srv://username:password@cluster0.xxx.mongodb.net/test?retryWrites=true&w=majority'

// mongoose.connect(MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => {
//     console.error('Connection failed:', err);
//     process.exit(1);
//   });

// mongoose.connection.on('connected', async () => {
//   console.log('\nConnected successfully. Attempting to drop old index...\n');

//   try {
//     // Show current indexes (for debugging)
//     const indexes = await mongoose.connection.db.collection('drivers').indexes();
//     console.log('Current indexes in drivers collection:');
//     console.log(indexes.map(i => i.name));

//     // Drop the problematic index
//     try {
//       await mongoose.connection.db.collection('drivers').dropIndex('registrationNumber_1');
//       console.log('\nSUCCESS: Index "registrationNumber_1" has been dropped!');
//     } catch (dropErr) {
//       if (dropErr.codeName === 'IndexNotFound') {
//         console.log('\nIndex "registrationNumber_1" does not exist (already dropped)');
//       } else {
//         throw dropErr;
//       }
//     }

//     console.log('\nYou can now safely create new drivers.');
//     console.log('Restart your main application and try OTP verification again.\n');
//   } catch (err) {
//     console.error('Error during operation:', err.message);
//   } finally {
//     // Always close connection
//     await mongoose.connection.close();
//     console.log('Connection closed.');
//     process.exit(0);
//   }
// });

// const mongoose = require('mongoose');
// mongoose.connect('mongodb+srv://hellytheappideas_db_user:heE9LLxOIlp9u05h@cluster0.t3eqcoo.mongodb.net/?appName=Cluster0');

// mongoose.connection.on('connected', async () => {
//   try {
//     await mongoose.connection.db.collection('admins').dropIndex('userId_1');
//     console.log('Index userId_1 dropped successfully!');
//   } catch (err) {
//     if (err.codeName === 'IndexNotFound') {
//       console.log('Index already dropped');
//     } else {
//       console.error('Error:', err);
//     }
//   } finally {
//     mongoose.disconnect();
//   }
// });

// fix-customer-permission-key.js
// One-time script to update permission key "Customers" → "customers" for specific sub-admin

const mongoose = require('mongoose');

// CHANGE THIS if you use MongoDB Atlas / cloud
const MONGO_URI = 'mongodb+srv://hellytheappideas_db_user:heE9LLxOIlp9u05h@cluster0.t3eqcoo.mongodb.net/?appName=Cluster0'; // ← your DB connection string

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Connection failed:', err);
    process.exit(1);
  });

mongoose.connection.on('connected', async () => {
  console.log('\nConnected! Starting permission key fix for Helly...\n');

  try {
    const db = mongoose.connection.db;
    const adminsCollection = db.collection('admins');

    const email = "helly@gmail.com";

    // Find the admin first (for logging)
    const admin = await adminsCollection.findOne({ email });
    if (!admin) {
      console.log(`Admin with email ${email} not found!`);
      return;
    }

    console.log(`Found admin: ${admin.name} (${admin.email})`);

    // Update any key that contains "customer" (case-insensitive) to "customers"
    const result = await adminsCollection.updateOne(
      { email },
      { $set: { "permission.$[elem].key": "customers" } },
      {
        arrayFilters: [{ "elem.key": { $regex: /customer/i } }]
      }
    );

    console.log('Update Result:');
    console.log(`  Matched: ${result.matchedCount}`);
    console.log(`  Modified: ${result.modifiedCount}`);

    if (result.modifiedCount > 0) {
      console.log('\nSUCCESS! Key updated to "customers"');
    } else {
      console.log('\nNo changes needed - key already correct or not found');
    }

    // Optional: Verify after update
    const updatedAdmin = await adminsCollection.findOne({ email });
    console.log('\nUpdated permissions:');
    console.log(updatedAdmin.permission.map(p => p.key));

  } catch (err) {
    console.error('Fix Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
    process.exit(0);
  }
});