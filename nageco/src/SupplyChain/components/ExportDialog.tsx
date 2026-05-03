// src/SupplyChain/components/ExportDialog.tsx

import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  Box,
  TextField,
  MenuItem,
  FormGroup,
  Divider,
  Typography,
  Switch,
  LinearProgress,
} from "@mui/material";

import type { SectionRow, CostCenterRow } from "../types";
import { getSectionCategories } from "../services/supplyChain.api";

type ExportDialogProps = {
  open: boolean;
  onClose: () => void;
  sections: SectionRow[];
  departments: CostCenterRow[];
  isExporting: boolean;
  onConfirm: (options: any) => Promise<void> | void;
};

const ALL_COLUMNS = [
  "Id_art",
  "desig_art",
  "sectionName",
  "product_category",
  "SECT",
  "COUNTRY",
  "Place_item",
  "expir_date",
  "daysToExpiry",

  // ✅ بدل QTY_SECURIT (حسب طلبك الحالي)
  // (حتى لو realQty محسوبة لاحقًا، الحقل هنا للـ export columns)
  "realQty",

  "Price",
  "CURRENCY",
  "Is_Verified",
  "pharmacy",
];

function getDeptLabel(d: CostCenterRow) {
  // ✅ أهم نقطة: استخدمي الحقول الصح من الموديل
  const name =
    d.administration?.trim() ||
    d.administration_ar?.trim() ||
    d.Branche?.trim() ||
    "";

  // fallback واضح بدل label فاضي
  const nice = name !== "" ? name : "Unnamed Department";
  return `${d.id_administratin} - ${nice}`;
}

export default function ExportDialog({
  open,
  onClose,
  sections,
  departments,
  isExporting,
  onConfirm,
}: ExportDialogProps) {
  const [selectedColumns, setSelectedColumns] = React.useState<string[]>(ALL_COLUMNS.slice());

  // Basic filters
  const [sectionId, setSectionId] = React.useState<number | null | "all">("all");
  const [missingSection, setMissingSection] = React.useState(false);
  const [category, setCategory] = React.useState<string | "all">("all");
  const [sectionCategories, setSectionCategories] = React.useState<{ id: string; label: string }[]>([]);

  // Departments checklist
  const [selectedDeptIds, setSelectedDeptIds] = React.useState<number[]>([]);

  // Expiry filter (بدل none/between)
  const [expiryEnabled, setExpiryEnabled] = React.useState(false);
  const [expiryDays, setExpiryDays] = React.useState<number | "">("");

  React.useEffect(() => {
    if (!open) return;

    // reset defaults
    setSelectedColumns(ALL_COLUMNS.slice());
    setSectionId("all");
    setMissingSection(false);
    setCategory("all");
    setSectionCategories([]);

    setSelectedDeptIds([]);

    setExpiryEnabled(false);
    setExpiryDays("");
  }, [open]);

  const toggleColumn = (col: string) => {
    setSelectedColumns((s) => (s.includes(col) ? s.filter((c) => c !== col) : [...s, col]));
  };

  const selectAll = () => setSelectedColumns(ALL_COLUMNS.slice());
  const clearAll = () => setSelectedColumns([]);

  const toggleDept = (id: number) => {
    setSelectedDeptIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  React.useEffect(() => {
    let ignore = false;

    async function loadCategories() {
      if (missingSection || sectionId === "all" || sectionId === null) {
        setSectionCategories([]);
        setCategory("all");
        return;
      }

      try {
        const rows = await getSectionCategories(Number(sectionId));
        if (ignore) return;
        setSectionCategories(rows || []);
        if (category !== "all" && !rows.some((r) => r.id === category)) {
          setCategory("all");
        }
      } catch {
        if (ignore) return;
        setSectionCategories([]);
        setCategory("all");
      }
    }

    loadCategories();
    return () => {
      ignore = true;
    };
  }, [sectionId, missingSection, category]);

  const handleConfirm = async () => {
  const filters: any = {
    // ✅ removed q + barcodeStatus (حسب متطلباتك)
    sectionId: sectionId === "all" ? undefined : sectionId,
    category: category === "all" ? undefined : category,
    missingSection: Boolean(missingSection) || undefined,

    // ✅ send as array (backend will handle it)
    departmentIds: selectedDeptIds.length ? selectedDeptIds : undefined,

    expiry: undefined,
  };
  

    if (expiryEnabled) {
      filters.expiry = { type: "within", days: Number(expiryDays || 0) };
    }

    const payload = {
      mode: "filters",
      fileName: "products_export.xlsx",
      columns: selectedColumns,
      filters,
    };

    await onConfirm(payload);
    onClose();
  };

  const sectionValue = missingSection ? "uncategorized" : sectionId;

  return (
    <Dialog open={open} onClose={isExporting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Export Filtered Products</DialogTitle>

      {/* ✅ Progress bar وقت التصدير */}
      {isExporting && <LinearProgress />}

      <DialogContent>
        <Box sx={{ display: "flex", gap: 2, flexDirection: "column", py: 1 }}>
          {/* Columns */}
          <Box>
            <Typography variant="subtitle1">Columns</Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", my: 1 }}>
              <Button size="small" onClick={selectAll} disabled={isExporting}>
                Select All
              </Button>
              <Button size="small" onClick={clearAll} disabled={isExporting}>
                Clear
              </Button>
            </Box>

            <FormGroup row>
              {ALL_COLUMNS.map((c) => (
                <FormControlLabel
                  key={c}
                  control={
                    <Checkbox
                      checked={selectedColumns.includes(c)}
                      onChange={() => toggleColumn(c)}
                      disabled={isExporting}
                    />
                  }
                  label={
                    <Typography sx={{ color: "text.primary", fontSize: 13 }}>
                      {c}
                    </Typography>
                  }
                />
              ))}
            </FormGroup>
          </Box>

          <Divider />

          {/* Basic Filters */}
          <Box>
            <Typography variant="subtitle1">Basic Filters</Typography>

            <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1, flexWrap: "wrap" }}>
              <TextField
                size="small"
                select
                label="Section"
                value={sectionValue}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "uncategorized") {
                    setMissingSection(true);
                    setSectionId(null);
                    setCategory("all");
                  } else if (v === "all") {
                    setMissingSection(false);
                    setSectionId("all");
                    setCategory("all");
                  } else {
                    setMissingSection(false);
                    setSectionId(Number(v));
                    setCategory("all");
                  }
                }}
                sx={{ minWidth: 240 }}
                disabled={isExporting}
              >
                <MenuItem value={"all"}>All</MenuItem>
                <MenuItem value={"uncategorized"}>Uncategorized</MenuItem>
                {sections.map((s) => (
                  <MenuItem key={s.ID_SECTION} value={s.ID_SECTION}>
                    {s.DESIG}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                select
                label="Catalog"
                value={category}
                onChange={(e) => setCategory(e.target.value as string | "all")}
                sx={{ minWidth: 240 }}
                disabled={isExporting || missingSection || sectionId === "all" || sectionId === null}
              >
                <MenuItem value="all">All Catalogs</MenuItem>
                {sectionCategories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Departments checklist */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Departments
              </Typography>

              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1,
                  maxHeight: 180,
                  overflowY: "auto",
                }}
              >
                {departments.length === 0 ? (
                  <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                    No departments found.
                  </Typography>
                ) : (
                  <FormGroup>
                    {departments.map((d) => {
                      const id = d.id_administratin;
                      return (
                        <FormControlLabel
                          key={id}
                          control={
                            <Checkbox
                              checked={selectedDeptIds.includes(id)}
                              onChange={() => toggleDept(id)}
                              disabled={isExporting}
                            />
                          }
                          label={
                            // ✅ هنا أصل المشكلة: نخلي اللون واضح + نجيب اسم صحيح
                            <Typography sx={{ color: "text.primary", fontSize: 13 }}>
                              {getDeptLabel(d)}
                            </Typography>
                          }
                        />
                      );
                    })}
                  </FormGroup>
                )}
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Advanced Filters */}
          <Box>
            <Typography variant="subtitle1">Advanced Filters</Typography>

            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Expiry Date
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={expiryEnabled}
                    onChange={(e) => setExpiryEnabled(e.target.checked)}
                    disabled={isExporting}
                  />
                }
                label="Enable Expiry Filter"
              />

              {expiryEnabled && (
                <Box sx={{ mt: 1, maxWidth: 220 }}>
                  <TextField
                    size="small"
                    type="number"
                    label="Within N days"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value === "" ? "" : Number(e.target.value))}
                    disabled={isExporting}
                    fullWidth
                  />
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleConfirm} disabled={isExporting}>
          Confirm Export
        </Button>
      </DialogActions>
    </Dialog>
  );
}