import React from 'react';
import axios from 'axios';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../utils/api';

type EmployeeRow = {
  ID_EMP: number;
  [key: string]: unknown;
};

type EmployeeFormState = Record<string, string>;

const ALL_EMPLOYEE_FIELDS = [
  'NAME', 'ADRESS', 'TEL', 'MAIL', 'COMMENT', 'STAR_CONTRAT', 'End_contrat', 'Civilite', 'Nationality',
  'nbr_enfant', 'Ref_emp', 'id_bonus', 'banque', 'investissement', 'num_finance', 'type_de_recrutement',
  'Degree', 'nbr_marabit', 'type_assurance', 'num_assurance', 'numero_compte',
  'exclusion_tax_assurance_solidarite', 'date_naissance', 'wife_state', 'nom_mere', 'nom_perede_mere',
  'nom_grandpere_pere', 'adrtesse_naissance', 'num_CIN', 'JIHAET_ISDAR_CARTE', 'NUM_LIVRE_DE_FAMILLE',
  'JIHET_ISDAR_LIVRE', 'NUM_PAGE_LIVRE', 'NUM_PAGE_FAMILLE', 'NUM_PASSPORT', 'JIHET_ISDAR_PASSPORT',
  'TYPE_DE_TRAVAILLE', 'ETAT_ACTUELLE', 'NBR_JOUR_CONGEE', 'SOLDE_JOUR_CONGEE', 'JIHET_NADB', 'DATE_NADB',
  'SEXE', 'adresse_isdar_CIN', 'type_song', 'num_permis', 'certificat_medicale', 'end_date_cert_medicale',
  'nidham_3amal', 'name_english', 'Situation_du_travail', 'CERTIFICAT_SCIENTIFIQUE', 'num_administration',
  'Num_class', 'num_job', 'salaire_de_base', 'kiyada', 'ichrafiya', 'fenniya', 'type_de_travail',
  'permission', 'Voyage', 'khazina', 'Formation', 'Famille', 'responsabilite', 'experience', 'residence',
  'nadb', 'tamyiiz', 'STATE', 'NUM_NATIONAL', 'NIVEAU_CANDIDAT', 'DATE_DEGREE', 'specialite',
  'NUMERO_ANCIEN2', 'NUMERO_ANCIEN3', 'NUMERO_ANCIEN4', 'NUMERO_ANCIEN5', 'date_akd_mouwaten', 'refff',
  'IS_FOREINGHT', 'SALAIRE_ANCIEN', 'start_contrat_renouvellable', 'JOB_1', 'JOB_2', 'JOB_3', 'JOB_4',
  'JOB_5', 'DATE_TAKHARROJ', 'TYPE_EMP', 'TYPE_KARAR', 'CERTIFICAT_SCIENTIFIQUE_2007', 'DEGREE_2007',
  'NUM_JOB_EGALISEE', 'SALAIRE_2007', 'TYPE_TRAVAIL_WARDIA', 'DATE_END_PASSPORT', 'ZONNE', 'IS_EMPRENTED',
  'rasid_CONGE', 'solde_khibra', 'type_emp_congee', 'year_suppliment', 'date_year_suppliment',
  'PERIOD_CONTRACT', 'CAUSE_END_CONTRACT', 'degree_employee', 'NIVEAU_CANDIDAT_employee', 'attached_number',
  'IS_OK_POUR_MALAK', 'Date_mochref', 'Mochref', 'COMMENT_ALAWA', 'BUT_JOB', 'DESCRIPTION_JOB',
  'RELATION_JOB', 'REQUEST_DEGREE', 'LANGUAGE_FAVORATE', 'start_date_mihna', 'end_date_mihna',
  'nbr_hour_for_day', 'dep_a', 'dep_b', 'end_a', 'end_b', 'NAME_EN', 'tax_palestine', 'DATE_END_VISA',
  'Restrict_job', 'Description_nidham_3amal', 'name_emp_en', 'type_stopping', 'Bonus_hakli', 'LOCATION',
  'COST_CENTER', 'medical_comment', 'num_tenue', 'num_chaussure', 'nbd_day_vication', 'num_unit',
  'id_finger', 'Food', 'Fuel', 'Communication', 'Tadawul_No', 'tameez', 'Year_suppliment_YEAR',
  'Year_suppliment_MONTH', 'num_kid', 'xNUM_KARAR', 'xDATE_KARAR', 'xORIGIN_KARAR', 'xKARAR_STE',
  'xDATE_KARAR_STE', 'RASID_HAKLIYA', 'Leave_filed_desert', 'NetIjaza', 'NetIjaza_desert',
  'SOLDE_JOUR_CONGEE_desert', 'Spends_Vacation', 'Spends_Field_Break', 'coment_nidham_3amal', 'num_job1',
  'CURRENCY_TO_PAY', 'stop_takrim', 'percent_takrim', 'addition_67', 'productivity', 'PART_STE', 'JOB_NAME',
  'father_nationality', 'city', 'nearest_address_point', 'is_dp_letter', 'comment_dp_letter',
  'date_dp_letter', 'jehaa', 'Desert_pass_Expiration_date', 'Desert_pass_No', 'Desert_pass_Comment',
  'Desert_pass_Sent_Email', 'Picture'
];

const BASIC_INFO_FIELDS = [
  'Ref_emp', 'NAME', 'name_english', 'Civilite', 'SEXE', 'Nationality', 'NUM_NATIONAL',
  'date_naissance', 'adrtesse_naissance', 'city', 'ADRESS', 'TEL', 'MAIL', 'nbr_enfant',
  'nom_mere', 'Picture', 'COMMENT'
];

const DOCUMENT_FIELDS = [
  'num_CIN', 'JIHAET_ISDAR_CARTE', 'NUM_PAGE_LIVRE', 'NUM_PASSPORT', 'JIHET_ISDAR_PASSPORT',
  'DATE_END_PASSPORT', 'type_song', 'num_permis', 'type_assurance', 'num_assurance',
  'attached_number', 'IS_EMPRENTED'
];

const EMPLOYMENT_FIELDS = [
  'STAR_CONTRAT', 'End_contrat', 'start_contrat_renouvellable', 'PERIOD_CONTRACT',
  'type_de_recrutement', 'num_job', 'NUM_JOB_EGALISEE', 'Degree', 'degree_employee',
  'CERTIFICAT_SCIENTIFIQUE', 'NIVEAU_CANDIDAT', 'NIVEAU_CANDIDAT_employee', 'specialite',
  'DATE_TAKHARROJ', 'date_akd_mouwaten', 'STATE', 'IS_FOREINGHT', 'nidham_3amal',
  'JOB_1', 'JOB_2', 'JOB_3', 'JOB_4', 'JOB_5', 'REQUEST_DEGREE', 'LANGUAGE_FAVORATE',
  'BUT_JOB', 'DESCRIPTION_JOB', 'RELATION_JOB', 'year_suppliment', 'Year_suppliment_YEAR',
  'Year_suppliment_MONTH', 'NUMERO_ANCIEN2', 'NUMERO_ANCIEN3', 'NUMERO_ANCIEN4', 'NUMERO_ANCIEN5'
];

const FINANCIAL_FIELDS = [
  'num_finance', 'banque', 'numero_compte', 'investissement', 'salaire_de_base',
  'Bonus_hakli', 'COST_CENTER', 'num_tenue', 'num_chaussure', 'medical_comment'
];

const EMPLOYMENT_AND_COMPENSATION_FIELDS = [
  ...EMPLOYMENT_FIELDS,
  ...FINANCIAL_FIELDS,
];

const DATE_FIELDS = new Set([
  'STAR_CONTRAT', 'End_contrat', 'date_naissance', 'DATE_NADB', 'end_date_cert_medicale', 'DATE_DEGREE',
  'date_akd_mouwaten', 'start_contrat_renouvellable', 'DATE_END_PASSPORT', 'DATE_TAKHARROJ', 'date_year_suppliment',
  'Date_mochref', 'start_date_mihna', 'end_date_mihna', 'DATE_END_VISA', 'xDATE_KARAR',
  'date_dp_letter', 'Desert_pass_Expiration_date', 'Desert_pass_Sent_Email'
]);

const BOOLEAN_FIELDS = new Set([
  'Situation_du_travail', 'STATE', 'IS_FOREINGHT', 'IS_EMPRENTED', 'IS_OK_POUR_MALAK', 'Mochref',
  'tax_palestine', 'tameez', 'RASID_HAKLIYA', 'stop_takrim', 'is_dp_letter'
]);

const NUMBER_FIELDS = new Set([
  'nbr_enfant', 'id_bonus', 'banque', 'nbr_marabit', 'exclusion_tax_assurance_solidarite', 'ETAT_ACTUELLE',
  'NBR_JOUR_CONGEE', 'SOLDE_JOUR_CONGEE', 'salaire_de_base', 'kiyada', 'ichrafiya', 'fenniya',
  'type_de_travail', 'permission', 'Voyage', 'khazina', 'Formation', 'Famille', 'responsabilite',
  'experience', 'residence', 'nadb', 'tamyiiz', 'SALAIRE_ANCIEN', 'NUM_JOB_EGALISEE', 'SALAIRE_2007',
  'rasid_CONGE', 'year_suppliment', 'LOCATION', 'nbd_day_vication', 'id_finger', 'Food', 'Fuel',
  'Communication', 'Year_suppliment_YEAR', 'Year_suppliment_MONTH', 'Leave_filed_desert', 'NetIjaza',
  'NetIjaza_desert', 'SOLDE_JOUR_CONGEE_desert', 'Spends_Vacation', 'Spends_Field_Break', 'Bonus_hakli',
  'percent_takrim', 'addition_67', 'productivity', 'PART_STE'
]);

const MULTILINE_FIELDS = new Set([
  'COMMENT', 'JOB_1', 'CAUSE_END_CONTRACT', 'COMMENT_ALAWA', 'BUT_JOB', 'DESCRIPTION_JOB', 'RELATION_JOB',
  'REQUEST_DEGREE', 'LANGUAGE_FAVORATE', 'Restrict_job', 'Description_nidham_3amal', 'medical_comment',
  'coment_nidham_3amal', 'jehaa', 'Desert_pass_Comment', 'comment_dp_letter'
]);

const FIELD_LABEL_OVERRIDES: Record<string, string> = {
  ID_EMP: 'Employee ID',
  NAME: 'Employee Name',
  ADRESS: 'Adress',
  TEL: 'Phone',
  MAIL: 'Email',
  COMMENT: 'Comment',
  STAR_CONTRAT: 'Start Contract',
  End_contrat: 'End Contract',
  Civilite: 'Civility',
  Nationality: 'Nationality',
  nbr_enfant: 'Nbr of Childs',
  Ref_emp: 'Employee No',
  banque: 'Employee Bank',
  investissement: 'Crew',
  num_finance: 'Finance No',
  type_de_recrutement: 'Contract Type',
  Degree: 'Degree',
  type_assurance: 'Insurance Type',
  num_assurance: 'Insurance No',
  numero_compte: 'Bank Account',
  date_naissance: 'Birth Date',
  Picture: 'Picture',
  nom_mere: 'Mother name',
  adrtesse_naissance: 'Birth Place',
  num_CIN: 'Card ID',
  JIHAET_ISDAR_CARTE: 'Card ID issuer',
  NUM_PAGE_LIVRE: 'Book No',
  NUM_PASSPORT: 'Passport No',
  JIHET_ISDAR_PASSPORT: 'Passport issuer',
  SEXE: 'Gender',
  type_song: 'Blood Type',
  num_permis: 'Drive liscence',
  nidham_3amal: 'Restriction of finger print or face ID',
  name_english: 'English Name',
  CERTIFICAT_SCIENTIFIQUE: 'Diplome',
  num_job: 'Positions',
  salaire_de_base: 'Basic Salary',
  STATE: 'Status',
  NUM_NATIONAL: 'National No',
  NIVEAU_CANDIDAT: 'Level',
  specialite: 'Speciality',
  NUMERO_ANCIEN2: 'Old employee No 1',
  NUMERO_ANCIEN3: 'Old employee No 2',
  NUMERO_ANCIEN4: 'Old employee No 3',
  NUMERO_ANCIEN5: 'Old employee No 4',
  date_akd_mouwaten: 'date start contract (تعيين)',
  IS_FOREINGHT: 'Is expat',
  start_contrat_renouvellable: 'Start date to calculate the annual leave',
  JOB_1: 'Old position 1',
  JOB_2: 'Old position 2',
  JOB_3: 'Old position 3',
  JOB_4: 'Old position 4',
  JOB_5: 'Old position 5',
  DATE_TAKHARROJ: 'Diplome date',
  NUM_JOB_EGALISEE: 'Position No',
  DATE_END_PASSPORT: 'Passport end date',
  IS_EMPRENTED: 'Restriction of finger print or face ID',
  year_suppliment: 'Nbr Of days experince',
  PERIOD_CONTRACT: 'Contract Period',
  degree_employee: 'Employee degree',
  NIVEAU_CANDIDAT_employee: 'Employee level',
  attached_number: 'Attached number',
  BUT_JOB: 'Position Goals',
  DESCRIPTION_JOB: 'Position description',
  RELATION_JOB: 'position relation',
  REQUEST_DEGREE: 'position degree',
  LANGUAGE_FAVORATE: 'position language requested',
  Bonus_hakli: 'Field Allow.',
  COST_CENTER: 'Cost Center',
  medical_comment: 'Medical Comment',
  num_tenue: 'Suit No',
  num_chaussure: 'Shoose No',
  Year_suppliment_YEAR: 'Nbr Of years experince',
  Year_suppliment_MONTH: 'Nbr Of month experince',
  city: 'City',
};

const toFieldLabel = (field: string): string =>
  FIELD_LABEL_OVERRIDES[field] ??
  field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const toFormText = (field: string, value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'string') {
    const maybeDate = new Date(value);
    if (DATE_FIELDS.has(field) && !Number.isNaN(maybeDate.getTime())) return maybeDate.toISOString().slice(0, 10);
  }
  return String(value);
};

const buildInitialFormState = (): EmployeeFormState => {
  const state: EmployeeFormState = {};
  for (const field of ALL_EMPLOYEE_FIELDS) {
    state[field] = '';
  }
  return state;
};

const initialFormState: EmployeeFormState = buildInitialFormState();

const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const apiUrl = buildApiUrl('/employees');

  const [rows, setRows] = React.useState<EmployeeRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [query, setQuery] = React.useState<string>('');
  const [errorMessage, setErrorMessage] = React.useState<string>('');

  const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
  const [editingRow, setEditingRow] = React.useState<EmployeeRow | null>(null);
  const [form, setForm] = React.useState<EmployeeFormState>(initialFormState);
  const [formErrors, setFormErrors] = React.useState<Partial<Record<string, string>>>({});
  const [activeTab, setActiveTab] = React.useState<number>(0);

  const isEditMode = !!editingRow;

  const fetchEmployees = React.useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.get<EmployeeRow[]>(`${apiUrl}/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        navigate('/login');
        return;
      }

      const apiMessage =
        typeof error?.response?.data?.message === 'string'
          ? error.response.data.message
          : 'Failed to load employees';
      setErrorMessage(apiMessage);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, navigate]);

  React.useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredRows = React.useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return rows;

    return rows.filter((row) => {
      const values = [
        row.ID_EMP,
        row.Ref_emp,
        row.NAME,
        row.TEL,
        row.MAIL,
        row.ADRESS,
        row.COMMENT,
      ];

      return values.some((value) => String(value ?? '').toLowerCase().includes(search));
    });
  }, [query, rows]);

  const openCreateDialog = () => {
    setEditingRow(null);
    setForm(buildInitialFormState());
    setFormErrors({});
    setActiveTab(0);
    setDialogOpen(true);
  };

  const openEditDialog = (row: EmployeeRow) => {
    setEditingRow(row);
    const nextForm = buildInitialFormState();
    for (const field of ALL_EMPLOYEE_FIELDS) {
      nextForm[field] = toFormText(field, row[field]);
    }
    setForm(nextForm);
    setFormErrors({});
    setActiveTab(0);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setEditingRow(null);
    setForm(buildInitialFormState());
    setFormErrors({});
    setActiveTab(0);
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<string, string>> = {};

    if (!String(form.NAME || '').trim()) nextErrors.NAME = 'Name is required';
    if (!String(form.TEL || '').trim()) nextErrors.TEL = 'Phone is required';
    if (!String(form.attached_number || '').trim()) nextErrors.attached_number = 'Attached number is required';

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveEmployee = async () => {
    if (!validateForm()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    const payload: Record<string, unknown> = {};
    for (const field of ALL_EMPLOYEE_FIELDS) {
      const raw = String(form[field] ?? '').trim();

      if (!raw) {
        payload[field] = null;
        continue;
      }

      if (BOOLEAN_FIELDS.has(field)) {
        payload[field] = raw.toLowerCase() === 'true';
      } else if (NUMBER_FIELDS.has(field)) {
        const value = Number(raw);
        payload[field] = Number.isFinite(value) ? value : null;
      } else if (DATE_FIELDS.has(field)) {
        payload[field] = raw;
      } else {
        payload[field] = raw;
      }
    }

    try {
      if (isEditMode && editingRow) {
        await axios.put(`${apiUrl}/Update/${editingRow.ID_EMP}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${apiUrl}/Add`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      closeDialog();
      await fetchEmployees();
    } catch (error: any) {
      if (error?.response?.status === 401) {
        navigate('/login');
        return;
      }

      const apiMessage =
        typeof error?.response?.data?.message === 'string'
          ? error.response.data.message
          : 'Failed to save employee';
      setErrorMessage(apiMessage);
    } finally {
      setSaving(false);
    }
  };

  const columns = React.useMemo<MRT_ColumnDef<EmployeeRow>[]>(
    () => [
      { accessorKey: 'ID_EMP', header: 'ID', size: 70 },
      { accessorKey: 'Ref_emp', header: 'Employee No', size: 120 },
      { accessorKey: 'NAME', header: 'Name', size: 220 },
      { accessorKey: 'TEL', header: 'Phone', size: 140 },
      { accessorKey: 'MAIL', header: 'Email', size: 220 },
      { accessorKey: 'ADRESS', header: 'Address', size: 240 },
      { accessorKey: 'COST_CENTER', header: 'Cost Center', size: 130 },
      { accessorKey: 'COMMENT', header: 'Comment', size: 220 },
    ],
    []
  );

  const exportToExcel = () => {
    const data = filteredRows.map((row) => ({
      ID: row.ID_EMP ?? '',
      'Employee No': row.Ref_emp ?? '',
      Name: row.NAME ?? '',
      Phone: row.TEL ?? '',
      Email: row.MAIL ?? '',
      Address: row.ADRESS ?? '',
      'Cost Center': row.COST_CENTER ?? '',
      Comment: row.COMMENT ?? '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

    const dateStamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `employees_${dateStamp}.xlsx`);
  };

  const table = useMaterialReactTable({
    columns,
    data: filteredRows,
    state: {
      isLoading: loading,
      showProgressBars: saving,
      density: 'comfortable',
    },
    enableDensityToggle: true,
    enableGlobalFilter: false,
    enableRowActions: true,
    positionActionsColumn: 'last',
    displayColumnDefOptions: {
      'mrt-row-actions': {
        header: 'Actions',
        size: 90,
      },
    },
    renderRowActions: ({ row }) => (
      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Edit">
          <IconButton size="small" color="primary" onClick={() => openEditDialog(row.original)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    ),
  });

  const renderField = (field: string) => {
    const value = form[field] ?? '';
    const error = formErrors[field];

    if (BOOLEAN_FIELDS.has(field)) {
      return (
        <TextField
          key={field}
          select
          label={toFieldLabel(field)}
          value={value}
          onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
          size="small"
          fullWidth
        >
          <MenuItem value="">Empty</MenuItem>
          <MenuItem value="true">True</MenuItem>
          <MenuItem value="false">False</MenuItem>
        </TextField>
      );
    }

    if (DATE_FIELDS.has(field)) {
      return (
        <TextField
          key={field}
          label={toFieldLabel(field)}
          type="date"
          value={value}
          onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          size="small"
          fullWidth
        />
      );
    }

    return (
      <TextField
        key={field}
        label={toFieldLabel(field)}
        type={NUMBER_FIELDS.has(field) ? 'number' : 'text'}
        value={value}
        onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
        required={field === 'NAME' || field === 'TEL' || field === 'attached_number'}
        error={!!error}
        helperText={error}
        multiline={MULTILINE_FIELDS.has(field)}
        minRows={MULTILINE_FIELDS.has(field) ? 1 : undefined}
        size="small"
        fullWidth
      />
    );
  };

  const renderTabFields = (fields: string[]) => (
    <Grid container spacing={1} sx={{ mt: 0.25 }}>
      {fields.map((field) => (
        <Grid key={field} size={{ xs: 12, md: 4 }}>
          {renderField(field)}
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box p={2}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        sx={{ mb: 1.5, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Employee Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and update employee records.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            size="small"
            placeholder="Search employee"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 0.75 }} fontSize="small" /> }}
          />
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchEmployees}>
            Refresh
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportToExcel}>
            Export Excel
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
            New Employee
          </Button>
        </Stack>
      </Stack>

      {errorMessage ? (
        <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      ) : null}

      <MaterialReactTable table={table} />

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: '96vw', md: '92vw', lg: 1180 },
            maxWidth: 1180,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>{isEditMode ? 'Edit Employee' : 'Create Employee'}</DialogTitle>

        <DialogContent
          dividers
          sx={{
            overflowY: 'auto',
            pt: 1,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ mb: 1.25 }}
          >
            <Tab label="Basic Information" />
            <Tab label="Documents & IDs" />
            <Tab label="Employment & Compensation" />
          </Tabs>

          {activeTab === 0 ? renderTabFields(BASIC_INFO_FIELDS) : null}
          {activeTab === 1 ? renderTabFields(DOCUMENT_FIELDS) : null}
          {activeTab === 2 ? renderTabFields(EMPLOYMENT_AND_COMPENSATION_FIELDS) : null}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={saveEmployee} variant="contained" disabled={saving}>
            {isEditMode ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeesPage;
