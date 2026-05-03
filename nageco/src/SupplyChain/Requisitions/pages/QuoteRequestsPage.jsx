import React from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Grid,
  Button,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
  Checkbox,
  FormControlLabel,
  Switch,
  Divider,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Autocomplete from "@mui/material/Autocomplete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import PrintIcon from "@mui/icons-material/Print";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";

import {
  getSuppliers,
  getReadyRequisitions,
  getRequisitionItems,
  getQuoteRowsByRequisition,
  transferToQuoteRequest,
  bulkUpdateQuoteRows,
} from "../../services/quoteRequestService";

const READY_STATUS = "Ready For Supplier Offers";

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const dateOnly = (value) => {
  if (!value) return "-";
  return String(value).slice(0, 10);
};

const printLabel = (value) => {
  if (value === null || value === undefined) return "-";
  const text = String(value).trim();
  return text || "-";
};

const boolChip = (value, trueLabel = "Yes", falseLabel = "No") => {
  return (
    <Chip
      size="small"
      color={value ? "success" : "default"}
      label={value ? trueLabel : falseLabel}
      sx={{ fontWeight: 700 }}
    />
  );
};

const buildSearchHaystack = (obj) => {
  if (!obj || typeof obj !== "object") return "";
  return Object.values(obj)
    .map((v) => normalizeText(v))
    .join(" ");
};

const pickDisplayCurrency = (value) => {
  const text = String(value || "").trim();
  if (!text) return "-";

  const parts = text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return text;
  const lyd = parts.find((part) => part.toUpperCase() === "LYD");
  return lyd || parts[0];
};

const getStatusTone = (status, isDark) => {
  const normalized = normalizeText(status);

  if (
    normalized.includes("ready") ||
    normalized.includes("approved") ||
    normalized.includes("success")
  ) {
    return {
      color: isDark ? "#6ee7b7" : "#047857",
      bg: isDark ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.14)",
      border: isDark ? "rgba(16,185,129,0.45)" : "rgba(5,150,105,0.34)",
    };
  }

  if (normalized.includes("pending") || normalized.includes("progress")) {
    return {
      color: isDark ? "#fdba74" : "#c2410c",
      bg: isDark ? "rgba(249,115,22,0.22)" : "rgba(249,115,22,0.14)",
      border: isDark ? "rgba(249,115,22,0.42)" : "rgba(234,88,12,0.34)",
    };
  }

  if (normalized.includes("reject") || normalized.includes("cancel")) {
    return {
      color: isDark ? "#fca5a5" : "#b91c1c",
      bg: isDark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.12)",
      border: isDark ? "rgba(239,68,68,0.4)" : "rgba(220,38,38,0.32)",
    };
  }

  return {
    color: isDark ? "#cbd5e1" : "#334155",
    bg: isDark ? "rgba(148,163,184,0.18)" : "rgba(148,163,184,0.14)",
    border: isDark ? "rgba(148,163,184,0.34)" : "rgba(148,163,184,0.32)",
  };
};

const formatNumeric = (value) => {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const resolveRowCost = (row) => {
  const candidate =
    row?.cost ??
    row?.unit_cost ??
    row?.price ??
    row?.amount ??
    row?.total_price ??
    null;

  const num = toNullableNumber(candidate);
  if (num === null || num <= 0) return null;
  return num;
};

export default function QuoteRequestsPage({ onBack }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [requestNoInput, setRequestNoInput] = React.useState("");
  const [readyRows, setReadyRows] = React.useState([]);
  const [readyLoading, setReadyLoading] = React.useState(false);
  const [readyError, setReadyError] = React.useState("");

  const [selectedRequest, setSelectedRequest] = React.useState(null);
  const [itemsRows, setItemsRows] = React.useState([]);
  const [itemsLoading, setItemsLoading] = React.useState(false);
  const [itemsError, setItemsError] = React.useState("");

  const [quoteRows, setQuoteRows] = React.useState([]);
  const [quoteLoading, setQuoteLoading] = React.useState(false);
  const [quoteError, setQuoteError] = React.useState("");

  const [supplierQuery, setSupplierQuery] = React.useState("");
  const [supplierOptions, setSupplierOptions] = React.useState([]);
  const [supplierLoading, setSupplierLoading] = React.useState(false);
  const [supplierPick, setSupplierPick] = React.useState(null);
  const [selectedSuppliers, setSelectedSuppliers] = React.useState([]);

  const [selectedItemIds, setSelectedItemIds] = React.useState([]);
  const [transferIsLocal, setTransferIsLocal] = React.useState(false);
  const [transferLoading, setTransferLoading] = React.useState(false);

  const [itemsSearch, setItemsSearch] = React.useState("");
  const [quoteSearch, setQuoteSearch] = React.useState("");

  const [draftRowUpdates, setDraftRowUpdates] = React.useState({});
  const [saveLoading, setSaveLoading] = React.useState(false);

  const [toast, setToast] = React.useState({
    open: false,
    severity: "success",
    message: "",
  });

  const selectedSupplierIds = React.useMemo(
    () => selectedSuppliers.map((s) => Number(s.id_supplier_client)),
    [selectedSuppliers]
  );

  const hasExistingQuoteRows = quoteRows.length > 0;

  const canTransfer =
    !!selectedRequest?.num_bn &&
    selectedSupplierIds.length >= 3 &&
    !transferLoading &&
    !hasExistingQuoteRows;

  const filteredItems = React.useMemo(() => {
    if (!itemsSearch.trim()) return itemsRows;
    const q = normalizeText(itemsSearch);
    return itemsRows.filter((row) => buildSearchHaystack(row).includes(q));
  }, [itemsRows, itemsSearch]);

  const filteredQuoteRows = React.useMemo(() => {
    if (!quoteSearch.trim()) return quoteRows;
    const q = normalizeText(quoteSearch);
    return quoteRows.filter((row) => buildSearchHaystack(row).includes(q));
  }, [quoteRows, quoteSearch]);

  const groupedQuoteRows = React.useMemo(() => {
    const quoteMap = new Map();

    for (const row of filteredQuoteRows) {
      const quoteNo = row?.num_quot ?? row?.num_quotation ?? "N/A";
      const quoteKey = String(quoteNo);

      if (!quoteMap.has(quoteKey)) {
        quoteMap.set(quoteKey, {
          quoteNo,
          suppliersMap: new Map(),
        });
      }

      const quoteGroup = quoteMap.get(quoteKey);
      const supplierKey = String(
        row?.supplier_id ?? row?.supplier_name ?? `supplier-${row?.id_qr}`
      );

      if (!quoteGroup.suppliersMap.has(supplierKey)) {
        quoteGroup.suppliersMap.set(supplierKey, {
          supplierName: row?.supplier_name || "Unknown Supplier",
          supplierCode: row?.supplier_code || "-",
          currency: pickDisplayCurrency(row?.currency),
          rows: [],
          itemIds: new Set(),
          totalQty: 0,
          totalPrice: 0,
          hasPricing: false,
        });
      }

      const supplierGroup = quoteGroup.suppliersMap.get(supplierKey);
      supplierGroup.rows.push(row);

      if (row?.id_requisition_item_system !== null && row?.id_requisition_item_system !== undefined) {
        supplierGroup.itemIds.add(String(row.id_requisition_item_system));
      }

      const qty = Number(row?.qty || 0);
      if (Number.isFinite(qty)) {
        supplierGroup.totalQty += qty;
      }

      const cost = resolveRowCost(row);
      if (cost !== null) {
        const qtyFactor = Number.isFinite(qty) && qty > 0 ? qty : 1;
        supplierGroup.totalPrice += cost * qtyFactor;
        supplierGroup.hasPricing = true;
      }
    }

    return Array.from(quoteMap.values())
      .map((group) => ({
        quoteNo: group.quoteNo,
        suppliers: Array.from(group.suppliersMap.values()),
      }))
      .sort((a, b) => {
        const an = toNullableNumber(a.quoteNo);
        const bn = toNullableNumber(b.quoteNo);
        if (an !== null && bn !== null) return an - bn;
        return String(a.quoteNo).localeCompare(String(b.quoteNo));
      });
  }, [filteredQuoteRows]);

  const itemQuoteMeta = React.useMemo(() => {
    const map = new Map();

    for (const row of quoteRows) {
      const key = Number(row.id_requisition_item_system);
      if (!map.has(key)) {
        map.set(key, {
          quoteNos: new Set(),
          users: new Set(),
          suppliers: new Set(),
          hasOk: false,
          hasLocal: false,
        });
      }

      const bucket = map.get(key);
      if (row.num_quot !== null && row.num_quot !== undefined) bucket.quoteNos.add(String(row.num_quot));
      if (row.usr !== null && row.usr !== undefined) bucket.users.add(String(row.usr));
      if (row.supplier_name) bucket.suppliers.add(row.supplier_name);
      if (row.is_ok_pour_bo) bucket.hasOk = true;
      if (row.is_local) bucket.hasLocal = true;
    }

    return map;
  }, [quoteRows]);

  const showToast = React.useCallback((severity, message) => {
    setToast({ open: true, severity, message });
  }, []);

  const loadReadyRequisitions = React.useCallback(async (requestNo = "") => {
    setReadyLoading(true);
    setReadyError("");
    try {
      const data = await getReadyRequisitions({ requestNo });
      setReadyRows(Array.isArray(data?.rows) ? data.rows : []);
    } catch (error) {
      console.error("loadReadyRequisitions error", error);
      setReadyRows([]);
      setReadyError(error?.response?.data?.message || "Failed to load ready requisitions");
    } finally {
      setReadyLoading(false);
    }
  }, []);

  const loadRequisitionItems = React.useCallback(async (numBn) => {
    if (!numBn) return;

    setItemsLoading(true);
    setItemsError("");
    try {
      const data = await getRequisitionItems(numBn);
      setItemsRows(Array.isArray(data?.rows) ? data.rows : []);
      setSelectedItemIds([]);
    } catch (error) {
      console.error("loadRequisitionItems error", error);
      setItemsRows([]);
      setItemsError(error?.response?.data?.message || "Failed to load requisition items");
    } finally {
      setItemsLoading(false);
    }
  }, []);

  const loadQuoteRows = React.useCallback(async (numBn) => {
    if (!numBn) return;

    setQuoteLoading(true);
    setQuoteError("");
    try {
      const data = await getQuoteRowsByRequisition(numBn);
      setQuoteRows(Array.isArray(data?.rows) ? data.rows : []);
      setDraftRowUpdates({});
    } catch (error) {
      console.error("loadQuoteRows error", error);
      setQuoteRows([]);
      setQuoteError(error?.response?.data?.message || "Failed to load quote rows");
    } finally {
      setQuoteLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadReadyRequisitions();
  }, [loadReadyRequisitions]);

  React.useEffect(() => {
    let ignore = false;

    async function loadSuppliersList() {
      setSupplierLoading(true);
      try {
        const data = await getSuppliers(supplierQuery);
        if (!ignore) {
          setSupplierOptions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!ignore) {
          setSupplierOptions([]);
        }
      } finally {
        if (!ignore) setSupplierLoading(false);
      }
    }

    loadSuppliersList();
    return () => {
      ignore = true;
    };
  }, [supplierQuery]);

  const handleSearch = async () => {
    await loadReadyRequisitions(requestNoInput);
  };

  const handleRefresh = async () => {
    await loadReadyRequisitions(requestNoInput);
    if (selectedRequest?.num_bn) {
      await Promise.all([
        loadRequisitionItems(selectedRequest.num_bn),
        loadQuoteRows(selectedRequest.num_bn),
      ]);
    }
  };

  const handleChooseRequest = async (row) => {
    setSelectedRequest(row || null);
    if (!row?.num_bn) return;
    setRequestNoInput(String(row.num_bn));

    await Promise.all([
      loadRequisitionItems(row.num_bn),
      loadQuoteRows(row.num_bn),
    ]);
  };

  const handleSelectSupplier = () => {
    if (!supplierPick) {
      showToast("warning", "Please choose supplier first");
      return;
    }

    setSelectedSuppliers((prev) => {
      const exists = prev.some(
        (s) => Number(s.id_supplier_client) === Number(supplierPick.id_supplier_client)
      );
      if (exists) return prev;
      return [...prev, supplierPick];
    });

    setSupplierPick(null);
    setSupplierQuery("");
  };

  const removeSelectedSupplier = (supplierId) => {
    setSelectedSuppliers((prev) =>
      prev.filter((s) => Number(s.id_supplier_client) !== Number(supplierId))
    );
  };

  const toggleItemSelection = (idReq, checked) => {
    const id = Number(idReq);
    setSelectedItemIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((x) => x !== id);
    });
  };

  const handleSelectAll = () => {
    setSelectedItemIds(filteredItems.map((row) => Number(row.id_req)).filter((id) => Number.isFinite(id)));
  };

  const handleUnselectAll = () => {
    setSelectedItemIds([]);
  };

  const handleNewExternalQuote = () => {
    setSelectedSuppliers([]);
    setSupplierPick(null);
    setSelectedItemIds([]);
    setTransferIsLocal(false);
    setDraftRowUpdates({});
    setItemsSearch("");
    setQuoteSearch("");
    showToast("info", "New external quote setup cleared");
  };

  const handleTransfer = async () => {
    if (!selectedRequest?.num_bn) {
      showToast("error", "Please select requisition first");
      return;
    }

    if (quoteRows.length > 0) {
      showToast("info", "Quote request already created for this requisition.");
      return;
    }

    if (selectedSupplierIds.length < 3) {
      showToast("error", "Please select at least 3 suppliers before transfer");
      return;
    }

    setTransferLoading(true);
    setItemsError("");
    try {
      const result = await transferToQuoteRequest(selectedRequest.num_bn, selectedSupplierIds, {
        selectedItemIds,
        isLocal: transferIsLocal,
      });

      showToast("success", result?.message || "Quote request created successfully");

      await Promise.all([
        loadReadyRequisitions(requestNoInput),
        loadRequisitionItems(selectedRequest.num_bn),
        loadQuoteRows(selectedRequest.num_bn),
      ]);
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to transfer to quote request";
      showToast("error", message);
    } finally {
      setTransferLoading(false);
    }
  };

  const setRowDraft = (idQr, patch) => {
    const id = Number(idQr);
    setDraftRowUpdates((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        ...patch,
      },
    }));
  };

  const getRowIsOk = (row) => {
    const draft = draftRowUpdates[Number(row.id_qr)];
    if (draft && Object.prototype.hasOwnProperty.call(draft, "is_ok_pour_bo")) {
      return !!draft.is_ok_pour_bo;
    }
    return !!row.is_ok_pour_bo;
  };

  const getRowIsLocal = (row) => {
    const draft = draftRowUpdates[Number(row.id_qr)];
    if (draft && Object.prototype.hasOwnProperty.call(draft, "is_local")) {
      return !!draft.is_local;
    }
    return !!row.is_local;
  };

  const handleSave = async () => {
    const updates = Object.entries(draftRowUpdates).map(([id, patch]) => ({
      id_qr: Number(id),
      is_ok_pour_bo: patch.is_ok_pour_bo,
      is_local: patch.is_local,
    }));

    if (!updates.length) {
      showToast("info", "No changes to save");
      return;
    }

    setSaveLoading(true);
    try {
      await bulkUpdateQuoteRows(updates);
      showToast("success", "Quote rows saved successfully");
      if (selectedRequest?.num_bn) {
        await loadQuoteRows(selectedRequest.num_bn);
      }
    } catch (error) {
      showToast(
        "error",
        error?.response?.data?.message || "Failed to save quote rows"
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePrint = () => {
    if (!selectedRequest?.num_bn) {
      showToast("warning", "Please select requisition first");
      return;
    }

    const html = `
      <html>
        <head>
          <title>Quote Request ${printLabel(selectedRequest.num_bn)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 16px; color: #111827; }
            h2, h3 { margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px; font-size: 11px; text-align: left; }
            th { background: #e2e8f0; }
          </style>
        </head>
        <body>
          <h2>Quote Requests</h2>
          <div><b>Request No:</b> ${printLabel(selectedRequest.num_bn)}</div>
          <div><b>Status:</b> ${printLabel(selectedRequest.requisition_status)}</div>

          <h3>Items</h3>
          <table>
            <thead>
              <tr>
                <th>No.</th><th>Product</th><th>Qty</th><th>Unit</th><th>Comment</th><th>Comment AR</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows
                .map(
                  (row) => `<tr><td>${printLabel(row.no)}</td><td>${printLabel(
                    row.product
                  )}</td><td>${printLabel(row.qty)}</td><td>${printLabel(
                    row.unit
                  )}</td><td>${printLabel(row.comment)}</td><td>${printLabel(
                    row.comment_ar
                  )}</td></tr>`
                )
                .join("")}
            </tbody>
          </table>

          <h3>Quote Rows</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Quote No</th><th>Supplier</th><th>Product</th><th>Qty</th><th>Is OK</th><th>Is Local</th>
              </tr>
            </thead>
            <tbody>
              ${quoteRows
                .map(
                  (row) => `<tr><td>${printLabel(row.id_qr)}</td><td>${printLabel(
                    row.num_quot
                  )}</td><td>${printLabel(row.supplier_name)}</td><td>${printLabel(
                    row.product
                  )}</td><td>${printLabel(row.qty)}</td><td>${
                    row.is_ok_pour_bo ? "Yes" : "No"
                  }</td><td>${row.is_local ? "Yes" : "No"}</td></tr>`
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=1200,height=900");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  return (
    <Box>
      <Paper
        sx={{
          p: 1.6,
          borderRadius: 2,
          border: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.16)",
          background: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
          mb: 1.5,
        }}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", lg: "center" }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Quote Requests Working Screen
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Preparing quote rows from requisitions ready for supplier offers.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {!!onBack && (
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack}>
                Back
              </Button>
            )}
            <TextField
              size="small"
              label="Request No"
              value={requestNoInput}
              onChange={(e) => setRequestNoInput(e.target.value)}
              sx={{ minWidth: 150 }}
            />
            <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch} disabled={readyLoading}>
              Search
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 1.2 }} />

        <Grid container spacing={1.1} alignItems="center">
          <Grid item xs={12} lg={5}>
            <Autocomplete
              options={supplierOptions}
              loading={supplierLoading}
              value={supplierPick}
              inputValue={supplierQuery}
              onInputChange={(_, value) => setSupplierQuery(value || "")}
              onChange={(_, value) => setSupplierPick(value || null)}
              getOptionLabel={(option) =>
                option?.Name_supplier_client
                  ? `${option.Name_supplier_client} (${option.Code__supplier_client || "-"})`
                  : ""
              }
              isOptionEqualToValue={(a, b) => Number(a?.id_supplier_client) === Number(b?.id_supplier_client)}
              filterOptions={(options) => options}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Supplier select / autocomplete"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} lg={7}>
            <Stack spacing={0.8}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={0.8}>
                <Button variant="contained" onClick={handleSelectSupplier}>
                  Select Supplier
                </Button>
                <Button
                  variant="contained"
                  startIcon={<RequestQuoteIcon />}
                  onClick={handleTransfer}
                  disabled={!canTransfer}
                  sx={{
                    fontWeight: 700,
                    background: isDark
                      ? "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)"
                      : "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
                  }}
                >
                  {transferLoading ? "Transferring..." : "Transfer To Quote Request"}
                </Button>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={0.8}>
                <Button variant="outlined" onClick={handleNewExternalQuote}>
                  New External Quote
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saveLoading}
                >
                  {saveLoading ? "Saving..." : "Save"}
                </Button>
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
                  Print
                </Button>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={readyLoading}>
                  Refresh
                </Button>
              </Stack>
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={transferIsLocal} onChange={(e) => setTransferIsLocal(e.target.checked)} />}
              label="Is Local"
            />
          </Grid>
        </Grid>

        <Stack direction={{ xs: "column", md: "row" }} spacing={0.9} sx={{ mt: 0.8 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13, color: "text.secondary" }}>
            Selected suppliers: {selectedSupplierIds.length}
          </Typography>

          {!!selectedSuppliers.length && (
            <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap">
              {selectedSuppliers.map((supplier) => {
                const fullLabel = `${supplier.Name_supplier_client || "Supplier"} (${supplier.Code__supplier_client || "-"})`;
                return (
                  <Tooltip key={supplier.id_supplier_client} title={fullLabel} arrow>
                    <Chip
                      size="small"
                      label={fullLabel}
                      onDelete={() => removeSelectedSupplier(supplier.id_supplier_client)}
                      sx={{
                        maxWidth: 220,
                        "& .MuiChip-label": {
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 170,
                        },
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Stack>
          )}
        </Stack>

        {hasExistingQuoteRows && !!selectedRequest?.num_bn && (
          <Alert severity="info" sx={{ mt: 1 }}>
            Quote request already created for this requisition.
          </Alert>
        )}

        {!hasExistingQuoteRows && selectedSupplierIds.length < 3 && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            Please select at least 3 suppliers before Transfer To Quote Request.
          </Alert>
        )}
      </Paper>

      <Paper
        sx={{
          p: 1.2,
          borderRadius: 2,
          border: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.16)",
          background: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
          mb: 1.5,
          overflowX: "auto",
        }}
      >
        <Typography sx={{ fontWeight: 800, mb: 1 }}>Ready Requisitions</Typography>

        {!!readyError && <Alert severity="error" sx={{ mb: 1 }}>{readyError}</Alert>}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Request No", "Date", "From Department", "Cost Center", "Items", "Total Qty", "Status", "Action"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.3)", fontSize: 12 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {readyLoading ? (
              <tr>
                <td colSpan={8} style={{ padding: 14 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={16} />
                    <span>Loading ready requisitions...</span>
                  </Stack>
                </td>
              </tr>
            ) : readyRows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 16, textAlign: "center", color: "#64748b" }}>
                  No requisitions are currently ready for supplier offers.
                </td>
              </tr>
            ) : (
              readyRows.map((row) => {
                const isSelected = Number(selectedRequest?.num_bn) === Number(row.num_bn);
                const tone = getStatusTone(row.requisition_status || READY_STATUS, isDark);

                return (
                  <tr
                    key={row.num_bn}
                    style={{
                      background: isSelected
                        ? isDark
                          ? "rgba(30,64,175,0.22)"
                          : "rgba(59,130,246,0.12)"
                        : "transparent",
                    }}
                  >
                    <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)", fontWeight: 700 }}>{row.num_bn}</td>
                    <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>{dateOnly(row.date_req)}</td>
                    <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>{printLabel(row.from_department)}</td>
                    <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>{printLabel(row.cost_center)}</td>
                    <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>{printLabel(row.items_count)}</td>
                    <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>{printLabel(row.total_qty)}</td>
                    <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                      <Chip
                        size="small"
                        label={printLabel(row.requisition_status || READY_STATUS)}
                        sx={{
                          fontWeight: 700,
                          color: tone.color,
                          backgroundColor: tone.bg,
                          border: `1px solid ${tone.border}`,
                        }}
                      />
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                      <Button size="small" variant={isSelected ? "contained" : "outlined"} onClick={() => handleChooseRequest(row)}>
                        {isSelected ? "Selected" : "Select"}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Paper>

      <Paper
        sx={{
          p: 1.2,
          borderRadius: 2,
          border: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.16)",
          background: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
          mb: 1.5,
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
          <Typography sx={{ fontWeight: 800 }}>
            Requisition Items {selectedRequest?.num_bn ? `(Request ${selectedRequest.num_bn})` : ""}
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button size="small" variant="outlined" onClick={handleSelectAll} disabled={!filteredItems.length}>
              Select All
            </Button>
            <Button size="small" variant="outlined" onClick={handleUnselectAll} disabled={!selectedItemIds.length}>
              Unselect All
            </Button>
            <TextField
              size="small"
              label="Search / Filter"
              value={itemsSearch}
              onChange={(e) => setItemsSearch(e.target.value)}
            />
          </Stack>
        </Stack>

        {!!itemsError && <Alert severity="error" sx={{ mb: 1 }}>{itemsError}</Alert>}

        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "Select",
                  "No.",
                  "From Department",
                  "Cost Center",
                  "Date Req.",
                  "Quote No / Whose QR",
                  "Product",
                  "Comment",
                  "Comment AR",
                  "Field Req",
                  "Qty",
                  "Unit",
                  "Qty Prep",
                  "List Supplier",
                  "Is OK",
                  "Is Local",
                  "Actions",
                ].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.3)", fontSize: 12 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itemsLoading ? (
                <tr>
                  <td colSpan={17} style={{ padding: 14 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={16} />
                      <span>Loading requisition items...</span>
                    </Stack>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={17} style={{ padding: 16, textAlign: "center", color: "#64748b" }}>
                    {selectedRequest?.num_bn
                      ? "No items for this requisition."
                      : "Select a requisition to load its items."}
                  </td>
                </tr>
              ) : (
                filteredItems.map((row) => {
                  const itemMeta = itemQuoteMeta.get(Number(row.id_req));
                  const isChecked = selectedItemIds.includes(Number(row.id_req));

                  return (
                    <tr key={row.id_req}>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                        <Checkbox
                          size="small"
                          checked={isChecked}
                          onChange={(e) => toggleItemSelection(row.id_req, e.target.checked)}
                        />
                      </td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>{printLabel(row.no)}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>{printLabel(row.from_department)}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>{printLabel(row.cost_center || selectedRequest?.cost_center)}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>{dateOnly(row.date_req)}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                        {itemMeta
                          ? `${Array.from(itemMeta.quoteNos).join(", ") || "-"} / ${
                              Array.from(itemMeta.users).join(", ") || "-"
                            }`
                          : "-"}
                      </td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>{printLabel(row.product)}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>{printLabel(row.comment)}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>{printLabel(row.comment_ar)}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>{printLabel(row.field_req)}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>{printLabel(row.qty)}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>{printLabel(row.unit)}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>{printLabel(row.qty_prep)}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                        {itemMeta ? Array.from(itemMeta.suppliers).join(", ") || "-" : printLabel(row.list_supplier)}
                      </td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                        {boolChip(itemMeta ? itemMeta.hasOk : row.is_ok, "OK", "Not OK")}
                      </td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                        {boolChip(itemMeta ? itemMeta.hasLocal : row.is_local)}
                      </td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                        <Button size="small" variant="text" onClick={() => toggleItemSelection(row.id_req, !isChecked)}>
                          {isChecked ? "Unselect" : "Select"}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Box>

        <Alert severity="info" sx={{ mt: 1 }}>
          If no rows are selected, transfer will use all items of selected requisition.
        </Alert>
      </Paper>

      <Paper
        sx={{
          p: 1.2,
          borderRadius: 2,
          border: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.16)",
          background: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
          <Typography sx={{ fontWeight: 800 }}>Quote Rows (After Creation)</Typography>
          <TextField
            size="small"
            label="Search / Filter"
            value={quoteSearch}
            onChange={(e) => setQuoteSearch(e.target.value)}
          />
        </Stack>

        {!!quoteError && <Alert severity="error" sx={{ mb: 1 }}>{quoteError}</Alert>}

        {hasExistingQuoteRows && (
          <Alert severity="success" sx={{ mb: 1 }}>
            Quote request has been created. Review supplier rows below.
          </Alert>
        )}

        {quoteLoading ? (
          <Box sx={{ p: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} />
              <span>Loading quote rows...</span>
            </Stack>
          </Box>
        ) : groupedQuoteRows.length === 0 ? (
          <Box sx={{ p: 1.5, color: "#64748b", textAlign: "center" }}>
            {selectedRequest?.num_bn
              ? "No quote rows yet for this requisition."
              : "Select a requisition to load its items."}
          </Box>
        ) : (
          <Stack spacing={1}>
            {groupedQuoteRows.map((quoteGroup) => (
              <Paper
                key={`quote-group-${quoteGroup.quoteNo}`}
                variant="outlined"
                sx={{ p: 1, borderColor: "rgba(148,163,184,0.35)" }}
              >
                <Typography sx={{ fontWeight: 800, mb: 0.8 }}>
                  Quote No: {printLabel(quoteGroup.quoteNo)}
                </Typography>

                <Stack spacing={1}>
                  {quoteGroup.suppliers.map((supplierGroup, supplierIndex) => (
                    <Box
                      key={`supplier-group-${quoteGroup.quoteNo}-${supplierIndex}`}
                      sx={{
                        p: 1,
                        borderRadius: 1.2,
                        border: "1px solid",
                        borderColor: "rgba(148,163,184,0.28)",
                        background: isDark ? "rgba(255,255,255,0.02)" : "rgba(241,245,249,0.45)",
                      }}
                    >
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", md: "center" }}
                        spacing={0.7}
                        sx={{ mb: 0.9 }}
                      >
                        <Tooltip title={`${supplierGroup.supplierName} (${supplierGroup.supplierCode})`} arrow>
                          <Typography sx={{ fontWeight: 700 }}>
                            Supplier: {printLabel(supplierGroup.supplierName)}
                          </Typography>
                        </Tooltip>

                        <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap">
                          <Chip
                            size="small"
                            label={`Items: ${supplierGroup.itemIds.size || supplierGroup.rows.length}`}
                          />
                          <Chip
                            size="small"
                            label={`Total Qty: ${formatNumeric(supplierGroup.totalQty)}`}
                          />
                          <Chip
                            size="small"
                            color={supplierGroup.hasPricing ? "success" : "default"}
                            label={
                              supplierGroup.hasPricing
                                ? `Total: ${formatNumeric(supplierGroup.totalPrice)} ${pickDisplayCurrency(supplierGroup.currency)}`
                                : "Total: Not priced yet"
                            }
                          />
                        </Stack>
                      </Stack>

                      <Box sx={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              {["Row ID", "Product", "Qty", "Currency", "Status", "Is Local", "Actions"].map((h) => (
                                <th
                                  key={h}
                                  style={{
                                    textAlign: "left",
                                    padding: "7px",
                                    borderBottom: "1px solid rgba(148,163,184,0.3)",
                                    fontSize: 12,
                                  }}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {supplierGroup.rows.map((row) => (
                              <tr key={row.id_qr}>
                                <td style={{ padding: "7px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                                  {printLabel(row.id_qr)}
                                </td>
                                <td style={{ padding: "7px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                                  {printLabel(row.product)}
                                </td>
                                <td style={{ padding: "7px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                                  {printLabel(row.qty)}
                                </td>
                                <td style={{ padding: "7px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                                  {pickDisplayCurrency(row.currency)}
                                </td>
                                <td style={{ padding: "7px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                                  <Chip
                                    size="small"
                                    label={getRowIsOk(row) ? "Quote OK" : "Quote Not OK"}
                                    color={getRowIsOk(row) ? "success" : "default"}
                                    variant={getRowIsOk(row) ? "filled" : "outlined"}
                                  />
                                </td>
                                <td style={{ padding: "7px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={getRowIsLocal(row)}
                                        onChange={(e) => setRowDraft(row.id_qr, { is_local: e.target.checked })}
                                      />
                                    }
                                    label="Is Local"
                                  />
                                </td>
                                <td style={{ padding: "7px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                                  <Stack direction={{ xs: "column", sm: "row" }} spacing={0.7}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="success"
                                      onClick={() => setRowDraft(row.id_qr, { is_ok_pour_bo: true })}
                                    >
                                      Mark OK
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      onClick={() => setRowDraft(row.id_qr, { is_ok_pour_bo: false })}
                                    >
                                      Mark Not OK
                                    </Button>
                                  </Stack>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      <Snackbar
        open={toast.open}
        autoHideDuration={3600}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
