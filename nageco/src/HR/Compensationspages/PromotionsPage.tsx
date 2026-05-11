import React from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../utils/api';

type PromotionRow = {
  Id_transaction: number;
  Date_transaction: string | null;
  Usr: number | null;
  id_emp: number | null;
  old_basic_salary: number | string | null;
  new_basic_salary: number | string | null;
  old_job: string | null;
  new_job: string | null;
  old_num_job: string | null;
  new_num_job: string | null;
  old_degree: string | null;
  new_degree: string | null;
  old_level_candidate: string | null;
  new_level_candidate: string | null;
  add_value: number | string | null;
  comment: string | null;
  Evaluation_EMP: string | null;
};

type EmployeeRow = {
  ID_EMP: number;
  Ref_emp?: string;
  NAME?: string;
  salaire_de_base?: number | string;
  JOB_NAME?: string;
  num_job?: string;
  num_job1?: string;
  Degree?: string;
  degree_employee?: string;
  NIVEAU_CANDIDAT?: string;
  NIVEAU_CANDIDAT_employee?: string;
};

type PromotionFormState = {
  Id_transaction: string;
  Date_transaction: string;
  id_emp: string;
  old_basic_salary: string;
  new_basic_salary: string;
  old_job: string;
  new_job: string;
  old_num_job: string;
  new_num_job: string;
  old_degree: string;
  new_degree: string;
  old_level_candidate: string;
  new_level_candidate: string;
  add_value: string;
  comment: string;
  Evaluation_EMP: string;
};

const toText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const toDateInput = (value: unknown): string => {
  if (!value) return '';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const formatEmployeeName = (employee: EmployeeRow): string => {
  const ref = String(employee.Ref_emp ?? '').trim();
  const name = String(employee.NAME ?? '').trim();
  if (ref && name) return `${ref} - ${name}`;
  return name || ref || `#${employee.ID_EMP}`;
};

const emptyForm = (): PromotionFormState => ({
  Id_transaction: '',
  Date_transaction: new Date().toISOString().slice(0, 10),
  id_emp: '',
  old_basic_salary: '',
  new_basic_salary: '',
  old_job: '',
  new_job: '',
  old_num_job: '',
  new_num_job: '',
  old_degree: '',
  new_degree: '',
  old_level_candidate: '',
  new_level_candidate: '',
  add_value: '',
  comment: '',
  Evaluation_EMP: '',
});

const PromotionsPage: React.FC = () => {
  const navigate = useNavigate();
  const promotionsUrl = buildApiUrl('/promotions');
  const employeesUrl = buildApiUrl('/employees');

  const [rows, setRows] = React.useState<PromotionRow[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState<PromotionFormState>(emptyForm());
  const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);

  const token = React.useMemo(() => localStorage.getItem('token') || '', []);

  const nextTransactionId = React.useMemo(() => {
    const max = rows.reduce((acc, row) => Math.max(acc, Number(row.Id_transaction || 0)), 0);
    return String(max + 1);
  }, [rows]);

  const selectedEmployee = React.useMemo(
    () => employees.find((emp) => String(emp.ID_EMP) === String(form.id_emp)) || null,
    [employees, form.id_emp]
  );

  const fetchData = React.useCallback(async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const [promotionsResponse, employeesResponse] = await Promise.all([
        axios.get<PromotionRow[]>(`${promotionsUrl}/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<EmployeeRow[]>(`${employeesUrl}/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const promotionRows = Array.isArray(promotionsResponse.data) ? promotionsResponse.data : [];
      setRows(promotionRows);
      setEmployees(Array.isArray(employeesResponse.data) ? employeesResponse.data : []);

      if (!selectedId) {
        setForm((prev) => ({
          ...prev,
          Id_transaction: prev.Id_transaction || String(
            promotionRows.reduce((acc, row) => Math.max(acc, Number(row.Id_transaction || 0)), 0) + 1
          ),
        }));
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        navigate('/login');
        return;
      }
      const message =
        typeof error?.response?.data?.message === 'string'
          ? error.response.data.message
          : 'Failed to load promotions data';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [employeesUrl, navigate, promotionsUrl, selectedId, token]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const applyEmployeeOldValues = React.useCallback((employee: EmployeeRow | null) => {
    if (!employee) return;

    const oldBasicSalary = toText(employee.salaire_de_base);
    const oldJob = toText(employee.JOB_NAME || employee.num_job);
    const oldNumJob = toText(employee.num_job1 || employee.num_job);
    const oldDegree = toText(employee.degree_employee || employee.Degree);
    const oldLevel = toText(employee.NIVEAU_CANDIDAT_employee || employee.NIVEAU_CANDIDAT);

    setForm((prev) => ({
      ...prev,
      old_basic_salary: oldBasicSalary,
      old_job: oldJob,
      old_num_job: oldNumJob,
      old_degree: oldDegree,
      old_level_candidate: oldLevel,
    }));
  }, []);

  React.useEffect(() => {
    if (!selectedEmployee) return;
    if (selectedId) return;
    applyEmployeeOldValues(selectedEmployee);
  }, [applyEmployeeOldValues, selectedEmployee, selectedId]);

  React.useEffect(() => {
    const oldSalary = Number(form.old_basic_salary || 0);
    const newSalary = Number(form.new_basic_salary || 0);

    if (!Number.isFinite(oldSalary) || !Number.isFinite(newSalary)) return;

    const delta = newSalary - oldSalary;
    setForm((prev) => {
      const next = delta ? delta.toFixed(2) : '';
      if (prev.add_value === next) return prev;
      return { ...prev, add_value: next };
    });
  }, [form.new_basic_salary, form.old_basic_salary]);

  const clearForNew = React.useCallback(() => {
    setSelectedId(null);
    setForm({
      ...emptyForm(),
      Id_transaction: nextTransactionId,
    });
  }, [nextTransactionId]);

  const openCreateDialog = React.useCallback(() => {
    clearForNew();
    setErrorMessage('');
    setDialogOpen(true);
  }, [clearForNew]);

  const openEditDialog = React.useCallback(() => {
    if (!selectedId) {
      setErrorMessage('Select a transaction first');
      return;
    }
    setErrorMessage('');
    setDialogOpen(true);
  }, [selectedId]);

  const closeDialog = React.useCallback(() => {
    if (saving) return;
    setDialogOpen(false);
  }, [saving]);

  const loadRowToForm = React.useCallback((row: PromotionRow) => {
    setSelectedId(row.Id_transaction);
    setForm({
      Id_transaction: toText(row.Id_transaction),
      Date_transaction: toDateInput(row.Date_transaction),
      id_emp: toText(row.id_emp),
      old_basic_salary: toText(row.old_basic_salary),
      new_basic_salary: toText(row.new_basic_salary),
      old_job: toText(row.old_job),
      new_job: toText(row.new_job),
      old_num_job: toText(row.old_num_job),
      new_num_job: toText(row.new_num_job),
      old_degree: toText(row.old_degree),
      new_degree: toText(row.new_degree),
      old_level_candidate: toText(row.old_level_candidate),
      new_level_candidate: toText(row.new_level_candidate),
      add_value: toText(row.add_value),
      comment: toText(row.comment),
      Evaluation_EMP: toText(row.Evaluation_EMP),
    });
  }, []);

  const validate = () => {
    if (!form.Id_transaction.trim()) return 'Transaction No is required';
    if (!form.Date_transaction.trim()) return 'Transaction Date is required';
    if (!form.id_emp.trim()) return 'Employee is required';
    return '';
  };

  const parseNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : null;
  };

  const buildPayload = () => ({
    Id_transaction: Number(form.Id_transaction),
    Date_transaction: form.Date_transaction || null,
    id_emp: parseNumber(form.id_emp),
    old_basic_salary: parseNumber(form.old_basic_salary),
    new_basic_salary: parseNumber(form.new_basic_salary),
    old_job: form.old_job.trim() || null,
    new_job: form.new_job.trim() || null,
    old_num_job: form.old_num_job.trim() || null,
    new_num_job: form.new_num_job.trim() || null,
    old_degree: form.old_degree.trim() || null,
    new_degree: form.new_degree.trim() || null,
    old_level_candidate: form.old_level_candidate.trim() || null,
    new_level_candidate: form.new_level_candidate.trim() || null,
    add_value: parseNumber(form.add_value),
    comment: form.comment.trim() || null,
    Evaluation_EMP: form.Evaluation_EMP.trim() || null,
  });

  const saveRecord = async () => {
    const invalidMessage = validate();
    if (invalidMessage) {
      setErrorMessage(invalidMessage);
      return;
    }

    if (!token) {
      navigate('/login');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      const payload = buildPayload();

      if (selectedId) {
        await axios.put(`${promotionsUrl}/Update/${selectedId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${promotionsUrl}/Add`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await fetchData();
      clearForNew();
      setDialogOpen(false);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        navigate('/login');
        return;
      }

      const message =
        typeof error?.response?.data?.message === 'string'
          ? error.response.data.message
          : 'Failed to save transaction';
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async () => {
    if (!selectedId) {
      setErrorMessage('Select a transaction first');
      return;
    }

    const confirmDelete = window.confirm(`Delete transaction #${selectedId}?`);
    if (!confirmDelete) return;

    if (!token) {
      navigate('/login');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      await axios.delete(`${promotionsUrl}/Delete/${selectedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchData();
      clearForNew();
    } catch (error: any) {
      if (error?.response?.status === 401) {
        navigate('/login');
        return;
      }

      const message =
        typeof error?.response?.data?.message === 'string'
          ? error.response.data.message
          : 'Failed to delete transaction';
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const columns = React.useMemo<MRT_ColumnDef<PromotionRow>[]>(
    () => [
      { accessorKey: 'Id_transaction', header: 'Trans No', size: 90 },
      { accessorKey: 'Date_transaction', header: 'Date', size: 110 },
      { accessorKey: 'id_emp', header: 'Employee ID', size: 100 },
      { accessorKey: 'old_basic_salary', header: 'Old Salary', size: 110 },
      { accessorKey: 'new_basic_salary', header: 'New Salary', size: 110 },
      { accessorKey: 'old_job', header: 'Old Job', size: 140 },
      { accessorKey: 'new_job', header: 'New Job', size: 140 },
      { accessorKey: 'add_value', header: 'Diff', size: 90 },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: rows,
    state: {
      isLoading: loading,
      showProgressBars: saving,
      density: 'compact',
    },
    enableDensityToggle: true,
    enableRowActions: false,
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => loadRowToForm(row.original),
      sx: {
        cursor: 'pointer',
        backgroundColor: selectedId === row.original.Id_transaction ? 'action.selected' : undefined,
      },
    }),
  });

  React.useEffect(() => {
    if (!form.Id_transaction) {
      setForm((prev) => ({ ...prev, Id_transaction: nextTransactionId }));
    }
  }, [form.Id_transaction, nextTransactionId]);

  return (
    <Box p={2}>
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Action Form : Promotion
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            الاجراء الوظيفي : تسكين
          </Typography>
        </Stack>

        {errorMessage ? (
          <Alert severity="error" sx={{ mb: 1 }} onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        ) : null}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData}>
            Refresh
          </Button>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreateDialog}>
            New
          </Button>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={openEditDialog}>
            Edit
          </Button>
          <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={deleteRecord}>
            Remove
          </Button>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>
            Print
          </Button>
        </Stack>
      </Paper>

      <Box sx={{ mt: 1.5 }}>
        <MaterialReactTable table={table} />
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: '96vw', md: '92vw', lg: 1280 },
            maxWidth: 1280,
            maxHeight: '92vh',
          },
        }}
      >
        <DialogTitle>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Action Form : Promotion
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              الاجراء الوظيفي : تسكين
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ overflowY: 'auto' }}>
          <Grid container spacing={1.25} sx={{ mb: 1 }}>
            <Grid size={{ xs: 12, md: 2.5 }}>
              <TextField
                label="Transaction No"
                value={form.Id_transaction}
                onChange={(e) => setForm((prev) => ({ ...prev, Id_transaction: e.target.value }))}
                size="small"
                fullWidth
                disabled={Boolean(selectedId)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2.5 }}>
              <TextField
                label="Transaction Date"
                type="date"
                value={form.Date_transaction}
                onChange={(e) => setForm((prev) => ({ ...prev, Date_transaction: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                size="small"
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <TextField
                select
                label="Employee"
                value={form.id_emp}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({ ...prev, id_emp: value }));
                  const employee = employees.find((item) => String(item.ID_EMP) === String(value)) || null;
                  applyEmployeeOldValues(employee);
                }}
                size="small"
                fullWidth
              >
                <MenuItem value="">Select employee</MenuItem>
                {employees.map((employee) => (
                  <MenuItem key={employee.ID_EMP} value={String(employee.ID_EMP)}>
                    {formatEmployeeName(employee)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Grid container spacing={1.25}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 1.25, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Old Situation
                </Typography>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField label="Basic Salary" size="small" fullWidth value={form.old_basic_salary} disabled />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Job"
                      size="small"
                      fullWidth
                      value={form.old_job}
                      onChange={(e) => setForm((prev) => ({ ...prev, old_job: e.target.value }))}
                      disabled
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Job Number"
                      size="small"
                      fullWidth
                      value={form.old_num_job}
                      onChange={(e) => setForm((prev) => ({ ...prev, old_num_job: e.target.value }))}
                      disabled
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Degree"
                      size="small"
                      fullWidth
                      value={form.old_degree}
                      onChange={(e) => setForm((prev) => ({ ...prev, old_degree: e.target.value }))}
                      disabled
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Level"
                      size="small"
                      fullWidth
                      value={form.old_level_candidate}
                      onChange={(e) => setForm((prev) => ({ ...prev, old_level_candidate: e.target.value }))}
                      disabled
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 1.25, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  New Situation
                </Typography>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Basic Salary"
                      size="small"
                      fullWidth
                      value={form.new_basic_salary}
                      onChange={(e) => setForm((prev) => ({ ...prev, new_basic_salary: e.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Job"
                      size="small"
                      fullWidth
                      value={form.new_job}
                      onChange={(e) => setForm((prev) => ({ ...prev, new_job: e.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Job Number"
                      size="small"
                      fullWidth
                      value={form.new_num_job}
                      onChange={(e) => setForm((prev) => ({ ...prev, new_num_job: e.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Degree"
                      size="small"
                      fullWidth
                      value={form.new_degree}
                      onChange={(e) => setForm((prev) => ({ ...prev, new_degree: e.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Level"
                      size="small"
                      fullWidth
                      value={form.new_level_candidate}
                      onChange={(e) => setForm((prev) => ({ ...prev, new_level_candidate: e.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField label="Add Value" size="small" fullWidth value={form.add_value} disabled />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 1.25 }}>
            <TextField
              label="Note"
              value={form.comment}
              onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
              size="small"
              fullWidth
              multiline
              minRows={3}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={saveRecord} disabled={saving}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromotionsPage;
