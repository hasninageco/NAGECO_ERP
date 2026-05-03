const Services = require("../../models/insurance/Services");
const jwt = require("jsonwebtoken");

const requireAuth = (req, res, callback) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });
    return callback(decoded);
  });
};

exports.find = async (req, res) => {
  requireAuth(req, res, async () => {
    try {
      const data = await Services.findAll({ where: {} });
      res.json(data);
    } catch (dbErr) {
      console.error("Services find error:", dbErr);
      res.status(500).json({ message: "Error fetching services" });
    }
  });
};

exports.create = async (req, res) => {
  requireAuth(req, res, async () => {
    const body = req.body || {};
    if (!body.ServiceCode || !body.ServiceName || !body.ServiceType || body.CoveragePercent === undefined || !body.ValidFrom) {
      return res.status(400).json({ message: "ServiceCode, ServiceName, ServiceType, CoveragePercent, ValidFrom are required" });
    }

    try {
      await Services.create({
        ServiceCode: body.ServiceCode,
        ServiceName: body.ServiceName,
        ArabicName: body.ArabicName,
        ServiceType: body.ServiceType,
        CoveragePercent: body.CoveragePercent,
        ValidFrom: body.ValidFrom,
        ValidTo: body.ValidTo,
        IsActive: body.IsActive !== undefined ? body.IsActive : true,
        Notes: body.Notes,
        clinic_category: body.clinic_category,
      });

      res.status(200).json({ message: "Service added successfully" });
    } catch (err) {
      console.error("Services create error:", err);
      res.status(500).json({ message: err.message || "Error creating service" });
    }
  });
};

exports.update = async (req, res) => {
  requireAuth(req, res, async () => {
    const id = req.params.ServiceId;
    if (!id) return res.status(400).json({ message: "ServiceId is required" });
    const body = req.body || {};

    try {
      const record = await Services.findOne({ where: { ServiceId: id } });
      if (!record) return res.status(404).json({ message: "Service not found" });

      await record.update({
        ServiceCode: body.ServiceCode,
        ServiceName: body.ServiceName,
        ArabicName: body.ArabicName,
        ServiceType: body.ServiceType,
        CoveragePercent: body.CoveragePercent,
        ValidFrom: body.ValidFrom,
        ValidTo: body.ValidTo,
        IsActive: body.IsActive,
        Notes: body.Notes,
        clinic_category: body.clinic_category,
      });

      res.status(200).json({ message: "Service updated successfully" });
    } catch (err) {
      console.error("Services update error:", err);
      res.status(500).json({ message: err.message || "Error updating service" });
    }
  });
};

exports.delete = async (req, res) => {
  requireAuth(req, res, async () => {
    const id = req.params.ServiceId;
    if (!id) return res.status(400).json({ message: "ServiceId is required" });

    try {
      const record = await Services.findOne({ where: { ServiceId: id } });
      if (!record) return res.status(404).json({ message: "Service not found" });
      await record.destroy();
      res.status(200).json({ message: "Service deleted successfully" });
    } catch (err) {
      console.error("Services delete error:", err);
      res.status(500).json({ message: err.message || "Error deleting service" });
    }
  });
};
