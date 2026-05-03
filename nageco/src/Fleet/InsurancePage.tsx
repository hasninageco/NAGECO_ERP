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
import EditIcon from '@mui/icons-material/Edit';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
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

type Insurance = {
  ID_INSURANCE: number;
  ID_VEHICLE: number;
  ID_SUPPLIER?: number | null;
  POLICY_NUMBER?: string | null;
  INSURANCE_TYPE?: string | null;
  START_DATE?: string | null;
  END_DATE?: string | null;
  PREMIUM_AMOUNT?: number | null;
  INSURED_VALUE?: number | null;
  PAYMENT_STATUS?: string | null;
  COVERAGE_DETAILS?: string | null;
  DOCUMENT_FILE?: string | null;
  STATUS: string;
};

type VehicleOption = {
  ID_VEHICLE: number;
  PLATE_NUMBER: string;
};

type SupplierOption = {
  ID_SUPPLIER: number;
  NAME: string;
};

type EditInsurance = {
  idInsurance?: number;
  idVehicle: number | '';
  idSupplier: number | '';
  policyNumber: string;
  insuranceType: string;
  startDate: string;
  endDate: string;
  premiumAmount: number | '';
  insuredValue: number | '';
  paymentStatus: string;
  coverageDetails: string;
  documentFile: string;
  status: string;
};

const INSURANCE_STATUSES = ['Active', 'Expired', 'Cancelled', 'Renewed'];

const toDateInput = (value?: string | null): string => {
  if (!value) return '';
  return String(value).slice(0, 10);
};

const toPickerDate = (value: string): Dayjs | null => {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

const fromPickerDate = (value: Dayjs | null): string => {
  if (!value || !value.isValid()) return '';
  return value.format('YYYY-MM-DD');
};

const defaultEditInsurance = (): EditInsurance => ({
  idVehicle: '',
  idSupplier: '',
  policyNumber: '',
  insuranceType: '',
  startDate: '',
  endDate: '',
  premiumAmount: '',
  insuredValue: '',
  paymentStatus: '',
  coverageDetails: '',
  documentFile: '',
  status: 'Active',
});

const InsurancePage: React.FC<Props> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const apiUrl = buildApiUrl('/fleet/insurance');
  const vehiclesApiUrl = buildApiUrl('/fleet/vehicles');
  const suppliersApiUrl = buildApiUrl('/fleet/suppliers');

  const [rows, setRows] = useState<Insurance[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>('');
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editInsurance, setEditInsurance] = useState<EditInsurance | null>(null);

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
      const [insuranceResp, vehiclesResp, suppliersResp] = await Promise.all([
        axios.get<ApiEnvelope<Insurance[]>>(apiUrl, { headers }),
        axios.get<ApiEnvelope<VehicleOption[]>>(vehiclesApiUrl, { headers }),
        axios.get<ApiEnvelope<SupplierOption[]>>(suppliersApiUrl, { headers }),
      ]);

      setRows(Array.isArray(insuranceResp.data?.data) ? insuranceResp.data.data : []);
      setVehicles(Array.isArray(vehiclesResp.data?.data) ? vehiclesResp.data.data : []);
      setSuppliers(Array.isArray(suppliersResp.data?.data) ? suppliersResp.data.data : []);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to load insurance data'));
      }
    } finally {
      setLoading(false);
    }
  }, [apiUrl, navigate, suppliersApiUrl, vehiclesApiUrl, withAuth]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const getVehicleLabel = useCallback(
    (idVehicle: number) => {
      const found = vehicles.find((v) => v.ID_VEHICLE === idVehicle);
      if (!found) return String(idVehicle);
      return `${found.ID_VEHICLE} - ${found.PLATE_NUMBER}`;
    },
    [vehicles]
  );

  const getSupplierLabel = useCallback(
    (idSupplier?: number | null) => {
      if (!idSupplier) return '-';
      const found = suppliers.find((s) => s.ID_SUPPLIER === idSupplier);
      if (!found) return String(idSupplier);
      return `${found.ID_SUPPLIER} - ${found.NAME}`;
    },
    [suppliers]
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) => {
      return (
        String(row.ID_INSURANCE).includes(q) ||
        String(row.ID_VEHICLE).includes(q) ||
        String(row.ID_SUPPLIER ?? '').includes(q) ||
        String(row.POLICY_NUMBER || '').toLowerCase().includes(q) ||
        String(row.INSURANCE_TYPE || '').toLowerCase().includes(q) ||
        String(row.STATUS || '').toLowerCase().includes(q)
      );
    });
  }, [query, rows]);

  const columns = useMemo<MRT_ColumnDef<Insurance>[]>(
    () => [
      { accessorKey: 'ID_INSURANCE', header: 'ID', size: 70 },
      {
        accessorKey: 'ID_VEHICLE',
        header: 'Vehicle',
        size: 190,
        Cell: ({ row }) => getVehicleLabel(row.original.ID_VEHICLE),
      },
      {
        accessorKey: 'ID_SUPPLIER',
        header: 'Supplier',
        size: 190,
        Cell: ({ row }) => getSupplierLabel(row.original.ID_SUPPLIER),
      },
      { accessorKey: 'POLICY_NUMBER', header: 'Policy Number', size: 150 },
      { accessorKey: 'INSURANCE_TYPE', header: 'Insurance Type', size: 140 },
      { accessorKey: 'START_DATE', header: 'Start Date', size: 120 },
      { accessorKey: 'END_DATE', header: 'End Date', size: 120 },
      { accessorKey: 'PREMIUM_AMOUNT', header: 'Premium', size: 110 },
      { accessorKey: 'INSURED_VALUE', header: 'Insured Value', size: 130 },
      { accessorKey: 'STATUS', header: 'Status', size: 120 },
    ],
    [getSupplierLabel, getVehicleLabel]
  );

  const openCreate = () => {
    setEditInsurance(defaultEditInsurance());
    setEditOpen(true);
  };

  const openEdit = (row: Insurance) => {
    setEditInsurance({
      idInsurance: row.ID_INSURANCE,
      idVehicle: row.ID_VEHICLE,
      idSupplier: row.ID_SUPPLIER ?? '',
      policyNumber: row.POLICY_NUMBER || '',
      insuranceType: row.INSURANCE_TYPE || '',
      startDate: toDateInput(row.START_DATE),
      endDate: toDateInput(row.END_DATE),
      premiumAmount: row.PREMIUM_AMOUNT ?? '',
      insuredValue: row.INSURED_VALUE ?? '',
      paymentStatus: row.PAYMENT_STATUS || '',
      coverageDetails: row.COVERAGE_DETAILS || '',
      documentFile: row.DOCUMENT_FILE || '',
      status: row.STATUS || 'Active',
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditInsurance(null);
  };

  const saveInsurance = async () => {
    if (!editInsurance) return;

    const headers = withAuth();
    if (!headers) return;

    const payload = {
      idVehicle: Number(editInsurance.idVehicle),
      idSupplier: editInsurance.idSupplier === '' ? null : Number(editInsurance.idSupplier),
      policyNumber: editInsurance.policyNumber.trim() || null,
      insuranceType: editInsurance.insuranceType.trim() || null,
      startDate: editInsurance.startDate || null,
      endDate: editInsurance.endDate || null,
      premiumAmount: editInsurance.premiumAmount === '' ? null : Number(editInsurance.premiumAmount),
      insuredValue: editInsurance.insuredValue === '' ? null : Number(editInsurance.insuredValue),
      paymentStatus: editInsurance.paymentStatus.trim() || null,
      coverageDetails: editInsurance.coverageDetails.trim() || null,
      documentFile: editInsurance.documentFile.trim() || null,
      status: editInsurance.status,
    };

    try {
      if (editInsurance.idInsurance) {
        await axios.put(`${apiUrl}/${editInsurance.idInsurance}`, payload, { headers });
      } else {
        await axios.post(apiUrl, payload, { headers });
      }
      closeEdit();
      await fetchRows();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to save insurance'));
      }
    }
  };

  const canSave = useMemo(() => {
    if (!editInsurance) return false;

    if (editInsurance.idVehicle === '' || Number(editInsurance.idVehicle) <= 0) return false;
    if (!editInsurance.startDate || !editInsurance.endDate) return false;
    if (!INSURANCE_STATUSES.includes(editInsurance.status)) return false;

    const startDate = new Date(editInsurance.startDate);
    const endDate = new Date(editInsurance.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return false;
    if (endDate.getTime() < startDate.getTime()) return false;

    return true;
  }, [editInsurance]);

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
      </Stack>
    ),
  });

  return (
    <Box p={2}>
      <Card elevation={3}>
        <CardHeader
          title={
            <Stack direction="row" spacing={1.5} alignItems="center">
              <LocalHospitalIcon />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {t('nav.fleetInsurance')}
              </Typography>
            </Stack>
          }
          subheader="Manage vehicle insurance policies"
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
                placeholder="Search insurance"
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
        <DialogTitle>{editInsurance?.idInsurance ? 'Edit Insurance' : 'Add Insurance'}</DialogTitle>
        <DialogContent dividers>
          {editInsurance && (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                <TextField
                  label="Vehicle"
                  select
                  value={editInsurance.idVehicle}
                  onChange={(e) =>
                    setEditInsurance((prev) =>
                      prev
                        ? {
                            ...prev,
                            idVehicle: e.target.value === '' ? '' : Number(e.target.value),
                          }
                        : prev
                    )
                  }
                  required
                  fullWidth
                >
                  {vehicles.map((v) => (
                    <MenuItem key={v.ID_VEHICLE} value={v.ID_VEHICLE}>
                      {v.ID_VEHICLE} - {v.PLATE_NUMBER}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Supplier"
                  select
                  value={editInsurance.idSupplier}
                  onChange={(e) =>
                    setEditInsurance((prev) =>
                      prev
                        ? {
                            ...prev,
                            idSupplier: e.target.value === '' ? '' : Number(e.target.value),
                          }
                        : prev
                    )
                  }
                  fullWidth
                >
                  <MenuItem value="">None</MenuItem>
                  {suppliers.map((s) => (
                    <MenuItem key={s.ID_SUPPLIER} value={s.ID_SUPPLIER}>
                      {s.ID_SUPPLIER} - {s.NAME}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Policy Number"
                  value={editInsurance.policyNumber}
                  onChange={(e) =>
                    setEditInsurance((prev) => (prev ? { ...prev, policyNumber: e.target.value } : prev))
                  }
                  fullWidth
                />

                <TextField
                  label="Insurance Type"
                  value={editInsurance.insuranceType}
                  onChange={(e) =>
                    setEditInsurance((prev) => (prev ? { ...prev, insuranceType: e.target.value } : prev))
                  }
                  fullWidth
                />

                <DatePicker
                  label="Start Date"
                  format="DD-MM-YYYY"
                  value={toPickerDate(editInsurance.startDate)}
                  onChange={(value) =>
                    setEditInsurance((prev) =>
                      prev ? { ...prev, startDate: fromPickerDate(value) } : prev
                    )
                  }
                  slotProps={{
                    textField: {
                      required: true,
                      fullWidth: true,
                    },
                  }}
                />

                <DatePicker
                  label="End Date"
                  format="DD-MM-YYYY"
                  value={toPickerDate(editInsurance.endDate)}
                  onChange={(value) =>
                    setEditInsurance((prev) =>
                      prev ? { ...prev, endDate: fromPickerDate(value) } : prev
                    )
                  }
                  minDate={toPickerDate(editInsurance.startDate) || undefined}
                  slotProps={{
                    textField: {
                      required: true,
                      fullWidth: true,
                    },
                  }}
                />

                <TextField
                  label="Premium Amount"
                  type="number"
                  value={editInsurance.premiumAmount}
                  onChange={(e) =>
                    setEditInsurance((prev) =>
                      prev
                        ? {
                            ...prev,
                            premiumAmount: e.target.value === '' ? '' : Number(e.target.value),
                          }
                        : prev
                    )
                  }
                  fullWidth
                />

                <TextField
                  label="Insured Value"
                  type="number"
                  value={editInsurance.insuredValue}
                  onChange={(e) =>
                    setEditInsurance((prev) =>
                      prev
                        ? {
                            ...prev,
                            insuredValue: e.target.value === '' ? '' : Number(e.target.value),
                          }
                        : prev
                    )
                  }
                  fullWidth
                />

                <TextField
                  label="Payment Status"
                  value={editInsurance.paymentStatus}
                  onChange={(e) =>
                    setEditInsurance((prev) => (prev ? { ...prev, paymentStatus: e.target.value } : prev))
                  }
                  fullWidth
                />

                <TextField
                  label="Status"
                  select
                  value={editInsurance.status}
                  onChange={(e) =>
                    setEditInsurance((prev) => (prev ? { ...prev, status: e.target.value } : prev))
                  }
                  fullWidth
                >
                  {INSURANCE_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Document File"
                  value={editInsurance.documentFile}
                  onChange={(e) =>
                    setEditInsurance((prev) => (prev ? { ...prev, documentFile: e.target.value } : prev))
                  }
                  fullWidth
                />

                <TextField
                  label="Coverage Details"
                  value={editInsurance.coverageDetails}
                  onChange={(e) =>
                    setEditInsurance((prev) => (prev ? { ...prev, coverageDetails: e.target.value } : prev))
                  }
                  fullWidth
                  multiline
                  minRows={2}
                  sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}
                />
              </Box>
            </LocalizationProvider>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} color="secondary">
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void saveInsurance()} variant="contained" disabled={!canSave}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InsurancePage;