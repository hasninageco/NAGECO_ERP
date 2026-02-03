const SupplierClient = require("../../models/SupplyCahin/Vendors");
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
      const data = await SupplierClient.findAll();
      // Ensure Files is always an array
      const result = data.map(vendor => {
        const vendorObj = vendor.toJSON();
        // If Files is a string, split it; if already array, keep as is
        if (vendorObj.Files && typeof vendorObj.Files === 'string') {
          vendorObj.Files = vendorObj.Files.split(',').filter(f => f);
        }
        return vendorObj;
      });
      res.json(result);
    } catch (dbErr) {
      res.status(500).json({ message: "Error fetching records" });
    }
  });
};

// Create a new record
exports.create = (req, res) => {
  authenticate(req, res, async () => {
    const {
      Name_supplier_client,
      Code__supplier_client,
      Tel,
      Adress,
      Control_Account,
      Email,
      List_currency,
      TYPE_CUS_SUPP,
      logo,
      Files
    } = req.body;

    try {
      await SupplierClient.create({
        Name_supplier_client,
        Code__supplier_client,
        Tel,
        Adress,
        Control_Account,
        Email,
        List_currency,
        TYPE_CUS_SUPP,
        logo,
        Files: Array.isArray(Files) ? Files.join(',') : (Files || ''),
      });

      res.status(200).json({ message: "Vendor added successfully" });
    } catch (err) {
      console.error("Create Vendor Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while creating the vendor"
      });
    }
  });
};

// Update an existing record
exports.update = (req, res) => {
  authenticate(req, res, async () => {
    const id = req.params.id_supplier_client;
    const {
      Name_supplier_client,
      Code__supplier_client,
      Tel,
      Adress,
      Control_Account,
      Email,
      List_currency,
      TYPE_CUS_SUPP,
      logo,
      Files
    } = req.body;

    if (!id) return res.status(400).json({ message: "id_supplier_client is required" });

    try {
      const record = await SupplierClient.findOne({ where: { id_supplier_client: id } });

      if (!record) return res.status(404).json({ message: "Vendor not found" });

      await record.update({
        Name_supplier_client,
        Code__supplier_client,
        Tel,
        Adress,
        Control_Account,
        Email,
        List_currency,
        TYPE_CUS_SUPP,
        logo,
        Files: Array.isArray(Files) ? Files.join(',') : (Files || ''),
      });

      res.status(200).json({ message: "Vendor updated successfully" });
    } catch (err) {
      console.error("Update Vendor Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while updating the vendor"
      });
    }
  });
};

// Delete a record
exports.delete = (req, res) => {
  authenticate(req, res, async () => {
    const id = req.params.id_supplier_client;
    if (!id) return res.status(400).json({ message: "id_supplier_client is required" });

    try {
      const record = await SupplierClient.findOne({ where: { id_supplier_client: id } });
      if (!record) return res.status(404).json({ message: "Vendor not found" });

      await record.destroy();
      res.status(200).json({ message: "Vendor deleted successfully" });
    } catch (err) {
      console.error("Delete Vendor Error:", err);
      res.status(500).json({
        message: err.message || "Some error occurred while deleting the vendor"
      });
    }
  });
};