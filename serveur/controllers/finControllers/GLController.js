// Get all accounts starting with 6 and length < 10, with total expenses for a crew and year
exports.getCrewAccountDetails = async (req, res) => {
  const { crew, year } = req.query;
  try {
    const result = await sequelize.query(`
      SELECT Acc_No, Name_M,
        (SELECT COALESCE(SUM(Dibt - Cridt),0) AS total
         FROM YearTran
         WHERE source <> 'cls'
           AND year(date) = :year
           AND MrkzName = :crew
           AND LEFT(acc_no, LEN(master.Acc_No)) = master.Acc_No
        ) AS total_expense
      FROM Master
      WHERE LEN(Acc_No) < 10 AND LEFT(Acc_No, 1) = '6'
    `, {
      replacements: { crew, year },
      type: sequelize.QueryTypes.SELECT
    });
    res.json(result);


  } catch (err) {
    console.error('Error fetching crew account details:', err);
    res.status(500).json({ error: 'Failed to fetch crew account details' });
  }
};
const YearTran = require("../../models/fin/GL");
const Coa = require("../../models/fin/Coa");
const jwt = require("jsonwebtoken");


// or "../db" or wherever your sequelize instance is
const { Op } = require("sequelize");


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

// Find with optional year filter: /api/yourroute?year_date=2024
exports.find = (req, res) => {


  authenticate(req, res, async () => {
    try {
      // Define association only once at app startup, not per request
      // (Remove dynamic association to avoid duplicate alias error)
      const where = {};
      // Accept year_date as query param (int)
const year=2025;

      // if (req.query.year_date) {
     
      if (!isNaN(year)) {
        // Assuming YearTran has a date field named 'Date' (adjust if needed)
        // This will match records where the year part of 'Date' equals year_date
        where.Date = {
          [Op.gte]: new Date(year, 0, 1),
          [Op.lt]: new Date(year + 1, 0, 1)
        };
      }
      // }
      // Add filter for Acc_No starting with '5'

      const data = await YearTran.findAll({
        where,
        include: [{
          model: Coa,
          as: 'coa',
          attributes: ['IND', 'Acc_No', 'Name_M', 'Date_m', 'State', 'solde_initiale', 'type_acc', 'ancien_acc_no', 'percent_budget', 'solde_by_currency', 'd1', 'd2', 'L10']
        }],
        order: [['Acc_No', 'ASC']],
      });
      res.json(data);


    } catch (dbErr) {
      console.error("DB ERROR:", dbErr);
      res.status(500).json({ message: "Error fetching records" });
    }
  });
};

// Utility to sanitize date fields
function sanitizeDateField(body, fieldName) {
  if (
    !body[fieldName] ||
    typeof body[fieldName] !== "string" ||
    !body[fieldName].trim() ||
    isNaN(Date.parse(body[fieldName]))
  ) {
    body[fieldName] = null;
  }
}

function sanitizeAllDateFields(body) {
  // Update to match YearTran date fields
  sanitizeDateField(body, "Date");
  sanitizeDateField(body, "DATE_FACT");
  sanitizeDateField(body, "date_effect");
}

exports.create = (req, res) => {
  authenticate(req, res, async () => {
    try {
      sanitizeAllDateFields(req.body);

      await YearTran.create(req.body);
      res.status(201).json({ message: "Record created successfully" });
    } catch (err) {
      console.error("Create Error:", err);
      res.status(500).json({ message: err.message });
    }
  });
};

exports.update = (req, res) => {
  authenticate(req, res, async () => {
    const id = req.params.Ind;
    console.log("Update ID:", id);
    if (!id) return res.status(400).json({ message: "id is required" });

    try {
      sanitizeAllDateFields(req.body);

      const record = await YearTran.findOne({ where: { Ind: id } });
      if (!record) return res.status(404).json({ message: "Record not found" });

      await record.update(req.body);
      res.status(200).json({ message: "Record updated successfully" });
    } catch (err) {
      console.error("Update Error:", err);
      res.status(500).json({ message: err.message });
    }
  });
};

exports.delete = (req, res) => {
  authenticate(req, res, async () => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "id is required" });

    try {
      const record = await YearTran.findOne({ where: { Ind: id } });
      if (!record) return res.status(404).json({ message: "Record not found" });

      await record.destroy();
      res.status(200).json({ message: "Record deleted successfully" });
    } catch (err) {
      console.error("Delete Error:", err);
      res.status(500).json({ message: err.message });
    }
  });
};






exports.findRevenue = (req, res) => {
  authenticate(req, res, async () => {
    try {
      const where = {};
      where.Acc_No = { [Op.like]: req.query.code +'%' };
      where.SOURCE = { [Op.notLike]: 'Cls' };

      // Accept year as query param, fallback to current year if not provided
      let year = parseInt(req.query.year);
      if (isNaN(year)) {
        // Default: return all years if not specified
        year = null;
      }
       
      if (year) {
        where.Date = {
          [Op.gte]: new Date(year, 0, 1),
          [Op.lt]: new Date(year + 1, 0, 1)
        };
      }

      const data = await YearTran.findAll({
        where,
        include: [{
          model: Coa,
          as: 'coa',
          attributes: ['IND', 'Acc_No', 'Name_M', 'Date_m', 'State', 'solde_initiale', 'type_acc', 'ancien_acc_no', 'percent_budget', 'solde_by_currency', 'd1', 'd2', 'L10']
        }],
        order: [['Acc_No', 'ASC']],
      });
      res.json(data);
    } catch (dbErr) {
      console.error("DB ERROR:", dbErr);
      res.status(500).json({ message: "Error fetching records" });
    }
  });
};