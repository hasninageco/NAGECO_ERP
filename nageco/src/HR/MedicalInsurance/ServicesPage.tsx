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
  Autocomplete,
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

type Service = {
  ServiceId: number;
  ServiceCode: string;
  ServiceName: string;
  ArabicName?: string | null;
  ServiceType: string;
  CoveragePercent: number;
  ValidFrom: string;
  ValidTo?: string | null;
  IsActive: boolean;
  Notes?: string | null;
  clinic_category?: string | null;
};

type EditService = Partial<Service>;

const CLINIC_CATEGORIES: string[] = [
  'General Practice',
  'Family Medicine',
  'Internal Medicine',
  'Pediatrics',
  'Neonatology',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Psychiatry',
  'Psychology',
  'Orthopedics',
  'Rheumatology',
  'Ophthalmology',
  'Optometry',
  'ENT (Ear, Nose and Throat)',
  'Pulmonology',
  'Gastroenterology',
  'Endocrinology',
  'Nephrology',
  'Urology',
  'Gynecology',
  'Obstetrics',
  'Oncology',
  'Hematology',
  'Infectious Diseases',
  'Allergy and Immunology',
  'Anesthesiology',
  'Radiology',
  'Nuclear Medicine',
  'Pathology',
  'Plastic Surgery',
  'General Surgery',
  'Vascular Surgery',
  'Thoracic Surgery',
  'Neurosurgery',
  'Pediatric Surgery',
  'Physical Therapy',
  'Rehabilitation Medicine',
  'Sports Medicine',
  'Emergency Medicine',
  'Pain Management',
  'Geriatrics',
  'Dentistry',
  'Oral and Maxillofacial Surgery',
  'Chiropractic',
  'Dietetics / Nutrition',
  'Speech Therapy',
  'Occupational Therapy',
];

const CLINIC_CATEGORIES_AR: Record<string, string> = {
  'General Practice': 'طب عام',
  'Family Medicine': 'طب الأسرة',
  'Internal Medicine': 'طب باطني',
  Pediatrics: 'طب الأطفال',
  Neonatology: 'طب حديثي الولادة',
  Cardiology: 'أمراض القلب',
  Dermatology: 'الأمراض الجلدية',
  Neurology: 'طب الأعصاب',
  Psychiatry: 'الطب النفسي',
  Psychology: 'علم النفس',
  Orthopedics: 'جراحة العظام',
  Rheumatology: 'أمراض الروماتيزم',
  Ophthalmology: 'طب العيون',
  Optometry: 'قياس البصر',
  'ENT (Ear, Nose and Throat)': 'أنف وأذن وحنجرة',
  Pulmonology: 'أمراض الصدر والرئة',
  Gastroenterology: 'أمراض الجهاز الهضمي',
  Endocrinology: 'الغدد الصماء',
  Nephrology: 'أمراض الكلى',
  Urology: 'المسالك البولية',
  Gynecology: 'أمراض النساء',
  Obstetrics: 'التوليد',
  Oncology: 'طب الأورام',
  Hematology: 'أمراض الدم',
  'Infectious Diseases': 'الأمراض المعدية',
  'Allergy and Immunology': 'الحساسية والمناعة',
  Anesthesiology: 'التخدير',
  Radiology: 'الأشعة',
  'Nuclear Medicine': 'الطب النووي',
  Pathology: 'علم الأمراض',
  'Plastic Surgery': 'جراحة التجميل',
  'General Surgery': 'الجراحة العامة',
  'Vascular Surgery': 'جراحة الأوعية الدموية',
  'Thoracic Surgery': 'جراحة الصدر',
  Neurosurgery: 'جراحة الأعصاب',
  'Pediatric Surgery': 'جراحة الأطفال',
  'Physical Therapy': 'العلاج الطبيعي',
  'Rehabilitation Medicine': 'طب التأهيل',
  'Sports Medicine': 'طب الرياضة',
  'Emergency Medicine': 'طب الطوارئ',
  'Pain Management': 'علاج الألم',
  Geriatrics: 'طب الشيخوخة',
  Dentistry: 'طب الأسنان',
  'Oral and Maxillofacial Surgery': 'جراحة الفم والوجه والفكين',
  Chiropractic: 'تقويم العمود الفقري',
  'Dietetics / Nutrition': 'التغذية العلاجية / التغذية',
  'Speech Therapy': 'علاج النطق',
  'Occupational Therapy': 'العلاج الوظيفي',
};

const SERVICE_TYPE_OPTIONS: string[] = [
  'Hospital',
  'Clinic',
  'Pharmacy',
  'Laboratory',
  'Radiology / Imaging',
  'Dental',
];

const SERVICE_TYPE_AR: Record<string, string> = {
  Hospital: 'مستشفى',
  Clinic: 'عيادة',
  Pharmacy: 'صيدلية',
  Laboratory: 'مختبر',
  'Radiology / Imaging': 'أشعة / تصوير طبي',
  Dental: 'أسنان',
};

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

const todayIso = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

type Props = {
  onBack?: () => void;
};

const ServicesPage: React.FC<Props> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editService, setEditService] = useState<EditService | null>(null);

  const navigate = useNavigate();
  const apiUrl = buildApiUrl('/medicalInsurance/services');

  const withAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  const fetchData = async () => {
    const headers = withAuth();
    if (!headers) return;

    setLoading(true);
    try {
      const resp = await axios.get<Service[]>(`${apiUrl}/all`, { headers });
      const rows: any[] = (resp.data as any[]) || [];
      setData(
        rows.map((s) => ({
          ...s,
          IsActive: toBoolean(s.IsActive),
        }))
      );
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/');
      else console.error('Error fetching services', err);
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
    return data.filter((s) => {
      return (
        String(s.ServiceId).includes(q) ||
        (s.ServiceCode || '').toLowerCase().includes(q) ||
        (s.ServiceName || '').toLowerCase().includes(q) ||
        (s.ArabicName || '').toLowerCase().includes(q) ||
        (s.ServiceType || '').toLowerCase().includes(q) ||
        (s.clinic_category || '').toLowerCase().includes(q) ||
        String(s.CoveragePercent ?? '').toLowerCase().includes(q) ||
        (s.ValidFrom || '').toLowerCase().includes(q) ||
        (s.ValidTo || '').toLowerCase().includes(q) ||
        (s.Notes || '').toLowerCase().includes(q)
      );
    });
  }, [data, query]);

  const columns = useMemo<MRT_ColumnDef<Service>[]>(
    () => [
      { accessorKey: 'ServiceId', header: t('insurance.services.cols.id'), size: 60 },
      { accessorKey: 'ServiceCode', header: t('insurance.services.cols.code'), size: 100 },
      { accessorKey: 'ServiceName', header: t('insurance.services.cols.englishName'), size: 240 },
      { accessorKey: 'ArabicName', header: t('insurance.services.cols.arabicName'), size: 220 },
      { accessorKey: 'ServiceType', header: t('insurance.services.cols.type'), size: 120 },
      { accessorKey: 'clinic_category', header: t('insurance.services.cols.clinicCategory'), size: 150 },
      { accessorKey: 'CoveragePercent', header: t('insurance.services.cols.coverage'), size: 110 },
      { accessorKey: 'ValidFrom', header: t('insurance.services.cols.validFrom'), size: 120 },
      { accessorKey: 'ValidTo', header: t('insurance.services.cols.validTo'), size: 120 },
      {
        accessorKey: 'IsActive',
        header: t('insurance.services.cols.active'),
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
      { accessorKey: 'Notes', header: t('insurance.services.cols.notes'), size: 200 },
    ],
    [t]
  );

  const openAdd = () => {
    setEditService({
      ServiceCode: '',
      ServiceName: '',
      ArabicName: '',
      ServiceType: '',
      clinic_category: '',
      CoveragePercent: 0,
      ValidFrom: todayIso(),
      ValidTo: null,
      IsActive: true,
      Notes: '',
    });
    setEditOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditService({ ...service });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditService(null);
  };

  const save = async () => {
    const headers = withAuth();
    if (!headers) return;
    if (!editService) return;

    const payload = {
      ServiceCode: editService.ServiceCode,
      ServiceName: editService.ServiceName,
      ArabicName: editService.ArabicName,
      ServiceType: editService.ServiceType,
      clinic_category: editService.clinic_category,
      CoveragePercent: editService.CoveragePercent,
      ValidFrom: editService.ValidFrom,
      ValidTo: editService.ValidTo || null,
      IsActive: editService.IsActive,
      Notes: editService.Notes,
    };

    try {
      if (editService.ServiceId) {
        await axios.put(`${apiUrl}/Update/${editService.ServiceId}`, payload, { headers });
      } else {
        await axios.post(`${apiUrl}/Add`, payload, { headers });
      }
      closeEdit();
      await fetchData();
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/');
      else {
        console.error('Error saving service', err);
        alert(t('insurance.services.failedSave'));
      }
    }
  };

  const remove = async (service: Service) => {
    const headers = withAuth();
    if (!headers) return;
    const ok = window.confirm(
      t('insurance.services.confirmDelete', {
        code: service.ServiceCode,
        name: service.ServiceName,
      })
    );
    if (!ok) return;

    try {
      await axios.delete(`${apiUrl}/Delete/${service.ServiceId}`, { headers });
      await fetchData();
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/');
      else {
        console.error('Error deleting service', err);
        alert(t('insurance.services.failedDelete'));
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

  const canSave =
    !!editService &&
    !!editService.ServiceCode &&
    !!editService.ServiceName &&
    !!editService.ServiceType &&
    editService.CoveragePercent !== undefined &&
    !!editService.ValidFrom;

  return (
    <Box p={2}>
      <Card elevation={3}>
        <CardHeader
          title={<InsuranceHeaderTitle title={t('insurance.services.pageTitle')} />}
          subheader={t('insurance.services.subheader')}
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
                placeholder={t('insurance.services.searchPlaceholder')}
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
                {t('insurance.services.newService')}
              </Button>
            </Stack>
          }
        />
        <CardContent>
          <MaterialReactTable table={table} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>
          {editService?.ServiceId ? t('insurance.services.editService') : t('insurance.services.newService')}
        </DialogTitle>
        <DialogContent dividers>
          {editService && (
            <div style={{ display: 'grid', gap: 12 }}>
              <TextField
                label={t('insurance.services.fields.serviceCode')}
                value={editService.ServiceCode ?? ''}
                onChange={(e) => setEditService((p) => ({ ...(p ?? {}), ServiceCode: e.target.value }))}
                fullWidth
              />
              <TextField
                label={t('insurance.services.fields.serviceName')}
                value={editService.ServiceName ?? ''}
                onChange={(e) => setEditService((p) => ({ ...(p ?? {}), ServiceName: e.target.value }))}
                fullWidth
              />
              <TextField
                label={t('insurance.services.fields.arabicName')}
                value={editService.ArabicName ?? ''}
                onChange={(e) => setEditService((p) => ({ ...(p ?? {}), ArabicName: e.target.value }))}
                fullWidth
              />
              <Autocomplete
                freeSolo
                options={SERVICE_TYPE_OPTIONS}
                value={String(editService.ServiceType ?? '')}
                onChange={(_, value) => setEditService((p) => ({ ...(p ?? {}), ServiceType: String(value ?? '') }))}
                onInputChange={(_, value) => setEditService((p) => ({ ...(p ?? {}), ServiceType: String(value ?? '') }))}
                renderOption={(props, option) => (
                  <li {...props}>
                    {option}
                    {SERVICE_TYPE_AR[option] ? ` — ${SERVICE_TYPE_AR[option]}` : ''}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label={t('insurance.services.fields.serviceType')} fullWidth />
                )}
              />
              <Autocomplete
                freeSolo
                options={CLINIC_CATEGORIES}
                value={String(editService.clinic_category ?? '')}
                onChange={(_, value) => setEditService((p) => ({ ...(p ?? {}), clinic_category: String(value ?? '') }))}
                onInputChange={(_, value) => setEditService((p) => ({ ...(p ?? {}), clinic_category: String(value ?? '') }))}
                renderOption={(props, option) => (
                  <li {...props}>
                    {option}
                    {CLINIC_CATEGORIES_AR[option] ? ` — ${CLINIC_CATEGORIES_AR[option]}` : ''}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label={t('insurance.services.fields.clinicCategory')} fullWidth />
                )}
              />
              <TextField
                label={t('insurance.services.fields.coveragePercent')}
                type="number"
                value={editService.CoveragePercent ?? 0}
                onChange={(e) =>
                  setEditService((p) => ({
                    ...(p ?? {}),
                    CoveragePercent: e.target.value === '' ? 0 : Number(e.target.value),
                  }))
                }
                fullWidth
              />
              <TextField
                label={t('insurance.services.fields.validFrom')}
                type="date"
                value={(editService.ValidFrom as any) ?? ''}
                onChange={(e) => setEditService((p) => ({ ...(p ?? {}), ValidFrom: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label={t('insurance.services.fields.validTo')}
                type="date"
                value={(editService.ValidTo as any) ?? ''}
                onChange={(e) =>
                  setEditService((p) => ({
                    ...(p ?? {}),
                    ValidTo: e.target.value ? e.target.value : null,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!editService.IsActive}
                    onChange={(e) => setEditService((p) => ({ ...(p ?? {}), IsActive: e.target.checked }))}
                  />
                }
                label={t('insurance.services.fields.active')}
              />
              <TextField
                label={t('insurance.services.fields.notes')}
                value={editService.Notes ?? ''}
                onChange={(e) => setEditService((p) => ({ ...(p ?? {}), Notes: e.target.value }))}
                fullWidth
                multiline
                minRows={2}
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

export default ServicesPage;
