import * as React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, List, ListItemButton, ListItemText, Divider, FormControlLabel, Switch, TextField, MenuItem
} from "@mui/material";
import type { SectionRow } from "../types";
import type { SectionCategoryRow } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;

  sections: SectionRow[];
  loading: boolean;

  selectedSectionId: number | null;
  selectedCategory: string | null;
  sectionCategories: SectionCategoryRow[];
  missingSection: boolean;

  onSelectSection: (id: number | null) => void;
  onSelectCategory: (name: string | null) => void;
  onToggleMissingSection: (v: boolean) => void;
};

export default function SectionFilterDialog(props: Props) {
  const {
    open, onClose,
    sections, loading,
    selectedSectionId, selectedCategory, sectionCategories, missingSection,
    onSelectSection, onSelectCategory, onToggleMissingSection
  } = props;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Select Section</DialogTitle>
      <DialogContent dividers>
        <FormControlLabel
          control={
            <Switch
              checked={missingSection}
              onChange={(e) => onToggleMissingSection(e.target.checked)}
            />
          }
          label="Uncategorized (No Section)"
        />
        <Divider sx={{ my: 1 }} />

        <List dense sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
          <ListItemButton
            selected={!missingSection && selectedSectionId === null}
            onClick={() => onSelectSection(null)}
            disabled={loading}
          >
            <ListItemText primary="All Sections" />
          </ListItemButton>

          {sections.map((s) => (
            <ListItemButton
              key={s.ID_SECTION}
              selected={!missingSection && selectedSectionId === s.ID_SECTION}
              onClick={() => onSelectSection(s.ID_SECTION)}
              disabled={loading}
            >
              <ListItemText
                primary={s.DESIG ?? `Section #${s.ID_SECTION}`}
                secondary={s.CODE_SECTION ? `Code: ${s.CODE_SECTION}` : undefined}
              />
            </ListItemButton>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <TextField
          select
          fullWidth
          label="Catalog"
          value={selectedCategory ?? "all"}
          onChange={(e) => {
            const v = e.target.value;
            onSelectCategory(v === "all" ? null : v);
          }}
          disabled={loading || missingSection || selectedSectionId === null}
          helperText={
            selectedSectionId === null
              ? "Select section first"
              : missingSection
              ? "Catalog filter is disabled for Uncategorized"
              : undefined
          }
        >
          <MenuItem value="all">All Catalogs</MenuItem>
          {sectionCategories.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.label}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
