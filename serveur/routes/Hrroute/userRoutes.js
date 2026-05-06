const { Router } = require("express");
const controller = require("../../controllers/basicControllers/userController");
const authenticateToken = require("../../middleware/auth");
 

const router = Router();

// 🔓 Public routes
router.get("/api/login", (_req, res) => {
	return res.status(405).json({
		message: "Use POST /api/login with JSON body: { email, password }",
	});
});

// Backward-compatible alias used by newer frontend auth screens
router.get("/api/auth/login", (_req, res) => {
	return res.status(405).json({
		message: "Use POST /api/auth/login with JSON body: { email, password }",
	});
});

router.post("/api/login", controller.login);
router.post("/api/auth/login", controller.login);

// 🔐 Protected users management routes
router.get("/api/users", authenticateToken, controller.listUsers);
router.put("/api/users/:userId", authenticateToken, controller.updateUser);
 
module.exports = router;
