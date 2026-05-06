-- Run once in SQL Server to store Responsible Employee reference as text.
IF OBJECT_ID('dbo.fleet_vehicle', 'U') IS NULL
BEGIN
  RAISERROR('dbo.fleet_vehicle table was not found.', 16, 1);
  RETURN;
END;

IF COL_LENGTH('dbo.fleet_vehicle', 'ID_EMP_RESPONSIBLE') IS NULL
BEGIN
  RAISERROR('Column dbo.fleet_vehicle.ID_EMP_RESPONSIBLE was not found.', 16, 1);
  RETURN;
END;

BEGIN TRY
  ALTER TABLE dbo.fleet_vehicle
  ALTER COLUMN ID_EMP_RESPONSIBLE NVARCHAR(100) NULL;

  PRINT 'dbo.fleet_vehicle.ID_EMP_RESPONSIBLE altered to NVARCHAR(100) NULL.';
END TRY
BEGIN CATCH
  DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
  RAISERROR('Failed to alter dbo.fleet_vehicle.ID_EMP_RESPONSIBLE: %s', 16, 1, @ErrorMessage);
END CATCH;
