const Section = require("../../models/SupplyCahin/Section");
const jwt = require("jsonwebtoken");

// Utility: authenticate and decode token
const authenticate = (req, res, callback) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });
    callback(decoded);
  });
};

// Fetch all sections
exports.find = (req, res) => {
  authenticate(req, res, async () => {
    try {
      const data = await Section.findAll();
      res.json(data);
    } catch (dbErr) {
      console.error("DB ERROR:", dbErr);
      res.status(500).json({ message: "Error fetching records" });
    }
  });
};

// Create a new section
exports.create = (req, res) => {
  authenticate(req, res, async () => {
    const { DESIG, CODE_SECTION, Account, Debit_Account } = req.body;

    if (!DESIG || !CODE_SECTION || !Account || !Debit_Account) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      await Section.create({
        DESIG,
        CODE_SECTION,
        Account,
        Debit_Account
      });

      res.status(200).json({ message: "Section added successfully" });
    } catch (err) {
      console.error("Create Section Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while creating the section"
      });
    }
  });
};

// Update an existing section
exports.update = (req, res) => {
  authenticate(req, res, async () => {
    const id = req.params.ID_SECTION;
    const { DESIG, CODE_SECTION, Account, Debit_Account } = req.body;

    if (!id) return res.status(400).json({ message: "id is required" });

    try {
      const record = await Section.findOne({ where: { ID_SECTION: id } });
      if (!record) return res.status(404).json({ message: "Section not found" });

      await record.update({
        DESIG,
        CODE_SECTION,
        Account,
        Debit_Account
      });

      res.status(200).json({ message: "Section updated successfully" });
    } catch (err) {
      console.error("Update Section Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while updating the section"
      });
    }
  });
};

// Delete a section
exports.delete = (req, res) => {
  authenticate(req, res, async () => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "id is required" });

    try {
      const record = await Section.findOne({ where: { ID_SECTION: id } });
      if (!record) return res.status(404).json({ message: "Section not found" });

      await record.destroy();
      res.status(200).json({ message: "Section deleted successfully" });
    } catch (err) {
      console.error("Delete Section Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while deleting the section"
      });
    }
  });
};