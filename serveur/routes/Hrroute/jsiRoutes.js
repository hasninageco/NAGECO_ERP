const { Router } = require("express");
const controller = require("../../controllers/hrControllers/jsiController");
const authenticateToken = require("../../middleware/auth");

const router = Router();

router.get("/getsum_q", authenticateToken, controller.getsum_Q);
router.get("/getsum_pt", authenticateToken, controller.getsum_PT);
router.get("/getsum_b", authenticateToken, controller.getsum_B);

router.get("/timesheets", authenticateToken, controller.listTimesheets);
router.post("/timesheets/bulk-update", authenticateToken, controller.bulkUpdateTimesheets);

module.exports = router;
