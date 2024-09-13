const express = require('express');
const connectDB = require('./config/database'); 
const userRoutes = require('./routes/UserRoutes'); 
const { PORT } = require('./config/config');

const app = express();
app.use(express.json());

connectDB();

app.use('/api', userRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
