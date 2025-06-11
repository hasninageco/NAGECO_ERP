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

const products = require("./routes/supplyChainRoute/productsRoutes");
const sections = require("./routes/supplyChainRoute/sectionRoutes");
const vendors = require("./routes/supplyChainRoute/vendorsRoutes");


const cors = require("cors"); 
  

connect();
app.use(cors());
app.use(express.json());
app.use("/", router);
app.use("/positions", prouter);
app.use("/costCenters", crouter);
app.use("/employeeBanks", ebrouter);
app.use("/specialities", sbrouter);
app.use("/certificates", certificates);
app.use("/currencies", currency);
app.use("/typeFond", typeFond);
app.use("/coas", coas);
app.use("/products", products);
app.use("/sections", sections);
app.use("/vendors", vendors);
app.listen(8000, () => {
  console.log("connected to port 8000");
});

