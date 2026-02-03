const BonSortie = require('../../models/SupplyCahin/Bon_sortie');

// Create
exports.createBonSortie = async (req, res) => {
  try {
    const bonSortie = new BonSortie(req.body);
    await bonSortie.save();
    res.status(201).json(bonSortie);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Read all
exports.getBonSorties = async (req, res) => {
  try {
    const bonSorties = await BonSortie.find();
    res.json(bonSorties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Read one
exports.getBonSortieById = async (req, res) => {
  try {
    const bonSortie = await BonSortie.findById(req.params.id);
    if (!bonSortie) return res.status(404).json({ error: 'Not found' });
    res.json(bonSortie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update
exports.updateBonSortie = async (req, res) => {
  try {
    const bonSortie = await BonSortie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bonSortie) return res.status(404).json({ error: 'Not found' });
    res.json(bonSortie);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deleteBonSortie = async (req, res) => {
  try {
    const bonSortie = await BonSortie.findByIdAndDelete(req.params.id);
    if (!bonSortie) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
