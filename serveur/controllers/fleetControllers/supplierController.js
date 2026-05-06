const { supplierRepository } = require("../../models/fleet");
const {
  sendSuccess,
  sendError,
  parseId,
  handleControllerError
} = require("./fleetControllerUtils");

const ALLOWED_SUPPLIER_TYPES = ["Insurance Company", "Workshop", "Supplier", "Other"];

async function getAllSuppliers(req, res) {
  try {
    const data = await supplierRepository.findAll();
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getAllSuppliers failed");
  }
}

async function getSupplierById(req, res) {
  const { value: idSupplier, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const data = await supplierRepository.findById(idSupplier);
    if (!data) {
      return sendError(res, 404, "Supplier not found", []);
    }

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getSupplierById failed");
  }
}

async function createSupplier(req, res) {
  const body = req.body || {};
  const errors = [];

  if (!body.name || !String(body.name).trim()) {
    errors.push({ field: "name", message: "name is required" });
  }

  if (body.supplierType && !ALLOWED_SUPPLIER_TYPES.includes(body.supplierType)) {
    errors.push({
      field: "supplierType",
      message: `supplierType must be one of: ${ALLOWED_SUPPLIER_TYPES.join(", ")}`
    });
  }

  if (errors.length) {
    return sendError(res, 400, "Validation failed", errors);
  }

  try {
    const data = await supplierRepository.create({
      name: String(body.name).trim(),
      supplierType: body.supplierType || null,
      contactPerson: body.contactPerson || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      status: body.status || "Active"
    });

    return sendSuccess(res, "Operation completed successfully", data, 201);
  } catch (error) {
    return handleControllerError(res, error, "createSupplier failed");
  }
}

async function updateSupplier(req, res) {
  const { value: idSupplier, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  const body = req.body || {};
  const errors = [];

  if (!body.name || !String(body.name).trim()) {
    errors.push({ field: "name", message: "name is required" });
  }

  if (body.supplierType && !ALLOWED_SUPPLIER_TYPES.includes(body.supplierType)) {
    errors.push({
      field: "supplierType",
      message: `supplierType must be one of: ${ALLOWED_SUPPLIER_TYPES.join(", ")}`
    });
  }

  if (errors.length) {
    return sendError(res, 400, "Validation failed", errors);
  }

  try {
    const existing = await supplierRepository.findById(idSupplier);
    if (!existing) {
      return sendError(res, 404, "Supplier not found", []);
    }

    const data = await supplierRepository.update(idSupplier, {
      name: String(body.name).trim(),
      supplierType: body.supplierType || null,
      contactPerson: body.contactPerson || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      status: body.status || existing.STATUS || "Active"
    });

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "updateSupplier failed");
  }
}

async function deleteSupplier(req, res) {
  const { value: idSupplier, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const existing = await supplierRepository.findById(idSupplier);
    if (!existing) {
      return sendError(res, 404, "Supplier not found", []);
    }

    await supplierRepository.remove(idSupplier);
    return sendSuccess(res, "Operation completed successfully", { id: idSupplier });
  } catch (error) {
    return handleControllerError(res, error, "deleteSupplier failed");
  }
}

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
