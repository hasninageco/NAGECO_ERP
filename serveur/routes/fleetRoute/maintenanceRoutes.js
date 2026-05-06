const { Router } = require("express");
const controller = require("../../controllers/fleetControllers/maintenanceController");
const authenticateToken = require("../../middleware/auth");

const router = Router();

router.get("/", authenticateToken, controller.getAllMaintenance);
router.get("/overdue", authenticateToken, controller.getOverdueMaintenance);
router.get("/due", authenticateToken, controller.getDueMaintenance);
router.get("/:id", authenticateToken, controller.getMaintenanceById);
router.post("/", authenticateToken, controller.createMaintenance);
router.put("/:id", authenticateToken, controller.updateMaintenance);
router.post("/:id/start", authenticateToken, controller.startMaintenance);
router.post("/:id/complete", authenticateToken, controller.completeMaintenance);
router.post("/:id/cancel", authenticateToken, controller.cancelMaintenance);

module.exports = router;
