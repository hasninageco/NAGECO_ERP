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
import SummarizeIcon from '@mui/icons-material/Summarize';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
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

type Vehicle = {
  ID_VEHICLE: number;
  PLATE_NUMBER: string;
  BRAND?: string | null;
  MODEL?: string | null;
  VEHICLE_YEAR?: number | null;
  VEHICLE_TYPE?: string | null;
  FUEL_TYPE?: string | null;
  CURRENT_MILEAGE: number;
  STATUS: string;
  ID_EMP_RESPONSIBLE?: string | number | null;
  CREATED_AT?: string | null;
  UPDATED_AT?: string | null;
};

type VehicleSummary = {
  ACTIVE_INSURANCE_END_DATE?: string | null;
  OPEN_MAINTENANCE_COUNT?: number;
  ACTIVE_TRIP_COUNT?: number;
};

type EditVehicle = {
  idVehicle?: number;
  plateNumber: string;
  brand: string;
  model: string;
  vehicleYear: number | '';
  vehicleType: string;
  fuelType: string;
  currentMileage: number;
  status: string;
  idEmpResponsible: string;
};

const VEHICLE_STATUSES = ['Active', 'Reserved', 'In Maintenance', 'In Trip', 'Out Of Service'];

const defaultEditVehicle = (): EditVehicle => ({
  plateNumber: '',
  brand: '',
  model: '',
  vehicleYear: '',
  vehicleType: '',
  fuelType: '',
  currentMileage: 0,
  status: 'Active',
  idEmpResponsible: '',
});

const VehiclesPage: React.FC<Props> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const apiUrl = buildApiUrl('/fleet/vehicles');

  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>('');
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editVehicle, setEditVehicle] = useState<EditVehicle | null>(null);

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
      const resp = await axios.get<ApiEnvelope<Vehicle[]>>(apiUrl, { headers });
      const nextRows = Array.isArray(resp.data?.data) ? resp.data.data : [];
      setRows(nextRows);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to load vehicles'));
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
        String(row.ID_VEHICLE).includes(q) ||
        (row.PLATE_NUMBER || '').toLowerCase().includes(q) ||
        (row.BRAND || '').toLowerCase().includes(q) ||
        (row.MODEL || '').toLowerCase().includes(q) ||
        String(row.VEHICLE_YEAR ?? '').toLowerCase().includes(q) ||
        (row.VEHICLE_TYPE || '').toLowerCase().includes(q) ||
        (row.FUEL_TYPE || '').toLowerCase().includes(q) ||
        String(row.CURRENT_MILEAGE ?? '').toLowerCase().includes(q) ||
        (row.STATUS || '').toLowerCase().includes(q) ||
        String(row.ID_EMP_RESPONSIBLE ?? '').toLowerCase().includes(q)
      );
    });
  }, [query, rows]);

  const columns = useMemo<MRT_ColumnDef<Vehicle>[]>(
    () => [
      { accessorKey: 'ID_VEHICLE', header: 'ID', size: 60 },
      { accessorKey: 'PLATE_NUMBER', header: 'Plate Number', size: 130 },
      { accessorKey: 'BRAND', header: 'Brand', size: 120 },
      { accessorKey: 'MODEL', header: 'Model', size: 120 },
      { accessorKey: 'VEHICLE_YEAR', header: 'Year', size: 90 },
      { accessorKey: 'VEHICLE_TYPE', header: 'Type', size: 110 },
      { accessorKey: 'FUEL_TYPE', header: 'Fuel', size: 100 },
      { accessorKey: 'CURRENT_MILEAGE', header: 'Mileage', size: 110 },
      { accessorKey: 'STATUS', header: 'Status', size: 120 },
      { accessorKey: 'ID_EMP_RESPONSIBLE', header: 'Responsible Emp', size: 120 },
    ],
    []
  );

  const openCreate = () => {
    setEditVehicle(defaultEditVehicle());
    setEditOpen(true);
  };

  const openEdit = (row: Vehicle) => {
    setEditVehicle({
      idVehicle: row.ID_VEHICLE,
      plateNumber: row.PLATE_NUMBER || '',
      brand: row.BRAND || '',
      model: row.MODEL || '',
      vehicleYear: row.VEHICLE_YEAR ?? '',
      vehicleType: row.VEHICLE_TYPE || '',
      fuelType: row.FUEL_TYPE || '',
      currentMileage: Number(row.CURRENT_MILEAGE || 0),
      status: row.STATUS || 'Active',
      idEmpResponsible: row.ID_EMP_RESPONSIBLE === null || row.ID_EMP_RESPONSIBLE === undefined
        ? ''
        : String(row.ID_EMP_RESPONSIBLE),
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditVehicle(null);
  };

  const saveVehicle = async () => {
    if (!editVehicle) return;

    const headers = withAuth();
    if (!headers) return;

    const payload = {
      plateNumber: editVehicle.plateNumber.trim(),
      brand: editVehicle.brand.trim() || null,
      model: editVehicle.model.trim() || null,
      vehicleYear: editVehicle.vehicleYear === '' ? null : Number(editVehicle.vehicleYear),
      vehicleType: editVehicle.vehicleType.trim() || null,
      fuelType: editVehicle.fuelType.trim() || null,
      currentMileage: Number(editVehicle.currentMileage || 0),
      status: editVehicle.status,
      idEmpResponsible: editVehicle.idEmpResponsible.trim() === '' ? null : editVehicle.idEmpResponsible.trim(),
    };

    try {
      if (editVehicle.idVehicle) {
        await axios.put(`${apiUrl}/${editVehicle.idVehicle}`, payload, { headers });
      } else {
        await axios.post(apiUrl, payload, { headers });
      }
      closeEdit();
      await fetchRows();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to save vehicle'));
      }
    }
  };

  const deleteVehicle = async (vehicle: Vehicle) => {
    const headers = withAuth();
    if (!headers) return;

    const ok = window.confirm(`Delete vehicle ${vehicle.PLATE_NUMBER}?`);
    if (!ok) return;

    try {
      await axios.delete(`${apiUrl}/${vehicle.ID_VEHICLE}`, { headers });
      await fetchRows();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to delete vehicle'));
      }
    }
  };

  const viewSummary = async (vehicle: Vehicle) => {
    const headers = withAuth();
    if (!headers) return;

    try {
      const resp = await axios.get<ApiEnvelope<VehicleSummary>>(`${apiUrl}/summary/${vehicle.ID_VEHICLE}`, { headers });
      const summary = resp.data?.data;
      const lines = [
        `Plate: ${vehicle.PLATE_NUMBER}`,
        `Open Maintenance: ${summary?.OPEN_MAINTENANCE_COUNT ?? 0}`,
        `Active Trips: ${summary?.ACTIVE_TRIP_COUNT ?? 0}`,
        `Insurance End: ${summary?.ACTIVE_INSURANCE_END_DATE ?? '-'}`,
      ];
      alert(lines.join('\n'));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to load summary'));
      }
    }
  };

  const canSave =
    !!editVehicle &&
    !!editVehicle.plateNumber.trim() &&
    Number.isInteger(editVehicle.currentMileage) &&
    Number(editVehicle.currentMileage) >= 0 &&
    VEHICLE_STATUSES.includes(editVehicle.status) &&
    (editVehicle.idEmpResponsible === '' || !!editVehicle.idEmpResponsible.trim());

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
        <IconButton title={t('common.delete')} onClick={() => void deleteVehicle(row.original)}>
          <DeleteIcon />
        </IconButton>
        <IconButton title="Summary" onClick={() => void viewSummary(row.original)}>
          <SummarizeIcon />
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
              <DirectionsCarIcon />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {t('nav.fleetVehicles')}
              </Typography>
            </Stack>
          }
          subheader="Manage vehicle master data for the fleet module"
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
                placeholder="Search vehicles"
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
        <DialogTitle>{editVehicle?.idVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
        <DialogContent dividers>
          {editVehicle && (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <TextField
                label="Plate Number"
                value={editVehicle.plateNumber}
                onChange={(e) => setEditVehicle((prev) => (prev ? { ...prev, plateNumber: e.target.value } : prev))}
                required
                fullWidth
              />

              <TextField
                label="Brand"
                value={editVehicle.brand}
                onChange={(e) => setEditVehicle((prev) => (prev ? { ...prev, brand: e.target.value } : prev))}
                fullWidth
              />

              <TextField
                label="Model"
                value={editVehicle.model}
                onChange={(e) => setEditVehicle((prev) => (prev ? { ...prev, model: e.target.value } : prev))}
                fullWidth
              />

              <TextField
                label="Year"
                type="number"
                value={editVehicle.vehicleYear}
                onChange={(e) =>
                  setEditVehicle((prev) =>
                    prev
                      ? {
                          ...prev,
                          vehicleYear:
                            e.target.value === '' ? '' : Number(e.target.value),
                        }
                      : prev
                  )
                }
                fullWidth
              />

              <TextField
                label="Vehicle Type"
                value={editVehicle.vehicleType}
                onChange={(e) => setEditVehicle((prev) => (prev ? { ...prev, vehicleType: e.target.value } : prev))}
                fullWidth
              />

              <TextField
                label="Fuel Type"
                value={editVehicle.fuelType}
                onChange={(e) => setEditVehicle((prev) => (prev ? { ...prev, fuelType: e.target.value } : prev))}
                fullWidth
              />

              <TextField
                label="Current Mileage"
                type="number"
                value={editVehicle.currentMileage}
                onChange={(e) =>
                  setEditVehicle((prev) =>
                    prev
                      ? {
                          ...prev,
                          currentMileage:
                            e.target.value === '' ? 0 : Number(e.target.value),
                        }
                      : prev
                  )
                }
                required
                fullWidth
              />

              <TextField
                label="Status"
                select
                value={editVehicle.status}
                onChange={(e) => setEditVehicle((prev) => (prev ? { ...prev, status: e.target.value } : prev))}
                fullWidth
              >
                {VEHICLE_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Responsible Employee (Name/Ref)"
                value={editVehicle.idEmpResponsible}
                onChange={(e) =>
                  setEditVehicle((prev) =>
                    prev
                      ? {
                          ...prev,
                          idEmpResponsible: e.target.value,
                        }
                      : prev
                  )
                }
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} color="secondary">
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void saveVehicle()} variant="contained" disabled={!canSave}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehiclesPage;
