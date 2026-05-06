const { Op, Sequelize } = require("sequelize");
const Requisition = require("../../models/SupplyCahin/Requisition");
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

// Build date range by period relative to now
function getRange(period) {
  const now = new Date();
  const ms = 1000 * 60 * 60 * 24;
  switch ((period || 'day').toLowerCase()) {
    case 'day':
      return { from: new Date(now.getTime() - 1 * ms), to: now };
    case 'week':
      return { from: new Date(now.getTime() - 7 * ms), to: now };
    case 'month':
      return { from: new Date(now.getTime() - 30 * ms), to: now };
    case 'year':
      return { from: new Date(now.getTime() - 365 * ms), to: now };
    case 'all':
      return { from: null, to: null };
    default:
      return { from: new Date(now.getTime() - 1 * ms), to: now };
  }
}

function formatDateForMSSQL(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return null;
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const SSS = pad(date.getMilliseconds(), 3);
  return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}.${SSS}`;
}

function buildSqlServerDateWhere(tableName, columnName, fromStr, toStr) {
  const castExpr = `TRY_CONVERT(datetime, [${tableName}].[${columnName}])`;
  if (fromStr && toStr) {
    return Sequelize.literal(`${castExpr} IS NOT NULL AND ${castExpr} BETWEEN N'${fromStr}' AND N'${toStr}'`);
  }
  if (fromStr) {
    return Sequelize.literal(`${castExpr} IS NOT NULL AND ${castExpr} >= N'${fromStr}'`);
  }
  return {};
}

// CRUD
exports.find = (req, res) => {
  authenticate(req, res, async () => {
    try {
      const data = await Requisition.findAll();
      res.json(data);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Error fetching requisitions" });
    }
  });
};

exports.findById = (req, res) => {
  authenticate(req, res, async () => {
    try {
      const id = req.params.id;
      const row = await Requisition.findOne({ where: { ID_REQ: id } });
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json(row);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Error fetching requisition" });
    }
  });
};

exports.create = (req, res) => {
  authenticate(req, res, async () => {
    try {
      const payload = req.body || {};
      const row = await Requisition.create(payload);
      res.status(201).json({ message: "Created", id: row.ID_REQ });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e.message || "Create failed" });
    }
  });
};

exports.update = (req, res) => {
  authenticate(req, res, async () => {
    try {
      const id = req.params.id;
      const row = await Requisition.findOne({ where: { ID_REQ: id } });
      if (!row) return res.status(404).json({ message: "Not found" });
      await row.update(req.body || {});
      res.json({ message: "Updated" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e.message || "Update failed" });
    }
  });
};

exports.remove = (req, res) => {
  authenticate(req, res, async () => {
    try {
      const id = req.params.id;
      const row = await Requisition.findOne({ where: { ID_REQ: id } });
      if (!row) return res.status(404).json({ message: "Not found" });
      await row.destroy();
      res.json({ message: "Deleted" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e.message || "Delete failed" });
    }
  });
};

// Summary counts for dashboard: number of requisitions by period using date_req
exports.summary = (req, res) => {
  authenticate(req, res, async () => {
    try {
      const period = (req.query.period || 'day').toString();
      const range = getRange(period);
      const fromParam = req.query.from ? new Date(req.query.from) : range.from;
      const toParam = req.query.to ? new Date(req.query.to) : range.to;
      const fromStr = formatDateForMSSQL(fromParam);
      const toStr = formatDateForMSSQL(toParam);

      const where = buildSqlServerDateWhere('Request_art', 'date_req', fromStr, toStr);

      const total = await Requisition.count({ where: where || {} });

      // Group by raw requisition_status
      const grouped = await Requisition.findAll({
        attributes: [
          'requisition_status',
          [Sequelize.fn('COUNT', Sequelize.literal('1')), 'count']
        ],
        where: where || {},
        group: ['requisition_status']
      });

      // Normalize into the three categories requested
      const byStatusRaw = {};
  const byCategory = { 'Is Approved': 0, 'Is Refused': 0, 'Pending': 0 };
      for (const row of grouped) {
        const status = (row.get('requisition_status') ?? '').toString();
        const count = Number((row.get('count') ?? 0)) || 0;
        byStatusRaw[status || 'NULL'] = (byStatusRaw[status || 'NULL'] || 0) + count;

        const s = status.trim().toLowerCase();
        if (s.includes('approve')) {
          byCategory['Is Approved'] += count;
        } else if (s.includes('refus') || s.includes('reject')) {
          byCategory['Is Refused'] += count;
        } else {
          byCategory['Pending'] += count; // default bucket
        }
      }

      return res.json({ period, from: fromParam || null, to: toParam || null, total, byStatusRaw, byCategory });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Summary failed" });
    }
  });
};
