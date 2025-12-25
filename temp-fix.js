// temp-fix.js (ek baar run karo)
const mongoose = require('mongoose');
require('./models/Driver');

mongoose.connect('mongodb+srv://hellytheappideas_db_user:heE9LLxOIlp9u05h@cluster0.t3eqcoo.mongodb.net/?appName=Cluster0');

mongoose.connection.on('connected', async () => {
  console.log('Dropping old email index...');
  try {
    await mongoose.connection.db.collection('drivers').dropIndex('email_1');
    console.log('Old index dropped!');
    process.exit(0);
  } catch (err) {
    console.log('Index already dropped or error:', err.message);
    process.exit(0);
  }
});


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