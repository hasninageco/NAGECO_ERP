const { Router } = require("express");
const controller = require("../../controllers/basicControllers/userController");
 

const router = Router();

// 🔓 Public routes
router.get("/api/login", (_req, res) => {
	return res.status(405).json({
		message: "Use POST /api/login with JSON body: { email, password }",
	});
});

router.post("/api/login", controller.login);
 
module.exports = router;
