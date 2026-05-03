import * as React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, TextField, IconButton, List, ListItem,
  ListItemText, Divider, Stack, Autocomplete, Chip
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import type { SectionCategoryRow, SectionRow } from "../types";
import {
  addSectionCategory,
  createSection,
  deleteSection,
  deleteSectionCategory,
  getSectionCategories,
  updateSection,
} from "../services/supplyChain.api";


type Props = {
  open: boolean;
  onClose: () => void;
  sections: SectionRow[];
  onChanged: () => void; // refresh
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
};

export default function SectionManageDialog(props: Props) {
  const { open, onClose, sections, onChanged, onError, onSuccess } = props;

  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [editing, setEditing] = React.useState<SectionRow | null>(null);
  const [DESIG, setDESIG] = React.useState("");
  const [CODE_SECTION, setCODE_SECTION] = React.useState("");
  const [Account, setAccount] = React.useState("");
  const [Debit_Account, setDebitAccount] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [selectedSection, setSelectedSection] = React.useState<SectionRow | null>(null);
  const [categoryName, setCategoryName] = React.useState("");
  const [categories, setCategories] = React.useState<SectionCategoryRow[]>([]);
  const [loadingCategories, setLoadingCategories] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setMode("create");
    setEditing(null);
    setDESIG("");
    setCODE_SECTION("");
    setAccount("");
    setDebitAccount("");
    setSaving(false);
    setSelectedSection(null);
    setCategoryName("");
    setCategories([]);
  }, [open]);

  React.useEffect(() => {
    let active = true;

    const load = async () => {
      if (!selectedSection) {
        if (active) setCategories([]);
        return;
      }

      setLoadingCategories(true);
      try {
        const rows = await getSectionCategories(selectedSection.ID_SECTION);
        if (active) setCategories(Array.isArray(rows) ? rows : []);
      } catch {
        if (active) setCategories([]);
      } finally {
        if (active) setLoadingCategories(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [selectedSection]);

  function startEdit(s: SectionRow) {
    setMode("edit");
    setEditing(s);
    setDESIG(s.DESIG ?? "");
    setCODE_SECTION(s.CODE_SECTION ?? "");
    setAccount((s as any).Account ?? "");
    setDebitAccount((s as any).Debit_Account ?? "");
  }

  async function handleSave() {
    if (!DESIG.trim()) {
      onError("Section name (DESIG) is required.");
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        await createSection({ DESIG, CODE_SECTION, Account, Debit_Account });
        onSuccess("Section created.");
      } else {
        if (!editing) return;
        await updateSection(editing.ID_SECTION, { DESIG, CODE_SECTION, Account, Debit_Account });
        onSuccess("Section updated.");
      }
      onChanged();
      setMode("create");
      setEditing(null);
      setDESIG("");
      setCODE_SECTION("");
      setAccount("");
      setDebitAccount("");
    } catch (e: any) {
      onError(e?.response?.data?.message || e.message || "Failed to save section.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const ok = window.confirm("Delete this section?");
    if (!ok) return;

    try {
      await deleteSection(id);
      onSuccess("Section deleted.");
      onChanged();
    } catch (e: any) {
      onError(e?.response?.data?.message || e.message || "Failed to delete section.");
    }
  }

  async function handleAddCategory() {
    if (!selectedSection) {
      onError("Select section first.");
      return;
    }

    const name = categoryName.trim();
    if (!name) {
      onError("Category name is required.");
      return;
    }

    try {
      await addSectionCategory(selectedSection.ID_SECTION, name);
      onSuccess("Category added.");
      const rows = await getSectionCategories(selectedSection.ID_SECTION);
      setCategories(Array.isArray(rows) ? rows : []);
      setCategoryName("");
    } catch (e: any) {
      onError(e?.response?.data?.message || e.message || "Failed to add category.");
    }
  }

  async function handleDeleteCategory(item: SectionCategoryRow) {
    if (!selectedSection) return;

    try {
      await deleteSectionCategory(selectedSection.ID_SECTION, item.label);
      onSuccess("Category deleted.");
      const rows = await getSectionCategories(selectedSection.ID_SECTION);
      setCategories(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      onError(e?.response?.data?.message || e.message || "Failed to delete category.");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Manage Sections</DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          <Box>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Button
                variant={mode === "create" ? "contained" : "outlined"}
                onClick={() => {
                  setMode("create");
                  setEditing(null);
                  setDESIG("");
                  setCODE_SECTION("");
                  setAccount("");
                  setDebitAccount("");
                }}
              >
                Add New
              </Button>

              {mode === "edit" ? (
                <Button variant="outlined" onClick={() => {
                  setMode("create");
                  setEditing(null);
                  setDESIG("");
                  setCODE_SECTION("");
                  setAccount("");
                  setDebitAccount("");
                }}>
                  Cancel Edit
                </Button>
              ) : null}
            </Stack>

            <TextField
              fullWidth
              label="Section Name (DESIG)"
              value={DESIG}
              onChange={(e) => setDESIG(e.target.value)}
              sx={{ mb: 1.5 }}
            />
            <TextField
              fullWidth
              label="Code (optional)"
              value={CODE_SECTION}
              onChange={(e) => setCODE_SECTION(e.target.value)}
              sx={{ mb: 1.5 }}
            />
            <TextField
              fullWidth
              label="Account (optional)"
              value={Account}
              onChange={(e) => setAccount(e.target.value)}
              sx={{ mb: 1.5 }}
            />
            <TextField
              fullWidth
              label="Debit Account (optional)"
              value={Debit_Account}
              onChange={(e) => setDebitAccount(e.target.value)}
            />

            <Divider sx={{ my: 2 }} />

            <Button onClick={handleSave} variant="contained" disabled={saving}>
              {mode === "create" ? "Create Section" : "Update Section"}
            </Button>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ fontWeight: 700, mb: 1 }}>Section Catalogs</Box>

            <Autocomplete
              options={sections}
              getOptionLabel={(s) => s.DESIG ?? `Section #${s.ID_SECTION}`}
              value={selectedSection}
              onChange={(_, value) => setSelectedSection(value)}
              renderInput={(params) => <TextField {...params} label="Select Section" fullWidth />}
              isOptionEqualToValue={(option, value) => option.ID_SECTION === value.ID_SECTION}
              sx={{ mb: 1.5 }}
            />

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
              <TextField
                fullWidth
                label="New Category"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                disabled={!selectedSection}
              />
              <Button variant="contained" onClick={handleAddCategory} disabled={!selectedSection}>
                Add Category
              </Button>
            </Stack>

            <Box
              sx={{
                mt: 1.2,
                p: 1,
                minHeight: 60,
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              {selectedSection && loadingCategories ? "Loading..." : null}
              {selectedSection && !loadingCategories && categories.length === 0 ? "No categories." : null}
              {categories.map((item) => (
                <Chip
                  key={item.id}
                  label={item.label}
                  onDelete={item.isDefault ? undefined : () => handleDeleteCategory(item)}
                  variant={item.isDefault ? "outlined" : "filled"}
                />
              ))}
            </Box>
          </Box>

          <Box>
            <List dense sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
              {sections.map((s) => (
                <ListItem
                  key={s.ID_SECTION}
                  secondaryAction={
                    <Stack direction="row" spacing={0.5}>
                      <IconButton onClick={() => startEdit(s)} edge="end" title="Edit">
                        <EditOutlinedIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(s.ID_SECTION)} edge="end" title="Delete">
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={s.DESIG ?? `Section #${s.ID_SECTION}`}
                    secondary={s.CODE_SECTION ? `Code: ${s.CODE_SECTION}` : undefined}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
