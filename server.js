const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/db");
const config = require("./config/config");
const process = require("process");
const userRoutes = require("./routes/userRoutes");

const app = express();
const port = config.PORT; // kayaknya pake dotenv deh bal klo direpo mas aufa @iqbal

// MIDDLEWARE
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan("dev"));

// CORS
app.use(cors());

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use("/api", userRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
