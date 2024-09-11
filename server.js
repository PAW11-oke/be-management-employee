const express = require('express');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const config = require('./config/config');

const app = express();
const port = config.PORT;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use('/api', userRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});