const { sql, createRequest } = require("./db");

function toNullableString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized === "" ? null : normalized;
}

async function listNotificationRules() {
  const request = await createRequest();

  const result = await request.query(`
    SELECT *
    FROM dbo.fleet_notification_rule
    ORDER BY ID_RULE DESC
  `);

  return result.recordset;
}

async function listActiveNotificationRules() {
  const request = await createRequest();

  const result = await request.query(`
    SELECT *
    FROM dbo.fleet_notification_rule
    WHERE IS_ACTIVE = 1
    ORDER BY TRANSACTION_TYPE, DAYS_BEFORE
  `);

  return result.recordset;
}

async function findNotificationRuleById(idRule) {
  const request = await createRequest();
  request.input("idRule", sql.Int, idRule);

  const result = await request.query(`
    SELECT TOP 1 *
    FROM dbo.fleet_notification_rule
    WHERE ID_RULE = @idRule
  `);

  return result.recordset[0] || null;
}

async function createNotificationRule(payload) {
  const request = await createRequest();

  request.input("transactionType", sql.NVarChar(50), payload.transactionType);
  request.input("daysBefore", sql.Int, payload.daysBefore);
  request.input("notifyRole", sql.NVarChar(50), payload.notifyRole || null);
  request.input("priority", sql.NVarChar(20), payload.priority || "Medium");
  request.input("isActive", sql.Bit, payload.isActive === undefined ? true : payload.isActive);

  const result = await request.query(`
    INSERT INTO dbo.fleet_notification_rule (
      TRANSACTION_TYPE,
      DAYS_BEFORE,
      NOTIFY_ROLE,
      PRIORITY,
      IS_ACTIVE
    )
    OUTPUT inserted.*
    VALUES (
      @transactionType,
      @daysBefore,
      @notifyRole,
      @priority,
      @isActive
    )
  `);

  return result.recordset[0];
}

async function updateNotificationRule(idRule, payload) {
  const request = await createRequest();

  request.input("idRule", sql.Int, idRule);
  request.input("transactionType", sql.NVarChar(50), payload.transactionType);
  request.input("daysBefore", sql.Int, payload.daysBefore);
  request.input("notifyRole", sql.NVarChar(50), payload.notifyRole || null);
  request.input("priority", sql.NVarChar(20), payload.priority || "Medium");
  request.input("isActive", sql.Bit, payload.isActive === undefined ? true : payload.isActive);

  const result = await request.query(`
    UPDATE dbo.fleet_notification_rule
    SET
      TRANSACTION_TYPE = @transactionType,
      DAYS_BEFORE = @daysBefore,
      NOTIFY_ROLE = @notifyRole,
      PRIORITY = @priority,
      IS_ACTIVE = @isActive,
      UPDATED_AT = GETDATE()
    OUTPUT inserted.*
    WHERE ID_RULE = @idRule
  `);

  return result.recordset[0] || null;
}

async function deleteNotificationRule(idRule) {
  const request = await createRequest();
  request.input("idRule", sql.Int, idRule);

  const result = await request.query(`
    DELETE FROM dbo.fleet_notification_rule
    OUTPUT deleted.*
    WHERE ID_RULE = @idRule
  `);

  return result.recordset[0] || null;
}

async function listNotifications(filters = {}) {
  const request = await createRequest();

  request.input("status", sql.NVarChar(30), filters.status || null);
  request.input("idEmp", sql.NVarChar(100), toNullableString(filters.idEmp));
  request.input("transactionType", sql.NVarChar(50), filters.transactionType || null);

  const result = await request.query(`
    SELECT *
    FROM dbo.fleet_notification
    WHERE (@status IS NULL OR STATUS = @status)
      AND (@idEmp IS NULL OR LTRIM(RTRIM(CONVERT(NVARCHAR(100), ID_EMP))) = @idEmp)
      AND (@transactionType IS NULL OR TRANSACTION_TYPE = @transactionType)
    ORDER BY ID_NOTIFICATION DESC
  `);

  return result.recordset;
}

async function listUnreadNotifications(idEmp = null) {
  const request = await createRequest();
  request.input("idEmp", sql.NVarChar(100), toNullableString(idEmp));

  const result = await request.query(`
    SELECT *
    FROM dbo.fleet_notification
    WHERE STATUS = 'Unread'
      AND (@idEmp IS NULL OR LTRIM(RTRIM(CONVERT(NVARCHAR(100), ID_EMP))) = @idEmp)
    ORDER BY ID_NOTIFICATION DESC
  `);

  return result.recordset;
}

async function notificationExistsUnique(transactionType, transactionId, endDate, daysBefore) {
  const request = await createRequest();

  request.input("transactionType", sql.NVarChar(50), transactionType);
  request.input("transactionId", sql.Int, transactionId);
  request.input("endDate", sql.Date, endDate);
  request.input("daysBefore", sql.Int, daysBefore);

  const result = await request.query(`
    SELECT TOP 1 ID_NOTIFICATION
    FROM dbo.fleet_notification
    WHERE TRANSACTION_TYPE = @transactionType
      AND TRANSACTION_ID = @transactionId
      AND END_DATE = @endDate
      AND DAYS_BEFORE = @daysBefore
  `);

  return result.recordset.length > 0;
}

async function createNotification(payload) {
  const request = await createRequest();

  request.input("transactionType", sql.NVarChar(50), payload.transactionType);
  request.input("transactionId", sql.Int, payload.transactionId);
  request.input("idVehicle", sql.Int, payload.idVehicle || null);
  request.input("idEmp", sql.NVarChar(100), toNullableString(payload.idEmp));
  request.input("title", sql.NVarChar(200), payload.title);
  request.input("message", sql.NVarChar(sql.MAX), payload.message || null);
  request.input("endDate", sql.Date, payload.endDate);
  request.input("daysBefore", sql.Int, payload.daysBefore);
  request.input("remainingDays", sql.Int, payload.remainingDays || null);
  request.input("priority", sql.NVarChar(20), payload.priority || "Medium");
  request.input("status", sql.NVarChar(30), payload.status || "Unread");

  const result = await request.query(`
    INSERT INTO dbo.fleet_notification (
      TRANSACTION_TYPE,
      TRANSACTION_ID,
      ID_VEHICLE,
      ID_EMP,
      TITLE,
      MESSAGE,
      END_DATE,
      DAYS_BEFORE,
      REMAINING_DAYS,
      PRIORITY,
      STATUS
    )
    OUTPUT inserted.*
    VALUES (
      @transactionType,
      @transactionId,
      @idVehicle,
      @idEmp,
      @title,
      @message,
      @endDate,
      @daysBefore,
      @remainingDays,
      @priority,
      @status
    )
  `);

  return result.recordset[0];
}

async function createNotificationIfNotExists(payload) {
  const exists = await notificationExistsUnique(
    payload.transactionType,
    payload.transactionId,
    payload.endDate,
    payload.daysBefore
  );

  if (exists) {
    return null;
  }

  return createNotification(payload);
}

async function markNotificationAsRead(idNotification) {
  const request = await createRequest();
  request.input("idNotification", sql.Int, idNotification);

  const result = await request.query(`
    UPDATE dbo.fleet_notification
    SET
      STATUS = 'Read',
      READ_AT = GETDATE()
    OUTPUT inserted.*
    WHERE ID_NOTIFICATION = @idNotification
  `);

  return result.recordset[0] || null;
}

async function dismissNotification(idNotification) {
  const request = await createRequest();
  request.input("idNotification", sql.Int, idNotification);

  const result = await request.query(`
    UPDATE dbo.fleet_notification
    SET
      STATUS = 'Dismissed'
    OUTPUT inserted.*
    WHERE ID_NOTIFICATION = @idNotification
  `);

  return result.recordset[0] || null;
}

async function getInsuranceEndDateCandidates() {
  const request = await createRequest();

  const result = await request.query(`
    SELECT
      'Vehicle Insurance' AS TRANSACTION_TYPE,
      i.ID_INSURANCE AS TRANSACTION_ID,
      i.ID_VEHICLE,
      CAST(NULL AS NVARCHAR(100)) AS ID_EMP,
      i.END_DATE,
      CONCAT('Vehicle insurance expiry - ', ISNULL(v.PLATE_NUMBER, 'Unknown Vehicle')) AS TITLE,
      CONCAT('Policy ', ISNULL(i.POLICY_NUMBER, 'N/A'), ' expires on ', CONVERT(VARCHAR(10), i.END_DATE, 120)) AS MESSAGE
    FROM dbo.fleet_vehicle_insurance i
    LEFT JOIN dbo.fleet_vehicle v ON v.ID_VEHICLE = i.ID_VEHICLE
    WHERE i.END_DATE IS NOT NULL
  `);

  return result.recordset;
}

async function getMaintenanceEndDateCandidates() {
  const request = await createRequest();

  const result = await request.query(`
    SELECT
      'Maintenance' AS TRANSACTION_TYPE,
      m.ID_MAINTENANCE AS TRANSACTION_ID,
      m.ID_VEHICLE,
      CAST(NULL AS NVARCHAR(100)) AS ID_EMP,
      m.END_DATE,
      CONCAT('Maintenance end date - ', ISNULL(v.PLATE_NUMBER, 'Unknown Vehicle')) AS TITLE,
      CONCAT('Maintenance for vehicle ', ISNULL(v.PLATE_NUMBER, 'Unknown'), ' has end date ', CONVERT(VARCHAR(10), m.END_DATE, 120)) AS MESSAGE
    FROM dbo.fleet_maintenance m
    LEFT JOIN dbo.fleet_vehicle v ON v.ID_VEHICLE = m.ID_VEHICLE
    WHERE m.END_DATE IS NOT NULL
  `);

  return result.recordset;
}

async function getMaintenanceNextServiceDateCandidates() {
  const request = await createRequest();

  const result = await request.query(`
    SELECT
      'Maintenance' AS TRANSACTION_TYPE,
      m.ID_MAINTENANCE AS TRANSACTION_ID,
      m.ID_VEHICLE,
      CAST(NULL AS NVARCHAR(100)) AS ID_EMP,
      m.NEXT_SERVICE_DATE AS END_DATE,
      CONCAT('Next service date - ', ISNULL(v.PLATE_NUMBER, 'Unknown Vehicle')) AS TITLE,
      CONCAT('Next service is due for vehicle ', ISNULL(v.PLATE_NUMBER, 'Unknown'), ' on ', CONVERT(VARCHAR(10), m.NEXT_SERVICE_DATE, 120)) AS MESSAGE
    FROM dbo.fleet_maintenance m
    LEFT JOIN dbo.fleet_vehicle v ON v.ID_VEHICLE = m.ID_VEHICLE
    WHERE m.NEXT_SERVICE_DATE IS NOT NULL
  `);

  return result.recordset;
}

async function getTripPlannedEndDateCandidates() {
  const request = await createRequest();

  const result = await request.query(`
    SELECT
      'Trip' AS TRANSACTION_TYPE,
      t.ID_TRIP AS TRANSACTION_ID,
      t.ID_VEHICLE,
      t.REQUESTED_BY AS ID_EMP,
      CAST(t.PLANNED_END_DATE AS DATE) AS END_DATE,
      CONCAT('Trip planned end date - ', ISNULL(t.TRIP_NUMBER, CONCAT('Trip #', t.ID_TRIP))) AS TITLE,
      CONCAT('Trip ', ISNULL(t.TRIP_NUMBER, CONCAT('#', t.ID_TRIP)), ' is planned to end on ', CONVERT(VARCHAR(10), t.PLANNED_END_DATE, 120)) AS MESSAGE
    FROM dbo.fleet_trip t
    WHERE t.PLANNED_END_DATE IS NOT NULL
  `);

  return result.recordset;
}

async function getDocumentEndDateCandidates() {
  const request = await createRequest();

  const result = await request.query(`
    SELECT
      'Document' AS TRANSACTION_TYPE,
      d.ID_DOCUMENT AS TRANSACTION_ID,
      d.ID_VEHICLE,
      d.ID_EMP,
      d.END_DATE,
      CONCAT('Document expiry - ', d.FILE_NAME) AS TITLE,
      CONCAT('Document ', d.FILE_NAME, ' expires on ', CONVERT(VARCHAR(10), d.END_DATE, 120)) AS MESSAGE
    FROM dbo.fleet_document d
    WHERE d.END_DATE IS NOT NULL
  `);

  return result.recordset;
}

async function getEmployeeContractCandidates() {
  const metadataRequest = await createRequest();

  const metadataResult = await metadataRequest.query(`
    SELECT TOP 1 c.name AS COLUMN_NAME
    FROM sys.columns c
    WHERE c.object_id = OBJECT_ID('dbo.EMPLOYEE')
      AND c.name IN ('End_contrat', 'END_CONTRAT', 'end_contrat')
  `);

  if (!metadataResult.recordset.length) {
    return [];
  }

  const columnName = metadataResult.recordset[0].COLUMN_NAME;
  if (!["End_contrat", "END_CONTRAT", "end_contrat"].includes(columnName)) {
    return [];
  }

  const request = await createRequest();

  const result = await request.query(`
    SELECT
      'Employee Contract' AS TRANSACTION_TYPE,
      e.ID_EMP AS TRANSACTION_ID,
      CAST(NULL AS INT) AS ID_VEHICLE,
      CONVERT(NVARCHAR(100), e.ID_EMP) AS ID_EMP,
      CAST(e.[${columnName}] AS DATE) AS END_DATE,
      CONCAT('Employee contract end date - ', ISNULL(e.NAME, CONCAT('EMP #', e.ID_EMP))) AS TITLE,
      CONCAT('Employee contract ends on ', CONVERT(VARCHAR(10), e.[${columnName}], 120)) AS MESSAGE
    FROM dbo.EMPLOYEE e
    WHERE e.[${columnName}] IS NOT NULL
  `);

  return result.recordset;
}

async function getNotificationSourceRecords() {
  const insurance = await getInsuranceEndDateCandidates();
  const maintenanceEnd = await getMaintenanceEndDateCandidates();
  const maintenanceNext = await getMaintenanceNextServiceDateCandidates();
  const trips = await getTripPlannedEndDateCandidates();
  const documents = await getDocumentEndDateCandidates();
  const employeeContracts = await getEmployeeContractCandidates();

  return [
    ...insurance,
    ...maintenanceEnd,
    ...maintenanceNext,
    ...trips,
    ...documents,
    ...employeeContracts
  ];
}

module.exports = {
  listNotificationRules,
  listActiveNotificationRules,
  findNotificationRuleById,
  createNotificationRule,
  updateNotificationRule,
  deleteNotificationRule,
  listNotifications,
  listUnreadNotifications,
  notificationExistsUnique,
  createNotification,
  createNotificationIfNotExists,
  markNotificationAsRead,
  dismissNotification,
  getInsuranceEndDateCandidates,
  getMaintenanceEndDateCandidates,
  getMaintenanceNextServiceDateCandidates,
  getTripPlannedEndDateCandidates,
  getDocumentEndDateCandidates,
  getEmployeeContractCandidates,
  getNotificationSourceRecords
};
