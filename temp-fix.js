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