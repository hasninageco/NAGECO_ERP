const { Router } = require("express");
const controller = require("../../controllers/SupplyChain/requisitionController");
const authenticateToken = require("../../middleware/auth");

const router = Router();

// Dashboard summary: GET /requisitions/summary?period=day|week|month|year|all
router.get("/summary", authenticateToken, controller.summary);

// CRUD
router.get("/all", authenticateToken, controller.find);
router.get("/:id", authenticateToken, controller.findById);
router.post("/add", authenticateToken, controller.create);
router.put("/update/:id", authenticateToken, controller.update);
router.delete("/delete/:id", authenticateToken, controller.remove);

module.exports = router;
