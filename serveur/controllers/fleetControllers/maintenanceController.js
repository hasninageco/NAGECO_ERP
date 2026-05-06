const {
  maintenanceRepository,
  vehicleRepository,
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

const ALLOWED_MAINTENANCE_STATUSES = ["Planned", "In Progress", "Completed", "Cancelled"];

function validateMaintenancePayload(body) {
  const errors = [];

  if (body.idVehicle === undefined || body.idVehicle === null || body.idVehicle === "") {
    errors.push({ field: "idVehicle", message: "idVehicle is required" });
  } else {
    const parsedVehicle = parseId(body.idVehicle, "idVehicle");
    if (parsedVehicle.error) {
      errors.push({ field: "idVehicle", message: parsedVehicle.error });
    }
  }

  if (!body.maintenanceType || !String(body.maintenanceType).trim()) {
    errors.push({ field: "maintenanceType", message: "maintenanceType is required" });
  }

  if (body.startDate && !isValidDate(body.startDate)) {
    errors.push({ field: "startDate", message: "startDate must be a valid date" });
  }

  if (body.endDate && !isValidDate(body.endDate)) {
    errors.push({ field: "endDate", message: "endDate must be a valid date" });
  }

  if (body.startDate && body.endDate && isValidDate(body.startDate) && isValidDate(body.endDate)) {
    const startDate = toDate(body.startDate);
    const endDate = toDate(body.endDate);
    if (endDate < startDate) {
      errors.push({ field: "endDate", message: "endDate must be greater than or equal to startDate" });
    }
  }

  if (body.status && !ALLOWED_MAINTENANCE_STATUSES.includes(body.status)) {
    errors.push({
      field: "status",
      message: `status must be one of: ${ALLOWED_MAINTENANCE_STATUSES.join(", ")}`
    });
  }

  if (body.idSupplier !== undefined && body.idSupplier !== null && body.idSupplier !== "") {
    const parsedSupplier = parseId(body.idSupplier, "idSupplier");
    if (parsedSupplier.error) {
      errors.push({ field: "idSupplier", message: parsedSupplier.error });
    }
  }

  return errors;
}

async function getAllMaintenance(req, res) {
  try {
    const filters = {
      idVehicle: req.query.idVehicle ? Number(req.query.idVehicle) : null,
      status: req.query.status || null
    };

    const data = await maintenanceRepository.findAll(filters);
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getAllMaintenance failed");
  }
}

async function getMaintenanceById(req, res) {
  const { value: idMaintenance, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const data = await maintenanceRepository.findById(idMaintenance);
    if (!data) {
      return sendError(res, 404, "Maintenance record not found", []);
    }

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getMaintenanceById failed");
  }
}

async function createMaintenance(req, res) {
  const body = req.body || {};
  const errors = validateMaintenancePayload(body);

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

    const data = await maintenanceRepository.create({
      idVehicle,
      idSupplier,
      maintenanceType: String(body.maintenanceType).trim(),
      description: body.description || null,
      startDate: body.startDate ? toDate(body.startDate) : null,
      endDate: body.endDate ? toDate(body.endDate) : null,
      serviceDate: body.serviceDate ? toDate(body.serviceDate) : null,
      mileage: body.mileage || null,
      workPerformed: body.workPerformed || null,
      laborCost: body.laborCost || 0,
      partsCost: body.partsCost || 0,
      nextServiceDate: body.nextServiceDate ? toDate(body.nextServiceDate) : null,
      nextServiceMileage: body.nextServiceMileage || null,
      status: body.status || "Planned"
    });

    return sendSuccess(res, "Operation completed successfully", data, 201);
  } catch (error) {
    return handleControllerError(res, error, "createMaintenance failed");
  }
}

async function updateMaintenance(req, res) {
  const { value: idMaintenance, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  const body = req.body || {};
  const errors = validateMaintenancePayload(body);

  if (errors.length) {
    return sendError(res, 400, "Validation failed", errors);
  }

  try {
    const existing = await maintenanceRepository.findById(idMaintenance);
    if (!existing) {
      return sendError(res, 404, "Maintenance record not found", []);
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

    const data = await maintenanceRepository.update(idMaintenance, {
      idVehicle,
      idSupplier,
      maintenanceType: String(body.maintenanceType).trim(),
      description: body.description || null,
      startDate: body.startDate ? toDate(body.startDate) : null,
      endDate: body.endDate ? toDate(body.endDate) : null,
      serviceDate: body.serviceDate ? toDate(body.serviceDate) : null,
      mileage: body.mileage || null,
      workPerformed: body.workPerformed || null,
      laborCost: body.laborCost || 0,
      partsCost: body.partsCost || 0,
      nextServiceDate: body.nextServiceDate ? toDate(body.nextServiceDate) : null,
      nextServiceMileage: body.nextServiceMileage || null,
      status: body.status || existing.STATUS || "Planned"
    });

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "updateMaintenance failed");
  }
}

async function startMaintenance(req, res) {
  const { value: idMaintenance, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const existing = await maintenanceRepository.findById(idMaintenance);
    if (!existing) {
      return sendError(res, 404, "Maintenance record not found", []);
    }

    if (existing.STATUS === "Completed" || existing.STATUS === "Cancelled") {
      return sendError(res, 400, "Cannot start maintenance with this status", []);
    }

    const updated = await maintenanceRepository.setStatus(idMaintenance, "In Progress");

    if (updated && updated.ID_VEHICLE) {
      await vehicleRepository.updateStatus(updated.ID_VEHICLE, "In Maintenance");
    }

    return sendSuccess(res, "Operation completed successfully", updated);
  } catch (error) {
    return handleControllerError(res, error, "startMaintenance failed");
  }
}

async function completeMaintenance(req, res) {
  const { value: idMaintenance, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  const body = req.body || {};

  if (body.endDate && !isValidDate(body.endDate)) {
    return sendError(res, 400, "Validation failed", [
      { field: "endDate", message: "endDate must be a valid date" }
    ]);
  }

  try {
    const existing = await maintenanceRepository.findById(idMaintenance);
    if (!existing) {
      return sendError(res, 404, "Maintenance record not found", []);
    }

    if (existing.STATUS !== "In Progress" && existing.STATUS !== "Planned") {
      return sendError(res, 400, "Only Planned or In Progress maintenance can be completed", []);
    }

    const endDate = body.endDate ? toDate(body.endDate) : new Date();
    if (existing.START_DATE && endDate < toDate(existing.START_DATE)) {
      return sendError(res, 400, "Validation failed", [
        { field: "endDate", message: "endDate must be greater than or equal to startDate" }
      ]);
    }

    const updated = await maintenanceRepository.setStatus(idMaintenance, "Completed", {
      endDate,
      workPerformed: body.workPerformed || null,
      laborCost: body.laborCost || null,
      partsCost: body.partsCost || null,
      nextServiceDate: body.nextServiceDate ? toDate(body.nextServiceDate) : null,
      nextServiceMileage: body.nextServiceMileage || null
    });

    if (updated && updated.ID_VEHICLE) {
      const vehicle = await vehicleRepository.findById(updated.ID_VEHICLE);
      if (vehicle && vehicle.STATUS !== "Out Of Service") {
        await vehicleRepository.updateStatus(vehicle.ID_VEHICLE, "Active");
      }
    }

    return sendSuccess(res, "Operation completed successfully", updated);
  } catch (error) {
    return handleControllerError(res, error, "completeMaintenance failed");
  }
}

async function cancelMaintenance(req, res) {
  const { value: idMaintenance, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const existing = await maintenanceRepository.findById(idMaintenance);
    if (!existing) {
      return sendError(res, 404, "Maintenance record not found", []);
    }

    if (existing.STATUS === "Completed") {
      return sendError(res, 400, "Completed maintenance cannot be cancelled", []);
    }

    const updated = await maintenanceRepository.setStatus(idMaintenance, "Cancelled");

    if (updated && updated.ID_VEHICLE) {
      const vehicle = await vehicleRepository.findById(updated.ID_VEHICLE);
      if (vehicle && vehicle.STATUS !== "Out Of Service") {
        await vehicleRepository.updateStatus(vehicle.ID_VEHICLE, "Active");
      }
    }

    return sendSuccess(res, "Operation completed successfully", updated);
  } catch (error) {
    return handleControllerError(res, error, "cancelMaintenance failed");
  }
}

async function getOverdueMaintenance(req, res) {
  try {
    const data = await maintenanceRepository.findOverdue(new Date());
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getOverdueMaintenance failed");
  }
}

async function getDueMaintenance(req, res) {
  try {
    const data = await maintenanceRepository.findDue(new Date());
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getDueMaintenance failed");
  }
}

module.exports = {
  getAllMaintenance,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  startMaintenance,
  completeMaintenance,
  cancelMaintenance,
  getOverdueMaintenance,
  getDueMaintenance
};
