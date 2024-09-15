const mongoose = require("mongoose");
const { Schema } = mongoose;

// Project Schema
const projectSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  status: {
    type: String,
    enum: ["Completed", "In Progress", "Incoming"],
    required: true,
  },
  startDate: Date,
  endDate: Date,
  team: [{ type: Schema.Types.ObjectId, ref: "Employee" }],
});

module.exports = mongoose.model("Project", projectSchema);
