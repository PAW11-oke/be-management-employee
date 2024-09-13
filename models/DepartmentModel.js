const mongoose = require("mongoose");

// Department Schema
const departmentSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: String,
});

module.exports = mongoose.model("Department", departmentSchema);
