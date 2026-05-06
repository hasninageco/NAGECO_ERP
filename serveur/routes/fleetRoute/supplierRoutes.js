const { Router } = require("express");
const controller = require("../../controllers/fleetControllers/supplierController");
const authenticateToken = require("../../middleware/auth");

const router = Router();

router.get("/", authenticateToken, controller.getAllSuppliers);
router.get("/:id", authenticateToken, controller.getSupplierById);
router.post("/", authenticateToken, controller.createSupplier);
router.put("/:id", authenticateToken, controller.updateSupplier);
router.delete("/:id", authenticateToken, controller.deleteSupplier);

module.exports = router;
