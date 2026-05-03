import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getSections, getArticles } from '../services/requisitionsService';
import { Autocomplete } from '@mui/material';

export default function ItemsTable({ items = [], onAdd, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [sections, setSections] = useState([]);
  const [articles, setArticles] = useState([]);

  function openNew() {
    setEditing(null);
    setForm({ Req_item: '', part_number: '', unit: '', qty: 1, Comment: '', Comment_ar: '', sectionId: null, productId: null });
    setOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({ ...item, productId: item.Id_art || item.productId || null, sectionId: item.ID_SECTION || item.sectionId || null });
    setOpen(true);
  }

  useEffect(() => {
    (async () => {
      try {
        const s = await getSections();
        setSections(s || []);
      } catch (e) {}
    })();
  }, []);

  async function loadArticles(sectionId, q) {
    try {
      const a = await getArticles({ sectionId, q });
      setArticles(a || []);
    } catch (e) {}
  }

  function handleSave() {
    if (editing) {
      const id = editing.ID_REQ || editing.id;
      const payload = {
        Req_item: form.Req_item,
        part_number: form.part_number,
        unit: form.unit,
        qty: form.qty,
        Comment: form.Comment,
        Comment_ar: form.Comment_ar,
        art: form.art || null,
        Assets: form.Assets || null,
        benefiary_depart: form.benefiary_depart || null,
      };
      onUpdate(id, payload);
    } else {
      const payload = {
        Req_item: form.Req_item,
        part_number: form.part_number,
        unit: form.unit,
        qty: form.qty,
        Comment: form.Comment,
        Comment_ar: form.Comment_ar,
        art: form.art || null,
        Assets: form.Assets || null,
        benefiary_depart: form.benefiary_depart || null,
      };
      onAdd(payload);
    }
    setOpen(false);
  }

  return (
    <div>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <div />
        <Button variant="outlined" startIcon={<AddIcon />} onClick={openNew}>
          Add Item
        </Button>
      </Stack>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Req_item</TableCell>
              <TableCell>part_number</TableCell>
              <TableCell>unit</TableCell>
              <TableCell>qty</TableCell>
              <TableCell>Comment</TableCell>
              <TableCell>Comment_ar</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(row => (
              <TableRow key={row.ID_REQ || row.id} hover>
                <TableCell>{row.Req_item}</TableCell>
                <TableCell>{row.part_number}</TableCell>
                <TableCell>{row.unit}</TableCell>
                <TableCell>{row.qty}</TableCell>
                <TableCell>{row.Comment}</TableCell>
                <TableCell>{row.Comment_ar}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(row)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => onDelete(row.ID_REQ || row.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit Item' : 'Add Item'}</DialogTitle>
        <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Autocomplete
                options={sections}
                getOptionLabel={(o) => o.label || ''}
                value={sections.find(s => s.id === form.sectionId) || null}
                onChange={(_, v) => {
                  const sid = v ? v.id : null;
                  setForm(s => ({ ...s, sectionId: sid, productId: null, Req_item: '', part_number: '', unit: '' }));
                  loadArticles(sid);
                }}
                renderInput={(params) => <TextField {...params} label="Section" fullWidth />}
                isOptionEqualToValue={(o, v) => o.id === v.id}
              />

              <Autocomplete
                options={articles}
                getOptionLabel={(o) => o.label || ''}
                value={articles.find(a => a.id === form.productId) || null}
                onChange={(_, v) => {
                  if (v) {
                    setForm(s => ({ ...s, productId: v.id, Req_item: v.label, part_number: v.partNumber || '', unit: v.unit || '' }));
                  } else {
                    setForm(s => ({ ...s, productId: null }));
                  }
                }}
                renderInput={(params) => <TextField {...params} label="Product" onChange={e => loadArticles(form.sectionId, e.target.value)} fullWidth />}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                freeSolo
              />

              <TextField label="Req_item" value={form.Req_item || ''} onChange={e => setForm(s => ({ ...s, Req_item: e.target.value }))} fullWidth />
              <TextField label="part_number" value={form.part_number || ''} onChange={e => setForm(s => ({ ...s, part_number: e.target.value }))} fullWidth />
              <TextField label="unit" value={form.unit || ''} onChange={e => setForm(s => ({ ...s, unit: e.target.value }))} fullWidth />
              <TextField label="qty" type="number" value={form.qty || 1} onChange={e => setForm(s => ({ ...s, qty: Number(e.target.value) }))} fullWidth />
              <TextField label="Comment" value={form.Comment || ''} onChange={e => setForm(s => ({ ...s, Comment: e.target.value }))} fullWidth />
              <TextField label="Comment_ar" value={form.Comment_ar || ''} onChange={e => setForm(s => ({ ...s, Comment_ar: e.target.value }))} fullWidth />
            </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
