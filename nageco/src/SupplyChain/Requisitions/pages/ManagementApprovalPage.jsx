import React from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import {
  getMyApprovals,
  getManagementApprovalKpi,
  getApprovalDetails,
  approveRequest,
  rejectRequest,
} from "../../services/managementApprovalService";

const toDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const statusColor = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("approved")) return "success";
  if (normalized.includes("rejected")) return "error";
  if (normalized.includes("pending")) return "warning";
  return "default";
};

const isPendingStatus = (status) => {
  return String(status || "").toUpperCase() === "PENDING";
};

const escapeHtml = (value) => {
  const safe = String(value ?? "-");
  return safe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const formatAvgApprovalTime = (value) => {
  const minutes = Number(value || 0);
  if (!Number.isFinite(minutes) || minutes <= 0) return "-";

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const KpiFilterKeys = {
  pending: "pending",
  approvedToday: "approved_today",
  rejectedToday: "rejected_today",
  expiringSoon: "expiring_soon",
};

const KpiFilterLabels = {
  [KpiFilterKeys.pending]: "Pending Approvals",
  [KpiFilterKeys.approvedToday]: "Approved Today",
  [KpiFilterKeys.rejectedToday]: "Rejected Today",
  [KpiFilterKeys.expiringSoon]: "Expiring Soon",
};

const SortByKeys = {
  newest: "newest",
  urgent: "urgent",
  expiringSoon: "expiring_soon",
};

const getSlaUi = (sla) => {
  const normalized = String(sla || "").toUpperCase();
  if (normalized === "LATE") {
    return {
      chipColor: "error",
      rowBorder: "rgba(220,38,38,0.8)",
      rowBg: "rgba(127,29,29,0.08)",
    };
  }

  if (normalized === "URGENT") {
    return {
      chipColor: "warning",
      rowBorder: "rgba(245,158,11,0.8)",
      rowBg: "rgba(146,64,14,0.08)",
    };
  }

  return {
    chipColor: "default",
    rowBorder: null,
    rowBg: "transparent",
  };
};

function DetailField({ label, value, muted = false }) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: muted ? "text.secondary" : "text.primary",
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.25,
          fontWeight: 600,
          color: muted ? "text.secondary" : "text.primary",
          wordBreak: "break-word",
        }}
      >
        {value || "-"}
      </Typography>
    </Box>
  );
}

export default function ManagementApprovalPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const ui = React.useMemo(
    () => ({
      panelBg: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
      panelBorder: isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.16)",
      panelShadow: isDark ? "0 8px 24px rgba(2,6,23,0.3)" : "0 8px 24px rgba(15,23,42,0.08)",
      dialogBg: isDark ? "#0b1220" : "#f8fbff",
      dialogHeadBg: isDark
        ? "linear-gradient(135deg, rgba(30,64,175,0.35) 0%, rgba(15,23,42,0.9) 100%)"
        : "linear-gradient(135deg, rgba(219,234,254,0.88) 0%, rgba(255,255,255,1) 100%)",
      sectionBg: isDark ? "rgba(15,23,42,0.5)" : "#ffffff",
      sectionBorder: isDark ? "rgba(148,163,184,0.28)" : "rgba(15,23,42,0.14)",
      tableHeadBg: isDark ? "rgba(30,41,59,0.85)" : "#edf2fb",
      tableRowBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)",
      actionBg: isDark
        ? "linear-gradient(180deg, rgba(30,64,175,0.18) 0%, rgba(15,23,42,0.5) 100%)"
        : "linear-gradient(180deg, rgba(239,246,255,1) 0%, rgba(255,255,255,1) 100%)",
    }),
    [isDark]
  );

  const sectionCardSx = React.useMemo(
    () => ({
      p: 1.5,
      borderRadius: 2,
      border: "1px solid",
      borderColor: ui.sectionBorder,
      background: ui.sectionBg,
      boxShadow: isDark ? "none" : "0 4px 14px rgba(15,23,42,0.06)",
    }),
    [isDark, ui.sectionBg, ui.sectionBorder]
  );

  const actionFieldSx = React.useMemo(
    () => ({
      "& .MuiOutlinedInput-root": {
        borderRadius: 1.8,
        background: isDark ? "rgba(15,23,42,0.56)" : "#ffffff",
        transition: "all 140ms ease",
      },
      "& .MuiInputLabel-root": {
        fontWeight: 600,
        color: isDark ? "rgba(226,232,240,0.88)" : "#334155",
      },
      "& .MuiInputBase-input": {
        fontWeight: 600,
      },
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: isDark ? "rgba(148,163,184,0.34)" : "rgba(15,23,42,0.24)",
      },
      "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: isDark ? "rgba(96,165,250,0.62)" : "rgba(37,99,235,0.48)",
      },
      "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: isDark ? "rgba(96,165,250,0.9)" : "rgba(37,99,235,0.74)",
        borderWidth: 1.4,
      },
    }),
    [isDark]
  );

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const [kpi, setKpi] = React.useState(null);
  const [kpiLoading, setKpiLoading] = React.useState(false);
  const [kpiError, setKpiError] = React.useState("");
  const [activeKpiFilter, setActiveKpiFilter] = React.useState("");
  const [sortBy, setSortBy] = React.useState(SortByKeys.newest);
  const [expandedApprovalId, setExpandedApprovalId] = React.useState(null);
  const [expandedDetailsById, setExpandedDetailsById] = React.useState({});
  const [expandedLoadingId, setExpandedLoadingId] = React.useState(null);
  const [pdfLoadingId, setPdfLoadingId] = React.useState(null);

  const [quickModeOpen, setQuickModeOpen] = React.useState(false);
  const [quickIndex, setQuickIndex] = React.useState(0);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedApproval, setSelectedApproval] = React.useState(null);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [detailsError, setDetailsError] = React.useState("");
  const [detailsData, setDetailsData] = React.useState(null);

  const [approvalCode, setApprovalCode] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);

  const [snackbar, setSnackbar] = React.useState({
    open: false,
    severity: "success",
    message: "",
  });

  const showSnackbar = (severity, message) => {
    setSnackbar({ open: true, severity, message });
  };

  const loadApprovals = React.useCallback(async (kpiFilter = activeKpiFilter, sortKey = sortBy) => {
    setLoading(true);
    setError("");
    try {
      const query = {
        sortBy: sortKey,
      };
      if (kpiFilter) {
        query.kpiFilter = kpiFilter;
      }

      const response = await getMyApprovals(query);
      setRows(Array.isArray(response?.rows) ? response.rows : []);
      setExpandedApprovalId(null);
      setExpandedDetailsById({});
    } catch (err) {
      console.error("loadApprovals error:", err);
      setRows([]);
      setError(err?.response?.data?.message || "Failed to load management approvals");
    } finally {
      setLoading(false);
    }
  }, [activeKpiFilter, sortBy]);

  const loadKpi = React.useCallback(async () => {
    setKpiLoading(true);
    setKpiError("");

    try {
      const response = await getManagementApprovalKpi();
      setKpi({
        pending: Number(response?.pending || 0),
        approvedToday: Number(response?.approvedToday || 0),
        rejectedToday: Number(response?.rejectedToday || 0),
        avgApprovalTime: Number(response?.avgApprovalTime || 0),
        expiringSoon: Number(response?.expiringSoon || 0),
        approvalRate: Number(response?.approvalRate || 0),
        pendingBreakdown: {
          late: Number(response?.pendingBreakdown?.late || 0),
          urgent: Number(response?.pendingBreakdown?.urgent || 0),
          normal: Number(response?.pendingBreakdown?.normal || 0),
        },
        newPendingCount: Number(response?.newPendingCount || 0),
      });
    } catch (err) {
      console.error("loadKpi error:", err);
      setKpi(null);
      setKpiError(err?.response?.data?.message || "Failed to load KPI metrics");
    } finally {
      setKpiLoading(false);
    }
  }, []);

  const refreshPageData = React.useCallback(async () => {
    await Promise.all([loadApprovals(activeKpiFilter, sortBy), loadKpi()]);
  }, [activeKpiFilter, loadApprovals, loadKpi, sortBy]);

  React.useEffect(() => {
    refreshPageData();
  }, [refreshPageData]);

  const kpiCards = React.useMemo(
    () => [
      {
        key: KpiFilterKeys.pending,
        label: "Pending Approvals",
        value: Number(kpi?.pending || 0),
        color: "#f59e0b",
        clickable: true,
      },
      {
        key: KpiFilterKeys.approvedToday,
        label: "Approved Today",
        value: Number(kpi?.approvedToday || 0),
        color: "#16a34a",
        clickable: true,
      },
      {
        key: KpiFilterKeys.rejectedToday,
        label: "Rejected Today",
        value: Number(kpi?.rejectedToday || 0),
        color: "#dc2626",
        clickable: true,
      },
      {
        key: "avg_approval_time",
        label: "Avg Approval Time",
        value: formatAvgApprovalTime(kpi?.avgApprovalTime || 0),
        color: "#3b82f6",
        clickable: false,
        tooltip: "Average time between request creation and final manager decision.",
      },
      {
        key: "approval_rate",
        label: "Approval Rate",
        value: `${Number(kpi?.approvalRate || 0)}%`,
        color: "#14b8a6",
        clickable: false,
        tooltip: "Approved decisions divided by total completed decisions.",
      },
      {
        key: KpiFilterKeys.expiringSoon,
        label: "Expiring Soon",
        value: Number(kpi?.expiringSoon || 0),
        color: "#f97316",
        clickable: true,
      },
    ],
    [kpi]
  );

  const activeFilterLabel = activeKpiFilter ? KpiFilterLabels[activeKpiFilter] : "";

  const handleKpiFilterClick = React.useCallback(
    async (cardKey) => {
      setActiveKpiFilter(cardKey);
      await loadApprovals(cardKey, sortBy);
    },
    [loadApprovals, sortBy]
  );

  const clearKpiFilter = React.useCallback(async () => {
    setActiveKpiFilter("");
    await loadApprovals("", sortBy);
  }, [loadApprovals, sortBy]);

  const handleSortChange = async (event) => {
    const nextSort = event.target.value;
    setSortBy(nextSort);
    await loadApprovals(activeKpiFilter, nextSort);
  };

  const openDialog = async (approval, mode = "view") => {
    const safeMode = isPendingStatus(approval?.approval_status)
      ? mode
      : "view";

    setSelectedApproval({ ...approval, mode: safeMode });
    setDialogOpen(true);
    setDetailsData(null);
    setDetailsError("");
    setApprovalCode("");
    setComment("");

    setDetailsLoading(true);
    try {
      const response = await getApprovalDetails(approval.approval_id);
      setDetailsData(response || null);
    } catch (err) {
      console.error("getApprovalDetails error:", err);
      setDetailsError(err?.response?.data?.message || "Failed to load approval details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const toggleRowExpand = async (row) => {
    const approvalId = row?.approval_id;
    if (!approvalId) return;

    if (expandedApprovalId === approvalId) {
      setExpandedApprovalId(null);
      return;
    }

    setExpandedApprovalId(approvalId);

    if (expandedDetailsById[approvalId]) {
      return;
    }

    setExpandedLoadingId(approvalId);
    try {
      const response = await getApprovalDetails(approvalId);
      setExpandedDetailsById((prev) => ({
        ...prev,
        [approvalId]: response,
      }));
    } catch (err) {
      showSnackbar("error", err?.response?.data?.message || "Failed to load row details");
    } finally {
      setExpandedLoadingId(null);
    }
  };

  const expiringSoonCount = Number(kpi?.pendingBreakdown?.urgent || 0);
  const lateCount = Number(kpi?.pendingBreakdown?.late || 0);
  const newPendingCount = Number(kpi?.newPendingCount || 0);

  const quickModeRows = rows.filter((r) => String(r?.approval_status || "").toUpperCase() === "PENDING");
  const currentQuickApproval = quickModeRows[quickIndex] || null;

  const openQuickMode = () => {
    setQuickIndex(0);
    setQuickModeOpen(true);
  };

  const downloadApprovalPdf = async (approval) => {
    if (!approval?.approval_id) return;

    setPdfLoadingId(approval.approval_id);
    try {
      let details = expandedDetailsById[approval.approval_id] || null;
      if (!details) {
        details = await getApprovalDetails(approval.approval_id);
      }

      const approvalInfo = details?.approval || {};
      const header = details?.requisition?.header || {};
      const items = Array.isArray(details?.requisition?.items) ? details.requisition.items : [];

      const rowsHtml = items.length
        ? items
            .map(
              (item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${escapeHtml(item.Req_item || "-")}</td>
                  <td>${escapeHtml(item.art || "-")}</td>
                  <td>${escapeHtml(item.qty ?? 0)}</td>
                  <td>${escapeHtml(item.unit || "-")}</td>
                  <td>${escapeHtml(item.comment || "-")}</td>
                </tr>
              `
            )
            .join("")
        : `<tr><td colspan="6">No items found</td></tr>`;

      const html = `
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Management Approval ${escapeHtml(approvalInfo.request_no || approval.request_no || "")}</title>
            <style>
              body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; margin: 24px; color: #0f172a; }
              .page { border: 1px solid #dbe3f0; border-radius: 10px; overflow: hidden; }
              .head { background: linear-gradient(90deg, #0f172a, #1e3a8a); color: white; padding: 16px 20px; }
              .head h1 { margin: 0; font-size: 20px; }
              .head p { margin: 6px 0 0; opacity: 0.9; font-size: 12px; }
              .content { padding: 18px 20px; }
              .grid { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 10px 18px; margin-bottom: 14px; }
              .field { border-bottom: 1px dashed #dbe3f0; padding-bottom: 6px; }
              .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .5px; }
              .value { font-size: 14px; font-weight: 600; margin-top: 3px; word-break: break-word; }
              .badge { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
              .approved { background: #dcfce7; color: #166534; }
              .rejected { background: #fee2e2; color: #991b1b; }
              .pending { background: #fef3c7; color: #92400e; }
              h2 { margin: 16px 0 10px; font-size: 15px; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th { background: #1e40af; color: #fff; text-align: left; padding: 8px; }
              td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
              tr:nth-child(even) td { background: #f8fafc; }
              .footer { margin-top: 12px; font-size: 11px; color: #64748b; text-align: right; }
              @media print { body { margin: 0; } .page { border: none; border-radius: 0; } }
            </style>
          </head>
          <body>
            <div class="page">
              <div class="head">
                <h1>Management Approval Form</h1>
                <p>NAGECO Supply Chain</p>
              </div>
              <div class="content">
                <div class="grid">
                  <div class="field"><div class="label">Approval ID</div><div class="value">${escapeHtml(approvalInfo.approval_id || approval.approval_id || "-")}</div></div>
                  <div class="field"><div class="label">Request No</div><div class="value">${escapeHtml(approvalInfo.request_no || approval.request_no || "-")}</div></div>
                  <div class="field"><div class="label">Status</div><div class="value">
                    <span class="badge ${String(approvalInfo.approval_status || approval.approval_status || "").toLowerCase().includes("approved") ? "approved" : String(approvalInfo.approval_status || approval.approval_status || "").toLowerCase().includes("rejected") ? "rejected" : "pending"}">
                      ${escapeHtml(approvalInfo.approval_status || approval.approval_status || "-")}
                    </span>
                  </div></div>
                  <div class="field"><div class="label">SLA</div><div class="value">${escapeHtml(approval.sla_status || "NORMAL")}</div></div>
                  <div class="field"><div class="label">Requester</div><div class="value">${escapeHtml(approvalInfo.requester_name || approval.requester_name || "-")}</div></div>
                  <div class="field"><div class="label">Requester Email</div><div class="value">${escapeHtml(approvalInfo.requester_email || approval.requester_email || "-")}</div></div>
                  <div class="field"><div class="label">Approver</div><div class="value">${escapeHtml(approvalInfo.approver_name || approval.approver_name || "-")}</div></div>
                  <div class="field"><div class="label">Approver Email</div><div class="value">${escapeHtml(approvalInfo.approver_email || approval.approver_email || "-")}</div></div>
                  <div class="field"><div class="label">Created At</div><div class="value">${escapeHtml(toDate(approvalInfo.created_at || approval.created_at))}</div></div>
                  <div class="field"><div class="label">Decided At</div><div class="value">${escapeHtml(toDate(approvalInfo.decided_at || approval.decided_at))}</div></div>
                  <div class="field"><div class="label">Title</div><div class="value">${escapeHtml(header.Requisition_Title || "-")}</div></div>
                  <div class="field"><div class="label">Reference</div><div class="value">${escapeHtml(header.Requestrefrence || "-")}</div></div>
                </div>

                <h2>Requisition Items</h2>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                  </tbody>
                </table>

                <div class="footer">Generated on ${escapeHtml(new Date().toLocaleString())}</div>
              </div>
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open("", "_blank", "width=1100,height=800");
      if (!printWindow) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    } catch (err) {
      console.error("downloadApprovalPdf error:", err);
      showSnackbar("error", err?.response?.data?.message || err?.message || "Failed to generate PDF");
    } finally {
      setPdfLoadingId(null);
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedApproval(null);
    setDetailsData(null);
    setDetailsError("");
    setApprovalCode("");
    setComment("");
  };

  const handleApprove = async () => {
    if (!selectedApproval) return;
    if (!isPendingStatus(selectedApproval?.approval_status)) {
      showSnackbar("info", "This request is already decided. View only.");
      return;
    }
    if (!approvalCode.trim()) {
      showSnackbar("error", "Approval code is required");
      return;
    }

    setActionLoading(true);
    try {
      await approveRequest(selectedApproval.approval_id, {
        approvalCode: approvalCode.trim(),
        comment: comment.trim() || undefined,
      });

      showSnackbar("success", "Request approved successfully");
      closeDialog();
      await loadApprovals(activeKpiFilter);
    } catch (err) {
      console.error("approveRequest error:", err);
      showSnackbar(
        "error",
        err?.response?.data?.message || "Failed to approve request"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval) return;
    if (!isPendingStatus(selectedApproval?.approval_status)) {
      showSnackbar("info", "This request is already decided. View only.");
      return;
    }
    if (!comment.trim()) {
      showSnackbar("error", "Comment is required for reject");
      return;
    }

    setActionLoading(true);
    try {
      await rejectRequest(selectedApproval.approval_id, {
        comment: comment.trim(),
      });

      showSnackbar("success", "Request rejected successfully");
      closeDialog();
      await loadApprovals(activeKpiFilter);
    } catch (err) {
      console.error("rejectRequest error:", err);
      showSnackbar(
        "error",
        err?.response?.data?.message || "Failed to reject request"
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ color: isDark ? "#e5e7eb" : "#0f172a" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={1}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Management Approval
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.72 }}>
            Pending approvals assigned to current manager.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={openQuickMode} disabled={loading || quickModeRows.length === 0}>
            Quick Approve Mode
          </Button>
          <Button variant="outlined" onClick={refreshPageData} disabled={loading || kpiLoading}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      <Paper
        sx={{
          p: 1.5,
          mb: 1.5,
          borderRadius: 2,
          border: "1px solid",
          borderColor: ui.panelBorder,
          background: ui.panelBg,
          boxShadow: ui.panelShadow,
        }}
      >
        <Typography sx={{ fontWeight: 800, mb: 1 }}>KPI Overview</Typography>

        {kpiLoading ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1 }}>
            <CircularProgress size={18} />
            <Typography>Loading KPIs...</Typography>
          </Stack>
        ) : kpiError ? (
          <Alert severity="warning">{kpiError}</Alert>
        ) : !kpi ? (
          <Alert severity="info">No KPI data available.</Alert>
        ) : (
          <Grid container spacing={1.2}>
            {kpiCards.map((card) => (
              <Grid item xs={12} sm={6} md={4} lg={2.4} key={card.key}>
                <Paper
                  onClick={card.clickable ? () => handleKpiFilterClick(card.key) : undefined}
                  sx={{
                    p: 1.2,
                    borderRadius: 1.8,
                    border: "1px solid",
                    borderColor: activeKpiFilter === card.key ? card.color : ui.panelBorder,
                    position: "relative",
                    overflow: "hidden",
                    background: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                    boxShadow:
                      activeKpiFilter === card.key
                        ? `0 0 0 1px ${card.color} inset`
                        : isDark
                        ? "none"
                        : "0 4px 12px rgba(15,23,42,0.08)",
                    cursor: card.clickable ? "pointer" : "default",
                    transition: "all 140ms ease",
                    transform: "translateY(0)",
                    "&:hover": card.clickable
                      ? {
                          transform: "translateY(-1px)",
                          background: isDark ? "rgba(255,255,255,0.05)" : "#f8fbff",
                        }
                      : undefined,
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: card.color,
                    }}
                  />
                  <Stack direction="row" spacing={0.6} alignItems="center">
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                      {card.label}
                    </Typography>
                    {!!card.tooltip && (
                      <Tooltip title={card.tooltip} placement="top" arrow>
                        <InfoOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                      </Tooltip>
                    )}
                  </Stack>
                  <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, mt: 0.3 }}>
                    {card.value}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {!!kpi && (
        <Stack direction="row" spacing={1} sx={{ mt: -0.5, mb: 1.5, flexWrap: "wrap" }}>
          <Chip size="small" label={`Pending Late: ${Number(kpi?.pendingBreakdown?.late || 0)}`} color="error" />
          <Chip
            size="small"
            label={`Pending Urgent: ${Number(kpi?.pendingBreakdown?.urgent || 0)}`}
            color="warning"
          />
          <Chip
            size="small"
            label={`Pending Normal: ${Number(kpi?.pendingBreakdown?.normal || 0)}`}
            color="default"
          />
        </Stack>
      )}

          {(lateCount > 0 || expiringSoonCount > 0 || newPendingCount > 0) && (
            <Stack spacing={1} sx={{ mb: 1.5 }}>
              {lateCount > 0 && (
                <Alert severity="error">{lateCount} request(s) are already late.</Alert>
              )}
              {expiringSoonCount > 0 && (
                <Alert severity="warning">{expiringSoonCount} request(s) are expiring soon.</Alert>
              )}
              {newPendingCount > 0 && (
                <Alert severity="info">{newPendingCount} new pending request(s) in the last 30 minutes.</Alert>
              )}
            </Stack>
          )}

          {!!error && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {error}
            </Alert>
          )}

          <Paper
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: ui.panelBorder,
              background: ui.panelBg,
              boxShadow: ui.panelShadow,
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "center" }}
              sx={{ mb: 1.2 }}
            >
              {!!activeFilterLabel ? (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Showing: {activeFilterLabel}
                  </Typography>
                  <Button size="small" variant="text" onClick={clearKpiFilter} disabled={loading}>
                    Clear Filter
                  </Button>
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Pending Decisions Queue
                </Typography>
              )}

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="management-sort-by">Sort By</InputLabel>
                <Select
                  labelId="management-sort-by"
                  label="Sort By"
                  value={sortBy}
                  onChange={handleSortChange}
                >
                  <MenuItem value={SortByKeys.newest}>Newest</MenuItem>
                  <MenuItem value={SortByKeys.urgent}>Urgent First</MenuItem>
                  <MenuItem value={SortByKeys.expiringSoon}>Expiring Soon</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {loading ? (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 2 }}>
                <CircularProgress size={18} />
                <Typography>
                  {activeKpiFilter ? "Applying KPI filter..." : "Loading pending approvals..."}
                </Typography>
              </Stack>
            ) : rows.length === 0 ? (
              <Alert severity="info">
                {activeKpiFilter
                  ? "No approvals matching this filter"
                  : "No pending approvals found."}
              </Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Request No</TableCell>
                      <TableCell>Requester</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>SLA</TableCell>
                      <TableCell>Response Time</TableCell>
                      <TableCell>Viewed At</TableCell>
                      <TableCell>Expires At</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => {
                      const expanded = expandedApprovalId === row.approval_id;
                      const expandedDetails = expandedDetailsById[row.approval_id];
                      const slaUi = getSlaUi(row?.sla_status);

                      return (
                        <React.Fragment key={row.approval_id}>
                          <TableRow
                            hover
                            onClick={() => toggleRowExpand(row)}
                            sx={{
                              cursor: "pointer",
                              background: slaUi.rowBg,
                              "& td": {
                                borderLeft: slaUi.rowBorder ? `3px solid ${slaUi.rowBorder}` : undefined,
                              },
                            }}
                          >
                            <TableCell>{row.request_no || "-"}</TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 700 }}>{row.requester_name || "-"}</Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                {row.requester_email || "-"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip size="small" color={statusColor(row.approval_status)} label={row.approval_status || "-"} />
                            </TableCell>
                            <TableCell>
                              <Chip size="small" color={slaUi.chipColor} label={row.sla_status || "NORMAL"} />
                            </TableCell>
                            <TableCell>{row.response_time_minutes ?? "-"} min</TableCell>
                            <TableCell>{toDate(row.viewed_at)}</TableCell>
                            <TableCell>{toDate(row.code_expires_at)}</TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.7} onClick={(e) => e.stopPropagation()}>
                                {isPendingStatus(row?.approval_status) && (
                                  <>
                                    <Button size="small" color="success" variant="contained" onClick={() => openDialog(row, "approve")}>
                                      Approve
                                    </Button>
                                    <Button size="small" color="error" variant="outlined" onClick={() => openDialog(row, "reject")}>
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {!isPendingStatus(row?.approval_status) && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => downloadApprovalPdf(row)}
                                    disabled={pdfLoadingId === row.approval_id}
                                  >
                                    {pdfLoadingId === row.approval_id ? "PDF..." : "PDF"}
                                  </Button>
                                )}
                                <Button size="small" variant="outlined" onClick={() => openDialog(row, "view")}>
                                  View
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>

                          <TableRow>
                            <TableCell colSpan={8} sx={{ py: 0, borderBottomColor: ui.tableRowBorder }}>
                              <Collapse in={expanded} timeout="auto" unmountOnExit>
                                <Box sx={{ p: 1.2, background: isDark ? "rgba(15,23,42,0.45)" : "#f8fbff" }}>
                                  {expandedLoadingId === row.approval_id ? (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <CircularProgress size={16} />
                                      <Typography variant="body2">Loading row details...</Typography>
                                    </Stack>
                                  ) : !expandedDetails ? (
                                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                      No additional details loaded.
                                    </Typography>
                                  ) : (
                                    <Stack spacing={1}>
                                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {expandedDetails?.requisition?.header?.Requisition_Title || "Requisition Details"}
                                      </Typography>

                                      <TableContainer>
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow>
                                              <TableCell>Item</TableCell>
                                              <TableCell>Product</TableCell>
                                              <TableCell>Qty</TableCell>
                                              <TableCell>Comment</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {(expandedDetails?.requisition?.items || []).slice(0, 5).map((item) => (
                                              <TableRow key={item.ID_REQ}>
                                                <TableCell>{item.Req_item || "-"}</TableCell>
                                                <TableCell>{item.art || "-"}</TableCell>
                                                <TableCell>{item.qty ?? 0}</TableCell>
                                                <TableCell>{item.comment || "-"}</TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </TableContainer>

                                      {isPendingStatus(row?.approval_status) && (
                                        <Stack direction="row" spacing={1}>
                                          <Button size="small" color="success" variant="contained" onClick={() => openDialog(row, "approve")}>
                                            Approve
                                          </Button>
                                          <Button size="small" color="error" variant="outlined" onClick={() => openDialog(row, "reject")}>
                                            Reject
                                          </Button>
                                        </Stack>
                                      )}
                                    </Stack>
                                  )}
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

      <Dialog
        open={dialogOpen}
        onClose={actionLoading ? undefined : closeDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: ui.panelBorder,
            background: ui.dialogBg,
            boxShadow: isDark ? "0 22px 48px rgba(0,0,0,0.55)" : "0 22px 48px rgba(15,23,42,0.2)",
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: "1px solid",
            borderColor: ui.panelBorder,
            background: ui.dialogHeadBg,
            py: 1.4,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                Management Approval
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Review request details and submit approval decision
              </Typography>
            </Box>
            {!!selectedApproval && (
              <Chip
                size="small"
                color={statusColor(selectedApproval?.approval_status)}
                label={`Status: ${selectedApproval?.approval_status || "-"}${
                  selectedApproval?.mode ? ` | ${String(selectedApproval.mode).toUpperCase()}` : ""
                }`}
                sx={{ fontWeight: 700 }}
              />
            )}
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ background: ui.dialogBg }}>
          {detailsLoading ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={18} />
              <Typography>Loading approval details...</Typography>
            </Stack>
          ) : detailsError ? (
            <Alert severity="error">{detailsError}</Alert>
          ) : !detailsData ? (
            <Alert severity="info">No details found.</Alert>
          ) : (
            <Stack spacing={1.5}>
              <Paper sx={sectionCardSx}>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Approval Info</Typography>
                <Grid container spacing={1.2}>
                  <Grid item xs={12} md={4}>
                    <DetailField label="Request No" value={detailsData?.approval?.request_no} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <DetailField label="Requester Name" value={detailsData?.approval?.requester_name} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <DetailField label="Requester Email" value={detailsData?.approval?.requester_email} muted />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DetailField label="Approver Name" value={detailsData?.approval?.approver_name} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
                        Approval Status
                      </Typography>
                      <Box sx={{ mt: 0.4 }}>
                        <Chip
                          size="small"
                          color={statusColor(detailsData?.approval?.approval_status)}
                          label={detailsData?.approval?.approval_status || "-"}
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={sectionCardSx}>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Requisition Header</Typography>
                <Grid container spacing={1.2}>
                  <Grid item xs={12} md={3}>
                    <DetailField label="Request No" value={detailsData?.requisition?.header?.num_bn} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <DetailField label="Date" value={toDate(detailsData?.requisition?.header?.date_req)} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <DetailField label="Reference" value={detailsData?.requisition?.header?.Requestrefrence} muted />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <DetailField label="Status" value={detailsData?.requisition?.header?.requisition_status} />
                  </Grid>
                  <Grid item xs={12}>
                    <DetailField label="Title" value={detailsData?.requisition?.header?.Requisition_Title} />
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={sectionCardSx}>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Requisition Items</Typography>
                {!Array.isArray(detailsData?.requisition?.items) ||
                detailsData.requisition.items.length === 0 ? (
                  <Alert severity="info">No items found.</Alert>
                ) : (
                  <TableContainer
                    sx={{
                      border: "1px solid",
                      borderColor: ui.tableRowBorder,
                      borderRadius: 1.5,
                      overflow: "auto",
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, background: ui.tableHeadBg }}>Req Item</TableCell>
                          <TableCell sx={{ fontWeight: 700, background: ui.tableHeadBg }}>Product</TableCell>
                          <TableCell sx={{ fontWeight: 700, background: ui.tableHeadBg }}>Qty</TableCell>
                          <TableCell sx={{ fontWeight: 700, background: ui.tableHeadBg }}>Unit</TableCell>
                          <TableCell sx={{ fontWeight: 700, background: ui.tableHeadBg }}>Part Number</TableCell>
                          <TableCell sx={{ fontWeight: 700, background: ui.tableHeadBg }}>Comment</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailsData.requisition.items.map((item) => (
                          <TableRow key={item.ID_REQ}>
                            <TableCell sx={{ borderBottomColor: ui.tableRowBorder }}>{item.Req_item || "-"}</TableCell>
                            <TableCell sx={{ borderBottomColor: ui.tableRowBorder }}>{item.art || "-"}</TableCell>
                            <TableCell sx={{ borderBottomColor: ui.tableRowBorder }}>{item.qty ?? 0}</TableCell>
                            <TableCell sx={{ borderBottomColor: ui.tableRowBorder }}>{item.unit || "-"}</TableCell>
                            <TableCell sx={{ borderBottomColor: ui.tableRowBorder }}>{item.part_number || "-"}</TableCell>
                            <TableCell sx={{ borderBottomColor: ui.tableRowBorder }}>{item.comment || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>

              {selectedApproval?.mode !== "view" && isPendingStatus(selectedApproval?.approval_status) && (
                <Paper
                  sx={{
                    ...sectionCardSx,
                    background: ui.actionBg,
                    borderColor: isDark ? "rgba(96,165,250,0.35)" : "rgba(37,99,235,0.22)",
                  }}
                >
                  <Typography sx={{ fontWeight: 800, mb: 1 }}>Approval Action</Typography>
                  <Typography sx={{ fontSize: 12.5, color: "text.secondary", mb: 1.1 }}>
                    {selectedApproval?.mode === "approve"
                      ? "Enter approval code and optional note, then confirm approve."
                      : "Provide a clear rejection reason, then confirm reject."}
                  </Typography>

                  <Box
                    sx={{
                      maxWidth: { xs: "100%", md: 760 },
                      mx: "auto",
                      p: { xs: 1, sm: 1.2 },
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: isDark ? "rgba(148,163,184,0.3)" : "rgba(15,23,42,0.14)",
                      background: isDark ? "rgba(2,6,23,0.32)" : "rgba(255,255,255,0.82)",
                    }}
                  >
                    <Stack spacing={1.2}>
                      {selectedApproval?.mode === "approve" && (
                        <TextField
                          label="Approval Code"
                          value={approvalCode}
                          onChange={(e) => setApprovalCode(e.target.value)}
                          size="small"
                          fullWidth
                          placeholder="Enter manager approval code"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <KeyOutlinedIcon fontSize="small" sx={{ opacity: 0.75 }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            maxWidth: { xs: "100%", sm: 360 },
                            ...actionFieldSx,
                          }}
                        />
                      )}

                      <TextField
                        label={selectedApproval?.mode === "approve" ? "Comment (optional)" : "Comment"}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        size="small"
                        fullWidth
                        multiline
                        minRows={3}
                        placeholder="Write decision note or rejection reason"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <ChatBubbleOutlineIcon fontSize="small" sx={{ opacity: 0.75, mt: 0.5 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          ...actionFieldSx,
                        }}
                      />

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        {selectedApproval?.mode === "approve" ? (
                          <Button
                            variant="contained"
                            color="success"
                            onClick={handleApprove}
                            disabled={actionLoading}
                            sx={{ fontWeight: 700, minWidth: 120, px: 2.2, borderRadius: 1.6 }}
                          >
                            {actionLoading ? "Processing..." : "Approve"}
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={handleReject}
                            disabled={actionLoading}
                            sx={{
                              fontWeight: 700,
                              minWidth: 120,
                              px: 2.2,
                              borderRadius: 1.6,
                              background: isDark ? "rgba(127,29,29,0.06)" : "rgba(254,242,242,0.65)",
                            }}
                          >
                            {actionLoading ? "Processing..." : "Reject"}
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid", borderColor: ui.panelBorder, background: ui.panelBg }}>
          <Button onClick={closeDialog} disabled={actionLoading} sx={{ fontWeight: 700 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={quickModeOpen}
        onClose={() => setQuickModeOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Quick Approve Mode</DialogTitle>
        <DialogContent dividers>
          {!quickModeRows.length ? (
            <Alert severity="info">No pending approvals available for quick mode.</Alert>
          ) : (
            <Stack spacing={1.2}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {quickIndex + 1} of {quickModeRows.length}
              </Typography>
              <Paper sx={{ p: 1.2, border: "1px solid", borderColor: ui.panelBorder }}>
                <Typography sx={{ fontWeight: 700 }}>Request No: {currentQuickApproval?.request_no || "-"}</Typography>
                <Typography variant="body2">Requester: {currentQuickApproval?.requester_name || "-"}</Typography>
                <Typography variant="body2">Expires: {toDate(currentQuickApproval?.code_expires_at)}</Typography>
              </Paper>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  disabled={quickIndex <= 0}
                  onClick={() => setQuickIndex((prev) => Math.max(0, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outlined"
                  disabled={quickIndex >= quickModeRows.length - 1}
                  onClick={() => setQuickIndex((prev) => Math.min(quickModeRows.length - 1, prev + 1))}
                >
                  Next
                </Button>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => currentQuickApproval && openDialog(currentQuickApproval, "approve")}
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => currentQuickApproval && openDialog(currentQuickApproval, "reject")}
                >
                  Reject
                </Button>
                <Button
                  variant="text"
                  onClick={() => currentQuickApproval && openDialog(currentQuickApproval, "view")}
                >
                  View
                </Button>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickModeOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
