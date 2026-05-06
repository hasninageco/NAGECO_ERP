const { vehicleRepository } = require("../../models/fleet");
const {
  sendSuccess,
  sendError,
  parseId,
  handleControllerError
} = require("./fleetControllerUtils");

const ALLOWED_VEHICLE_STATUSES = [
  "Active",
  "Reserved",
  "In Maintenance",
  "In Trip",
  "Out Of Service"
];

async function getAllVehicles(req, res) {
  try {
    const data = await vehicleRepository.findAll();
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getAllVehicles failed");
  }
}

async function getVehicleById(req, res) {
  const { value: idVehicle, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const data = await vehicleRepository.findById(idVehicle);
    if (!data) {
      return sendError(res, 404, "Vehicle not found", []);
    }

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getVehicleById failed");
  }
}

async function createVehicle(req, res) {
  const body = req.body || {};
  const errors = [];

  if (!body.plateNumber || !String(body.plateNumber).trim()) {
    errors.push({ field: "plateNumber", message: "plateNumber is required" });
  }

  const currentMileage = body.currentMileage === undefined ? 0 : Number(body.currentMileage);
  if (!Number.isInteger(currentMileage) || currentMileage < 0) {
    errors.push({ field: "currentMileage", message: "currentMileage must be a non-negative integer" });
  }

  if (body.status && !ALLOWED_VEHICLE_STATUSES.includes(body.status)) {
    errors.push({
      field: "status",
      message: `status must be one of: ${ALLOWED_VEHICLE_STATUSES.join(", ")}`
    });
  }

  let idEmpResponsible = null;
  if (body.idEmpResponsible !== undefined && body.idEmpResponsible !== null) {
    const normalizedIdEmpResponsible = String(body.idEmpResponsible).trim();
    if (normalizedIdEmpResponsible.length > 100) {
      errors.push({
        field: "idEmpResponsible",
        message: "idEmpResponsible must be 100 characters or less"
      });
    } else if (normalizedIdEmpResponsible !== "") {
      idEmpResponsible = normalizedIdEmpResponsible;
    }
  }

  if (errors.length) {
    return sendError(res, 400, "Validation failed", errors);
  }

  try {
    const plateNumber = String(body.plateNumber).trim();

    const plateExists = await vehicleRepository.isPlateNumberUsed(plateNumber);
    if (plateExists) {
      return sendError(res, 409, "Vehicle plate number already exists", []);
    }

    const data = await vehicleRepository.create({
      plateNumber,
      brand: body.brand || null,
      model: body.model || null,
      vehicleYear: body.vehicleYear || null,
      vehicleType: body.vehicleType || null,
      fuelType: body.fuelType || null,
      currentMileage,
      status: body.status || "Active",
      idEmpResponsible
    });

    return sendSuccess(res, "Operation completed successfully", data, 201);
  } catch (error) {
    return handleControllerError(res, error, "createVehicle failed");
  }
}

async function updateVehicle(req, res) {
  const { value: idVehicle, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  const body = req.body || {};
  const errors = [];

  if (!body.plateNumber || !String(body.plateNumber).trim()) {
    errors.push({ field: "plateNumber", message: "plateNumber is required" });
  }

  const currentMileage = body.currentMileage === undefined ? 0 : Number(body.currentMileage);
  if (!Number.isInteger(currentMileage) || currentMileage < 0) {
    errors.push({ field: "currentMileage", message: "currentMileage must be a non-negative integer" });
  }

  if (body.status && !ALLOWED_VEHICLE_STATUSES.includes(body.status)) {
    errors.push({
      field: "status",
      message: `status must be one of: ${ALLOWED_VEHICLE_STATUSES.join(", ")}`
    });
  }

  let idEmpResponsible = null;
  if (body.idEmpResponsible !== undefined && body.idEmpResponsible !== null) {
    const normalizedIdEmpResponsible = String(body.idEmpResponsible).trim();
    if (normalizedIdEmpResponsible.length > 100) {
      errors.push({
        field: "idEmpResponsible",
        message: "idEmpResponsible must be 100 characters or less"
      });
    } else if (normalizedIdEmpResponsible !== "") {
      idEmpResponsible = normalizedIdEmpResponsible;
    }
  }

  if (errors.length) {
    return sendError(res, 400, "Validation failed", errors);
  }

  try {
    const existing = await vehicleRepository.findById(idVehicle);
    if (!existing) {
      return sendError(res, 404, "Vehicle not found", []);
    }

    const plateNumber = String(body.plateNumber).trim();

    const plateExists = await vehicleRepository.isPlateNumberUsed(plateNumber, idVehicle);
    if (plateExists) {
      return sendError(res, 409, "Vehicle plate number already exists", []);
    }

    const data = await vehicleRepository.update(idVehicle, {
      plateNumber,
      brand: body.brand || null,
      model: body.model || null,
      vehicleYear: body.vehicleYear || null,
      vehicleType: body.vehicleType || null,
      fuelType: body.fuelType || null,
      currentMileage,
      status: body.status || existing.STATUS || "Active",
      idEmpResponsible
    });

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "updateVehicle failed");
  }
}

async function deleteVehicle(req, res) {
  const { value: idVehicle, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const existing = await vehicleRepository.findById(idVehicle);
    if (!existing) {
      return sendError(res, 404, "Vehicle not found", []);
    }

    await vehicleRepository.remove(idVehicle);
    return sendSuccess(res, "Operation completed successfully", { id: idVehicle });
  } catch (error) {
    return handleControllerError(res, error, "deleteVehicle failed");
  }
}

async function getVehicleSummary(req, res) {
  const { value: idVehicle, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const data = await vehicleRepository.getSummary(idVehicle);
    if (!data) {
      return sendError(res, 404, "Vehicle not found", []);
    }

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getVehicleSummary failed");
  }
}

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleSummary
};
