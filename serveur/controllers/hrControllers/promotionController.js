const jwt = require("jsonwebtoken");
const actionForm = require("../../models/hr/ActionForm");

const BLOCKED_FIELDS = new Set(["Id_transaction"]);

const normalizeByType = (attribute, value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const typeKey = attribute?.type?.key;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (typeKey === "INTEGER" || typeKey === "BIGINT") {
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? Math.trunc(numeric) : null;
    }

    if (typeKey === "DECIMAL" || typeKey === "FLOAT" || typeKey === "DOUBLE" || typeKey === "REAL") {
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? numeric : null;
    }

    if (typeKey === "DATE" || typeKey === "DATEONLY") {
      const date = new Date(trimmed);
      return Number.isNaN(date.getTime()) ? null : trimmed;
    }

    return trimmed;
  }

  if (typeKey === "INTEGER" || typeKey === "BIGINT") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.trunc(numeric) : null;
  }

  if (typeKey === "DECIMAL" || typeKey === "FLOAT" || typeKey === "DOUBLE" || typeKey === "REAL") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  if (typeKey === "DATE" || typeKey === "DATEONLY") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : value;
  }

  return value;
};

const buildPayload = (body, includeId = false) => {
  const payload = {};
  const attributes = actionForm.rawAttributes || {};

  for (const [fieldName, attribute] of Object.entries(attributes)) {
    if (!includeId && BLOCKED_FIELDS.has(fieldName)) continue;
    if (!Object.prototype.hasOwnProperty.call(body, fieldName)) continue;

    const normalized = normalizeByType(attribute, body[fieldName]);
    if (normalized !== undefined) {
      payload[fieldName] = normalized;
    }
  }

  return payload;
};

const verifyRequest = (req, res, onSuccess) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  return jwt.verify(token, process.env.JWT_SECRET, async (err) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });
    return onSuccess();
  });
};

exports.find = async (req, res) =>
  verifyRequest(req, res, async () => {
    try {
      const rows = await actionForm.findAll({ order: [["Id_transaction", "DESC"]] });
      res.json(rows);
    } catch (err) {
      console.error("Promotion find error:", err);
      res.status(500).json({ message: "Error fetching promotion transactions" });
    }
  });

exports.create = async (req, res) =>
  verifyRequest(req, res, async () => {
    const body = req.body || {};
    const payload = buildPayload(body, true);

    if (!payload.Id_transaction) {
      return res.status(400).json({ message: "Id_transaction is required" });
    }

    try {
      await actionForm.create(payload);
      res.status(200).json({ message: "Promotion transaction added successfully" });
    } catch (err) {
      console.error("Promotion create error:", err);
      res.status(500).json({ message: err.message || "Error creating promotion transaction" });
    }
  });

exports.update = async (req, res) =>
  verifyRequest(req, res, async () => {
    const id = Number(req.params.Id_transaction);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Id_transaction is required" });
    }

    const payload = buildPayload(req.body || {}, false);

    try {
      const row = await actionForm.findOne({ where: { Id_transaction: id } });
      if (!row) return res.status(404).json({ message: "Promotion transaction not found" });

      await row.update(payload);
      res.status(200).json({ message: "Promotion transaction updated successfully" });
    } catch (err) {
      console.error("Promotion update error:", err);
      res.status(500).json({ message: err.message || "Error updating promotion transaction" });
    }
  });

exports.delete = async (req, res) =>
  verifyRequest(req, res, async () => {
    const id = Number(req.params.Id_transaction);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Id_transaction is required" });
    }

    try {
      const row = await actionForm.findOne({ where: { Id_transaction: id } });
      if (!row) return res.status(404).json({ message: "Promotion transaction not found" });

      await row.destroy();
      res.status(200).json({ message: "Promotion transaction deleted successfully" });
    } catch (err) {
      console.error("Promotion delete error:", err);
      res.status(500).json({ message: err.message || "Error deleting promotion transaction" });
    }
  });
