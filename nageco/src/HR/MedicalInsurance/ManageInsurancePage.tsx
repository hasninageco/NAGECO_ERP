import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import InsuranceHeaderTitle from './InsuranceHeaderTitle';

type Section = 'services' | 'providers' | 'claims';

type Service = {
  ServiceId: number;
  ServiceCode: string;
  ServiceName: string;
  ServiceType: string;
  CoveragePercent: number;
  ValidFrom: string;
  ValidTo?: string | null;
  IsActive: boolean;
  Notes?: string | null;
  clinic_category?: string | null;
};

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

type Claim = {
  ClaimId: number;
  ClaimNo: string;
  Ref_emp: string;
  EMP_CHILD?: string | null;
  ProviderId?: number | null;
  ClaimDate: string;
  SubmissionDate?: string | null;
  ClaimType: string;
  Status: string;
  TotalClaimed: number;
  TotalApproved: number;
  CompanyShare: number;
  EmployeeShare: number;
  Notes?: string | null;
};

type Props = {
  section?: Section;
};

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

const todayIso = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const ManageInsurancePage: React.FC<Props> = ({ section = 'services' }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Section>(section);

  // keep tab in sync if route changes
  useEffect(() => {
    setTab(section);
  }, [section]);

  const tokenHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const servicesApi = buildApiUrl('/medicalInsurance/services');
  const providersApi = buildApiUrl('/medicalInsurance/providers');
  const claimsApi = buildApiUrl('/medicalInsurance/claims');

  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);

  const fetchCurrent = async () => {
    const headers = tokenHeader();
    if (!headers) return;

    setLoading(true);
    try {
      if (tab === 'services') {
        const resp = await axios.get<Service[]>(`${servicesApi}/all`, { headers });
        setServices(resp.data || []);
      } else if (tab === 'providers') {
        const resp = await axios.get<Provider[]>(`${providersApi}/all`, { headers });
        setProviders(resp.data || []);
      } else {
        const resp = await axios.get<Claim[]>(`${claimsApi}/all`, { headers });
        setClaims(resp.data || []);
      }
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/login');
      else console.error('Fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ---------- Services CRUD ----------
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [serviceEdit, setServiceEdit] = useState<Partial<Service> | null>(null);

  const openServiceAdd = () => {
    setServiceEdit({
      ServiceCode: '',
      ServiceName: '',
      ServiceType: '',
      clinic_category: '',
      CoveragePercent: 0,
      ValidFrom: todayIso(),
      ValidTo: null,
      IsActive: true,
      Notes: '',
    });
    setServiceDialogOpen(true);
  };

  const openServiceEdit = (s: Service) => {
    setServiceEdit({ ...s });
    setServiceDialogOpen(true);
  };

  const saveService = async () => {
    const headers = tokenHeader();
    if (!headers || !serviceEdit) return;

    const payload = {
      ServiceCode: serviceEdit.ServiceCode,
      ServiceName: serviceEdit.ServiceName,
      ServiceType: serviceEdit.ServiceType,
      clinic_category: serviceEdit.clinic_category,
      CoveragePercent: serviceEdit.CoveragePercent,
      ValidFrom: serviceEdit.ValidFrom,
      ValidTo: serviceEdit.ValidTo || null,
      IsActive: serviceEdit.IsActive,
      Notes: serviceEdit.Notes,
    };

    try {
      if (serviceEdit.ServiceId) {
        await axios.put(`${servicesApi}/Update/${serviceEdit.ServiceId}`, payload, { headers });
      } else {
        await axios.post(`${servicesApi}/Add`, payload, { headers });
      }
      setServiceDialogOpen(false);
      setServiceEdit(null);
      await fetchCurrent();
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/login');
      else {
        console.error('Save service error', err);
        alert('Failed to save service');
      }
    }
  };

  const deleteService = async (s: Service) => {
    const headers = tokenHeader();
    if (!headers) return;
    if (!window.confirm(`Delete service ${s.ServiceCode} — ${s.ServiceName}?`)) return;
    try {
      await axios.delete(`${servicesApi}/Delete/${s.ServiceId}`, { headers });
      await fetchCurrent();
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/login');
      else {
        console.error('Delete service error', err);
        alert('Failed to delete service');
      }
    }
  };

  const filteredServices = useMemo(() => {
    if (!query) return services;
    const q = query.toLowerCase();
    return services.filter((s) =>
      String(s.ServiceId).includes(q) ||
      (s.ServiceCode || '').toLowerCase().includes(q) ||
      (s.ServiceName || '').toLowerCase().includes(q) ||
      (s.ServiceType || '').toLowerCase().includes(q) ||
      (s.clinic_category || '').toLowerCase().includes(q) ||
      String(s.CoveragePercent ?? '').includes(q) ||
      (s.ValidFrom || '').toLowerCase().includes(q) ||
      (s.ValidTo || '').toLowerCase().includes(q) ||
      (s.Notes || '').toLowerCase().includes(q)
    );
  }, [services, query]);

  const servicesColumns = useMemo<MRT_ColumnDef<Service>[]>(
    () => [
      { accessorKey: 'ServiceId', header: 'ID', size: 60 },
      { accessorKey: 'ServiceCode', header: 'Code', size: 110 },
      { accessorKey: 'ServiceName', header: 'Name', size: 260 },
      { accessorKey: 'ServiceType', header: 'Type', size: 140 },
      { accessorKey: 'clinic_category', header: 'Clinic Category', size: 160 },
      { accessorKey: 'CoveragePercent', header: 'Coverage %', size: 120 },
      { accessorKey: 'ValidFrom', header: 'Valid From', size: 120 },
      { accessorKey: 'ValidTo', header: 'Valid To', size: 120 },
      { accessorKey: 'IsActive', header: 'Active', size: 80 },
      { accessorKey: 'Notes', header: 'Notes', size: 220 },
    ],
    []
  );

  const servicesTable = useMaterialReactTable({
    columns: servicesColumns,
    data: filteredServices,
    state: { isLoading: loading, density: 'comfortable' },
    enableDensityToggle: true,
    enableGlobalFilter: false,
    enableRowActions: true,
    positionActionsColumn: 'last',
    renderRowActions: ({ row }: any) => (
      <Stack direction="row" spacing={1}>
        <IconButton title="Edit" onClick={() => openServiceEdit(row.original)}>
          <EditIcon />
        </IconButton>
        <IconButton title="Delete" onClick={() => deleteService(row.original)}>
          <DeleteIcon />
        </IconButton>
      </Stack>
    ),
  });

  const canSaveService =
    !!serviceEdit &&
    !!serviceEdit.ServiceCode &&
    !!serviceEdit.ServiceName &&
    !!serviceEdit.ServiceType &&
    serviceEdit.CoveragePercent !== undefined &&
    !!serviceEdit.ValidFrom;

  // ---------- Providers CRUD ----------
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [providerEdit, setProviderEdit] = useState<Partial<Provider> | null>(null);

  const openProviderAdd = () => {
    setProviderEdit({
      ProviderCode: '',
      ProviderName: '',
      ProviderType: '',
      City: '',
      Address: '',
      Phone: '',
      IsActive: true,
    });
    setProviderDialogOpen(true);
  };

  const openProviderEdit = (p: Provider) => {
    setProviderEdit({ ...p });
    setProviderDialogOpen(true);
  };

  const saveProvider = async () => {
    const headers = tokenHeader();
    if (!headers || !providerEdit) return;

    const payload = {
      ProviderCode: providerEdit.ProviderCode,
      ProviderName: providerEdit.ProviderName,
      ProviderType: providerEdit.ProviderType,
      City: providerEdit.City,
      Address: providerEdit.Address,
      Phone: providerEdit.Phone,
      IsActive: providerEdit.IsActive,
    };

    try {
      if (providerEdit.ProviderId) {
        await axios.put(`${providersApi}/Update/${providerEdit.ProviderId}`, payload, { headers });
      } else {
        await axios.post(`${providersApi}/Add`, payload, { headers });
      }
      setProviderDialogOpen(false);
      setProviderEdit(null);
      await fetchCurrent();
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/login');
      else {
        console.error('Save provider error', err);
        alert('Failed to save provider');
      }
    }
  };

  const deleteProvider = async (p: Provider) => {
    const headers = tokenHeader();
    if (!headers) return;
    if (!window.confirm(`Delete provider ${p.ProviderCode} — ${p.ProviderName}?`)) return;
    try {
      await axios.delete(`${providersApi}/Delete/${p.ProviderId}`, { headers });
      await fetchCurrent();
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/login');
      else {
        console.error('Delete provider error', err);
        alert('Failed to delete provider');
      }
    }
  };

  const filteredProviders = useMemo(() => {
    if (!query) return providers;
    const q = query.toLowerCase();
    return providers.filter((p) =>
      String(p.ProviderId).includes(q) ||
      (p.ProviderCode || '').toLowerCase().includes(q) ||
      (p.ProviderName || '').toLowerCase().includes(q) ||
      (p.ProviderType || '').toLowerCase().includes(q) ||
      (p.City || '').toLowerCase().includes(q) ||
      (p.Phone || '').toLowerCase().includes(q)
    );
  }, [providers, query]);

  const providersColumns = useMemo<MRT_ColumnDef<Provider>[]>(
    () => [
      { accessorKey: 'ProviderId', header: 'ID', size: 60 },
      { accessorKey: 'ProviderCode', header: 'Code', size: 110 },
      { accessorKey: 'ProviderName', header: 'Name', size: 260 },
      { accessorKey: 'ProviderType', header: 'Type', size: 140 },
      { accessorKey: 'City', header: 'City', size: 140 },
      { accessorKey: 'Phone', header: 'Phone', size: 140 },
      { accessorKey: 'IsActive', header: 'Active', size: 80 },
      { accessorKey: 'Address', header: 'Address', size: 260 },
    ],
    []
  );

  const providersTable = useMaterialReactTable({
    columns: providersColumns,
    data: filteredProviders,
    state: { isLoading: loading, density: 'comfortable' },
    enableDensityToggle: true,
    enableGlobalFilter: false,
    enableRowActions: true,
    positionActionsColumn: 'last',
    renderRowActions: ({ row }: any) => (
      <Stack direction="row" spacing={1}>
        <IconButton title="Edit" onClick={() => openProviderEdit(row.original)}>
          <EditIcon />
        </IconButton>
        <IconButton title="Delete" onClick={() => deleteProvider(row.original)}>
          <DeleteIcon />
        </IconButton>
      </Stack>
    ),
  });

  const canSaveProvider = !!providerEdit && !!providerEdit.ProviderCode && !!providerEdit.ProviderName && !!providerEdit.ProviderType;

  // ---------- Claims CRUD ----------
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claimEdit, setClaimEdit] = useState<Partial<Claim> | null>(null);

  const openClaimAdd = () => {
    setClaimEdit({
      ClaimNo: '',
      Ref_emp: '',
      EMP_CHILD: null,
      ProviderId: null,
      ClaimDate: todayIso(),
      SubmissionDate: null,
      ClaimType: 'Direct',
      Status: 'Draft',
      TotalClaimed: 0,
      TotalApproved: 0,
      CompanyShare: 0,
      EmployeeShare: 0,
      Notes: '',
    });
    setClaimDialogOpen(true);
  };

  const openClaimEdit = (c: Claim) => {
    setClaimEdit({ ...c });
    setClaimDialogOpen(true);
  };

  const saveClaim = async () => {
    const headers = tokenHeader();
    if (!headers || !claimEdit) return;

    const payload = {
      ClaimNo: claimEdit.ClaimNo,
      Ref_emp: claimEdit.Ref_emp,
      EMP_CHILD: claimEdit.EMP_CHILD,
      ProviderId: claimEdit.ProviderId,
      ClaimDate: claimEdit.ClaimDate,
      SubmissionDate: claimEdit.SubmissionDate,
      ClaimType: claimEdit.ClaimType,
      Status: claimEdit.Status,
      TotalClaimed: claimEdit.TotalClaimed,
      TotalApproved: claimEdit.TotalApproved,
      CompanyShare: claimEdit.CompanyShare,
      EmployeeShare: claimEdit.EmployeeShare,
      Notes: claimEdit.Notes,
    };

    try {
      if (claimEdit.ClaimId) {
        await axios.put(`${claimsApi}/Update/${claimEdit.ClaimId}`, payload, { headers });
      } else {
        await axios.post(`${claimsApi}/Add`, payload, { headers });
      }
      setClaimDialogOpen(false);
      setClaimEdit(null);
      await fetchCurrent();
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/login');
      else {
        console.error('Save claim error', err);
        alert('Failed to save claim');
      }
    }
  };

  const deleteClaim = async (c: Claim) => {
    const headers = tokenHeader();
    if (!headers) return;
    if (!window.confirm(`Delete claim ${c.ClaimNo}?`)) return;
    try {
      await axios.delete(`${claimsApi}/Delete/${c.ClaimId}`, { headers });
      await fetchCurrent();
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/login');
      else {
        console.error('Delete claim error', err);
        alert('Failed to delete claim');
      }
    }
  };

  const filteredClaims = useMemo(() => {
    if (!query) return claims;
    const q = query.toLowerCase();
    return claims.filter((c) =>
      String(c.ClaimId).includes(q) ||
      (c.ClaimNo || '').toLowerCase().includes(q) ||
      (c.Ref_emp || '').toLowerCase().includes(q) ||
      (c.ClaimType || '').toLowerCase().includes(q) ||
      (c.Status || '').toLowerCase().includes(q) ||
      (c.ClaimDate || '').toLowerCase().includes(q)
    );
  }, [claims, query]);

  const claimsColumns = useMemo<MRT_ColumnDef<Claim>[]>(
    () => [
      { accessorKey: 'ClaimId', header: 'ID', size: 70 },
      { accessorKey: 'ClaimNo', header: 'Claim No', size: 140 },
      { accessorKey: 'Ref_emp', header: 'Employee No', size: 120 },
      { accessorKey: 'ProviderId', header: 'Provider', size: 90 },
      { accessorKey: 'ClaimDate', header: 'Claim Date', size: 120 },
      { accessorKey: 'ClaimType', header: 'Type', size: 120 },
      { accessorKey: 'Status', header: 'Status', size: 110 },
      { accessorKey: 'TotalClaimed', header: 'Claimed', size: 110 },
      { accessorKey: 'TotalApproved', header: 'Approved', size: 110 },
      { accessorKey: 'CompanyShare', header: 'Company', size: 110 },
      { accessorKey: 'EmployeeShare', header: 'Employee', size: 110 },
      { accessorKey: 'Notes', header: 'Notes', size: 200 },
    ],
    []
  );

  const claimsTable = useMaterialReactTable({
    columns: claimsColumns,
    data: filteredClaims,
    state: { isLoading: loading, density: 'comfortable' },
    enableDensityToggle: true,
    enableGlobalFilter: false,
    enableRowActions: true,
    positionActionsColumn: 'last',
    renderRowActions: ({ row }: any) => (
      <Stack direction="row" spacing={1}>
        <IconButton title="Edit" onClick={() => openClaimEdit(row.original)}>
          <EditIcon />
        </IconButton>
        <IconButton title="Delete" onClick={() => deleteClaim(row.original)}>
          <DeleteIcon />
        </IconButton>
      </Stack>
    ),
  });

  const canSaveClaim = !!claimEdit && !!claimEdit.ClaimNo && !!claimEdit.Ref_emp && !!claimEdit.ClaimDate && !!claimEdit.ClaimType;

  // ---------- UI ----------
  const title = tab === 'services' ? 'Medical Insurance — Services' : tab === 'providers' ? 'Medical Insurance — Providers' : 'Medical Insurance — Claims';
  const newLabel = tab === 'services' ? 'New Service' : tab === 'providers' ? 'New Provider' : 'New Claim';

  const onNew = () => {
    if (tab === 'services') openServiceAdd();
    else if (tab === 'providers') openProviderAdd();
    else openClaimAdd();
  };

  return (
    <Box p={2}>
      <Card elevation={3}>
        <CardHeader
          title={<InsuranceHeaderTitle title={title} />}
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
                sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
              />
              <IconButton aria-label="refresh" onClick={() => fetchCurrent()}>
                <RefreshIcon />
              </IconButton>
              <Button variant="contained" startIcon={<AddIcon />} onClick={onNew}>
                {newLabel}
              </Button>
            </Stack>
          }
        />
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Services" value="services" />
            <Tab label="Providers" value="providers" />
            <Tab label="Claims" value="claims" />
          </Tabs>

          {tab === 'services' && <MaterialReactTable table={servicesTable} />}
          {tab === 'providers' && <MaterialReactTable table={providersTable} />}
          {tab === 'claims' && <MaterialReactTable table={claimsTable} />}
        </CardContent>
      </Card>

      {/* Services dialog */}
      <Dialog open={serviceDialogOpen} onClose={() => setServiceDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{serviceEdit?.ServiceId ? 'Edit Service' : 'New Service'}</DialogTitle>
        <DialogContent dividers>
          {serviceEdit && (
            <div style={{ display: 'grid', gap: 12 }}>
              <TextField label="Service Code" value={serviceEdit.ServiceCode ?? ''} onChange={(e) => setServiceEdit((p) => ({ ...(p ?? {}), ServiceCode: e.target.value }))} fullWidth />
              <TextField label="Service Name" value={serviceEdit.ServiceName ?? ''} onChange={(e) => setServiceEdit((p) => ({ ...(p ?? {}), ServiceName: e.target.value }))} fullWidth />
              <Autocomplete
                freeSolo
                options={SERVICE_TYPE_OPTIONS}
                value={String(serviceEdit.ServiceType ?? '')}
                onChange={(_, value) => setServiceEdit((p) => ({ ...(p ?? {}), ServiceType: String(value ?? '') }))}
                onInputChange={(_, value) => setServiceEdit((p) => ({ ...(p ?? {}), ServiceType: String(value ?? '') }))}
                renderOption={(props, option) => (
                  <li {...props}>
                    {option}
                    {SERVICE_TYPE_AR[option] ? ` — ${SERVICE_TYPE_AR[option]}` : ''}
                  </li>
                )}
                renderInput={(params) => <TextField {...params} label="Service Type / نوع الخدمة" fullWidth />}
              />
              <Autocomplete
                freeSolo
                options={CLINIC_CATEGORIES}
                value={String(serviceEdit.clinic_category ?? '')}
                onChange={(_, value) => setServiceEdit((p) => ({ ...(p ?? {}), clinic_category: String(value ?? '') }))}
                onInputChange={(_, value) => setServiceEdit((p) => ({ ...(p ?? {}), clinic_category: String(value ?? '') }))}
                renderOption={(props, option) => (
                  <li {...props}>
                    {option}
                    {CLINIC_CATEGORIES_AR[option] ? ` — ${CLINIC_CATEGORIES_AR[option]}` : ''}
                  </li>
                )}
                renderInput={(params) => <TextField {...params} label="Clinic Category / تخصص العيادة" fullWidth />}
              />
              <TextField label="Coverage Percent" type="number" value={serviceEdit.CoveragePercent ?? 0} onChange={(e) => setServiceEdit((p) => ({ ...(p ?? {}), CoveragePercent: e.target.value === '' ? 0 : Number(e.target.value) }))} fullWidth />
              <TextField label="Valid From" type="date" value={(serviceEdit.ValidFrom as any) ?? ''} onChange={(e) => setServiceEdit((p) => ({ ...(p ?? {}), ValidFrom: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="Valid To" type="date" value={(serviceEdit.ValidTo as any) ?? ''} onChange={(e) => setServiceEdit((p) => ({ ...(p ?? {}), ValidTo: e.target.value ? e.target.value : null }))} InputLabelProps={{ shrink: true }} fullWidth />
              <FormControlLabel control={<Checkbox checked={!!serviceEdit.IsActive} onChange={(e) => setServiceEdit((p) => ({ ...(p ?? {}), IsActive: e.target.checked }))} />} label="Active" />
              <TextField label="Notes" value={serviceEdit.Notes ?? ''} onChange={(e) => setServiceEdit((p) => ({ ...(p ?? {}), Notes: e.target.value }))} fullWidth multiline minRows={2} />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setServiceDialogOpen(false); setServiceEdit(null); }} color="secondary">Cancel</Button>
          <Button onClick={saveService} variant="contained" disabled={!canSaveService}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Providers dialog */}
      <Dialog open={providerDialogOpen} onClose={() => setProviderDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{providerEdit?.ProviderId ? 'Edit Provider' : 'New Provider'}</DialogTitle>
        <DialogContent dividers>
          {providerEdit && (
            <div style={{ display: 'grid', gap: 12 }}>
              <TextField label="Provider Code" value={providerEdit.ProviderCode ?? ''} onChange={(e) => setProviderEdit((p) => ({ ...(p ?? {}), ProviderCode: e.target.value }))} fullWidth />
              <TextField label="Provider Name" value={providerEdit.ProviderName ?? ''} onChange={(e) => setProviderEdit((p) => ({ ...(p ?? {}), ProviderName: e.target.value }))} fullWidth />
              <TextField label="Provider Type" value={providerEdit.ProviderType ?? ''} onChange={(e) => setProviderEdit((p) => ({ ...(p ?? {}), ProviderType: e.target.value }))} fullWidth />
              <TextField label="City" value={providerEdit.City ?? ''} onChange={(e) => setProviderEdit((p) => ({ ...(p ?? {}), City: e.target.value }))} fullWidth />
              <TextField label="Phone" value={providerEdit.Phone ?? ''} onChange={(e) => setProviderEdit((p) => ({ ...(p ?? {}), Phone: e.target.value }))} fullWidth />
              <TextField label="Address" value={providerEdit.Address ?? ''} onChange={(e) => setProviderEdit((p) => ({ ...(p ?? {}), Address: e.target.value }))} fullWidth />
              <FormControlLabel control={<Checkbox checked={!!providerEdit.IsActive} onChange={(e) => setProviderEdit((p) => ({ ...(p ?? {}), IsActive: e.target.checked }))} />} label="Active" />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setProviderDialogOpen(false); setProviderEdit(null); }} color="secondary">Cancel</Button>
          <Button onClick={saveProvider} variant="contained" disabled={!canSaveProvider}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Claims dialog */}
      <Dialog open={claimDialogOpen} onClose={() => setClaimDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{claimEdit?.ClaimId ? 'Edit Claim' : 'New Claim'}</DialogTitle>
        <DialogContent dividers>
          {claimEdit && (
            <div style={{ display: 'grid', gap: 12 }}>
              <TextField label="Claim No" value={claimEdit.ClaimNo ?? ''} onChange={(e) => setClaimEdit((p) => ({ ...(p ?? {}), ClaimNo: e.target.value }))} fullWidth />
              <TextField label="Employee No" value={claimEdit.Ref_emp ?? ''} onChange={(e) => setClaimEdit((p) => ({ ...(p ?? {}), Ref_emp: e.target.value }))} fullWidth />
              <TextField label="Child Ref (optional)" value={claimEdit.EMP_CHILD ?? ''} onChange={(e) => setClaimEdit((p) => ({ ...(p ?? {}), EMP_CHILD: e.target.value || null }))} fullWidth />
              <TextField label="ProviderId (optional)" type="number" value={claimEdit.ProviderId ?? ''} onChange={(e) => setClaimEdit((p) => ({ ...(p ?? {}), ProviderId: e.target.value === '' ? null : Number(e.target.value) }))} fullWidth />
              <TextField label="Claim Date" type="date" value={(claimEdit.ClaimDate as any) ?? ''} onChange={(e) => setClaimEdit((p) => ({ ...(p ?? {}), ClaimDate: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="Claim Type" value={claimEdit.ClaimType ?? ''} onChange={(e) => setClaimEdit((p) => ({ ...(p ?? {}), ClaimType: e.target.value }))} fullWidth />
              <TextField label="Status" value={claimEdit.Status ?? ''} onChange={(e) => setClaimEdit((p) => ({ ...(p ?? {}), Status: e.target.value }))} fullWidth />
              <TextField label="Total Claimed" type="number" value={claimEdit.TotalClaimed ?? 0} onChange={(e) => setClaimEdit((p) => ({ ...(p ?? {}), TotalClaimed: e.target.value === '' ? 0 : Number(e.target.value) }))} fullWidth />
              <TextField label="Total Approved" type="number" value={claimEdit.TotalApproved ?? 0} onChange={(e) => setClaimEdit((p) => ({ ...(p ?? {}), TotalApproved: e.target.value === '' ? 0 : Number(e.target.value) }))} fullWidth />
              <TextField label="Company Share" type="number" value={claimEdit.CompanyShare ?? 0} onChange={(e) => setClaimEdit((p) => ({ ...(p ?? {}), CompanyShare: e.target.value === '' ? 0 : Number(e.target.value) }))} fullWidth />
              <TextField label="Employee Share" type="number" value={claimEdit.EmployeeShare ?? 0} onChange={(e) => setClaimEdit((p) => ({ ...(p ?? {}), EmployeeShare: e.target.value === '' ? 0 : Number(e.target.value) }))} fullWidth />
              <TextField label="Notes" value={claimEdit.Notes ?? ''} onChange={(e) => setClaimEdit((p) => ({ ...(p ?? {}), Notes: e.target.value }))} fullWidth multiline minRows={2} />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setClaimDialogOpen(false); setClaimEdit(null); }} color="secondary">Cancel</Button>
          <Button onClick={saveClaim} variant="contained" disabled={!canSaveClaim}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageInsurancePage;
