const mongoose = require("mongoose");
const { Schema } = mongoose;

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
