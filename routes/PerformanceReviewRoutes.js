const express = require("express");
const router = express.Router();
const performanceReviewController = require("../controllers/PerformanceReviewControllers");

// Create a performance review
router.post("/", performanceReviewController.createPerformanceReview);

// Get all performance reviews
router.get("/", performanceReviewController.getAllPerformanceReviews);

// Get a performance review by ID
router.get("/:id", performanceReviewController.getPerformanceReviewById);

// Update a performance review by ID
router.patch("/:id", performanceReviewController.updatePerformanceReview);

// Delete a performance review by ID
router.delete("/:id", performanceReviewController.deletePerformanceReview);

module.exports = router;
