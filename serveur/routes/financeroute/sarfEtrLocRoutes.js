const { Router } = require("express");
const controller = require("../../controllers/finControllers/sarfEtrLocController.js");
const authenticateToken = require("../../middleware/auth.js");

const router = Router();

router.get("/all", authenticateToken, controller.find);
router.post("/Add", authenticateToken, controller.create);
router.put("/Update/:id", authenticateToken, controller.update);
router.delete("/Delete/:id", authenticateToken, controller.delete);

module.exports = router;
