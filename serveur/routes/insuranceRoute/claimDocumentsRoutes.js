const { Router } = require("express");
const controller = require("../../controllers/insuranceController/claimDocumentsController.js");
const authenticateToken = require("../../middleware/auth.js");
const multer = require("multer");

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.get("/all", authenticateToken, controller.find);
router.get("/content", authenticateToken, controller.getContent);
router.post("/Add", authenticateToken, controller.create);
router.post("/Upload", authenticateToken, upload.single("file"), controller.uploadFile);
router.put("/Update/:DocId", authenticateToken, controller.update);
router.delete("/Delete", authenticateToken, controller.delete);

module.exports = router;
