const express = require("express");
const router = express.Router();
const archiveController = require("../../controllers/archiveControllers/archiveController");

router.get("/", archiveController.getAll);
router.get("/:id", archiveController.getById);
router.post("/", archiveController.create);
router.put("/:id", archiveController.update);
router.delete("/:id", archiveController.delete);

module.exports = router;
