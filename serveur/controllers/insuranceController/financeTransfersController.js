const { Op, QueryTypes } = require('sequelize');

const { sequelize, Sequelize: SequelizeLib, DataTypes } = require('../../models/insurance/_sequelize');

const ClaimLinePayments = require('../../models/insurance/ClaimLinePayments');
const ClaimLines = require('../../models/insurance/ClaimLines');

const { appendClaimActivity } = require('../../utils/claimActivityLog');

let paymentsTableReadyPromise = null;

const ensurePaymentsTable = async () => {
  if (paymentsTableReadyPromise) return paymentsTableReadyPromise;
  paymentsTableReadyPromise = (async () => {
    const qi = sequelize.getQueryInterface();
    try {
      await qi.describeTable('ClaimLinePayments');
      return true;
    } catch {
      try {
        await qi.createTable('ClaimLinePayments', {
          PaymentId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
          },
          ClaimLineId: {
            type: DataTypes.BIGINT,
            allowNull: false,
          },
          ClaimId: {
            type: DataTypes.BIGINT,
            allowNull: false,
          },
          AmountCompany: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true,
          },
          AmountEmployee: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true,
          },
          Status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'Paid',
          },
          PaidAt: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          PaidBy: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          Notes: {
            type: DataTypes.STRING(300),
            allowNull: true,
          },
          CreatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: SequelizeLib.literal('SYSDATETIME()'),
          },
        });

        try {
          await qi.addIndex('ClaimLinePayments', ['ClaimLineId'], {
            unique: true,
            name: 'UX_ClaimLinePayments_ClaimLineId',
          });
        } catch {
          // ignore index creation errors
        }

        return true;
      } catch {
        return false;
      }
    }
  })();

  return paymentsTableReadyPromise;
};

const toNumber = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

exports.approvedLines = async (req, res) => {
  try {
    const ok = await ensurePaymentsTable();
    if (!ok) {
      return res.status(500).json({ message: 'Payments table is not available' });
    }

    const paidRaw = req.query.paid !== undefined ? String(req.query.paid).trim().toLowerCase() : '';
    const wantPaid = paidRaw === '1' || paidRaw === 'true' || paidRaw === 'paid' || paidRaw === 'yes';
    const paidWhere = wantPaid ? 'p.PaymentId IS NOT NULL' : 'p.PaymentId IS NULL';

    const monthRaw = req.query.month !== undefined ? String(req.query.month).trim() : '';
    const yearRaw = req.query.year !== undefined ? String(req.query.year).trim() : '';
    const month = monthRaw ? Number(monthRaw) : NaN;
    const year = yearRaw ? Number(yearRaw) : NaN;

    const hasMonthYear = Number.isFinite(month) && Number.isFinite(year) && month >= 1 && month <= 12 && year >= 1900 && year <= 2500;
    const replacements = {};
    let dateFilterSql = '';
    if (hasMonthYear) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      replacements.startDate = startDate;
      replacements.endDate = endDate;
      const dateColumn = wantPaid ? 'p.PaidAt' : 'c.ClaimDate';
      dateFilterSql = ` AND ${dateColumn} >= :startDate AND ${dateColumn} < :endDate`;
    }

    const rows = await sequelize.query(
      `
      SELECT
        cl.ClaimLineId,
        cl.ClaimId,
        c.ClaimNo,
        c.Ref_emp,
        c.EMP_CHILD,
        c.ClaimDate,
        c.SubmissionDate,
        c.ClaimType,
        c.Status AS ClaimStatus,
        cl.ServiceId,
        s.ServiceName,
        s.ArabicName,
        cl.Qty,
        cl.UnitPrice,
        cl.ClaimedAmount,
        cl.CoverageUsed,
        cl.ApprovedAmount,
        cl.CompanyPay,
        cl.EmployeePay,
        cl.LineStatus,
        cl.Notes AS LineNotes,
        c.Notes AS ClaimNotes,
        e.NAME AS EmployeeName,
        ch.NAME_CHILD AS ChildName,
        p.PaymentId,
        p.Status AS PaymentStatus,
        p.PaidAt
      FROM ClaimLines cl
      INNER JOIN Claims c ON c.ClaimId = cl.ClaimId
      LEFT JOIN Services s ON s.ServiceId = cl.ServiceId
      LEFT JOIN ClaimLinePayments p ON p.ClaimLineId = cl.ClaimLineId
      LEFT JOIN EMPLOYEE e ON e.Ref_emp = c.Ref_emp
      LEFT JOIN CHILD ch ON ch.ID_CHILD = CASE WHEN ISNUMERIC(c.EMP_CHILD) = 1 THEN CAST(c.EMP_CHILD AS BIGINT) ELSE NULL END
      WHERE c.Status = 'Approved'
        AND cl.LineStatus = 'Approved'
        AND ${paidWhere}
        ${dateFilterSql}
      ORDER BY c.ClaimDate DESC, c.ClaimId DESC, cl.ClaimLineId DESC
      `,
      { type: QueryTypes.SELECT, replacements }
    );

    const out = (rows || []).map((r) => {
      const empChild = r.EMP_CHILD ? String(r.EMP_CHILD).trim() : '';
      const patientName = empChild ? r.ChildName || '' : r.EmployeeName || '';
      return {
        ClaimLineId: r.ClaimLineId,
        ClaimId: r.ClaimId,
        ClaimNo: r.ClaimNo,
        Ref_emp: r.Ref_emp,
        EMP_CHILD: r.EMP_CHILD,
        PatientName: patientName,
        ClaimDate: r.ClaimDate,
        SubmissionDate: r.SubmissionDate,
        ClaimType: r.ClaimType,
        ClaimStatus: r.ClaimStatus,

        PaymentId: r.PaymentId,
        PaymentStatus: r.PaymentStatus,
        PaidAt: r.PaidAt,

        ServiceId: r.ServiceId,
        ServiceName: r.ServiceName,
        ServiceArabicName: r.ArabicName,

        Qty: toNumber(r.Qty),
        UnitPrice: toNumber(r.UnitPrice),
        ClaimedAmount: toNumber(r.ClaimedAmount),
        CoverageUsed: toNumber(r.CoverageUsed),
        ApprovedAmount: toNumber(r.ApprovedAmount),
        CompanyPay: toNumber(r.CompanyPay),
        EmployeePay: toNumber(r.EmployeePay),
        LineStatus: r.LineStatus,
        ClaimNotes: r.ClaimNotes,
        LineNotes: r.LineNotes,
      };
    });

    res.status(200).json(out);
  } catch (err) {
    console.error('Finance approvedLines error:', err);
    res.status(500).json({ message: err.message || 'Error fetching approved lines' });
  }
};

exports.markPaid = async (req, res) => {
  const body = req.body || {};
  const ids = Array.isArray(body.ClaimLineIds)
    ? body.ClaimLineIds
    : body.ClaimLineId !== undefined
      ? [body.ClaimLineId]
      : [];

  const claimLineIds = ids
    .map((x) => (typeof x === 'string' ? x.trim() : x))
    .filter((x) => x !== null && x !== undefined && x !== '')
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n));

  if (!claimLineIds.length) return res.status(400).json({ message: 'ClaimLineIds is required' });

  try {
    const ok = await ensurePaymentsTable();
    if (!ok) {
      return res.status(500).json({ message: 'Payments table is not available' });
    }

    const notes = body.Notes !== undefined && body.Notes !== null ? String(body.Notes).slice(0, 300) : null;
    const paidBy = req.user ? JSON.stringify(req.user) : null;

    const result = await sequelize.transaction(async (t) => {
      const existing = await ClaimLinePayments.findAll({
        where: { ClaimLineId: { [Op.in]: claimLineIds } },
        attributes: ['ClaimLineId'],
        transaction: t,
      });
      const existingSet = new Set(existing.map((e) => Number(e.ClaimLineId)));

      const rows = await sequelize.query(
        `
        SELECT cl.ClaimLineId, cl.ClaimId, cl.CompanyPay, cl.EmployeePay
        FROM ClaimLines cl
        INNER JOIN Claims c ON c.ClaimId = cl.ClaimId
        WHERE cl.ClaimLineId IN (:ids)
          AND c.Status = 'Approved'
          AND cl.LineStatus = 'Approved'
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { ids: claimLineIds },
          transaction: t,
        }
      );

      const toCreate = (rows || []).filter((r) => !existingSet.has(Number(r.ClaimLineId)));

      if (!toCreate.length) {
        return { created: 0, skipped: claimLineIds.length };
      }

      await ClaimLinePayments.bulkCreate(
        toCreate.map((r) => ({
          ClaimLineId: Number(r.ClaimLineId),
          ClaimId: Number(r.ClaimId),
          AmountCompany: r.CompanyPay,
          AmountEmployee: r.EmployeePay,
          Status: 'Paid',
          PaidAt: new Date(),
          PaidBy: paidBy,
          Notes: notes,
        })),
        { transaction: t }
      );

      return { created: toCreate.length, skipped: claimLineIds.length - toCreate.length };
    });

    // best-effort logging (outside transaction)
    try {
      for (const id of claimLineIds) {
        const line = await ClaimLines.findOne({ where: { ClaimLineId: id } });
        if (!line) continue;
        await appendClaimActivity({
          claimId: line.ClaimId,
          action: 'finance_mark_paid',
          actor: req.user,
          meta: { ClaimLineId: id, Notes: notes || undefined },
        });
      }
    } catch {
      // ignore
    }

    res.status(200).json({ message: 'Marked as paid', ...result });
  } catch (err) {
    console.error('Finance markPaid error:', err);
    res.status(500).json({ message: err.message || 'Error marking paid' });
  }
};
