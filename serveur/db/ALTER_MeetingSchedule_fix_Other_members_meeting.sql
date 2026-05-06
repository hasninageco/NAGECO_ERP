-- Ensures Other_members_meeting exists and can store multiple values.
-- SQL Server / MSSQL

IF OBJECT_ID('dbo.MeetingSchedule', 'U') IS NOT NULL
BEGIN
  IF COL_LENGTH('dbo.MeetingSchedule', 'Other_members_meeting') IS NULL
  BEGIN
    IF COL_LENGTH('dbo.MeetingSchedule', 'other_members_meeting') IS NOT NULL
    BEGIN
      EXEC sp_rename 'dbo.MeetingSchedule.other_members_meeting', 'Other_members_meeting', 'COLUMN';
    END
    ELSE
    BEGIN
      ALTER TABLE dbo.MeetingSchedule
      ADD Other_members_meeting NVARCHAR(MAX) NULL;
    END
  END

  IF COL_LENGTH('dbo.MeetingSchedule', 'Other_members_meeting') IS NOT NULL
  BEGIN
    ALTER TABLE dbo.MeetingSchedule
    ALTER COLUMN Other_members_meeting NVARCHAR(MAX) NULL;
  END
END
ELSE
BEGIN
  PRINT 'Table dbo.MeetingSchedule does not exist.';
END
