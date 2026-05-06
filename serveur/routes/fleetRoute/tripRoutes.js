const { Router } = require("express");
const controller = require("../../controllers/fleetControllers/tripController");
const authenticateToken = require("../../middleware/auth");

const router = Router();

router.get("/", authenticateToken, controller.getAllTrips);
router.post("/", authenticateToken, controller.createTrip);
router.put("/:id", authenticateToken, controller.updateTrip);
router.delete("/:id", authenticateToken, controller.deleteTrip);
router.post("/:id/delete", authenticateToken, controller.deleteTrip);
router.get("/:id", authenticateToken, controller.getTripById);

router.post("/:id/approve", authenticateToken, controller.approveTrip);
router.post("/:id/reject", authenticateToken, controller.rejectTrip);
router.post("/:id/start", authenticateToken, controller.startTrip);
router.post("/:id/complete", authenticateToken, controller.completeTrip);
router.post("/:id/cancel", authenticateToken, controller.cancelTrip);

router.get("/:id/approvals", authenticateToken, controller.getTripApprovals);

router.get("/:id/employees", authenticateToken, controller.getTripEmployees);
router.post("/:id/employees", authenticateToken, controller.addTripEmployee);
router.delete("/:id/employees/:employeeId", authenticateToken, controller.removeTripEmployee);

router.get("/:id/visitors", authenticateToken, controller.getTripVisitors);
router.post("/:id/visitors", authenticateToken, controller.addTripVisitor);
router.delete("/:id/visitors/:visitorId", authenticateToken, controller.removeTripVisitor);

module.exports = router;
