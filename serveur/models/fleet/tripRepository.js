const { sql, createRequest, withTransaction } = require("./db");

function toNullableString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized === "" ? null : normalized;
}

async function findAll(filters = {}) {
  const request = await createRequest();

  request.input("idVehicle", sql.Int, filters.idVehicle || null);
  request.input("status", sql.NVarChar(30), filters.status || null);
  request.input("requestedBy", sql.NVarChar(100), toNullableString(filters.requestedBy));
  request.input("idEmpDriver", sql.NVarChar(100), toNullableString(filters.idEmpDriver));

  const result = await request.query(`
    SELECT *
    FROM dbo.fleet_trip
    WHERE (@idVehicle IS NULL OR ID_VEHICLE = @idVehicle)
      AND (@status IS NULL OR STATUS = @status)
      AND (@requestedBy IS NULL OR LTRIM(RTRIM(CONVERT(NVARCHAR(100), REQUESTED_BY))) = @requestedBy)
      AND (@idEmpDriver IS NULL OR LTRIM(RTRIM(CONVERT(NVARCHAR(100), ID_EMP_DRIVER))) = @idEmpDriver)
    ORDER BY ID_TRIP DESC
  `);

  return result.recordset;
}

async function findById(idTrip) {
  const request = await createRequest();
  request.input("idTrip", sql.Int, idTrip);

  const result = await request.query(`
    SELECT TOP 1 *
    FROM dbo.fleet_trip
    WHERE ID_TRIP = @idTrip
  `);

  return result.recordset[0] || null;
}

async function create(payload) {
  const request = await createRequest();

  request.input("tripNumber", sql.NVarChar(50), payload.tripNumber || null);
  request.input("idVehicle", sql.Int, payload.idVehicle);
  request.input("idEmpDriver", sql.NVarChar(100), toNullableString(payload.idEmpDriver));
  request.input("requestedBy", sql.NVarChar(100), toNullableString(payload.requestedBy));
  request.input("tripType", sql.NVarChar(30), payload.tripType || "Employee");
  request.input("startLocation", sql.NVarChar(200), payload.startLocation || null);
  request.input("destination", sql.NVarChar(200), payload.destination || null);
  request.input("purpose", sql.NVarChar(500), payload.purpose || null);
  request.input("plannedStartDate", sql.DateTime, payload.plannedStartDate || null);
  request.input("plannedEndDate", sql.DateTime, payload.plannedEndDate || null);
  request.input("actualStartDate", sql.DateTime, payload.actualStartDate || null);
  request.input("actualEndDate", sql.DateTime, payload.actualEndDate || null);
  request.input("startMileage", sql.Int, payload.startMileage || null);
  request.input("endMileage", sql.Int, payload.endMileage || null);
  request.input("status", sql.NVarChar(30), payload.status || "Requested");

  const result = await request.query(`
    INSERT INTO dbo.fleet_trip (
      TRIP_NUMBER,
      ID_VEHICLE,
      ID_EMP_DRIVER,
      REQUESTED_BY,
      TRIP_TYPE,
      START_LOCATION,
      DESTINATION,
      PURPOSE,
      PLANNED_START_DATE,
      PLANNED_END_DATE,
      ACTUAL_START_DATE,
      ACTUAL_END_DATE,
      START_MILEAGE,
      END_MILEAGE,
      STATUS
    )
    OUTPUT inserted.*
    VALUES (
      @tripNumber,
      @idVehicle,
      @idEmpDriver,
      @requestedBy,
      @tripType,
      @startLocation,
      @destination,
      @purpose,
      @plannedStartDate,
      @plannedEndDate,
      @actualStartDate,
      @actualEndDate,
      @startMileage,
      @endMileage,
      @status
    )
  `);

  return result.recordset[0];
}

async function update(idTrip, payload) {
  const request = await createRequest();

  request.input("idTrip", sql.Int, idTrip);
  request.input("tripNumber", sql.NVarChar(50), payload.tripNumber || null);
  request.input("idVehicle", sql.Int, payload.idVehicle);
  request.input("idEmpDriver", sql.NVarChar(100), toNullableString(payload.idEmpDriver));
  request.input("requestedBy", sql.NVarChar(100), toNullableString(payload.requestedBy));
  request.input("tripType", sql.NVarChar(30), payload.tripType || "Employee");
  request.input("startLocation", sql.NVarChar(200), payload.startLocation || null);
  request.input("destination", sql.NVarChar(200), payload.destination || null);
  request.input("purpose", sql.NVarChar(500), payload.purpose || null);
  request.input("plannedStartDate", sql.DateTime, payload.plannedStartDate || null);
  request.input("plannedEndDate", sql.DateTime, payload.plannedEndDate || null);
  request.input("actualStartDate", sql.DateTime, payload.actualStartDate || null);
  request.input("actualEndDate", sql.DateTime, payload.actualEndDate || null);
  request.input("startMileage", sql.Int, payload.startMileage || null);
  request.input("endMileage", sql.Int, payload.endMileage || null);
  request.input("status", sql.NVarChar(30), payload.status || "Requested");

  const result = await request.query(`
    UPDATE dbo.fleet_trip
    SET
      TRIP_NUMBER = @tripNumber,
      ID_VEHICLE = @idVehicle,
      ID_EMP_DRIVER = @idEmpDriver,
      REQUESTED_BY = @requestedBy,
      TRIP_TYPE = @tripType,
      START_LOCATION = @startLocation,
      DESTINATION = @destination,
      PURPOSE = @purpose,
      PLANNED_START_DATE = @plannedStartDate,
      PLANNED_END_DATE = @plannedEndDate,
      ACTUAL_START_DATE = @actualStartDate,
      ACTUAL_END_DATE = @actualEndDate,
      START_MILEAGE = @startMileage,
      END_MILEAGE = @endMileage,
      STATUS = @status,
      UPDATED_AT = GETDATE()
    OUTPUT inserted.*
    WHERE ID_TRIP = @idTrip
  `);

  return result.recordset[0] || null;
}

async function setStatus(idTrip, status, options = {}) {
  const request = await createRequest();

  request.input("idTrip", sql.Int, idTrip);
  request.input("status", sql.NVarChar(30), status);
  request.input("actualStartDate", sql.DateTime, options.actualStartDate || null);
  request.input("actualEndDate", sql.DateTime, options.actualEndDate || null);
  request.input("startMileage", sql.Int, options.startMileage || null);
  request.input("endMileage", sql.Int, options.endMileage || null);

  const result = await request.query(`
    UPDATE dbo.fleet_trip
    SET
      STATUS = @status,
      ACTUAL_START_DATE = COALESCE(@actualStartDate, ACTUAL_START_DATE),
      ACTUAL_END_DATE = COALESCE(@actualEndDate, ACTUAL_END_DATE),
      START_MILEAGE = COALESCE(@startMileage, START_MILEAGE),
      END_MILEAGE = COALESCE(@endMileage, END_MILEAGE),
      UPDATED_AT = GETDATE()
    OUTPUT inserted.*
    WHERE ID_TRIP = @idTrip
  `);

  return result.recordset[0] || null;
}

async function findOverlappingTrip(idVehicle, plannedStartDate, plannedEndDate, excludeIdTrip = null) {
  const request = await createRequest();

  request.input("idVehicle", sql.Int, idVehicle);
  request.input("plannedStartDate", sql.DateTime, plannedStartDate);
  request.input("plannedEndDate", sql.DateTime, plannedEndDate);
  request.input("excludeIdTrip", sql.Int, excludeIdTrip);

  const result = await request.query(`
    SELECT TOP 1 *
    FROM dbo.fleet_trip
    WHERE ID_VEHICLE = @idVehicle
      AND STATUS IN ('Approved', 'Started')
      AND PLANNED_START_DATE <= @plannedEndDate
      AND PLANNED_END_DATE >= @plannedStartDate
      AND (@excludeIdTrip IS NULL OR ID_TRIP <> @excludeIdTrip)
    ORDER BY ID_TRIP DESC
  `);

  return result.recordset[0] || null;
}

async function addApproval(payload, transaction = null) {
  const request = await createRequest(transaction);

  request.input("idTrip", sql.Int, payload.idTrip);
  request.input("idEmpApprover", sql.NVarChar(100), toNullableString(payload.idEmpApprover));
  request.input("approvalLevel", sql.Int, payload.approvalLevel || 1);
  request.input("decision", sql.NVarChar(30), payload.decision);
  request.input("comment", sql.NVarChar(500), payload.comment || null);
  request.input("decisionDate", sql.DateTime, payload.decisionDate || new Date());

  const result = await request.query(`
    INSERT INTO dbo.fleet_trip_approval (
      ID_TRIP,
      ID_EMP_APPROVER,
      APPROVAL_LEVEL,
      DECISION,
      COMMENT,
      DECISION_DATE
    )
    OUTPUT inserted.*
    VALUES (
      @idTrip,
      @idEmpApprover,
      @approvalLevel,
      @decision,
      @comment,
      @decisionDate
    )
  `);

  return result.recordset[0];
}

async function findApprovalsByTripId(idTrip) {
  const request = await createRequest();
  request.input("idTrip", sql.Int, idTrip);

  const result = await request.query(`
    SELECT *
    FROM dbo.fleet_trip_approval
    WHERE ID_TRIP = @idTrip
    ORDER BY ID_APPROVAL DESC
  `);

  return result.recordset;
}

async function approveTrip(idTrip, idEmpApprover, comment = null, approvalLevel = 1) {
  return withTransaction(async (transaction) => {
    const approval = await addApproval(
      {
        idTrip,
        idEmpApprover,
        approvalLevel,
        decision: "Approved",
        comment,
        decisionDate: new Date()
      },
      transaction
    );

    const tripUpdateRequest = await createRequest(transaction);
    tripUpdateRequest.input("idTrip", sql.Int, idTrip);

    const tripUpdateResult = await tripUpdateRequest.query(`
      UPDATE dbo.fleet_trip
      SET
        STATUS = 'Approved',
        UPDATED_AT = GETDATE()
      OUTPUT inserted.*
      WHERE ID_TRIP = @idTrip
    `);

    return {
      approval,
      trip: tripUpdateResult.recordset[0] || null
    };
  });
}

async function rejectTrip(idTrip, idEmpApprover, comment = null, approvalLevel = 1) {
  return withTransaction(async (transaction) => {
    const approval = await addApproval(
      {
        idTrip,
        idEmpApprover,
        approvalLevel,
        decision: "Rejected",
        comment,
        decisionDate: new Date()
      },
      transaction
    );

    const tripUpdateRequest = await createRequest(transaction);
    tripUpdateRequest.input("idTrip", sql.Int, idTrip);

    const tripUpdateResult = await tripUpdateRequest.query(`
      UPDATE dbo.fleet_trip
      SET
        STATUS = 'Rejected',
        UPDATED_AT = GETDATE()
      OUTPUT inserted.*
      WHERE ID_TRIP = @idTrip
    `);

    return {
      approval,
      trip: tripUpdateResult.recordset[0] || null
    };
  });
}

async function listTripEmployees(idTrip) {
  const request = await createRequest();
  request.input("idTrip", sql.Int, idTrip);

  const result = await request.query(`
    SELECT
      te.*,
      e.NAME AS EMPLOYEE_NAME
    FROM dbo.fleet_trip_employee_list te
    LEFT JOIN dbo.EMPLOYEE e
      ON LTRIM(RTRIM(CONVERT(NVARCHAR(100), e.ID_EMP))) = LTRIM(RTRIM(te.ID_EMP))
    WHERE te.ID_TRIP = @idTrip
    ORDER BY te.ID_TRIP_EMPLOYEE DESC
  `);

  return result.recordset;
}

async function addTripEmployee(idTrip, idEmp, roleInTrip = null, note = null) {
  const request = await createRequest();

  request.input("idTrip", sql.Int, idTrip);
  request.input("idEmp", sql.NVarChar(100), toNullableString(idEmp));
  request.input("roleInTrip", sql.NVarChar(50), roleInTrip);
  request.input("note", sql.NVarChar(300), note);

  const result = await request.query(`
    INSERT INTO dbo.fleet_trip_employee_list (
      ID_TRIP,
      ID_EMP,
      ROLE_IN_TRIP,
      NOTE
    )
    OUTPUT inserted.*
    VALUES (
      @idTrip,
      @idEmp,
      @roleInTrip,
      @note
    )
  `);

  return result.recordset[0];
}

async function removeTripEmployee(idTrip, idEmp) {
  const request = await createRequest();

  request.input("idTrip", sql.Int, idTrip);
  request.input("idEmp", sql.NVarChar(100), toNullableString(idEmp));

  const result = await request.query(`
    DELETE FROM dbo.fleet_trip_employee_list
    OUTPUT deleted.*
    WHERE ID_TRIP = @idTrip
      AND LTRIM(RTRIM(CONVERT(NVARCHAR(100), ID_EMP))) = @idEmp
  `);

  return result.recordset[0] || null;
}

async function listTripVisitors(idTrip) {
  const request = await createRequest();
  request.input("idTrip", sql.Int, idTrip);

  const result = await request.query(`
    SELECT *
    FROM dbo.fleet_trip_visitor_list
    WHERE ID_TRIP = @idTrip
    ORDER BY ID_TRIP_VISITOR DESC
  `);

  return result.recordset;
}

async function addTripVisitor(idTrip, payload) {
  const request = await createRequest();

  request.input("idTrip", sql.Int, idTrip);
  request.input("visitorName", sql.NVarChar(150), payload.visitorName);
  request.input("visitorPhone", sql.NVarChar(50), payload.visitorPhone || null);
  request.input("visitorCompany", sql.NVarChar(150), payload.visitorCompany || null);
  request.input("idType", sql.NVarChar(50), payload.idType || null);
  request.input("idNumber", sql.NVarChar(100), payload.idNumber || null);
  request.input("roleInTrip", sql.NVarChar(50), payload.roleInTrip || null);
  request.input("note", sql.NVarChar(300), payload.note || null);

  const result = await request.query(`
    INSERT INTO dbo.fleet_trip_visitor_list (
      ID_TRIP,
      VISITOR_NAME,
      VISITOR_PHONE,
      VISITOR_COMPANY,
      ID_TYPE,
      ID_NUMBER,
      ROLE_IN_TRIP,
      NOTE
    )
    OUTPUT inserted.*
    VALUES (
      @idTrip,
      @visitorName,
      @visitorPhone,
      @visitorCompany,
      @idType,
      @idNumber,
      @roleInTrip,
      @note
    )
  `);

  return result.recordset[0];
}

async function removeTripVisitor(idTrip, idTripVisitor) {
  const request = await createRequest();

  request.input("idTrip", sql.Int, idTrip);
  request.input("idTripVisitor", sql.Int, idTripVisitor);

  const result = await request.query(`
    DELETE FROM dbo.fleet_trip_visitor_list
    OUTPUT deleted.*
    WHERE ID_TRIP = @idTrip
      AND ID_TRIP_VISITOR = @idTripVisitor
  `);

  return result.recordset[0] || null;
}

async function remove(idTrip) {
  return withTransaction(async (transaction) => {
    const cleanupRequest = await createRequest(transaction);
    cleanupRequest.input("idTrip", sql.Int, idTrip);

    await cleanupRequest.query(`
      DELETE FROM dbo.fleet_trip_visitor_list
      WHERE ID_TRIP = @idTrip;

      DELETE FROM dbo.fleet_trip_employee_list
      WHERE ID_TRIP = @idTrip;

      DELETE FROM dbo.fleet_trip_approval
      WHERE ID_TRIP = @idTrip;

      IF OBJECT_ID('dbo.fleet_trip_event', 'U') IS NOT NULL
      BEGIN
        DELETE FROM dbo.fleet_trip_event
        WHERE ID_TRIP = @idTrip;
      END;

      IF OBJECT_ID('dbo.fleet_notification', 'U') IS NOT NULL
      BEGIN
        DELETE FROM dbo.fleet_notification
        WHERE TRANSACTION_TYPE = 'Trip'
          AND TRANSACTION_ID = @idTrip;
      END;
    `);

    const request = await createRequest(transaction);
    request.input("idTrip", sql.Int, idTrip);

    const result = await request.query(`
      DELETE FROM dbo.fleet_trip
      OUTPUT deleted.*
      WHERE ID_TRIP = @idTrip
    `);

    return result.recordset[0] || null;
  });
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  setStatus,
  findOverlappingTrip,
  addApproval,
  findApprovalsByTripId,
  approveTrip,
  rejectTrip,
  listTripEmployees,
  addTripEmployee,
  removeTripEmployee,
  listTripVisitors,
  addTripVisitor,
  removeTripVisitor,
  remove
};
