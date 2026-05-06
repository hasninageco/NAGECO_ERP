const express = require("express");
const router = express.Router();
const archiveFinanceController = require("../../controllers/archiveControllers/archiveFinanceController");

router.get("/", archiveFinanceController.getAll);
router.get("/:id", archiveFinanceController.getById);
router.post("/", archiveFinanceController.create);
router.put("/:id", archiveFinanceController.update);
router.delete("/:id", archiveFinanceController.delete);

module.exports = router;
