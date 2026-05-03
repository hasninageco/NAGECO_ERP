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
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
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

type FleetDocument = {
  ID_DOCUMENT: number;
  RELATED_TYPE: string;
  RELATED_ID: number;
  ID_VEHICLE?: number | null;
  ID_EMP?: string | null;
  DOCUMENT_TYPE?: string | null;
  FILE_NAME: string;
  FILE_PATH: string;
  START_DATE?: string | null;
  END_DATE?: string | null;
  UPLOADED_BY?: string | null;
};

type VehicleOption = {
  ID_VEHICLE: number;
  PLATE_NUMBER: string;
};

type EditDocument = {
  idDocument?: number;
  relatedType: string;
  relatedId: number | '';
  idVehicle: number | '';
  idEmp: string;
  documentType: string;
  fileName: string;
  filePath: string;
  startDate: string;
  endDate: string;
  uploadedBy: string;
};

const RELATED_TYPES = ['Vehicle', 'Vehicle Insurance', 'Maintenance', 'Trip', 'Employee'];

const toDateInput = (value?: string | null): string => {
  if (!value) return '';
  return String(value).slice(0, 10);
};

const defaultEditDocument = (): EditDocument => ({
  relatedType: 'Vehicle',
  relatedId: '',
  idVehicle: '',
  idEmp: '',
  documentType: '',
  fileName: '',
  filePath: '',
  startDate: '',
  endDate: '',
  uploadedBy: '',
});

const DocumentsPage: React.FC<Props> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const apiUrl = buildApiUrl('/fleet/documents');
  const vehiclesApiUrl = buildApiUrl('/fleet/vehicles');

  const [rows, setRows] = useState<FleetDocument[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>('');
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editDocument, setEditDocument] = useState<EditDocument | null>(null);

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
        const msg = apiErrors
          .map((e) => e.message)
          .filter(Boolean)
          .join('\n');
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
      const [docsResp, vehiclesResp] = await Promise.all([
        axios.get<ApiEnvelope<FleetDocument[]>>(apiUrl, { headers }),
        axios.get<ApiEnvelope<VehicleOption[]>>(vehiclesApiUrl, { headers }),
      ]);

      setRows(Array.isArray(docsResp.data?.data) ? docsResp.data.data : []);
      setVehicles(Array.isArray(vehiclesResp.data?.data) ? vehiclesResp.data.data : []);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to load documents'));
      }
    } finally {
      setLoading(false);
    }
  }, [apiUrl, navigate, vehiclesApiUrl, withAuth]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const getVehicleLabel = useCallback(
    (idVehicle?: number | null) => {
      if (!idVehicle) return '-';
      const found = vehicles.find((v) => v.ID_VEHICLE === idVehicle);
      if (!found) return String(idVehicle);
      return `${found.ID_VEHICLE} - ${found.PLATE_NUMBER}`;
    },
    [vehicles]
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) => {
      return (
        String(row.ID_DOCUMENT).includes(q) ||
        String(row.RELATED_TYPE || '').toLowerCase().includes(q) ||
        String(row.RELATED_ID || '').includes(q) ||
        String(row.ID_VEHICLE || '').includes(q) ||
        String(row.ID_EMP || '').toLowerCase().includes(q) ||
        String(row.DOCUMENT_TYPE || '').toLowerCase().includes(q) ||
        String(row.FILE_NAME || '').toLowerCase().includes(q) ||
        String(row.FILE_PATH || '').toLowerCase().includes(q) ||
        String(row.UPLOADED_BY || '').toLowerCase().includes(q)
      );
    });
  }, [query, rows]);

  const columns = useMemo<MRT_ColumnDef<FleetDocument>[]>(
    () => [
      { accessorKey: 'ID_DOCUMENT', header: 'ID', size: 70 },
      { accessorKey: 'RELATED_TYPE', header: 'Related Type', size: 130 },
      { accessorKey: 'RELATED_ID', header: 'Related ID', size: 90 },
      {
        accessorKey: 'ID_VEHICLE',
        header: 'Vehicle',
        size: 180,
        Cell: ({ row }) => getVehicleLabel(row.original.ID_VEHICLE),
      },
      { accessorKey: 'ID_EMP', header: 'Employee Ref', size: 120 },
      { accessorKey: 'DOCUMENT_TYPE', header: 'Document Type', size: 130 },
      { accessorKey: 'FILE_NAME', header: 'File Name', size: 160 },
      { accessorKey: 'FILE_PATH', header: 'File Path', size: 220 },
      { accessorKey: 'START_DATE', header: 'Start Date', size: 120 },
      { accessorKey: 'END_DATE', header: 'End Date', size: 120 },
      { accessorKey: 'UPLOADED_BY', header: 'Uploaded By', size: 120 },
    ],
    [getVehicleLabel]
  );

  const openCreate = () => {
    setEditDocument(defaultEditDocument());
    setEditOpen(true);
  };

  const openEdit = (row: FleetDocument) => {
    setEditDocument({
      idDocument: row.ID_DOCUMENT,
      relatedType: row.RELATED_TYPE || 'Vehicle',
      relatedId: row.RELATED_ID,
      idVehicle: row.ID_VEHICLE ?? '',
      idEmp: row.ID_EMP || '',
      documentType: row.DOCUMENT_TYPE || '',
      fileName: row.FILE_NAME || '',
      filePath: row.FILE_PATH || '',
      startDate: toDateInput(row.START_DATE),
      endDate: toDateInput(row.END_DATE),
      uploadedBy: row.UPLOADED_BY || '',
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditDocument(null);
  };

  const saveDocument = async () => {
    if (!editDocument) return;

    const headers = withAuth();
    if (!headers) return;

    const payload = {
      relatedType: editDocument.relatedType,
      relatedId: Number(editDocument.relatedId),
      idVehicle: editDocument.idVehicle === '' ? null : Number(editDocument.idVehicle),
      idEmp: editDocument.idEmp.trim() || null,
      documentType: editDocument.documentType.trim() || null,
      fileName: editDocument.fileName.trim(),
      filePath: editDocument.filePath.trim(),
      startDate: editDocument.startDate || null,
      endDate: editDocument.endDate || null,
      uploadedBy: editDocument.uploadedBy.trim() || null,
    };

    try {
      if (editDocument.idDocument) {
        await axios.put(`${apiUrl}/${editDocument.idDocument}`, payload, { headers });
      } else {
        await axios.post(apiUrl, payload, { headers });
      }
      closeEdit();
      await fetchRows();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to save document'));
      }
    }
  };

  const deleteDocument = async (row: FleetDocument) => {
    const headers = withAuth();
    if (!headers) return;

    const ok = window.confirm(`Delete document ${row.FILE_NAME}?`);
    if (!ok) return;

    try {
      await axios.delete(`${apiUrl}/${row.ID_DOCUMENT}`, { headers });
      await fetchRows();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to delete document'));
      }
    }
  };

  const canSave = useMemo(() => {
    if (!editDocument) return false;

    if (!RELATED_TYPES.includes(editDocument.relatedType)) return false;
    if (editDocument.relatedId === '' || Number(editDocument.relatedId) <= 0) return false;
    if (!editDocument.fileName.trim() || !editDocument.filePath.trim()) return false;
    if (editDocument.idEmp.trim().length > 100) return false;
    if (editDocument.uploadedBy.trim().length > 100) return false;

    if (editDocument.startDate && editDocument.endDate) {
      const startDate = new Date(editDocument.startDate);
      const endDate = new Date(editDocument.endDate);
      if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate < startDate) {
        return false;
      }
    }

    return true;
  }, [editDocument]);

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
      <Stack direction="row" spacing={0.5}>
        <IconButton title={t('common.edit')} onClick={() => openEdit(row.original)}>
          <EditIcon />
        </IconButton>
        <IconButton title={t('common.delete')} onClick={() => void deleteDocument(row.original)}>
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
              <DescriptionIcon />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {t('nav.fleetDocuments')}
              </Typography>
            </Stack>
          }
          subheader="Manage fleet documents and expiry details"
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
                placeholder="Search documents"
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

      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="md">
        <DialogTitle>{editDocument?.idDocument ? 'Edit Document' : 'Add Document'}</DialogTitle>
        <DialogContent dividers>
          {editDocument && (
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              <TextField
                label="Related Type"
                select
                value={editDocument.relatedType}
                onChange={(e) => setEditDocument((prev) => (prev ? { ...prev, relatedType: e.target.value } : prev))}
                required
                fullWidth
              >
                {RELATED_TYPES.map((relatedType) => (
                  <MenuItem key={relatedType} value={relatedType}>
                    {relatedType}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Related ID"
                type="number"
                value={editDocument.relatedId}
                onChange={(e) =>
                  setEditDocument((prev) =>
                    prev
                      ? {
                          ...prev,
                          relatedId: e.target.value === '' ? '' : Number(e.target.value),
                        }
                      : prev
                  )
                }
                required
                fullWidth
              />

              <TextField
                label="Vehicle"
                select
                value={editDocument.idVehicle}
                onChange={(e) =>
                  setEditDocument((prev) =>
                    prev
                      ? {
                          ...prev,
                          idVehicle: e.target.value === '' ? '' : Number(e.target.value),
                        }
                      : prev
                  )
                }
                fullWidth
              >
                <MenuItem value="">None</MenuItem>
                {vehicles.map((v) => (
                  <MenuItem key={v.ID_VEHICLE} value={v.ID_VEHICLE}>
                    {v.ID_VEHICLE} - {v.PLATE_NUMBER}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Employee Ref (Name/Ref)"
                value={editDocument.idEmp}
                onChange={(e) => setEditDocument((prev) => (prev ? { ...prev, idEmp: e.target.value } : prev))}
                fullWidth
              />

              <TextField
                label="Document Type"
                value={editDocument.documentType}
                onChange={(e) => setEditDocument((prev) => (prev ? { ...prev, documentType: e.target.value } : prev))}
                fullWidth
              />

              <TextField
                label="Uploaded By (Name/Ref)"
                value={editDocument.uploadedBy}
                onChange={(e) => setEditDocument((prev) => (prev ? { ...prev, uploadedBy: e.target.value } : prev))}
                fullWidth
              />

              <TextField
                label="File Name"
                value={editDocument.fileName}
                onChange={(e) => setEditDocument((prev) => (prev ? { ...prev, fileName: e.target.value } : prev))}
                required
                fullWidth
              />

              <TextField
                label="File Path"
                value={editDocument.filePath}
                onChange={(e) => setEditDocument((prev) => (prev ? { ...prev, filePath: e.target.value } : prev))}
                required
                fullWidth
              />

              <TextField
                label="Start Date"
                type="date"
                value={editDocument.startDate}
                onChange={(e) => setEditDocument((prev) => (prev ? { ...prev, startDate: e.target.value } : prev))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="End Date"
                type="date"
                value={editDocument.endDate}
                onChange={(e) => setEditDocument((prev) => (prev ? { ...prev, endDate: e.target.value } : prev))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} color="secondary">
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void saveDocument()} variant="contained" disabled={!canSave}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentsPage;