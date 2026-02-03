const holidays = require('../../models/hr/HOLIDAYS');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length < 2) return null;
  return parts[1];
};

// Fetch all holidays
exports.find = async (req, res) => {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET, async (err) => {
    if (err) return res.status(401).json({ message: 'Invalid or expired token' });

    try {
      const data = await holidays.findAll();
      res.json(data);
    } catch (dbErr) {
      res.status(500).json({ message: 'Error fetching records' });
    }
  });
};

// Create a holiday
exports.create = async (req, res) => {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET, async (err) => {
    if (err) return res.status(401).json({ message: 'Invalid or expired token' });

    try {
      const payload = {
        DATE_H: req.body?.DATE_H ?? null,
        COMMENT_H: req.body?.COMMENT_H ?? null,
        IN_CALL: req.body?.IN_CALL ?? null,
      };

      await holidays.create(payload);
      res.status(200).json({ message: 'Holiday added successfully' });
    } catch (e) {
      console.error('Create Holiday Error:', e);
      res.status(500).json({ message: e.message || 'Some error occurred while creating the record' });
    }
  });
};

// Update a holiday
exports.update = async (req, res) => {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET, async (err) => {
    if (err) return res.status(401).json({ message: 'Invalid or expired token' });

    const id = req.params.ID_HOLIDAYS;
    if (!id) return res.status(400).json({ message: 'ID_HOLIDAYS is required' });

    try {
      const record = await holidays.findOne({ where: { ID_HOLIDAYS: id } });
      if (!record) return res.status(404).json({ message: 'Record not found' });

      await record.update({
        DATE_H: req.body?.DATE_H ?? record.DATE_H,
        COMMENT_H: req.body?.COMMENT_H ?? record.COMMENT_H,
        IN_CALL: req.body?.IN_CALL ?? record.IN_CALL,
      });

      res.status(200).json({ message: 'Holiday updated successfully' });
    } catch (e) {
      console.error('Update Holiday Error:', e);
      res.status(500).json({ message: e.message || 'Some error occurred while updating the record' });
    }
  });
};

// Delete a holiday
exports.delete = async (req, res) => {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET, async (err) => {
    if (err) return res.status(401).json({ message: 'Invalid or expired token' });

    const id = req.params.ID_HOLIDAYS;
    if (!id) return res.status(400).json({ message: 'ID_HOLIDAYS is required' });

    try {
      const record = await holidays.findOne({ where: { ID_HOLIDAYS: id } });
      if (!record) return res.status(404).json({ message: 'Record not found' });

      await record.destroy();
      res.status(200).json({ message: 'Holiday deleted successfully' });
    } catch (e) {
      console.error('Delete Holiday Error:', e);
      res.status(500).json({ message: e.message || 'Some error occurred while deleting the record' });
    }
  });
};

// Check a date range and mark whether each date is a holiday (and return the holiday ID when present)
// GET /holidays/check-period?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.checkPeriod = async (req, res) => {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET, async (err) => {
    if (err) return res.status(401).json({ message: 'Invalid or expired token' });

    const fromRaw = (req.query.from || '').toString().trim();
    const toRaw = (req.query.to || '').toString().trim();
    const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDateRe.test(fromRaw) || !isoDateRe.test(toRaw)) {
      return res.status(400).json({ message: 'Query params "from" and "to" must be in YYYY-MM-DD format' });
    }

    // Normalize ordering
    const from = fromRaw <= toRaw ? fromRaw : toRaw;
    const to = fromRaw <= toRaw ? toRaw : fromRaw;

    // Safety guard for very large ranges
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDate = new Date(`${to}T00:00:00.000Z`);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return res.status(400).json({ message: 'Invalid dates provided' });
    }

    const maxDays = 366; // 1 year
    const diffDays = Math.floor((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays < 0 || diffDays > maxDays) {
      return res.status(400).json({ message: `Date range too large (max ${maxDays + 1} days)` });
    }

    try {
      const rows = await holidays.findAll({
        where: {
          DATE_H: {
            [Op.between]: [from, to],
          },
        },
      });

      const byDate = new Map();
      for (const r of rows) {
        const dateStr = r?.DATE_H ? String(r.DATE_H).slice(0, 10) : null;
        if (!dateStr) continue;
        byDate.set(dateStr, r);
      }

      const days = [];
      for (let i = 0; i <= diffDays; i++) {
        const d = new Date(fromDate);
        d.setUTCDate(d.getUTCDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        const h = byDate.get(dateStr);
        days.push({
          date: dateStr,
          exists: !!h,
          ID_HOLIDAYS: h ? h.ID_HOLIDAYS : null,
          COMMENT_H: h ? h.COMMENT_H : null,
          IN_CALL: h ? h.IN_CALL : null,
        });
      }

      return res.json({ from, to, days });
    } catch (e) {
      console.error('Check Holiday Period Error:', e);
      return res.status(500).json({ message: e.message || 'Some error occurred while checking holidays' });
    }
  });
};
