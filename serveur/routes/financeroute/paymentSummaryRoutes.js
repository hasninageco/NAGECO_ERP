const { Router } = require('express');
const controller = require('../../controllers/finControllers/paymentSummaryController.js');
const authenticateToken = require('../../middleware/auth.js');

const router = Router();

router.get('/summary', authenticateToken, controller.summary);
router.get('/peek', authenticateToken, controller.peek);

module.exports = router;
