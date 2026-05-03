param(
  [string]$OutputPath = (Join-Path $PSScriptRoot "..\NAGECO_ERP_System_Documentation_2026-04-28.docx")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Escape-XmlText {
  param([string]$Text)
  return [System.Security.SecurityElement]::Escape($Text)
}

$fullOutputPath = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = [System.IO.Path]::GetDirectoryName($fullOutputPath)
if (-not (Test-Path -Path $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("erp-report-" + [System.Guid]::NewGuid().ToString("N"))
$relsDir = Join-Path $tempRoot "_rels"
$wordDir = Join-Path $tempRoot "word"

New-Item -ItemType Directory -Path $tempRoot | Out-Null
New-Item -ItemType Directory -Path $relsDir | Out-Null
New-Item -ItemType Directory -Path $wordDir | Out-Null

$contentTypesXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
"@

$rootRelsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
"@

$paragraphs = @(
  "NAGECO ERP SYSTEM DOCUMENTATION",
  "Project: NAGECO Web + Server",
  "Date: April 28, 2026",
  "",
  "1. Executive Summary",
  "The new NAGECO ERP system is implemented as a web platform that combines HR, Finance, Supply Chain, Booking, Medical Insurance, and Fleet Management operations in one integrated environment.",
  "The frontend is built with React + TypeScript, and the backend is built with Node.js/Express with SQL Server connectivity.",
  "",
  "2. Technical Architecture",
  "2.1 Frontend stack",
  "- React 19 and TypeScript application under the nageco workspace.",
  "- UI and navigation based on Material UI and Toolpad.",
  "- API calls centralized through src/utils/api.ts with configurable REACT_APP_API_BASE.",
  "",
  "2.2 Backend stack",
  "- Express server under the serveur workspace.",
  "- API modules mounted by business domain (HR, finance, supply chain, meetings, insurance, fleet).",
  "- JSON payload handling configured to 10mb and CORS enabled.",
  "",
  "2.3 Data and hosting",
  "- Database connectivity is configured through mssql driver against SQL Server.",
  "- Frontend production build is served by backend static hosting.",
  "- Health endpoint available at /api/health.",
  "",
  "3. Functional Scope (Frontend)",
  "3.1 Core navigation and workspace",
  "- Dashboard module with access check behavior.",
  "- Booking System module with Calendar and Meeting/Booking Reports sections.",
  "- Settings module with General Settings, HR Settings, Finance Settings, and Supply Chain Settings.",
  "",
  "3.2 Human Resources",
  "- HR area includes compensations/annual leave balances and time sheets pages.",
  "- Employee-related entities are supported on backend (employees, children, positions, cost centers, banks, specialities, certificates, holidays, leaves).",
  "",
  "3.3 Medical Insurance",
  "- Insurance landing and operational pages: workers, services, providers, claims, doctor review, reviewed claims, recharge, transfer balance, employee statement, and finance payments.",
  "- Claims workflow supports documents and review/approval lifecycle.",
  "",
  "3.4 Fleet Management",
  "- Fleet module pages: overview, vehicles, maintenance, trips, suppliers, insurance, documents, and notifications.",
  "- Backend APIs are grouped under /fleet/* route prefixes.",
  "",
  "3.5 Booking and Meeting Management",
  "- Meeting calendar and reporting experiences are available in Booking System.",
  "- Backend support includes meeting schedules and meeting room endpoints.",
  "",
  "4. Functional Scope (Backend APIs)",
  "4.1 HR route groups",
  "- / (user routes), /positions, /wws, /costCenters, /employeeBanks, /specialities, /certificates, /employees, /children, /Lleaves, /holidays, /jsi.",
  "",
  "4.2 Finance route groups",
  "- /currencies, /typeFond, /coas, /DsFinance, /chashBookChecks, /sarfEtrLoc, /sarfCash, /payments.",
  "",
  "4.3 Supply Chain route groups",
  "- /products, /sections, /vendors, /requisitions, /bonentrer, /bonsortie, /upload.",
  "",
  "4.4 Meeting route groups",
  "- /meetingSchedules and /meetingRooms.",
  "",
  "4.5 Medical Insurance route groups",
  "- /medicalInsurance/services, /medicalInsurance/providers, /medicalInsurance/claims, /medicalInsurance/claimLines, /medicalInsurance/claimDocuments, /medicalInsurance/balances, /medicalInsurance/finance.",
  "",
  "4.6 Fleet route groups",
  "- /fleet/suppliers, /fleet/vehicles, /fleet/insurance, /fleet/maintenance, /fleet/trips, /fleet/notifications, /fleet/documents.",
  "",
  "5. Localization and User Experience",
  "- Application supports English and Arabic translations with i18next resources.",
  "- Right-to-left rendering is supported for Arabic layout.",
  "",
  "6. Documents and Reporting",
  "- Booking reporting pages are available from Booking System reports section.",
  "- Medical Insurance includes statement and finance payment report experiences.",
  "- Claim files are handled under uploads/Claims through backend document routes.",
  "",
  "7. Build and Deployment Status",
  "- Frontend build command npm run build executes successfully in the current workspace context.",
  "- Backend listens on port 5000 and serves both APIs and frontend static build output.",
  "",
  "8. Recommended Next-Phase Enhancements",
  "- Enforce role-based authorization matrix per module and endpoint.",
  "- Expand automated testing for critical flows (claims lifecycle, fleet operations, meeting conflicts, finance transactions).",
  "- Add stronger audit/reconciliation reporting for cross-module financial impacts.",
  "",
  "16. Technical Architecture Diagram",
  "Legend: --> request/response flow, [ ] component/layer",
  "",
  "[End Users: HR | Finance | Supply Chain | Fleet | Medical | Admin]",
  "                          |",
  "                          v",
  "                    [Web Browser]",
  "                          | HTTPS",
  "                          v",
  "          [NAGECO Frontend: React + TypeScript + MUI]",
  "   |-- Booking System UI",
  "   |-- Medical Insurance UI",
  "   |-- Fleet Management UI",
  "   |-- HR/Settings UI",
  "                          | REST API (buildApiUrl)",
  "                          v",
  "            [NAGECO Backend: Node.js + Express]",
  "   |-- HR routes (/employees, /positions, /children, ...)",
  "   |-- Finance routes (/currencies, /coas, /payments, ...)",
  "   |-- Supply Chain routes (/products, /vendors, /requisitions, ...)",
  "   |-- Meeting routes (/meetingSchedules, /meetingRooms)",
  "   |-- Insurance routes (/medicalInsurance/*)",
  "   |-- Fleet routes (/fleet/*)",
  "                          | SQL connectivity (mssql)",
  "                          v",
  "               [SQL Server: FC_NAGECO_WEB]",
  "                          |",
  "                          v",
  "       [File Storage: uploads/Claims for claim documents]",
  "",
  "Cross-cutting concerns:",
  "- Authentication with bearer tokens across protected APIs.",
  "- Localization with i18next (English/Arabic) and RTL support.",
  "- Deployment model where backend serves frontend production build.",
  "",
  "17. API Documentation",
  "17.1 Base URL and transport",
  "- Frontend default API base URL: http://10.0.2.2:5000.",
  "- Backend application listens on port 5000.",
  "- Health check endpoint: GET /api/health.",
  "",
  "17.2 Authentication",
  "- Public login endpoint: POST /api/login with JSON body { email, password }.",
  "- Login helper route: GET /api/login returns 405 with usage instructions.",
  "- Protected endpoints require Authorization header in format: Bearer <JWT>.",
  "- Auth middleware returns 401 (Token required) or 403 (Invalid or expired token).",
  "",
  "17.3 HR APIs",
  "- /positions -> GET /all, POST /Add, PUT /Update/:id_job, DELETE /Delete/:id_job.",
  "- /costCenters -> GET /all, POST /Add, PUT /Update/:id_administratin, DELETE /Delete/:id_administratin.",
  "- /employeeBanks -> GET /all, POST /Add, PUT /Update/:id_Banque, DELETE /Delete/:id_Banque.",
  "- /specialities -> GET /all, POST /Add, PUT /Update/:id_specialite, DELETE /Delete/:id_specialite.",
  "- /certificates -> GET /all, POST /Add, PUT /Update/:id_m3, DELETE /Delete/:id_m3.",
  "- /employees -> GET /all, GET /ref/:Ref_emp, POST /Add, PUT /Update/:ID_EMP, DELETE /Delete/:ID_EMP.",
  "- /children -> GET /all, GET /employee/:EMP_CHILD, POST /Add, PUT /Update/:ID_CHILD, DELETE /Delete/:ID_CHILD.",
  "- /Lleaves -> GET /all, GET /by-employee/:id_emp, POST /Add, PUT /Update/:int_con, DELETE /Delete/:int_con.",
  "- /holidays -> GET /all, GET /check-period, POST /Add, PUT /Update/:ID_HOLIDAYS, DELETE /Delete/:ID_HOLIDAYS.",
  "- /wws -> GET /all, GET /check, POST /Add, PUT /Update/:int_can, DELETE /Delete/:int_can.",
  "- /jsi -> GET /getsum_q, GET /getsum_pt, GET /getsum_b, GET /timesheets, POST /timesheets/bulk-update.",
  "",
  "17.4 Finance APIs",
  "- /currencies -> GET /all, POST /Add, PUT /Update/:id_m3, DELETE /Delete/:id_m3.",
  "- /typeFond -> GET /all, POST /Add, PUT /Update/:id_type_fond, DELETE /Delete/:id_type_fond.",
  "- /coas -> GET /all, POST /Add, PUT /Update/:IND, DELETE /Delete/:IND.",
  "- /DsFinance -> GET /all, GET /allR, GET /allBycrew, POST /Add, PUT /Update/:IND, DELETE /Delete/:IND.",
  "- /chashBookChecks -> GET /all, POST /Add, PUT /Update/:id, DELETE /Delete/:id.",
  "- /sarfEtrLoc -> GET /all, POST /Add, PUT /Update/:id, DELETE /Delete/:id.",
  "- /sarfCash -> GET /all, POST /Add, PUT /Update/:id, DELETE /Delete/:id.",
  "- /payments -> GET /summary, GET /peek.",
  "",
  "17.5 Supply Chain APIs",
  "- /products -> GET /all, POST /Add, PUT /Update/:Id_art, DELETE /Delete/:Id_art.",
  "- /sections -> GET /all, POST /Add, PUT /Update/:ID_SECTION, DELETE /Delete/:ID_SECTION.",
  "- /vendors -> GET /all, POST /Add, PUT /Update/:id_supplier_client, DELETE /Delete/:id_supplier_client.",
  "- /requisitions -> GET /summary, GET /all, GET /:id, POST /add, PUT /update/:id, DELETE /delete/:id.",
  "- /bonentrer -> GET /summary, POST /, GET /, GET /:id, PUT /:id, DELETE /:id.",
  "- /bonsortie -> POST /, GET /, GET /:id, PUT /:id, DELETE /:id.",
  "- /upload -> POST /files (multipart file upload).",
  "",
  "17.6 Meeting and Booking APIs",
  "- /meetingSchedules -> GET /, GET /rooms, GET /:id, POST /, PUT /:id, DELETE /:id.",
  "- /meetingRooms -> GET /, GET /:id, POST /, PUT /:id, DELETE /:id.",
  "",
  "17.7 Medical Insurance APIs",
  "- /medicalInsurance/services -> GET /all, POST /Add, PUT /Update/:ServiceId, DELETE /Delete/:ServiceId.",
  "- /medicalInsurance/providers -> GET /all, POST /Add, PUT /Update/:ProviderId, DELETE /Delete/:ProviderId.",
  "- /medicalInsurance/claims -> GET /all, GET /pending, POST /Add, POST /review/:ClaimId, PUT /Update/:ClaimId, DELETE /Delete/:ClaimId.",
  "- /medicalInsurance/claimLines -> GET /all, POST /Add, PUT /Update/:ClaimLineId, DELETE /Delete/:ClaimLineId.",
  "- /medicalInsurance/claimDocuments -> GET /all, GET /content, POST /Add, POST /Upload, PUT /Update/:DocId, DELETE /Delete.",
  "- /medicalInsurance/balances -> periods (all/distinct/bulkCreate/Add/Update/Delete), balance, recharge, recharge/bulk, transfer, statement, transfers, transactions.",
  "- /medicalInsurance/finance -> GET /approvedLines, POST /markPaid.",
  "",
  "17.8 Fleet Management APIs",
  "- /fleet/vehicles -> GET /, GET /summary/:id, GET /:id, POST /, PUT /:id, DELETE /:id.",
  "- /fleet/maintenance -> GET /, GET /overdue, GET /due, GET /:id, POST /, PUT /:id, POST /:id/start, POST /:id/complete, POST /:id/cancel.",
  "- /fleet/trips -> GET /, GET /:id, PUT /:id, POST /, DELETE /:id, POST /:id/delete, POST /:id/approve, POST /:id/reject, POST /:id/start, POST /:id/complete, POST /:id/cancel.",
  "- /fleet/trips employees -> GET /:id/employees, POST /:id/employees, DELETE /:id/employees/:employeeId.",
  "- /fleet/trips visitors -> GET /:id/visitors, POST /:id/visitors, DELETE /:id/visitors/:visitorId.",
  "- /fleet/trips approvals -> GET /:id/approvals.",
  "- /fleet/suppliers -> GET /, GET /:id, POST /, PUT /:id, DELETE /:id.",
  "- /fleet/insurance -> GET /, GET /expiring, GET /expired, GET /vehicle/:idVehicle, GET /vehicle/:idVehicle/active, GET /:id, POST /, PUT /:id, POST /:id/renew, POST /:id/cancel.",
  "- /fleet/documents -> GET /, GET /:id, POST /, PUT /:id, DELETE /:id.",
  "- /fleet/notifications -> GET /, GET /unread, POST /generate, PATCH /:id/read, PATCH /:id/dismiss, GET /rules, POST /rules, PUT /rules/:id, DELETE /rules/:id.",
  "",
  "17.9 Static and upload endpoints",
  "- /uploads serves static files from server uploads directory.",
  "- /medicalInsurance/claimDocuments/Upload and /upload/files support multipart uploads.",
  "",
  "18. Build, Deployment & Environment Configuration",
  "18.1 Frontend build (nageco workspace)",
  "- Prerequisite: Node.js and npm installed on build machine.",
  "- Install dependencies: npm install.",
  "- Production build command: npm run build.",
  "- Build output folder: nageco/build.",
  "- Frontend API base URL is controlled by REACT_APP_API_BASE (default fallback: http://10.0.2.2:5000).",
  "- Production build behavior includes GENERATE_SOURCEMAP=false in .env.production.",
  "",
  "18.2 Backend runtime (serveur workspace)",
  "- Prerequisite: Node.js and npm installed on application server.",
  "- Install dependencies: npm install.",
  "- Start command in current implementation: node index.js (no dedicated start script in package.json).",
  "- Server listens on port 5000.",
  "- Backend loads environment values using dotenv at startup.",
  "",
  "18.3 Deployment topology",
  "- Backend serves frontend static files using Express static middleware.",
  "- Preferred static path resolution: serveur/build if present, otherwise ../nageco/build.",
  "- SPA fallback route serves build/index.html for non-API GET requests.",
  "- API and frontend can be hosted behind one origin through backend static hosting.",
  "",
  "18.4 Environment configuration",
  "- Frontend variables: REACT_APP_API_BASE, GENERATE_SOURCEMAP.",
  "- Backend security variables: JWT_SECRET, JWT_EXPIRES_IN.",
  "- Backend .env also defines DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_DIALECT.",
  "- Clarification: current DB connection code uses hardcoded SQL config in serveur/config/database.js; align code with .env values for production governance.",
  "",
  "18.5 Recommended build and release procedure",
  "- Step 1: Install frontend and backend dependencies.",
  "- Step 2: Execute frontend production build (npm run build in nageco).",
  "- Step 3: Ensure build artifacts are reachable by backend static path.",
  "- Step 4: Start backend process (node index.js or managed process runner).",
  "- Step 5: Validate smoke checks on /api/health, /api/login, and core module pages.",
  "",
  "18.6 Post-deployment checks",
  "- Verify API health endpoint returns HTTP 200.",
  "- Verify login flow and JWT issuance are operational.",
  "- Verify static SPA loads and deep links resolve through backend fallback.",
  "- Verify uploads and claim document endpoints are reachable with valid authorization.",
  "",
  "18.7 Security and operations recommendations",
  "- Use strong, rotated JWT_SECRET per environment and never commit secrets to source control.",
  "- Move database credentials fully to environment configuration to avoid hardcoded credentials.",
  "- Add process supervision (for example, PM2 or service manager) and centralized logging.",
  "- Add environment-specific CORS allowlist and HTTPS termination at reverse proxy/load balancer.",
  "",
  "9. Delivery Statement",
  "Current status: ERP platform is delivered with integrated modules across HR, Finance, Supply Chain, Booking, Medical Insurance, and Fleet domains.",
  "This document captures the implemented structure and scope based on the active codebase.",
  "",
  "Prepared for: NAGECO stakeholders",
  "Prepared by: GitHub Copilot"
)

$paragraphBuilder = New-Object System.Text.StringBuilder
foreach ($line in $paragraphs) {
  if ([string]::IsNullOrEmpty($line)) {
    [void]$paragraphBuilder.AppendLine("    <w:p/>")
    continue
  }

  $escaped = Escape-XmlText -Text $line
  [void]$paragraphBuilder.AppendLine("    <w:p><w:r><w:t xml:space=`"preserve`">$escaped</w:t></w:r></w:p>")
}

$documentXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
            xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
            xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:w10="urn:schemas-microsoft-com:office:word"
            xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
            xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
            xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
            xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
            xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
            mc:Ignorable="w14 wp14">
  <w:body>
$($paragraphBuilder.ToString())
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>
"@

try {
  Set-Content -LiteralPath (Join-Path $tempRoot "[Content_Types].xml") -Value $contentTypesXml -Encoding UTF8
  Set-Content -Path (Join-Path $relsDir ".rels") -Value $rootRelsXml -Encoding UTF8
  Set-Content -Path (Join-Path $wordDir "document.xml") -Value $documentXml -Encoding UTF8

  if (Test-Path -Path $fullOutputPath) {
    Remove-Item -Path $fullOutputPath -Force
  }

  $zipPath = [System.IO.Path]::ChangeExtension($fullOutputPath, '.zip')
  if (Test-Path -Path $zipPath) {
    Remove-Item -Path $zipPath -Force
  }

  Compress-Archive -Path (Join-Path $tempRoot "*") -DestinationPath $zipPath -Force
  Move-Item -LiteralPath $zipPath -Destination $fullOutputPath -Force
  Write-Host "Word report generated:" $fullOutputPath
}
finally {
  if (Test-Path -Path $tempRoot) {
    Remove-Item -Path $tempRoot -Recurse -Force
  }
}