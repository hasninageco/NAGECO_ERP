function sendSuccess(res, message, data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function sendError(res, statusCode, message, errors = []) {
  const normalizedErrors = Array.isArray(errors)
    ? errors
    : errors
      ? [errors]
      : [];

  return res.status(statusCode).json({
    success: false,
    message,
    errors: normalizedErrors
  });
}

function parseId(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return {
      value: null,
      error: `${fieldName} must be a positive integer`
    };
  }

  return { value: parsed, error: null };
}

function isValidDate(value) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function toDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function toDateOnly(dateLike) {
  const date = toDate(dateLike);
  if (!date) {
    return null;
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function diffInDays(fromDateLike, toDateLike) {
  const fromDate = toDateOnly(fromDateLike);
  const toDate = toDateOnly(toDateLike);

  if (!fromDate || !toDate) {
    return null;
  }

  const millisecondsInDay = 24 * 60 * 60 * 1000;
  return Math.floor((toDate.getTime() - fromDate.getTime()) / millisecondsInDay);
}

function parseOptionalBoolean(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }

  return null;
}

function formatSqlError(error) {
  const message = String(error && error.message ? error.message : "");

  if (message.includes("CK_fleet_trip_actual_date")) {
    return "Actual End Date must be on or after Actual Start Date";
  }

  if (message.includes("UQ_fleet_trip_employee_list") || message.includes("duplicate key")) {
    return "Duplicate record is not allowed";
  }

  if (message.includes("FK_") || message.includes("REFERENCE constraint")) {
    return "Referenced record does not exist or cannot be deleted";
  }

  return message || "Unexpected server error";
}

function handleControllerError(res, error, defaultMessage) {
  console.error(defaultMessage, error);
  return sendError(res, 500, formatSqlError(error), []);
}

module.exports = {
  sendSuccess,
  sendError,
  parseId,
  isValidDate,
  toDate,
  toDateOnly,
  diffInDays,
  parseOptionalBoolean,
  formatSqlError,
  handleControllerError
};
