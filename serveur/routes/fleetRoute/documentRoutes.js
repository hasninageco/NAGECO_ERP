const { Router } = require("express");
const controller = require("../../controllers/fleetControllers/documentController");
const authenticateToken = require("../../middleware/auth");

const router = Router();

router.get("/", authenticateToken, controller.getDocuments);
router.get("/:id", authenticateToken, controller.getDocumentById);
router.post("/", authenticateToken, controller.createDocument);
router.put("/:id", authenticateToken, controller.updateDocument);
router.delete("/:id", authenticateToken, controller.deleteDocument);

module.exports = router;
