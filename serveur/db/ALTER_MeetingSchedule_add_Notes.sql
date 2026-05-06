-- Adds Notes to the MeetingSchedule table (SQL Server / MSSQL)
-- Run this once on the database that backs the booking/meeting module.

IF COL_LENGTH('MeetingSchedule', 'Notes') IS NULL
BEGIN
  ALTER TABLE MeetingSchedule
    ADD Notes NVARCHAR(1000) NULL;
END
GO
