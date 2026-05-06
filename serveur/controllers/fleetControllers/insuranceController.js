const {
  insuranceRepository,
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

const ALLOWED_INSURANCE_STATUSES = ["Active", "Expired", "Cancelled", "Renewed"];

async function getAllInsurance(req, res) {
  try {
    await insuranceRepository.updateExpiredInsuranceStatuses();
    const data = await insuranceRepository.findAll();
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getAllInsurance failed");
  }
}

async function getInsuranceById(req, res) {
  const { value: idInsurance, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const data = await insuranceRepository.findById(idInsurance);
    if (!data) {
      return sendError(res, 404, "Insurance record not found", []);
    }

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getInsuranceById failed");
  }
}

async function getInsuranceByVehicle(req, res) {
  const { value: vehicleId, error: idError } = parseId(req.params.vehicleId, "vehicleId");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "vehicleId", message: idError }]);
  }

  try {
    const vehicleExists = await referenceRepository.vehicleExists(vehicleId);
    if (!vehicleExists) {
      return sendError(res, 404, "Vehicle not found", []);
    }

    const data = await insuranceRepository.findByVehicleId(vehicleId);
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getInsuranceByVehicle failed");
  }
}

async function getActiveInsuranceByVehicle(req, res) {
  const { value: vehicleId, error: idError } = parseId(req.params.vehicleId, "vehicleId");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "vehicleId", message: idError }]);
  }

  try {
    const vehicleExists = await referenceRepository.vehicleExists(vehicleId);
    if (!vehicleExists) {
      return sendError(res, 404, "Vehicle not found", []);
    }

    const data = await insuranceRepository.getActiveInsuranceByVehicle(vehicleId);
    if (!data) {
      return sendError(res, 404, "No active insurance found for this vehicle", []);
    }

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getActiveInsuranceByVehicle failed");
  }
}

function validateInsurancePayload(body, isUpdate = false) {
  const errors = [];

  if (!isUpdate || body.idVehicle !== undefined) {
    if (body.idVehicle === undefined || body.idVehicle === null || body.idVehicle === "") {
      errors.push({ field: "idVehicle", message: "idVehicle is required" });
    } else {
      const parsedVehicleId = parseId(body.idVehicle, "idVehicle");
      if (parsedVehicleId.error) {
        errors.push({ field: "idVehicle", message: parsedVehicleId.error });
      }
    }
  }

  if (!body.startDate || !isValidDate(body.startDate)) {
    errors.push({ field: "startDate", message: "startDate must be a valid date" });
  }

  if (!body.endDate || !isValidDate(body.endDate)) {
    errors.push({ field: "endDate", message: "endDate must be a valid date" });
  }

  if (isValidDate(body.startDate) && isValidDate(body.endDate)) {
    const startDate = toDate(body.startDate);
    const endDate = toDate(body.endDate);
    if (endDate < startDate) {
      errors.push({ field: "endDate", message: "endDate must be greater than or equal to startDate" });
    }
  }

  if (body.idSupplier !== undefined && body.idSupplier !== null && body.idSupplier !== "") {
    const parsedSupplierId = parseId(body.idSupplier, "idSupplier");
    if (parsedSupplierId.error) {
      errors.push({ field: "idSupplier", message: parsedSupplierId.error });
    }
  }

  if (body.status && !ALLOWED_INSURANCE_STATUSES.includes(body.status)) {
    errors.push({
      field: "status",
      message: `status must be one of: ${ALLOWED_INSURANCE_STATUSES.join(", ")}`
    });
  }

  return errors;
}

async function createInsurance(req, res) {
  const body = req.body || {};
  const errors = validateInsurancePayload(body);

  if (errors.length) {
    return sendError(res, 400, "Validation failed", errors);
  }

  try {
    const idVehicle = Number(body.idVehicle);
    const idSupplier = body.idSupplier ? Number(body.idSupplier) : null;

    const vehicleExists = await referenceRepository.vehicleExists(idVehicle);
    if (!vehicleExists) {
      return sendError(res, 400, "Validation failed", [{ field: "idVehicle", message: "Vehicle not found" }]);
    }

    if (idSupplier) {
      const supplierExists = await referenceRepository.supplierExists(idSupplier);
      if (!supplierExists) {
        return sendError(res, 400, "Validation failed", [{ field: "idSupplier", message: "Supplier not found" }]);
      }
    }

    const data = await insuranceRepository.create({
      idVehicle,
      idSupplier,
      policyNumber: body.policyNumber || null,
      insuranceType: body.insuranceType || null,
      startDate: toDate(body.startDate),
      endDate: toDate(body.endDate),
      premiumAmount: body.premiumAmount || null,
      insuredValue: body.insuredValue || null,
      paymentStatus: body.paymentStatus || null,
      coverageDetails: body.coverageDetails || null,
      documentFile: body.documentFile || null,
      status: body.status || "Active"
    });

    return sendSuccess(res, "Operation completed successfully", data, 201);
  } catch (error) {
    return handleControllerError(res, error, "createInsurance failed");
  }
}

async function updateInsurance(req, res) {
  const { value: idInsurance, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  const body = req.body || {};
  const errors = validateInsurancePayload(body, true);

  if (errors.length) {
    return sendError(res, 400, "Validation failed", errors);
  }

  try {
    const existing = await insuranceRepository.findById(idInsurance);
    if (!existing) {
      return sendError(res, 404, "Insurance record not found", []);
    }

    const idVehicle = Number(body.idVehicle);
    const idSupplier = body.idSupplier ? Number(body.idSupplier) : null;

    const vehicleExists = await referenceRepository.vehicleExists(idVehicle);
    if (!vehicleExists) {
      return sendError(res, 400, "Validation failed", [{ field: "idVehicle", message: "Vehicle not found" }]);
    }

    if (idSupplier) {
      const supplierExists = await referenceRepository.supplierExists(idSupplier);
      if (!supplierExists) {
        return sendError(res, 400, "Validation failed", [{ field: "idSupplier", message: "Supplier not found" }]);
      }
    }

    const data = await insuranceRepository.update(idInsurance, {
      idVehicle,
      idSupplier,
      policyNumber: body.policyNumber || null,
      insuranceType: body.insuranceType || null,
      startDate: toDate(body.startDate),
      endDate: toDate(body.endDate),
      premiumAmount: body.premiumAmount || null,
      insuredValue: body.insuredValue || null,
      paymentStatus: body.paymentStatus || null,
      coverageDetails: body.coverageDetails || null,
      documentFile: body.documentFile || null,
      status: body.status || existing.STATUS || "Active"
    });

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "updateInsurance failed");
  }
}

async function renewInsurance(req, res) {
  const { value: idInsurance, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  const body = req.body || {};
  const errors = [];

  if (!body.startDate || !isValidDate(body.startDate)) {
    errors.push({ field: "startDate", message: "startDate must be a valid date" });
  }

  if (!body.endDate || !isValidDate(body.endDate)) {
    errors.push({ field: "endDate", message: "endDate must be a valid date" });
  }

  if (isValidDate(body.startDate) && isValidDate(body.endDate)) {
    const startDate = toDate(body.startDate);
    const endDate = toDate(body.endDate);
    if (endDate < startDate) {
      errors.push({ field: "endDate", message: "endDate must be greater than or equal to startDate" });
    }
  }

  if (errors.length) {
    return sendError(res, 400, "Validation failed", errors);
  }

  try {
    const existing = await insuranceRepository.findById(idInsurance);
    if (!existing) {
      return sendError(res, 404, "Insurance record not found", []);
    }

    if (body.idSupplier) {
      const supplierExists = await referenceRepository.supplierExists(Number(body.idSupplier));
      if (!supplierExists) {
        return sendError(res, 400, "Validation failed", [{ field: "idSupplier", message: "Supplier not found" }]);
      }
    }

    const data = await insuranceRepository.renewInsurance(idInsurance, {
      idSupplier: body.idSupplier ? Number(body.idSupplier) : null,
      policyNumber: body.policyNumber || null,
      insuranceType: body.insuranceType || null,
      startDate: toDate(body.startDate),
      endDate: toDate(body.endDate),
      premiumAmount: body.premiumAmount || null,
      insuredValue: body.insuredValue || null,
      paymentStatus: body.paymentStatus || null,
      coverageDetails: body.coverageDetails || null,
      documentFile: body.documentFile || null
    });

    if (!data) {
      return sendError(res, 404, "Insurance record not found", []);
    }

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "renewInsurance failed");
  }
}

async function cancelInsurance(req, res) {
  const { value: idInsurance, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const existing = await insuranceRepository.findById(idInsurance);
    if (!existing) {
      return sendError(res, 404, "Insurance record not found", []);
    }

    const data = await insuranceRepository.cancelInsurance(idInsurance);
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "cancelInsurance failed");
  }
}

async function getExpiringSoonInsurance(req, res) {
  const daysBefore = req.query.daysBefore === undefined ? 30 : Number(req.query.daysBefore);

  if (!Number.isInteger(daysBefore) || daysBefore < 0) {
    return sendError(res, 400, "Validation failed", [
      { field: "daysBefore", message: "daysBefore must be a non-negative integer" }
    ]);
  }

  try {
    await insuranceRepository.updateExpiredInsuranceStatuses();
    const data = await insuranceRepository.findExpiringSoon(daysBefore);
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getExpiringSoonInsurance failed");
  }
}

async function getExpiredInsurance(req, res) {
  try {
    await insuranceRepository.updateExpiredInsuranceStatuses();
    const data = await insuranceRepository.findExpired();
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getExpiredInsurance failed");
  }
}

module.exports = {
  getAllInsurance,
  getInsuranceById,
  getInsuranceByVehicle,
  getActiveInsuranceByVehicle,
  createInsurance,
  updateInsurance,
  renewInsurance,
  cancelInsurance,
  getExpiringSoonInsurance,
  getExpiredInsurance
};
