const { Router } = require("express");
const controller = require("../../controllers/basicControllers/userController");
 

const router = Router();

// 🔓 Public routes
router.post("/api/login", controller.login);
 
module.exports = router;
