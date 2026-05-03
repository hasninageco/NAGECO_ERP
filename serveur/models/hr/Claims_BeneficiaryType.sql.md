# Add BeneficiaryType to Claims (SQL Server)

## 1) Add the column

```sql
ALTER TABLE dbo.Claims
ADD BeneficiaryType NVARCHAR(20) NULL;
```

> If your table is not in `dbo`, adjust the schema.

## 2) (Optional) Backfill existing records

- Employee claims (no child):

```sql
UPDATE dbo.Claims
SET BeneficiaryType = N'موظف'
WHERE EMP_CHILD IS NULL AND (BeneficiaryType IS NULL OR LTRIM(RTRIM(BeneficiaryType)) = N'');
```

- Child claims: copy from `CHILD.type_child` and normalize to the requested list.

```sql
UPDATE c
SET BeneficiaryType = CASE
    WHEN ch.type_child LIKE N'%زوج%' THEN N'زوجة'
    WHEN ch.type_child IN (N'أب', N'اب') THEN N'أب'
    WHEN ch.type_child LIKE N'%ابن%' OR ch.type_child LIKE N'%بن%' OR ch.type_child LIKE N'%ولد%' THEN N'ابن'
    ELSE ch.type_child
END
FROM dbo.Claims c
JOIN dbo.CHILD ch ON CAST(c.EMP_CHILD AS BIGINT) = ch.ID_CHILD
WHERE c.EMP_CHILD IS NOT NULL
  AND (c.BeneficiaryType IS NULL OR LTRIM(RTRIM(c.BeneficiaryType)) = N'');
```

## 3) (Optional) Add a CHECK constraint

Only do this if you are sure you want to enforce **only** these values:

```sql
ALTER TABLE dbo.Claims WITH NOCHECK
ADD CONSTRAINT CK_Claims_BeneficiaryType
CHECK (
  BeneficiaryType IS NULL OR BeneficiaryType IN (N'موظف', N'أب', N'ابن', N'زوجة')
);
```
