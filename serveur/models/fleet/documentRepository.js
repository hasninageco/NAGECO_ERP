const { sql, createRequest } = require("./db");

function toNullableString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized === "" ? null : normalized;
}

async function findAll(filters = {}) {
  const request = await createRequest();

  request.input("relatedType", sql.NVarChar(50), filters.relatedType || null);
  request.input("relatedId", sql.Int, filters.relatedId || null);
  request.input("idVehicle", sql.Int, filters.idVehicle || null);
  request.input("idEmp", sql.NVarChar(100), toNullableString(filters.idEmp));
  request.input("documentType", sql.NVarChar(50), filters.documentType || null);

  const result = await request.query(`
    SELECT *
    FROM dbo.fleet_document
    WHERE (@relatedType IS NULL OR RELATED_TYPE = @relatedType)
      AND (@relatedId IS NULL OR RELATED_ID = @relatedId)
      AND (@idVehicle IS NULL OR ID_VEHICLE = @idVehicle)
      AND (@idEmp IS NULL OR LTRIM(RTRIM(CONVERT(NVARCHAR(100), ID_EMP))) = @idEmp)
      AND (@documentType IS NULL OR DOCUMENT_TYPE = @documentType)
    ORDER BY ID_DOCUMENT DESC
  `);

  return result.recordset;
}

async function findById(idDocument) {
  const request = await createRequest();
  request.input("idDocument", sql.Int, idDocument);

  const result = await request.query(`
    SELECT TOP 1 *
    FROM dbo.fleet_document
    WHERE ID_DOCUMENT = @idDocument
  `);

  return result.recordset[0] || null;
}

async function create(payload) {
  const request = await createRequest();

  request.input("relatedType", sql.NVarChar(50), payload.relatedType);
  request.input("relatedId", sql.Int, payload.relatedId);
  request.input("idVehicle", sql.Int, payload.idVehicle || null);
  request.input("idEmp", sql.NVarChar(100), toNullableString(payload.idEmp));
  request.input("documentType", sql.NVarChar(50), payload.documentType || null);
  request.input("fileName", sql.NVarChar(200), payload.fileName);
  request.input("filePath", sql.NVarChar(500), payload.filePath);
  request.input("startDate", sql.Date, payload.startDate || null);
  request.input("endDate", sql.Date, payload.endDate || null);
  request.input("uploadedBy", sql.NVarChar(100), toNullableString(payload.uploadedBy));

  const result = await request.query(`
    INSERT INTO dbo.fleet_document (
      RELATED_TYPE,
      RELATED_ID,
      ID_VEHICLE,
      ID_EMP,
      DOCUMENT_TYPE,
      FILE_NAME,
      FILE_PATH,
      START_DATE,
      END_DATE,
      UPLOADED_BY
    )
    OUTPUT inserted.*
    VALUES (
      @relatedType,
      @relatedId,
      @idVehicle,
      @idEmp,
      @documentType,
      @fileName,
      @filePath,
      @startDate,
      @endDate,
      @uploadedBy
    )
  `);

  return result.recordset[0];
}

async function update(idDocument, payload) {
  const request = await createRequest();

  request.input("idDocument", sql.Int, idDocument);
  request.input("relatedType", sql.NVarChar(50), payload.relatedType);
  request.input("relatedId", sql.Int, payload.relatedId);
  request.input("idVehicle", sql.Int, payload.idVehicle || null);
  request.input("idEmp", sql.NVarChar(100), toNullableString(payload.idEmp));
  request.input("documentType", sql.NVarChar(50), payload.documentType || null);
  request.input("fileName", sql.NVarChar(200), payload.fileName);
  request.input("filePath", sql.NVarChar(500), payload.filePath);
  request.input("startDate", sql.Date, payload.startDate || null);
  request.input("endDate", sql.Date, payload.endDate || null);
  request.input("uploadedBy", sql.NVarChar(100), toNullableString(payload.uploadedBy));

  const result = await request.query(`
    UPDATE dbo.fleet_document
    SET
      RELATED_TYPE = @relatedType,
      RELATED_ID = @relatedId,
      ID_VEHICLE = @idVehicle,
      ID_EMP = @idEmp,
      DOCUMENT_TYPE = @documentType,
      FILE_NAME = @fileName,
      FILE_PATH = @filePath,
      START_DATE = @startDate,
      END_DATE = @endDate,
      UPLOADED_BY = @uploadedBy
    OUTPUT inserted.*
    WHERE ID_DOCUMENT = @idDocument
  `);

  return result.recordset[0] || null;
}

async function remove(idDocument) {
  const request = await createRequest();
  request.input("idDocument", sql.Int, idDocument);

  const result = await request.query(`
    DELETE FROM dbo.fleet_document
    OUTPUT deleted.*
    WHERE ID_DOCUMENT = @idDocument
  `);

  return result.recordset[0] || null;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove
};
