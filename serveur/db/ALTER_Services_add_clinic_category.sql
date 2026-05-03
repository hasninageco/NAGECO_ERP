-- Adds clinic_category to the Services table (SQL Server / MSSQL)
-- Run this once on the database that backs the medical insurance module.

IF COL_LENGTH('Services', 'clinic_category') IS NULL
BEGIN
  ALTER TABLE Services
    ADD clinic_category NVARCHAR(100) NULL;
END
GO
