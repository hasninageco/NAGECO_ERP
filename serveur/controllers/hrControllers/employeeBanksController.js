const EmployeeBanks = require("../../models/hr/EmployeeBanks");
const jwt = require("jsonwebtoken");

// Helper to authenticate
const authenticate = (req, res, callback) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });
    callback();
  });
};

// Fetch all banks
exports.find = (req, res) => {
  authenticate(req, res, async () => {
    try {
      const data = await EmployeeBanks.findAll();
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Error fetching banks" });
    }
  });
};

// Create a new bank
exports.create = (req, res) => {
  authenticate(req, res, async () => {
    if (!req.body) return res.status(400).json({ message: "Content cannot be empty!" });

    try {
      await EmployeeBanks.create({
        desig_banque: req.body.desig_banque,
        checkkkkkk: req.body.checkkkkkk,
        BankID: req.body.BankID
      });

      res.status(200).json({ message: "Bank added successfully" });
    } catch (err) {
      console.error("Create Bank Error:", err);
      res.status(500).json({ message: err.message || "Error creating bank" });
    }
  });
};

// Update an existing bank
exports.update = (req, res) => {
  authenticate(req, res, async () => {
    const id = req.params.id_Banque;
    if (!id) return res.status(400).json({ message: "Bank ID is required" });
    if (!req.body) return res.status(400).json({ message: "Content cannot be empty!" });

    try {
      const record = await EmployeeBanks.findOne({ where: { id_Banque: id } });
      if (!record) return res.status(404).json({ message: "Bank not found" });

      await record.update({
        desig_banque: req.body.desig_banque,
        checkkkkkk: req.body.checkkkkkk,
        BankID: req.body.BankID
      });

      res.status(200).json({ message: "Bank updated successfully" });
    } catch (err) {
      console.error("Update Bank Error:", err);
      res.status(500).json({ message: err.message || "Error updating bank" });
    }
  });
};

// Delete a bank
exports.delete = (req, res) => {
  authenticate(req, res, async () => {
    const id = req.params.id_Banque;
    if (!id) return res.status(400).json({ message: "Bank ID is required" });

    try {
      const record = await EmployeeBanks.findOne({ where: { id_Banque: id } });
      if (!record) return res.status(404).json({ message: "Bank not found" });

      await record.destroy();
      res.status(200).json({ message: "Bank deleted successfully" });
    } catch (err) {
      console.error("Delete Bank Error:", err);
      res.status(500).json({ message: err.message || "Error deleting bank" });
    }
  });
};
