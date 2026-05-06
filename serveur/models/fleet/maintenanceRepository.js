const { sql, createRequest } = require("./db");

async function findAll(filters = {}) {
  const request = await createRequest();
  request.input("idVehicle", sql.Int, filters.idVehicle || null);
  request.input("status", sql.NVarChar(30), filters.status || null);

  const result = await request.query(`
    SELECT *
    FROM dbo.fleet_maintenance
    WHERE (@idVehicle IS NULL OR ID_VEHICLE = @idVehicle)
      AND (@status IS NULL OR STATUS = @status)
    ORDER BY ID_MAINTENANCE DESC
  `);

  return result.recordset;
}

async function findById(idMaintenance) {
  const request = await createRequest();
  request.input("idMaintenance", sql.Int, idMaintenance);

  const result = await request.query(`
    SELECT TOP 1 *
    FROM dbo.fleet_maintenance
    WHERE ID_MAINTENANCE = @idMaintenance
  `);

  return result.recordset[0] || null;
}

async function create(payload) {
  const request = await createRequest();

  request.input("idVehicle", sql.Int, payload.idVehicle);
  request.input("idSupplier", sql.Int, payload.idSupplier || null);
  request.input("maintenanceType", sql.NVarChar(50), payload.maintenanceType);
  request.input("description", sql.NVarChar(sql.MAX), payload.description || null);
  request.input("startDate", sql.Date, payload.startDate || null);
  request.input("endDate", sql.Date, payload.endDate || null);
  request.input("serviceDate", sql.Date, payload.serviceDate || null);
  request.input("mileage", sql.Int, payload.mileage || null);
  request.input("workPerformed", sql.NVarChar(sql.MAX), payload.workPerformed || null);
  request.input("laborCost", sql.Decimal(18, 2), payload.laborCost || 0);
  request.input("partsCost", sql.Decimal(18, 2), payload.partsCost || 0);
  request.input("nextServiceDate", sql.Date, payload.nextServiceDate || null);
  request.input("nextServiceMileage", sql.Int, payload.nextServiceMileage || null);
  request.input("status", sql.NVarChar(30), payload.status || "Planned");

  const result = await request.query(`
    INSERT INTO dbo.fleet_maintenance (
      ID_VEHICLE,
      ID_SUPPLIER,
      MAINTENANCE_TYPE,
      DESCRIPTION,
      START_DATE,
      END_DATE,
      SERVICE_DATE,
      MILEAGE,
      WORK_PERFORMED,
      LABOR_COST,
      PARTS_COST,
      NEXT_SERVICE_DATE,
      NEXT_SERVICE_MILEAGE,
      STATUS
    )
    OUTPUT inserted.*
    VALUES (
      @idVehicle,
      @idSupplier,
      @maintenanceType,
      @description,
      @startDate,
      @endDate,
      @serviceDate,
      @mileage,
      @workPerformed,
      @laborCost,
      @partsCost,
      @nextServiceDate,
      @nextServiceMileage,
      @status
    )
  `);

  return result.recordset[0];
}

async function update(idMaintenance, payload) {
  const request = await createRequest();

  request.input("idMaintenance", sql.Int, idMaintenance);
  request.input("idVehicle", sql.Int, payload.idVehicle);
  request.input("idSupplier", sql.Int, payload.idSupplier || null);
  request.input("maintenanceType", sql.NVarChar(50), payload.maintenanceType);
  request.input("description", sql.NVarChar(sql.MAX), payload.description || null);
  request.input("startDate", sql.Date, payload.startDate || null);
  request.input("endDate", sql.Date, payload.endDate || null);
  request.input("serviceDate", sql.Date, payload.serviceDate || null);
  request.input("mileage", sql.Int, payload.mileage || null);
  request.input("workPerformed", sql.NVarChar(sql.MAX), payload.workPerformed || null);
  request.input("laborCost", sql.Decimal(18, 2), payload.laborCost || 0);
  request.input("partsCost", sql.Decimal(18, 2), payload.partsCost || 0);
  request.input("nextServiceDate", sql.Date, payload.nextServiceDate || null);
  request.input("nextServiceMileage", sql.Int, payload.nextServiceMileage || null);
  request.input("status", sql.NVarChar(30), payload.status || "Planned");

  const result = await request.query(`
    UPDATE dbo.fleet_maintenance
    SET
      ID_VEHICLE = @idVehicle,
      ID_SUPPLIER = @idSupplier,
      MAINTENANCE_TYPE = @maintenanceType,
      DESCRIPTION = @description,
      START_DATE = @startDate,
      END_DATE = @endDate,
      SERVICE_DATE = @serviceDate,
      MILEAGE = @mileage,
      WORK_PERFORMED = @workPerformed,
      LABOR_COST = @laborCost,
      PARTS_COST = @partsCost,
      NEXT_SERVICE_DATE = @nextServiceDate,
      NEXT_SERVICE_MILEAGE = @nextServiceMileage,
      STATUS = @status,
      UPDATED_AT = GETDATE()
    OUTPUT inserted.*
    WHERE ID_MAINTENANCE = @idMaintenance
  `);

  return result.recordset[0] || null;
}

async function setStatus(idMaintenance, status, extraData = {}) {
  const request = await createRequest();

  request.input("idMaintenance", sql.Int, idMaintenance);
  request.input("status", sql.NVarChar(30), status);
  request.input("endDate", sql.Date, extraData.endDate || null);
  request.input("workPerformed", sql.NVarChar(sql.MAX), extraData.workPerformed || null);
  request.input("laborCost", sql.Decimal(18, 2), extraData.laborCost || null);
  request.input("partsCost", sql.Decimal(18, 2), extraData.partsCost || null);
  request.input("nextServiceDate", sql.Date, extraData.nextServiceDate || null);
  request.input("nextServiceMileage", sql.Int, extraData.nextServiceMileage || null);

  const result = await request.query(`
    UPDATE dbo.fleet_maintenance
    SET
      STATUS = @status,
      END_DATE = COALESCE(@endDate, END_DATE),
      WORK_PERFORMED = COALESCE(@workPerformed, WORK_PERFORMED),
      LABOR_COST = COALESCE(@laborCost, LABOR_COST),
      PARTS_COST = COALESCE(@partsCost, PARTS_COST),
      NEXT_SERVICE_DATE = COALESCE(@nextServiceDate, NEXT_SERVICE_DATE),
      NEXT_SERVICE_MILEAGE = COALESCE(@nextServiceMileage, NEXT_SERVICE_MILEAGE),
      UPDATED_AT = GETDATE()
    OUTPUT inserted.*
    WHERE ID_MAINTENANCE = @idMaintenance
  `);

  return result.recordset[0] || null;
}

async function findDue(referenceDate = new Date()) {
  const request = await createRequest();
  request.input("referenceDate", sql.Date, referenceDate);

  const result = await request.query(`
    SELECT
      m.*,
      v.PLATE_NUMBER,
      v.CURRENT_MILEAGE
    FROM dbo.fleet_maintenance m
    INNER JOIN dbo.fleet_vehicle v ON v.ID_VEHICLE = m.ID_VEHICLE
    WHERE m.STATUS IN ('Planned', 'In Progress')
      AND (
        (m.NEXT_SERVICE_DATE IS NOT NULL AND m.NEXT_SERVICE_DATE <= @referenceDate)
        OR
        (m.NEXT_SERVICE_MILEAGE IS NOT NULL AND m.NEXT_SERVICE_MILEAGE <= v.CURRENT_MILEAGE)
      )
    ORDER BY m.NEXT_SERVICE_DATE ASC, m.ID_MAINTENANCE DESC
  `);

  return result.recordset;
}

async function findOverdue(referenceDate = new Date()) {
  const request = await createRequest();
  request.input("referenceDate", sql.Date, referenceDate);

  const result = await request.query(`
    SELECT
      m.*,
      v.PLATE_NUMBER,
      v.CURRENT_MILEAGE
    FROM dbo.fleet_maintenance m
    INNER JOIN dbo.fleet_vehicle v ON v.ID_VEHICLE = m.ID_VEHICLE
    WHERE m.STATUS IN ('Planned', 'In Progress')
      AND (
        (m.NEXT_SERVICE_DATE IS NOT NULL AND m.NEXT_SERVICE_DATE < @referenceDate)
        OR
        (m.NEXT_SERVICE_MILEAGE IS NOT NULL AND m.NEXT_SERVICE_MILEAGE < v.CURRENT_MILEAGE)
      )
    ORDER BY m.NEXT_SERVICE_DATE ASC, m.ID_MAINTENANCE DESC
  `);

  return result.recordset;
}

async function remove(idMaintenance) {
  const request = await createRequest();
  request.input("idMaintenance", sql.Int, idMaintenance);

  const result = await request.query(`
    DELETE FROM dbo.fleet_maintenance
    OUTPUT deleted.*
    WHERE ID_MAINTENANCE = @idMaintenance
  `);

  return result.recordset[0] || null;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  setStatus,
  findDue,
  findOverdue,
  remove
};
