const fs = require("fs");
const path = require("path");
const { appendClaimActivity } = require("../../utils/claimActivityLog");

// NOTE: Auth is enforced by route middleware (authenticateToken).

const parseBase64 = (value) => {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  if (typeof value !== "string") return null;

  const stripped = value.includes(",") && value.startsWith("data:")
    ? value.substring(value.indexOf(",") + 1)
    : value;

  try {
    return Buffer.from(stripped, "base64");
  } catch (e) {
    return null;
  }
};

const uploadsRoot = path.resolve(__dirname, "../../uploads");
// Requested structure: uploads/claims/<ClaimId>/files...
const claimDocsRootDir = path.join(uploadsRoot, "claims");

const ensureDir = async (dir) => {
  await fs.promises.mkdir(dir, { recursive: true });
};

const safeFolderName = (name) => {
  const base = String(name || "").trim();
  const cleaned = base.replace(/[\\/<>:\"|?*\u0000-\u001F]/g, "_");
  return cleaned.slice(0, 80) || "claim";
};

const resolveClaimFolderName = async (claimId) => {
  try {
    // Lazy require to avoid sequelize init issues in non-server contexts
    const Claims = require("../../models/insurance/Claims");
    const row = await Claims.findOne({
      where: { ClaimId: claimId },
      attributes: ["ClaimNo"],
    });
    if (row && row.ClaimNo) return safeFolderName(row.ClaimNo);
  } catch {
    // ignore DB lookup errors; fall back to claimId
  }
  return safeFolderName(String(claimId ?? ""));
};

const getClaimDir = async (claimId) => {
  const safeFolder = await resolveClaimFolderName(claimId);
  if (!safeFolder) return null;
  const dir = path.join(claimDocsRootDir, safeFolder);
  const abs = path.resolve(dir);
  const root = path.resolve(claimDocsRootDir);
  if (!abs.startsWith(root + path.sep) && abs !== root) return null;
  return abs;
};

const safeFileName = (name) => {
  const base = String(name || "document").trim() || "document";
  // Remove path separators and other risky chars
  return base.replace(/[\\/<>:"|?*\u0000-\u001F]/g, "_").slice(0, 180);
};

const resolveClaimFile = async ({ claimId, fileName }) => {
  const claimDir = await getClaimDir(claimId);
  if (!claimDir) return null;
  const safe = safeFileName(fileName);
  const abs = path.resolve(claimDir, safe);
  if (!abs.startsWith(claimDir + path.sep) && abs !== claimDir) return null;
  return { claimDir, abs, safe };
};

const writeClaimDocumentFile = async ({ claimId, fileName, buffer }) => {
  const claimDir = await getClaimDir(claimId);
  if (!claimDir) throw new Error("Invalid ClaimId");
  await ensureDir(claimDir);

  const original = safeFileName(fileName);
  const ext = path.extname(original);
  const base = ext ? original.slice(0, -ext.length) : original;
  const baseTrimmed = base.slice(0, 120) || "document";

  let finalName = `${baseTrimmed}${ext || ""}`;
  const target = (name) => path.join(claimDir, name);

  try {
    await fs.promises.access(target(finalName), fs.constants.F_OK);
    const suffix = `-${Date.now()}`;
    finalName = `${baseTrimmed}${suffix}${ext || ""}`;
  } catch {
    // doesn't exist
  }

  const abs = target(finalName);
  await fs.promises.writeFile(abs, buffer);
  return { abs, fileName: finalName };
};

exports.find = async (req, res) => {
  try {
    const claimId = req.query.ClaimId;
    if (!claimId) return res.status(400).json({ message: "ClaimId is required" });

    const claimDir = await getClaimDir(claimId);
    if (!claimDir) return res.status(400).json({ message: "Invalid ClaimId" });

    let files = [];
    try {
      files = await fs.promises.readdir(claimDir, { withFileTypes: true });
    } catch {
      return res.json([]);
    }

    const out = [];
    for (const entry of files) {
      if (!entry.isFile()) continue;
      const fileName = entry.name;
      const abs = path.join(claimDir, fileName);
      try {
        const st = await fs.promises.stat(abs);
        out.push({
          ClaimId: Number(claimId),
          FileName: fileName,
          FileType: path.extname(fileName).replace(/^\./, "") || null,
          Size: st.size,
          ModifiedAt: st.mtime,
        });
      } catch {
        // ignore
      }
    }
    out.sort((a, b) => new Date(b.ModifiedAt).getTime() - new Date(a.ModifiedAt).getTime());
    res.json(out);
  } catch (err) {
    console.error("ClaimDocuments find(fs) error:", err);
    res.status(500).json({ message: err.message || "Error fetching claim documents" });
  }
};

exports.getContent = async (req, res) => {
  const claimId = req.query.ClaimId;
  const fileName = req.query.FileName;
  if (!claimId) return res.status(400).json({ message: "ClaimId is required" });
  if (!fileName) return res.status(400).json({ message: "FileName is required" });

  try {
    const resolved = await resolveClaimFile({ claimId, fileName });
    if (!resolved) return res.status(400).json({ message: "Invalid path" });
    await fs.promises.access(resolved.abs, fs.constants.R_OK);

    res.type(path.extname(resolved.safe) || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename=\"${resolved.safe}\"`);
    return fs.createReadStream(resolved.abs).pipe(res);
  } catch (err) {
    if (err && (err.code === "ENOENT" || err.code === "EACCES")) {
      return res.status(404).json({ message: "File not found" });
    }
    console.error("ClaimDocuments getContent(fs) error:", err);
    res.status(500).json({ message: err.message || "Error reading document content" });
  }
};

exports.create = async (req, res) => {
  // Deprecated JSON/base64 API (kept for backward compatibility) - stores to filesystem only.
  const body = req.body || {};
  if (!body.ClaimId || !body.FileName) {
    return res.status(400).json({ message: "ClaimId and FileName are required" });
  }

  try {
    const fileContent = parseBase64(body.FileContent);
    if (!fileContent || !fileContent.length) {
      return res.status(400).json({ message: "FileContent is required" });
    }

    const { fileName } = await writeClaimDocumentFile({
      claimId: body.ClaimId,
      fileName: body.FileName,
      buffer: fileContent,
    });

    appendClaimActivity({
      claimId: body.ClaimId,
      action: "document_uploaded",
      actor: req.user,
      meta: { fileName },
    }).catch(() => undefined);

    // Best-effort resubmission back to doctor after documents are added.
    try {
      const Claims = require("../../models/insurance/Claims");
      const record = await Claims.findOne({ where: { ClaimId: body.ClaimId } });
      if (record) {
        const currentStatusRaw = String(record.Status || "").trim();
        const current = currentStatusRaw.toLowerCase();
        const isNeedDocs = current === "needdocuments" || current === "need_documents" || current === "need-documents";
        if (isNeedDocs) {
          await record.update({ Status: "Pending" });
          appendClaimActivity({
            claimId: body.ClaimId,
            action: "claim_resubmitted",
            actor: req.user,
            meta: { statusFrom: currentStatusRaw, statusTo: "Pending", reason: "documents_uploaded" },
          }).catch(() => undefined);
        }
      }
    } catch {
      // ignore DB errors
    }

    res.status(200).json({ message: "Claim document saved to file", FileName: fileName });
  } catch (err) {
    console.error("ClaimDocuments create(fs) error:", err);
    res.status(500).json({ message: err.message || "Error creating claim document" });
  }
};

exports.uploadFile = async (req, res) => {
  const claimId = req.body?.ClaimId;
  const file = req.file;
  if (!claimId) return res.status(400).json({ message: "ClaimId is required" });
  if (!file) return res.status(400).json({ message: "file is required" });

  try {
    const fileName = req.body?.FileName || file.originalname || "document";
    const { fileName: savedName } = await writeClaimDocumentFile({
      claimId,
      fileName,
      buffer: file.buffer,
    });

    appendClaimActivity({
      claimId,
      action: "document_uploaded",
      actor: req.user,
      meta: { fileName: savedName },
    }).catch(() => undefined);

    // If doctor requested documents, re-send the claim to doctor after uploading new docs.
    // This is best-effort; upload succeeds even if DB update fails.
    try {
      const Claims = require("../../models/insurance/Claims");
      const record = await Claims.findOne({ where: { ClaimId: claimId } });
      if (record) {
        const currentStatusRaw = String(record.Status || "").trim();
        const current = currentStatusRaw.toLowerCase();
        const isNeedDocs = current === "needdocuments" || current === "need_documents" || current === "need-documents";
        if (isNeedDocs) {
          await record.update({ Status: "Pending" });
          appendClaimActivity({
            claimId,
            action: "claim_resubmitted",
            actor: req.user,
            meta: { statusFrom: currentStatusRaw, statusTo: "Pending", reason: "documents_uploaded" },
          }).catch(() => undefined);
        }
      }
    } catch {
      // ignore DB errors
    }

    res.status(200).json({ message: "Claim document uploaded successfully", FileName: savedName });
  } catch (err) {
    console.error("ClaimDocuments uploadFile(fs) error:", err);
    res.status(500).json({ message: err.message || "Error uploading claim document" });
  }
};

exports.update = async (req, res) => {
  // No DB-backed update in filesystem-only mode.
  res.status(410).json({ message: "Update is deprecated in filesystem-only mode. Re-upload the file instead." });
};

exports.delete = async (req, res) => {
  const claimId = req.query.ClaimId;
  const fileName = req.query.FileName;
  if (!claimId) return res.status(400).json({ message: "ClaimId is required" });
  if (!fileName) return res.status(400).json({ message: "FileName is required" });

  try {
    const resolved = await resolveClaimFile({ claimId, fileName });
    if (!resolved) return res.status(400).json({ message: "Invalid path" });
    await fs.promises.unlink(resolved.abs);
    res.status(200).json({ message: "Claim document deleted successfully" });
  } catch (err) {
    if (err && err.code === "ENOENT") return res.status(404).json({ message: "File not found" });
    console.error("ClaimDocuments delete(fs) error:", err);
    res.status(500).json({ message: err.message || "Error deleting claim document" });
  }
};
