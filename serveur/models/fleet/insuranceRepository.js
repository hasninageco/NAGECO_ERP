const { sql, createRequest, withTransaction } = require("./db");

async function findAll() {
  const request = await createRequest();

  const result = await request.query(`
    SELECT *
    FROM dbo.fleet_vehicle_insurance
    ORDER BY ID_INSURANCE DESC
  `);

  return result.recordset;
}

async function findById(idInsurance) {
  const request = await createRequest();
  request.input("idInsurance", sql.Int, idInsurance);

  const result = await request.query(`
    SELECT TOP 1 *
    FROM dbo.fleet_vehicle_insurance
    WHERE ID_INSURANCE = @idInsurance
  `);

  return result.recordset[0] || null;
}

async function findByVehicleId(idVehicle) {
  const request = await createRequest();
  request.input("idVehicle", sql.Int, idVehicle);

  const result = await request.query(`
    SELECT *
    FROM dbo.fleet_vehicle_insurance
    WHERE ID_VEHICLE = @idVehicle
    ORDER BY END_DATE DESC, ID_INSURANCE DESC
  `);

  return result.recordset;
}

async function getActiveInsuranceByVehicle(vehicleId) {
  const request = await createRequest();
  request.input("vehicleId", sql.Int, vehicleId);

  const result = await request.query(`
    SELECT TOP 1 *
    FROM dbo.fleet_vehicle_insurance
    WHERE ID_VEHICLE = @vehicleId
      AND STATUS = 'Active'
      AND START_DATE <= CAST(GETDATE() AS DATE)
      AND END_DATE >= CAST(GETDATE() AS DATE)
    ORDER BY END_DATE DESC, ID_INSURANCE DESC
  `);

  return result.recordset[0] || null;
}

async function vehicleHasValidInsuranceForTrip(vehicleId, plannedEndDate) {
  const request = await createRequest();
  request.input("vehicleId", sql.Int, vehicleId);
  request.input("plannedEndDate", sql.DateTime, plannedEndDate);

  const result = await request.query(`
    SELECT TOP 1 *
    FROM dbo.fleet_vehicle_insurance
    WHERE ID_VEHICLE = @vehicleId
      AND STATUS = 'Active'
      AND START_DATE <= CAST(GETDATE() AS DATE)
      AND END_DATE >= CAST(GETDATE() AS DATE)
      AND END_DATE >= CAST(@plannedEndDate AS DATE)
    ORDER BY END_DATE DESC, ID_INSURANCE DESC
  `);

  return result.recordset[0] || null;
}

async function create(payload, transaction = null) {
  const request = await createRequest(transaction);

  request.input("idVehicle", sql.Int, payload.idVehicle);
  request.input("idSupplier", sql.Int, payload.idSupplier || null);
  request.input("policyNumber", sql.NVarChar(100), payload.policyNumber || null);
  request.input("insuranceType", sql.NVarChar(50), payload.insuranceType || null);
  request.input("startDate", sql.Date, payload.startDate);
  request.input("endDate", sql.Date, payload.endDate);
  request.input("premiumAmount", sql.Decimal(18, 2), payload.premiumAmount || null);
  request.input("insuredValue", sql.Decimal(18, 2), payload.insuredValue || null);
  request.input("paymentStatus", sql.NVarChar(30), payload.paymentStatus || null);
  request.input("coverageDetails", sql.NVarChar(sql.MAX), payload.coverageDetails || null);
  request.input("documentFile", sql.NVarChar(500), payload.documentFile || null);
  request.input("status", sql.NVarChar(30), payload.status || "Active");

  const result = await request.query(`
    INSERT INTO dbo.fleet_vehicle_insurance (
      ID_VEHICLE,
      ID_SUPPLIER,
      POLICY_NUMBER,
      INSURANCE_TYPE,
      START_DATE,
      END_DATE,
      PREMIUM_AMOUNT,
      INSURED_VALUE,
      PAYMENT_STATUS,
      COVERAGE_DETAILS,
      DOCUMENT_FILE,
      STATUS
    )
    OUTPUT inserted.*
    VALUES (
      @idVehicle,
      @idSupplier,
      @policyNumber,
      @insuranceType,
      @startDate,
      @endDate,
      @premiumAmount,
      @insuredValue,
      @paymentStatus,
      @coverageDetails,
      @documentFile,
      @status
    )
  `);

  return result.recordset[0];
}

async function update(idInsurance, payload) {
  const request = await createRequest();

  request.input("idInsurance", sql.Int, idInsurance);
  request.input("idVehicle", sql.Int, payload.idVehicle);
  request.input("idSupplier", sql.Int, payload.idSupplier || null);
  request.input("policyNumber", sql.NVarChar(100), payload.policyNumber || null);
  request.input("insuranceType", sql.NVarChar(50), payload.insuranceType || null);
  request.input("startDate", sql.Date, payload.startDate);
  request.input("endDate", sql.Date, payload.endDate);
  request.input("premiumAmount", sql.Decimal(18, 2), payload.premiumAmount || null);
  request.input("insuredValue", sql.Decimal(18, 2), payload.insuredValue || null);
  request.input("paymentStatus", sql.NVarChar(30), payload.paymentStatus || null);
  request.input("coverageDetails", sql.NVarChar(sql.MAX), payload.coverageDetails || null);
  request.input("documentFile", sql.NVarChar(500), payload.documentFile || null);
  request.input("status", sql.NVarChar(30), payload.status || "Active");

  const result = await request.query(`
    UPDATE dbo.fleet_vehicle_insurance
    SET
      ID_VEHICLE = @idVehicle,
      ID_SUPPLIER = @idSupplier,
      POLICY_NUMBER = @policyNumber,
      INSURANCE_TYPE = @insuranceType,
      START_DATE = @startDate,
      END_DATE = @endDate,
      PREMIUM_AMOUNT = @premiumAmount,
      INSURED_VALUE = @insuredValue,
      PAYMENT_STATUS = @paymentStatus,
      COVERAGE_DETAILS = @coverageDetails,
      DOCUMENT_FILE = @documentFile,
      STATUS = @status,
      UPDATED_AT = GETDATE()
    OUTPUT inserted.*
    WHERE ID_INSURANCE = @idInsurance
  `);

  return result.recordset[0] || null;
}

async function setStatus(idInsurance, status) {
  const request = await createRequest();
  request.input("idInsurance", sql.Int, idInsurance);
  request.input("status", sql.NVarChar(30), status);

  const result = await request.query(`
    UPDATE dbo.fleet_vehicle_insurance
    SET
      STATUS = @status,
      UPDATED_AT = GETDATE()
    OUTPUT inserted.*
    WHERE ID_INSURANCE = @idInsurance
  `);

  return result.recordset[0] || null;
}

async function cancelInsurance(idInsurance) {
  return setStatus(idInsurance, "Cancelled");
}

async function renewInsurance(idInsurance, newPolicyPayload) {
  return withTransaction(async (transaction) => {
    const oldPolicyRequest = await createRequest(transaction);
    oldPolicyRequest.input("idInsurance", sql.Int, idInsurance);

    const oldPolicyResult = await oldPolicyRequest.query(`
      SELECT TOP 1 *
      FROM dbo.fleet_vehicle_insurance
      WHERE ID_INSURANCE = @idInsurance
    `);

    const oldPolicy = oldPolicyResult.recordset[0];
    if (!oldPolicy) {
      return null;
    }

    const markRenewedRequest = await createRequest(transaction);
    markRenewedRequest.input("idInsurance", sql.Int, idInsurance);

    await markRenewedRequest.query(`
      UPDATE dbo.fleet_vehicle_insurance
      SET
        STATUS = 'Renewed',
        UPDATED_AT = GETDATE()
      WHERE ID_INSURANCE = @idInsurance
    `);

    const createdPolicy = await create(
      {
        idVehicle: oldPolicy.ID_VEHICLE,
        idSupplier: newPolicyPayload.idSupplier || oldPolicy.ID_SUPPLIER,
        policyNumber: newPolicyPayload.policyNumber,
        insuranceType: newPolicyPayload.insuranceType || oldPolicy.INSURANCE_TYPE,
        startDate: newPolicyPayload.startDate,
        endDate: newPolicyPayload.endDate,
        premiumAmount: newPolicyPayload.premiumAmount,
        insuredValue: newPolicyPayload.insuredValue || oldPolicy.INSURED_VALUE,
        paymentStatus: newPolicyPayload.paymentStatus,
        coverageDetails: newPolicyPayload.coverageDetails || oldPolicy.COVERAGE_DETAILS,
        documentFile: newPolicyPayload.documentFile,
        status: "Active"
      },
      transaction
    );

    return {
      oldPolicyId: oldPolicy.ID_INSURANCE,
      newPolicy: createdPolicy
    };
  });
}

async function updateExpiredInsuranceStatuses() {
  const request = await createRequest();

  const result = await request.query(`
    UPDATE dbo.fleet_vehicle_insurance
    SET
      STATUS = 'Expired',
      UPDATED_AT = GETDATE()
    OUTPUT inserted.*
    WHERE STATUS = 'Active'
      AND END_DATE < CAST(GETDATE() AS DATE)
  `);

  return result.recordset;
}

async function findExpiringSoon(daysBefore = 30) {
  const request = await createRequest();
  request.input("daysBefore", sql.Int, daysBefore);

  const result = await request.query(`
    SELECT
      i.*,
      DATEDIFF(DAY, CAST(GETDATE() AS DATE), i.END_DATE) AS REMAINING_DAYS
    FROM dbo.fleet_vehicle_insurance i
    WHERE i.END_DATE IS NOT NULL
      AND i.END_DATE >= CAST(GETDATE() AS DATE)
      AND i.END_DATE <= DATEADD(DAY, @daysBefore, CAST(GETDATE() AS DATE))
    ORDER BY i.END_DATE ASC
  `);

  return result.recordset;
}

async function findExpired() {
  const request = await createRequest();

  const result = await request.query(`
    SELECT
      i.*,
      DATEDIFF(DAY, i.END_DATE, CAST(GETDATE() AS DATE)) AS EXPIRED_DAYS
    FROM dbo.fleet_vehicle_insurance i
    WHERE i.END_DATE < CAST(GETDATE() AS DATE)
       OR i.STATUS = 'Expired'
    ORDER BY i.END_DATE DESC
  `);

  return result.recordset;
}

module.exports = {
  findAll,
  findById,
  findByVehicleId,
  getActiveInsuranceByVehicle,
  vehicleHasValidInsuranceForTrip,
  create,
  update,
  setStatus,
  cancelInsurance,
  renewInsurance,
  updateExpiredInsuranceStatuses,
  findExpiringSoon,
  findExpired
};
