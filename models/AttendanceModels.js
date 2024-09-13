const mongoose = require("mongoose");

// Attendance Schema
const attendanceSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ["Present", "Absent", "Late", "Leave"],
    required: true,
  },
});

module.exports = mongoose.model("Attendance", attendanceSchema);
