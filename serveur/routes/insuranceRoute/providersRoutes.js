const { Router } = require("express");
const controller = require("../../controllers/insuranceController/providersController.js");
const authenticateToken = require("../../middleware/auth.js");

const router = Router();

router.get("/all", authenticateToken, controller.find);
router.post("/Add", authenticateToken, controller.create);
router.put("/Update/:ProviderId", authenticateToken, controller.update);
router.delete("/Delete/:ProviderId", authenticateToken, controller.delete);

module.exports = router;
