const PerformanceReview = require("../models/PerformanceReviewModels");

// Create Performance Review
exports.createPerformanceReview = async (req, res) => {
  const {
    employee,
    year,
    quarter,
    projectsCompleted,
    projectContributions,
    review,
    rating,
  } = req.body;

  try {
    const newPerformanceReview = new PerformanceReview({
      employee,
      year,
      quarter,
      projectsCompleted,
      projectContributions,
      review,
      rating,
    });

    const savedReview = await newPerformanceReview.save();
    res.status(201).json(savedReview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get All Performance Reviews
exports.getAllPerformanceReviews = async (req, res) => {
  try {
    const reviews = await PerformanceReview.find().populate(
      "employee projectContributions.project"
    );
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Performance Review by ID
exports.getPerformanceReviewById = async (req, res) => {
  const { id } = req.params;

  try {
    const review = await PerformanceReview.findById(id).populate(
      "employee projectContributions.project"
    );
    if (!review) {
      return res.status(404).json({ message: "Performance Review not found" });
    }
    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Performance Review
exports.updatePerformanceReview = async (req, res) => {
  const { id } = req.params;
  const {
    employee,
    year,
    quarter,
    projectsCompleted,
    projectContributions,
    review,
    rating,
  } = req.body;

  try {
    const updatedReview = await PerformanceReview.findByIdAndUpdate(
      id,
      {
        employee,
        year,
        quarter,
        projectsCompleted,
        projectContributions,
        review,
        rating,
      },
      { new: true }
    );
    if (!updatedReview) {
      return res.status(404).json({ message: "Performance Review not found" });
    }
    res.status(200).json(updatedReview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete Performance Review
exports.deletePerformanceReview = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedReview = await PerformanceReview.findByIdAndDelete(id);
    if (!deletedReview) {
      return res.status(404).json({ message: "Performance Review not found" });
    }
    res.status(200).json({ message: "Performance Review deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
