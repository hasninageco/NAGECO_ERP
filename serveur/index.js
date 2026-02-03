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

const employees = require("./routes/Hrroute/employeesRoutes");


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
const paymentSummaryRoutes = require("./routes/financeroute/paymentSummaryRoutes");
const jsiRoutes = require("./routes/Hrroute/jsiRoutes");

const meetingScheduleRoutes = require("./routes/meetingRoute/meetingScheduleRoutes");
const meetingRoomRoutes = require("./routes/meetingRoute/meetingRoomRoutes");


const cors = require("cors");  

connect();
app.use(cors());
// Increase JSON payload limit to 10mb (or more if needed)
app.use(express.json({ limit: '10mb' }));
// If you use urlencoded, also increase its limit:
app.use(express.urlencoded({ limit: '10mb', extended: true }));
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




app.use("/DsFinance", DsFinance);

app.use("/meetingSchedules", meetingScheduleRoutes);
app.use("/meetingRooms", meetingRoomRoutes);


app.listen(5000, () => {
  console.log("connected to port 5000");
});

