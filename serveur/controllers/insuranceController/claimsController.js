const Claims = require("../../models/insurance/Claims");
const Child = require("../../models/hr/Child");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { sequelize } = require("../../models/insurance/_sequelize");
const ClaimLines = require("../../models/insurance/ClaimLines");
const InsuranceBalancePeriods = require("../../models/insurance/InsuranceBalancePeriods");
const InsuranceBalanceTransactions = require("../../models/insurance/InsuranceBalanceTransactions");
const { appendClaimActivity } = require("../../utils/claimActivityLog");

let beneficiaryColumnExistsCache = null;

const hasBeneficiaryTypeColumn = async () => {
  if (beneficiaryColumnExistsCache !== null) return beneficiaryColumnExistsCache;
  try {
    const qi = Claims.sequelize.getQueryInterface();
    const table = await qi.describeTable("Claims");
    beneficiaryColumnExistsCache = Boolean(table && table.BeneficiaryType);
  } catch (e) {
    beneficiaryColumnExistsCache = false;
  }
  return beneficiaryColumnExistsCache;
};

const normalizeBeneficiaryType = (value) => {
  if (!value) return null;
  const v = String(value).trim();
  if (!v) return null;

  // Keep the canonical set requested by user
  if (v === "موظف") return "موظف";
  if (v === "أب" || v === "اب" || v === "أَب") return "أب";
  if (v === "ابن" || v === "إبن" || v === "ولد") return "ابن";
  if (v === "زوجة" || v.includes("زوج")) return "زوجة";
  return v;
};

const beneficiaryTypeFromChild = (typeChild) => {
  const normalized = normalizeBeneficiaryType(typeChild);
  // If CHILD.type_child is something else, keep it, but prefer a sensible default
  return normalized || "ابن";
};

const generateClaimNo = async () => {
  try {
    const maxId = await Claims.max("ClaimId");
    const start = Number.isFinite(Number(maxId)) ? Number(maxId) + 1 : 1;

    for (let attempt = 0; attempt < 20; attempt++) {
      const next = start + attempt;
      const claimNo = `CLM-${String(next).padStart(6, "0")}`;
      const exists = await Claims.findOne({ where: { ClaimNo: claimNo } });
      if (!exists) return claimNo;
    }
  } catch (err) {
    console.warn("ClaimNo auto-generation failed, using timestamp fallback", err);
  }

  return `CLM-${Date.now()}`;
};

const requireAuth = (req, res, callback) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });
    req.user = decoded;
    return callback(decoded);
  });
};

exports.find = async (req, res) => {
  requireAuth(req, res, async () => {
    try {
      const where = {};
      if (req.query.Ref_emp) where.Ref_emp = String(req.query.Ref_emp);
      if (req.query.EMP_CHILD !== undefined) {
        const v = String(req.query.EMP_CHILD);
        // Support employee claims lookup: EMP_CHILD=NULL
        if (v.toUpperCase() === "NULL" || v === "" || v.toLowerCase() === "null") where.EMP_CHILD = null;
        else where.EMP_CHILD = v;
      }

      const includeBeneficiary = await hasBeneficiaryTypeColumn();
      const data = await Claims.findAll({
        where,
        ...(includeBeneficiary ? {} : { attributes: { exclude: ["BeneficiaryType"] } }),
      });
      res.json(data);
    } catch (dbErr) {
      console.error("Claims find error:", dbErr);
      res.status(500).json({ message: "Error fetching claims" });
    }
  });
};

exports.create = async (req, res) => {
  requireAuth(req, res, async () => {
    const body = req.body || {};
    if (!body.Ref_emp || !body.ClaimDate) {
      return res.status(400).json({ message: "Ref_emp and ClaimDate are required" });
    }

    try {
      const claimNo = (body.ClaimNo || "").trim() || (await generateClaimNo());
      const claimType = (body.ClaimType || "").trim() || "Medical";

      let beneficiaryType = normalizeBeneficiaryType(body.BeneficiaryType);
      if (!beneficiaryType) {
        if (body.EMP_CHILD) {
          const child = await Child.findOne({ where: { ID_CHILD: body.EMP_CHILD } });
          beneficiaryType = beneficiaryTypeFromChild(child?.type_child);
        } else {
          beneficiaryType = "موظف";
        }
      }

      const canWriteBeneficiary = await hasBeneficiaryTypeColumn();

      const payload = {
        ClaimNo: claimNo,
        Ref_emp: body.Ref_emp,
        EMP_CHILD: body.EMP_CHILD || null,
        ProviderId: body.ProviderId,
        ClaimDate: body.ClaimDate,
        SubmissionDate: body.SubmissionDate,
        ClaimType: claimType,
        Status: body.Status || "Pending",
        TotalClaimed: body.TotalClaimed !== undefined ? body.TotalClaimed : 0,
        TotalApproved: body.TotalApproved !== undefined ? body.TotalApproved : 0,
        CompanyShare: body.CompanyShare !== undefined ? body.CompanyShare : 0,
        EmployeeShare: body.EmployeeShare !== undefined ? body.EmployeeShare : 0,
        Notes: body.Notes,
        ...(canWriteBeneficiary ? { BeneficiaryType: beneficiaryType } : {}),
      };

      await Claims.create(payload);

      res.status(200).json({ message: "Claim added successfully" });
    } catch (err) {
      console.error("Claims create error:", err);
      res.status(500).json({ message: err.message || "Error creating claim" });
    }
  });
};

exports.pending = async (req, res) => {
  requireAuth(req, res, async () => {
    try {
      const where = { Status: "Pending" };
      if (req.query.Ref_emp) where.Ref_emp = String(req.query.Ref_emp);

      const includeBeneficiary = await hasBeneficiaryTypeColumn();
      const data = await Claims.findAll({
        where,
        order: [["CreatedAt", "DESC"]],
        ...(includeBeneficiary ? {} : { attributes: { exclude: ["BeneficiaryType"] } }),
      });
      res.json(data);
    } catch (dbErr) {
      console.error("Claims pending error:", dbErr);
      res.status(500).json({ message: "Error fetching pending claims" });
    }
  });
};

exports.review = async (req, res) => {
  requireAuth(req, res, async () => {
    const id = req.params.ClaimId;
    if (!id) return res.status(400).json({ message: "ClaimId is required" });

    const body = req.body || {};
    const action = String(body.action || body.Action || "").trim().toLowerCase();
    const reviewNotes = body.Notes !== undefined ? String(body.Notes) : body.notes !== undefined ? String(body.notes) : "";
    const reviewDate = String(body.ReviewDate || body.reviewDate || "").slice(0, 10);

    const needsDocsActions = new Set([
      "need_docs",
      "need-docs",
      "needdocuments",
      "need_documents",
      "request_docs",
      "request-docs",
      "requestdocuments",
      "more_docs",
      "more-docs",
    ]);

    const nextStatus =
      action === "approve"
        ? "Approved"
        : action === "reject"
          ? "Rejected"
          : needsDocsActions.has(action)
            ? "NeedDocuments"
            : null;
    if (!nextStatus) {
      return res.status(400).json({ message: "Invalid action. Use 'approve', 'reject', or 'need_docs'" });
    }

    const d = reviewDate || new Date().toISOString().slice(0, 10);

    try {
      const includeBeneficiary = await hasBeneficiaryTypeColumn();

      await sequelize.transaction(async (t) => {
        const record = await Claims.findOne({
          where: { ClaimId: id },
          transaction: t,
          ...(includeBeneficiary ? {} : { attributes: { exclude: ["BeneficiaryType"] } }),
        });
        if (!record) {
          const e = new Error("Claim not found");
          e.statusCode = 404;
          throw e;
        }

        if (String(record.Status || "").trim() !== "Pending") {
          const e = new Error("Only Pending claims can be reviewed");
          e.statusCode = 400;
          throw e;
        }

        const existingNotes = record.Notes ? String(record.Notes).trim() : "";
        const nextNotes = reviewNotes
          ? existingNotes
            ? `${existingNotes}\n${reviewNotes}`
            : reviewNotes
          : existingNotes;

        const claimDate = String(record.ClaimDate).slice(0, 10);
        const refEmp = String(record.Ref_emp || "").trim();
        if (!refEmp) {
          const e = new Error("Claim Ref_emp is missing");
          e.statusCode = 400;
          throw e;
        }

        const lines = await ClaimLines.findAll({ where: { ClaimId: id }, transaction: t });

        // Update claim totals from lines (for reporting)
        const totalClaimed = lines.reduce((acc, ln) => {
          const qty = Number(ln.Qty ?? 0);
          const unitPrice = Number(ln.UnitPrice ?? 0);
          const v = (Number.isFinite(qty) ? qty : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0);
          return acc + v;
        }, 0);

        const totalCompany = lines.reduce((acc, ln) => {
          const v = Number(ln.CompanyPay ?? ln.ApprovedAmount ?? 0);
          return acc + (Number.isFinite(v) ? v : 0);
        }, 0);

        const totalEmployee = lines.reduce((acc, ln) => {
          const v = Number(ln.EmployeePay ?? 0);
          return acc + (Number.isFinite(v) ? v : 0);
        }, 0);

        if (nextStatus === "Approved") {
          // Match period by ClaimDate (no auto period creation)
          const periods = await InsuranceBalancePeriods.findAll({
            where: {
              Ref_emp: refEmp,
              IsActive: true,
              ValidFrom: { [Op.lte]: claimDate },
              ValidTo: { [Op.gte]: claimDate },
            },
            order: [["ValidFrom", "ASC"]],
            transaction: t,
          });

          if (periods.length !== 1) {
            const msg =
              periods.length === 0
                ? "No active balance period found for this employee on ClaimDate"
                : "Multiple active balance periods match this ClaimDate";
            const e = new Error(msg);
            e.statusCode = 400;
            throw e;
          }
          const period = periods[0];

          // Idempotency guard: if there are already debit txns for these claim lines, skip creating them again
          const existing = await InsuranceBalanceTransactions.findAll({
            attributes: ["ClaimLineId"],
            where: { ClaimId: id, TxnType: "DEBIT", Source: "CLAIM_LINE" },
            transaction: t,
          });
          const existingLineIds = new Set(existing.map((r) => String(r.ClaimLineId)));

          // Balance check at approval time (only on new txns we are about to create)
          const toCreate = lines
            .filter((ln) => {
              const companyPay = Number(ln.CompanyPay ?? ln.ApprovedAmount ?? 0);
              return companyPay > 0 && !existingLineIds.has(String(ln.ClaimLineId));
            })
            .map((ln) => ({
              ln,
              companyPay: Number(ln.CompanyPay ?? ln.ApprovedAmount ?? 0),
              qty: Number(ln.Qty ?? 0),
              unitPrice: Number(ln.UnitPrice ?? 0),
              coverage: Number(ln.CoverageUsed ?? 0),
            }))
            .filter((x) => Number.isFinite(x.companyPay) && x.companyPay > 0);

          const debitTotal = toCreate.reduce((acc, x) => acc + x.companyPay, 0);
          if (debitTotal > 0) {
            const sum = await InsuranceBalanceTransactions.sum("Amount", {
              where: { BalancePeriodId: period.BalancePeriodId },
              transaction: t,
            });
            const available = sum === null || sum === undefined ? 0 : Number(sum);
            const safeAvailable = Number.isFinite(available) ? available : 0;
            if (safeAvailable < debitTotal) {
              const e = new Error("Insufficient balance to approve this claim");
              e.statusCode = 400;
              throw e;
            }

            for (const x of toCreate) {
              const claimed = Math.round(x.qty * x.unitPrice * 100) / 100;
              await InsuranceBalanceTransactions.create(
                {
                  BalancePeriodId: period.BalancePeriodId,
                  Ref_emp: refEmp,
                  TxnType: "DEBIT",
                  Amount: -Math.abs(x.companyPay),
                  EffectiveDate: claimDate,
                  Source: "CLAIM_LINE",
                  ClaimId: record.ClaimId,
                  ClaimLineId: x.ln.ClaimLineId,
                  ServiceId: x.ln.ServiceId,
                  CoveragePercent: Number.isFinite(x.coverage) ? x.coverage : null,
                  Qty: Number.isFinite(x.qty) ? x.qty : null,
                  UnitPrice: Number.isFinite(x.unitPrice) ? x.unitPrice : null,
                  ClaimedAmount: Number.isFinite(claimed) ? claimed : null,
                  CoveredAmount: x.companyPay,
                  Notes: nextNotes,
                },
                { transaction: t }
              );
            }
          }

          await ClaimLines.update(
            { LineStatus: "Approved" },
            { where: { ClaimId: id }, transaction: t }
          );
        } else if (nextStatus === "Rejected") {
          await ClaimLines.update(
            { LineStatus: "Rejected" },
            { where: { ClaimId: id }, transaction: t }
          );
        } else if (nextStatus === "NeedDocuments") {
          // Do not change line statuses; requester wants additional documents.
        }

        await record.update(
          {
            Status: nextStatus,
            Notes: nextNotes,
            SubmissionDate: d,
            TotalClaimed: Math.round(totalClaimed * 100) / 100,
            TotalApproved: Math.round(totalCompany * 100) / 100,
            CompanyShare: Math.round(totalCompany * 100) / 100,
            EmployeeShare: Math.round(totalEmployee * 100) / 100,
          },
          { transaction: t }
        );
      });

      res.status(200).json({ message: `Claim ${nextStatus}` });

      appendClaimActivity({
        claimId: id,
        action: "claim_review",
        actor: req.user,
        meta: {
          requestedAction: action,
          statusTo: nextStatus,
          reviewDate: d,
          notesProvided: Boolean(String(reviewNotes || "").trim()),
        },
      }).catch(() => undefined);
    } catch (err) {
      console.error("Claims review error:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ message: err.message || "Error reviewing claim" });
    }
  });
};

exports.update = async (req, res) => {
  requireAuth(req, res, async () => {
    const id = req.params.ClaimId;
    if (!id) return res.status(400).json({ message: "ClaimId is required" });
    const body = req.body || {};

    try {
      const includeBeneficiary = await hasBeneficiaryTypeColumn();
      const record = await Claims.findOne({
        where: { ClaimId: id },
        ...(includeBeneficiary ? {} : { attributes: { exclude: ["BeneficiaryType"] } }),
      });
      if (!record) return res.status(404).json({ message: "Claim not found" });

      const canWriteBeneficiary = includeBeneficiary;
      const beneficiaryType = normalizeBeneficiaryType(body.BeneficiaryType);

      await record.update({
        ClaimNo: body.ClaimNo,
        Ref_emp: body.Ref_emp,
        EMP_CHILD: body.EMP_CHILD,
        ProviderId: body.ProviderId,
        ClaimDate: body.ClaimDate,
        SubmissionDate: body.SubmissionDate,
        ClaimType: body.ClaimType,
        ...(canWriteBeneficiary && body.BeneficiaryType !== undefined ? { BeneficiaryType: beneficiaryType } : {}),
        Status: body.Status,
        TotalClaimed: body.TotalClaimed,
        TotalApproved: body.TotalApproved,
        CompanyShare: body.CompanyShare,
        EmployeeShare: body.EmployeeShare,
        Notes: body.Notes,
      });

      res.status(200).json({ message: "Claim updated successfully" });
    } catch (err) {
      console.error("Claims update error:", err);
      res.status(500).json({ message: err.message || "Error updating claim" });
    }
  });
};

exports.delete = async (req, res) => {
  requireAuth(req, res, async () => {
    const id = req.params.ClaimId;
    if (!id) return res.status(400).json({ message: "ClaimId is required" });

    try {
      const includeBeneficiary = await hasBeneficiaryTypeColumn();
      const record = await Claims.findOne({
        where: { ClaimId: id },
        ...(includeBeneficiary ? {} : { attributes: { exclude: ["BeneficiaryType"] } }),
      });
      if (!record) return res.status(404).json({ message: "Claim not found" });
      await record.destroy();
      res.status(200).json({ message: "Claim deleted successfully" });
    } catch (err) {
      console.error("Claims delete error:", err);
      res.status(500).json({ message: err.message || "Error deleting claim" });
    }
  });
};
