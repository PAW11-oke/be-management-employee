const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/AttendanceControllers");

// Create attendance
router.post("/", attendanceController.createAttendance);

// Read all attendances
router.get("/", attendanceController.getAllAttendances);

// Read single attendance by ID
router.get("/:id", attendanceController.getAttendanceById);

// Update attendance by ID
router.patch("/:id", attendanceController.updateAttendance);

// Delete attendance by ID
router.delete("/:id", attendanceController.deleteAttendance);

module.exports = router;
