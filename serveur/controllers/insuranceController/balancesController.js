const { Op, Sequelize: SequelizeLib } = require("sequelize");

const { sequelize } = require("../../models/insurance/_sequelize");
const InsuranceBalancePeriods = require("../../models/insurance/InsuranceBalancePeriods");
const InsuranceBalanceTransactions = require("../../models/insurance/InsuranceBalanceTransactions");
const InsuranceBalanceTransfers = require("../../models/insurance/InsuranceBalanceTransfers");

const Employee = require("../../models/hr/employee");

const Claims = require("../../models/insurance/Claims");
const Services = require("../../models/insurance/Services");

const todayIso = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toNumber = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

async function findPeriodForDate(refEmp, dateIso, transaction) {
  const periods = await InsuranceBalancePeriods.findAll({
    where: {
      Ref_emp: refEmp,
      IsActive: true,
      ValidFrom: { [Op.lte]: dateIso },
      ValidTo: { [Op.gte]: dateIso },
    },
    order: [["ValidFrom", "ASC"]],
    transaction,
  });

  if (periods.length !== 1) return { period: null, count: periods.length };
  return { period: periods[0], count: 1 };
}

async function getAvailableBalanceInPeriod(balancePeriodId, transaction) {
  const sum = await InsuranceBalanceTransactions.sum("Amount", {
    where: { BalancePeriodId: balancePeriodId },
    transaction,
  });
  const n = toNumber(sum);
  return n === null ? 0 : n;
}

exports.transactionsFind = async (req, res) => {
  const refEmp = req.query.Ref_emp ? String(req.query.Ref_emp).trim() : "";
  const source = req.query.Source ? String(req.query.Source).trim() : "";

  if (!refEmp) return res.status(400).json({ message: "Ref_emp is required" });

  try {
    const where = { Ref_emp: refEmp };
    if (source) where.Source = source;

    const rows = await InsuranceBalanceTransactions.findAll({
      where,
      order: [
        ["EffectiveDate", "DESC"],
        ["TxnDate", "DESC"],
        ["TxnId", "DESC"],
      ],
    });

    res.status(200).json(rows);
  } catch (err) {
    console.error("Transactions find error:", err);
    res.status(500).json({ message: err.message || "Error fetching transactions" });
  }
};

exports.transactionsUpdate = async (req, res) => {
  const id = req.params.TxnId;
  const body = req.body || {};
  if (!id) return res.status(400).json({ message: "TxnId is required" });

  try {
    const result = await sequelize.transaction(async (t) => {
      const record = await InsuranceBalanceTransactions.findOne({ where: { TxnId: id }, transaction: t });
      if (!record) {
        const e = new Error("Transaction not found");
        e.statusCode = 404;
        throw e;
      }

      if (record.Source !== "RECHARGE") {
        const e = new Error("Only RECHARGE transactions can be edited");
        e.statusCode = 400;
        throw e;
      }

      const refEmp = String(record.Ref_emp);
      const nextEffectiveDate = body.EffectiveDate !== undefined ? String(body.EffectiveDate) : String(record.EffectiveDate);
      const nextNotes = body.Notes !== undefined ? body.Notes : record.Notes;

      const nextAmountNum = body.Amount !== undefined ? toNumber(body.Amount) : toNumber(record.Amount);
      if (nextAmountNum === null || nextAmountNum <= 0) {
        const e = new Error("Amount must be > 0");
        e.statusCode = 400;
        throw e;
      }
      const nextAmount = round2(Math.abs(nextAmountNum));

      // Find target period based on effective date
      const { period: targetPeriod, count } = await findPeriodForDate(refEmp, nextEffectiveDate, t);
      if (!targetPeriod) {
        const e = new Error(
          count === 0
            ? "No active period found for this effective date"
            : "Multiple active periods match this effective date"
        );
        e.statusCode = 400;
        throw e;
      }

      const oldPeriodId = record.BalancePeriodId;
      const oldAmount = round2(Math.abs(toNumber(record.Amount) || 0));

      if (String(targetPeriod.BalancePeriodId) === String(oldPeriodId)) {
        // Same period: ensure balance stays non-negative after changing amount
        const current = await getAvailableBalanceInPeriod(oldPeriodId, t);
        const newBalance = round2(current - oldAmount + nextAmount);
        if (newBalance < 0) {
          const e = new Error("Update would make balance negative");
          e.statusCode = 400;
          throw e;
        }
      } else {
        // Period changed: ensure old period won't go negative after removing the old credit
        const oldBalance = await getAvailableBalanceInPeriod(oldPeriodId, t);
        const afterRemove = round2(oldBalance - oldAmount);
        if (afterRemove < 0) {
          const e = new Error("Cannot move this recharge: old period would become negative");
          e.statusCode = 400;
          throw e;
        }
      }

      await record.update(
        {
          BalancePeriodId: targetPeriod.BalancePeriodId,
          EffectiveDate: nextEffectiveDate,
          Amount: nextAmount,
          TxnType: "CREDIT",
          Notes: nextNotes,
        },
        { transaction: t }
      );

      const updatedBalance = await getAvailableBalanceInPeriod(record.BalancePeriodId, t);
      return { record, balance: updatedBalance };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Transactions update error:", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Error updating transaction" });
  }
};

exports.transactionsDelete = async (req, res) => {
  const id = req.params.TxnId;
  if (!id) return res.status(400).json({ message: "TxnId is required" });

  try {
    const result = await sequelize.transaction(async (t) => {
      const record = await InsuranceBalanceTransactions.findOne({ where: { TxnId: id }, transaction: t });
      if (!record) {
        const e = new Error("Transaction not found");
        e.statusCode = 404;
        throw e;
      }

      if (record.Source !== "RECHARGE") {
        const e = new Error("Only RECHARGE transactions can be deleted");
        e.statusCode = 400;
        throw e;
      }

      const periodId = record.BalancePeriodId;
      const amount = round2(Math.abs(toNumber(record.Amount) || 0));
      const current = await getAvailableBalanceInPeriod(periodId, t);
      const newBalance = round2(current - amount);
      if (newBalance < 0) {
        const e = new Error("Delete would make balance negative");
        e.statusCode = 400;
        throw e;
      }

      await record.destroy({ transaction: t });
      return { message: "Recharge deleted", balance: newBalance };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Transactions delete error:", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Error deleting transaction" });
  }
};

exports.periodsFind = async (req, res) => {
  try {
    const where = {};
    if (req.query.Ref_emp) where.Ref_emp = String(req.query.Ref_emp);
    const data = await InsuranceBalancePeriods.findAll({
      where,
      order: [
        ["Ref_emp", "ASC"],
        ["ValidFrom", "DESC"],
      ],
    });
    res.json(data);
  } catch (err) {
    console.error("InsuranceBalancePeriods find error:", err);
    res.status(500).json({ message: "Error fetching balance periods" });
  }
};

exports.transfersFind = async (req, res) => {
  const refEmp = req.query.Ref_emp ? String(req.query.Ref_emp).trim() : '';

  try {
    const where = {};
    if (refEmp) {
      where[Op.or] = [{ FromRef_emp: refEmp }, { ToRef_emp: refEmp }];
    }

    const transfers = await InsuranceBalanceTransfers.findAll({
      where,
      order: [
        ['EffectiveDate', 'DESC'],
        ['CreatedAt', 'DESC'],
        ['TransferId', 'DESC'],
      ],
      limit: 200,
    });

    const refs = Array.from(
      new Set(
        transfers
          .flatMap((t) => [t.FromRef_emp, t.ToRef_emp])
          .map((v) => (v === null || v === undefined ? '' : String(v).trim()))
          .filter(Boolean)
      )
    );

    const employees = refs.length
      ? await Employee.findAll({ where: { Ref_emp: { [Op.in]: refs } }, attributes: ['Ref_emp', 'NAME'] })
      : [];
    const nameByRef = new Map(employees.map((e) => [String(e.Ref_emp || '').trim(), e.NAME]));

    const out = transfers.map((t) => {
      const fromRef = String(t.FromRef_emp || '').trim();
      const toRef = String(t.ToRef_emp || '').trim();
      return {
        TransferId: t.TransferId,
        FromRef_emp: t.FromRef_emp,
        FromName: nameByRef.get(fromRef) || null,
        ToRef_emp: t.ToRef_emp,
        ToName: nameByRef.get(toRef) || null,
        Amount: toNumber(t.Amount) ?? 0,
        EffectiveDate: t.EffectiveDate,
        Notes: t.Notes,
        CreatedAt: t.CreatedAt,
      };
    });

    res.status(200).json(out);
  } catch (err) {
    console.error('Transfers find error:', err);
    res.status(500).json({ message: err.message || 'Error fetching transfers' });
  }
};

exports.periodsDistinct = async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT PeriodName, ValidFrom, ValidTo
       FROM dbo.InsuranceBalancePeriods
       WHERE IsActive = 1
       GROUP BY PeriodName, ValidFrom, ValidTo
       ORDER BY ValidFrom DESC, ValidTo DESC`
    );
    res.status(200).json(rows || []);
  } catch (err) {
    console.error("InsuranceBalancePeriods distinct error:", err);
    res.status(500).json({ message: err.message || "Error fetching distinct periods" });
  }
};

exports.periodsBulkCreate = async (req, res) => {
  const body = req.body || {};
  const validFrom = String(body.ValidFrom || "").slice(0, 10);
  const validTo = String(body.ValidTo || "").slice(0, 10);
  const periodName = body.PeriodName || null;
  const currencyCode = body.CurrencyCode || "LYD";
  const notes = body.Notes || null;

  if (!validFrom || !validTo) {
    return res.status(400).json({ message: "ValidFrom and ValidTo are required" });
  }
  if (validFrom > validTo) {
    return res.status(400).json({ message: "ValidFrom must be <= ValidTo" });
  }

  try {
    const employees = await Employee.findAll({
      where: {
        STATE: true,
        [Op.and]: [
          SequelizeLib.where(SequelizeLib.cast(SequelizeLib.col("Ref_emp"), "BIGINT"), { [Op.gt]: 0 }),
        ],
      },
      attributes: ["Ref_emp"],
      order: [[SequelizeLib.cast(SequelizeLib.col("Ref_emp"), "BIGINT"), "ASC"]],
    });

    const refEmps = (employees || [])
      .map((e) => String(e?.get ? e.get("Ref_emp") : e.Ref_emp || "").trim())
      .filter((v) => v);

    if (!refEmps.length) {
      return res.status(400).json({ message: "No eligible employees found" });
    }

    const createdIds = [];
    const skipped = [];

    for (const refEmp of refEmps) {
      try {
        const overlap = await InsuranceBalancePeriods.findOne({
          where: {
            Ref_emp: refEmp,
            IsActive: true,
            [Op.and]: [{ ValidFrom: { [Op.lte]: validTo } }, { ValidTo: { [Op.gte]: validFrom } }],
          },
        });

        if (overlap) {
          skipped.push({ Ref_emp: refEmp, reason: "Overlapping active period exists" });
          continue;
        }

        const created = await InsuranceBalancePeriods.create({
          Ref_emp: refEmp,
          PeriodName: periodName,
          ValidFrom: validFrom,
          ValidTo: validTo,
          CurrencyCode: currencyCode,
          IsActive: true,
          Notes: notes,
        });
        createdIds.push(created.BalancePeriodId);
      } catch (e) {
        console.error("Bulk period create error:", e);
        skipped.push({ Ref_emp: refEmp, reason: e.message || "Failed to create period" });
      }
    }

    return res.status(200).json({
      requested: refEmps.length,
      created: createdIds.length,
      skippedCount: skipped.length,
      skipped,
      period: { PeriodName: periodName, ValidFrom: validFrom, ValidTo: validTo },
    });
  } catch (err) {
    console.error("Bulk periods create error:", err);
    return res.status(500).json({ message: err.message || "Bulk periods create failed" });
  }
};

exports.periodsCreate = async (req, res) => {
  const body = req.body || {};
  const refEmp = String(body.Ref_emp || "").trim();
  const validFrom = body.ValidFrom;
  const validTo = body.ValidTo;

  if (!refEmp || !validFrom || !validTo) {
    return res.status(400).json({ message: "Ref_emp, ValidFrom, and ValidTo are required" });
  }

  if (String(validFrom) > String(validTo)) {
    return res.status(400).json({ message: "ValidFrom must be <= ValidTo" });
  }

  try {
    // Prevent overlapping active periods per employee to guarantee unique match.
    const overlap = await InsuranceBalancePeriods.findOne({
      where: {
        Ref_emp: refEmp,
        IsActive: true,
        [Op.and]: [{ ValidFrom: { [Op.lte]: validTo } }, { ValidTo: { [Op.gte]: validFrom } }],
      },
    });
    if (overlap) {
      return res.status(400).json({
        message: "Overlapping active period exists for this employee",
      });
    }

    const created = await InsuranceBalancePeriods.create({
      Ref_emp: refEmp,
      PeriodName: body.PeriodName,
      ValidFrom: validFrom,
      ValidTo: validTo,
      CurrencyCode: body.CurrencyCode || "LYD",
      IsActive: body.IsActive !== undefined ? !!body.IsActive : true,
      Notes: body.Notes,
    });

    res.status(200).json(created);
  } catch (err) {
    console.error("InsuranceBalancePeriods create error:", err);
    res.status(500).json({ message: err.message || "Error creating balance period" });
  }
};

exports.periodsUpdate = async (req, res) => {
  const id = req.params.BalancePeriodId;
  const body = req.body || {};
  if (!id) return res.status(400).json({ message: "BalancePeriodId is required" });

  try {
    const record = await InsuranceBalancePeriods.findOne({ where: { BalancePeriodId: id } });
    if (!record) return res.status(404).json({ message: "Balance period not found" });

    const next = {
      PeriodName: body.PeriodName,
      ValidFrom: body.ValidFrom,
      ValidTo: body.ValidTo,
      CurrencyCode: body.CurrencyCode,
      IsActive: body.IsActive,
      Notes: body.Notes,
    };

    const validFrom = next.ValidFrom ?? record.ValidFrom;
    const validTo = next.ValidTo ?? record.ValidTo;
    if (String(validFrom) > String(validTo)) {
      return res.status(400).json({ message: "ValidFrom must be <= ValidTo" });
    }

    // Check overlap if date range/active/ref changes
    const refEmp = String(body.Ref_emp ?? record.Ref_emp);
    const isActive = body.IsActive !== undefined ? !!body.IsActive : !!record.IsActive;

    if (isActive) {
      const overlap = await InsuranceBalancePeriods.findOne({
        where: {
          BalancePeriodId: { [Op.ne]: id },
          Ref_emp: refEmp,
          IsActive: true,
          [Op.and]: [{ ValidFrom: { [Op.lte]: validTo } }, { ValidTo: { [Op.gte]: validFrom } }],
        },
      });
      if (overlap) {
        return res.status(400).json({ message: "Overlapping active period exists for this employee" });
      }
    }

    await record.update({
      Ref_emp: refEmp,
      ...next,
    });

    res.status(200).json(record);
  } catch (err) {
    console.error("InsuranceBalancePeriods update error:", err);
    res.status(500).json({ message: err.message || "Error updating balance period" });
  }
};

exports.periodsDelete = async (req, res) => {
  const id = req.params.BalancePeriodId;
  if (!id) return res.status(400).json({ message: "BalancePeriodId is required" });

  try {
    const record = await InsuranceBalancePeriods.findOne({ where: { BalancePeriodId: id } });
    if (!record) return res.status(404).json({ message: "Balance period not found" });

    // Safer than physical delete when transactions may exist.
    await record.update({ IsActive: false });
    res.status(200).json({ message: "Balance period deactivated successfully" });
  } catch (err) {
    console.error("InsuranceBalancePeriods delete error:", err);
    res.status(500).json({ message: err.message || "Error deleting balance period" });
  }
};

exports.getBalance = async (req, res) => {
  const refEmp = String(req.query.Ref_emp || "").trim();
  const dateIso = String(req.query.date || todayIso());
  if (!refEmp) return res.status(400).json({ message: "Ref_emp is required" });

  try {
    const { period, count } = await findPeriodForDate(refEmp, dateIso);
    if (!period) {
      return res.status(200).json({
        Ref_emp: refEmp,
        date: dateIso,
        periodMatchCount: count,
        BalancePeriodId: null,
        balance: 0,
        message:
          count === 0
            ? "No active period found for this date"
            : "Multiple active periods match this date",
      });
    }

    const balance = await getAvailableBalanceInPeriod(period.BalancePeriodId);
    res.status(200).json({
      Ref_emp: refEmp,
      date: dateIso,
      BalancePeriodId: period.BalancePeriodId,
      balance,
      period,
    });
  } catch (err) {
    console.error("Get balance error:", err);
    res.status(500).json({ message: err.message || "Error fetching balance" });
  }
};

exports.recharge = async (req, res) => {
  const body = req.body || {};
  const refEmp = String(body.Ref_emp || "").trim();
  const effectiveDate = String(body.EffectiveDate || "").trim();
  const balancePeriodId = body.BalancePeriodId !== undefined && body.BalancePeriodId !== null ? toNumber(body.BalancePeriodId) : null;
  const amount = toNumber(body.Amount);

  if (!refEmp || amount === null) {
    return res.status(400).json({ message: "Ref_emp and Amount are required" });
  }
  if (amount <= 0) return res.status(400).json({ message: "Amount must be > 0" });

  try {
    const result = await sequelize.transaction(async (t) => {
      let period;
      let resolvedEffectiveDate;

      if (balancePeriodId !== null) {
        if (!Number.isFinite(balancePeriodId)) {
          throw new Error("BalancePeriodId must be a number");
        }

        period = await InsuranceBalancePeriods.findOne({
          where: { BalancePeriodId: balancePeriodId, Ref_emp: refEmp, IsActive: true },
          transaction: t,
        });
        if (!period) {
          throw new Error("Selected period not found or inactive");
        }

        const fromIso = String(period.ValidFrom || "").slice(0, 10);
        const toIso = String(period.ValidTo || "").slice(0, 10);

        resolvedEffectiveDate = effectiveDate || fromIso;
        if (resolvedEffectiveDate < fromIso || resolvedEffectiveDate > toIso) {
          throw new Error("EffectiveDate must be within selected period");
        }
      } else {
        resolvedEffectiveDate = effectiveDate || todayIso();

        const match = await findPeriodForDate(refEmp, resolvedEffectiveDate, t);
        period = match.period;
        if (!period) {
          throw new Error(
            match.count === 0
              ? "No active period found for this effective date"
              : "Multiple active periods match this effective date"
          );
        }
      }

      const created = await InsuranceBalanceTransactions.create(
        {
          BalancePeriodId: period.BalancePeriodId,
          Ref_emp: refEmp,
          TxnType: "CREDIT",
          Amount: round2(Math.abs(amount)),
          EffectiveDate: resolvedEffectiveDate,
          Source: "RECHARGE",
          Notes: body.Notes,
        },
        { transaction: t }
      );

      const balance = await getAvailableBalanceInPeriod(period.BalancePeriodId, t);

      return { created, balance, period };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Recharge error:", err);
    res.status(400).json({ message: err.message || "Recharge failed" });
  }
};

exports.rechargeBulk = async (req, res) => {
  const body = req.body || {};
  const refEmpsRaw = Array.isArray(body.Ref_emps) ? body.Ref_emps : null;
  let refEmps = refEmpsRaw
    ? refEmpsRaw.map((v) => String(v || "").trim()).filter((v) => v)
    : [];

  const validFrom = String(body.ValidFrom || "").slice(0, 10);
  const validTo = String(body.ValidTo || "").slice(0, 10);
  const amount = toNumber(body.Amount);
  const notes = body.Notes;

  if (!validFrom || !validTo) return res.status(400).json({ message: "ValidFrom and ValidTo are required" });
  if (validFrom > validTo) return res.status(400).json({ message: "ValidFrom must be <= ValidTo" });
  if (amount === null) return res.status(400).json({ message: "Amount is required" });
  if (amount <= 0) return res.status(400).json({ message: "Amount must be > 0" });

  const requestedEffectiveDate = String(body.EffectiveDate || "").slice(0, 10);
  const effectiveDate = requestedEffectiveDate || validFrom;
  if (effectiveDate < validFrom || effectiveDate > validTo) {
    return res.status(400).json({ message: "EffectiveDate must be within selected period" });
  }

  try {
    if (!refEmps.length) {
      const employees = await Employee.findAll({
        where: {
          STATE: true,
          [Op.and]: [
            SequelizeLib.where(SequelizeLib.cast(SequelizeLib.col("Ref_emp"), "BIGINT"), { [Op.gt]: 0 }),
          ],
        },
        attributes: ["Ref_emp"],
        order: [[SequelizeLib.cast(SequelizeLib.col("Ref_emp"), "BIGINT"), "ASC"]],
      });
      refEmps = (employees || [])
        .map((e) => String(e?.get ? e.get("Ref_emp") : e.Ref_emp || "").trim())
        .filter((v) => v);
    }

    if (!refEmps.length) {
      return res.status(400).json({ message: "No eligible employees found" });
    }

    const skipped = [];
    const createdTxnIds = [];

    for (const refEmp of refEmps) {
      const period = await InsuranceBalancePeriods.findOne({
        where: {
          Ref_emp: refEmp,
          IsActive: true,
          ValidFrom: validFrom,
          ValidTo: validTo,
        },
      });

      if (!period) {
        skipped.push({ Ref_emp: refEmp, reason: "No matching active period" });
        continue;
      }

      try {
        const created = await InsuranceBalanceTransactions.create({
          BalancePeriodId: period.BalancePeriodId,
          Ref_emp: refEmp,
          TxnType: "CREDIT",
          Amount: round2(Math.abs(amount)),
          EffectiveDate: effectiveDate,
          Source: "RECHARGE",
          Notes: notes,
        });
        createdTxnIds.push(created.TxnId);
      } catch (e) {
        console.error("Bulk recharge create txn error:", e);
        skipped.push({ Ref_emp: refEmp, reason: e.message || "Failed to create transaction" });
      }
    }

    res.status(200).json({
      requested: refEmps.length,
      created: createdTxnIds.length,
      skippedCount: skipped.length,
      skipped,
      effectiveDate,
      period: { ValidFrom: validFrom, ValidTo: validTo },
    });
  } catch (err) {
    console.error("Bulk recharge error:", err);
    res.status(500).json({ message: err.message || "Bulk recharge failed" });
  }
};

exports.transfer = async (req, res) => {
  const body = req.body || {};
  const fromRef = String(body.FromRef_emp || "").trim();
  const toRef = String(body.ToRef_emp || "").trim();
  const effectiveDate = String(body.EffectiveDate || todayIso());
  const amount = toNumber(body.Amount);

  if (!fromRef || !toRef || amount === null) {
    return res.status(400).json({ message: "FromRef_emp, ToRef_emp and Amount are required" });
  }
  if (fromRef === toRef) return res.status(400).json({ message: "Cannot transfer to same employee" });
  if (amount <= 0) return res.status(400).json({ message: "Amount must be > 0" });

  try {
    const result = await sequelize.transaction(async (t) => {
      const { period: fromPeriod, count: fromCount } = await findPeriodForDate(fromRef, effectiveDate, t);
      if (!fromPeriod) {
        throw new Error(
          fromCount === 0
            ? "Sender has no active period for this date"
            : "Sender has multiple active periods for this date"
        );
      }
      const { period: toPeriod, count: toCount } = await findPeriodForDate(toRef, effectiveDate, t);
      if (!toPeriod) {
        throw new Error(
          toCount === 0
            ? "Receiver has no active period for this date"
            : "Receiver has multiple active periods for this date"
        );
      }

      const fromBalance = await getAvailableBalanceInPeriod(fromPeriod.BalancePeriodId, t);
      const amt = round2(Math.abs(amount));
      if (fromBalance < amt) {
        throw new Error("Insufficient balance for transfer");
      }

      const transferRow = await InsuranceBalanceTransfers.create(
        {
          FromRef_emp: fromRef,
          ToRef_emp: toRef,
          Amount: amt,
          EffectiveDate: effectiveDate,
          Notes: body.Notes,
        },
        { transaction: t }
      );

      const debit = await InsuranceBalanceTransactions.create(
        {
          BalancePeriodId: fromPeriod.BalancePeriodId,
          Ref_emp: fromRef,
          TxnType: "DEBIT",
          Amount: -amt,
          EffectiveDate: effectiveDate,
          Source: "TRANSFER",
          TransferId: transferRow.TransferId,
          CounterpartyRef_emp: toRef,
          Notes: body.Notes,
        },
        { transaction: t }
      );

      const credit = await InsuranceBalanceTransactions.create(
        {
          BalancePeriodId: toPeriod.BalancePeriodId,
          Ref_emp: toRef,
          TxnType: "CREDIT",
          Amount: amt,
          EffectiveDate: effectiveDate,
          Source: "TRANSFER",
          TransferId: transferRow.TransferId,
          CounterpartyRef_emp: fromRef,
          Notes: body.Notes,
        },
        { transaction: t }
      );

      const updatedFromBalance = await getAvailableBalanceInPeriod(fromPeriod.BalancePeriodId, t);
      const updatedToBalance = await getAvailableBalanceInPeriod(toPeriod.BalancePeriodId, t);

      return {
        transfer: transferRow,
        debitTxn: debit,
        creditTxn: credit,
        balances: {
          from: updatedFromBalance,
          to: updatedToBalance,
        },
        periods: {
          from: fromPeriod,
          to: toPeriod,
        },
      };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Transfer error:", err);
    res.status(400).json({ message: err.message || "Transfer failed" });
  }
};

exports.statement = async (req, res) => {
  const refEmp = String(req.query.Ref_emp || "").trim();
  const fromDate = req.query.from ? String(req.query.from) : null;
  const toDate = req.query.to ? String(req.query.to) : null;

  if (!refEmp) return res.status(400).json({ message: "Ref_emp is required" });

  try {
    const where = { Ref_emp: refEmp };
    if (fromDate) where.EffectiveDate = { ...(where.EffectiveDate || {}), [Op.gte]: fromDate };
    if (toDate) where.EffectiveDate = { ...(where.EffectiveDate || {}), [Op.lte]: toDate };

    // opening balance (sum before fromDate)
    let openingBalance = 0;
    if (fromDate) {
      const openingSum = await InsuranceBalanceTransactions.sum("Amount", {
        where: { Ref_emp: refEmp, EffectiveDate: { [Op.lt]: fromDate } },
      });
      openingBalance = toNumber(openingSum) || 0;
    }

    const txns = await InsuranceBalanceTransactions.findAll({
      where,
      order: [
        ["EffectiveDate", "ASC"],
        ["TxnDate", "ASC"],
        ["TxnId", "ASC"],
      ],
    });

    const claimIds = Array.from(new Set(txns.map((t) => t.ClaimId).filter((x) => x)));
    const serviceIds = Array.from(new Set(txns.map((t) => t.ServiceId).filter((x) => x)));

    const claims = claimIds.length
      ? await Claims.findAll({ where: { ClaimId: { [Op.in]: claimIds } } })
      : [];
    const services = serviceIds.length
      ? await Services.findAll({ where: { ServiceId: { [Op.in]: serviceIds } } })
      : [];

    const claimsMap = new Map(claims.map((c) => [String(c.ClaimId), c]));
    const servicesMap = new Map(services.map((s) => [String(s.ServiceId), s]));

    let running = openingBalance;
    const rows = txns.map((t) => {
      const amt = toNumber(t.Amount) || 0;
      running = round2(running + amt);

      const claim = t.ClaimId ? claimsMap.get(String(t.ClaimId)) : null;
      const service = t.ServiceId ? servicesMap.get(String(t.ServiceId)) : null;

      return {
        ...t.toJSON(),
        ClaimNo: claim ? claim.ClaimNo : null,
        ServiceName: service ? service.ServiceName : null,
        runningBalance: running,
      };
    });

    res.status(200).json({
      Ref_emp: refEmp,
      from: fromDate,
      to: toDate,
      openingBalance: round2(openingBalance),
      rows,
    });
  } catch (err) {
    console.error("Statement error:", err);
    res.status(500).json({ message: err.message || "Error generating statement" });
  }
};
