const { Router } = require('express');
const controller = require('../../controllers/hrControllers/holidaysController');
const authenticateToken = require('../../middleware/auth');

const router = Router();

// 🔐 Protected routes
router.get('/all', authenticateToken, controller.find);
router.get('/check-period', authenticateToken, controller.checkPeriod);
router.post('/Add', authenticateToken, controller.create);
router.put('/Update/:ID_HOLIDAYS', authenticateToken, controller.update);
router.delete('/Delete/:ID_HOLIDAYS', authenticateToken, controller.delete);

module.exports = router;
