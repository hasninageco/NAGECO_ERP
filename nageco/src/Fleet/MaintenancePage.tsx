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
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BuildIcon from '@mui/icons-material/Build';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ScheduleIcon from '@mui/icons-material/Schedule';
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

type Maintenance = {
  ID_MAINTENANCE: number;
  ID_VEHICLE: number;
  ID_SUPPLIER?: number | null;
  MAINTENANCE_TYPE: string;
  DESCRIPTION?: string | null;
  START_DATE?: string | null;
  END_DATE?: string | null;
  SERVICE_DATE?: string | null;
  MILEAGE?: number | null;
  WORK_PERFORMED?: string | null;
  LABOR_COST?: number | null;
  PARTS_COST?: number | null;
  NEXT_SERVICE_DATE?: string | null;
  NEXT_SERVICE_MILEAGE?: number | null;
  STATUS: string;
  PLATE_NUMBER?: string | null;
  CURRENT_MILEAGE?: number | null;
};

type VehicleOption = {
  ID_VEHICLE: number;
  PLATE_NUMBER: string;
  BRAND?: string | null;
  MODEL?: string | null;
  ID_EMP_RESPONSIBLE?: string | number | null;
  RESPONSIBLE_NAME?: string | null;
  EMPLOYEE_NAME?: string | null;
};

type SupplierOption = {
  ID_SUPPLIER: number;
  NAME: string;
};

type DatePreset = 'all' | 'today' | 'lastweek' | 'lastmonth' | 'custom';

type ComboOption = {
  value: number | '';
  label: string;
};

type VehicleComboOption = ComboOption & {
  plate: string;
  brand: string;
  model: string;
  responsible: string;
  searchText: string;
  isAllOption?: boolean;
};

type EditMaintenance = {
  idMaintenance?: number;
  idVehicle: number | '';
  idSupplier: number | '';
  maintenanceType: string;
  description: string;
  startDate: string;
  endDate: string;
  serviceDate: string;
  mileage: number | '';
  workPerformed: string;
  laborCost: number | '';
  partsCost: number | '';
  nextServiceDate: string;
  nextServiceMileage: number | '';
  status: string;
};

const MAINTENANCE_STATUSES = ['Planned', 'In Progress', 'Completed', 'Cancelled'];
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

const getVehicleResponsibleLabel = (vehicle: VehicleOption): string => {
  return (
    String(vehicle.RESPONSIBLE_NAME || '').trim() ||
    String(vehicle.EMPLOYEE_NAME || '').trim() ||
    String(vehicle.ID_EMP_RESPONSIBLE || '').trim() ||
    '-'
  );
};

const buildVehicleComboOption = (vehicle: VehicleOption): VehicleComboOption => {
  const plate = String(vehicle.PLATE_NUMBER || '').trim() || '-';
  const brand = String(vehicle.BRAND || '').trim() || '-';
  const model = String(vehicle.MODEL || '').trim() || '-';
  const responsible = getVehicleResponsibleLabel(vehicle);

  return {
    value: vehicle.ID_VEHICLE,
    label: `${vehicle.ID_VEHICLE} - ${plate}`,
    plate,
    brand,
    model,
    responsible,
    searchText: `${vehicle.ID_VEHICLE} ${plate} ${brand} ${model} ${responsible}`,
  };
};

const vehicleOptionGridColumns = {
  xs: '0.5fr 1fr 1fr 1fr 1.5fr',
  sm: '0.45fr 1fr 1fr 1fr 1.55fr',
};

const vehicleOptionCellSx = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const vehicleAutocompleteFilter = createFilterOptions<VehicleComboOption>({
  stringify: (option) => option.searchText,
});

const VehicleOptionsPaper = (paperProps: React.ComponentProps<typeof Paper>) => (
  <Paper {...paperProps} sx={{ overflowX: 'hidden' }}>
    <Box
      sx={{
        px: 1.5,
        py: 0.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'grey.50',
      }}
    >
      <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: vehicleOptionGridColumns }}>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          ID
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          Plate
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          Brand
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          Model
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          Responsible
        </Typography>
      </Box>
    </Box>
    {paperProps.children}
  </Paper>
);

const renderVehicleOptionAsTable = (
  props: React.HTMLAttributes<HTMLLIElement>,
  option: VehicleComboOption
) => {
  if (option.isAllOption) {
    return (
      <li {...props}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {option.label}
        </Typography>
      </li>
    );
  }

  const idLabel = typeof option.value === 'number' ? String(option.value) : '-';

  return (
    <li {...props}>
      <Box
        sx={{
          width: '100%',
          display: 'grid',
          gap: 1,
          alignItems: 'center',
          gridTemplateColumns: vehicleOptionGridColumns,
          py: 0.25,
        }}
      >
        <Typography variant="body2" sx={{ ...vehicleOptionCellSx, fontWeight: 600 }}>
          {idLabel}
        </Typography>
        <Typography variant="body2" sx={vehicleOptionCellSx}>
          {option.plate}
        </Typography>
        <Typography variant="body2" sx={vehicleOptionCellSx}>
          {option.brand}
        </Typography>
        <Typography variant="body2" sx={vehicleOptionCellSx}>
          {option.model}
        </Typography>
        <Typography variant="body2" sx={vehicleOptionCellSx}>
          {option.responsible}
        </Typography>
      </Box>
    </li>
  );
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

const toPickerDate = (value: string): Dayjs | null => {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

const fromPickerDate = (value: Dayjs | null): string => {
  if (!value || !value.isValid()) return '';
  return value.format('YYYY-MM-DD');
};

const defaultEditMaintenance = (): EditMaintenance => ({
  idVehicle: '',
  idSupplier: '',
  maintenanceType: '',
  description: '',
  startDate: '',
  endDate: '',
  serviceDate: '',
  mileage: '',
  workPerformed: '',
  laborCost: '',
  partsCost: '',
  nextServiceDate: '',
  nextServiceMileage: '',
  status: 'Planned',
});

const MaintenancePage: React.FC<Props> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const apiUrl = buildApiUrl('/fleet/maintenance');
  const vehiclesApiUrl = buildApiUrl('/fleet/vehicles');
  const suppliersApiUrl = buildApiUrl('/fleet/suppliers');

  const [rows, setRows] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<number | ''>('');
  const [vehicleFilter, setVehicleFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dueCount, setDueCount] = useState<number>(0);
  const [overdueCount, setOverdueCount] = useState<number>(0);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editMaintenance, setEditMaintenance] = useState<EditMaintenance | null>(null);

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
      const [maintenanceResp, vehiclesResp, suppliersResp, dueResp, overdueResp] = await Promise.all([
        axios.get<ApiEnvelope<Maintenance[]>>(apiUrl, { headers }),
        axios.get<ApiEnvelope<VehicleOption[]>>(vehiclesApiUrl, { headers }),
        axios.get<ApiEnvelope<SupplierOption[]>>(suppliersApiUrl, { headers }),
        axios.get<ApiEnvelope<Maintenance[]>>(`${apiUrl}/due`, { headers }),
        axios.get<ApiEnvelope<Maintenance[]>>(`${apiUrl}/overdue`, { headers }),
      ]);

      setRows(Array.isArray(maintenanceResp.data?.data) ? maintenanceResp.data.data : []);
      setVehicles(Array.isArray(vehiclesResp.data?.data) ? vehiclesResp.data.data : []);
      setSuppliers(Array.isArray(suppliersResp.data?.data) ? suppliersResp.data.data : []);
      setDueCount(Array.isArray(dueResp.data?.data) ? dueResp.data.data.length : 0);
      setOverdueCount(Array.isArray(overdueResp.data?.data) ? overdueResp.data.data.length : 0);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to load maintenance data'));
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

  const vehicleComboOptions = useMemo<VehicleComboOption[]>(
    () => vehicles.map((v) => buildVehicleComboOption(v)),
    [vehicles]
  );

  const supplierComboOptions = useMemo<ComboOption[]>(
    () => suppliers.map((s) => ({ value: s.ID_SUPPLIER, label: `${s.ID_SUPPLIER} - ${s.NAME}` })),
    [suppliers]
  );

  const vehicleFilterComboOptions = useMemo<VehicleComboOption[]>(
    () => [
      {
        value: '',
        label: 'All Vehicles',
        plate: '-',
        brand: '-',
        model: '-',
        responsible: '-',
        searchText: 'all vehicles',
        isAllOption: true,
      },
      ...vehicleComboOptions,
    ],
    [vehicleComboOptions]
  );

  const supplierFilterComboOptions = useMemo<ComboOption[]>(
    () => [{ value: '', label: 'All Suppliers' }, ...supplierComboOptions],
    [supplierComboOptions]
  );

  const supplierEditComboOptions = useMemo<ComboOption[]>(
    () => [{ value: '', label: 'None' }, ...supplierComboOptions],
    [supplierComboOptions]
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const today = dayjs().format('YYYY-MM-DD');
    const lastWeekStart = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
    const lastMonthStart = dayjs().subtract(1, 'month').format('YYYY-MM-DD');

    return rows.filter((row) => {
      const rowDate = toDateInput(row.START_DATE || row.SERVICE_DATE || row.END_DATE);

      const queryMatches =
        !q ||
        String(row.ID_MAINTENANCE).includes(q) ||
        String(row.ID_VEHICLE).includes(q) ||
        String(row.ID_SUPPLIER ?? '').includes(q) ||
        (row.MAINTENANCE_TYPE || '').toLowerCase().includes(q) ||
        (row.DESCRIPTION || '').toLowerCase().includes(q) ||
        (row.STATUS || '').toLowerCase().includes(q) ||
        (row.START_DATE || '').toLowerCase().includes(q) ||
        (row.END_DATE || '').toLowerCase().includes(q);

      const supplierMatches =
        supplierFilter === '' || Number(row.ID_SUPPLIER ?? -1) === Number(supplierFilter);

      const vehicleMatches =
        vehicleFilter === '' || Number(row.ID_VEHICLE) === Number(vehicleFilter);

      const statusMatches =
        statusFilter === '' ||
        String(row.STATUS || '').trim().toLowerCase() === statusFilter.trim().toLowerCase();

      const dateMatches = (() => {
        if (datePreset === 'all') return true;
        if (!rowDate) return false;

        if (datePreset === 'today') return rowDate === today;
        if (datePreset === 'lastweek') return rowDate >= lastWeekStart && rowDate <= today;
        if (datePreset === 'lastmonth') return rowDate >= lastMonthStart && rowDate <= today;

        if (datePreset === 'custom') {
          if (customDateFrom && rowDate < customDateFrom) return false;
          if (customDateTo && rowDate > customDateTo) return false;
          return true;
        }

        return true;
      })();

      return queryMatches && supplierMatches && vehicleMatches && statusMatches && dateMatches;
    });
  }, [customDateFrom, customDateTo, datePreset, query, rows, statusFilter, supplierFilter, vehicleFilter]);

  const renderStatusCell = useCallback((statusValue?: string | null) => {
    const status = String(statusValue || '').trim();
    const normalized = status.toLowerCase();

    if (normalized === 'completed') {
      return (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <CheckCircleIcon color="success" fontSize="small" />
          <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>
            {status}
          </Typography>
        </Stack>
      );
    }

    if (normalized === 'in progress' || normalized === 'in service') {
      return (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <ScheduleIcon sx={{ color: 'warning.main' }} fontSize="small" />
          <Typography variant="body2" sx={{ color: 'warning.dark', fontWeight: 700 }}>
            {status}
          </Typography>
        </Stack>
      );
    }

    return <Typography variant="body2">{status || '-'}</Typography>;
  }, []);

  const exportFilteredToPdf = useCallback(async () => {
    if (filteredRows.length === 0) {
      alert('No maintenance rows to export');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    let logoDataUrl = '';
    try {
      logoDataUrl = await fetchImageAsDataUrl(REPORT_LOGO_URL);
    } catch {
      logoDataUrl = '';
    }

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, getImageTypeFromDataUrl(logoDataUrl), 36, 24, 52, 52);
    }

    const titleLeft = logoDataUrl ? 100 : 36;
    doc.setFontSize(18);
    doc.setTextColor(25, 35, 70);
    doc.text('Maintenance Report', titleLeft, 46);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${dayjs().format('YYYY-MM-DD HH:mm')}`, titleLeft, 64);
    doc.text(`Total Rows: ${filteredRows.length}`, pageWidth - 36, 46, { align: 'right' });

    const dateFilterLabel =
      datePreset === 'custom'
        ? `custom (${customDateFrom || '-'} to ${customDateTo || '-'})`
        : datePreset;

    const filterSummary = [
      `Search: ${query.trim() || 'all'}`,
      `Date: ${dateFilterLabel}`,
      `Supplier: ${supplierFilter === '' ? 'all' : getSupplierLabel(Number(supplierFilter))}`,
      `Vehicle: ${vehicleFilter === '' ? 'all' : getVehicleLabel(Number(vehicleFilter))}`,
      `Status: ${statusFilter || 'all'}`,
    ].join(' | ');

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(filterSummary, 36, 82);

    const tableHead = [['ID', 'Vehicle', 'Supplier', 'Type', 'Start Date', 'End Date', 'Mileage', 'Status']];
    const tableBody = filteredRows.map((row) => [
      String(row.ID_MAINTENANCE),
      getVehicleLabel(row.ID_VEHICLE),
      getSupplierLabel(row.ID_SUPPLIER),
      row.MAINTENANCE_TYPE || '-',
      toDisplayDate(row.START_DATE),
      toDisplayDate(row.END_DATE),
      row.MILEAGE === null || row.MILEAGE === undefined ? '-' : String(row.MILEAGE),
      row.STATUS || '-',
    ]);

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 96,
      theme: 'grid',
      styles: {
        fontSize: 9,
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
        0: { cellWidth: 44 },
        1: { cellWidth: 130 },
        2: { cellWidth: 130 },
        3: { cellWidth: 90 },
        4: { cellWidth: 78 },
        5: { cellWidth: 78 },
        6: { cellWidth: 70, halign: 'right' },
        7: { cellWidth: 80 },
      },
    });

    doc.save(`maintenance-report-${dayjs().format('YYYYMMDD-HHmm')}.pdf`);
  }, [
    customDateFrom,
    customDateTo,
    datePreset,
    filteredRows,
    getSupplierLabel,
    getVehicleLabel,
    query,
    statusFilter,
    supplierFilter,
    vehicleFilter,
  ]);

  const columns = useMemo<MRT_ColumnDef<Maintenance>[]>(
    () => [
      { accessorKey: 'ID_MAINTENANCE', header: 'ID', size: 60 },
      {
        accessorKey: 'ID_VEHICLE',
        header: 'Vehicle',
        size: 180,
        Cell: ({ row }) => getVehicleLabel(row.original.ID_VEHICLE),
      },
      {
        accessorKey: 'ID_SUPPLIER',
        header: 'Supplier',
        size: 180,
        Cell: ({ row }) => getSupplierLabel(row.original.ID_SUPPLIER),
      },
      { accessorKey: 'MAINTENANCE_TYPE', header: 'Type', size: 150 },
      {
        accessorKey: 'START_DATE',
        header: 'Start Date',
        size: 120,
        Cell: ({ row }) => toDisplayDate(row.original.START_DATE),
      },
      {
        accessorKey: 'END_DATE',
        header: 'End Date',
        size: 120,
        Cell: ({ row }) => toDisplayDate(row.original.END_DATE),
      },
      { accessorKey: 'MILEAGE', header: 'Mileage', size: 100 },
      {
        accessorKey: 'LABOR_COST',
        header: 'Labor Cost',
        size: 120,
      },
      {
        accessorKey: 'PARTS_COST',
        header: 'Parts Cost',
        size: 120,
      },
      {
        accessorKey: 'STATUS',
        header: 'Status',
        size: 140,
        Cell: ({ row }) => renderStatusCell(row.original.STATUS),
      },
    ],
    [getSupplierLabel, getVehicleLabel, renderStatusCell]
  );

  const openCreate = () => {
    setEditMaintenance(defaultEditMaintenance());
    setEditOpen(true);
  };

  const openEdit = (row: Maintenance) => {
    setEditMaintenance({
      idMaintenance: row.ID_MAINTENANCE,
      idVehicle: row.ID_VEHICLE,
      idSupplier: row.ID_SUPPLIER ?? '',
      maintenanceType: row.MAINTENANCE_TYPE || '',
      description: row.DESCRIPTION || '',
      startDate: toDateInput(row.START_DATE),
      endDate: toDateInput(row.END_DATE),
      serviceDate: toDateInput(row.SERVICE_DATE),
      mileage: row.MILEAGE ?? '',
      workPerformed: row.WORK_PERFORMED || '',
      laborCost: row.LABOR_COST ?? '',
      partsCost: row.PARTS_COST ?? '',
      nextServiceDate: toDateInput(row.NEXT_SERVICE_DATE),
      nextServiceMileage: row.NEXT_SERVICE_MILEAGE ?? '',
      status: row.STATUS || 'Planned',
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditMaintenance(null);
  };

  const saveMaintenance = async () => {
    if (!editMaintenance) return;

    const headers = withAuth();
    if (!headers) return;

    const payload = {
      idVehicle: Number(editMaintenance.idVehicle),
      idSupplier: editMaintenance.idSupplier === '' ? null : Number(editMaintenance.idSupplier),
      maintenanceType: editMaintenance.maintenanceType.trim(),
      description: editMaintenance.description.trim() || null,
      startDate: editMaintenance.startDate || null,
      endDate: editMaintenance.endDate || null,
      serviceDate: editMaintenance.serviceDate || null,
      mileage: editMaintenance.mileage === '' ? null : Number(editMaintenance.mileage),
      workPerformed: editMaintenance.workPerformed.trim() || null,
      laborCost: editMaintenance.laborCost === '' ? 0 : Number(editMaintenance.laborCost),
      partsCost: editMaintenance.partsCost === '' ? 0 : Number(editMaintenance.partsCost),
      nextServiceDate: editMaintenance.nextServiceDate || null,
      nextServiceMileage:
        editMaintenance.nextServiceMileage === '' ? null : Number(editMaintenance.nextServiceMileage),
      status: editMaintenance.status,
    };

    try {
      if (editMaintenance.idMaintenance) {
        await axios.put(`${apiUrl}/${editMaintenance.idMaintenance}`, payload, { headers });
      } else {
        await axios.post(apiUrl, payload, { headers });
      }
      closeEdit();
      await fetchRows();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to save maintenance'));
      }
    }
  };

  const callStatusAction = async (item: Maintenance, action: 'start' | 'complete' | 'cancel') => {
    const headers = withAuth();
    if (!headers) return;

    try {
      await axios.post(`${apiUrl}/${item.ID_MAINTENANCE}/${action}`, {}, { headers });
      await fetchRows();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, `Failed to ${action} maintenance`));
      }
    }
  };

  const canSave =
    !!editMaintenance &&
    editMaintenance.idVehicle !== '' &&
    Number(editMaintenance.idVehicle) > 0 &&
    !!editMaintenance.maintenanceType.trim() &&
    MAINTENANCE_STATUSES.includes(editMaintenance.status);

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
    renderRowActions: ({ row }) => {
      const item = row.original;
      const canStart = item.STATUS !== 'Completed' && item.STATUS !== 'Cancelled';
      const canComplete = item.STATUS === 'Planned' || item.STATUS === 'In Progress';
      const canCancel = item.STATUS !== 'Completed' && item.STATUS !== 'Cancelled';

      return (
        <Stack direction="row" spacing={0.5}>
          <IconButton title={t('common.edit')} onClick={() => openEdit(item)}>
            <EditIcon />
          </IconButton>
          <IconButton title="Start" disabled={!canStart} onClick={() => void callStatusAction(item, 'start')}>
            <PlayArrowIcon />
          </IconButton>
          <IconButton title="Complete" disabled={!canComplete} onClick={() => void callStatusAction(item, 'complete')}>
            <CheckCircleIcon />
          </IconButton>
          <IconButton title="Cancel" disabled={!canCancel} onClick={() => void callStatusAction(item, 'cancel')}>
            <CancelIcon />
          </IconButton>
        </Stack>
      );
    },
  });

  return (
    <Box p={2}>
      <Card elevation={3}>
        <CardHeader
          title={
            <Stack direction="row" spacing={1.5} alignItems="center">
              <BuildIcon />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {t('nav.fleetMaintenance')}
              </Typography>
            </Stack>
          }
          subheader="Manage vehicle maintenance records and status workflow"
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
                placeholder="Search maintenance"
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
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ScheduleIcon color="warning" fontSize="small" />
              <Typography variant="body2">Due: {dueCount}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <WarningAmberIcon color="error" fontSize="small" />
              <Typography variant="body2">Overdue: {overdueCount}</Typography>
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
            <TextField
              size="small"
              label="Date"
              select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DatePreset)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Dates</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="lastweek">Last Week</MenuItem>
              <MenuItem value="lastmonth">Last Month</MenuItem>
              <MenuItem value="custom">Custom Date</MenuItem>
            </TextField>

            {datePreset === 'custom' && (
              <>
                <TextField
                  size="small"
                  label="From Date"
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 170 }}
                />
                <TextField
                  size="small"
                  label="To Date"
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 170 }}
                />
              </>
            )}

            <Autocomplete
              size="small"
              options={supplierFilterComboOptions}
              value={
                supplierFilterComboOptions.find((option) => option.value === supplierFilter) ||
                supplierFilterComboOptions[0]
              }
              onChange={(_event, option) => setSupplierFilter(option?.value ?? '')}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              getOptionLabel={(option) => option.label}
              sx={{ minWidth: 220 }}
              renderInput={(params) => <TextField {...params} label="Supplier" />}
            />

            <Autocomplete
              size="small"
              options={vehicleFilterComboOptions}
              value={
                vehicleFilterComboOptions.find((option) => option.value === vehicleFilter) ||
                vehicleFilterComboOptions[0]
              }
              onChange={(_event, option) => setVehicleFilter(option?.value ?? '')}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              filterOptions={vehicleAutocompleteFilter}
              getOptionLabel={(option) => option.label}
              renderOption={renderVehicleOptionAsTable}
              PaperComponent={VehicleOptionsPaper}
              ListboxProps={{ sx: { overflowX: 'hidden' } }}
              sx={{ width: { xs: '100%', md: 680 }, maxWidth: '100%' }}
              renderInput={(params) => <TextField {...params} label="Vehicle" />}
            />

            <TextField
              size="small"
              label="Status"
              select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="">All Status</MenuItem>
              {MAINTENANCE_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <MaterialReactTable table={table} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="md">
        <DialogTitle>{editMaintenance?.idMaintenance ? 'Edit Maintenance' : 'Add Maintenance'}</DialogTitle>
        <DialogContent dividers>
          {editMaintenance && (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                <Autocomplete
                  sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}
                  options={vehicleComboOptions}
                  value={
                    vehicleComboOptions.find((option) => option.value === editMaintenance.idVehicle) ??
                    null
                  }
                  onChange={(_event, option) =>
                    setEditMaintenance((prev) =>
                      prev
                        ? {
                            ...prev,
                            idVehicle: option?.value === '' || !option ? '' : Number(option.value),
                          }
                        : prev
                    )
                  }
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  filterOptions={vehicleAutocompleteFilter}
                  getOptionLabel={(option) => option.label}
                  renderOption={renderVehicleOptionAsTable}
                  PaperComponent={VehicleOptionsPaper}
                  ListboxProps={{ sx: { overflowX: 'hidden' } }}
                  renderInput={(params) => <TextField {...params} label="Vehicle" required fullWidth />}
                />

                <Autocomplete
                  options={supplierEditComboOptions}
                  value={
                    supplierEditComboOptions.find((option) => option.value === editMaintenance.idSupplier) ??
                    supplierEditComboOptions[0]
                  }
                  onChange={(_event, option) =>
                    setEditMaintenance((prev) =>
                      prev
                        ? {
                            ...prev,
                            idSupplier: option?.value === '' || !option ? '' : Number(option.value),
                          }
                        : prev
                    )
                  }
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  getOptionLabel={(option) => option.label}
                  renderInput={(params) => <TextField {...params} label="Supplier" fullWidth />}
                />

                <TextField
                  label="Maintenance Type"
                  value={editMaintenance.maintenanceType}
                  onChange={(e) =>
                    setEditMaintenance((prev) =>
                      prev ? { ...prev, maintenanceType: e.target.value } : prev
                    )
                  }
                  required
                  fullWidth
                />

                <TextField
                  label="Status"
                  select
                  value={editMaintenance.status}
                  onChange={(e) =>
                    setEditMaintenance((prev) => (prev ? { ...prev, status: e.target.value } : prev))
                  }
                  fullWidth
                >
                  {MAINTENANCE_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>

                <DatePicker
                  label="Start Date"
                  format="DD-MM-YYYY"
                  value={toPickerDate(editMaintenance.startDate)}
                  onChange={(value) =>
                    setEditMaintenance((prev) =>
                      prev ? { ...prev, startDate: fromPickerDate(value) } : prev
                    )
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />

                <DatePicker
                  label="End Date"
                  format="DD-MM-YYYY"
                  value={toPickerDate(editMaintenance.endDate)}
                  onChange={(value) =>
                    setEditMaintenance((prev) =>
                      prev ? { ...prev, endDate: fromPickerDate(value) } : prev
                    )
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />

                <DatePicker
                  label="Service Date"
                  value={toPickerDate(editMaintenance.serviceDate)}
                  onChange={(value) =>
                    setEditMaintenance((prev) =>
                      prev ? { ...prev, serviceDate: fromPickerDate(value) } : prev
                    )
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />

                <TextField
                  label="Mileage"
                  type="number"
                  value={editMaintenance.mileage}
                  onChange={(e) =>
                    setEditMaintenance((prev) =>
                      prev
                        ? {
                            ...prev,
                            mileage: e.target.value === '' ? '' : Number(e.target.value),
                          }
                        : prev
                    )
                  }
                  fullWidth
                />

                <TextField
                  label="Labor Cost"
                  type="number"
                  value={editMaintenance.laborCost}
                  onChange={(e) =>
                    setEditMaintenance((prev) =>
                      prev
                        ? {
                            ...prev,
                            laborCost: e.target.value === '' ? '' : Number(e.target.value),
                          }
                        : prev
                    )
                  }
                  fullWidth
                />

                <TextField
                  label="Parts Cost"
                  type="number"
                  value={editMaintenance.partsCost}
                  onChange={(e) =>
                    setEditMaintenance((prev) =>
                      prev
                        ? {
                            ...prev,
                            partsCost: e.target.value === '' ? '' : Number(e.target.value),
                          }
                        : prev
                    )
                  }
                  fullWidth
                />

                <DatePicker
                  label="Next Service Date"
                  value={toPickerDate(editMaintenance.nextServiceDate)}
                  onChange={(value) =>
                    setEditMaintenance((prev) =>
                      prev ? { ...prev, nextServiceDate: fromPickerDate(value) } : prev
                    )
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />

                <TextField
                  label="Next Service Mileage"
                  type="number"
                  value={editMaintenance.nextServiceMileage}
                  onChange={(e) =>
                    setEditMaintenance((prev) =>
                      prev
                        ? {
                            ...prev,
                            nextServiceMileage: e.target.value === '' ? '' : Number(e.target.value),
                          }
                        : prev
                    )
                  }
                  fullWidth
                />

                <TextField
                  label="Description"
                  value={editMaintenance.description}
                  onChange={(e) =>
                    setEditMaintenance((prev) => (prev ? { ...prev, description: e.target.value } : prev))
                  }
                  fullWidth
                  multiline
                  minRows={2}
                  sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}
                />

                <TextField
                  label="Work Performed"
                  value={editMaintenance.workPerformed}
                  onChange={(e) =>
                    setEditMaintenance((prev) =>
                      prev ? { ...prev, workPerformed: e.target.value } : prev
                    )
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
          <Button onClick={() => void saveMaintenance()} variant="contained" disabled={!canSave}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaintenancePage;
