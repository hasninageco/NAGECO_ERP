const { sql, createRequest } = require("./db");

let tripEmployeeRefColumnModeCache = null;

function isTextSqlType(dataType) {
  const normalized = String(dataType || "").trim().toLowerCase();
  return ["nvarchar", "varchar", "nchar", "char", "text", "ntext"].includes(normalized);
}

async function employeeExistsByRef(idEmpRef) {
  const normalizedRef = String(idEmpRef === undefined || idEmpRef === null ? "" : idEmpRef).trim();
  if (!normalizedRef) {
    return false;
  }

  const request = await createRequest();
  request.input("idEmpRef", sql.NVarChar(100), normalizedRef);

  const result = await request.query(`
    SELECT TOP 1 ID_EMP
    FROM dbo.EMPLOYEE
    WHERE LTRIM(RTRIM(CONVERT(NVARCHAR(100), ID_EMP))) = @idEmpRef
       OR (
         @idEmpRef NOT LIKE '%[^0-9]%'
         AND CONVERT(NVARCHAR(100), ID_EMP) NOT LIKE '%[^0-9]%'
         AND COALESCE(NULLIF(LTRIM(REPLACE(CONVERT(NVARCHAR(100), ID_EMP), '0', ' ')), ''), '0')
             = COALESCE(NULLIF(LTRIM(REPLACE(@idEmpRef, '0', ' ')), ''), '0')
       )
  `);

  return result.recordset.length > 0;
}

async function resolveEmployeeRefByRefOrName(value) {
  const normalizedValue = String(value === undefined || value === null ? "" : value).trim();
  if (!normalizedValue) {
    return {
      value: null,
      matchedBy: null,
      ambiguous: false,
      notFound: false,
    };
  }

  const byRefRequest = await createRequest();
  byRefRequest.input("idEmpRef", sql.NVarChar(100), normalizedValue);

  const byRefResult = await byRefRequest.query(`
    SELECT TOP 1 CONVERT(NVARCHAR(100), ID_EMP) AS ID_EMP_REF
    FROM dbo.EMPLOYEE
    WHERE LTRIM(RTRIM(CONVERT(NVARCHAR(100), ID_EMP))) = @idEmpRef
       OR (
         @idEmpRef NOT LIKE '%[^0-9]%'
         AND CONVERT(NVARCHAR(100), ID_EMP) NOT LIKE '%[^0-9]%'
         AND COALESCE(NULLIF(LTRIM(REPLACE(CONVERT(NVARCHAR(100), ID_EMP), '0', ' ')), ''), '0')
             = COALESCE(NULLIF(LTRIM(REPLACE(@idEmpRef, '0', ' ')), ''), '0')
       )
  `);

  const refMatch = byRefResult.recordset[0] || null;
  if (refMatch && refMatch.ID_EMP_REF) {
    return {
      value: String(refMatch.ID_EMP_REF),
      matchedBy: "ref",
      ambiguous: false,
      notFound: false,
    };
  }

  const byNameRequest = await createRequest();
  byNameRequest.input("employeeName", sql.NVarChar(200), normalizedValue);

  const byNameResult = await byNameRequest.query(`
    SELECT TOP 2 CONVERT(NVARCHAR(100), ID_EMP) AS ID_EMP_REF
    FROM dbo.EMPLOYEE
    WHERE UPPER(LTRIM(RTRIM(COALESCE(NAME, '')))) = UPPER(@employeeName)
    ORDER BY ID_EMP
  `);

  if (byNameResult.recordset.length === 1) {
    return {
      value: String(byNameResult.recordset[0].ID_EMP_REF),
      matchedBy: "name",
      ambiguous: false,
      notFound: false,
    };
  }

  if (byNameResult.recordset.length > 1) {
    return {
      value: null,
      matchedBy: null,
      ambiguous: true,
      notFound: false,
    };
  }

  return {
    value: null,
    matchedBy: null,
    ambiguous: false,
    notFound: true,
  };
}

async function getTripEmployeeReferenceColumnMode() {
  if (tripEmployeeRefColumnModeCache) {
    return tripEmployeeRefColumnModeCache;
  }

  const request = await createRequest();
  const result = await request.query(`
    SELECT COLUMN_NAME, DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
      AND TABLE_NAME = 'fleet_trip'
      AND COLUMN_NAME IN ('ID_EMP_DRIVER', 'REQUESTED_BY')
  `);

  const columnsByName = result.recordset.reduce((acc, row) => {
    acc[String(row.COLUMN_NAME || '').toUpperCase()] = String(row.DATA_TYPE || '').toLowerCase();
    return acc;
  }, {});

  tripEmployeeRefColumnModeCache = {
    idEmpDriverSupportsText: isTextSqlType(columnsByName.ID_EMP_DRIVER),
    requestedBySupportsText: isTextSqlType(columnsByName.REQUESTED_BY),
  };

  return tripEmployeeRefColumnModeCache;
}


async function vehicleExists(idVehicle) {
  const request = await createRequest();
  request.input("idVehicle", sql.Int, idVehicle);

  const result = await request.query(`
    SELECT TOP 1 ID_VEHICLE
    FROM dbo.fleet_vehicle
    WHERE ID_VEHICLE = @idVehicle
  `);

  return result.recordset.length > 0;
}

async function supplierExists(idSupplier) {
  const request = await createRequest();
  request.input("idSupplier", sql.Int, idSupplier);

  const result = await request.query(`
    SELECT TOP 1 ID_SUPPLIER
    FROM dbo.fleet_supplier
    WHERE ID_SUPPLIER = @idSupplier
  `);

  return result.recordset.length > 0;
}

async function tripExists(idTrip) {
  const request = await createRequest();
  request.input("idTrip", sql.Int, idTrip);

  const result = await request.query(`
    SELECT TOP 1 ID_TRIP
    FROM dbo.fleet_trip
    WHERE ID_TRIP = @idTrip
  `);

  return result.recordset.length > 0;
}

async function maintenanceExists(idMaintenance) {
  const request = await createRequest();
  request.input("idMaintenance", sql.Int, idMaintenance);

  const result = await request.query(`
    SELECT TOP 1 ID_MAINTENANCE
    FROM dbo.fleet_maintenance
    WHERE ID_MAINTENANCE = @idMaintenance
  `);

  return result.recordset.length > 0;
}

async function insuranceExists(idInsurance) {
  const request = await createRequest();
  request.input("idInsurance", sql.Int, idInsurance);

  const result = await request.query(`
    SELECT TOP 1 ID_INSURANCE
    FROM dbo.fleet_vehicle_insurance
    WHERE ID_INSURANCE = @idInsurance
  `);

  return result.recordset.length > 0;
}

async function getEmployeeEndContractColumn() {
  const request = await createRequest();

  const result = await request.query(`
    SELECT TOP 1 c.name AS COLUMN_NAME
    FROM sys.columns c
    WHERE c.object_id = OBJECT_ID('dbo.EMPLOYEE')
      AND c.name IN ('End_contrat', 'END_CONTRAT', 'end_contrat')
  `);

  return result.recordset[0] ? result.recordset[0].COLUMN_NAME : null;
}

module.exports = {
  employeeExistsByRef,
  resolveEmployeeRefByRefOrName,
  getTripEmployeeReferenceColumnMode,
  vehicleExists,
  supplierExists,
  tripExists,
  maintenanceExists,
  insuranceExists,
  getEmployeeEndContractColumn
};
