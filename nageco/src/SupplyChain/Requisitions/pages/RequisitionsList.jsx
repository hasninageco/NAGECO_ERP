import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Stack, Snackbar, Alert } from '@mui/material';
import { getRequisitions, createDraft } from '../../services/requisitionsService';

export default function RequisitionsList({ router }) {
  const [rows, setRows] = useState([]);
  const [limit] = useState(30);
  const [offset, setOffset] = useState(0);
  const [q, setQ] = useState('');
  const [error, setError] = useState(null);

  async function load() {
    try {
      const data = await getRequisitions({ limit, offset });
      // assume data is array or {rows:[], total}
      setRows(Array.isArray(data) ? data : data.rows || []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    }
  }

  useEffect(() => { load(); }, [limit, offset]);

  const filtered = rows.filter(r => {
    if (!q) return true;
    const t = q.toLowerCase();
    return String(r.num_bn).toLowerCase().includes(t) || String(r.Requisition_Title || '').toLowerCase().includes(t);
  });

  async function handleNew() {
    try {
      const res = await createDraft();
      const nb = res.num_bn;
      if (router && router.navigate) router.navigate('/supplyChain/requisitions/' + nb);
    } catch (e) {
      setError(e.message || 'Failed to create draft');
    }
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <TextField placeholder="Search by num_bn or title" value={q} onChange={e => setQ(e.target.value)} size="small" sx={{ width: 300 }} />
        <Button variant="contained" onClick={handleNew}>New Draft</Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>num_bn</TableCell>
              <TableCell>date_req</TableCell>
              <TableCell>usr</TableCell>
              <TableCell>Is_urgent</TableCell>
              <TableCell>benefiary_depart</TableCell>
              <TableCell>PROJECT</TableCell>
              <TableCell>ASSET_ID</TableCell>
              <TableCell>Requisition_Title</TableCell>
              <TableCell>requisition_status</TableCell>
              <TableCell>itemsCount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(row => (
              <TableRow key={row.num_bn} hover sx={{ cursor: 'pointer' }} onClick={() => router && router.navigate && router.navigate('/supplyChain/requisitions/' + row.num_bn)}>
                <TableCell>{row.num_bn}</TableCell>
                <TableCell>{row.date_req}</TableCell>
                <TableCell>{row.usr}</TableCell>
                <TableCell>{row.Is_urgent ? 'Yes' : 'No'}</TableCell>
                <TableCell>{row.benefiary_depart}</TableCell>
                <TableCell>{row.PROJECT}</TableCell>
                <TableCell>{row.ASSET_ID}</TableCell>
                <TableCell>{row.Requisition_Title}</TableCell>
                <TableCell>{row.requisition_status}</TableCell>
                <TableCell>{row.itemsCount ?? (row.items ? row.items.length : '')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
        <Button onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0}>Prev</Button>
        <Button onClick={() => setOffset(offset + limit)}>Next</Button>
      </Stack>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{String(error)}</Alert>
      </Snackbar>
    </Box>
  );
}
