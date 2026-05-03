const { Router } = require("express");
const controller = require("../../controllers/insuranceController/servicesController.js");
const authenticateToken = require("../../middleware/auth.js");

const router = Router();

router.get("/all", authenticateToken, controller.find);
router.post("/Add", authenticateToken, controller.create);
router.put("/Update/:ServiceId", authenticateToken, controller.update);
router.delete("/Delete/:ServiceId", authenticateToken, controller.delete);

module.exports = router;
