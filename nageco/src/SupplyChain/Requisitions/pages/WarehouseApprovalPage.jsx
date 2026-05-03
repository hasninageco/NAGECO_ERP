import React from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import {
  getMyWarehouseApprovals,
  getWarehouseApprovalKpi,
  getWarehouseApprovalDetails,
  approveWarehouseRequest,
  rejectWarehouseRequest,
} from "../../services/warehouseApprovalService";

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

const isPendingStatus = (status) => String(status || "").toUpperCase() === "PENDING";

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

export default function WarehouseApprovalPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const ui = React.useMemo(
    () => ({
      panelBg: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
      panelBorder: isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.16)",
      panelShadow: isDark ? "0 8px 24px rgba(2,6,23,0.3)" : "0 8px 24px rgba(15,23,42,0.08)",
      sectionBg: isDark ? "rgba(15,23,42,0.5)" : "#ffffff",
      sectionBorder: isDark ? "rgba(148,163,184,0.28)" : "rgba(15,23,42,0.14)",
      tableHeadBg: isDark ? "rgba(30,41,59,0.85)" : "#edf2fb",
      tableRowBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)",
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

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const [kpi, setKpi] = React.useState({
    pending: 0,
    approvedToday: 0,
    rejectedToday: 0,
  });
  const [kpiLoading, setKpiLoading] = React.useState(false);

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

  const loadApprovals = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getMyWarehouseApprovals();
      setRows(Array.isArray(response?.rows) ? response.rows : []);
    } catch (err) {
      console.error("load warehouse approvals error:", err);
      setRows([]);
      setError(err?.response?.data?.message || "Failed to load warehouse approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadKpi = React.useCallback(async () => {
    setKpiLoading(true);
    try {
      const response = await getWarehouseApprovalKpi();
      setKpi({
        pending: Number(response?.pending || 0),
        approvedToday: Number(response?.approvedToday || 0),
        rejectedToday: Number(response?.rejectedToday || 0),
      });
    } catch (err) {
      console.error("load warehouse kpi error:", err);
      setKpi({ pending: 0, approvedToday: 0, rejectedToday: 0 });
    } finally {
      setKpiLoading(false);
    }
  }, []);

  const refreshPageData = React.useCallback(async () => {
    await Promise.all([loadApprovals(), loadKpi()]);
  }, [loadApprovals, loadKpi]);

  React.useEffect(() => {
    refreshPageData();
  }, [refreshPageData]);

  const openDialog = async (approval, mode = "view") => {
    const safeMode = isPendingStatus(approval?.approval_status) ? mode : "view";

    setSelectedApproval({ ...approval, mode: safeMode });
    setDialogOpen(true);
    setDetailsData(null);
    setDetailsError("");
    setApprovalCode("");
    setComment("");

    setDetailsLoading(true);
    try {
      const response = await getWarehouseApprovalDetails(approval.approval_id);
      setDetailsData(response || null);
    } catch (err) {
      console.error("getWarehouseApprovalDetails error:", err);
      setDetailsError(err?.response?.data?.message || "Failed to load warehouse approval details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDialog = () => {
    if (actionLoading) return;
    setDialogOpen(false);
    setSelectedApproval(null);
    setDetailsData(null);
    setDetailsError("");
    setApprovalCode("");
    setComment("");
  };

  const handleApprove = async () => {
    if (!selectedApproval?.approval_id) return;
    const code = String(approvalCode || "").trim();
    if (!code) {
      showSnackbar("error", "Approval code is required");
      return;
    }

    try {
      setActionLoading(true);
      await approveWarehouseRequest(selectedApproval.approval_id, {
        approvalCode: code,
        comment: comment || undefined,
      });
      showSnackbar("success", "Warehouse approval approved successfully");
      closeDialog();
      await refreshPageData();
    } catch (err) {
      console.error("approve warehouse request error:", err);
      showSnackbar("error", err?.response?.data?.message || "Failed to approve warehouse request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval?.approval_id) return;
    const safeComment = String(comment || "").trim();
    if (!safeComment) {
      showSnackbar("error", "Comment is required for reject");
      return;
    }

    try {
      setActionLoading(true);
      await rejectWarehouseRequest(selectedApproval.approval_id, {
        comment: safeComment,
      });
      showSnackbar("success", "Warehouse approval rejected successfully");
      closeDialog();
      await refreshPageData();
    } catch (err) {
      console.error("reject warehouse request error:", err);
      showSnackbar("error", err?.response?.data?.message || "Failed to reject warehouse request");
    } finally {
      setActionLoading(false);
    }
  };

  const kpiCards = React.useMemo(
    () => [
      {
        key: "pending",
        label: "Pending Warehouse",
        value: kpi.pending,
        color: "#f59e0b",
      },
      {
        key: "approvedToday",
        label: "Approved Today",
        value: kpi.approvedToday,
        color: "#16a34a",
      },
      {
        key: "rejectedToday",
        label: "Rejected Today",
        value: kpi.rejectedToday,
        color: "#dc2626",
      },
    ],
    [kpi]
  );

  return (
    <Box>
      <Paper
        sx={{
          p: 2,
          borderRadius: 2.2,
          border: "1px solid",
          borderColor: ui.panelBorder,
          background: ui.panelBg,
          boxShadow: ui.panelShadow,
          mb: 2,
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Warehouse Approval
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Pending warehouse approvals with approval code workflow.
            </Typography>
          </Box>
          <Button variant="outlined" onClick={refreshPageData} disabled={loading || kpiLoading}>
            Refresh
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={1.2} sx={{ mb: 2 }}>
        {kpiCards.map((card) => (
          <Grid item xs={12} sm={4} key={card.key}>
            <Paper
              sx={{
                p: 1.7,
                borderRadius: 2,
                border: "1px solid",
                borderColor: ui.panelBorder,
                background: ui.panelBg,
                boxShadow: ui.panelShadow,
                position: "relative",
                overflow: "hidden",
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
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                {card.label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {kpiLoading ? <CircularProgress size={18} /> : Number(card.value || 0)}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

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
        {!!error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  "Approval ID",
                  "Request No",
                  "Requester",
                  "Approver",
                  "Status",
                  "Created",
                  "Expires",
                  "Actions",
                ].map((head) => (
                  <TableCell
                    key={head}
                    sx={{
                      background: ui.tableHeadBg,
                      borderBottom: `1px solid ${ui.tableRowBorder}`,
                      fontWeight: 800,
                    }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={16} />
                      <span>Loading warehouse approvals...</span>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>No pending warehouse approvals found.</TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.approval_id} hover>
                    <TableCell>{row.approval_id}</TableCell>
                    <TableCell>{row.request_no}</TableCell>
                    <TableCell>{row.requester_name || "-"}</TableCell>
                    <TableCell>{row.approver_name || "-"}</TableCell>
                    <TableCell>
                      <Chip size="small" color={statusColor(row.approval_status)} label={row.approval_status || "-"} />
                    </TableCell>
                    <TableCell>{toDate(row.created_at)}</TableCell>
                    <TableCell>{toDate(row.code_expires_at)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.6}>
                        <Button size="small" variant="outlined" onClick={() => openDialog(row, "view")}>
                          View Details
                        </Button>
                        {isPendingStatus(row.approval_status) && (
                          <>
                            <Button size="small" variant="contained" color="success" onClick={() => openDialog(row, "approve")}>
                              Approve
                            </Button>
                            <Button size="small" variant="contained" color="error" onClick={() => openDialog(row, "reject")}>
                              Reject
                            </Button>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="lg" fullWidth>
        <DialogTitle>Warehouse Approval Details</DialogTitle>
        <DialogContent dividers>
          {detailsLoading ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} />
              <span>Loading details...</span>
            </Stack>
          ) : detailsError ? (
            <Alert severity="error">{detailsError}</Alert>
          ) : !detailsData ? (
            <Typography>No details found.</Typography>
          ) : (
            <Stack spacing={1.2}>
              <Box sx={sectionCardSx}>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Approval</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailField label="Approval ID" value={detailsData?.approval?.approval_id} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailField label="Request No" value={detailsData?.approval?.request_no} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailField label="Stage" value={detailsData?.approval?.approval_stage} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailField label="Status" value={detailsData?.approval?.approval_status} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={6}>
                    <DetailField label="Requester" value={detailsData?.approval?.requester_name} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={6}>
                    <DetailField label="Approver" value={detailsData?.approval?.approver_name} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <DetailField label="Created At" value={toDate(detailsData?.approval?.created_at)} muted />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <DetailField label="Expires At" value={toDate(detailsData?.approval?.code_expires_at)} muted />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <DetailField label="Decision Comment" value={detailsData?.approval?.decision_comment || "-"} muted />
                  </Grid>
                </Grid>
              </Box>

              <Box sx={sectionCardSx}>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Requisition Header</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6} md={4}>
                    <DetailField label="Request No" value={detailsData?.requisition?.header?.num_bn} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <DetailField label="Status" value={detailsData?.requisition?.header?.requisition_status} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <DetailField label="Urgent" value={detailsData?.requisition?.header?.Is_urgent ? "Yes" : "No"} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DetailField label="Title" value={detailsData?.requisition?.header?.Requisition_Title} muted />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DetailField label="Reference" value={detailsData?.requisition?.header?.Requestrefrence} muted />
                  </Grid>
                </Grid>
              </Box>

              <Box sx={sectionCardSx}>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Items</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {["Req Item", "Product", "Qty", "Unit", "Part Number", "Comment"].map((head) => (
                          <TableCell
                            key={head}
                            sx={{
                              background: ui.tableHeadBg,
                              borderBottom: `1px solid ${ui.tableRowBorder}`,
                              fontWeight: 800,
                            }}
                          >
                            {head}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {!Array.isArray(detailsData?.requisition?.items) || detailsData.requisition.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6}>No items found.</TableCell>
                        </TableRow>
                      ) : (
                        detailsData.requisition.items.map((item) => (
                          <TableRow key={item.ID_REQ}>
                            <TableCell>{item.Req_item}</TableCell>
                            <TableCell>{item.art || "-"}</TableCell>
                            <TableCell>{item.qty || 0}</TableCell>
                            <TableCell>{item.unit || "-"}</TableCell>
                            <TableCell>{item.part_number || "-"}</TableCell>
                            <TableCell>{item.comment || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {selectedApproval?.mode === "approve" && (
                <Box sx={sectionCardSx}>
                  <Typography sx={{ fontWeight: 800, mb: 1 }}>Approve Request</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Approval Code"
                        value={approvalCode}
                        onChange={(e) => setApprovalCode(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Comment (optional)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {selectedApproval?.mode === "reject" && (
                <Box sx={sectionCardSx}>
                  <Typography sx={{ fontWeight: 800, mb: 1 }}>Reject Request</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    label="Reject Comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={actionLoading}>
            Close
          </Button>
          {selectedApproval?.mode === "approve" && (
            <Button variant="contained" color="success" onClick={handleApprove} disabled={actionLoading || detailsLoading}>
              {actionLoading ? "Approving..." : "Approve"}
            </Button>
          )}
          {selectedApproval?.mode === "reject" && (
            <Button variant="contained" color="error" onClick={handleReject} disabled={actionLoading || detailsLoading}>
              {actionLoading ? "Rejecting..." : "Reject"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
