import React, { useEffect, useState } from 'react';
import { Box, Paper, Snackbar, Alert, Typography } from '@mui/material';
import HeaderForm from '../../components/HeaderForm';
import ItemsTable from '../../components/ItemsTable';
import {
  getRequisition,
  updateHeader,
  addItem,
  updateItem,
  deleteItem,
  createDraft,
} from '../../services/requisitionsService';
import { Button, Stack } from '@mui/material';

export default function RequisitionDetails({ numBn }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await getRequisition(numBn);
      setData(res);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (numBn) load(); }, [numBn]);

  async function handleSaveHeader(changes) {
    try {
      await updateHeader(numBn, changes);
      await load();
    } catch (e) {
      setError(e.message || 'Failed to save header');
    }
  }

  async function handleAddItem(payload) {
    try {
      await addItem(numBn, payload);
      await load();
    } catch (e) {
      setError(e.message || 'Failed to add item');
    }
  }

  async function handleUpdateItem(id, payload) {
    try {
      await updateItem(id, payload);
      await load();
    } catch (e) {
      setError(e.message || 'Failed to update item');
    }
  }

  async function handleDeleteItem(id) {
    try {
      if (!window.confirm('Delete this item?')) return;
      await deleteItem(id);
      await load();
    } catch (e) {
      setError(e.message || 'Failed to delete item');
    }
  }

  if (!numBn) return <div>Select a requisition</div>;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Requisition Details - {numBn}</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <HeaderForm header={data?.header || data || {}} onSave={handleSaveHeader} />
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
          <Button variant="outlined" onClick={async () => {
            try {
              const res = await createDraft();
              const nb = res?.num_bn;
              if (nb) {
                // navigate to new draft
                window.location.href = '/supplyChain/requisitions/' + nb;
              }
            } catch (e) { console.error(e); }
          }}>New Draft</Button>

          <Button variant="outlined" onClick={() => window.scrollTo(0, document.body.scrollHeight)}>Add Item</Button>

          <Button variant="contained" onClick={async () => { if (data?.header) await handleSaveHeader(data.header); }}>Update</Button>

          <Button variant="outlined" disabled>Delete</Button>

          <Button variant="contained" disabled>Submit Request</Button>
        </Stack>
        <ItemsTable items={data?.items || []} onAdd={handleAddItem} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} />
      </Paper>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{String(error)}</Alert>
      </Snackbar>
    </Box>
  );
}
