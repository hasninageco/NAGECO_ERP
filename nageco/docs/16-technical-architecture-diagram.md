# 16. Technical Architecture Diagram

This diagram represents the implemented architecture of the NAGECO ERP platform.

```mermaid
flowchart TD
  U[End Users\nHR | Finance | Supply Chain | Fleet | Medical | Admin] --> B[Web Browser]
  B -->|HTTPS| FE[Frontend\nReact + TypeScript + MUI\nnageco]

  FE --> FE_BOOK[Booking System UI]
  FE --> FE_MED[Medical Insurance UI]
  FE --> FE_FLEET[Fleet Management UI]
  FE --> FE_HR[HR + Settings UI]

  FE -->|REST API via buildApiUrl| BE[Backend API\nNode.js + Express\nserveur]

  BE --> HR[HR Routes\n/employees /positions /children ...]
  BE --> FIN[Finance Routes\n/currencies /coas /payments ...]
  BE --> SC[Supply Chain Routes\n/products /vendors /requisitions ...]
  BE --> MEET[Meeting Routes\n/meetingSchedules /meetingRooms]
  BE --> MED[Medical Insurance Routes\n/medicalInsurance/*]
  BE --> FLEET[Fleet Routes\n/fleet/*]

  BE -->|mssql connectivity| DB[(SQL Server\nFC_NAGECO_WEB)]
  BE --> FS[(File Storage\nuploads/Claims)]

  I18N[i18next EN/AR + RTL] -.cross-cutting.-> FE
  AUTH[Bearer Token Auth] -.cross-cutting.-> BE
  DEPLOY[Backend serves frontend build] -.deployment.-> FE
```

Notes:
- Frontend and backend are deployed as separate workspaces in the same solution.
- Backend provides API endpoints and static hosting for production frontend build.
- SQL Server is the primary system of record; file storage is used for claims attachments.
