const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config'); // Import konfigurasi umum

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
