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
import AltRouteIcon from '@mui/icons-material/AltRoute';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

type Trip = {
  ID_TRIP: number;
  TRIP_NUMBER?: string | null;
  ID_VEHICLE: number;
  ID_EMP_DRIVER?: string | null;
  REQUESTED_BY?: string | null;
  TRIP_TYPE?: string | null;
  START_LOCATION?: string | null;
  DESTINATION?: string | null;
  PURPOSE?: string | null;
  PLANNED_START_DATE?: string | null;
  PLANNED_END_DATE?: string | null;
  ACTUAL_START_DATE?: string | null;
  ACTUAL_END_DATE?: string | null;
  START_MILEAGE?: number | null;
  END_MILEAGE?: number | null;
  STATUS: string;
};

type VehicleOption = {
  ID_VEHICLE: number;
  PLATE_NUMBER: string;
};

type EditTrip = {
  idTrip?: number;
  tripNumber: string;
  idVehicle: number | '';
  idEmpDriver: string;
  requestedBy: string;
  tripType: string;
  startLocation: string;
  destination: string;
  purpose: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate: string;
  actualEndDate: string;
  startMileage: number | '';
  endMileage: number | '';
  status: string;
};

const TRIP_STATUSES = ['Requested', 'Approved', 'Started', 'Completed', 'Cancelled', 'Rejected'];
const TRIP_TYPES = ['Employee', 'Visitor', 'Mixed'];
const TRIP_NUMBER_PREFIX = 'TRP';
const REPORT_LOGO_URL = '/NAGECO.jpg';

const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image blob.'));
    reader.readAsDataURL(blob);
  });
};

const fetchImageAsDataUrl = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load image: ${url}`);
  }
  const blob = await response.blob();
  return blobToDataUrl(blob);
};

const getImageTypeFromDataUrl = (dataUrl: string): 'PNG' | 'JPEG' => {
  return dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
};

const toDateInput = (value?: string | null): string => {
  if (!value) return '';
  return String(value).slice(0, 10);
};

const toDisplayDate = (value?: string | null): string => {
  const normalized = toDateInput(value);
  if (!normalized) return '-';

  const parsed = dayjs(normalized);
  return parsed.isValid() ? parsed.format('DD-MM-YYYY') : '-';
};

const normalizeEmployeeRefForPayload = (value?: string | null): string | null => {
  const normalized = String(value || '').trim();
  if (!normalized) return null;
  return normalized;
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

const extractTripSequence = (tripNumber?: string | null): number => {
  const normalized = String(tripNumber || '').trim();
  if (!normalized) return 0;

  const matches = normalized.match(/\d+/g);
  if (!matches || matches.length === 0) return 0;

  const parsed = Number(matches[matches.length - 1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const buildNextTripNumber = (trips: Trip[]): string => {
  const maxSequence = trips.reduce((maxSeq, trip) => {
    return Math.max(maxSeq, extractTripSequence(trip.TRIP_NUMBER));
  }, 0);

  return `${TRIP_NUMBER_PREFIX}-${String(maxSequence + 1).padStart(4, '0')}`;
};

const defaultEditTrip = (): EditTrip => ({
  tripNumber: '',
  idVehicle: '',
  idEmpDriver: '',
  requestedBy: '',
  tripType: 'Employee',
  startLocation: '',
  destination: '',
  purpose: '',
  plannedStartDate: '',
  plannedEndDate: '',
  actualStartDate: '',
  actualEndDate: '',
  startMileage: '',
  endMileage: '',
  status: 'Requested',
});

const TripsPage: React.FC<Props> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const tripsApiUrl = buildApiUrl('/fleet/trips');
  const vehiclesApiUrl = buildApiUrl('/fleet/vehicles');

  const [rows, setRows] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>('');
  const [vehicleFilter, setVehicleFilter] = useState<number | ''>('');
  const [driverFilter, setDriverFilter] = useState<string>('');
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editTrip, setEditTrip] = useState<EditTrip | null>(null);

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
      const [tripsResp, vehiclesResp] = await Promise.all([
        axios.get<ApiEnvelope<Trip[]>>(tripsApiUrl, { headers }),
        axios.get<ApiEnvelope<VehicleOption[]>>(vehiclesApiUrl, { headers }),
      ]);

      setRows(Array.isArray(tripsResp.data?.data) ? tripsResp.data.data : []);
      setVehicles(Array.isArray(vehiclesResp.data?.data) ? vehiclesResp.data.data : []);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to load trips'));
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, tripsApiUrl, vehiclesApiUrl, withAuth]);

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

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const driver = driverFilter.trim().toLowerCase();

    return rows.filter((row) => {
      const queryMatches =
        !q ||
        String(row.ID_TRIP).includes(q) ||
        (row.TRIP_NUMBER || '').toLowerCase().includes(q) ||
        String(row.ID_VEHICLE).includes(q) ||
        String(row.ID_EMP_DRIVER || '').toLowerCase().includes(q) ||
        String(row.REQUESTED_BY || '').toLowerCase().includes(q) ||
        String(row.TRIP_TYPE || '').toLowerCase().includes(q) ||
        String(row.START_LOCATION || '').toLowerCase().includes(q) ||
        String(row.DESTINATION || '').toLowerCase().includes(q) ||
        String(row.PURPOSE || '').toLowerCase().includes(q) ||
        String(row.STATUS || '').toLowerCase().includes(q);

      const vehicleMatches =
        vehicleFilter === '' || Number(row.ID_VEHICLE) === Number(vehicleFilter);

      const driverMatches =
        !driver ||
        String(row.ID_EMP_DRIVER || '').toLowerCase().includes(driver);

      return queryMatches && vehicleMatches && driverMatches;
    });
  }, [driverFilter, query, rows, vehicleFilter]);

  const columns = useMemo<MRT_ColumnDef<Trip>[]>(
    () => [
      { accessorKey: 'ID_TRIP', header: 'ID', size: 70 },
      { accessorKey: 'TRIP_NUMBER', header: 'Trip Number', size: 120 },
      {
        accessorKey: 'ID_VEHICLE',
        header: 'Vehicle',
        size: 170,
        Cell: ({ row }) => getVehicleLabel(row.original.ID_VEHICLE),
      },
      { accessorKey: 'ID_EMP_DRIVER', header: 'Driver (Name/Ref)', size: 150 },
      { accessorKey: 'REQUESTED_BY', header: 'Requested By (Name/Ref)', size: 170 },
      { accessorKey: 'TRIP_TYPE', header: 'Trip Type', size: 120 },
      { accessorKey: 'START_LOCATION', header: 'Start', size: 160 },
      { accessorKey: 'DESTINATION', header: 'Destination', size: 160 },
      {
        accessorKey: 'PLANNED_START_DATE',
        header: 'Planned Start',
        size: 130,
        Cell: ({ row }) => toDisplayDate(row.original.PLANNED_START_DATE),
      },
      {
        accessorKey: 'PLANNED_END_DATE',
        header: 'Planned End',
        size: 130,
        Cell: ({ row }) => toDisplayDate(row.original.PLANNED_END_DATE),
      },
      { accessorKey: 'START_MILEAGE', header: 'Start Mileage', size: 120 },
      { accessorKey: 'END_MILEAGE', header: 'End Mileage', size: 120 },
      { accessorKey: 'STATUS', header: 'Status', size: 120 },
    ],
    [getVehicleLabel]
  );

  const openCreate = () => {
    setEditTrip({
      ...defaultEditTrip(),
      tripNumber: buildNextTripNumber(rows),
    });
    setEditOpen(true);
  };

  const openEdit = (row: Trip) => {
    setEditTrip({
      idTrip: row.ID_TRIP,
      tripNumber: row.TRIP_NUMBER || '',
      idVehicle: row.ID_VEHICLE,
      idEmpDriver: row.ID_EMP_DRIVER || '',
      requestedBy: row.REQUESTED_BY || '',
      tripType: row.TRIP_TYPE || 'Employee',
      startLocation: row.START_LOCATION || '',
      destination: row.DESTINATION || '',
      purpose: row.PURPOSE || '',
      plannedStartDate: toDateInput(row.PLANNED_START_DATE),
      plannedEndDate: toDateInput(row.PLANNED_END_DATE),
      actualStartDate: toDateInput(row.ACTUAL_START_DATE),
      actualEndDate: toDateInput(row.ACTUAL_END_DATE),
      startMileage: row.START_MILEAGE ?? '',
      endMileage: row.END_MILEAGE ?? '',
      status: row.STATUS || 'Requested',
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditTrip(null);
  };

  const saveTrip = async () => {
    if (!editTrip) return;

    const headers = withAuth();
    if (!headers) return;

    const tripNumberForSave = editTrip.tripNumber.trim() || buildNextTripNumber(rows);
    const idEmpDriverForSave = normalizeEmployeeRefForPayload(editTrip.idEmpDriver);
    const requestedByForSave = normalizeEmployeeRefForPayload(editTrip.requestedBy);

    const payload = {
      tripNumber: tripNumberForSave,
      idVehicle: Number(editTrip.idVehicle),
      idEmpDriver: idEmpDriverForSave,
      requestedBy: requestedByForSave,
      tripType: editTrip.tripType,
      startLocation: editTrip.startLocation.trim() || null,
      destination: editTrip.destination.trim() || null,
      purpose: editTrip.purpose.trim() || null,
      plannedStartDate: editTrip.plannedStartDate || null,
      plannedEndDate: editTrip.plannedEndDate || null,
      actualStartDate: editTrip.actualStartDate || null,
      actualEndDate: editTrip.actualEndDate || null,
      startMileage: editTrip.startMileage === '' ? null : Number(editTrip.startMileage),
      endMileage: editTrip.endMileage === '' ? null : Number(editTrip.endMileage),
      status: editTrip.status,
    };

    try {
      if (editTrip.idTrip) {
        await axios.put(`${tripsApiUrl}/${editTrip.idTrip}`, payload, { headers });
      } else {
        await axios.post(tripsApiUrl, payload, { headers });
      }

      closeEdit();
      await fetchRows();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to save trip'));
      }
    }
  };

  const deleteTrip = async (row: Trip) => {
    const headers = withAuth();
    if (!headers) return;

    const tripLabel = row.TRIP_NUMBER ? row.TRIP_NUMBER : `#${row.ID_TRIP}`;
    const confirmed = window.confirm(`Delete trip ${tripLabel}?`);
    if (!confirmed) return;

    try {
      await axios.delete(`${tripsApiUrl}/${row.ID_TRIP}`, { headers });
      await fetchRows();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
        return;
      }

      if (axios.isAxiosError(error) && [404, 405].includes(Number(error.response?.status))) {
        try {
          await axios.post(`${tripsApiUrl}/${row.ID_TRIP}/delete`, {}, { headers });
          await fetchRows();
          return;
        } catch (fallbackError) {
          if (axios.isAxiosError(fallbackError) && fallbackError.response?.status === 401) {
            navigate('/');
            return;
          }

          alert(extractErrorMessage(fallbackError, 'Failed to delete trip'));
          return;
        }
      }

      alert(extractErrorMessage(error, 'Failed to delete trip'));
    }
  };

  const canSave = useMemo(() => {
    if (!editTrip) return false;
    if (editTrip.idVehicle === '' || Number(editTrip.idVehicle) <= 0) return false;
    if (!TRIP_TYPES.includes(editTrip.tripType)) return false;
    if (!TRIP_STATUSES.includes(editTrip.status)) return false;

    const driver = editTrip.idEmpDriver.trim();
    const requestedBy = editTrip.requestedBy.trim();
    if (driver.length > 100 || requestedBy.length > 100) return false;

    if (
      editTrip.plannedStartDate &&
      editTrip.plannedEndDate &&
      new Date(editTrip.plannedEndDate).getTime() < new Date(editTrip.plannedStartDate).getTime()
    ) {
      return false;
    }

    if (
      ['Requested', 'Approved'].includes(editTrip.status) &&
      (Boolean(editTrip.actualStartDate) || Boolean(editTrip.actualEndDate))
    ) {
      return false;
    }

    if (editTrip.status === 'Started' && Boolean(editTrip.actualEndDate)) {
      return false;
    }

    if (editTrip.actualEndDate && !editTrip.actualStartDate) {
      return false;
    }

    if (
      editTrip.actualStartDate &&
      editTrip.actualEndDate &&
      new Date(editTrip.actualEndDate).getTime() < new Date(editTrip.actualStartDate).getTime()
    ) {
      return false;
    }

    const startMileage = editTrip.startMileage === '' ? null : Number(editTrip.startMileage);
    const endMileage = editTrip.endMileage === '' ? null : Number(editTrip.endMileage);

    if (startMileage !== null && (!Number.isInteger(startMileage) || startMileage < 0)) return false;
    if (endMileage !== null && (!Number.isInteger(endMileage) || endMileage < 0)) return false;
    if (startMileage !== null && endMileage !== null && endMileage < startMileage) return false;

    return true;
  }, [editTrip]);

  const exportFilteredToPdf = useCallback(async () => {
    if (filteredRows.length === 0) {
      alert('No trip data to export');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(245, 247, 252);
    doc.rect(0, 0, pageWidth, 74, 'F');

    let titleLeft = 36;
    try {
      const logoDataUrl = await fetchImageAsDataUrl(REPORT_LOGO_URL);
      const imageType = getImageTypeFromDataUrl(logoDataUrl);
      doc.addImage(logoDataUrl, imageType, 36, 18, 86, 38);
      titleLeft = 132;
    } catch {
      titleLeft = 36;
    }

    doc.setFontSize(18);
    doc.setTextColor(25, 35, 70);
    doc.text('Trips Report', titleLeft, 46);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${dayjs().format('YYYY-MM-DD HH:mm')}`, titleLeft, 64);
    doc.text(`Total Rows: ${filteredRows.length}`, pageWidth - 36, 46, { align: 'right' });

    const filterSummary = [
      `Search: ${query.trim() || 'all'}`,
      `Vehicle: ${vehicleFilter === '' ? 'all' : getVehicleLabel(Number(vehicleFilter))}`,
      `Driver: ${driverFilter.trim() || 'all'}`,
    ].join(' | ');

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(filterSummary, 36, 82, { maxWidth: pageWidth - 72 });

    const tableHead = [[
      'ID',
      'Trip No',
      'Vehicle',
      'Driver',
      'Requested By',
      'Type',
      'Planned Start',
      'Planned End',
      'Actual Start',
      'Actual End',
      'Status',
    ]];

    const tableBody = filteredRows.map((row) => [
      String(row.ID_TRIP),
      row.TRIP_NUMBER || '-',
      getVehicleLabel(row.ID_VEHICLE),
      row.ID_EMP_DRIVER || '-',
      row.REQUESTED_BY || '-',
      row.TRIP_TYPE || '-',
      toDisplayDate(row.PLANNED_START_DATE),
      toDisplayDate(row.PLANNED_END_DATE),
      toDisplayDate(row.ACTUAL_START_DATE),
      toDisplayDate(row.ACTUAL_END_DATE),
      row.STATUS || '-',
    ]);

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 96,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [25, 118, 210],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [247, 249, 252],
      },
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 72 },
        2: { cellWidth: 88 },
        3: { cellWidth: 78 },
        4: { cellWidth: 88 },
        5: { cellWidth: 58 },
        6: { cellWidth: 68 },
        7: { cellWidth: 68 },
        8: { cellWidth: 68 },
        9: { cellWidth: 68 },
        10: { cellWidth: 62 },
      },
    });

    doc.save(`trips-report-${dayjs().format('YYYYMMDD-HHmm')}.pdf`);
  }, [driverFilter, filteredRows, getVehicleLabel, query, vehicleFilter]);

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
        <IconButton title="Delete" color="error" onClick={() => void deleteTrip(row.original)}>
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
              <AltRouteIcon />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {t('nav.fleetTrips')}
              </Typography>
            </Stack>
          }
          subheader="Manage trip requests, planned schedules, and employee assignments"
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
                placeholder="Search trips"
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

              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                onClick={() => void exportFilteredToPdf()}
                disabled={filteredRows.length === 0}
              >
                Export PDF
              </Button>

              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                {t('common.add')}
              </Button>
            </Stack>
          }
        />

        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            alignItems={{ xs: 'stretch', md: 'center' }}
            sx={{ mb: 1.5 }}
          >
            <TextField
              size="small"
              label="Vehicle"
              select
              value={vehicleFilter}
              onChange={(e) =>
                setVehicleFilter(e.target.value === '' ? '' : Number(e.target.value))
              }
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">All Vehicles</MenuItem>
              {vehicles.map((v) => (
                <MenuItem key={v.ID_VEHICLE} value={v.ID_VEHICLE}>
                  {v.ID_VEHICLE} - {v.PLATE_NUMBER}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              label="Driver"
              placeholder="Driver name or ref"
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              sx={{ minWidth: 220 }}
            />
          </Stack>

          <MaterialReactTable table={table} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="md">
        <DialogTitle>{editTrip?.idTrip ? 'Edit Trip' : 'Add Trip'}</DialogTitle>
        <DialogContent dividers>
          {editTrip && (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                <TextField
                  label="Trip Number"
                  value={editTrip.tripNumber}
                  onChange={(e) =>
                    setEditTrip((prev) => (prev ? { ...prev, tripNumber: e.target.value } : prev))
                  }
                  helperText="Auto-generated with TRP prefix"
                  InputProps={{ readOnly: true }}
                  fullWidth
                />

                <TextField
                  label="Vehicle"
                  select
                  value={editTrip.idVehicle}
                  onChange={(e) =>
                    setEditTrip((prev) =>
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
                  label="Driver Employee (Name/Ref)"
                  value={editTrip.idEmpDriver}
                  onChange={(e) =>
                    setEditTrip((prev) => (prev ? { ...prev, idEmpDriver: e.target.value } : prev))
                  }
                  helperText="Employee name or reference"
                  fullWidth
                />

                <TextField
                  label="Requested By (Name/Ref)"
                  value={editTrip.requestedBy}
                  onChange={(e) =>
                    setEditTrip((prev) => (prev ? { ...prev, requestedBy: e.target.value } : prev))
                  }
                  helperText="Employee name or reference"
                  fullWidth
                />

                <TextField
                  label="Trip Type"
                  select
                  value={editTrip.tripType}
                  onChange={(e) =>
                    setEditTrip((prev) => (prev ? { ...prev, tripType: e.target.value } : prev))
                  }
                  fullWidth
                >
                  {TRIP_TYPES.map((tripType) => (
                    <MenuItem key={tripType} value={tripType}>
                      {tripType}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Status"
                  select
                  value={editTrip.status}
                  onChange={(e) =>
                    setEditTrip((prev) => {
                      if (!prev) return prev;

                      const nextStatus = e.target.value;
                      if (nextStatus === 'Requested' || nextStatus === 'Approved') {
                        return {
                          ...prev,
                          status: nextStatus,
                          actualStartDate: '',
                          actualEndDate: '',
                        };
                      }

                      if (nextStatus === 'Started') {
                        return {
                          ...prev,
                          status: nextStatus,
                          actualEndDate: '',
                        };
                      }

                      return { ...prev, status: nextStatus };
                    })
                  }
                  fullWidth
                >
                  {TRIP_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Start Location"
                  value={editTrip.startLocation}
                  onChange={(e) =>
                    setEditTrip((prev) => (prev ? { ...prev, startLocation: e.target.value } : prev))
                  }
                  fullWidth
                />

                <TextField
                  label="Destination"
                  value={editTrip.destination}
                  onChange={(e) =>
                    setEditTrip((prev) => (prev ? { ...prev, destination: e.target.value } : prev))
                  }
                  fullWidth
                />

                <DatePicker
                  label="Planned Start Date"
                  format="DD-MM-YYYY"
                  value={toPickerDate(editTrip.plannedStartDate)}
                  onChange={(value) =>
                    setEditTrip((prev) =>
                      prev ? { ...prev, plannedStartDate: fromPickerDate(value) } : prev
                    )
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />

                <DatePicker
                  label="Planned End Date"
                  format="DD-MM-YYYY"
                  value={toPickerDate(editTrip.plannedEndDate)}
                  onChange={(value) =>
                    setEditTrip((prev) =>
                      prev ? { ...prev, plannedEndDate: fromPickerDate(value) } : prev
                    )
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />

                <DatePicker
                  label="Actual Start Date"
                  format="DD-MM-YYYY"
                  disabled={['Requested', 'Approved'].includes(editTrip.status)}
                  value={toPickerDate(editTrip.actualStartDate)}
                  onChange={(value) =>
                    setEditTrip((prev) =>
                      prev ? { ...prev, actualStartDate: fromPickerDate(value) } : prev
                    )
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: ['Requested', 'Approved'].includes(editTrip.status)
                        ? 'Not allowed for Requested/Approved status'
                        : undefined,
                    },
                  }}
                />

                <DatePicker
                  label="Actual End Date"
                  format="DD-MM-YYYY"
                  disabled={['Requested', 'Approved', 'Started'].includes(editTrip.status)}
                  value={toPickerDate(editTrip.actualEndDate)}
                  onChange={(value) =>
                    setEditTrip((prev) =>
                      prev ? { ...prev, actualEndDate: fromPickerDate(value) } : prev
                    )
                  }
                  minDate={toPickerDate(editTrip.actualStartDate) || undefined}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error:
                        Boolean(editTrip.actualEndDate) &&
                        (!editTrip.actualStartDate ||
                          (Boolean(editTrip.actualStartDate) &&
                            new Date(editTrip.actualEndDate).getTime() <
                              new Date(editTrip.actualStartDate).getTime())),
                      helperText:
                        ['Requested', 'Approved'].includes(editTrip.status)
                          ? 'Not allowed for Requested/Approved status'
                          : editTrip.status === 'Started'
                            ? 'Set when trip is Completed'
                            :
                        Boolean(editTrip.actualEndDate) && !editTrip.actualStartDate
                          ? 'Set Actual Start Date first'
                          : Boolean(editTrip.actualStartDate) &&
                              Boolean(editTrip.actualEndDate) &&
                              new Date(editTrip.actualEndDate).getTime() <
                                new Date(editTrip.actualStartDate).getTime()
                            ? 'Actual End Date must be on/after Actual Start Date'
                            : undefined,
                    },
                  }}
                />

                <TextField
                  label="Start Mileage"
                  type="number"
                  value={editTrip.startMileage}
                  onChange={(e) =>
                    setEditTrip((prev) =>
                      prev
                        ? {
                            ...prev,
                            startMileage: e.target.value === '' ? '' : Number(e.target.value),
                          }
                        : prev
                    )
                  }
                  fullWidth
                />

                <TextField
                  label="End Mileage"
                  type="number"
                  value={editTrip.endMileage}
                  onChange={(e) =>
                    setEditTrip((prev) =>
                      prev
                        ? {
                            ...prev,
                            endMileage: e.target.value === '' ? '' : Number(e.target.value),
                          }
                        : prev
                    )
                  }
                  fullWidth
                />

                <TextField
                  label="Purpose"
                  value={editTrip.purpose}
                  onChange={(e) => setEditTrip((prev) => (prev ? { ...prev, purpose: e.target.value } : prev))}
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
          <Button onClick={() => void saveTrip()} variant="contained" disabled={!canSave}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TripsPage;