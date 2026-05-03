# Insurance Balances (Design Proposal)

Date: 2026-02-22

This document proposes the database tables + business rules for:
- Employee insurance balance periods (company-funded)
- Balance recharges (credit)
- Automatic deductions when adding claim services (debit)
- Balance transfer from employee to employee (debit+credit)

> Current system anchors employees via `Ref_emp` (string) in `Claims.Ref_emp` and `EMPLOYEE.Ref_emp`.

---

## 1) Tables

### A) `InsuranceBalancePeriods`
A period defines the validity window for a balance bucket.

**Columns**
- `BalancePeriodId` BIGINT IDENTITY(1,1) PK
- `Ref_emp` NVARCHAR(50) NOT NULL
- `PeriodName` NVARCHAR(50) NULL (e.g. `2026-Q1`)
- `ValidFrom` DATE NOT NULL
- `ValidTo` DATE NOT NULL
- `CurrencyCode` CHAR(3) NOT NULL DEFAULT 'LYD'
- `IsActive` BIT NOT NULL DEFAULT 1
- `Notes` NVARCHAR(300) NULL
- `CreatedAt` DATETIME2 NOT NULL DEFAULT SYSDATETIME()

**Rules**
- No auto-creation of periods.
- When matching a period for a date: `ValidFrom <= date <= ValidTo` and `IsActive = 1`.
- If **0** periods match: error.
- If **>1** periods match (overlap): error (ambiguous).

---

### B) `InsuranceBalanceTransactions`
Ledger-style table. Current balance = SUM(Amount) per period.

**Columns**
- `TxnId` BIGINT IDENTITY(1,1) PK
- `BalancePeriodId` BIGINT NOT NULL (FK to `InsuranceBalancePeriods`)
- `Ref_emp` NVARCHAR(50) NOT NULL
- `TxnType` NVARCHAR(10) NOT NULL (`CREDIT` / `DEBIT`)
- `Amount` DECIMAL(18,2) NOT NULL
- `TxnDate` DATETIME2 NOT NULL DEFAULT SYSDATETIME()
- `EffectiveDate` DATE NOT NULL (used for period matching / reporting)
- `Source` NVARCHAR(20) NOT NULL (`RECHARGE`, `CLAIM_LINE`, `TRANSFER`, `ADJUST`)

**Optional linkage**
- `ClaimId` BIGINT NULL
- `ClaimLineId` BIGINT NULL
- `ServiceId` INT NULL

**Optional calculation detail (recommended)**
- `CoveragePercent` DECIMAL(5,2) NULL
- `Qty` DECIMAL(10,2) NULL
- `UnitPrice` DECIMAL(18,2) NULL
- `ClaimedAmount` DECIMAL(18,2) NULL
- `CoveredAmount` DECIMAL(18,2) NULL

**Transfer metadata**
- `TransferId` BIGINT NULL
- `CounterpartyRef_emp` NVARCHAR(50) NULL

**Rules**
- CREDIT should store `Amount > 0`
- DEBIT should store `Amount < 0`

---

### C) `InsuranceBalanceTransfers`
A master record to pair the two ledger rows (debit+credit).

**Columns**
- `TransferId` BIGINT IDENTITY(1,1) PK
- `FromRef_emp` NVARCHAR(50) NOT NULL
- `ToRef_emp` NVARCHAR(50) NOT NULL
- `Amount` DECIMAL(18,2) NOT NULL (positive)
- `EffectiveDate` DATE NOT NULL (UI default = today)
- `Notes` NVARCHAR(300) NULL
- `CreatedAt` DATETIME2 NOT NULL DEFAULT SYSDATETIME()

**Rules**
- No negative allowed for transfers.
- Must find exactly one active period for **FromRef_emp** covering `EffectiveDate`.
- Must find exactly one active period for **ToRef_emp** covering `EffectiveDate`.
- Must check available balance for sender period BEFORE inserting rows:
  - `Available = SUM(Amount)`
  - require `Available >= Amount`

---

## 2) Claim line deduction rule (coverage-based)
When adding a service line:
- Use claim date (`Claims.ClaimDate`) as the **effective date**.
- Resolve employee period by `(Ref_emp, ClaimDate)`.
- Load service coverage percent from `Services.CoveragePercent`.
- Compute:
  - `ClaimedAmount = Qty * UnitPrice`
  - `CoveredAmount = ROUND(ClaimedAmount * (CoveragePercent/100), 2)`
- Insert DEBIT transaction:
  - `Amount = -CoveredAmount`
  - `Source = 'CLAIM_LINE'`
  - link `ClaimId/ClaimLineId/ServiceId`

**Insufficient balance rule (NO negative):**
- Before inserting the claim-line DEBIT, compute current period balance:
  - `Available = SUM(Amount)` for that `BalancePeriodId`
- If `Available < CoveredAmount` => reject the claim line (do not insert).

---

## 3) UI navigation
Sidebar (Management Insurance) currently has: Overview, Workers, Services, Providers, Claims.

Add:
- `Recharge` (English)  -> `/medicalInsurance/recharge`

Optional (depending on your preference):
- `Transfer Balance` -> `/medicalInsurance/transfer`
OR include transfer as a tab inside Recharge page.
