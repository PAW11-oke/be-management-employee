const mongoose = require("mongoose");
const { Schema } = mongoose;

// Performance Review Schema
const performanceReviewSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  year: { type: Number, required: true },
  quarter: { type: Number, enum: [1, 2, 3, 4], required: true },
  projectsCompleted: Number,
  projectContributions: [
    {
      project: { type: Schema.Types.ObjectId, ref: "Project" },
      contribution: String,
    },
  ],
  review: String,
  rating: { type: Number, min: 1, max: 5 },
});

// Adding a compound index to ensure uniqueness of employee, year, and quarter combination
performanceReviewSchema.index(
  { employee: 1, year: 1, quarter: 1 },
  { unique: true }
);

module.exports = mongoose.model("PerformanceReview", performanceReviewSchema);
