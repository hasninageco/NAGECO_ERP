const specialities = require("../../models/hr/Speciality");
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
      const data = await specialities.findAll();
      res.json(data);
    } catch (dbErr) {
      res.status(500).json({ message: "Error fetching specialities" });
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

    if (!req.body || !req.body.nom_specialite) {
      return res.status(400).json({ message: "Speciality name is required" });
    }

    try {
      await specialities.create({
        nom_specialite: req.body.nom_specialite
      });

      res.status(200).json({ message: "Speciality added successfully" });
    } catch (err) {
      console.error("Create Speciality Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while creating the speciality"
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

    const id = req.params.id_specialite;
    if (!id) return res.status(400).json({ message: "Speciality ID is required" });

    if (!req.body || !req.body.nom_specialite) {
      return res.status(400).json({ message: "Speciality name is required" });
    }

    try {
      const record = await specialities.findOne({ where: { id_specialite: id } });
      if (!record) return res.status(404).json({ message: "Speciality not found" });

      await record.update({
        nom_specialite: req.body.nom_specialite
      });

      res.status(200).json({ message: "Speciality updated successfully" });
    } catch (err) {
      console.error("Update Speciality Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while updating the speciality"
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

    const id = req.params.id_specialite;
    if (!id) return res.status(400).json({ message: "Speciality ID is required" });

    try {
      const record = await specialities.findOne({ where: { id_specialite: id } });
      if (!record) return res.status(404).json({ message: "Speciality not found" });

      await record.destroy();
      res.status(200).json({ message: "Speciality deleted successfully" });
    } catch (err) {
      console.error("Delete Speciality Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while deleting the speciality"
      });
    }
  });
};
