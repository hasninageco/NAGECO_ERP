const { sql, createRequest } = require("./db");

async function findAll() {
  const request = await createRequest();

  const result = await request.query(`
    SELECT *
    FROM dbo.fleet_vehicle
    ORDER BY ID_VEHICLE DESC
  `);

  return result.recordset;
}

async function findById(idVehicle) {
  const request = await createRequest();
  request.input("idVehicle", sql.Int, idVehicle);

  const result = await request.query(`
    SELECT TOP 1 *
    FROM dbo.fleet_vehicle
    WHERE ID_VEHICLE = @idVehicle
  `);

  return result.recordset[0] || null;
}

async function isPlateNumberUsed(plateNumber, excludeIdVehicle = null) {
  const request = await createRequest();
  request.input("plateNumber", sql.NVarChar(50), plateNumber);
  request.input("excludeIdVehicle", sql.Int, excludeIdVehicle);

  const result = await request.query(`
    SELECT TOP 1 ID_VEHICLE
    FROM dbo.fleet_vehicle
    WHERE PLATE_NUMBER = @plateNumber
      AND (@excludeIdVehicle IS NULL OR ID_VEHICLE <> @excludeIdVehicle)
  `);

  return result.recordset.length > 0;
}

async function create(payload) {
  const request = await createRequest();

  request.input("plateNumber", sql.NVarChar(50), payload.plateNumber);
  request.input("brand", sql.NVarChar(100), payload.brand || null);
  request.input("model", sql.NVarChar(100), payload.model || null);
  request.input("vehicleYear", sql.Int, payload.vehicleYear || null);
  request.input("vehicleType", sql.NVarChar(50), payload.vehicleType || null);
  request.input("fuelType", sql.NVarChar(30), payload.fuelType || null);
  request.input("currentMileage", sql.Int, payload.currentMileage || 0);
  request.input("status", sql.NVarChar(30), payload.status || "Active");
  request.input("idEmpResponsible", sql.NVarChar(100), payload.idEmpResponsible || null);

  const result = await request.query(`
    INSERT INTO dbo.fleet_vehicle (
      PLATE_NUMBER,
      BRAND,
      MODEL,
      VEHICLE_YEAR,
      VEHICLE_TYPE,
      FUEL_TYPE,
      CURRENT_MILEAGE,
      STATUS,
      ID_EMP_RESPONSIBLE
    )
    OUTPUT inserted.*
    VALUES (
      @plateNumber,
      @brand,
      @model,
      @vehicleYear,
      @vehicleType,
      @fuelType,
      @currentMileage,
      @status,
      @idEmpResponsible
    )
  `);

  return result.recordset[0];
}

async function update(idVehicle, payload) {
  const request = await createRequest();

  request.input("idVehicle", sql.Int, idVehicle);
  request.input("plateNumber", sql.NVarChar(50), payload.plateNumber);
  request.input("brand", sql.NVarChar(100), payload.brand || null);
  request.input("model", sql.NVarChar(100), payload.model || null);
  request.input("vehicleYear", sql.Int, payload.vehicleYear || null);
  request.input("vehicleType", sql.NVarChar(50), payload.vehicleType || null);
  request.input("fuelType", sql.NVarChar(30), payload.fuelType || null);
  request.input("currentMileage", sql.Int, payload.currentMileage || 0);
  request.input("status", sql.NVarChar(30), payload.status || "Active");
  request.input("idEmpResponsible", sql.NVarChar(100), payload.idEmpResponsible || null);

  const result = await request.query(`
    UPDATE dbo.fleet_vehicle
    SET
      PLATE_NUMBER = @plateNumber,
      BRAND = @brand,
      MODEL = @model,
      VEHICLE_YEAR = @vehicleYear,
      VEHICLE_TYPE = @vehicleType,
      FUEL_TYPE = @fuelType,
      CURRENT_MILEAGE = @currentMileage,
      STATUS = @status,
      ID_EMP_RESPONSIBLE = @idEmpResponsible,
      UPDATED_AT = GETDATE()
    OUTPUT inserted.*
    WHERE ID_VEHICLE = @idVehicle
  `);

  return result.recordset[0] || null;
}

async function remove(idVehicle) {
  const request = await createRequest();
  request.input("idVehicle", sql.Int, idVehicle);

  const result = await request.query(`
    DELETE FROM dbo.fleet_vehicle
    OUTPUT deleted.*
    WHERE ID_VEHICLE = @idVehicle
  `);

  return result.recordset[0] || null;
}

async function updateStatus(idVehicle, status) {
  const request = await createRequest();
  request.input("idVehicle", sql.Int, idVehicle);
  request.input("status", sql.NVarChar(30), status);

  const result = await request.query(`
    UPDATE dbo.fleet_vehicle
    SET
      STATUS = @status,
      UPDATED_AT = GETDATE()
    OUTPUT inserted.*
    WHERE ID_VEHICLE = @idVehicle
  `);

  return result.recordset[0] || null;
}

async function updateCurrentMileage(idVehicle, currentMileage) {
  const request = await createRequest();
  request.input("idVehicle", sql.Int, idVehicle);
  request.input("currentMileage", sql.Int, currentMileage);

  const result = await request.query(`
    UPDATE dbo.fleet_vehicle
    SET
      CURRENT_MILEAGE = @currentMileage,
      UPDATED_AT = GETDATE()
    OUTPUT inserted.*
    WHERE ID_VEHICLE = @idVehicle
  `);

  return result.recordset[0] || null;
}

async function getSummary(idVehicle) {
  const request = await createRequest();
  request.input("idVehicle", sql.Int, idVehicle);

  const result = await request.query(`
    SELECT
      v.*,
      (
        SELECT TOP 1 i.ID_INSURANCE
        FROM dbo.fleet_vehicle_insurance i
        WHERE i.ID_VEHICLE = v.ID_VEHICLE
          AND i.STATUS = 'Active'
          AND i.START_DATE <= CAST(GETDATE() AS DATE)
          AND i.END_DATE >= CAST(GETDATE() AS DATE)
        ORDER BY i.END_DATE DESC
      ) AS ACTIVE_INSURANCE_ID,
      (
        SELECT TOP 1 i.END_DATE
        FROM dbo.fleet_vehicle_insurance i
        WHERE i.ID_VEHICLE = v.ID_VEHICLE
          AND i.STATUS = 'Active'
          AND i.START_DATE <= CAST(GETDATE() AS DATE)
          AND i.END_DATE >= CAST(GETDATE() AS DATE)
        ORDER BY i.END_DATE DESC
      ) AS ACTIVE_INSURANCE_END_DATE,
      (
        SELECT COUNT(1)
        FROM dbo.fleet_maintenance m
        WHERE m.ID_VEHICLE = v.ID_VEHICLE
          AND m.STATUS IN ('Planned', 'In Progress')
      ) AS OPEN_MAINTENANCE_COUNT,
      (
        SELECT COUNT(1)
        FROM dbo.fleet_trip t
        WHERE t.ID_VEHICLE = v.ID_VEHICLE
          AND t.STATUS IN ('Approved', 'Started')
      ) AS ACTIVE_TRIP_COUNT
    FROM dbo.fleet_vehicle v
    WHERE v.ID_VEHICLE = @idVehicle
  `);

  return result.recordset[0] || null;
}

module.exports = {
  findAll,
  findById,
  isPlateNumberUsed,
  create,
  update,
  remove,
  updateStatus,
  updateCurrentMileage,
  getSummary
};
