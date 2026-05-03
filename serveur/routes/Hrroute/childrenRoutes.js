const { Router } = require("express");
const controller = require("../../controllers/hrControllers/childController.js");
const authenticateToken = require("../../middleware/auth.js");

const router = Router();

router.get("/all", authenticateToken, controller.find);
router.get("/employee/:EMP_CHILD", authenticateToken, controller.findByEmployee);
router.post("/Add", authenticateToken, controller.create);
router.put("/Update/:ID_CHILD", authenticateToken, controller.update);
router.delete("/Delete/:ID_CHILD", authenticateToken, controller.delete);

module.exports = router;
