const express = require('express');
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const process = require("process");
const userRoutes = require('./routes/UserRoutes'); // Mengimpor route User
const connectDB = require('./config/database');  // Mengimpor fungsi koneksi DB
const { PORT } = require('./config/config');

dotenv.config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("Hello from PAW Backend Service!");
});

app.use('/api', userRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});