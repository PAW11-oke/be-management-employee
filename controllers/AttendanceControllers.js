const Attendance = require("../models/AttendanceModels");

// Create Attendance
exports.createAttendance = async (req, res) => {
  const { employee, date, status } = req.body;

  try {
    const newAttendance = new Attendance({ employee, date, status });
    const savedAttendance = await newAttendance.save();
    res.status(201).json(savedAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Read All Attendances
exports.getAllAttendances = async (req, res) => {
  try {
    const attendances = await Attendance.find().populate("employee");
    res.status(200).json(attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read Single Attendance
exports.getAttendanceById = async (req, res) => {
  const { id } = req.params;

  try {
    const attendance = await Attendance.findById(id).populate("employee");
    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Attendance
exports.updateAttendance = async (req, res) => {
  const { id } = req.params;
  const { employee, date, status } = req.body;

  try {
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      id,
      { employee, date, status },
      { new: true }
    );
    if (!updatedAttendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }
    res.status(200).json(updatedAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete Attendance
exports.deleteAttendance = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedAttendance = await Attendance.findByIdAndDelete(id);
    if (!deletedAttendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }
    res.status(200).json({ message: "Attendance deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
