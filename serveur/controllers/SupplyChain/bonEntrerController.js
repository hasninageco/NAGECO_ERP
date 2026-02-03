const BonEntrer = require('../../models/SupplyCahin/Bon_entrer');

// Create
exports.createBonEntrer = async (req, res) => {
  try {
    const bonEntrer = new BonEntrer(req.body);
    await bonEntrer.save();
    res.status(201).json(bonEntrer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Read all
exports.getBonEntrers = async (req, res) => {
  try {
    const bonEntrers = await BonEntrer.find();
    res.json(bonEntrers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Read one
exports.getBonEntrerById = async (req, res) => {
  try {
    const bonEntrer = await BonEntrer.findById(req.params.id);
    if (!bonEntrer) return res.status(404).json({ error: 'Not found' });
    res.json(bonEntrer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update
exports.updateBonEntrer = async (req, res) => {
  try {
    const bonEntrer = await BonEntrer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bonEntrer) return res.status(404).json({ error: 'Not found' });
    res.json(bonEntrer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deleteBonEntrer = async (req, res) => {
  try {
    const bonEntrer = await BonEntrer.findByIdAndDelete(req.params.id);
    if (!bonEntrer) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
