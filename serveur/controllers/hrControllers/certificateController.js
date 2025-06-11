const certificates = require("../../models/hr/Certificate");
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
      const data = await certificates.findAll();
      res.json(data);
    } catch (dbErr) {
      res.status(500).json({ message: "Error fetching records" });
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

    if (!req.body || !req.body.desig_m3) {
      return res.status(400).json({ message: "desig_m3 is required" });
    }

    try {
      await certificates.create({
        desig_m3: req.body.desig_m3
      });

      res.status(200).json({ message: "Record added successfully" });
    } catch (err) {
      console.error("Create Record Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while creating the record"
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

    const id = req.params.id_m3;
    if (!id) return res.status(400).json({ message: "id_m3 is required" });

    if (!req.body || !req.body.desig_m3) {
      return res.status(400).json({ message: "desig_m3 is required" });
    }

    try {
      const record = await certificates.findOne({ where: { id_m3: id } });
      if (!record) return res.status(404).json({ message: "Record not found" });

      await record.update({
        desig_m3: req.body.desig_m3
      });

      res.status(200).json({ message: "Record updated successfully" });
    } catch (err) {
      console.error("Update Record Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while updating the record"
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

    const id = req.params.id_m3;
    if (!id) return res.status(400).json({ message: "id_m3 is required" });

    try {
      const record = await certificates.findOne({ where: { id_m3: id } });
      if (!record) return res.status(404).json({ message: "Record not found" });

      await record.destroy();
      res.status(200).json({ message: "Record deleted successfully" });
    } catch (err) {
      console.error("Delete Record Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while deleting the record"
      });
    }
  });
};
