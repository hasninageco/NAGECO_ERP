const costCenters = require("../../models/hr/CostCenter");
const jwt = require("jsonwebtoken");

// Fetch all records
exports.find = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });

    try {
      const data = await costCenters.findAll();
      res.json(data);
    } catch (dbErr) {
      res.status(500).json({ message: "Error fetching administrations" });
    }
  });
};

// Create a new record
exports.create = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });

    if (!req.body) return res.status(400).json({ message: "Content cannot be empty!" });

    try {
      await costCenters.create({
        administration: req.body.administration,
        Branche: req.body.Branche,
        administration_ar: req.body.administration_ar
      });

      res.status(200).json({ message: "Administration added successfully" });
    } catch (err) {
      console.error("Create Administration Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while creating the administration"
      });
    }
  });
};

// Update an existing record
exports.update = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });

    const id = req.params.id_administratin;
    if (!id) return res.status(400).json({ message: "Administration ID is required" });

    if (!req.body) return res.status(400).json({ message: "Content cannot be empty!" });

    try {
      const record = await costCenters.findOne({ where: { id_administratin: id } });
      if (!record) return res.status(404).json({ message: "Administration not found" });

      await record.update({
        administration: req.body.administration,
        Branche: req.body.Branche,
        administration_ar: req.body.administration_ar
      });

      res.status(200).json({ message: "Administration updated successfully" });
    } catch (err) {
      console.error("Update Administration Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while updating the administration"
      });
    }
  });
};

// Delete a record
exports.delete = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });

    const id = req.params.id_administratin;
    if (!id) return res.status(400).json({ message: "Administration ID is required" });

    try {
      const record = await costCenters.findOne({ where: { id_administratin: id } });
      if (!record) return res.status(404).json({ message: "Administration not found" });

      await record.destroy();
      res.status(200).json({ message: "Administration deleted successfully" });
    } catch (err) {
      console.error("Delete Administration Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while deleting the administration"
      });
    }
  });
};
