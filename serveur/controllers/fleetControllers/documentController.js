const {
  documentRepository,
  referenceRepository
} = require("../../models/fleet");
const {
  sendSuccess,
  sendError,
  parseId,
  isValidDate,
  toDate,
  handleControllerError
} = require("./fleetControllerUtils");

const ALLOWED_RELATED_TYPES = [
  "Vehicle",
  "Vehicle Insurance",
  "Maintenance",
  "Trip",
  "Employee"
];

function normalizeEmployeeRef(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized === "" ? null : normalized;
}

function validateDocumentPayload(body) {
  const errors = [];

  if (!body.relatedType || !ALLOWED_RELATED_TYPES.includes(body.relatedType)) {
    errors.push({
      field: "relatedType",
      message: `relatedType must be one of: ${ALLOWED_RELATED_TYPES.join(", ")}`
    });
  }

  const relatedIdCheck = parseId(body.relatedId, "relatedId");
  if (relatedIdCheck.error) {
    errors.push({ field: "relatedId", message: relatedIdCheck.error });
  }

  if (!body.fileName || !String(body.fileName).trim()) {
    errors.push({ field: "fileName", message: "fileName is required" });
  }

  if (!body.filePath || !String(body.filePath).trim()) {
    errors.push({ field: "filePath", message: "filePath is required" });
  }

  if (body.startDate && !isValidDate(body.startDate)) {
    errors.push({ field: "startDate", message: "startDate must be a valid date" });
  }

  if (body.endDate && !isValidDate(body.endDate)) {
    errors.push({ field: "endDate", message: "endDate must be a valid date" });
  }

  if (body.startDate && body.endDate && isValidDate(body.startDate) && isValidDate(body.endDate)) {
    if (toDate(body.endDate) < toDate(body.startDate)) {
      errors.push({ field: "endDate", message: "endDate must be greater than or equal to startDate" });
    }
  }

  if (body.idVehicle !== undefined && body.idVehicle !== null && body.idVehicle !== "") {
    const parsed = parseId(body.idVehicle, "idVehicle");
    if (parsed.error) {
      errors.push({ field: "idVehicle", message: parsed.error });
    }
  }

  if (body.idEmp !== undefined && body.idEmp !== null && body.idEmp !== "") {
    if (String(body.idEmp).trim().length > 100) {
      errors.push({ field: "idEmp", message: "idEmp must be 100 characters or less" });
    }
  }

  if (body.uploadedBy !== undefined && body.uploadedBy !== null && body.uploadedBy !== "") {
    if (String(body.uploadedBy).trim().length > 100) {
      errors.push({ field: "uploadedBy", message: "uploadedBy must be 100 characters or less" });
    }
  }

  return errors;
}

async function validateDocumentReferences(body) {
  const errors = [];

  const relatedId = Number(body.relatedId);

  if (body.relatedType === "Vehicle") {
    const exists = await referenceRepository.vehicleExists(relatedId);
    if (!exists) errors.push({ field: "relatedId", message: "Related vehicle not found" });
  }

  if (body.relatedType === "Vehicle Insurance") {
    const exists = await referenceRepository.insuranceExists(relatedId);
    if (!exists) errors.push({ field: "relatedId", message: "Related insurance not found" });
  }

  if (body.relatedType === "Maintenance") {
    const exists = await referenceRepository.maintenanceExists(relatedId);
    if (!exists) errors.push({ field: "relatedId", message: "Related maintenance not found" });
  }

  if (body.relatedType === "Trip") {
    const exists = await referenceRepository.tripExists(relatedId);
    if (!exists) errors.push({ field: "relatedId", message: "Related trip not found" });
  }

  if (body.relatedType === "Employee") {
    const exists = await referenceRepository.employeeExistsByRef(body.relatedId);
    if (!exists) errors.push({ field: "relatedId", message: "Related employee not found" });
  }

  if (body.idVehicle) {
    const exists = await referenceRepository.vehicleExists(Number(body.idVehicle));
    if (!exists) errors.push({ field: "idVehicle", message: "Vehicle not found" });
  }

  return errors;
}

async function getDocuments(req, res) {
  try {
    const filters = {
      relatedType: req.query.relatedType || null,
      relatedId: req.query.relatedId ? Number(req.query.relatedId) : null,
      idVehicle: req.query.idVehicle ? Number(req.query.idVehicle) : null,
      idEmp: normalizeEmployeeRef(req.query.idEmp),
      documentType: req.query.documentType || null
    };

    const data = await documentRepository.findAll(filters);
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getDocuments failed");
  }
}

async function getDocumentById(req, res) {
  const { value: idDocument, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const data = await documentRepository.findById(idDocument);
    if (!data) {
      return sendError(res, 404, "Document not found", []);
    }

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getDocumentById failed");
  }
}

async function createDocument(req, res) {
  const body = req.body || {};

  const validationErrors = validateDocumentPayload(body);
  if (validationErrors.length) {
    return sendError(res, 400, "Validation failed", validationErrors);
  }

  try {
    const referenceErrors = await validateDocumentReferences(body);
    if (referenceErrors.length) {
      return sendError(res, 400, "Validation failed", referenceErrors);
    }

    const data = await documentRepository.create({
      relatedType: body.relatedType,
      relatedId: Number(body.relatedId),
      idVehicle: body.idVehicle ? Number(body.idVehicle) : null,
      idEmp: normalizeEmployeeRef(body.idEmp),
      documentType: body.documentType || null,
      fileName: String(body.fileName).trim(),
      filePath: String(body.filePath).trim(),
      startDate: body.startDate ? toDate(body.startDate) : null,
      endDate: body.endDate ? toDate(body.endDate) : null,
      uploadedBy: normalizeEmployeeRef(body.uploadedBy)
    });

    return sendSuccess(res, "Operation completed successfully", data, 201);
  } catch (error) {
    return handleControllerError(res, error, "createDocument failed");
  }
}

async function updateDocument(req, res) {
  const { value: idDocument, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  const body = req.body || {};

  const validationErrors = validateDocumentPayload(body);
  if (validationErrors.length) {
    return sendError(res, 400, "Validation failed", validationErrors);
  }

  try {
    const existing = await documentRepository.findById(idDocument);
    if (!existing) {
      return sendError(res, 404, "Document not found", []);
    }

    const referenceErrors = await validateDocumentReferences(body);
    if (referenceErrors.length) {
      return sendError(res, 400, "Validation failed", referenceErrors);
    }

    const data = await documentRepository.update(idDocument, {
      relatedType: body.relatedType,
      relatedId: Number(body.relatedId),
      idVehicle: body.idVehicle ? Number(body.idVehicle) : null,
      idEmp: normalizeEmployeeRef(body.idEmp),
      documentType: body.documentType || null,
      fileName: String(body.fileName).trim(),
      filePath: String(body.filePath).trim(),
      startDate: body.startDate ? toDate(body.startDate) : null,
      endDate: body.endDate ? toDate(body.endDate) : null,
      uploadedBy: normalizeEmployeeRef(body.uploadedBy)
    });

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "updateDocument failed");
  }
}

async function deleteDocument(req, res) {
  const { value: idDocument, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const existing = await documentRepository.findById(idDocument);
    if (!existing) {
      return sendError(res, 404, "Document not found", []);
    }

    await documentRepository.remove(idDocument);
    return sendSuccess(res, "Operation completed successfully", { id: idDocument });
  } catch (error) {
    return handleControllerError(res, error, "deleteDocument failed");
  }
}

module.exports = {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument
};
