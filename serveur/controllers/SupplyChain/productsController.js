const products = require("../../models/SupplyCahin/Product");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

let selectableColumnsCache = null;

const getSelectableColumns = async () => {
  if (Array.isArray(selectableColumnsCache)) return selectableColumnsCache;

  try {
    const qi = products.sequelize.getQueryInterface();
    const described = await qi.describeTable(products.getTableName());
    const tableColumns = Object.keys(described || {});
    const modelColumns = Object.keys(products.rawAttributes || {});

    selectableColumnsCache = modelColumns.filter((name) => tableColumns.includes(name));
    return selectableColumnsCache;
  } catch (_err) {
    selectableColumnsCache = null;
    return null;
  }
};

// Utility: authenticate and decode token
const authenticate = (req, res, callback) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });
    callback(decoded);
  });
};

// Fetch all records
exports.find = (req, res) => {
  authenticate(req, res, async () => {
    try {
      const rawPage = Number.parseInt(req.query.page, 10);
      const rawLimit = Number.parseInt(req.query.limit, 10);
      const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
      const limit = Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= 200 ? rawLimit : 20;
      const offset = (page - 1) * limit;

      const where = {};
      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      if (q) {
        where[Op.or] = [
          { desig_art: { [Op.like]: `%${q}%` } },
          { BARCODE: { [Op.like]: `%${q}%` } },
          { Alternante_Code: { [Op.like]: `%${q}%` } },
          { SCIENTIFIC_NAME: { [Op.like]: `%${q}%` } },
        ];
      }

      const sectionId = Number.parseInt(req.query.sectionId, 10);
      if (Number.isFinite(sectionId)) {
        where.ID_SECTION = sectionId;
      }

      if (typeof req.query.category === "string" && req.query.category.trim()) {
        where.CLASSEMENT = req.query.category.trim();
      }

      const missingSection = req.query.missingSection;
      const wantsMissingSection = missingSection === "1" || missingSection === "true";
      if (wantsMissingSection) {
        where.ID_SECTION = { [Op.or]: [null, ""] };
      }

      const selectableColumns = await getSelectableColumns();

      const queryOptions = {
        where,
        limit,
        offset,
        order: [["Id_art", "DESC"]],
      };

      if (Array.isArray(selectableColumns) && selectableColumns.length > 0) {
        queryOptions.attributes = selectableColumns;
      }

      const data = await products.findAndCountAll(queryOptions);
      const total = Number(data.count || 0);
      const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

      res.json({
        data: data.rows,
        products: data.rows,
        total,
        page,
        limit,
        totalPages,
      });
    } catch (dbErr) {
      console.error("DB ERROR:", dbErr);
      res.status(500).json({ message: dbErr.message || "Error fetching records" });
    }
  });
};

// Create a new record
exports.create = (req, res) => {
  authenticate(req, res, async () => {
    const {
        desig_art, BARCODE, Alternante_Code, ID_SECTION, Place_item,
      SECT, Price, QTY_SECURIT, SCIENTIFIC_NAME, PREPARATEUR, Comment,
      Is_Verified,   SIZE_ART, contents, CLASSEMENT, CURRENCY,
      MANUFACRURE, COUNTRY, tt, day_expired, pharmacy
    } = req.body;

    try {
      await products.create({
        
        desig_art,
        BARCODE,
        Alternante_Code,
        ID_SECTION,
        Place_item,
        SECT,
        Price,
        QTY_SECURIT,
        SCIENTIFIC_NAME,
        PREPARATEUR,
        Comment,
        Is_Verified,
         
        SIZE_ART,
        contents,
        CLASSEMENT,
        CURRENCY,
        MANUFACRURE,
        COUNTRY,
        tt,
        day_expired,
        pharmacy
      });

      res.status(200).json({ message: "Record added successfully" });
    } catch (err) {
      console.error("Create Record Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while creating the record"
      });
    }
  });
};

// Update an existing record
exports.update = (req, res) => {
  authenticate(req, res, async () => {
    const id = req.params.Id_art;
    const {
      desig_art, BARCODE, Alternante_Code, ID_SECTION, Place_item,
      SECT, Price, QTY_SECURIT, SCIENTIFIC_NAME, PREPARATEUR, Comment,
      Is_Verified, expir_date, SIZE_ART, contents, CLASSEMENT, CURRENCY,
      MANUFACRURE, COUNTRY, tt, day_expired, pharmacy
    } = req.body;

    if (!id) return res.status(400).json({ message: "id is required" });

    try {
      const record = await products.findOne({ where: { Id_art: id } });

      console.log("Update ID:", id);
      console.log("Found record:", record);
      
      if (!record) return res.status(404).json({ message: "Record not found" });

      await record.update({
        desig_art,
        BARCODE,
        Alternante_Code,
        ID_SECTION,
        Place_item,
        SECT,
        Price,
        QTY_SECURIT,
        SCIENTIFIC_NAME,
        PREPARATEUR,
        Comment,
        Is_Verified,
        expir_date,
        SIZE_ART,
        contents,
        CLASSEMENT,
        CURRENCY,
        MANUFACRURE,
        COUNTRY,
        tt,
        day_expired,
        pharmacy
      });

      res.status(200).json({ message: "Record updated successfully" });
    } catch (err) {
      console.error("Update Record Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while updating the record"
      });
    }
  });
};

// Delete a record
exports.delete = (req, res) => {
  authenticate(req, res, async () => {
    const id = req.params.Id_art;
    if (!id) return res.status(400).json({ message: "id is required" });

    try {
      const record = await products.findOne({ where: { Id_art: id } });
      if (!record) return res.status(404).json({ message: "Record not found" });

      await record.destroy();
      res.status(200).json({ message: "Record deleted successfully" });
    } catch (err) {
      console.error("Delete Record Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while deleting the record"
      });
    }
  });
};