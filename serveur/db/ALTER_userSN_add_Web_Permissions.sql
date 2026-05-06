-- Adds Web_Permissions to userSN table (SQL Server / MSSQL)
-- Run this once on the database used by authentication.

IF COL_LENGTH('userSN', 'Web_Permissions') IS NULL
BEGIN
  ALTER TABLE userSN
    ADD Web_Permissions NVARCHAR(1000) NULL;
END
GO
