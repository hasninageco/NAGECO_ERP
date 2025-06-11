const products = require("../../models/SupplyCahin/Product");
const jwt = require("jsonwebtoken");

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
      const data = await products.findAll();
      res.json(data);
    } catch (dbErr) {
      console.error("DB ERROR:", dbErr);
      res.status(500).json({ message: "Error fetching records" });
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
    const id = req.params.id;
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