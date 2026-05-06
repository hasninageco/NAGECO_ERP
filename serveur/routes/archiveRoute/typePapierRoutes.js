const express = require("express");
const router = express.Router();
const typePapierController = require("../../controllers/archiveControllers/typePapierController");

router.get("/", typePapierController.getAll);
router.get("/:id", typePapierController.getById);
router.post("/", typePapierController.create);
router.put("/:id", typePapierController.update);
router.delete("/:id", typePapierController.delete);

module.exports = router;
