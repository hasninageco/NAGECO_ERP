import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../../utils/api';
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
  Checkbox,
  Fade,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InsuranceHeaderTitle from './InsuranceHeaderTitle';
import { useTranslation } from 'react-i18next';

type Provider = {
  ProviderId: number;
  ProviderCode: string;
  ProviderName: string;
  ProviderType: string;
  City?: string | null;
  Address?: string | null;
  Phone?: string | null;
  IsActive: boolean;
};

type EditProvider = Partial<Provider>;

const toBoolean = (value: unknown): boolean => {
  if (value === true) return true;
  if (value === false) return false;
  if (value === 1 || value === '1') return true;
  if (value === 0 || value === '0') return false;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true' || v === 'yes' || v === 'y') return true;
    if (v === 'false' || v === 'no' || v === 'n') return false;
  }
  return Boolean(value);
};

type Props = {
  onBack?: () => void;
};

const ProvidersPage: React.FC<Props> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<EditProvider | null>(null);

  const navigate = useNavigate();
  const apiUrl = buildApiUrl('/medicalInsurance/providers');

  const withAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  const fetchData = async () => {
    const headers = withAuth();
    if (!headers) {
      setError(t('insurance.providers.notLoggedIn'));
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const resp = await axios.get<Provider[]>(`${apiUrl}/all`, { headers });
      const rows: any[] = (resp.data as any[]) || [];
      setData(
        rows.map((p) => ({
          ...p,
          IsActive: toBoolean(p.IsActive),
        }))
      );
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError(t('insurance.providers.sessionExpired'));
      } else {
        setError(t('insurance.providers.errorLoad'));
        console.error('Error fetching providers', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredData = useMemo(() => {
    if (!query) return data;
    const q = query.toLowerCase();
    return data.filter((p) =>
      String(p.ProviderId).includes(q) ||
      (p.ProviderCode || '').toLowerCase().includes(q) ||
      (p.ProviderName || '').toLowerCase().includes(q) ||
      (p.ProviderType || '').toLowerCase().includes(q) ||
      (p.City || '').toLowerCase().includes(q) ||
      (p.Phone || '').toLowerCase().includes(q) ||
      (p.Address || '').toLowerCase().includes(q)
    );
  }, [data, query]);

  const columns = useMemo<MRT_ColumnDef<Provider>[]>(
    () => [
      { accessorKey: 'ProviderId', header: t('insurance.providers.cols.id'), size: 60 },
      { accessorKey: 'ProviderCode', header: t('insurance.providers.cols.code'), size: 110 },
      { accessorKey: 'ProviderName', header: t('insurance.providers.cols.name'), size: 260 },
      { accessorKey: 'ProviderType', header: t('insurance.providers.cols.type'), size: 140 },
      { accessorKey: 'City', header: t('insurance.providers.cols.city'), size: 140 },
      { accessorKey: 'Phone', header: t('insurance.providers.cols.phone'), size: 140 },
      {
        accessorKey: 'IsActive',
        header: t('insurance.providers.cols.active'),
        size: 80,
        Cell: ({ cell }) => (
          <Fade in key={toBoolean(cell.getValue()) ? 'active' : 'stopped'} timeout={250}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              {toBoolean(cell.getValue()) ? (
                <CheckCircleIcon color="success" fontSize="small" />
              ) : (
                <StopCircleIcon color="error" fontSize="small" />
              )}
            </Box>
          </Fade>
        ),
      },
      { accessorKey: 'Address', header: t('insurance.providers.fields.address'), size: 260 },
    ],
    [t]
  );

  const openAdd = () => {
    setEditProvider({
      ProviderCode: '',
      ProviderName: '',
      ProviderType: '',
      City: '',
      Address: '',
      Phone: '',
      IsActive: true,
    });
    setEditOpen(true);
  };

  const openEdit = (provider: Provider) => {
    setEditProvider({ ...provider });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditProvider(null);
  };

  const save = async () => {
    const headers = withAuth();
    if (!headers) return;
    if (!editProvider) return;

    const payload = {
      ProviderCode: editProvider.ProviderCode?.trim() ? editProvider.ProviderCode.trim() : undefined,
      ProviderName: editProvider.ProviderName,
      ProviderType: editProvider.ProviderType,
      City: editProvider.City,
      Address: editProvider.Address,
      Phone: editProvider.Phone,
      IsActive: editProvider.IsActive,
    };

    try {
      if (editProvider.ProviderId) {
        await axios.put(`${apiUrl}/Update/${editProvider.ProviderId}`, payload, { headers });
      } else {
        await axios.post(`${apiUrl}/Add`, payload, { headers });
      }
      closeEdit();
      await fetchData();
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/');
      else {
        console.error('Error saving provider', err);
        alert(t('insurance.providers.failedSave'));
      }
    }
  };

  const remove = async (provider: Provider) => {
    const headers = withAuth();
    if (!headers) return;
    const ok = window.confirm(
      t('insurance.providers.confirmDelete', {
        code: provider.ProviderCode,
        name: provider.ProviderName,
      })
    );
    if (!ok) return;

    try {
      await axios.delete(`${apiUrl}/Delete/${provider.ProviderId}`, { headers });
      await fetchData();
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/');
      else {
        console.error('Error deleting provider', err);
        alert(t('insurance.providers.failedDelete'));
      }
    }
  };

  const table = useMaterialReactTable({
    columns,
    data: filteredData,
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
      ? (MRT_Localization_AR as any)
      : undefined,
    renderRowActions: ({ row }: any) => (
      <Stack direction="row" spacing={1}>
        <IconButton title={t('common.edit')} onClick={() => openEdit(row.original)}>
          <EditIcon />
        </IconButton>
        <IconButton title={t('common.delete')} onClick={() => remove(row.original)}>
          <DeleteIcon />
        </IconButton>
      </Stack>
    ),
  });

  const canSave = !!editProvider && !!String(editProvider.ProviderName ?? '').trim();

  return (
    <Box p={2}>
      <Card elevation={3}>
        <CardHeader
          title={<InsuranceHeaderTitle title={t('insurance.providers.pageTitle')} />}
          subheader={t('insurance.providers.subheader')}
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
                placeholder={t('insurance.providers.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                }}
                sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
              />
              <IconButton aria-label="refresh" onClick={() => fetchData()}>
                <RefreshIcon />
              </IconButton>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
                {t('insurance.providers.newProvider')}
              </Button>
            </Stack>
          }
        />
        <CardContent>
          {error ? (
            <Box sx={{ p: 2, color: 'error.main' }}>{error}</Box>
          ) : null}
          <MaterialReactTable table={table} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>
          {editProvider?.ProviderId ? t('insurance.providers.editProvider') : t('insurance.providers.newProvider')}
        </DialogTitle>
        <DialogContent dividers>
          {editProvider && (
            <div style={{ display: 'grid', gap: 12 }}>
              <TextField
                label={t('insurance.providers.fields.providerCode')}
                value={editProvider.ProviderCode ?? ''}
                onChange={(e) => setEditProvider((p) => ({ ...(p ?? {}), ProviderCode: e.target.value }))}
                helperText={
                  editProvider?.ProviderId
                    ? t('insurance.providers.helper.autoCodeReadonly')
                    : t('insurance.providers.helper.autoGeneratedAfterSave')
                }
                disabled
                fullWidth
              />
              <TextField
                label={t('insurance.providers.fields.providerName')}
                value={editProvider.ProviderName ?? ''}
                onChange={(e) => setEditProvider((p) => ({ ...(p ?? {}), ProviderName: e.target.value }))}
                required
                fullWidth
              />
              <TextField
                label={t('insurance.providers.fields.providerType')}
                value={editProvider.ProviderType ?? ''}
                onChange={(e) => setEditProvider((p) => ({ ...(p ?? {}), ProviderType: e.target.value }))}
                select
                helperText={t('insurance.providers.helper.typeOptionalDefault')}
                fullWidth
              >
                <MenuItem value="">{t('insurance.providers.helper.typeAuto')}</MenuItem>
                <MenuItem value="مصحة">مصحة</MenuItem>
                <MenuItem value="مستشفى">مستشفى</MenuItem>
                <MenuItem value="عيادة">عيادة</MenuItem>
                <MenuItem value="صيدلية">صيدلية</MenuItem>
                <MenuItem value="مختبر">مختبر</MenuItem>
              </TextField>
              <TextField
                label={t('insurance.providers.fields.city')}
                value={editProvider.City ?? ''}
                onChange={(e) => setEditProvider((p) => ({ ...(p ?? {}), City: e.target.value }))}
                fullWidth
              />
              <TextField
                label={t('insurance.providers.fields.phone')}
                value={editProvider.Phone ?? ''}
                onChange={(e) => setEditProvider((p) => ({ ...(p ?? {}), Phone: e.target.value }))}
                fullWidth
              />
              <TextField
                label={t('insurance.providers.fields.address')}
                value={editProvider.Address ?? ''}
                onChange={(e) => setEditProvider((p) => ({ ...(p ?? {}), Address: e.target.value }))}
                fullWidth
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!editProvider.IsActive}
                    onChange={(e) => setEditProvider((p) => ({ ...(p ?? {}), IsActive: e.target.checked }))}
                  />
                }
                label={t('insurance.providers.cols.active')}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} color="secondary">
            {t('common.cancel')}
          </Button>
          <Button onClick={save} variant="contained" disabled={!canSave}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProvidersPage;
