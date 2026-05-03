const { Router } = require("express");
const controller = require("../../controllers/insuranceController/claimsController.js");
const authenticateToken = require("../../middleware/auth.js");

const router = Router();

router.get("/all", authenticateToken, controller.find);
router.get("/pending", authenticateToken, controller.pending);
router.post("/Add", authenticateToken, controller.create);
router.post("/review/:ClaimId", authenticateToken, controller.review);
router.put("/Update/:ClaimId", authenticateToken, controller.update);
router.delete("/Delete/:ClaimId", authenticateToken, controller.delete);

module.exports = router;
