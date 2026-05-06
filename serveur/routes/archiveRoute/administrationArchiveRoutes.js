const express = require("express");
const router = express.Router();
const administrationArchiveController = require("../../controllers/archiveControllers/administrationArchiveController");

router.get("/", administrationArchiveController.getAll);
router.get("/:id", administrationArchiveController.getById);
router.post("/", administrationArchiveController.create);
router.put("/:id", administrationArchiveController.update);
router.delete("/:id", administrationArchiveController.delete);

module.exports = router;
