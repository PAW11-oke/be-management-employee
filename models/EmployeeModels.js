const mongoose = require("mongoose");

// Employee Schema
const employeeSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: {
    type: Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },
  hireDate: Date,
  salary: { type: Number, required: true },
  currentProjects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
});

module.exports = mongoose.model("Employee", employeeSchema);
