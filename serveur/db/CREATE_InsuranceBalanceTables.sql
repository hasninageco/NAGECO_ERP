-- SQL Server / MSSQL
-- Insurance balance tables.
-- NOTE: “no negative balance” enforcement for claim deductions/transfers is handled in API logic
-- (by checking SUM(Amount) before inserting DEBIT rows).

IF OBJECT_ID('dbo.InsuranceBalancePeriods', 'U') IS NULL
BEGIN
CREATE TABLE dbo.InsuranceBalancePeriods (
  BalancePeriodId BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  Ref_emp NVARCHAR(50) NOT NULL,
  PeriodName NVARCHAR(50) NULL,
  ValidFrom DATE NOT NULL,
  ValidTo DATE NOT NULL,
  CurrencyCode CHAR(3) NOT NULL CONSTRAINT DF_InsuranceBalancePeriods_Currency DEFAULT ('LYD'),
  IsActive BIT NOT NULL CONSTRAINT DF_InsuranceBalancePeriods_IsActive DEFAULT (1),
  Notes NVARCHAR(300) NULL,
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_InsuranceBalancePeriods_CreatedAt DEFAULT (SYSDATETIME()),
  CONSTRAINT CK_InsuranceBalancePeriods_DateRange CHECK (ValidFrom <= ValidTo)
);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_InsuranceBalancePeriods_RefEmp_Date' AND object_id = OBJECT_ID('dbo.InsuranceBalancePeriods'))
  CREATE INDEX IX_InsuranceBalancePeriods_RefEmp_Date
    ON dbo.InsuranceBalancePeriods (Ref_emp, IsActive, ValidFrom, ValidTo);
GO

IF OBJECT_ID('dbo.InsuranceBalanceTransfers', 'U') IS NULL
BEGIN
CREATE TABLE dbo.InsuranceBalanceTransfers (
  TransferId BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  FromRef_emp NVARCHAR(50) NOT NULL,
  ToRef_emp NVARCHAR(50) NOT NULL,
  Amount DECIMAL(18,2) NOT NULL,
  EffectiveDate DATE NOT NULL,
  Notes NVARCHAR(300) NULL,
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_InsuranceBalanceTransfers_CreatedAt DEFAULT (SYSDATETIME()),
  CONSTRAINT CK_InsuranceBalanceTransfers_Positive CHECK (Amount > 0),
  CONSTRAINT CK_InsuranceBalanceTransfers_NotSame CHECK (FromRef_emp <> ToRef_emp)
);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_InsuranceBalanceTransfers_From_To_Date' AND object_id = OBJECT_ID('dbo.InsuranceBalanceTransfers'))
  CREATE INDEX IX_InsuranceBalanceTransfers_From_To_Date
    ON dbo.InsuranceBalanceTransfers (FromRef_emp, ToRef_emp, EffectiveDate);
GO

IF OBJECT_ID('dbo.InsuranceBalanceTransactions', 'U') IS NULL
BEGIN
CREATE TABLE dbo.InsuranceBalanceTransactions (
  TxnId BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  BalancePeriodId BIGINT NOT NULL,
  Ref_emp NVARCHAR(50) NOT NULL,
  TxnType NVARCHAR(10) NOT NULL,
  Amount DECIMAL(18,2) NOT NULL,
  TxnDate DATETIME2 NOT NULL CONSTRAINT DF_InsuranceBalanceTransactions_TxnDate DEFAULT (SYSDATETIME()),
  EffectiveDate DATE NOT NULL,
  Source NVARCHAR(20) NOT NULL,

  ClaimId BIGINT NULL,
  ClaimLineId BIGINT NULL,
  ServiceId INT NULL,

  CoveragePercent DECIMAL(5,2) NULL,
  Qty DECIMAL(10,2) NULL,
  UnitPrice DECIMAL(18,2) NULL,
  ClaimedAmount DECIMAL(18,2) NULL,
  CoveredAmount DECIMAL(18,2) NULL,

  TransferId BIGINT NULL,
  CounterpartyRef_emp NVARCHAR(50) NULL,

  Notes NVARCHAR(300) NULL,

  CONSTRAINT FK_InsuranceBalanceTransactions_Period
    FOREIGN KEY (BalancePeriodId) REFERENCES dbo.InsuranceBalancePeriods(BalancePeriodId),

  CONSTRAINT CK_InsuranceBalanceTransactions_TxnType
    CHECK (TxnType IN ('CREDIT', 'DEBIT')),

  CONSTRAINT CK_InsuranceBalanceTransactions_Source
    CHECK (Source IN ('RECHARGE', 'CLAIM_LINE', 'TRANSFER', 'ADJUST')),

  CONSTRAINT CK_InsuranceBalanceTransactions_AmountSign
    CHECK (
      (TxnType = 'CREDIT' AND Amount > 0)
      OR (TxnType = 'DEBIT' AND Amount < 0)
    )
);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_InsuranceBalanceTransactions_PeriodDate' AND object_id = OBJECT_ID('dbo.InsuranceBalanceTransactions'))
  CREATE INDEX IX_InsuranceBalanceTransactions_PeriodDate
    ON dbo.InsuranceBalanceTransactions (BalancePeriodId, TxnDate);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_InsuranceBalanceTransactions_RefEmp_Effective' AND object_id = OBJECT_ID('dbo.InsuranceBalanceTransactions'))
  CREATE INDEX IX_InsuranceBalanceTransactions_RefEmp_Effective
    ON dbo.InsuranceBalanceTransactions (Ref_emp, EffectiveDate);
GO
