import React from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControlLabel,
  Switch,
  Divider,
  Stack,
  InputAdornment,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  Collapse,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Autocomplete from "@mui/material/Autocomplete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import GavelIcon from "@mui/icons-material/Gavel";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import {
  getRequisitionReports,
  getRequisitionReportDetails,
  exportRequisitionReports,
  getSections,
  getSectionCategories,
  getCostCenters,
} from "../../services/supplyChain.api";
import ManagementApprovalPage from "./ManagementApprovalPage";
import WarehouseApprovalPage from "./WarehouseApprovalPage";

const reqStatusOptions = [
  "Draft",
  "Pending Warehouse Approval",
  "Warehouse Approved",
  "Pending Manager Approval",
  "Ready For Supplier Offers",
  "Quote Request In Progress",
  "Rejected By Warehouse",
  "Rejected By Manager",
  "Submitted",
  "In Progress",
  "Manager Approved",
  "Rejected",
];
const managerStatusOptions = ["Not Started", "Pending", "In Progress", "Approved", "Rejected"];
const warehouseStatusOptions = ["Not Started", "Pending", "Approved", "Rejected", "Completed"];

const summaryCards = [
  { key: "totalRequisitions", label: "Total Requisitions" },
  { key: "draftCount", label: "Draft" },
  { key: "submittedCount", label: "Submitted" },
  { key: "inProgressCount", label: "In Progress" },
  { key: "pendingManagerCount", label: "Pending Manager" },
  { key: "pendingWarehouseCount", label: "Pending Warehouse" },
  { key: "completedCount", label: "Completed" },
];

const initialFilters = {
  dateFrom: "",
  dateTo: "",
  num_bn: "",
  benefiaryDepart: null,
  sectionId: null,
  category: null,
  requisitionStatus: null,
  managerStatus: null,
  warehouseStatus: null,
  urgent: false,
};

const EMPTY_SUMMARY = {
  totalRequisitions: 0,
  draftCount: 0,
  submittedCount: 0,
  inProgressCount: 0,
  approvedCount: 0,
  rejectedCount: 0,
  pendingWarehouseCount: 0,
  completedCount: 0,
  pendingManagerCount: 0,
};

function getStatusTone(status, isDark) {
  const s = String(status || "").trim().toLowerCase();

  if (
    s === "approved" ||
    s === "completed" ||
    s === "warehouse approved" ||
    s === "manager approved" ||
    s === "ready for supplier offers"
  ) {
    return {
      bg: isDark ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.14)",
      border: isDark ? "rgba(16,185,129,0.42)" : "rgba(5,150,105,0.34)",
      color: isDark ? "#d1fae5" : "#065f46",
    };
  }

  if (s === "rejected" || s === "rejected by warehouse" || s === "rejected by manager") {
    return {
      bg: isDark ? "rgba(239,68,68,0.18)" : "rgba(239,68,68,0.12)",
      border: isDark ? "rgba(239,68,68,0.35)" : "rgba(220,38,38,0.32)",
      color: isDark ? "#fee2e2" : "#991b1b",
    };
  }

  if (s === "submitted") {
    return {
      bg: isDark ? "rgba(59,130,246,0.18)" : "rgba(59,130,246,0.12)",
      border: isDark ? "rgba(59,130,246,0.35)" : "rgba(37,99,235,0.32)",
      color: isDark ? "#dbeafe" : "#1e3a8a",
    };
  }

  if (s === "pending" || s === "pending warehouse approval" || s === "pending manager approval") {
    return {
      bg: isDark ? "rgba(249,115,22,0.22)" : "rgba(249,115,22,0.14)",
      border: isDark ? "rgba(249,115,22,0.4)" : "rgba(234,88,12,0.34)",
      color: isDark ? "#ffedd5" : "#9a3412",
    };
  }

  if (s === "in progress" || s === "inprogress" || s === "quote request in progress") {
    return {
      bg: isDark ? "rgba(20,184,166,0.2)" : "rgba(20,184,166,0.14)",
      border: isDark ? "rgba(20,184,166,0.38)" : "rgba(13,148,136,0.34)",
      color: isDark ? "#ccfbf1" : "#134e4a",
    };
  }

  return {
    bg: isDark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.16)",
    border: isDark ? "rgba(148,163,184,0.35)" : "rgba(100,116,139,0.3)",
    color: isDark ? "#e2e8f0" : "#334155",
  };
}

function statusChipSx(status, isDark) {
  const tone = getStatusTone(status, isDark);
  return {
    backgroundColor: tone.bg,
    border: `1px solid ${tone.border}`,
    color: tone.color,
    fontWeight: 700,
    letterSpacing: 0.15,
    fontSize: 11,
  };
}

function printLabel(v) {
  if (v === null || v === undefined) return "-";
  const text = String(v).trim();
  return text.length ? text : "-";
}

function dateOnly(v) {
  if (!v) return "-";
  return String(v).slice(0, 10);
}

function DetailInfoField({ label, value, isDark }) {
  return (
    <Box
      sx={{
        p: 1,
        borderRadius: 1.4,
        border: "1px solid",
        borderColor: isDark ? "rgba(148,163,184,0.34)" : "rgba(15,23,42,0.12)",
        background: isDark ? "#0f1a30" : "#ffffff",
        minHeight: 64,
      }}
    >
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 0.2 }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.35, fontWeight: 700, color: "text.primary", wordBreak: "break-word" }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function RequisitionReports({ onBack }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const ui = React.useMemo(
    () => ({
      pageBg: isDark ? "transparent" : "#f5f8fc",
      panelBg: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
      panelBorder: isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.18)",
      panelShadow: isDark ? "0 8px 24px rgba(2,6,23,0.28)" : "0 8px 24px rgba(15,23,42,0.08)",
      textPrimary: isDark ? "#e5e7eb" : "#0f172a",
      textMuted: isDark ? "rgba(229,231,235,0.74)" : "#475569",
      tableHeadBg: isDark ? "rgba(15,23,42,0.78)" : "#e9eef7",
      tableHeadBorder: isDark ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.18)",
      tableRowEven: isDark ? "rgba(255,255,255,0.01)" : "#ffffff",
      tableRowOdd: isDark ? "rgba(148,163,184,0.06)" : "#f8fbff",
      tableRowBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.12)",
      summaryCardBg: isDark
        ? "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)"
        : "linear-gradient(180deg, rgba(248,251,255,1) 0%, rgba(255,255,255,1) 100%)",
      summaryCardShadow: isDark ? "0 8px 24px rgba(2,6,23,0.18)" : "0 8px 20px rgba(37,99,235,0.08)",
      detailDialogBg: isDark ? "#0b1220" : "#f8fbff",
      detailDialogTitleBg: isDark ? "#111c35" : "#eef4ff",
      detailDialogPanelBg: isDark ? "#0f172a" : "#ffffff",
      detailDialogBackdrop: isDark ? "rgba(2,6,23,0.78)" : "rgba(15,23,42,0.35)",
      detailTableHeadBg: isDark ? "#1a2740" : "#e9eef7",
      detailTableRowEven: isDark ? "#0f1a30" : "#ffffff",
      detailTableRowOdd: isDark ? "#111d35" : "#f8fbff",
    }),
    [isDark]
  );

  const autocompletePopperSx = React.useMemo(
    () => ({
      "&[style]": {
        width: "min(92vw, 560px) !important",
      },
      "& .MuiAutocomplete-paper": {
        border: "1px solid",
        borderColor: ui.panelBorder,
        boxShadow: isDark ? "0 14px 28px rgba(2,6,23,0.42)" : "0 14px 28px rgba(15,23,42,0.16)",
      },
      "& .MuiAutocomplete-listbox": {
        maxHeight: 340,
      },
      "& .MuiAutocomplete-option": {
        alignItems: "flex-start",
        whiteSpace: "normal",
        wordBreak: "break-word",
        lineHeight: 1.3,
        py: 0.9,
      },
    }),
    [isDark, ui.panelBorder]
  );

  const [activePage, setActivePage] = React.useState("reports");
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState("");
  const [summary, setSummary] = React.useState(EMPTY_SUMMARY);
  const [rows, setRows] = React.useState([]);
  const [hasSearched, setHasSearched] = React.useState(false);

  const [sections, setSections] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [categories, setCategories] = React.useState([]);

  const [filters, setFilters] = React.useState({
    ...initialFilters,
  });

  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [detailsData, setDetailsData] = React.useState(null);
  const [detailsError, setDetailsError] = React.useState("");
  const [exportingFormat, setExportingFormat] = React.useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = React.useState(null);

  const hasDateFrom = !!String(filters.dateFrom || "").trim();
  const hasDateTo = !!String(filters.dateTo || "").trim();
  const hasAnyDateFilter = hasDateFrom || hasDateTo;

  const hasAnyNonDateFilter = React.useMemo(() => {
    return Boolean(
      String(filters.num_bn || "").trim() ||
        filters.benefiaryDepart !== null ||
        filters.sectionId !== null ||
        filters.category ||
        filters.requisitionStatus ||
        filters.managerStatus ||
        filters.warehouseStatus ||
        filters.urgent
    );
  }, [
    filters.num_bn,
    filters.benefiaryDepart,
    filters.sectionId,
    filters.category,
    filters.requisitionStatus,
    filters.managerStatus,
    filters.warehouseStatus,
    filters.urgent,
  ]);

  const hasAnyFilter = hasAnyDateFilter || hasAnyNonDateFilter;

  const dateRangeValid = React.useMemo(() => {
    if (!hasAnyDateFilter) return true;
    if (!hasDateFrom || !hasDateTo) return false;
    return new Date(filters.dateFrom) <= new Date(filters.dateTo);
  }, [hasAnyDateFilter, hasDateFrom, hasDateTo, filters.dateFrom, filters.dateTo]);

  const filterValidationMessage = React.useMemo(() => {
    if (!hasAnyFilter) return "Please select at least one filter to load reports.";
    if (hasAnyDateFilter && (!hasDateFrom || !hasDateTo)) {
      return "Please select both Date From and Date To when filtering by date.";
    }
    if (!dateRangeValid) return "Date From must be earlier than or equal to Date To.";
    return "";
  }, [hasAnyFilter, hasAnyDateFilter, hasDateFrom, hasDateTo, dateRangeValid]);

  const loadReports = React.useCallback(async () => {
    setHasSearched(true);
    if (filterValidationMessage) {
      setLoadError(filterValidationMessage);
      setSummary(EMPTY_SUMMARY);
      setRows([]);
      return;
    }

    setLoading(true);
    setLoadError("");
    try {
      const data = await getRequisitionReports(filters);
      setSummary(data?.summary || {});
      setRows(Array.isArray(data?.rows) ? data.rows : []);
    } catch (error) {
      console.error("loadReports error:", error);
      setLoadError(error?.response?.data?.message || "Failed to load requisition reports.");
      setSummary(EMPTY_SUMMARY);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters, filterValidationMessage]);

  React.useEffect(() => {
    let ignore = false;

    async function loadLookups() {
      try {
        const [sec, deps] = await Promise.all([getSections(), getCostCenters()]);
        if (ignore) return;
        setSections(Array.isArray(sec) ? sec : []);
        setDepartments(Array.isArray(deps) ? deps : []);
      } catch (error) {
        console.error("reports lookups error:", error);
      }
    }

    loadLookups();
    return () => {
      ignore = true;
    };
  }, []);

  React.useEffect(() => {
    let ignore = false;

    async function loadCategories() {
      if (!filters.sectionId) {
        setCategories([]);
        return;
      }

      try {
        const data = await getSectionCategories(Number(filters.sectionId));
        if (ignore) return;
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("reports categories error:", error);
        if (!ignore) setCategories([]);
      }
    }

    loadCategories();
    return () => {
      ignore = true;
    };
  }, [filters.sectionId]);

  const openDetails = async (numBn) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError("");
    try {
      const data = await getRequisitionReportDetails(numBn);
      setDetailsData(data);
    } catch (error) {
      console.error("openDetails error:", error);
      setDetailsError(error?.response?.data?.message || "Failed to load requisition details.");
      setDetailsData(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (filterValidationMessage) {
      setLoadError(filterValidationMessage);
      return;
    }

    try {
      setLoadError("");
      setExportingFormat(format);
      const blob = await exportRequisitionReports(filters, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      a.download = `requisition_reports_${stamp}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("handleExport error:", error);
      setLoadError(error?.response?.data?.message || "Failed to export requisition reports.");
    } finally {
      setExportingFormat("");
    }
  };

  const handleOpenExportMenu = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleCloseExportMenu = () => {
    setExportMenuAnchor(null);
  };

  const handleExportFromMenu = async (format) => {
    handleCloseExportMenu();
    await handleExport(format);
  };

  const handleClearFilters = () => {
    setFilters({ ...initialFilters });
    setLoadError("");
    setRows([]);
    setSummary(EMPTY_SUMMARY);
    setHasSearched(false);
  };

  const handleEditFromReports = (numBn) => {
    localStorage.setItem("requisitionEditorTargetNumBn", String(numBn));
    if (onBack) {
      onBack();
    }
  };

  const handlePrintDetails = () => {
    if (!detailsData) return;

    const esc = (v) => {
      if (v === null || v === undefined) return "-";
      return String(v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    };

    const header = detailsData.header || {};
    const items = Array.isArray(detailsData.items) ? detailsData.items : [];
    const status = detailsData.statusSummary || {};
    const reqNo = printLabel(header.num_bn);
    const reqDate = printLabel(dateOnly(header.date_req));
    const requester = printLabel(header.requester_name);
    const requesterJob = printLabel(header.requester_job_name);
    const department = printLabel(header.beneficiary_department_name);
    const costCenter = printLabel(header.cost_center);
    const branch = printLabel(header.branch);
    const reqStatus = printLabel(status.requisitionStatus || header.requisition_status);
    const managerStatus = printLabel(status.managerStatus || header.manager_status);
    const warehouseStatus = printLabel(status.warehouseStatus || header.warehouse_status);
    const requestTitle = printLabel(header.title);
    const reference = printLabel(header.reference);
    const urgent = header.is_urgent ? "Yes" : "No";
    const totalQty = items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);

    const html = `
      <html>
        <head>
          <title>Requisition ${esc(reqNo)}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; color: #0f172a; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
            .title { font-size: 18px; font-weight: 700; margin: 0; }
            .sub { margin-top: 2px; font-size: 12px; color: #334155; }
            .meta-grid { display: grid; grid-template-columns: repeat(2, minmax(240px,1fr)); gap: 6px 16px; margin-bottom: 10px; }
            .meta-item { font-size: 12px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 8px; }
            .meta-item b { color: #0f172a; }
            .status-row { display: grid; grid-template-columns: repeat(3, minmax(180px,1fr)); gap: 8px; margin-bottom: 10px; }
            .status-box { border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 8px; font-size: 12px; }
            .section-title { margin: 10px 0 6px; font-size: 13px; font-weight: 700; }
            .summary { font-size: 12px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; vertical-align: top; }
            th { background: #e2e8f0; font-weight: 700; }
            .footer { margin-top: 10px; font-size: 10px; color: #475569; display: flex; justify-content: space-between; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Requisition Details</h1>
            <div class="sub">Official Print View</div>
          </div>

          <div class="meta-grid">
            <div class="meta-item"><b>Request No:</b> ${esc(reqNo)}</div>
            <div class="meta-item"><b>Date:</b> ${esc(reqDate)}</div>
            <div class="meta-item"><b>Employee:</b> ${esc(requester)}</div>
            <div class="meta-item"><b>Job Title:</b> ${esc(requesterJob)}</div>
            <div class="meta-item"><b>Department:</b> ${esc(department)}</div>
            <div class="meta-item"><b>Cost Center:</b> ${esc(costCenter)}</div>
            <div class="meta-item"><b>Branch:</b> ${esc(branch)}</div>
            <div class="meta-item"><b>Urgent:</b> ${esc(urgent)}</div>
            <div class="meta-item"><b>Title:</b> ${esc(requestTitle)}</div>
            <div class="meta-item"><b>Reference:</b> ${esc(reference)}</div>
          </div>

          <div class="status-row">
            <div class="status-box"><b>Requisition Status</b><br/>${esc(reqStatus)}</div>
            <div class="status-box"><b>Manager Status</b><br/>${esc(managerStatus)}</div>
            <div class="status-box"><b>Warehouse Status</b><br/>${esc(warehouseStatus)}</div>
          </div>

          <div class="section-title">Items</div>
          <div class="summary"><b>Items Count:</b> ${items.length} &nbsp; | &nbsp; <b>Total Qty:</b> ${totalQty}</div>

          <table>
            <thead>
              <tr>
                <th>Req Item</th><th>Product</th><th>Qty</th><th>Unit</th><th>Part Number</th><th>Comment</th><th>Comment AR</th><th>Category</th><th>Section</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (it) => `<tr>
                    <td>${esc(it.Req_item)}</td>
                    <td>${esc(it.art)}</td>
                    <td>${esc(it.qty)}</td>
                    <td>${esc(it.unit)}</td>
                    <td>${esc(it.part_number)}</td>
                    <td>${esc(it.comment)}</td>
                    <td>${esc(it.comment_ar)}</td>
                    <td>${esc(it.category)}</td>
                    <td>${esc(it.section_name)}</td>
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>

          <div class="section-title">Approval / Warehouse Notes</div>
          <div class="meta-grid">
            <div class="meta-item"><b>Manager Approval Flag:</b> ${esc(printLabel(header.is_approved_l2))}</div>
            <div class="meta-item"><b>Manager Approval Date:</b> ${esc(printLabel(dateOnly(header.manager_approval_date)))}</div>
            <div class="meta-item"><b>Manager Comment:</b> ${esc(printLabel(header.manager_approval_comment))}</div>
            <div class="meta-item"><b>Warehouse User:</b> ${esc(printLabel(header.warehouse_approvals_user))}</div>
            <div class="meta-item"><b>Received Qty:</b> ${esc(printLabel(header.received_qty))}</div>
            <div class="meta-item"><b>Date Received:</b> ${esc(printLabel(dateOnly(header.date_received)))}</div>
            <div class="meta-item"><b>Warehouse Comment:</b> ${esc(printLabel(header.receive_comment))}</div>
          </div>

          <div class="footer">
            <span>Generated by ERP Requisition Reports</span>
            <span>${new Date().toISOString().slice(0, 19).replace("T", " ")}</span>
          </div>
        </body>
      </html>
    `;

    const w = window.open("", "_blank", "width=1200,height=800");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  };

  if (activePage === "management") {
    return (
      <Box>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <Button variant="outlined" onClick={() => setActivePage("reports")}>
            Back To Reports
          </Button>
        </Stack>
        <ManagementApprovalPage />
      </Box>
    );
  }

  if (activePage === "warehouse") {
    return (
      <Box>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <Button variant="outlined" onClick={() => setActivePage("reports")}>
            Back To Reports
          </Button>
        </Stack>
        <WarehouseApprovalPage />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        color: ui.textPrimary,
        background: ui.pageBg,
        "& .MuiOutlinedInput-root": {
          background: isDark ? "rgba(15,23,42,0.4)" : "#ffffff",
        },
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: ui.panelBorder,
        },
        "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: isDark ? "rgba(96,165,250,0.55)" : "rgba(37,99,235,0.44)",
        },
        "& .MuiInputLabel-root": {
          color: ui.textMuted,
          fontWeight: 500,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", md: "flex-end" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", md: "row" },
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0.2, color: ui.textPrimary }}>
            Requisition Reports
          </Typography>
          <Typography variant="body2" sx={{ color: ui.textMuted }}>
            كشف وتتبع الطلبيات مع حالة الاعتماد والاستلام
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", md: "auto" } }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ borderRadius: 2, borderColor: ui.panelBorder, color: isDark ? "#bfdbfe" : "#1d4ed8" }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            startIcon={<GavelIcon />}
            onClick={() => setActivePage("warehouse")}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              background: isDark
                ? "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)"
                : "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
            }}
          >
            Warehouse Approval
          </Button>
          <Button
            variant="contained"
            startIcon={<GavelIcon />}
            onClick={() => setActivePage("management")}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              background: isDark
                ? "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)"
                : "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
            }}
          >
            Management Approval
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={1.5} sx={{ mb: 2.3 }}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} lg={2} key={card.key}>
            <Paper
              sx={{
                p: 1.7,
                borderRadius: 2.2,
                border: "1px solid",
                borderColor: ui.panelBorder,
                position: "relative",
                overflow: "hidden",
                background: ui.summaryCardBg,
                boxShadow: ui.summaryCardShadow,
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background:
                    card.key === "draftCount"
                      ? "#94a3b8"
                      : card.key === "submittedCount"
                        ? "#3b82f6"
                        : card.key === "inProgressCount"
                          ? "#14b8a6"
                          : card.key === "pendingManagerCount" || card.key === "pendingWarehouseCount"
                            ? "#f97316"
                            : card.key === "completedCount"
                              ? "#10b981"
                              : "#64748b",
                }}
              />
              <Typography variant="caption" sx={{ color: ui.textMuted, fontWeight: 700 }}>
                {card.label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, mt: 0.3, color: ui.textPrimary }}>
                {Number(summary?.[card.key] || 0)}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          border: "1px solid",
          borderColor: ui.panelBorder,
          background: ui.panelBg,
          boxShadow: ui.panelShadow,
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 1.2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <FilterAltIcon fontSize="small" sx={{ color: isDark ? "#93c5fd" : "#2563eb" }} />
            <Typography sx={{ fontWeight: 800, color: ui.textPrimary }}>Filters</Typography>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              size="small"
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={loadReports}
              disabled={loading}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                background: isDark
                  ? "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)"
                  : "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
              }}
            >
              {loading ? "Searching..." : "Search"}
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              endIcon={<KeyboardArrowDownIcon />}
              disabled={!!exportingFormat || !!filterValidationMessage}
              onClick={handleOpenExportMenu}
              sx={{ borderRadius: 2, borderColor: ui.panelBorder, color: ui.textMuted }}
            >
              {exportingFormat ? "Exporting..." : "Export"}
            </Button>
            <Button
              size="small"
              variant="text"
              startIcon={<RestartAltIcon />}
              onClick={handleClearFilters}
              sx={{ borderRadius: 2, color: isDark ? "#93c5fd" : "#2563eb" }}
            >
              Clear Filters
            </Button>
          </Stack>
        </Stack>

        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={handleCloseExportMenu}
        >
          <MenuItem onClick={() => handleExportFromMenu("csv")}>Export CSV</MenuItem>
          <MenuItem onClick={() => handleExportFromMenu("xlsx")}>Export Excel</MenuItem>
        </Menu>

        <Divider sx={{ mb: 1.5, borderColor: ui.panelBorder }} />

        <Typography sx={{ fontSize: 12, fontWeight: 700, color: ui.textMuted, mb: 1 }}>Basic Filters</Typography>
        <Grid container spacing={1.5} sx={{ mb: 1 }}>
          <Grid item xs={12} md={2.5}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Date From"
              value={filters.dateFrom}
              onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={2.5}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Date To"
              value={filters.dateTo}
              onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Request No"
              value={filters.num_bn}
              onChange={(e) => setFilters((p) => ({ ...p, num_bn: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={2.5}>
            <Autocomplete
              options={departments}
              getOptionLabel={(o) => o?.administration || o?.administration_ar || `Department ${o?.id_administratin}`}
              value={departments.find((d) => Number(d.id_administratin) === Number(filters.benefiaryDepart)) || null}
              onChange={(_, v) => setFilters((p) => ({ ...p, benefiaryDepart: v ? Number(v.id_administratin) : null }))}
              componentsProps={{ popper: { sx: autocompletePopperSx } }}
              renderInput={(params) => <TextField {...params} label="Beneficiary Department" size="small" />}
              isOptionEqualToValue={(a, b) => a.id_administratin === b.id_administratin}
            />
          </Grid>

          <Grid item xs={12} md={2.5}>
            <Autocomplete
              options={sections}
              getOptionLabel={(o) => o?.DESIG || `Section ${o?.ID_SECTION}`}
              value={sections.find((s) => Number(s.ID_SECTION) === Number(filters.sectionId)) || null}
              onChange={(_, v) => setFilters((p) => ({ ...p, sectionId: v ? Number(v.ID_SECTION) : null, category: null }))}
              componentsProps={{ popper: { sx: autocompletePopperSx } }}
              renderInput={(params) => <TextField {...params} label="Section" size="small" />}
              isOptionEqualToValue={(a, b) => a.ID_SECTION === b.ID_SECTION}
            />
          </Grid>
        </Grid>

        <Button
          size="small"
          variant="text"
          onClick={() => setShowAdvancedFilters((prev) => !prev)}
          startIcon={showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ mb: 0.8, px: 0.3, color: isDark ? "#93c5fd" : "#2563eb" }}
        >
          {showAdvancedFilters ? "Hide Advanced Filters" : "Show Advanced Filters"}
        </Button>

        <Collapse in={showAdvancedFilters}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: ui.textMuted, mb: 1 }}>Advanced Filters</Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={categories}
                getOptionLabel={(o) => o?.label || ""}
                value={categories.find((c) => c.id === filters.category) || null}
                onChange={(_, v) => setFilters((p) => ({ ...p, category: v ? v.id : null }))}
                componentsProps={{ popper: { sx: autocompletePopperSx } }}
                renderInput={(params) => <TextField {...params} label="Category" size="small" />}
                isOptionEqualToValue={(a, b) => a.id === b.id}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Autocomplete
                options={reqStatusOptions}
                value={filters.requisitionStatus}
                onChange={(_, v) => setFilters((p) => ({ ...p, requisitionStatus: v || null }))}
                componentsProps={{ popper: { sx: autocompletePopperSx } }}
                renderInput={(params) => <TextField {...params} label="Requisition Status" size="small" />}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Autocomplete
                options={managerStatusOptions}
                value={filters.managerStatus}
                onChange={(_, v) => setFilters((p) => ({ ...p, managerStatus: v || null }))}
                componentsProps={{ popper: { sx: autocompletePopperSx } }}
                renderInput={(params) => <TextField {...params} label="Manager Status" size="small" />}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Autocomplete
                options={warehouseStatusOptions}
                value={filters.warehouseStatus}
                onChange={(_, v) => setFilters((p) => ({ ...p, warehouseStatus: v || null }))}
                componentsProps={{ popper: { sx: autocompletePopperSx } }}
                renderInput={(params) => <TextField {...params} label="Warehouse Status" size="small" />}
              />
            </Grid>

            <Grid item xs={12} md={3} sx={{ display: "flex", alignItems: "center" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.urgent}
                    onChange={(e) => setFilters((p) => ({ ...p, urgent: e.target.checked }))}
                  />
                }
                label="Urgent only"
              />
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      <Paper
        sx={{
          p: 1.5,
          overflowX: "auto",
          borderRadius: 2,
          border: "1px solid",
          borderColor: ui.panelBorder,
          background: ui.panelBg,
          boxShadow: ui.panelShadow,
        }}
      >
        {!!loadError && (
          <Alert severity="error" sx={{ mb: 1.2 }}>
            {loadError}
          </Alert>
        )}

        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              {[
                "Request No",
                "Date",
                "Department",
                "Cost Center",
                "Branch",
                "Section",
                "Category",
                "Items Count",
                "Total Qty",
                "Requisition Status",
                "Manager Status",
                "Warehouse Status",
                "Urgent",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "11px 10px",
                    borderBottom: `1px solid ${ui.tableHeadBorder}`,
                    position: "sticky",
                    top: 0,
                    background: ui.tableHeadBg,
                    color: ui.textPrimary,
                    zIndex: 1,
                    fontSize: 13,
                    letterSpacing: 0.15,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={14} style={{ padding: 16, color: ui.textMuted }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CircularProgress size={16} />
                    <span>Loading requisition reports...</span>
                  </Stack>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={14} style={{ padding: 20, color: ui.textMuted, textAlign: "center" }}>
                  {hasSearched
                    ? "No requisitions found. Try adjusting your filters or date range."
                    : "Use the filters above to load requisition reports."}
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr
                  key={r.num_bn}
                  style={{
                    background:
                      idx % 2 === 0
                        ? ui.tableRowEven
                        : ui.tableRowOdd,
                  }}
                >
                  <td style={{ padding: "11px 10px", borderBottom: `1px solid ${ui.tableRowBorder}`, fontWeight: 700 }}>{r.num_bn}</td>
                  <td style={{ padding: "11px 10px", borderBottom: `1px solid ${ui.tableRowBorder}`, whiteSpace: "nowrap" }}>{dateOnly(r.date_req)}</td>
                  <td style={{ padding: "11px 10px", borderBottom: `1px solid ${ui.tableRowBorder}`, fontWeight: 600 }}>{r.beneficiary_department_name || "-"}</td>
                  <td style={{ padding: "11px 10px", borderBottom: `1px solid ${ui.tableRowBorder}`, color: ui.textMuted }}>{r.cost_center || "-"}</td>
                  <td style={{ padding: "11px 10px", borderBottom: `1px solid ${ui.tableRowBorder}`, color: ui.textMuted }}>{r.branch || "-"}</td>
                  <td style={{ padding: "11px 10px", borderBottom: `1px solid ${ui.tableRowBorder}`, color: ui.textMuted }}>{r.section_name || "-"}</td>
                  <td style={{ padding: "11px 10px", borderBottom: `1px solid ${ui.tableRowBorder}`, color: ui.textMuted }}>{r.category || "-"}</td>
                  <td style={{ padding: "11px 10px", borderBottom: `1px solid ${ui.tableRowBorder}` }}>{r.items_count ?? 0}</td>
                  <td style={{ padding: "11px 10px", borderBottom: `1px solid ${ui.tableRowBorder}` }}>{r.total_qty ?? 0}</td>
                  <td style={{ padding: "11px 10px", borderBottom: `1px solid ${ui.tableRowBorder}` }}>
                    <Chip
                      size="small"
                      label={r.requisition_status || "-"}
                      sx={statusChipSx(r.requisition_status, isDark)}
                    />
                  </td>
                  <td style={{ padding: "11px 10px", borderBottom: `1px solid ${ui.tableRowBorder}` }}>
                    {String(r.requisition_status || "").trim().toLowerCase() === "draft" && (
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleEditFromReports(r.num_bn)}
                        sx={{ minWidth: 0, ml: 0.4, color: isDark ? "#93c5fd" : "#2563eb" }}
                      >
                        Edit
                      </Button>
                    )}
                    <Chip
                      size="small"
                      label={r.manager_status || "-"}
                      sx={statusChipSx(r.manager_status, isDark)}
                    />
                  </td>
                  <td style={{ padding: "11px 10px", borderBottom: `1px solid ${ui.tableRowBorder}` }}>
                    <Chip
                      size="small"
                      label={r.warehouse_status || "-"}
                      sx={statusChipSx(r.warehouse_status, isDark)}
                    />
                  </td>
                  <td style={{ padding: "11px 10px", borderBottom: `1px solid ${ui.tableRowBorder}` }}>
                    {r.is_urgent ? <Chip size="small" color="error" label="Urgent" /> : <Chip size="small" label="Normal" sx={{ color: ui.textMuted, border: `1px solid ${ui.panelBorder}` }} />}
                  </td>
                  <td style={{ padding: "11px 10px", borderBottom: `1px solid ${ui.tableRowBorder}` }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => openDetails(r.num_bn)}
                      sx={{ borderColor: ui.panelBorder, color: isDark ? "#bfdbfe" : "#1d4ed8" }}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Paper>

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
        BackdropProps={{
          sx: {
            backgroundColor: ui.detailDialogBackdrop,
            backdropFilter: "blur(2px)",
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: ui.panelBorder,
            background: ui.detailDialogBg,
            boxShadow: ui.panelShadow,
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: `1px solid ${ui.panelBorder}`,
            background: ui.detailDialogTitleBg,
            py: 1.2,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                Requisition Details
              </Typography>
              <Typography variant="body2" sx={{ color: ui.textMuted }}>
                Detailed request data, statuses, and item breakdown
              </Typography>
            </Box>

            {!!detailsData?.header && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={0.8}>
                <Chip
                  size="small"
                  label={`Req # ${printLabel(detailsData.header?.num_bn)}`}
                  sx={{
                    border: `1px solid ${ui.panelBorder}`,
                    color: ui.textPrimary,
                    background: isDark ? "rgba(148,163,184,0.18)" : "rgba(148,163,184,0.14)",
                    fontWeight: 700,
                  }}
                />
                <Chip
                  size="small"
                  label={printLabel(detailsData.header?.requisition_status)}
                  sx={statusChipSx(detailsData.header?.requisition_status, isDark)}
                />
                <Chip
                  size="small"
                  label={`Manager ${printLabel(detailsData.header?.manager_status)}`}
                  sx={statusChipSx(detailsData.header?.manager_status, isDark)}
                />
                <Chip
                  size="small"
                  label={`Warehouse ${printLabel(detailsData.header?.warehouse_status)}`}
                  sx={statusChipSx(detailsData.header?.warehouse_status, isDark)}
                />
              </Stack>
            )}
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ background: ui.detailDialogBg, py: 1.5 }}>
          {detailsLoading ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={16} />
              <Typography>Loading details...</Typography>
            </Stack>
          ) : detailsError ? (
            <Alert severity="error">{detailsError}</Alert>
          ) : !detailsData ? (
            <Typography>No details found.</Typography>
          ) : (
            <Stack spacing={1.4}>
              <Paper
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: ui.panelBorder,
                  background: ui.detailDialogPanelBg,
                }}
              >
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Request Overview</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailInfoField label="Request No" value={printLabel(detailsData.header?.num_bn)} isDark={isDark} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailInfoField label="Date" value={printLabel(dateOnly(detailsData.header?.date_req))} isDark={isDark} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailInfoField label="Requester" value={printLabel(detailsData.header?.requester_name)} isDark={isDark} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailInfoField label="Requester Job" value={printLabel(detailsData.header?.requester_job_name)} isDark={isDark} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <DetailInfoField label="Department" value={printLabel(detailsData.header?.beneficiary_department_name)} isDark={isDark} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <DetailInfoField label="Cost Center" value={printLabel(detailsData.header?.cost_center)} isDark={isDark} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <DetailInfoField label="Branch" value={printLabel(detailsData.header?.branch)} isDark={isDark} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DetailInfoField label="Title" value={printLabel(detailsData.header?.title)} isDark={isDark} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DetailInfoField label="Reference" value={printLabel(detailsData.header?.reference)} isDark={isDark} />
                  </Grid>
                </Grid>
              </Paper>

              <Paper
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: ui.panelBorder,
                  background: ui.detailDialogPanelBg,
                }}
              >
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Approval and Receiving</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailInfoField label="Manager Approval" value={printLabel(detailsData.header?.is_approved_l2)} isDark={isDark} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailInfoField label="Manager Approval Date" value={printLabel(dateOnly(detailsData.header?.manager_approval_date))} isDark={isDark} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailInfoField label="Received Qty" value={printLabel(detailsData.header?.received_qty)} isDark={isDark} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailInfoField label="Date Received" value={printLabel(dateOnly(detailsData.header?.date_received))} isDark={isDark} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <DetailInfoField label="Warehouse User" value={printLabel(detailsData.header?.warehouse_approvals_user)} isDark={isDark} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <DetailInfoField label="Manager Comment" value={printLabel(detailsData.header?.manager_approval_comment)} isDark={isDark} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <DetailInfoField label="Warehouse Comment" value={printLabel(detailsData.header?.receive_comment)} isDark={isDark} />
                  </Grid>
                </Grid>
              </Paper>

              <Paper
                sx={{
                  p: 1,
                  overflowX: "auto",
                  border: "1px solid",
                  borderColor: ui.panelBorder,
                  borderRadius: 2,
                  background: ui.detailDialogPanelBg,
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  sx={{ mb: 1 }}
                >
                  <Typography sx={{ fontWeight: 800 }}>Items</Typography>
                  <Chip
                    size="small"
                    label={`Items Count: ${Array.isArray(detailsData.items) ? detailsData.items.length : 0}`}
                    sx={{
                      border: `1px solid ${ui.panelBorder}`,
                      color: ui.textPrimary,
                      background: isDark ? "#14294a" : "rgba(59,130,246,0.12)",
                      fontWeight: 700,
                    }}
                  />
                </Stack>

                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      {[
                        "Req Item",
                        "Product",
                        "Qty",
                        "Unit",
                        "Part Number",
                        "Comment",
                        "Comment AR",
                        "Category",
                        "Section",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "9px 8px",
                            borderBottom: `1px solid ${ui.tableHeadBorder}`,
                            background: ui.detailTableHeadBg,
                            color: ui.textPrimary,
                            fontSize: 12,
                            letterSpacing: 0.1,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!Array.isArray(detailsData.items) || detailsData.items.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: 12, color: ui.textMuted, textAlign: "center" }}>
                          No items found.
                        </td>
                      </tr>
                    ) : (
                      detailsData.items.map((it, idx) => (
                        <tr
                          key={it.ID_REQ}
                          style={{
                            background: idx % 2 === 0 ? ui.detailTableRowEven : ui.detailTableRowOdd,
                          }}
                        >
                          <td style={{ padding: "9px 8px", borderBottom: `1px solid ${ui.tableRowBorder}` }}>{printLabel(it.Req_item)}</td>
                          <td style={{ padding: "9px 8px", borderBottom: `1px solid ${ui.tableRowBorder}` }}>{printLabel(it.art)}</td>
                          <td style={{ padding: "9px 8px", borderBottom: `1px solid ${ui.tableRowBorder}` }}>{printLabel(it.qty)}</td>
                          <td style={{ padding: "9px 8px", borderBottom: `1px solid ${ui.tableRowBorder}` }}>{printLabel(it.unit)}</td>
                          <td style={{ padding: "9px 8px", borderBottom: `1px solid ${ui.tableRowBorder}` }}>{printLabel(it.part_number)}</td>
                          <td style={{ padding: "9px 8px", borderBottom: `1px solid ${ui.tableRowBorder}` }}>{printLabel(it.comment)}</td>
                          <td style={{ padding: "9px 8px", borderBottom: `1px solid ${ui.tableRowBorder}` }}>{printLabel(it.comment_ar)}</td>
                          <td style={{ padding: "9px 8px", borderBottom: `1px solid ${ui.tableRowBorder}` }}>{printLabel(it.category)}</td>
                          <td style={{ padding: "9px 8px", borderBottom: `1px solid ${ui.tableRowBorder}` }}>{printLabel(it.section_name)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${ui.panelBorder}`, background: ui.detailDialogTitleBg }}>
          {!!detailsData && (
            <Button variant="outlined" onClick={handlePrintDetails} sx={{ borderColor: ui.panelBorder, color: isDark ? "#bfdbfe" : "#1d4ed8" }}>
              Print
            </Button>
          )}
          <Button onClick={() => setDetailsOpen(false)} sx={{ fontWeight: 700 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
