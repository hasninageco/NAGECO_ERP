param(
  [string]$OutputPath = (Join-Path $PSScriptRoot "..\Booking_System_Delivered_Report_2026-04-23.docx")
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

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("booking-report-" + [System.Guid]::NewGuid().ToString("N"))
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
  "BOOKING SYSTEM DELIVERED REPORT",
  "Project: NAGECO Web",
  "Date: April 23, 2026",
  "",
  "1. Executive Summary",
  "The Booking System for meeting management is delivered with end-to-end functionality for room administration, meeting scheduling, and report export.",
  "Implementation is available in both frontend (React) and backend (Node.js/Express + Sequelize) with active routes under /bookingSystem and API endpoints under /meetingSchedules and /meetingRooms.",
  "",
  "2. Delivered Scope",
  "2.1 Frontend features delivered",
  "- Booking module navigation integrated in dashboard menu: Booking System -> Calendar and Reports.",
  "- Calendar views: month, year, and day.",
  "- Meeting creation dialog with fields: title, date, start time, end time, room, members, and other members (emails).",
  "- Meeting edit dialog with save/update flow.",
  "- Meeting room management: list, add, edit, delete, and InServices status handling.",
  "- InServices rooms are highlighted and excluded from new booking selection.",
  "- Meeting cards displayed by day with title, room, members, start/end, and created-by user.",
  "",
  "2.2 Reports delivered",
  "- Dedicated reports section in booking module.",
  "- Meeting/booking report table with columns: title, date, start, end, room, members, created by.",
  "- Export to PDF implemented in client with formatted layout and optional logo.",
  "- Export to Excel implemented in client (xlsx) with header styling, wrapped member lists, and generated timestamp.",
  "",
  "2.3 Backend APIs delivered",
  "- Meeting schedule APIs: GET all, GET by ID, POST create, PUT update, DELETE remove.",
  "- Meeting schedule room list API: GET /meetingSchedules/rooms.",
  "- Meeting room APIs: GET all, GET by ID, POST create, PUT update, DELETE remove.",
  "- APIs are mounted in server entrypoint and accessible from frontend via buildApiUrl helper.",
  "",
  "2.4 Data model delivered",
  "- MeetingSchedule model includes: id_meeting, id_room, date_meeting, date_meeting_end, members_meeting, Other_members_meeting, comment, creation_date, usr.",
  "- MeetingRoom model includes: id_room, Name_room, Comment, Location, Address, InServices.",
  "",
  "2.5 Localization delivered",
  "- Booking labels are available in English and Arabic.",
  "- Report labels and date formatting adapt to current language direction.",
  "",
  "3. Implemented Validation and Rules",
  "- Required fields validation for title, date/time, room, and members in add meeting flow.",
  "- Overlap detection on frontend for same room and overlapping time range.",
  "- Preventing booking in the past via frontend validation message.",
  "- Created-by user is populated from local storage or decoded token where available.",
  "",
  "4. Clarification Notes (Current Behavior)",
  "4.1 Microsoft Teams integration",
  "- Teams booking calls Microsoft Graph with placeholder bearer token value (YOUR_ACCESS_TOKEN).",
  "- Clarification required: production authentication method and tenant/app registration are not yet finalized in code.",
  "",
  "4.2 Server-side booking conflict protection",
  "- Room overlap validation is currently enforced on frontend only.",
  "- Clarification required: if multi-user concurrency is expected, server-side conflict validation should be added to avoid race conditions.",
  "",
  "4.3 Date/time persistence format",
  "- Schedule fields are stored as string columns in the model.",
  "- Clarification required: whether the final database contract should be true datetime types with timezone policy.",
  "",
  "4.4 Security and access scope",
  "- Meeting routes are mounted and callable; no dedicated role-based checks are visible in meeting route/controller layer.",
  "- Clarification required: booking permissions matrix (who can create, edit, delete, or manage rooms).",
  "",
  "4.5 Data normalization",
  "- Members and other members are stored as comma-separated string values.",
  "- Clarification required: whether normalized relational attendee tables are required for analytics and audit expansion.",
  "",
  "5. Risks and Observations",
  "- Client-side-only overlap checks can fail under concurrent bookings.",
  "- String date storage can create sorting/parsing inconsistencies and timezone ambiguity.",
  "- Teams booking flow is not operational in production without secure OAuth token handling.",
  "- Console logs in controller create/update flows should be reviewed for production logging standards.",
  "",
  "6. Recommendation for Completion Phase",
  "- Add backend overlap guard (transaction/locking or robust conflict query).",
  "- Migrate meeting date fields to DATETIME with explicit timezone strategy.",
  "- Implement secure Microsoft Graph OAuth flow and secret management.",
  "- Define role-based access controls for room and meeting operations.",
  "- Add API and UI automated tests for create/update/delete, overlap, and exports.",
  "",
  "7. Delivery Status",
  "Current status: Delivered and running with core booking, room management, and reports export features.",
  "Build verification context indicates successful frontend build execution.",
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
  if (Test-Path -Path $zipPath) { Remove-Item -Path $zipPath -Force }
  Compress-Archive -Path (Join-Path $tempRoot "*") -DestinationPath $zipPath -Force
  Move-Item -LiteralPath $zipPath -Destination $fullOutputPath -Force
  Write-Host "Word report generated:" $fullOutputPath
}
finally {
  if (Test-Path -Path $tempRoot) {
    Remove-Item -Path $tempRoot -Recurse -Force
  }
}
