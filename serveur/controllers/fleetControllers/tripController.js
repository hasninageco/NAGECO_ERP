const {
  tripRepository,
  vehicleRepository,
  insuranceRepository,
  referenceRepository
} = require("../../models/fleet");
const {
  sendSuccess,
  sendError,
  parseId,
  isValidDate,
  toDate,
  toDateOnly,
  handleControllerError
} = require("./fleetControllerUtils");

const ALLOWED_TRIP_STATUSES = [
  "Requested",
  "Approved",
  "Started",
  "Completed",
  "Cancelled",
  "Rejected"
];

const ALLOWED_TRIP_TYPES = ["Employee", "Visitor", "Mixed"];

function normalizeEmployeeRef(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized === "" ? null : normalized;
}

function isDigitsOnly(value) {
  return /^\d+$/.test(String(value || "").trim());
}

async function normalizeTripEmployeeInput(fieldName, rawValue, supportsTextColumn) {
  const normalized = normalizeEmployeeRef(rawValue);
  if (!normalized) {
    return { value: null, errors: [] };
  }

  if (supportsTextColumn) {
    return { value: normalized, errors: [] };
  }

  if (isDigitsOnly(normalized)) {
    return { value: normalized, errors: [] };
  }

  const resolved = await referenceRepository.resolveEmployeeRefByRefOrName(normalized);
  if (resolved.value) {
    return { value: resolved.value, errors: [] };
  }

  if (resolved.ambiguous) {
    return {
      value: null,
      errors: [{ field: fieldName, message: `${fieldName} matches multiple employees. Please use employee reference.` }]
    };
  }

  return {
    value: null,
    errors: [{ field: fieldName, message: `${fieldName} must be an employee reference or existing employee name.` }]
  };
}

function validateTripPayload(body) {
  const errors = [];
  const normalizedStatus = body.status || "Requested";

  if (body.idVehicle === undefined || body.idVehicle === null || body.idVehicle === "") {
    errors.push({ field: "idVehicle", message: "idVehicle is required" });
  } else {
    const parsed = parseId(body.idVehicle, "idVehicle");
    if (parsed.error) {
      errors.push({ field: "idVehicle", message: parsed.error });
    }
  }

  if (body.idEmpDriver !== undefined && body.idEmpDriver !== null && body.idEmpDriver !== "") {
    if (String(body.idEmpDriver).trim().length > 100) {
      errors.push({ field: "idEmpDriver", message: "idEmpDriver must be 100 characters or less" });
    }
  }

  if (body.requestedBy !== undefined && body.requestedBy !== null && body.requestedBy !== "") {
    if (String(body.requestedBy).trim().length > 100) {
      errors.push({ field: "requestedBy", message: "requestedBy must be 100 characters or less" });
    }
  }

  if (body.tripType && !ALLOWED_TRIP_TYPES.includes(body.tripType)) {
    errors.push({ field: "tripType", message: `tripType must be one of: ${ALLOWED_TRIP_TYPES.join(", ")}` });
  }

  if (body.status && !ALLOWED_TRIP_STATUSES.includes(body.status)) {
    errors.push({ field: "status", message: `status must be one of: ${ALLOWED_TRIP_STATUSES.join(", ")}` });
  }

  if (body.plannedStartDate && !isValidDate(body.plannedStartDate)) {
    errors.push({ field: "plannedStartDate", message: "plannedStartDate must be a valid date" });
  }

  if (body.plannedEndDate && !isValidDate(body.plannedEndDate)) {
    errors.push({ field: "plannedEndDate", message: "plannedEndDate must be a valid date" });
  }

  if (body.plannedStartDate && body.plannedEndDate && isValidDate(body.plannedStartDate) && isValidDate(body.plannedEndDate)) {
    if (toDate(body.plannedEndDate) < toDate(body.plannedStartDate)) {
      errors.push({
        field: "plannedEndDate",
        message: "plannedEndDate must be greater than or equal to plannedStartDate"
      });
    }
  }

  if (body.actualStartDate && !isValidDate(body.actualStartDate)) {
    errors.push({ field: "actualStartDate", message: "actualStartDate must be a valid date" });
  }

  if (body.actualEndDate && !isValidDate(body.actualEndDate)) {
    errors.push({ field: "actualEndDate", message: "actualEndDate must be a valid date" });
  }

  if (body.actualEndDate && !body.actualStartDate) {
    errors.push({
      field: "actualEndDate",
      message: "actualEndDate requires actualStartDate"
    });
  }

  if (body.actualStartDate && body.actualEndDate && isValidDate(body.actualStartDate) && isValidDate(body.actualEndDate)) {
    if (toDate(body.actualEndDate) < toDate(body.actualStartDate)) {
      errors.push({
        field: "actualEndDate",
        message: "actualEndDate must be greater than or equal to actualStartDate"
      });
    }
  }

  if (
    ["Requested", "Approved"].includes(normalizedStatus) &&
    (body.actualStartDate || body.actualEndDate)
  ) {
    errors.push({
      field: "actualStartDate",
      message: "actual dates must be empty when status is Requested or Approved"
    });
  }

  if (normalizedStatus === "Started" && body.actualEndDate) {
    errors.push({
      field: "actualEndDate",
      message: "actualEndDate must be empty when status is Started"
    });
  }

  if (body.startMileage !== undefined && body.startMileage !== null && body.startMileage !== "") {
    const startMileage = Number(body.startMileage);
    if (!Number.isInteger(startMileage) || startMileage < 0) {
      errors.push({ field: "startMileage", message: "startMileage must be a non-negative integer" });
    }
  }

  if (body.endMileage !== undefined && body.endMileage !== null && body.endMileage !== "") {
    const endMileage = Number(body.endMileage);
    if (!Number.isInteger(endMileage) || endMileage < 0) {
      errors.push({ field: "endMileage", message: "endMileage must be a non-negative integer" });
    }
  }

  if (
    body.startMileage !== undefined &&
    body.endMileage !== undefined &&
    body.startMileage !== null &&
    body.endMileage !== null &&
    body.startMileage !== "" &&
    body.endMileage !== ""
  ) {
    const startMileage = Number(body.startMileage);
    const endMileage = Number(body.endMileage);

    if (Number.isInteger(startMileage) && Number.isInteger(endMileage) && endMileage < startMileage) {
      errors.push({ field: "endMileage", message: "endMileage cannot be lower than startMileage" });
    }
  }

  return errors;
}

async function validateTripApprovalRules(trip, tripId) {
  const errors = [];

  if (!trip.PLANNED_START_DATE || !trip.PLANNED_END_DATE) {
    errors.push({ field: "plannedDates", message: "Trip must have planned start and end dates before approval" });
    return { errors, vehicle: null };
  }

  const plannedStartDate = toDate(trip.PLANNED_START_DATE);
  const plannedEndDate = toDate(trip.PLANNED_END_DATE);

  if (!plannedStartDate || !plannedEndDate) {
    errors.push({ field: "plannedDates", message: "Trip planned dates are invalid" });
    return { errors, vehicle: null };
  }

  if (plannedEndDate < plannedStartDate) {
    errors.push({ field: "plannedEndDate", message: "plannedEndDate must be greater than or equal to plannedStartDate" });
  }

  if (trip.START_MILEAGE !== null && trip.END_MILEAGE !== null && Number(trip.END_MILEAGE) < Number(trip.START_MILEAGE)) {
    errors.push({ field: "endMileage", message: "endMileage cannot be lower than startMileage" });
  }

  const vehicle = await vehicleRepository.findById(trip.ID_VEHICLE);
  if (!vehicle) {
    errors.push({ field: "idVehicle", message: "Vehicle does not exist" });
    return { errors, vehicle: null };
  }

  if (vehicle.STATUS !== "Active") {
    errors.push({ field: "vehicleStatus", message: "Only Active vehicles can be approved for a trip" });
  }

  const activeInsurance = await insuranceRepository.getActiveInsuranceByVehicle(trip.ID_VEHICLE);
  if (!activeInsurance) {
    errors.push({ field: "insurance", message: "Vehicle has no active insurance" });
  } else {
    const insuranceEndDate = toDateOnly(activeInsurance.END_DATE);
    const tripPlannedEndDate = toDateOnly(plannedEndDate);

    if (insuranceEndDate && tripPlannedEndDate && insuranceEndDate < tripPlannedEndDate) {
      errors.push({ field: "insuranceEndDate", message: "Insurance end date is before trip planned end date" });
    }
  }

  const overlappingTrip = await tripRepository.findOverlappingTrip(
    trip.ID_VEHICLE,
    plannedStartDate,
    plannedEndDate,
    tripId
  );

  if (overlappingTrip) {
    errors.push({ field: "overlap", message: "An overlapping trip exists for this vehicle" });
  }

  return { errors, vehicle };
}

async function getAllTrips(req, res) {
  try {
    const filters = {
      idVehicle: req.query.idVehicle ? Number(req.query.idVehicle) : null,
      status: req.query.status || null,
      requestedBy: normalizeEmployeeRef(req.query.requestedBy),
      idEmpDriver: normalizeEmployeeRef(req.query.idEmpDriver)
    };

    const data = await tripRepository.findAll(filters);
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getAllTrips failed");
  }
}

async function getTripById(req, res) {
  const { value: idTrip, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const data = await tripRepository.findById(idTrip);
    if (!data) {
      return sendError(res, 404, "Trip not found", []);
    }

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getTripById failed");
  }
}

async function createTrip(req, res) {
  const body = req.body || {};
  const errors = validateTripPayload(body);

  if (errors.length) {
    return sendError(res, 400, "Validation failed", errors);
  }

  try {
    const idVehicle = Number(body.idVehicle);
    const columnMode = await referenceRepository.getTripEmployeeReferenceColumnMode();

    const driverInput = await normalizeTripEmployeeInput(
      "idEmpDriver",
      body.idEmpDriver,
      columnMode.idEmpDriverSupportsText
    );
    const requestedByInput = await normalizeTripEmployeeInput(
      "requestedBy",
      body.requestedBy,
      columnMode.requestedBySupportsText
    );

    const employeeInputErrors = [...driverInput.errors, ...requestedByInput.errors];
    if (employeeInputErrors.length) {
      return sendError(res, 400, "Validation failed", employeeInputErrors);
    }

    const idEmpDriver = driverInput.value;
    const requestedBy = requestedByInput.value;

    const vehicleExists = await referenceRepository.vehicleExists(idVehicle);
    if (!vehicleExists) {
      return sendError(res, 400, "Validation failed", [{ field: "idVehicle", message: "Vehicle not found" }]);
    }

    const data = await tripRepository.create({
      tripNumber: body.tripNumber || null,
      idVehicle,
      idEmpDriver,
      requestedBy,
      tripType: body.tripType || "Employee",
      startLocation: body.startLocation || null,
      destination: body.destination || null,
      purpose: body.purpose || null,
      plannedStartDate: body.plannedStartDate ? toDate(body.plannedStartDate) : null,
      plannedEndDate: body.plannedEndDate ? toDate(body.plannedEndDate) : null,
      actualStartDate: body.actualStartDate ? toDate(body.actualStartDate) : null,
      actualEndDate: body.actualEndDate ? toDate(body.actualEndDate) : null,
      startMileage: body.startMileage !== undefined && body.startMileage !== "" ? Number(body.startMileage) : null,
      endMileage: body.endMileage !== undefined && body.endMileage !== "" ? Number(body.endMileage) : null,
      status: body.status || "Requested"
    });

    return sendSuccess(res, "Operation completed successfully", data, 201);
  } catch (error) {
    return handleControllerError(res, error, "createTrip failed");
  }
}

async function updateTrip(req, res) {
  const { value: idTrip, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  const body = req.body || {};
  const errors = validateTripPayload(body);
  if (errors.length) {
    return sendError(res, 400, "Validation failed", errors);
  }

  try {
    const existing = await tripRepository.findById(idTrip);
    if (!existing) {
      return sendError(res, 404, "Trip not found", []);
    }

    const idVehicle = Number(body.idVehicle);
    const columnMode = await referenceRepository.getTripEmployeeReferenceColumnMode();

    const driverInput = await normalizeTripEmployeeInput(
      "idEmpDriver",
      body.idEmpDriver,
      columnMode.idEmpDriverSupportsText
    );
    const requestedByInput = await normalizeTripEmployeeInput(
      "requestedBy",
      body.requestedBy,
      columnMode.requestedBySupportsText
    );

    const employeeInputErrors = [...driverInput.errors, ...requestedByInput.errors];
    if (employeeInputErrors.length) {
      return sendError(res, 400, "Validation failed", employeeInputErrors);
    }

    const idEmpDriver = driverInput.value;
    const requestedBy = requestedByInput.value;

    const vehicleExists = await referenceRepository.vehicleExists(idVehicle);
    if (!vehicleExists) {
      return sendError(res, 400, "Validation failed", [{ field: "idVehicle", message: "Vehicle not found" }]);
    }

    const data = await tripRepository.update(idTrip, {
      tripNumber: body.tripNumber || null,
      idVehicle,
      idEmpDriver,
      requestedBy,
      tripType: body.tripType || "Employee",
      startLocation: body.startLocation || null,
      destination: body.destination || null,
      purpose: body.purpose || null,
      plannedStartDate: body.plannedStartDate ? toDate(body.plannedStartDate) : null,
      plannedEndDate: body.plannedEndDate ? toDate(body.plannedEndDate) : null,
      actualStartDate: body.actualStartDate ? toDate(body.actualStartDate) : null,
      actualEndDate: body.actualEndDate ? toDate(body.actualEndDate) : null,
      startMileage: body.startMileage !== undefined && body.startMileage !== "" ? Number(body.startMileage) : null,
      endMileage: body.endMileage !== undefined && body.endMileage !== "" ? Number(body.endMileage) : null,
      status: body.status || existing.STATUS || "Requested"
    });

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "updateTrip failed");
  }
}

async function deleteTrip(req, res) {
  const { value: idTrip, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const existing = await tripRepository.findById(idTrip);
    if (!existing) {
      return sendError(res, 404, "Trip not found", []);
    }

    await tripRepository.remove(idTrip);

    const vehicle = await vehicleRepository.findById(existing.ID_VEHICLE);
    if (vehicle && ["Reserved", "In Trip"].includes(vehicle.STATUS)) {
      await vehicleRepository.updateStatus(existing.ID_VEHICLE, "Active");
    }

    return sendSuccess(res, "Operation completed successfully", { id: idTrip });
  } catch (error) {
    return handleControllerError(res, error, "deleteTrip failed");
  }
}

async function approveTrip(req, res) {
  const { value: idTrip, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  const approver = normalizeEmployeeRef((req.body || {}).idEmpApprover);
  if (!approver) {
    return sendError(res, 400, "Validation failed", [{ field: "idEmpApprover", message: "idEmpApprover is required" }]);
  }
  if (approver.length > 100) {
    return sendError(res, 400, "Validation failed", [{ field: "idEmpApprover", message: "idEmpApprover must be 100 characters or less" }]);
  }

  const approvalLevel = (req.body || {}).approvalLevel ? Number((req.body || {}).approvalLevel) : 1;
  const comment = (req.body || {}).comment || null;

  try {
    const trip = await tripRepository.findById(idTrip);
    if (!trip) {
      return sendError(res, 404, "Trip not found", []);
    }

    if (["Completed", "Cancelled", "Rejected"].includes(trip.STATUS)) {
      return sendError(res, 400, "Trip cannot be approved in current status", []);
    }

    const { errors, vehicle } = await validateTripApprovalRules(trip, idTrip);
    if (errors.length) {
      return sendError(res, 400, "Approval validation failed", errors);
    }

    const result = await tripRepository.approveTrip(idTrip, approver, comment, approvalLevel);

    if (vehicle && vehicle.STATUS === "Active") {
      await vehicleRepository.updateStatus(vehicle.ID_VEHICLE, "Reserved");
    }

    return sendSuccess(res, "Operation completed successfully", result);
  } catch (error) {
    return handleControllerError(res, error, "approveTrip failed");
  }
}

async function rejectTrip(req, res) {
  const { value: idTrip, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  const approver = normalizeEmployeeRef((req.body || {}).idEmpApprover);
  if (!approver) {
    return sendError(res, 400, "Validation failed", [{ field: "idEmpApprover", message: "idEmpApprover is required" }]);
  }
  if (approver.length > 100) {
    return sendError(res, 400, "Validation failed", [{ field: "idEmpApprover", message: "idEmpApprover must be 100 characters or less" }]);
  }

  const approvalLevel = (req.body || {}).approvalLevel ? Number((req.body || {}).approvalLevel) : 1;
  const comment = (req.body || {}).comment || null;

  try {
    const trip = await tripRepository.findById(idTrip);
    if (!trip) {
      return sendError(res, 404, "Trip not found", []);
    }

    if (trip.STATUS === "Completed") {
      return sendError(res, 400, "Completed trip cannot be rejected", []);
    }

    const result = await tripRepository.rejectTrip(idTrip, approver, comment, approvalLevel);

    const vehicle = await vehicleRepository.findById(trip.ID_VEHICLE);
    if (vehicle && vehicle.STATUS === "Reserved") {
      await vehicleRepository.updateStatus(vehicle.ID_VEHICLE, "Active");
    }

    return sendSuccess(res, "Operation completed successfully", result);
  } catch (error) {
    return handleControllerError(res, error, "rejectTrip failed");
  }
}

async function startTrip(req, res) {
  const { value: idTrip, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  const body = req.body || {};

  if (body.actualStartDate && !isValidDate(body.actualStartDate)) {
    return sendError(res, 400, "Validation failed", [{ field: "actualStartDate", message: "actualStartDate must be a valid date" }]);
  }

  if (body.startMileage !== undefined && body.startMileage !== null && body.startMileage !== "") {
    const startMileage = Number(body.startMileage);
    if (!Number.isInteger(startMileage) || startMileage < 0) {
      return sendError(res, 400, "Validation failed", [{ field: "startMileage", message: "startMileage must be a non-negative integer" }]);
    }
  }

  try {
    const trip = await tripRepository.findById(idTrip);
    if (!trip) {
      return sendError(res, 404, "Trip not found", []);
    }

    if (trip.STATUS !== "Approved") {
      return sendError(res, 400, "Trip must be Approved before starting", []);
    }

    const insurance = await insuranceRepository.vehicleHasValidInsuranceForTrip(
      trip.ID_VEHICLE,
      trip.PLANNED_END_DATE
    );

    if (!insurance) {
      return sendError(res, 400, "Trip cannot be started because vehicle insurance is invalid", []);
    }

    const updatedTrip = await tripRepository.setStatus(idTrip, "Started", {
      actualStartDate: body.actualStartDate
        ? toDate(body.actualStartDate)
        : (trip.ACTUAL_START_DATE ? null : new Date()),
      startMileage: body.startMileage !== undefined && body.startMileage !== ""
        ? Number(body.startMileage)
        : null
    });

    await vehicleRepository.updateStatus(trip.ID_VEHICLE, "In Trip");

    return sendSuccess(res, "Operation completed successfully", updatedTrip);
  } catch (error) {
    return handleControllerError(res, error, "startTrip failed");
  }
}

async function completeTrip(req, res) {
  const { value: idTrip, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  const body = req.body || {};

  if (body.endMileage === undefined || body.endMileage === null || body.endMileage === "") {
    return sendError(res, 400, "Validation failed", [{ field: "endMileage", message: "endMileage is required" }]);
  }

  const endMileage = Number(body.endMileage);
  if (!Number.isInteger(endMileage) || endMileage < 0) {
    return sendError(res, 400, "Validation failed", [{ field: "endMileage", message: "endMileage must be a non-negative integer" }]);
  }

  if (body.actualEndDate && !isValidDate(body.actualEndDate)) {
    return sendError(res, 400, "Validation failed", [{ field: "actualEndDate", message: "actualEndDate must be a valid date" }]);
  }

  try {
    const trip = await tripRepository.findById(idTrip);
    if (!trip) {
      return sendError(res, 404, "Trip not found", []);
    }

    if (trip.STATUS !== "Started") {
      return sendError(res, 400, "Trip must be Started before completion", []);
    }

    const startMileage = trip.START_MILEAGE === null || trip.START_MILEAGE === undefined
      ? 0
      : Number(trip.START_MILEAGE);

    if (endMileage < startMileage) {
      return sendError(res, 400, "Validation failed", [
        { field: "endMileage", message: "endMileage cannot be lower than startMileage" }
      ]);
    }

    const updatedTrip = await tripRepository.setStatus(idTrip, "Completed", {
      actualEndDate: body.actualEndDate
        ? toDate(body.actualEndDate)
        : (trip.ACTUAL_END_DATE ? null : new Date()),
      endMileage
    });

    await vehicleRepository.updateCurrentMileage(trip.ID_VEHICLE, endMileage);
    await vehicleRepository.updateStatus(trip.ID_VEHICLE, "Active");

    return sendSuccess(res, "Operation completed successfully", updatedTrip);
  } catch (error) {
    return handleControllerError(res, error, "completeTrip failed");
  }
}

async function cancelTrip(req, res) {
  const { value: idTrip, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const trip = await tripRepository.findById(idTrip);
    if (!trip) {
      return sendError(res, 404, "Trip not found", []);
    }

    if (trip.STATUS === "Completed") {
      return sendError(res, 400, "Completed trip cannot be cancelled", []);
    }

    const updatedTrip = await tripRepository.setStatus(idTrip, "Cancelled");

    const vehicle = await vehicleRepository.findById(trip.ID_VEHICLE);
    if (vehicle && vehicle.STATUS === "Reserved") {
      await vehicleRepository.updateStatus(vehicle.ID_VEHICLE, "Active");
    }

    return sendSuccess(res, "Operation completed successfully", updatedTrip);
  } catch (error) {
    return handleControllerError(res, error, "cancelTrip failed");
  }
}

async function getTripEmployees(req, res) {
  const { value: idTrip, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const trip = await tripRepository.findById(idTrip);
    if (!trip) {
      return sendError(res, 404, "Trip not found", []);
    }

    const data = await tripRepository.listTripEmployees(idTrip);
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getTripEmployees failed");
  }
}

async function addTripEmployee(req, res) {
  const { value: idTrip, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  const employee = normalizeEmployeeRef((req.body || {}).idEmp);
  if (!employee) {
    return sendError(res, 400, "Validation failed", [{ field: "idEmp", message: "idEmp is required" }]);
  }
  if (employee.length > 100) {
    return sendError(res, 400, "Validation failed", [{ field: "idEmp", message: "idEmp must be 100 characters or less" }]);
  }

  try {
    const tripExists = await referenceRepository.tripExists(idTrip);
    if (!tripExists) {
      return sendError(res, 404, "Trip not found", []);
    }

    const existingEmployees = await tripRepository.listTripEmployees(idTrip);
    if (existingEmployees.some((row) => String(row.ID_EMP || "").trim() === employee)) {
      return sendError(res, 409, "Duplicate employee for this trip is not allowed", []);
    }

    const data = await tripRepository.addTripEmployee(
      idTrip,
      employee,
      (req.body || {}).roleInTrip || null,
      (req.body || {}).note || null
    );

    return sendSuccess(res, "Operation completed successfully", data, 201);
  } catch (error) {
    return handleControllerError(res, error, "addTripEmployee failed");
  }
}

async function removeTripEmployee(req, res) {
  const { value: idTrip, error: tripError } = parseId(req.params.id, "id");
  const employeeId = normalizeEmployeeRef(req.params.employeeId);

  const errors = [];
  if (tripError) errors.push({ field: "id", message: tripError });
  if (!employeeId) errors.push({ field: "employeeId", message: "employeeId is required" });
  if (employeeId && employeeId.length > 100) {
    errors.push({ field: "employeeId", message: "employeeId must be 100 characters or less" });
  }
  if (errors.length) return sendError(res, 400, "Validation failed", errors);

  try {
    const data = await tripRepository.removeTripEmployee(idTrip, employeeId);
    if (!data) {
      return sendError(res, 404, "Trip employee item not found", []);
    }

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "removeTripEmployee failed");
  }
}

async function getTripVisitors(req, res) {
  const { value: idTrip, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const trip = await tripRepository.findById(idTrip);
    if (!trip) {
      return sendError(res, 404, "Trip not found", []);
    }

    const data = await tripRepository.listTripVisitors(idTrip);
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getTripVisitors failed");
  }
}

async function addTripVisitor(req, res) {
  const { value: idTrip, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  const body = req.body || {};
  if (!body.visitorName || !String(body.visitorName).trim()) {
    return sendError(res, 400, "Validation failed", [{ field: "visitorName", message: "visitorName is required" }]);
  }

  try {
    const tripExists = await referenceRepository.tripExists(idTrip);
    if (!tripExists) {
      return sendError(res, 404, "Trip not found", []);
    }

    const data = await tripRepository.addTripVisitor(idTrip, {
      visitorName: String(body.visitorName).trim(),
      visitorPhone: body.visitorPhone || null,
      visitorCompany: body.visitorCompany || null,
      idType: body.idType || null,
      idNumber: body.idNumber || null,
      roleInTrip: body.roleInTrip || null,
      note: body.note || null
    });

    return sendSuccess(res, "Operation completed successfully", data, 201);
  } catch (error) {
    return handleControllerError(res, error, "addTripVisitor failed");
  }
}

async function removeTripVisitor(req, res) {
  const { value: idTrip, error: tripError } = parseId(req.params.id, "id");
  const { value: visitorId, error: visitorError } = parseId(req.params.visitorId, "visitorId");

  const errors = [];
  if (tripError) errors.push({ field: "id", message: tripError });
  if (visitorError) errors.push({ field: "visitorId", message: visitorError });
  if (errors.length) return sendError(res, 400, "Validation failed", errors);

  try {
    const data = await tripRepository.removeTripVisitor(idTrip, visitorId);
    if (!data) {
      return sendError(res, 404, "Trip visitor item not found", []);
    }

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "removeTripVisitor failed");
  }
}

async function getTripApprovals(req, res) {
  const { value: idTrip, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const trip = await tripRepository.findById(idTrip);
    if (!trip) {
      return sendError(res, 404, "Trip not found", []);
    }

    const data = await tripRepository.findApprovalsByTripId(idTrip);
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getTripApprovals failed");
  }
}

module.exports = {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  approveTrip,
  rejectTrip,
  startTrip,
  completeTrip,
  cancelTrip,
  getTripEmployees,
  addTripEmployee,
  removeTripEmployee,
  getTripVisitors,
  addTripVisitor,
  removeTripVisitor,
  getTripApprovals
};
