import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  FormControlLabel,
  Switch,
  Typography,
  FormGroup,
  Checkbox,
  Box,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import type { ProductRow, SectionRow, CostCenterRow } from "../types";
import { getSectionCategories } from "../services/supplyChain.api";

type Props = {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  sections: SectionRow[];
  departments: CostCenterRow[]; // ✅ NEW
  initial?: Partial<ProductRow> | null;
  onSubmit: (payload: Partial<ProductRow>) => Promise<void>;
};

// ✅ parse "1, 2,3" -> [1,2,3]
function parseSectCsv(input: any): number[] {
  if (!input) return [];
  const str = String(input);
  return str
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n));
}

function toSectCsv(ids: number[]): string | null {
  const clean = Array.from(new Set(ids.map((x) => Number(x)).filter((x) => Number.isFinite(x))));
  return clean.length ? clean.join(", ") : null;
}

export default function ProductFormDialog(props: Props) {
  const { open, onClose, mode, sections, departments, initial, onSubmit } = props;

  const [saving, setSaving] = React.useState(false);

  // --- Core
  const [desig_art, setDesigArt] = React.useState("");
  const [Place_item, setPlace] = React.useState("");
  const [ID_SECTION, setSectionId] = React.useState<number | "none">("none");
  const [productCategory, setProductCategory] = React.useState<string>("");
  const [sectionCategories, setSectionCategories] = React.useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = React.useState(false);

  // ✅ Departments (SECT)
  const [deptIds, setDeptIds] = React.useState<number[]>([]);

  // --- Extra fields from ProductRow
  const [BARCODE, setBarcode] = React.useState("");
  const [Alternante_Code, setAltCode] = React.useState("");

  const [Price, setPrice] = React.useState<string>("");
  const [CURRENCY, setCurrency] = React.useState("");

  const [QTY_SECURIT, setQtySecurity] = React.useState<string>("");

  const [expir_date, setExpiryDate] = React.useState("");

  const [SIZE_ART, setSize] = React.useState("");
  const [contents, setContents] = React.useState("");

  const [MANUFACRURE, setManufacturer] = React.useState("");
  const [COUNTRY, setCountry] = React.useState("");

  const [SCIENTIFIC_NAME, setScientificName] = React.useState("");
  const [Comment, setComment] = React.useState("");

  const [pharmacy, setPharmacy] = React.useState(false);
  const [Is_Verified, setIsVerified] = React.useState(false);

  // Load defaults for BOTH create/edit
  React.useEffect(() => {
    if (!open) return;

    setDesigArt(initial?.desig_art ?? "");
    setPlace(initial?.Place_item ?? "");
    setSectionId(initial?.ID_SECTION == null ? "none" : (initial.ID_SECTION as any));
    setProductCategory((initial as any)?.product_category ?? "");

    setBarcode(initial?.BARCODE ?? "");
    setAltCode(initial?.Alternante_Code ?? "");

    setPrice(initial?.Price != null ? String(initial.Price) : "");
    setCurrency(initial?.CURRENCY ?? "");

    setQtySecurity(initial?.QTY_SECURIT != null ? String(initial.QTY_SECURIT) : "");

    const rawDate = initial?.expir_date ?? "";
    setExpiryDate(rawDate ? String(rawDate).slice(0, 10) : "");

    setSize(initial?.SIZE_ART ?? "");
    setContents(initial?.contents ?? "");

    setManufacturer(initial?.MANUFACRURE ?? "");
    setCountry(initial?.COUNTRY ?? "");

    setScientificName(initial?.SCIENTIFIC_NAME ?? "");
    setComment(initial?.Comment ?? "");

    setPharmacy(Boolean(initial?.pharmacy));
    setIsVerified(Boolean(initial?.Is_Verified));

    // ✅ load dept ids from SECT
    setDeptIds(parseSectCsv((initial as any)?.SECT));

    setSaving(false);
  }, [open, initial]);

  React.useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      const sectionId = ID_SECTION === "none" ? null : Number(ID_SECTION);
      if (!sectionId) {
        if (active) setSectionCategories([]);
        return;
      }

      setLoadingCategories(true);
      try {
        const rows = await getSectionCategories(sectionId);
        if (active) {
          const labels = Array.isArray(rows) ? rows.map((x) => x.label) : [];
          setSectionCategories(labels);
        }
      } catch {
        if (active) setSectionCategories([]);
      } finally {
        if (active) setLoadingCategories(false);
      }
    };

    loadCategories();

    return () => {
      active = false;
    };
  }, [ID_SECTION]);

  function toggleDept(id: number) {
    setDeptIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSave() {
    if (!desig_art.trim()) {
      alert("Product name is required.");
      return;
    }

    const payload: Partial<ProductRow> = {
      desig_art: desig_art.trim(),
      Place_item: Place_item.trim() === "" ? null : Place_item.trim(),
      ID_SECTION: ID_SECTION === "none" ? null : Number(ID_SECTION),

      BARCODE: BARCODE.trim() === "" ? null : BARCODE.trim(),
      Alternante_Code: Alternante_Code.trim() === "" ? null : Alternante_Code.trim(),

      Price: Price.trim() === "" ? null : Number(Price),
      CURRENCY: CURRENCY.trim() === "" ? null : CURRENCY.trim(),

      QTY_SECURIT: QTY_SECURIT.trim() === "" ? null : Number(QTY_SECURIT),

      expir_date: expir_date.trim() === "" ? null : expir_date.trim(),

      SIZE_ART: SIZE_ART.trim() === "" ? null : SIZE_ART.trim(),
      contents: contents.trim() === "" ? null : contents.trim(),

      MANUFACRURE: MANUFACRURE.trim() === "" ? null : MANUFACRURE.trim(),
      COUNTRY: COUNTRY.trim() === "" ? null : COUNTRY.trim(),

      SCIENTIFIC_NAME: SCIENTIFIC_NAME.trim() === "" ? null : SCIENTIFIC_NAME.trim(),
      Comment: Comment.trim() === "" ? null : Comment.trim(),

      pharmacy,
      Is_Verified,
      product_category: productCategory.trim() === "" ? null : productCategory.trim(),

      // ✅ NEW: SECT saved as "1, 2, 3" (or null)
      // @ts-ignore
      SECT: toSectCsv(deptIds),
    };

    setSaving(true);
    try {
      await onSubmit(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === "create" ? "Add Product" : "Edit Product"}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField
            label="Product Name"
            value={desig_art}
            onChange={(e) => setDesigArt(e.target.value)}
            fullWidth
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Place"
              value={Place_item}
              onChange={(e) => setPlace(e.target.value)}
              fullWidth
            />
            <Autocomplete
              options={sections}
              getOptionLabel={(s) => s.DESIG ?? `Section #${s.ID_SECTION}`}
              value={ID_SECTION === "none" ? null : sections.find((s) => s.ID_SECTION === Number(ID_SECTION)) || null}
              onChange={(_, section) => {
                setSectionId(section ? section.ID_SECTION : "none");
                setProductCategory("");
              }}
              renderInput={(params) => <TextField {...params} label="Section" fullWidth />}
              fullWidth
            />
          </Stack>

          <Autocomplete
            options={
              productCategory && !sectionCategories.includes(productCategory)
                ? [productCategory, ...sectionCategories]
                : sectionCategories
            }
            value={productCategory || null}
            onChange={(_, value) => setProductCategory(value || "")}
            loading={loadingCategories}
            disabled={ID_SECTION === "none"}
            freeSolo={false}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Catalog (Category)"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingCategories ? <CircularProgress color="inherit" size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {/* ✅ Departments Checklist */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Departments (SECT)
            </Typography>

            <Box
              sx={{
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 1,
                p: 1,
                maxHeight: 220,
                overflow: "auto",
              }}
            >
              <FormGroup>
                {departments.map((d: any) => {
                  const id = Number(d?.id_administratin);
                  const label = d?.administration || d?.administration_ar || `Dept #${id}`;

                  if (!Number.isFinite(id)) return null;

                  return (
                    <FormControlLabel
                      key={id}
                      control={
                        <Checkbox
                          checked={deptIds.includes(id)}
                          onChange={() => toggleDept(id)}
                        />
                      }
                      label={`${id} - ${label}`}
                    />
                  );
                })}
              </FormGroup>
            </Box>
          </Box>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="Barcode" value={BARCODE} onChange={(e) => setBarcode(e.target.value)} fullWidth />
            <TextField label="Alt. Code" value={Alternante_Code} onChange={(e) => setAltCode(e.target.value)} fullWidth />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="Price" value={Price} onChange={(e) => setPrice(e.target.value)} fullWidth />
            <TextField label="Currency" value={CURRENCY} onChange={(e) => setCurrency(e.target.value)} fullWidth />
            <TextField label="Qty Security" value={QTY_SECURIT} onChange={(e) => setQtySecurity(e.target.value)} fullWidth />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Expiry Date"
              type="date"
              value={expir_date}
              onChange={(e) => setExpiryDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField label="Scientific Name" value={SCIENTIFIC_NAME} onChange={(e) => setScientificName(e.target.value)} fullWidth />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="Size" value={SIZE_ART} onChange={(e) => setSize(e.target.value)} fullWidth />
            <TextField label="Contents" value={contents} onChange={(e) => setContents(e.target.value)} fullWidth />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="Manufacturer" value={MANUFACRURE} onChange={(e) => setManufacturer(e.target.value)} fullWidth />
            <TextField label="Country" value={COUNTRY} onChange={(e) => setCountry(e.target.value)} fullWidth />
          </Stack>

          <TextField
            label="Comment"
            value={Comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControlLabel
              control={<Switch checked={pharmacy} onChange={(e) => setPharmacy(e.target.checked)} />}
              label="Pharmacy"
            />
            <FormControlLabel
              control={<Switch checked={Is_Verified} onChange={(e) => setIsVerified(e.target.checked)} />}
              label="Verified"
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {mode === "create" ? "Create" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}