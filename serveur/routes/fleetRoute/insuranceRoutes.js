const { Router } = require("express");
const controller = require("../../controllers/fleetControllers/insuranceController");
const authenticateToken = require("../../middleware/auth");

const router = Router();

router.get("/", authenticateToken, controller.getAllInsurance);
router.get("/expiring", authenticateToken, controller.getExpiringSoonInsurance);
router.get("/expired", authenticateToken, controller.getExpiredInsurance);
router.get("/vehicle/:idVehicle", authenticateToken, controller.getInsuranceByVehicle);
router.get("/vehicle/:idVehicle/active", authenticateToken, controller.getActiveInsuranceByVehicle);
router.get("/:id", authenticateToken, controller.getInsuranceById);
router.post("/", authenticateToken, controller.createInsurance);
router.put("/:id", authenticateToken, controller.updateInsurance);
router.post("/:id/renew", authenticateToken, controller.renewInsurance);
router.post("/:id/cancel", authenticateToken, controller.cancelInsurance);

module.exports = router;
