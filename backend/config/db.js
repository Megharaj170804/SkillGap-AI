const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const isLocal = process.env.USE_LOCAL_DB === 'true';
    const uri = isLocal 
      ? (process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/skillgap_db')
      : process.env.MONGODB_URI;

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected (${isLocal ? 'Local Compass' : 'Atlas'}): ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
