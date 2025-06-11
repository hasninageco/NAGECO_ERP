const Coa = require("../../models/fin/Coa");
const jwt = require("jsonwebtoken");

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

exports.find = (req, res) => {
  authenticate(req, res, async () => {
    try {
      const data = await Coa.findAll({
        order: [['Acc_No', 'ASC']], // Sort by Acc_No alphabetically (A-Z)
      });
      res.json(data);
    } catch (dbErr) {
      console.error("DB ERROR:", dbErr);      res.status(500).json({ message: "Error fetching records" });
    }
  });
};

// Utility to sanitize date fields
function sanitizeDateField(body, fieldName) {
  if (
    !body[fieldName] ||
    typeof body[fieldName] !== "string" ||
    !body[fieldName].trim() ||
    isNaN(Date.parse(body[fieldName]))
  ) {
    body[fieldName] = null;
  }
}

function sanitizeAllDateFields(body) {
  sanitizeDateField(body, "Date_m");
  sanitizeDateField(body, "d1");
  sanitizeDateField(body, "d2");
}

exports.create = (req, res) => {
  authenticate(req, res, async () => {
    try {
      sanitizeAllDateFields(req.body);

      await Coa.create(req.body);
      res.status(201).json({ message: "Record created successfully" });
    } catch (err) {
      console.error("Create Error:", err);
      res.status(500).json({ message: err.message });
    }
  });
};

exports.update = (req, res) => {
  authenticate(req, res, async () => {
    const id = req.params.IND;
    console.log("Update ID:", id);
    if (!id) return res.status(400).json({ message: "id is required" });

    try {
      sanitizeAllDateFields(req.body);

      const record = await Coa.findOne({ where: { IND: id } });
      if (!record) return res.status(404).json({ message: "Record not found" });

      await record.update(req.body);
      res.status(200).json({ message: "Record updated successfully" });
    } catch (err) {
      console.error("Update Error:", err);
      res.status(500).json({ message: err.message });
    }
  });
};

exports.delete = (req, res) => {
  authenticate(req, res, async () => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "id is required" });

    try {
      const record = await Coa.findOne({ where: { IND: id } });
      if (!record) return res.status(404).json({ message: "Record not found" });

      await record.destroy();
      res.status(200).json({ message: "Record deleted successfully" });
    } catch (err) {
      console.error("Delete Error:", err);
      res.status(500).json({ message: err.message });
    }
  });
};
