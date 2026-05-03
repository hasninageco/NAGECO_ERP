param(
  [string]$OutputPath = (Join-Path $PSScriptRoot "..\Medical_Insurance_System_Delivered_Report_2026-04-23.docx")
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

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("medical-report-" + [System.Guid]::NewGuid().ToString("N"))
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
  "MEDICAL INSURANCE SYSTEM DELIVERED REPORT",
  "Project: NAGECO Web",
  "Date: April 23, 2026",
  "",
  "1. Executive Summary",
  "The Medical Insurance System is delivered with end-to-end workflows for service catalog, provider management, claims lifecycle, doctor review, balance operations, transfers, statements, and finance payment processing.",
  "Implementation is available in frontend (React + TypeScript) and backend (Node.js/Express + Sequelize) with mounted API routes under /medicalInsurance.",
  "",
  "2. Delivered Scope",
  "2.1 Frontend features delivered",
  "- Insurance landing page with navigation cards for Services, Providers, Claims, and Finance.",
  "- Employee and dependent support: employee search by Ref_emp and child management dialog (add/edit children).",
  "- Services page: list, search, add, edit, delete, active flag, coverage percent, validity dates, and clinic category.",
  "- Providers page: list, search, add, edit, delete, active flag, provider type, city, phone, and address.",
  "- Claims page: employee/member selection, claim creation, claim line entry (service/qty/unit price), document upload/view, totals, and claim receipt printing.",
  "- Doctor review page: pending claims queue, per-line decision (Approve/Reject/NeedDocuments), review notes, and final claim review action.",
  "- Doctor reviewed claims page: historical reviewed claims with line-level statuses, notes, and document viewing.",
  "- Recharge page: balance period creation, recharge create/edit/delete, period-based balance view, and bulk recharge processing.",
  "- Transfer balance page: transfer between employees, transfer history, and printable transfer receipt.",
  "- Employee statement page: statement by employee and date range with running balance and printable output.",
  "- Finance payments page: approved-lines listing, paid/unpaid filtering, month/year filtering, mark paid per line, mark all paid, and printable finance report.",
  "",
  "2.2 Backend APIs delivered",
  "- Services APIs: /medicalInsurance/services (all, byId, Add, Update, Delete).",
  "- Providers APIs: /medicalInsurance/providers (all, byId, Add, Update, Delete).",
  "- Claims APIs: /medicalInsurance/claims (all, byId, pending, Add, Update, review, Delete).",
  "- Claim lines APIs: /medicalInsurance/claimLines (all, byId, Add, Update, Delete).",
  "- Claim documents APIs: /medicalInsurance/claimDocuments (all, Upload, content, Delete).",
  "- Balance APIs: /medicalInsurance/balances (periods, balance, recharge, transfer, statement, transactions).",
  "- Finance APIs: /medicalInsurance/finance (approvedLines, markPaid, paidByMonth).",
  "",
  "2.3 Core business logic delivered",
  "- Claims support employee or dependent member context via Ref_emp and EMP_CHILD.",
  "- Doctor review enforces workflow status transitions including Approved, Rejected, and NeedDocuments.",
  "- Financial deduction is tied to approved claim lines and period balance checks.",
  "- Claim document upload is persisted on server storage and can trigger re-submission behavior for need-docs claims.",
  "- Balance subsystem supports period creation, recharge credit, inter-employee transfer, and running statement calculation.",
  "- Finance subsystem supports payment marking for approved lines and monthly paid/unpaid tracking.",
  "",
  "2.4 Data model delivered (module scope)",
  "- Services: service code/name/type, clinic category, coverage percent, validity window, active flag.",
  "- Providers: provider code/name/type, location/contact fields, active flag.",
  "- Claims: claim header with employee/member, provider, type, dates, totals, status, notes.",
  "- Claim lines: service link, quantity, unit price, coverage/approved values, company/employee shares, line status.",
  "- Claim documents: file metadata and content retrieval by claim.",
  "- Balance periods and transactions: period windows, recharge/debit records, transfers, running balances.",
  "- Medical insurance payments: paid status and payment timestamps for approved claim lines.",
  "",
  "2.5 Localization and UX delivered",
  "- Medical insurance screens use i18n keys and support Arabic and English rendering.",
  "- Several pages provide formatted printable receipts/reports (claim, transfer, finance report, statement).",
  "",
  "3. Clarification Notes (Current Behavior)",
  "3.1 Authorization and role scope",
  "- Endpoints use bearer-token protected calls from frontend.",
  "- Clarification required: final role matrix for HR, doctor reviewer, finance, and admin actions.",
  "",
  "3.2 Document storage strategy",
  "- Claim documents are stored on server file system under uploads/Claims.",
  "- Clarification required: whether long-term storage should move to managed object storage with retention policy.",
  "",
  "3.3 Financial policy boundaries",
  "- Coverage, approved values, and payment split are handled through claim-line review and payment flows.",
  "- Clarification required: final governance for manual adjustments, reversal rules, and audit approval chain.",
  "",
  "3.4 Period governance",
  "- Balances operate by validity periods and transaction dates.",
  "- Clarification required: official period rollover policy and lock rules after month close.",
  "",
  "3.5 Printing and legal template",
  "- Receipts/reports are generated from frontend print views.",
  "- Clarification required: legal wording, signatures, and branding standards for final production templates.",
  "",
  "4. Risks and Observations",
  "- Local file storage for medical documents can require additional backup and access control hardening.",
  "- Multi-step financial actions (review, payment, transfer) require strict auditing and reconciliation discipline.",
  "- Business-critical decisions depend on consistent status transitions between claim and claim-line states.",
  "- High-volume usage may require indexing and pagination tuning on claims, transactions, and finance lists.",
  "",
  "5. Recommendation for Completion Phase",
  "- Enforce formal role-based access control by endpoint and action.",
  "- Add automated tests for claims lifecycle, review transitions, and finance mark-paid behavior.",
  "- Add storage hardening plan for uploaded documents (retention, backup, malware scan, access policy).",
  "- Add reconciliation reporting between approved claim lines, balance debits, and finance payments.",
  "- Add operational dashboards for pending review queues and payment aging.",
  "",
  "6. Delivery Status",
  "Current status: Delivered and operational for core medical insurance management, claims handling, review workflow, and finance processing.",
  "Scope verified against implemented frontend pages, backend routes/controllers, and model usage in this codebase.",
  "",
  "Prepared for: NAGECO project stakeholders",
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