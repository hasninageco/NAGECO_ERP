const Sequelize = require("sequelize");
const { Op } = Sequelize;
const employee = require("../../models/hr/employee");
const costCenter = require("../../models/hr/CostCenter");
const jwt = require("jsonwebtoken");

const BLOCKED_EMPLOYEE_FIELDS = new Set(["ID_EMP"]);

const normalizeByType = (attribute, value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const typeKey = attribute?.type?.key;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (typeKey === "BOOLEAN") {
      const normalized = trimmed.toLowerCase();
      if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
      if (normalized === "false" || normalized === "0" || normalized === "no") return false;
      return null;
    }

    if (typeKey === "INTEGER" || typeKey === "BIGINT") {
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? Math.trunc(numeric) : null;
    }

    if (
      typeKey === "DECIMAL" ||
      typeKey === "FLOAT" ||
      typeKey === "DOUBLE" ||
      typeKey === "REAL"
    ) {
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? numeric : null;
    }

    if (typeKey === "DATE") {
      const date = new Date(trimmed);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    return trimmed;
  }

  if (typeKey === "BOOLEAN") {
    return Boolean(value);
  }

  if (typeKey === "INTEGER" || typeKey === "BIGINT") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.trunc(numeric) : null;
  }

  if (
    typeKey === "DECIMAL" ||
    typeKey === "FLOAT" ||
    typeKey === "DOUBLE" ||
    typeKey === "REAL"
  ) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  if (typeKey === "DATE") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return value;
};

const buildEmployeePayload = (body) => {
  const payload = {};
  const attributes = employee.rawAttributes || {};

  for (const [fieldName, attribute] of Object.entries(attributes)) {
    if (BLOCKED_EMPLOYEE_FIELDS.has(fieldName)) continue;
    if (!Object.prototype.hasOwnProperty.call(body, fieldName)) continue;

    const normalized = normalizeByType(attribute, body[fieldName]);
    if (normalized !== undefined) {
      payload[fieldName] = normalized;
    }
  }

  return payload;
};

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

// Fetch one employee by Ref_emp
exports.findByRef = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, async (err) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });

    const ref = (req.params.Ref_emp || "").trim();
    if (!ref) return res.status(400).json({ message: "Ref_emp is required" });

    try {
      const record = await employee.findOne({
        where: {
          STATE: true,
          Ref_emp: ref,
        },
        attributes: ["ID_EMP", "NAME", "Ref_emp", "COST_CENTER", "date_naissance", "SEXE"],
      });

      if (!record) return res.status(404).json({ message: "Employee not found" });

      // COST_CENTER stores the administration id (id_administratin). Return readable details too.
      let cc = null;
      const ccIdRaw = record.get("COST_CENTER");
      const ccId = ccIdRaw != null && String(ccIdRaw).trim() !== "" ? Number(ccIdRaw) : NaN;
      if (Number.isFinite(ccId)) {
        cc = await costCenter.findOne({
          where: { id_administratin: ccId },
          attributes: ["id_administratin", "administration", "administration_ar", "Branche"],
        });
      }

      const base = record.toJSON();
      res.json({
        ...base,
        COST_CENTER_NAME: cc ? cc.administration : null,
        COST_CENTER_AR: cc ? cc.administration_ar : null,
        COST_CENTER_CODE: cc ? cc.Branche : null,
      });
    } catch (dbErr) {
      console.error("Employees findByRef error:", dbErr);
      res.status(500).json({ message: "Error fetching employee" });
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

    const payload = buildEmployeePayload(req.body || {});

    if (!payload.NAME || !payload.TEL || !payload.attached_number) {
      return res.status(400).json({ message: "NAME, TEL and attached_number are required" });
    }

    try {
      await employee.create(payload);

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

    const payload = buildEmployeePayload(req.body || {});

    if (!payload.NAME || !payload.TEL || !payload.attached_number) {
      return res.status(400).json({ message: "NAME, TEL and attached_number are required" });
    }

    try {
      const record = await employee.findOne({ where: { ID_EMP: id } });
      if (!record) return res.status(404).json({ message: "Record not found" });

      await record.update(payload);

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