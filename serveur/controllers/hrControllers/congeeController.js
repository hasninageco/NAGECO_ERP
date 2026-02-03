const Congee = require("../../models/hr/Congee");
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
      const data = await Congee.findAll();
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

    if (!req.body || !req.body.id_emp) {
      return res.status(400).json({ message: "id_emp is required" });
    }

    try {
      await Congee.create(req.body);
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

    const id = req.params.int_con;
    if (!id) return res.status(400).json({ message: "int_con is required" });

    try {
      const record = await Congee.findOne({ where: { int_con: id } });
      if (!record) return res.status(404).json({ message: "Record not found" });

      await record.update(req.body);
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

    const id = req.params.int_con;
    if (!id) return res.status(400).json({ message: "int_con is required" });

    try {
      const record = await Congee.findOne({ where: { int_con: id } });
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

// Fetch leaves by employee ID
exports.findByEmployee = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });

    const id_emp = req.params.id_emp;
    if (!id_emp) return res.status(400).json({ message: "id_emp is required" });

    try {
      // Query by employee id (id_emp) and return all leaves for that employee.
      // The frontend will filter by leave type (e.g. 'V') as needed.
      const data = await Congee.findAll({
        where: { id_emp: Number(id_emp) },
        order: [['date_depart', 'ASC']],
      });
      res.json(data);


      console.log('Fetched congee records for employee:', data);
    } catch (dbErr) {
      // Log full error for server-side debugging
      console.error('DB error fetching congee by employee:', dbErr);
      // Return the error message in the response temporarily to help frontend debugging.
      // IMPORTANT: remove or sanitize this in production to avoid leaking DB details.
      res.status(500).json({ message: "Error fetching records by id_emp", error: dbErr?.message || String(dbErr) });
    }
  });
};
