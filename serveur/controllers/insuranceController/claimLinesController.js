const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");

const { sequelize } = require("../../models/insurance/_sequelize");
const ClaimLines = require("../../models/insurance/ClaimLines");
const Claims = require("../../models/insurance/Claims");
const Services = require("../../models/insurance/Services");
const InsuranceBalancePeriods = require("../../models/insurance/InsuranceBalancePeriods");
const InsuranceBalanceTransactions = require("../../models/insurance/InsuranceBalanceTransactions");
const { appendClaimActivity } = require("../../utils/claimActivityLog");

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
      if (req.query.ClaimId) where.ClaimId = req.query.ClaimId;
      const data = await ClaimLines.findAll({ where });
      res.json(data);
    } catch (dbErr) {
      console.error("ClaimLines find error:", dbErr);
      res.status(500).json({ message: "Error fetching claim lines" });
    }
  });
};

exports.create = async (req, res) => {
  requireAuth(req, res, async () => {
    const body = req.body || {};
    if (!body.ClaimId || !body.ServiceId) {
      return res.status(400).json({ message: "ClaimId and ServiceId are required" });
    }

    try {
      const result = await sequelize.transaction(async (t) => {
        const claim = await Claims.findOne({ where: { ClaimId: body.ClaimId }, transaction: t });
        if (!claim) {
          const e = new Error("Claim not found");
          e.statusCode = 404;
          throw e;
        }

        const claimStatus = String(claim.Status || "").trim();
        if (claimStatus && claimStatus !== "Pending" && claimStatus !== "Draft") {
          const e = new Error("Cannot add services unless claim is Pending");
          e.statusCode = 400;
          throw e;
        }

        const service = await Services.findOne({ where: { ServiceId: body.ServiceId }, transaction: t });
        if (!service) {
          const e = new Error("Service not found");
          e.statusCode = 404;
          throw e;
        }

        const qty = body.Qty !== undefined ? Number(body.Qty) : 1;
        const unitPrice = body.UnitPrice !== undefined ? Number(body.UnitPrice) : 0;
        const safeQty = Number.isFinite(qty) ? qty : 1;
        const safeUnitPrice = Number.isFinite(unitPrice) ? unitPrice : 0;
        const claimed = Math.round(safeQty * safeUnitPrice * 100) / 100;
        const coveragePercent = Number(service.CoveragePercent);
        const safeCoverage = Number.isFinite(coveragePercent) ? coveragePercent : 0;
        const companyPay = Math.round((claimed * safeCoverage) / 100 * 100) / 100;
        const employeePay = Math.round((claimed - companyPay) * 100) / 100;

        const claimDate = String(claim.ClaimDate);
        const refEmp = String(claim.Ref_emp || "").trim();
        if (!refEmp) {
          const e = new Error("Claim Ref_emp is missing");
          e.statusCode = 400;
          throw e;
        }

        let period = null;
        if (companyPay > 0) {
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
          period = periods[0];
        }

        const createdLine = await ClaimLines.create(
          {
            ClaimId: body.ClaimId,
            ServiceId: body.ServiceId,
            Qty: safeQty,
            UnitPrice: safeUnitPrice,
            CoverageUsed: safeCoverage,
            ApprovedAmount: companyPay,
            CompanyPay: companyPay,
            EmployeePay: employeePay,
            LineStatus: body.LineStatus || "Pending",
            Notes: body.Notes,
          },
          { transaction: t }
        );

        // No balance deduction here; deduction happens only after doctor approval.
        return { createdLine, deducted: 0, claimed };
      });

      res.status(200).json({ message: "Claim line added successfully", ...result });
    } catch (err) {
      console.error("ClaimLines create error:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ message: err.message || "Error creating claim line" });
    }
  });
};

exports.update = async (req, res) => {
  requireAuth(req, res, async () => {
    const id = req.params.ClaimLineId;
    if (!id) return res.status(400).json({ message: "ClaimLineId is required" });
    const body = req.body || {};

    try {
      const record = await ClaimLines.findOne({ where: { ClaimLineId: id } });
      if (!record) return res.status(404).json({ message: "Claim line not found" });

      const before = {
        ClaimId: record.ClaimId,
        LineStatus: record.LineStatus,
        Notes: record.Notes,
        ServiceId: record.ServiceId,
      };

      await record.update({
        ClaimId: body.ClaimId,
        ServiceId: body.ServiceId,
        Qty: body.Qty,
        UnitPrice: body.UnitPrice,
        CoverageUsed: body.CoverageUsed,
        ApprovedAmount: body.ApprovedAmount,
        CompanyPay: body.CompanyPay,
        EmployeePay: body.EmployeePay,
        LineStatus: body.LineStatus,
        Notes: body.Notes,
      });

      appendClaimActivity({
        claimId: before.ClaimId || body.ClaimId,
        action: "claim_line_updated",
        actor: req.user,
        meta: {
          claimLineId: Number(id),
          serviceId: before.ServiceId,
          statusFrom: before.LineStatus,
          statusTo: body.LineStatus,
          notesChanged: String(before.Notes || "") !== String(body.Notes || ""),
        },
      }).catch(() => undefined);

      res.status(200).json({ message: "Claim line updated successfully" });
    } catch (err) {
      console.error("ClaimLines update error:", err);
      res.status(500).json({ message: err.message || "Error updating claim line" });
    }
  });
};

exports.delete = async (req, res) => {
  requireAuth(req, res, async () => {
    const id = req.params.ClaimLineId;
    if (!id) return res.status(400).json({ message: "ClaimLineId is required" });

    try {
      const record = await ClaimLines.findOne({ where: { ClaimLineId: id } });
      if (!record) return res.status(404).json({ message: "Claim line not found" });
      await record.destroy();
      res.status(200).json({ message: "Claim line deleted successfully" });
    } catch (err) {
      console.error("ClaimLines delete error:", err);
      res.status(500).json({ message: err.message || "Error deleting claim line" });
    }
  });
};
