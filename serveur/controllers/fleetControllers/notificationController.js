const { notificationRepository } = require("../../models/fleet");
const {
  sendSuccess,
  sendError,
  parseId,
  toDate,
  toDateOnly,
  diffInDays,
  parseOptionalBoolean,
  handleControllerError
} = require("./fleetControllerUtils");

const ALLOWED_TRANSACTION_TYPES = [
  "Vehicle Insurance",
  "Maintenance",
  "Trip",
  "Document",
  "Employee Contract"
];

const ALLOWED_PRIORITIES = ["Low", "Medium", "High", "Critical"];

function normalizeEmployeeRef(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized === "" ? null : normalized;
}

async function getNotifications(req, res) {
  try {
    const filters = {
      status: req.query.status || null,
      idEmp: normalizeEmployeeRef(req.query.idEmp),
      transactionType: req.query.transactionType || null
    };

    const data = await notificationRepository.listNotifications(filters);
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getNotifications failed");
  }
}

async function getUnreadNotifications(req, res) {
  const idEmp = normalizeEmployeeRef(req.query.idEmp);
  if (idEmp && idEmp.length > 100) {
    return sendError(res, 400, "Validation failed", [{ field: "idEmp", message: "idEmp must be 100 characters or less" }]);
  }

  try {
    const data = await notificationRepository.listUnreadNotifications(idEmp);
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getUnreadNotifications failed");
  }
}

async function generateNotifications(req, res) {
  try {
    const rules = await notificationRepository.listActiveNotificationRules();
    const sourceRecords = await notificationRepository.getNotificationSourceRecords();

    if (!rules.length) {
      return sendSuccess(res, "Operation completed successfully", {
        generated: 0,
        skipped: 0,
        checkedRules: 0,
        checkedRecords: sourceRecords.length
      });
    }

    const now = new Date();
    const today = toDateOnly(now);
    let generated = 0;
    let skipped = 0;

    for (const sourceRecord of sourceRecords) {
      if (!sourceRecord.END_DATE) {
        continue;
      }

      const endDate = toDate(sourceRecord.END_DATE);
      if (!endDate) {
        continue;
      }

      const remainingDays = diffInDays(today, endDate);
      if (remainingDays === null) {
        continue;
      }

      const matchingRules = rules.filter(
        (rule) => rule.TRANSACTION_TYPE === sourceRecord.TRANSACTION_TYPE
      );

      for (const rule of matchingRules) {
        if (Number(rule.DAYS_BEFORE) !== remainingDays) {
          continue;
        }

        const created = await notificationRepository.createNotificationIfNotExists({
          transactionType: sourceRecord.TRANSACTION_TYPE,
          transactionId: Number(sourceRecord.TRANSACTION_ID),
          idVehicle: sourceRecord.ID_VEHICLE ? Number(sourceRecord.ID_VEHICLE) : null,
          idEmp: normalizeEmployeeRef(sourceRecord.ID_EMP),
          title: sourceRecord.TITLE,
          message: sourceRecord.MESSAGE,
          endDate,
          daysBefore: Number(rule.DAYS_BEFORE),
          remainingDays,
          priority: rule.PRIORITY || "Medium",
          status: "Unread"
        });

        if (created) {
          generated += 1;
        } else {
          skipped += 1;
        }
      }
    }

    return sendSuccess(res, "Operation completed successfully", {
      generated,
      skipped,
      checkedRules: rules.length,
      checkedRecords: sourceRecords.length
    });
  } catch (error) {
    return handleControllerError(res, error, "generateNotifications failed");
  }
}

async function markNotificationRead(req, res) {
  const { value: idNotification, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const data = await notificationRepository.markNotificationAsRead(idNotification);
    if (!data) {
      return sendError(res, 404, "Notification not found", []);
    }

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "markNotificationRead failed");
  }
}

async function dismissNotification(req, res) {
  const { value: idNotification, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const data = await notificationRepository.dismissNotification(idNotification);
    if (!data) {
      return sendError(res, 404, "Notification not found", []);
    }

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "dismissNotification failed");
  }
}

async function getNotificationRules(req, res) {
  try {
    const data = await notificationRepository.listNotificationRules();
    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "getNotificationRules failed");
  }
}

function validateNotificationRulePayload(body) {
  const errors = [];

  if (!body.transactionType || !ALLOWED_TRANSACTION_TYPES.includes(body.transactionType)) {
    errors.push({
      field: "transactionType",
      message: `transactionType must be one of: ${ALLOWED_TRANSACTION_TYPES.join(", ")}`
    });
  }

  if (body.daysBefore === undefined || body.daysBefore === null || body.daysBefore === "") {
    errors.push({ field: "daysBefore", message: "daysBefore is required" });
  } else {
    const daysBefore = Number(body.daysBefore);
    if (!Number.isInteger(daysBefore) || daysBefore < 0) {
      errors.push({ field: "daysBefore", message: "daysBefore must be a non-negative integer" });
    }
  }

  if (body.priority && !ALLOWED_PRIORITIES.includes(body.priority)) {
    errors.push({
      field: "priority",
      message: `priority must be one of: ${ALLOWED_PRIORITIES.join(", ")}`
    });
  }

  if (body.isActive !== undefined) {
    const parsed = parseOptionalBoolean(body.isActive);
    if (parsed === null) {
      errors.push({ field: "isActive", message: "isActive must be boolean" });
    }
  }

  return errors;
}

async function createNotificationRule(req, res) {
  const body = req.body || {};
  const errors = validateNotificationRulePayload(body);

  if (errors.length) {
    return sendError(res, 400, "Validation failed", errors);
  }

  try {
    const data = await notificationRepository.createNotificationRule({
      transactionType: body.transactionType,
      daysBefore: Number(body.daysBefore),
      notifyRole: body.notifyRole || null,
      priority: body.priority || "Medium",
      isActive: body.isActive === undefined
        ? true
        : parseOptionalBoolean(body.isActive)
    });

    return sendSuccess(res, "Operation completed successfully", data, 201);
  } catch (error) {
    return handleControllerError(res, error, "createNotificationRule failed");
  }
}

async function updateNotificationRule(req, res) {
  const { value: idRule, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  const body = req.body || {};
  const errors = validateNotificationRulePayload(body);

  if (errors.length) {
    return sendError(res, 400, "Validation failed", errors);
  }

  try {
    const existing = await notificationRepository.findNotificationRuleById(idRule);
    if (!existing) {
      return sendError(res, 404, "Notification rule not found", []);
    }

    const data = await notificationRepository.updateNotificationRule(idRule, {
      transactionType: body.transactionType,
      daysBefore: Number(body.daysBefore),
      notifyRole: body.notifyRole || null,
      priority: body.priority || "Medium",
      isActive: body.isActive === undefined
        ? true
        : parseOptionalBoolean(body.isActive)
    });

    return sendSuccess(res, "Operation completed successfully", data);
  } catch (error) {
    return handleControllerError(res, error, "updateNotificationRule failed");
  }
}

async function deleteNotificationRule(req, res) {
  const { value: idRule, error: idError } = parseId(req.params.id, "id");
  if (idError) {
    return sendError(res, 400, "Validation failed", [{ field: "id", message: idError }]);
  }

  try {
    const existing = await notificationRepository.findNotificationRuleById(idRule);
    if (!existing) {
      return sendError(res, 404, "Notification rule not found", []);
    }

    await notificationRepository.deleteNotificationRule(idRule);
    return sendSuccess(res, "Operation completed successfully", { id: idRule });
  } catch (error) {
    return handleControllerError(res, error, "deleteNotificationRule failed");
  }
}

module.exports = {
  getNotifications,
  getUnreadNotifications,
  generateNotifications,
  markNotificationRead,
  dismissNotification,
  getNotificationRules,
  createNotificationRule,
  updateNotificationRule,
  deleteNotificationRule
};
