import React, { useState, useEffect } from 'react';
import { Grid, TextField, Checkbox, FormControlLabel, Button, Box, Snackbar, Alert, Autocomplete } from '@mui/material';
import { getUsers, getAdministrations, getContracts } from '../services/requisitionsService';

export default function HeaderForm({ header = {}, onSave }) {
  const [form, setForm] = useState({});
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [snack, setSnack] = useState({ open: false, severity: 'success', message: '' });

  useEffect(() => {
    setForm(header || {});
  }, [header]);

  useEffect(() => {
    (async () => {
      try {
        const u = await getUsers();
        setUsers(u || []);
      } catch (e) {}
      try {
        const a = await getAdministrations();
        setAdmins(a || []);
      } catch (e) {}
      try {
        const c = await getContracts();
        setContracts(c || []);
      } catch (e) {}
    })();
  }, []);

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (onSave) {
      const changes = {};
      Object.keys(form).forEach(k => {
        if (form[k] !== header[k]) changes[k] = form[k];
      });
      onSave(changes);
    }
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <TextField label="num_bn" value={form.num_bn || ''} fullWidth InputProps={{ readOnly: true }} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label="date_req"
            type="date"
            value={form.date_req ? form.date_req.split('T')[0] : ''}
            onChange={e => updateField('date_req', e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Autocomplete
            options={users}
            getOptionLabel={(o) => o.label || ''}
            value={users.find(u => u.id === form.usr) || null}
            onChange={(_, v) => updateField('usr', v ? v.id : null)}
            renderInput={(params) => <TextField {...params} label="Request from" fullWidth />}
            isOptionEqualToValue={(o, v) => o.id === v.id}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControlLabel
            control={<Checkbox checked={!!form.Is_urgent} onChange={e => updateField('Is_urgent', e.target.checked)} />}
            label="Is urgent"
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField label="Requestrefrence" value={form.Requestrefrence || ''} onChange={e => updateField('Requestrefrence', e.target.value)} fullWidth />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Autocomplete
            options={admins}
            getOptionLabel={(o) => o.label || ''}
            value={admins.find(a => a.id === form.benefiary_depart) || null}
            onChange={(_, v) => updateField('benefiary_depart', v ? v.id : null)}
            renderInput={(params) => <TextField {...params} label="Benef. Cost Center" fullWidth />}
            isOptionEqualToValue={(o, v) => o.id === v.id}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Autocomplete
            options={contracts}
            getOptionLabel={(o) => o.label || ''}
            value={contracts.find(c => c.id === form.PROJECT) || null}
            onChange={(_, v) => updateField('PROJECT', v ? v.id : null)}
            renderInput={(params) => <TextField {...params} label="Project / Contract" fullWidth />}
            isOptionEqualToValue={(o, v) => o.id === v.id}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField label="ASSET_ID" value={form.ASSET_ID || ''} onChange={e => updateField('ASSET_ID', e.target.value)} fullWidth />
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField label="Requisition_Title" value={form.Requisition_Title || ''} onChange={e => updateField('Requisition_Title', e.target.value)} fullWidth />
        </Grid>

        <Grid item xs={12}>
          <TextField label="Comment" value={form.Comment || ''} onChange={e => updateField('Comment', e.target.value)} fullWidth multiline rows={2} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Comment_ar" value={form.Comment_ar || ''} onChange={e => updateField('Comment_ar', e.target.value)} fullWidth multiline rows={2} />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField label="requisition_status" value={form.requisition_status || ''} onChange={e => updateField('requisition_status', e.target.value)} fullWidth />
        </Grid>

        <Grid item xs={12}>
          <Button variant="contained" onClick={handleSave} sx={{ mt: 1 }}>
            Save Header
          </Button>
        </Grid>
      </Grid>
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
