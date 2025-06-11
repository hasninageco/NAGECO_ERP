const currencies = require("../../models/fin/Currency");
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

// Fetch all records
exports.find = (req, res) => {
  authenticate(req, res, async () => {
    try {
      const data = await currencies.findAll();
      res.json(data);
    } catch (dbErr) {
      res.status(500).json({ message: "Error fetching records" });
    }
  });
};

// Create a new record
exports.create = (req, res) => {
  authenticate(req, res, async () => {
    const { name_c, Code_TIP, is_local } = req.body;

    try {
      await currencies.create({
        name_c,
        Code_TIP,
        is_local
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
exports.update = (req, res) => {
  authenticate(req, res, async () => {
    const id = req.params.id;
    const { name_c, Code_TIP, is_local } = req.body;

    if (!id) return res.status(400).json({ message: "id is required" });

    try {
      const record = await currencies.findOne({ where: { INt_c: id } });
      if (!record) return res.status(404).json({ message: "Record not found" });

      await record.update({
        name_c,
        Code_TIP,
        is_local
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
exports.delete = (req, res) => {
  authenticate(req, res, async () => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "id is required" });

    try {
      const record = await currencies.findOne({ where: { INt_c: id } });
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
