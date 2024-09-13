const express = require('express');
const router = express.Router();
const projectController = require('../controllers/ProjectController');

// CRUD Routes
router.post('/', projectController.createProject); // Create
router.get('/', projectController.getAllProjects); // Read All
router.get('/:id', projectController.getProjectById); // Read One by ID
router.get('/status/:status', projectController.getProjectsByStatus); // Get by Status
router.put('/:id', projectController.updateProject); // Update
router.delete('/:id', projectController.deleteProject); // Delete

module.exports = router;
