-- Run once in SQL Server to store Fleet employee references as text values.
SET NOCOUNT ON;

DECLARE @Targets TABLE (
  TableName SYSNAME NOT NULL,
  ColumnName SYSNAME NOT NULL
);

INSERT INTO @Targets (TableName, ColumnName)
VALUES
  ('fleet_vehicle', 'ID_EMP_RESPONSIBLE'),
  ('fleet_trip', 'ID_EMP_DRIVER'),
  ('fleet_trip', 'REQUESTED_BY'),
  ('fleet_trip_approval', 'ID_EMP_APPROVER'),
  ('fleet_trip_employee_list', 'ID_EMP'),
  ('fleet_trip_event', 'ID_EMP'),
  ('fleet_document', 'ID_EMP'),
  ('fleet_document', 'UPLOADED_BY'),
  ('fleet_notification', 'ID_EMP');

DECLARE @TableName SYSNAME;
DECLARE @ColumnName SYSNAME;
DECLARE @Sql NVARCHAR(MAX);
DECLARE @QualifiedTable NVARCHAR(300);

DECLARE target_cursor CURSOR LOCAL FAST_FORWARD FOR
SELECT TableName, ColumnName
FROM @Targets;

OPEN target_cursor;
FETCH NEXT FROM target_cursor INTO @TableName, @ColumnName;

WHILE @@FETCH_STATUS = 0
BEGIN
  SET @QualifiedTable = N'dbo.' + @TableName;

  IF OBJECT_ID(@QualifiedTable, 'U') IS NULL
  BEGIN
    PRINT 'Skipped: table ' + @QualifiedTable + ' was not found.';
  END
  ELSE IF COL_LENGTH(@QualifiedTable, @ColumnName) IS NULL
  BEGIN
    PRINT 'Skipped: column ' + @QualifiedTable + '.' + @ColumnName + ' was not found.';
  END
  ELSE
  BEGIN
    BEGIN TRY
      SET @Sql =
        N'ALTER TABLE dbo.' + QUOTENAME(@TableName) +
        N' ALTER COLUMN ' + QUOTENAME(@ColumnName) + N' NVARCHAR(100) NULL;';

      EXEC sp_executesql @Sql;

      PRINT 'Updated: ' + @QualifiedTable + '.' + @ColumnName + ' -> NVARCHAR(100) NULL';
    END TRY
    BEGIN CATCH
      PRINT 'Failed: ' + @QualifiedTable + '.' + @ColumnName + ' -> ' + ERROR_MESSAGE();
    END CATCH;
  END;

  FETCH NEXT FROM target_cursor INTO @TableName, @ColumnName;
END;

CLOSE target_cursor;
DEALLOCATE target_cursor;
