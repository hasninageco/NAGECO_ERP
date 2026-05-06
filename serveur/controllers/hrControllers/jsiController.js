const jsi = require("../../models/hr/jsi");
const costCenter = require("../../models/hr/CostCenter");
const jwt = require("jsonwebtoken");
const { Op, fn, col, literal, where, QueryTypes } = require("sequelize");

function getJsiTableName() {
  const tn = typeof jsi.getTableName === 'function' ? jsi.getTableName() : 'Journal_sahra_importer';
  return typeof tn === 'object'
    ? `${tn.schema ? `[${tn.schema}].` : ''}[${tn.tableName || tn.table || 'Journal_sahra_importer'}]`
    : `[${tn}]`;
}

function getEmployeeTableName() {
  // The EMPLOYEE table is referenced by name in the database.
  return '[EMPLOYEE]';
}

function getCostCenterTableName() {
  const tn = typeof costCenter.getTableName === 'function' ? costCenter.getTableName() : 'Adminstration';
  return typeof tn === 'object'
    ? `${tn.schema ? `[${tn.schema}].` : ''}[${tn.tableName || tn.table || 'Adminstration'}]`
    : `[${tn}]`;
}

// Fetch all records
exports.find = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });

    try {
      const data = await jsi.findAll();
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

    if (!req.body || req.body.id_emp == null || req.body.IS_OK == null) {
      return res.status(400).json({ message: "id_emp and IS_OK are required" });
    }

    try {
      await jsi.create({ ...req.body });
      res.status(200).json({ message: "Record added successfully" });
    } catch (createErr) {
      console.error("Create Record Error:", createErr);
      res.status(500).json({
        message: createErr.message || "Some error occurred while creating the record"
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

    const id = req.params.id_tran;
    if (!id) return res.status(400).json({ message: "id_tran is required" });

    try {
      const record = await jsi.findOne({ where: { id_tran: id } });
      if (!record) return res.status(404).json({ message: "Record not found" });

      await record.update({ ...req.body });
      res.status(200).json({ message: "Record updated successfully" });
    } catch (updateErr) {
      console.error("Update Record Error:", updateErr);
      res.status(500).json({
        message: updateErr.message || "Some error occurred while updating the record"
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

    const id = req.params.id_tran;
    if (!id) return res.status(400).json({ message: "id_tran is required" });

    try {
      const record = await jsi.findOne({ where: { id_tran: id } });
      if (!record) return res.status(404).json({ message: "Record not found" });

      await record.destroy();
      res.status(200).json({ message: "Record deleted successfully" });
    } catch (deleteErr) {
      console.error("Delete Record Error:", deleteErr);
      res.status(500).json({
        message: deleteErr.message || "Some error occurred while deleting the record"
      });
    }
  });
};

// Aggregate the number of "Q" markers per employee/month (DATE_JS)
exports.getsum_Q = async (req, res) => {

  console.log('[getsum_Q] called');
  const authHeader = req.headers.authorization;
  console.log('[getsum_Q] incoming request');
  if (!authHeader) {
    console.log('[getsum_Q] missing auth header');
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log('[getsum_Q] missing token');
    return res.status(401).json({ message: "Token missing" });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err) => {
    if (err) {
      console.log('[getsum_Q] invalid token', err?.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const idEmp = parseInt(req.query.id_emp || req.body?.id_emp, 10);
    const month = parseInt(req.query.month || req.body?.month, 10);
    const year = parseInt(req.query.year || req.body?.year, 10);

    if (!idEmp || Number.isNaN(month) || Number.isNaN(year) || month < 1 || month > 12) {
      console.log('[getsum_Q] bad params', { idEmp, month, year });
      return res.status(400).json({ message: "id_emp, month and year are required" });
    }

    // Build a CASE expression that counts how many j_1..j_31 columns contain "Q"
    const cases = [];
    for (let i = 1; i <= 31; i++) {
      cases.push(`CASE WHEN j_${i} LIKE '%Q%' THEN 1 ELSE 0 END`);
    }
    const sumExpr = cases.join(" + ");

    try {
      // Use a raw query to avoid any dialect-specific aggregation issues
      const tn = typeof jsi.getTableName === 'function' ? jsi.getTableName() : 'Journal_sahra_importer';
      const tableName = typeof tn === 'object'
        ? `${tn.schema ? `[${tn.schema}].` : ''}[${tn.tableName || tn.table || 'Journal_sahra_importer'}]`
        : `[${tn}]`;

      console.log('[getsum_Q] params', { idEmp, month, year, tableName });

      const [result] = await jsi.sequelize.query(
        `SELECT COALESCE(SUM(${sumExpr}), 0) AS totalQ
         FROM ${tableName}
         WHERE id_emp = :idEmp
           AND MONTH(DATE_JS) = :month
           AND YEAR(DATE_JS) = :year`,
        {
          replacements: { idEmp, month, year },
          type: QueryTypes.SELECT,
        }
      );

      const totalQ = result && typeof result.totalQ !== 'undefined' ? Number(result.totalQ) : 0;
      console.log('[getsum_Q] result', { totalQ, raw: result });
      return res.json({ totalQ });
    } catch (dbErr) {
      console.error("getsum_Q error:", dbErr);
      return res.status(500).json({ message: "Error calculating Q counts" });
    }
  });
};

// Aggregate worked days: count markers 'P' or 'TD' per employee/month
exports.getsum_PT = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, async (err) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });

    const idEmp = parseInt(req.query.id_emp || req.body?.id_emp, 10);
    const month = parseInt(req.query.month || req.body?.month, 10);
    const year = parseInt(req.query.year || req.body?.year, 10);
    if (!idEmp || Number.isNaN(month) || Number.isNaN(year) || month < 1 || month > 12) {
      return res.status(400).json({ message: "id_emp, month and year are required" });
    }

    const cases = [];
    for (let i = 1; i <= 31; i++) {
      cases.push(`CASE WHEN j_${i} LIKE '%P%' OR j_${i} LIKE '%TD%' THEN 1 ELSE 0 END`);
    }
    const sumExpr = cases.join(' + ');
    try {
      const tn = typeof jsi.getTableName === 'function' ? jsi.getTableName() : 'Journal_sahra_importer';
      const tableName = typeof tn === 'object'
        ? `${tn.schema ? `[${tn.schema}].` : ''}[${tn.tableName || tn.table || 'Journal_sahra_importer'}]`
        : `[${tn}]`;
      const [result] = await jsi.sequelize.query(
        `SELECT COALESCE(SUM(${sumExpr}), 0) AS totalPT
         FROM ${tableName}
         WHERE id_emp = :idEmp
           AND MONTH(DATE_JS) = :month
           AND YEAR(DATE_JS) = :year`,
        { replacements: { idEmp, month, year }, type: QueryTypes.SELECT }
      );
      const totalPT = result && typeof result.totalPT !== 'undefined' ? Number(result.totalPT) : 0;
      return res.json({ totalPT });
    } catch (dbErr) {
      console.error('getsum_PT error:', dbErr);
      return res.status(500).json({ message: 'Error calculating PT counts' });
    }
  });
};

// Aggregate break days: count markers 'B' per employee/month
exports.getsum_B = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, async (err) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });

    const idEmp = parseInt(req.query.id_emp || req.body?.id_emp, 10);
    const month = parseInt(req.query.month || req.body?.month, 10);
    const year = parseInt(req.query.year || req.body?.year, 10);
    if (!idEmp || Number.isNaN(month) || Number.isNaN(year) || month < 1 || month > 12) {
      return res.status(400).json({ message: "id_emp, month and year are required" });
    }

    const cases = [];
    for (let i = 1; i <= 31; i++) {
      cases.push(`CASE WHEN j_${i} LIKE '%B%' THEN 1 ELSE 0 END`);
    }
    const sumExpr = cases.join(' + ');
    try {
      const tn = typeof jsi.getTableName === 'function' ? jsi.getTableName() : 'Journal_sahra_importer';
      const tableName = typeof tn === 'object'
        ? `${tn.schema ? `[${tn.schema}].` : ''}[${tn.tableName || tn.table || 'Journal_sahra_importer'}]`
        : `[${tn}]`;
      const [result] = await jsi.sequelize.query(
        `SELECT COALESCE(SUM(${sumExpr}), 0) AS totalB
         FROM ${tableName}
         WHERE id_emp = :idEmp
           AND MONTH(DATE_JS) = :month
           AND YEAR(DATE_JS) = :year`,
        { replacements: { idEmp, month, year }, type: QueryTypes.SELECT }
      );
      const totalB = result && typeof result.totalB !== 'undefined' ? Number(result.totalB) : 0;
      return res.json({ totalB });
    } catch (dbErr) {
      console.error('getsum_B error:', dbErr);
      return res.status(500).json({ message: 'Error calculating B counts' });
    }
  });
};

// List timesheets (Journal_sahra_importer) for a specific month/year
// Optional filter: employeeType = 'all' | 'national' | 'expat'
exports.listTimesheets = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Authorization header missing' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET, async (err) => {
    if (err) return res.status(401).json({ message: 'Invalid or expired token' });

    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);
    const employeeTypeRaw = String(req.query.employeeType || 'all').toLowerCase();
    const employeeType = ['all', 'national', 'expat'].includes(employeeTypeRaw) ? employeeTypeRaw : 'all';
    const attachedNumberPrefixRaw = req.query.attachedNumberPrefix ?? req.query.attached_number ?? '';
    const attachedNumberPrefix = String(attachedNumberPrefixRaw || '').trim();

    if (Number.isNaN(month) || Number.isNaN(year) || month < 1 || month > 12) {
      return res.status(400).json({ message: 'month and year are required' });
    }

    try {
      const tableName = getJsiTableName();
      const empTable = getEmployeeTableName();
      const ccTable = getCostCenterTableName();

      const employeeFilterSql =
        employeeType === 'national'
          ? 'AND (emp.IS_FOREINGHT = 0 OR emp.IS_FOREINGHT IS NULL)'
          : employeeType === 'expat'
            ? 'AND emp.IS_FOREINGHT = 1'
            : '';

      const escapeLikePrefix = (value) =>
        String(value)
          .replace(/\[/g, '[[]')
          .replace(/%/g, '[%]')
          .replace(/_/g, '[_]');

      const attachedNumberFilterSql = attachedNumberPrefix
        ? "AND LTRIM(RTRIM(ISNULL(emp.attached_number, ''))) LIKE :attachedNumberPrefixLike"
        : '';

      const sql = `
        SELECT
          jsi.id_tran,
          jsi.id_emp,
          jsi.DATE_JS,
          jsi.job,
          jsi.nom,
          jsi.missing,
          jsi.IS_OK,
          jsi.NATIONAL_NO,
          jsi.IN_CALL,
          jsi.j_1, jsi.j_2, jsi.j_3, jsi.j_4, jsi.j_5, jsi.j_6, jsi.j_7, jsi.j_8, jsi.j_9, jsi.j_10,
          jsi.j_11, jsi.j_12, jsi.j_13, jsi.j_14, jsi.j_15, jsi.j_16, jsi.j_17, jsi.j_18, jsi.j_19, jsi.j_20,
          jsi.j_21, jsi.j_22, jsi.j_23, jsi.j_24, jsi.j_25, jsi.j_26, jsi.j_27, jsi.j_28, jsi.j_29, jsi.j_30,
          jsi.j_31,
          emp.COST_CENTER,
          cc.Branche AS COST_CENTER_CODE,
          emp.Ref_emp,
          emp.attached_number,
          emp.NAME,
          emp.IS_FOREINGHT
        FROM ${tableName} AS jsi
        LEFT JOIN ${empTable} AS emp ON emp.ID_EMP = jsi.id_emp
        LEFT JOIN ${ccTable} AS cc ON TRY_CAST(emp.COST_CENTER AS INT) = cc.id_administratin
        WHERE MONTH(jsi.DATE_JS) = :month
          AND YEAR(jsi.DATE_JS) = :year
          ${employeeFilterSql}
          ${attachedNumberFilterSql}
        ORDER BY cc.Branche, emp.COST_CENTER, jsi.id_emp, jsi.id_tran
      `;

      const replacements = { month, year };
      if (attachedNumberPrefix) {
        replacements.attachedNumberPrefixLike = `${escapeLikePrefix(attachedNumberPrefix)}%`;
      }

      const rows = await jsi.sequelize.query(sql, {
        replacements,
        type: QueryTypes.SELECT,
      });

      return res.json(rows);
    } catch (dbErr) {
      console.error('listTimesheets error:', dbErr);
      return res.status(500).json({ message: 'Error fetching timesheets' });
    }
  });
};

// Bulk update day markers for timesheets.
// Body: { updates: [{ id_tran: number, fields: { j_1?: string, ... } }] }
exports.bulkUpdateTimesheets = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Authorization header missing' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET, async (err) => {
    if (err) return res.status(401).json({ message: 'Invalid or expired token' });

    const updates = req.body?.updates;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'updates array is required' });
    }

    const allowedKeys = new Set(Array.from({ length: 31 }, (_, i) => `j_${i + 1}`));

    try {
      let updated = 0;
      const errors = [];

      for (const item of updates) {
        const id_tran = parseInt(item?.id_tran, 10);
        const fields = item?.fields && typeof item.fields === 'object' ? item.fields : null;
        if (!id_tran || !fields) {
          errors.push({ id_tran: item?.id_tran, message: 'Invalid update item' });
          continue;
        }

        const safeFields = {};
        for (const [key, value] of Object.entries(fields)) {
          if (!allowedKeys.has(key)) continue;
          safeFields[key] = value == null ? null : String(value).slice(0, 5);
        }

        if (Object.keys(safeFields).length === 0) {
          continue;
        }

        const [count] = await jsi.update(safeFields, { where: { id_tran } });
        updated += count;
      }

      return res.json({ updated, errors });
    } catch (updateErr) {
      console.error('bulkUpdateTimesheets error:', updateErr);
      return res.status(500).json({ message: 'Error updating timesheets' });
    }
  });
};
