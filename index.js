const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const process = require("process");
const connectDB = require("./config/database");
const { PORT } = require("./config/config");
const handler404 = require("./utils/handler404");
const handler500 = require("./utils/handler500");

const userRoutes = require("./routes/UserRoutes");
const employeeRoutes = require("./routes/EmployeeRoutes");
const departmentRoutes = require("./routes/DepartmentRoutes");
const projectRoutes = require("./routes/ProjectRoutes");

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

app.use("/user", userRoutes);
app.use("/department", departmentRoutes);
app.use("/employee", employeeRoutes);
app.use("/project", projectRoutes);

app.all("*", handler404);
app.use(handler500);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
