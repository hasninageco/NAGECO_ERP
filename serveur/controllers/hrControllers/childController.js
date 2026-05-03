const Sequelize = require("sequelize");
const { Op } = Sequelize;
const Child = require("../../models/hr/Child");
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
      const data = await Child.findAll({ where: {} });
      res.json(data);
    } catch (dbErr) {
      res.status(500).json({ message: "Error fetching child records" });
    }
  });
};

// Fetch children by employee
exports.findByEmployee = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });

    const empId = req.params.EMP_CHILD;
    if (!empId) return res.status(400).json({ message: "EMP_CHILD is required" });

    try {
      const data = await Child.findAll({ where: { EMP_CHILD: empId } });
      res.json(data);
    } catch (dbErr) {
      res.status(500).json({ message: "Error fetching child records for employee" });
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
      await Child.create({
        NAME_CHILD: req.body.NAME_CHILD,
        NUM_NATIONAL: req.body.NUM_NATIONAL,
        DATE_NAISSANCE: req.body.DATE_NAISSANCE,
        SEX: req.body.SEX,
        EMP_CHILD: req.body.EMP_CHILD,
        type_child: req.body.type_child,
        STATE: req.body.STATE,
        NOTIONALITY: req.body.NOTIONALITY,
        Passport_Number: req.body.Passport_Number,
        English_Name: req.body.English_Name,
        TEL: req.body.TEL,
        ADRESS: req.body.ADRESS,
        MAIL: req.body.MAIL,
      });

      res.status(200).json({ message: "Child added successfully" });
    } catch (err) {
      console.error("Create Child Error:", err);
      res.status(500).json({ message: err.message || "Some error occurred while creating the child" });
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

    const id = req.params.ID_CHILD;
    if (!id) return res.status(400).json({ message: "ID_CHILD is required" });

    if (!req.body) return res.status(400).json({ message: "Content cannot be empty!" });

    try {
      const record = await Child.findOne({ where: { ID_CHILD: id } });
      if (!record) return res.status(404).json({ message: "Child not found" });

      await record.update({
        NAME_CHILD: req.body.NAME_CHILD,
        NUM_NATIONAL: req.body.NUM_NATIONAL,
        DATE_NAISSANCE: req.body.DATE_NAISSANCE,
        SEX: req.body.SEX,
        EMP_CHILD: req.body.EMP_CHILD,
        type_child: req.body.type_child,
        STATE: req.body.STATE,
        NOTIONALITY: req.body.NOTIONALITY,
        Passport_Number: req.body.Passport_Number,
        English_Name: req.body.English_Name,
        TEL: req.body.TEL,
        ADRESS: req.body.ADRESS,
        MAIL: req.body.MAIL,
      });

      res.status(200).json({ message: "Child updated successfully" });
    } catch (err) {
      console.error("Update Child Error:", err);
      res.status(500).json({ message: err.message || "Some error occurred while updating the child" });
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

    const id = req.params.ID_CHILD;
    if (!id) return res.status(400).json({ message: "ID_CHILD is required" });

    try {
      const record = await Child.findOne({ where: { ID_CHILD: id } });
      if (!record) return res.status(404).json({ message: "Child not found" });

      await record.destroy();
      res.status(200).json({ message: "Child deleted successfully" });
    } catch (err) {
      console.error("Delete Child Error:", err);
      res.status(500).json({ message: err.message || "Some error occurred while deleting the child" });
    }
  });
};
