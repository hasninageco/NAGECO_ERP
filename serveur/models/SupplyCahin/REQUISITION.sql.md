# REQUISITION table (SQL Server)

If your database doesn't already have the `REQUISITION` table, you can create it with a script like this (adjust types/names if needed):

```sql
CREATE TABLE dbo.REQUISITION (
  ID_REQ INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  art NVARCHAR(100) NULL,
  date_req DATETIME NULL,
  usr INT NULL,
  num_bn INT NULL,
  qty REAL NULL,
  Crew NVARCHAR(50) NULL,
  Field_Req NVARCHAR(50) NULL,
  Req_item NVARCHAR(50) NULL,
  Destination NVARCHAR(15) NULL,
  Is_ok BIT NULL,
  list_four NVARCHAR(500) NULL,
  qty_preparer INT NULL,
  pour_preparer BIT NULL,
  state NVARCHAR(50) NULL,
  is_local BIT NULL,
  Desp_qty REAL NULL,
  benefiary_depart INT NULL,
  STATE_TO_ALARM BIT NULL,
  Request_type INT NULL,
  Comment NVARCHAR(MAX) NULL,
  Is_approved_l2 BIT NULL,
  Is_approved_l2_comment NVARCHAR(MAX) NULL,
  Requestrefrence NVARCHAR(500) NULL,
  Is_urgent BIT NULL,
  nbr_ended_by_email INT NULL,
  is_draft BIT NULL,
  PROJECT INT NULL,
  Related_Document IMAGE NULL,
  part_number NVARCHAR(50) NULL,
  unit NVARCHAR(50) NULL,
  IS_IMAGE BIT NULL,
  requisition_status NVARCHAR(50) NULL,
  Comment_ar NVARCHAR(MAX) NULL,
  DOC_FILE NVARCHAR(MAX) NULL,
  Received_Qty REAL NULL,
  Date_Received DATETIME NULL,
  Comment_Receive NVARCHAR(MAX) NULL,
  state_receive BIT NULL,
  TRANSMITTAL_NO INT NULL,
  ASSET_ID INT NULL,
  Requisition_Title NVARCHAR(MAX) NULL,
  Requisition_Status_Manual NVARCHAR(MAX) NULL,
  dateIs_approved_l2 DATETIME NULL,
  warehouse_approvals_user NVARCHAR(MAX) NULL,
  EXISTANE_IN_WAREHOUSE NVARCHAR(50) NULL
);
```

Notes:
- The Sequelize model uses `freezeTableName: true` with name `REQUISITION`. If your actual table name differs, rename either the table or the model to match.
- The legacy `IMAGE` column is supported; Sequelize maps it via `BLOB('long')`.
