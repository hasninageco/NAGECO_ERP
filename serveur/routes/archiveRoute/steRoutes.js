const express = require("express");
const router = express.Router();
const steController = require("../../controllers/archiveControllers/steController");

router.get("/", steController.getAll);
router.get("/:id", steController.getById);
router.post("/", steController.create);
router.put("/:id", steController.update);
router.delete("/:id", steController.delete);

module.exports = router;
