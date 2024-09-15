const Project = require("../models/ProjectModels"); // Pastikan path model sudah benar

// Create Project
exports.createProject = async (req, res) => {
  try {
    const project = new Project(req.body); // Membuat instance baru Project
    const savedProject = await project.save(); // Simpan ke database
    res.status(201).json(savedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Read All Projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate("team"); // Mengambil semua data project
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read One Project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("team"); // Mengambil project berdasarkan ID
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read project by status
exports.getProjectsByStatus = async (req, res) => {
  try {
    const status = req.params.status;

    // Validasi input status
    const validStatuses = ["Completed", "In Progress", "Incoming"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Invalid status. Valid statuses are: Completed, In Progress, Incoming.",
      });
    }

    // Cari project berdasarkan status
    const projects = await Project.find({ status }).populate("team");

    if (projects.length === 0) {
      return res
        .status(404)
        .json({ message: "No projects found with the specified status." });
    }

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Project by ID
exports.updateProject = async (req, res) => {
  try {
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete Project by ID
exports.deleteProject = async (req, res) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(req.params.id); // Menghapus project berdasarkan ID
    if (!deletedProject)
      return res.status(404).json({ message: "Project not found" });
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
