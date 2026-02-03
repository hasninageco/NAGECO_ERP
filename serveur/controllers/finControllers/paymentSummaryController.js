const { Op, Sequelize } = require('sequelize');
const jwt = require('jsonwebtoken');
const ChashBookCheck = require('../../models/fin/Chash_Book_Check');
const SarfCash = require('../../models/fin/Sarf_cash');
const SarfEtrLoc = require('../../models/fin/Sarf_etr_loc');

const authenticate = (req, res, callback) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Authorization header missing' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token missing' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid or expired token' });
    callback(decoded);
  });
};

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

// Format JS Date -> 'YYYY-MM-DD HH:mm:ss.SSS' (SQL Server datetime friendly, no timezone)
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

exports.summary = (req, res) => {
  authenticate(req, res, async () => {
    try {
      const period = (req.query.period || 'day').toString();
      const range = getRange(period);
      const fromParam = req.query.from ? new Date(req.query.from) : range.from;
      const toParam = req.query.to ? new Date(req.query.to) : range.to;
  const fromStr = formatDateForMSSQL(fromParam);
  const toStr = formatDateForMSSQL(toParam);

      // Build SQL Server-safe WHERE using ISDATE + CONVERT(datetime, [table].[date_trandsaction]) to avoid string timezone issues
      const whereLiteral = (tableName) => {
        if (fromStr && toStr) {
          return Sequelize.literal(`ISDATE([${tableName}].[date_trandsaction]) = 1 AND CONVERT(datetime, [${tableName}].[date_trandsaction]) BETWEEN N'${fromStr}' AND N'${toStr}'`);
        } else if (fromStr) {
          return Sequelize.literal(`ISDATE([${tableName}].[date_trandsaction]) = 1 AND CONVERT(datetime, [${tableName}].[date_trandsaction]) >= N'${fromStr}'`);
        }
        return null;
      };

      const results = { checkPayment: 0, cashPayment: 0, currencyPayment: 0 };
      const counts = { checks: 0, cash: 0, currency: 0 };
      const errors = [];

      try {
        const w = whereLiteral('Chash_Book_Check');
        const [v, c] = await Promise.all([
          ChashBookCheck.sum('montant', { where: w || {} }),
          ChashBookCheck.count({ where: w || {} })
        ]);
        results.checkPayment = Number(v) || 0;
        counts.checks = Number(c) || 0;
      } catch (e) {
        console.error('Chash_Book_Check sum error:', e?.message || e);
        errors.push('Chash_Book_Check');
      }
      try {
        const w = whereLiteral('Sarf_cash');
        const [v, c] = await Promise.all([
          SarfCash.sum('montant', { where: w || {} }),
          SarfCash.count({ where: w || {} })
        ]);
        results.cashPayment = Number(v) || 0;
        counts.cash = Number(c) || 0;
      } catch (e) {
        console.error('Sarf_cash sum error:', e?.message || e);
        errors.push('Sarf_cash');
      }
      try {
        const w = whereLiteral('Sarf_etr_loc');
        const [v, c] = await Promise.all([
          SarfEtrLoc.sum('montant', { where: w || {} }),
          SarfEtrLoc.count({ where: w || {} })
        ]);
        results.currencyPayment = Number(v) || 0;
        counts.currency = Number(c) || 0;
      } catch (e) {
        console.error('Sarf_etr_loc sum error:', e?.message || e);
        errors.push('Sarf_etr_loc');
      }

      // Get global min/max dates (unfiltered) for guidance
      let meta = undefined;
      try {
        const [minCk, maxCk, minCa, maxCa, minCu, maxCu] = await Promise.all([
          ChashBookCheck.min('date_trandsaction'),
          ChashBookCheck.max('date_trandsaction'),
          SarfCash.min('date_trandsaction'),
          SarfCash.max('date_trandsaction'),
          SarfEtrLoc.min('date_trandsaction'),
          SarfEtrLoc.max('date_trandsaction'),
        ]);
        const dates = [minCk, minCa, minCu].filter(Boolean).sort();
        const maxes = [maxCk, maxCa, maxCu].filter(Boolean).sort();
        meta = {
          minDates: {
            Chash_Book_Check: minCk || null,
            Sarf_cash: minCa || null,
            Sarf_etr_loc: minCu || null,
          },
          maxDates: {
            Chash_Book_Check: maxCk || null,
            Sarf_cash: maxCa || null,
            Sarf_etr_loc: maxCu || null,
          },
          globalMin: dates.length ? dates[0] : null,
          globalMax: maxes.length ? maxes[maxes.length - 1] : null,
        };
      } catch (e) {
        console.error('Meta date range error:', e?.message || e);
      }

      res.json({
        period,
        from: fromParam || null,
        to: toParam || null,
        data: results,
        counts,
        meta,
        errors: errors.length ? errors : undefined,
      });
    } catch (err) {
      console.error('Payment summary error:', err);
      res.status(500).json({ message: 'Error fetching payment summary' });
    }
  });
};

// Debug endpoint: peek recent rows and quick counts per model
exports.peek = (req, res) => {
  authenticate(req, res, async () => {
    try {
      const [recentChecks, recentCash, recentCurrency] = await Promise.all([
        ChashBookCheck.findAll({ attributes: ['ID_transaction', 'date_trandsaction', 'montant'], order: [['date_trandsaction', 'DESC']], limit: 5 }),
        SarfCash.findAll({ attributes: ['ID_transaction', 'date_trandsaction', 'montant'], order: [['date_trandsaction', 'DESC']], limit: 5 }),
        SarfEtrLoc.findAll({ attributes: ['ID_transaction', 'date_trandsaction', 'montant'], order: [['date_trandsaction', 'DESC']], limit: 5 }),
      ]);

      const now = new Date();
      const ms = 1000 * 60 * 60 * 24;
      const ranges = {
        day: { from: new Date(now.getTime() - 1 * ms), to: now },
        week: { from: new Date(now.getTime() - 7 * ms), to: now },
        month: { from: new Date(now.getTime() - 30 * ms), to: now },
        year: { from: new Date(now.getTime() - 365 * ms), to: now },
      };

      const countFor = async (Model, tableName, r) => {
        const fromStr2 = formatDateForMSSQL(r.from);
        const toStr2 = formatDateForMSSQL(r.to);
        const w = Sequelize.literal(`ISDATE([${tableName}].[date_trandsaction]) = 1 AND CONVERT(datetime, [${tableName}].[date_trandsaction]) BETWEEN N'${fromStr2}' AND N'${toStr2}'`);
        return Model.count({ where: w });
      };

      const [checks, cash, currency] = await Promise.all([
        Promise.all([
          countFor(ChashBookCheck, 'Chash_Book_Check', ranges.day),
          countFor(ChashBookCheck, 'Chash_Book_Check', ranges.week),
          countFor(ChashBookCheck, 'Chash_Book_Check', ranges.month),
          countFor(ChashBookCheck, 'Chash_Book_Check', ranges.year),
        ]),
        Promise.all([
          countFor(SarfCash, 'Sarf_cash', ranges.day),
          countFor(SarfCash, 'Sarf_cash', ranges.week),
          countFor(SarfCash, 'Sarf_cash', ranges.month),
          countFor(SarfCash, 'Sarf_cash', ranges.year),
        ]),
        Promise.all([
          countFor(SarfEtrLoc, 'Sarf_etr_loc', ranges.day),
          countFor(SarfEtrLoc, 'Sarf_etr_loc', ranges.week),
          countFor(SarfEtrLoc, 'Sarf_etr_loc', ranges.month),
          countFor(SarfEtrLoc, 'Sarf_etr_loc', ranges.year),
        ]),
      ]);

      res.json({
        recent: { checks: recentChecks, cash: recentCash, currency: recentCurrency },
        counts: {
          checks: { day: checks[0][0], week: checks[0][1], month: checks[0][2], year: checks[0][3] },
          cash: { day: cash[0][0], week: cash[0][1], month: cash[0][2], year: cash[0][3] },
          currency: { day: currency[0][0], week: currency[0][1], month: currency[0][2], year: currency[0][3] },
        },
      });
    } catch (err) {
      console.error('Peek error:', err);
      res.status(500).json({ message: 'Error peeking payment data' });
    }
  });
};
