const { sql, createRequest } = require("./db");

async function findAll() {
  const request = await createRequest();

  const result = await request.query(`
    SELECT *
    FROM dbo.fleet_supplier
    ORDER BY ID_SUPPLIER DESC
  `);

  return result.recordset;
}

async function findById(idSupplier) {
  const request = await createRequest();
  request.input("idSupplier", sql.Int, idSupplier);

  const result = await request.query(`
    SELECT TOP 1 *
    FROM dbo.fleet_supplier
    WHERE ID_SUPPLIER = @idSupplier
  `);

  return result.recordset[0] || null;
}

async function create(payload) {
  const request = await createRequest();

  request.input("name", sql.NVarChar(150), payload.name);
  request.input("supplierType", sql.NVarChar(50), payload.supplierType || null);
  request.input("contactPerson", sql.NVarChar(100), payload.contactPerson || null);
  request.input("phone", sql.NVarChar(50), payload.phone || null);
  request.input("email", sql.NVarChar(150), payload.email || null);
  request.input("address", sql.NVarChar(300), payload.address || null);
  request.input("status", sql.NVarChar(30), payload.status || "Active");

  const result = await request.query(`
    INSERT INTO dbo.fleet_supplier (
      NAME,
      SUPPLIER_TYPE,
      CONTACT_PERSON,
      PHONE,
      EMAIL,
      ADDRESS,
      STATUS
    )
    OUTPUT inserted.*
    VALUES (
      @name,
      @supplierType,
      @contactPerson,
      @phone,
      @email,
      @address,
      @status
    )
  `);

  return result.recordset[0];
}

async function update(idSupplier, payload) {
  const request = await createRequest();

  request.input("idSupplier", sql.Int, idSupplier);
  request.input("name", sql.NVarChar(150), payload.name);
  request.input("supplierType", sql.NVarChar(50), payload.supplierType || null);
  request.input("contactPerson", sql.NVarChar(100), payload.contactPerson || null);
  request.input("phone", sql.NVarChar(50), payload.phone || null);
  request.input("email", sql.NVarChar(150), payload.email || null);
  request.input("address", sql.NVarChar(300), payload.address || null);
  request.input("status", sql.NVarChar(30), payload.status || "Active");

  const result = await request.query(`
    UPDATE dbo.fleet_supplier
    SET
      NAME = @name,
      SUPPLIER_TYPE = @supplierType,
      CONTACT_PERSON = @contactPerson,
      PHONE = @phone,
      EMAIL = @email,
      ADDRESS = @address,
      STATUS = @status,
      UPDATED_AT = GETDATE()
    OUTPUT inserted.*
    WHERE ID_SUPPLIER = @idSupplier
  `);

  return result.recordset[0] || null;
}

async function remove(idSupplier) {
  const request = await createRequest();
  request.input("idSupplier", sql.Int, idSupplier);

  const result = await request.query(`
    DELETE FROM dbo.fleet_supplier
    OUTPUT deleted.*
    WHERE ID_SUPPLIER = @idSupplier
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
