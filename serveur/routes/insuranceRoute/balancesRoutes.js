const { Router } = require("express");
const controller = require("../../controllers/insuranceController/balancesController.js");
const authenticateToken = require("../../middleware/auth.js");

const router = Router();

// Periods
router.get("/periods/all", authenticateToken, controller.periodsFind);
router.get("/periods/distinct", authenticateToken, controller.periodsDistinct);
router.post("/periods/bulkCreate", authenticateToken, controller.periodsBulkCreate);
router.post("/periods/Add", authenticateToken, controller.periodsCreate);
router.put("/periods/Update/:BalancePeriodId", authenticateToken, controller.periodsUpdate);
router.delete("/periods/Delete/:BalancePeriodId", authenticateToken, controller.periodsDelete);

// Balance
router.get("/balance", authenticateToken, controller.getBalance);

// Ledger operations
router.post("/recharge", authenticateToken, controller.recharge);
router.post("/recharge/bulk", authenticateToken, controller.rechargeBulk);
router.post("/transfer", authenticateToken, controller.transfer);

// Statement
router.get("/statement", authenticateToken, controller.statement);

// Transfers
router.get("/transfers", authenticateToken, controller.transfersFind);

// Transactions (restricted to RECHARGE for update/delete)
router.get("/transactions", authenticateToken, controller.transactionsFind);
router.put("/transactions/Update/:TxnId", authenticateToken, controller.transactionsUpdate);
router.delete("/transactions/Delete/:TxnId", authenticateToken, controller.transactionsDelete);

module.exports = router;
