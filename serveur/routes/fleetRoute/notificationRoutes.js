const { Router } = require("express");
const controller = require("../../controllers/fleetControllers/notificationController");
const authenticateToken = require("../../middleware/auth");

const router = Router();

router.get("/", authenticateToken, controller.getNotifications);
router.get("/unread", authenticateToken, controller.getUnreadNotifications);
router.post("/generate", authenticateToken, controller.generateNotifications);
router.patch("/:id/read", authenticateToken, controller.markNotificationRead);
router.patch("/:id/dismiss", authenticateToken, controller.dismissNotification);

router.get("/rules", authenticateToken, controller.getNotificationRules);
router.post("/rules", authenticateToken, controller.createNotificationRule);
router.put("/rules/:id", authenticateToken, controller.updateNotificationRule);
router.delete("/rules/:id", authenticateToken, controller.deleteNotificationRule);

module.exports = router;
