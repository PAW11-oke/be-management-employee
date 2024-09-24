const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const process = require("process");
const passport = require("passport");
const session = require('express-session');

const connectDB = require("./config/database");
const { PORT } = require("./config/config");
const handler404 = require("./utils/handler404");
const handler500 = require("./utils/handler500");

const userRoutes = require("./routes/UserRoutes");
const employeeRoutes = require("./routes/EmployeeRoutes");
const departmentRoutes = require("./routes/DepartmentRoutes");
const projectRoutes = require("./routes/ProjectRoutes");
const performanceReviewRoutes = require("./routes/PerformanceReviewRoutes");
const attendanceRoutes = require("./routes/AttendanceRoutes");
require("./config/googleOAuth");

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(session({
  secret: 'cat', 
  resave: false, 
  saveUninitialized: false, 
  cookie: { secure: false }  // Set to `true` jika menggunakan HTTPS
}));app.use(passport.initialize());
app.use(passport.session());

connectDB();

app.get('/', (req, res) => {
  res.send('<a href="/user/auth/google">Authenticate with Google</a>');
});

app.use("/user", userRoutes);
app.use("/department", departmentRoutes);
app.use("/employee", employeeRoutes);
app.use("/project", projectRoutes);
app.use("/performancereview", performanceReviewRoutes);
app.use("/attendance", attendanceRoutes);

app.all("*", handler404);
app.use(handler500);

app.use((err, req, res, next) => {
  console.error(err.stack); 
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
    error: err.message, 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});