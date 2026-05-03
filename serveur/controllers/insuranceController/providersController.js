const Providers = require("../../models/insurance/Providers");
const jwt = require("jsonwebtoken");

const ALLOWED_PROVIDER_TYPES = [
  "مصحة",
  "مستشفى",
  "عيادة",
  "صيدلية",
  "مختبر",
];

const generateProviderCode = async () => {
  // Prefer a human-friendly incremental code; fall back to timestamp if needed.
  try {
    const maxId = await Providers.max("ProviderId");
    const start = Number.isFinite(Number(maxId)) ? Number(maxId) + 1 : 1;

    for (let attempt = 0; attempt < 20; attempt++) {
      const next = start + attempt;
      const code = `PRV-${String(next).padStart(6, "0")}`;
      const exists = await Providers.findOne({ where: { ProviderCode: code } });
      if (!exists) return code;
    }
  } catch (err) {
    console.warn("ProviderCode auto-generation failed, using timestamp fallback", err);
  }

  return `PRV-${Date.now()}`;
};

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
      const data = await Providers.findAll({ where: {} });
      res.json(data);
    } catch (dbErr) {
      console.error("Providers find error:", dbErr);
      res.status(500).json({ message: "Error fetching providers" });
    }
  });
};

exports.create = async (req, res) => {
  requireAuth(req, res, async () => {
    const body = req.body || {};
    if (!body.ProviderName) {
      return res.status(400).json({ message: "ProviderName is required" });
    }

    try {
      const providerCode = (body.ProviderCode || "").trim() || (await generateProviderCode());
      const providerType = (body.ProviderType || "").trim() || "مصحة";
      if (!ALLOWED_PROVIDER_TYPES.includes(providerType)) {
        return res.status(400).json({
          message: `Invalid ProviderType. Allowed: ${ALLOWED_PROVIDER_TYPES.join(", ")}`,
        });
      }

      await Providers.create({
        ProviderCode: providerCode,
        ProviderName: body.ProviderName,
        ProviderType: providerType,
        City: body.City,
        Address: body.Address,
        Phone: body.Phone,
        IsActive: body.IsActive !== undefined ? body.IsActive : true,
      });

      res.status(200).json({ message: "Provider added successfully" });
    } catch (err) {
      console.error("Providers create error:", err);
      res.status(500).json({ message: err.message || "Error creating provider" });
    }
  });
};

exports.update = async (req, res) => {
  requireAuth(req, res, async () => {
    const id = req.params.ProviderId;
    if (!id) return res.status(400).json({ message: "ProviderId is required" });
    const body = req.body || {};

    try {
      const record = await Providers.findOne({ where: { ProviderId: id } });
      if (!record) return res.status(404).json({ message: "Provider not found" });

      const updatePayload = {};
      if (body.ProviderCode !== undefined) updatePayload.ProviderCode = body.ProviderCode;
      if (body.ProviderName !== undefined) updatePayload.ProviderName = body.ProviderName;
      if (body.ProviderType !== undefined) updatePayload.ProviderType = body.ProviderType;
      if (body.City !== undefined) updatePayload.City = body.City;
      if (body.Address !== undefined) updatePayload.Address = body.Address;
      if (body.Phone !== undefined) updatePayload.Phone = body.Phone;
      if (body.IsActive !== undefined) updatePayload.IsActive = body.IsActive;

      await record.update(updatePayload);

      res.status(200).json({ message: "Provider updated successfully" });
    } catch (err) {
      console.error("Providers update error:", err);
      res.status(500).json({ message: err.message || "Error updating provider" });
    }
  });
};

exports.delete = async (req, res) => {
  requireAuth(req, res, async () => {
    const id = req.params.ProviderId;
    if (!id) return res.status(400).json({ message: "ProviderId is required" });

    try {
      const record = await Providers.findOne({ where: { ProviderId: id } });
      if (!record) return res.status(404).json({ message: "Provider not found" });
      await record.destroy();
      res.status(200).json({ message: "Provider deleted successfully" });
    } catch (err) {
      console.error("Providers delete error:", err);
      res.status(500).json({ message: err.message || "Error deleting provider" });
    }
  });
};
