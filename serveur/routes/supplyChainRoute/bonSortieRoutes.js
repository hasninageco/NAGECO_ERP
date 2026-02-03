const express = require('express');
const router = express.Router();
const bonSortieController = require('../../controllers/SupplyChain/bonSortieController');

router.post('/', bonSortieController.createBonSortie);
router.get('/', bonSortieController.getBonSorties);
router.get('/:id', bonSortieController.getBonSortieById);
router.put('/:id', bonSortieController.updateBonSortie);
router.delete('/:id', bonSortieController.deleteBonSortie);

module.exports = router;
