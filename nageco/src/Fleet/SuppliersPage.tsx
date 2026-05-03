import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { MRT_Localization_AR } from 'material-react-table/locales/ar';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import StoreIcon from '@mui/icons-material/Store';
import { useTranslation } from 'react-i18next';
import { buildApiUrl } from '../utils/api';

type Props = {
  onBack?: () => void;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  errors?: Array<{ field?: string; message?: string }>;
};

type Supplier = {
  ID_SUPPLIER: number;
  NAME: string;
  SUPPLIER_TYPE?: string | null;
  CONTACT_PERSON?: string | null;
  PHONE?: string | null;
  EMAIL?: string | null;
  ADDRESS?: string | null;
  STATUS?: string | null;
  CREATED_AT?: string | null;
  UPDATED_AT?: string | null;
};

type EditSupplier = {
  idSupplier?: number;
  name: string;
  supplierType: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: string;
};

const SUPPLIER_TYPES = ['Insurance Company', 'Workshop', 'Supplier', 'Other'];
const SUPPLIER_STATUSES = ['Active', 'Inactive'];

const defaultEditSupplier = (): EditSupplier => ({
  name: '',
  supplierType: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  status: 'Active',
});

const SuppliersPage: React.FC<Props> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const apiUrl = buildApiUrl('/fleet/suppliers');

  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>('');
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editSupplier, setEditSupplier] = useState<EditSupplier | null>(null);

  const withAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  }, [navigate]);

  const extractErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      const respData = error.response?.data as ApiEnvelope<unknown> | undefined;
      const rawErrors = respData?.errors;
      const apiErrors = Array.isArray(rawErrors) ? rawErrors : [];
      if (apiErrors.length > 0) {
        const msg = apiErrors.map((e) => e.message).filter(Boolean).join('\n');
        if (msg) return msg;
      }
      if (typeof respData?.message === 'string' && respData.message.trim()) {
        return respData.message;
      }
      if (typeof error.message === 'string' && error.message.trim()) {
        return error.message;
      }
    }
    return fallback;
  };

  const fetchRows = useCallback(async () => {
    const headers = withAuth();
    if (!headers) return;

    setLoading(true);
    try {
      const resp = await axios.get<ApiEnvelope<Supplier[]>>(apiUrl, { headers });
      const nextRows = Array.isArray(resp.data?.data) ? resp.data.data : [];
      setRows(nextRows);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to load suppliers'));
      }
    } finally {
      setLoading(false);
    }
  }, [apiUrl, navigate, withAuth]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) => {
      return (
        String(row.ID_SUPPLIER).includes(q) ||
        (row.NAME || '').toLowerCase().includes(q) ||
        (row.SUPPLIER_TYPE || '').toLowerCase().includes(q) ||
        (row.CONTACT_PERSON || '').toLowerCase().includes(q) ||
        (row.PHONE || '').toLowerCase().includes(q) ||
        (row.EMAIL || '').toLowerCase().includes(q) ||
        (row.ADDRESS || '').toLowerCase().includes(q) ||
        (row.STATUS || '').toLowerCase().includes(q)
      );
    });
  }, [query, rows]);

  const columns = useMemo<MRT_ColumnDef<Supplier>[]>(
    () => [
      { accessorKey: 'ID_SUPPLIER', header: 'ID', size: 60 },
      { accessorKey: 'NAME', header: 'Name', size: 170 },
      { accessorKey: 'SUPPLIER_TYPE', header: 'Type', size: 140 },
      { accessorKey: 'CONTACT_PERSON', header: 'Contact Person', size: 160 },
      { accessorKey: 'PHONE', header: 'Phone', size: 130 },
      { accessorKey: 'EMAIL', header: 'Email', size: 190 },
      { accessorKey: 'ADDRESS', header: 'Address', size: 200 },
      { accessorKey: 'STATUS', header: 'Status', size: 110 },
    ],
    []
  );

  const openCreate = () => {
    setEditSupplier(defaultEditSupplier());
    setEditOpen(true);
  };

  const openEdit = (row: Supplier) => {
    setEditSupplier({
      idSupplier: row.ID_SUPPLIER,
      name: row.NAME || '',
      supplierType: row.SUPPLIER_TYPE || '',
      contactPerson: row.CONTACT_PERSON || '',
      phone: row.PHONE || '',
      email: row.EMAIL || '',
      address: row.ADDRESS || '',
      status: row.STATUS || 'Active',
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditSupplier(null);
  };

  const saveSupplier = async () => {
    if (!editSupplier) return;

    const headers = withAuth();
    if (!headers) return;

    const payload = {
      name: editSupplier.name.trim(),
      supplierType: editSupplier.supplierType.trim() || null,
      contactPerson: editSupplier.contactPerson.trim() || null,
      phone: editSupplier.phone.trim() || null,
      email: editSupplier.email.trim() || null,
      address: editSupplier.address.trim() || null,
      status: editSupplier.status,
    };

    try {
      if (editSupplier.idSupplier) {
        await axios.put(`${apiUrl}/${editSupplier.idSupplier}`, payload, { headers });
      } else {
        await axios.post(apiUrl, payload, { headers });
      }
      closeEdit();
      await fetchRows();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to save supplier'));
      }
    }
  };

  const deleteSupplier = async (supplier: Supplier) => {
    const headers = withAuth();
    if (!headers) return;

    const ok = window.confirm(`Delete supplier ${supplier.NAME}?`);
    if (!ok) return;

    try {
      await axios.delete(`${apiUrl}/${supplier.ID_SUPPLIER}`, { headers });
      await fetchRows();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to delete supplier'));
      }
    }
  };

  const canSave =
    !!editSupplier &&
    !!editSupplier.name.trim() &&
    SUPPLIER_STATUSES.includes(editSupplier.status) &&
    (editSupplier.supplierType.trim() === '' || SUPPLIER_TYPES.includes(editSupplier.supplierType));

  const table = useMaterialReactTable({
    columns,
    data: filteredRows,
    state: { isLoading: loading, density: 'comfortable' },
    enableDensityToggle: true,
    enableGlobalFilter: false,
    enableRowActions: true,
    positionActionsColumn: 'last',
    displayColumnDefOptions: {
      'mrt-row-actions': {
        header: t('common.actions'),
      },
    },
    localization: (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase().startsWith('ar')
      ? (MRT_Localization_AR as unknown as undefined)
      : undefined,
    renderRowActions: ({ row }) => (
      <Stack direction="row" spacing={1}>
        <IconButton title={t('common.edit')} onClick={() => openEdit(row.original)}>
          <EditIcon />
        </IconButton>
        <IconButton title={t('common.delete')} onClick={() => void deleteSupplier(row.original)}>
          <DeleteIcon />
        </IconButton>
      </Stack>
    ),
  });

  return (
    <Box p={2}>
      <Card elevation={3}>
        <CardHeader
          title={
            <Stack direction="row" spacing={1.5} alignItems="center">
              <StoreIcon />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {t('nav.fleetSuppliers')}
              </Typography>
            </Stack>
          }
          subheader="Manage supplier master data for fleet operations"
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => (onBack ? onBack() : window.history.back())}
              >
                {t('common.back')}
              </Button>

              <TextField
                size="small"
                placeholder="Search suppliers"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                }}
                sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
              />

              <IconButton aria-label="refresh" onClick={() => void fetchRows()}>
                <RefreshIcon />
              </IconButton>

              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                {t('common.add')}
              </Button>
            </Stack>
          }
        />

        <CardContent>
          <MaterialReactTable table={table} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>{editSupplier?.idSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
        <DialogContent dividers>
          {editSupplier && (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <TextField
                label="Name"
                value={editSupplier.name}
                onChange={(e) => setEditSupplier((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                required
                fullWidth
              />

              <TextField
                label="Supplier Type"
                select
                value={editSupplier.supplierType}
                onChange={(e) => setEditSupplier((prev) => (prev ? { ...prev, supplierType: e.target.value } : prev))}
                fullWidth
              >
                <MenuItem value="">None</MenuItem>
                {SUPPLIER_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Contact Person"
                value={editSupplier.contactPerson}
                onChange={(e) =>
                  setEditSupplier((prev) => (prev ? { ...prev, contactPerson: e.target.value } : prev))
                }
                fullWidth
              />

              <TextField
                label="Phone"
                value={editSupplier.phone}
                onChange={(e) => setEditSupplier((prev) => (prev ? { ...prev, phone: e.target.value } : prev))}
                fullWidth
              />

              <TextField
                label="Email"
                value={editSupplier.email}
                onChange={(e) => setEditSupplier((prev) => (prev ? { ...prev, email: e.target.value } : prev))}
                fullWidth
              />

              <TextField
                label="Address"
                value={editSupplier.address}
                onChange={(e) => setEditSupplier((prev) => (prev ? { ...prev, address: e.target.value } : prev))}
                fullWidth
                multiline
                minRows={2}
              />

              <TextField
                label="Status"
                select
                value={editSupplier.status}
                onChange={(e) => setEditSupplier((prev) => (prev ? { ...prev, status: e.target.value } : prev))}
                fullWidth
              >
                {SUPPLIER_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} color="secondary">
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void saveSupplier()} variant="contained" disabled={!canSave}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuppliersPage;
