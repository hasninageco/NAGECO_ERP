const Sequelize = require("sequelize");
const { Op } = Sequelize;
const employee = require("../../models/hr/employee");
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
      const data = await employee.findAll({
        where: {
          STATE: true,
          [Op.and]: [
            // Ref_emp is stored as string, compare numerically > 0
            Sequelize.where(Sequelize.cast(Sequelize.col('Ref_emp'), 'BIGINT'), { [Op.gt]: 0 })
          ]
        },
        order: [[Sequelize.cast(Sequelize.col('Ref_emp'), 'BIGINT'), 'ASC']]
      });

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

    // Example: require NAME and TEL, add more as needed
    if (!req.body || !req.body.NAME || !req.body.TEL) {
      return res.status(400).json({ message: "NAME and TEL are required" });
    }

    try {
      await employee.create({
        NAME: req.body.NAME,
        TEL: req.body.TEL,
        ADRESS: req.body.ADRESS,
        MAIL: req.body.MAIL,
        COMMENT: req.body.COMMENT,
        // ...add other fields as needed
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

    const id = req.params.ID_EMP;
    if (!id) return res.status(400).json({ message: "ID_EMP is required" });

    if (!req.body || !req.body.NAME || !req.body.TEL) {
      return res.status(400).json({ message: "NAME and TEL are required" });
    }

    try {
      const record = await employee.findOne({ where: { ID_EMP: id } });
      if (!record) return res.status(404).json({ message: "Record not found" });

      await record.update({
        NAME: req.body.NAME,
        TEL: req.body.TEL,
        ADRESS: req.body.ADRESS,
        MAIL: req.body.MAIL,
        COMMENT: req.body.COMMENT,
        // ...add other fields as needed
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

    const id = req.params.ID_EMP;
    if (!id) return res.status(400).json({ message: "ID_EMP is required" });

    try {
      const record = await employee.findOne({ where: { ID_EMP: id } });
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







exports.findActive = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });

    try {
      const data = await employee.findAll({ where: { STATE: true } });
      res.json(data);
    } catch (dbErr) {
      res.status(500).json({ message: "Error fetching records" });
    }
  });
};