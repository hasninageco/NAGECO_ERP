import * as React from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  TextField,
  Typography,
  Stack,
  Pagination,
  Tooltip,
  Divider,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import FullscreenIcon from "@mui/icons-material/Fullscreen";

import { MaterialReactTable, type MRT_ColumnDef, useMaterialReactTable } from "material-react-table";
import type { ProductRow } from "../types";

type Props = {
  data: ProductRow[];
  loading: boolean;

  total: number;
  page: number;
  totalPages: number;

  q: string;
  limit: number;

  selectedSectionLabel: string;

  onQChange: (val: string) => void;
  onLimitChange: (val: number) => void;
  onPageChange: (page: number) => void;

  onOpenSectionFilter: () => void;
  onOpenSectionManage: () => void;

  onAddProduct: () => void;
  onEditProduct: (row: ProductRow) => void;
  onDeleteProduct: (row: ProductRow) => void;

  onExportSelected: (rows: ProductRow[]) => void;
  onExportWithFilters: () => void;
  onOpenReports?: () => void;
};

const LIMIT_OPTIONS = [20, 50, 100, 200, 500];

function clampLimit(n: number) {
  if (!Number.isFinite(n)) return 20;
  if (n < 1) return 20;
  if (n > 500) return 500;
  return n;
}

function formatDateYMD(v: any) {
  if (!v) return "-";
  return String(v).slice(0, 10);
}

// ✅ Departments formatter (backend should send departmentsNames)
function formatDepartments(row: any) {
  if (row?.departmentsNames) return String(row.departmentsNames); // ✅ best
  if (row?.departmentsName) return String(row.departmentsName);
  if (row?.departmentsText) return String(row.departmentsText);

  // fallback: raw SECT might be "1,2,3"
  const v = row?.SECT ?? row?.sect ?? row?.Sect;
  if (!v) return "-";
  return String(v);
}

// ✅ A small helper to render "Label: Value" like your screenshot
function KV({ label, value }: { label: string; value: any }) {
  const v = value == null || value === "" ? "-" : String(value);
  return (
    <Box sx={{ display: "flex", gap: 1.2, py: 0.35 }}>
      <Typography sx={{ width: 140, opacity: 0.85, fontWeight: 700 }}>
        {label}:
      </Typography>
      <Typography sx={{ opacity: 0.92 }}>{v}</Typography>
    </Box>
  );
}

export default function ProductsTable(props: Props) {
  const {
    data,
    loading,
    total,
    page,
    totalPages,
    q,
    limit,
    selectedSectionLabel,
    onQChange,
    onLimitChange,
    onPageChange,
    onOpenSectionFilter,
    onOpenSectionManage,
    onAddProduct,
    onEditProduct,
    onDeleteProduct,
    onExportSelected,
    onExportWithFilters,
    onOpenReports,
  } = props;

  // ✅ Main table columns (keep it clean, details below)
  const columns = React.useMemo<MRT_ColumnDef<ProductRow>[]>(
    () => [
      { accessorKey: "Id_art", header: "ID", size: 80 },
      { accessorKey: "desig_art", header: "Product", size: 320 },
      {
        id: "sectionName",
        header: "Section",
        accessorFn: (row: any) =>
          row?.section?.DESIG ||
          row?.sectionName ||
          row?.Section ||
          (row?.ID_SECTION == null ? "Uncategorized" : `#${row.ID_SECTION}`),
        size: 240,
      },
      {
        id: "product_category",
        header: "Catalog",
        accessorFn: (row: any) => row?.product_category || "-",
        size: 180,
      },
      { accessorKey: "Place_item", header: "Place", size: 120 },
      { accessorKey: "BARCODE", header: "Barcode", size: 120 },
      {
        id: "expir_date",
        header: "Expiry Date",
        accessorFn: (row: any) => formatDateYMD(row?.expir_date),
        size: 140,
      },
      {
        id: "departments",
        header: "Departments",
        accessorFn: (row: any) => formatDepartments(row),
        Cell: ({ row }) => {
          const txt = formatDepartments(row.original as any);
          if (!txt || txt === "-") return "-";
          return (
            <Chip
              size="small"
              label={txt}
              sx={{
                maxWidth: 280,
                "& .MuiChip-label": {
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "block",
                },
              }}
            />
          );
        },
        size: 220,
      },
      {
        id: "actions",
        header: "Actions",
        size: 160,
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" variant="outlined" onClick={() => onEditProduct(row.original)}>
              EDIT
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => onDeleteProduct(row.original)}
            >
              DELETE
            </Button>
          </Box>
        ),
      },
    ],
    [onEditProduct, onDeleteProduct]
  );

  const table = useMaterialReactTable({
    columns,
    data,
    state: {
      isLoading: loading,
      density: "compact",
    },

    enableDensityToggle: true,
    enablePagination: false,
    enableRowSelection: true,

    // ✅ Expandable Detail Panel (THIS is what you want)
    enableExpanding: true,
    renderDetailPanel: ({ row }) => {
      const r: any = row.original;

      return (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            background: "rgba(255,255,255,0.02)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
              gap: 2,
            }}
          >
            {/* Left column */}
            <Box>
              <KV label="Alt. Code" value={r?.Alternante_Code} />
              <KV label="Qty Security" value={r?.QTY_SECURIT} />
              <KV label="Manufacturer" value={r?.MANUFACRURE} />
              <KV label="Verified" value={String(Boolean(r?.Is_Verified))} />
              <KV label="Comment" value={r?.Comment} />
            </Box>

            {/* Middle column */}
            <Box>
              <KV label="Price" value={r?.Price} />
              <KV label="Size" value={r?.SIZE_ART} />
              <KV label="Country" value={r?.COUNTRY} />
              <KV label="Pharmacy" value={String(Boolean(r?.pharmacy))} />
            </Box>

            {/* Right column */}
            <Box>
              <KV label="Currency" value={r?.CURRENCY} />
              <KV label="Contents" value={r?.contents} />
              <KV label="Scientific Name" value={r?.SCIENTIFIC_NAME} />
              <KV label="Class" value={r?.CLASSEMENT} />
            </Box>
          </Box>

          <Divider sx={{ mt: 1.2, opacity: 0.15 }} />

          {/* Optional: show departments line also in details */}
          <Box sx={{ mt: 1 }}>
            <KV label="Departments" value={formatDepartments(r)} />
          </Box>
        </Box>
      );
    },

    muiTablePaperProps: {
      sx: { backgroundColor: "transparent" },
    },

    renderTopToolbarCustomActions: () => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Products List</Typography>

        <Box sx={{ flex: 1 }} />

        <Typography sx={{ fontWeight: 700, opacity: 0.9 }}>{selectedSectionLabel}</Typography>

        <Button size="small" variant="outlined" onClick={onOpenSectionFilter}>
          SECTIONS
        </Button>
        <Button size="small" variant="outlined" onClick={onOpenSectionManage}>
          MANAGE SECTIONS
        </Button>
        <Button size="small" variant="contained" onClick={onAddProduct}>
          + ADD PRODUCT
        </Button>

        <Button
          size="small"
          variant="outlined"
          disabled={table.getSelectedRowModel().rows.length === 0}
          onClick={() => onExportSelected(table.getSelectedRowModel().rows.map((r) => r.original))}
        >
          EXPORT SELECTED
        </Button>

        <Button size="small" variant="outlined" onClick={onExportWithFilters}>
          EXPORT (FILTERS)
        </Button>

        {!!onOpenReports && (
          <Button size="small" variant="outlined" onClick={onOpenReports}>
            REQUISITION REPORTS
          </Button>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 1 }}>
          <Tooltip title="Search is in bottom bar">
            <span>
              <IconButton size="small" disabled>
                <SearchIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Table options">
            <IconButton size="small">
              <FilterAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Columns">
            <IconButton size="small">
              <ViewColumnIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fullscreen">
            <IconButton size="small">
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    ),
  });

  const safeLimit = clampLimit(limit);

  return (
    <Box>
      <MaterialReactTable table={table} />

      {/* ✅ Bottom bar */}
      <Box
        sx={{
          mt: 1.5,
          p: 1.2,
          borderRadius: 2,
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          gap: 1.2,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            label="Search"
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            sx={{ minWidth: 260 }}
          />

          <TextField
            size="small"
            select
            label="Rows"
            value={safeLimit}
            onChange={(e) => onLimitChange(clampLimit(Number(e.target.value)))}
            sx={{ width: 120 }}
          >
            {LIMIT_OPTIONS.map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </TextField>

          <Typography sx={{ opacity: 0.85 }}>Total: {total}</Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography sx={{ opacity: 0.85 }}>Page</Typography>
          <Pagination
            count={Math.max(1, totalPages)}
            page={page}
            onChange={(_, p) => onPageChange(p)}
            shape="rounded"
            siblingCount={1}
            boundaryCount={1}
          />
        </Stack>
      </Box>
    </Box>
  );
}