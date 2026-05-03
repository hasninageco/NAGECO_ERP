const { Router } = require('express');
const controller = require('../../controllers/insuranceController/financeTransfersController');
const authenticateToken = require('../../middleware/auth');

const router = Router();

router.get('/approvedLines', authenticateToken, controller.approvedLines);
router.post('/markPaid', authenticateToken, controller.markPaid);

module.exports = router;
