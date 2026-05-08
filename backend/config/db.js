const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const useLocal = String(process.env.USE_LOCAL_DB || '').trim().toLowerCase() === 'true';
    const atlasUri = process.env.MONGODB_URI;
    const localUri = process.env.MONGODB_URI_LOCAL;

    let uri = '';
    let source = '';

    if (useLocal && localUri) {
      uri = localUri;
      source = 'MONGODB_URI_LOCAL';
    } else if (atlasUri) {
      uri = atlasUri;
      source = 'MONGODB_URI';
    } else if (localUri) {
      uri = localUri;
      source = 'MONGODB_URI_LOCAL (fallback)';
    }

    if (!uri) {
      throw new Error('No MongoDB URI configured. Set MONGODB_URI (Atlas) or MONGODB_URI_LOCAL.');
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected [${source}]: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Check USE_LOCAL_DB, MONGODB_URI, and MONGODB_URI_LOCAL in backend/.env');
    process.exit(1);
  }
};

module.exports = connectDB;
