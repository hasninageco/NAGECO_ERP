const { Router } = require("express");
const controller = require("../../controllers/hrControllers/EmployeesController.js");
const authenticateToken = require("../../middleware/auth.js");

const router = Router();

// 🔐 Protected routes
router.get("/all", authenticateToken, controller.find);  // Protecting the "find" route
router.get("/ref/:Ref_emp", authenticateToken, controller.findByRef); // Find one employee by Ref_emp
router.post("/Add", authenticateToken, controller.create);  // Protecting the "create" route
router.put("/Update/:ID_EMP", authenticateToken, controller.update);  // Changing to PUT and protecting the "update" route
router.delete("/Delete/:ID_EMP", authenticateToken, controller.delete);  // Changing to PUT and protecting the "delete" route
module.exports = router;
