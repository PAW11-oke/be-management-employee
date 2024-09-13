const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/EmployeeControllers");

// Create a new employee
router.post("/", employeeController.createEmployee);

// Get all employees
router.get("/", employeeController.getAllEmployees);

// Get a single employee by ID
router.get("/:id", employeeController.getEmployeeById);

// Update an employee
router.put("/:id", employeeController.updateEmployee);

// Delete an employee
router.delete("/:id", employeeController.deleteEmployee);

// Get employees by department
router.get(
  "/department/:departmentId",
  employeeController.getEmployeesByDepartment
);

module.exports = router;
