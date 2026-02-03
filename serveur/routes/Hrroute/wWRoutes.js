const { Router } = require("express");
const controller = require("../../controllers/hrControllers/wwController.js");
const authenticateToken = require("../../middleware/auth.js");

const router = Router();

// 🔐 Protected routes
router.get("/all", authenticateToken, controller.find);  // Protecting the "find" route
router.get("/check", authenticateToken, controller.checkCodeExists);
router.post("/Add", authenticateToken, controller.create);  // Protecting the "create" route
router.put("/Update/:int_can", authenticateToken, controller.update);  // Changing to PUT and protecting the "update" route
router.delete("/Delete/:int_can", authenticateToken, controller.delete);  // Changing to PUT and protecting the "delete" route
module.exports = router;
