const express = require('express');
const router = express.Router();
const bonEntrerController = require('../../controllers/SupplyChain/bonEntrerController');
const bonEntrerSummaryController = require('../../controllers/SupplyChain/bonEntrerSummaryController');


router.get('/summary', bonEntrerSummaryController.getSummary);
router.post('/', bonEntrerController.createBonEntrer);
router.get('/', bonEntrerController.getBonEntrers);
router.get('/:id', bonEntrerController.getBonEntrerById);
router.put('/:id', bonEntrerController.updateBonEntrer);
router.delete('/:id', bonEntrerController.deleteBonEntrer);

module.exports = router;
