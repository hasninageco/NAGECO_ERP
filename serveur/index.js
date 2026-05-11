require('dotenv').config();
const express = require("express");
const app = express();
const connect = require("./config/database");

const router = require("./routes/Hrroute/userRoutes");
const prouter = require("./routes/Hrroute/positionsRoutes");
const crouter = require("./routes/Hrroute/costCentersRoutes");
const ebrouter = require("./routes/Hrroute/employeeBanksRoutes");
const sbrouter = require("./routes/Hrroute/specialitiesRoutes");
const certificates = require("./routes/Hrroute/certificatesRoutes");
const currency = require("./routes/financeroute/currencyRoutes");
const typeFond = require("./routes/financeroute/typeFondRoutes");
const coas = require("./routes/financeroute/coaRoutes");
const wws = require("./routes/Hrroute/wWRoutes");
const holidays = require("./routes/Hrroute/holidaysRoutes");
const promotions = require("./routes/Hrroute/promotionRoutes");

const employees = require("./routes/Hrroute/employeesRoutes");
const children = require("./routes/Hrroute/childrenRoutes");


const congee = require("./routes/Hrroute/congeeRoutes");


const products = require("./routes/supplyChainRoute/productsRoutes");
const sections = require("./routes/supplyChainRoute/sectionRoutes");
const vendors = require("./routes/supplyChainRoute/vendorsRoutes");
const uploadRoutes = require("./routes/supplyChainRoute/uploadRoutes");
const requisitions = require("./routes/supplyChainRoute/requisitionRoutes");



const DsFinance =require("./routes/financeroute/glRoutes");
const chashBookCheckRoutes = require("./routes/financeroute/chashBookCheckRoutes");
const sarfEtrLocRoutes = require("./routes/financeroute/sarfEtrLocRoutes");
const sarfCashRoutes = require("./routes/financeroute/sarfCashRoutes");
const path = require('path');
const fs = require('fs');
const paymentSummaryRoutes = require("./routes/financeroute/paymentSummaryRoutes");
const jsiRoutes = require("./routes/Hrroute/jsiRoutes");

const meetingScheduleRoutes = require("./routes/meetingRoute/meetingScheduleRoutes");
const meetingRoomRoutes = require("./routes/meetingRoute/meetingRoomRoutes");

// Medical Insurance (claims)
const servicesRoutes = require("./routes/insuranceRoute/servicesRoutes");
const providersRoutes = require("./routes/insuranceRoute/providersRoutes");
const claimsRoutes = require("./routes/insuranceRoute/claimsRoutes");
const claimLinesRoutes = require("./routes/insuranceRoute/claimLinesRoutes");
const claimDocumentsRoutes = require("./routes/insuranceRoute/claimDocumentsRoutes");
const balancesRoutes = require("./routes/insuranceRoute/balancesRoutes");
const financeRoutes = require("./routes/insuranceRoute/financeRoutes");

// Fleet Management
const fleetSupplierRoutes = require("./routes/fleetRoute/supplierRoutes");
const fleetVehicleRoutes = require("./routes/fleetRoute/vehicleRoutes");
const fleetInsuranceRoutes = require("./routes/fleetRoute/insuranceRoutes");
const fleetMaintenanceRoutes = require("./routes/fleetRoute/maintenanceRoutes");
const fleetTripRoutes = require("./routes/fleetRoute/tripRoutes");
const fleetNotificationRoutes = require("./routes/fleetRoute/notificationRoutes");
const fleetDocumentRoutes = require("./routes/fleetRoute/documentRoutes");

// Archive
const administrationArchiveRoutes = require("./routes/archiveRoute/administrationArchiveRoutes");
const archiveRoutes = require("./routes/archiveRoute/archiveRoutes");
const archiveFinanceRoutes = require("./routes/archiveRoute/archiveFinanceRoutes");
const typePapierRoutes = require("./routes/archiveRoute/typePapierRoutes");
const steRoutes = require("./routes/archiveRoute/steRoutes");


const cors = require("cors");  
const localBuildPath = path.join(__dirname, "build");
const workspaceBuildPath = path.join(__dirname, "..", "nageco", "build");
const clientBuildPath = fs.existsSync(localBuildPath) ? localBuildPath : workspaceBuildPath;

connect();
app.use(cors());
// Increase JSON payload limit to 10mb (or more if needed)
app.use(express.json({ limit: '10mb' }));
// If you use urlencoded, also increase its limit:
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/", router);
app.use("/positions", prouter);
app.use("/wws", wws);
app.use("/costCenters", crouter);
app.use("/employeeBanks", ebrouter);
app.use("/specialities", sbrouter);
app.use("/certificates", certificates);
app.use("/currencies", currency);
app.use("/typeFond", typeFond);
app.use("/coas", coas);
app.use("/jsi", jsiRoutes);
app.use("/holidays", holidays);
app.use("/promotions", promotions);
app.use("/chashBookChecks", chashBookCheckRoutes);
app.use("/sarfEtrLoc", sarfEtrLocRoutes);
app.use("/sarfCash", sarfCashRoutes);
app.use("/payments", paymentSummaryRoutes);
app.use("/products", products);
app.use("/sections", sections);
app.use("/vendors", vendors);
app.use("/requisitions", requisitions);
app.use("/bonentrer", require("./routes/supplyChainRoute/bonEntrerRoutes"));
app.use("/bonsortie", require("./routes/supplyChainRoute/bonSortieRoutes"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/upload", uploadRoutes);
app.use("/employees", employees);
app.use("/Lleaves", congee);
app.use("/children", children);

app.use("/DsFinance", DsFinance);

app.use("/meetingSchedules", meetingScheduleRoutes);
app.use("/meetingRooms", meetingRoomRoutes);

app.use("/medicalInsurance/services", servicesRoutes);
app.use("/medicalInsurance/providers", providersRoutes);
app.use("/medicalInsurance/claims", claimsRoutes);
app.use("/medicalInsurance/claimLines", claimLinesRoutes);
app.use("/medicalInsurance/claimDocuments", claimDocumentsRoutes);
app.use("/medicalInsurance/balances", balancesRoutes);
app.use("/medicalInsurance/finance", financeRoutes);

app.use("/fleet/suppliers", fleetSupplierRoutes);
app.use("/fleet/vehicles", fleetVehicleRoutes);
app.use("/fleet/insurance", fleetInsuranceRoutes);
app.use("/fleet/maintenance", fleetMaintenanceRoutes);
app.use("/fleet/trips", fleetTripRoutes);
app.use("/fleet/notifications", fleetNotificationRoutes);
app.use("/fleet/documents", fleetDocumentRoutes);

app.use("/archive/administrations", administrationArchiveRoutes);
app.use("/archive/records", archiveRoutes);
app.use("/archive/finance", archiveFinanceRoutes);
app.use("/archive/type-papier", typePapierRoutes);
app.use("/archive/ste", steRoutes);

app.use(express.static(clientBuildPath));

app.get("*", (req, res, next) => {
  if (req.method !== "GET") return next();
  if (req.path.startsWith("/api")) return next();
  return res.sendFile(path.join(clientBuildPath, "index.html"));
});


app.listen(5000, () => {
  console.log("connected to port 5000");
});

