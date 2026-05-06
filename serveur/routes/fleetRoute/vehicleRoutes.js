const { Router } = require("express");
const controller = require("../../controllers/fleetControllers/vehicleController");
const authenticateToken = require("../../middleware/auth");

const router = Router();

router.get("/", authenticateToken, controller.getAllVehicles);
router.get("/summary/:id", authenticateToken, controller.getVehicleSummary);
router.get("/:id", authenticateToken, controller.getVehicleById);
router.post("/", authenticateToken, controller.createVehicle);
router.put("/:id", authenticateToken, controller.updateVehicle);
router.delete("/:id", authenticateToken, controller.deleteVehicle);

module.exports = router;
