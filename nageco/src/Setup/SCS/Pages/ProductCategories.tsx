import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../../../utils/api';
import { useNavigate } from 'react-router-dom';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import {
  ThemeProvider, createTheme,
  Box, IconButton, Tooltip, Button, Dialog,
  DialogActions, DialogContent, DialogTitle, TextField,
  CssBaseline, Divider, Checkbox, FormControlLabel, Autocomplete,
  Snackbar, Alert
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import * as XLSX from 'xlsx';

// Define the type
type Section = {
  ID_SECTION: number;
  DESIG: string | null;
  CODE_SECTION: string | null;
  Account: string | null;
  Debit_Account: string | null;
};

const initialSectionState: Section = {
  ID_SECTION: 0,
  DESIG: '',
  CODE_SECTION: '',
  Account: '',
  Debit_Account: '',
};

const theme = createTheme();


const ProductCategories = () => {
  const [data, setData] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState<Section | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [coaOptions, setCoaOptions] = useState<{ Acc_No: string; Name_M: string }[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const navigate = useNavigate();

  const apiUrl = buildApiUrl('/sections');

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate("/login");

    try {
      const response = await axios.get<Section[]>(`${apiUrl}/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) navigate("/login");
      else alert("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  useEffect(() => {
    const fetchCOA = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get(buildApiUrl('/coas/all'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCoaOptions(res.data);
      } catch {
        setCoaOptions([]);
      }
    };
    fetchCOA();
  }, []);

  const handleEdit = (row: Section) => {
    setEditItem(row);
    setIsEditMode(true);
    setOpenDialog(true);
  };

  const handleAddNew = () => {
    setEditItem(initialSectionState);
    setIsEditMode(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditItem(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!editItem?.DESIG) newErrors.DESIG = 'Designation is required';
    if (!editItem?.CODE_SECTION) newErrors.CODE_SECTION = 'Code Section is required';
    if (!editItem?.Account || editItem.Account.length !== 10)
      newErrors.Account = 'Account is required and must be 10 characters';
    if (!editItem?.Debit_Account || editItem.Debit_Account.length !== 10)
      newErrors.Debit_Account = 'Debit Account is required and must be 10 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSave = async () => {
    if (!validateForm() || !editItem) return;
    const token = localStorage.getItem('token');

    try {
      if (isEditMode) {
        await axios.put(`${apiUrl}/Update/${editItem.ID_SECTION}`, editItem, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSnackbar('Section updated successfully', 'success');
      } else {
        await axios.post(`${apiUrl}/Add`, editItem, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSnackbar('Section added successfully', 'success');
      }
      await fetchData();
      handleCloseDialog();
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Save failed', 'error');
    }
  };

  const handleDelete = async (row: Section) => {
    if (!window.confirm(`Delete "${row.DESIG}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${apiUrl}/Delete/${row.ID_SECTION}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchData();
      showSnackbar('Section deleted successfully', 'success');
    } catch {
      showSnackbar('Delete failed', 'error');
    }
  };

  const handleExportExcel = () => {
    const headers = ["ID_SECTION", "DESIG", "CODE_SECTION", "Account", "Debit_Account"];
    const rows = data.map(s => [
      s.ID_SECTION,
      s.DESIG,
      s.CODE_SECTION,
      s.Account,
      s.Debit_Account
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Section Data");
    XLSX.writeFile(workbook, "section_data.xlsx");
  };

  const columns = useMemo<MRT_ColumnDef<Section>[]>(() => [
    { accessorKey: 'ID_SECTION', header: 'ID', size: 80 },
    { accessorKey: 'DESIG', header: 'Designation', size: 200 },
    { accessorKey: 'CODE_SECTION', header: 'Code Section', size: 200 },
    {
      accessorKey: 'Account',
      header: 'Account',
      size: 200,
      Cell: ({ cell }) => {
        const accNo = cell.getValue<string>();
        const coa = coaOptions.find(opt => opt.Acc_No === accNo);
        return coa ? `${coa.Acc_No} - ${coa.Name_M}` : accNo || '';
      }
    },
    {
      accessorKey: 'Debit_Account',
      header: 'Debit Account',
      size: 200,
      Cell: ({ cell }) => {
        const accNo = cell.getValue<string>();
        const coa = coaOptions.find(opt => opt.Acc_No === accNo);
        return coa ? `${coa.Acc_No} - ${coa.Name_M}` : accNo || '';
      }
    },
    {
      header: 'Actions',
      id: 'actions',
      size: 100,
      Cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton color="primary" onClick={() => handleEdit(row.original)} size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton color="error" onClick={() => handleDelete(row.original)} size="small">
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ], [coaOptions]);

  const table = useMaterialReactTable({
    columns,
    data,
    state: {
      isLoading: loading,
      density: 'compact',
    },
    enableDensityToggle: true,
    
  });

  return (
 
      <Box p={0.5}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ImportExportIcon />}
            onClick={handleExportExcel}
            sx={{ mr: 1, borderRadius: 3, textTransform: 'none', fontWeight: 'bold', px: 3, py: 1 }}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 'bold', px: 3, py: 1 }}
          >
            New Section
          </Button>
        </Box>

        <MaterialReactTable table={table} />

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>
            {isEditMode ? 'Edit Section' : 'New Section'}
            <Divider sx={{ mb: 0, borderColor: 'grey.300', borderBottomWidth: 2 }} />
          </DialogTitle>

          <DialogContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <TextField
                label="Designation"
                fullWidth
                required
                value={editItem?.DESIG || ''}
                onChange={(e) => setEditItem({ ...editItem!, DESIG: e.target.value })}
                error={!!errors.DESIG}
                helperText={errors.DESIG}
              />
              <TextField
                label="Code Section"
                fullWidth
                required
                value={editItem?.CODE_SECTION || ''}
                onChange={(e) => setEditItem({ ...editItem!, CODE_SECTION: e.target.value })}
                error={!!errors.CODE_SECTION}
                helperText={errors.CODE_SECTION}
              />
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <Autocomplete
                options={coaOptions}
                getOptionLabel={(option) => `${option.Acc_No} - ${option.Name_M}`}
                value={coaOptions.find(opt => opt.Acc_No === (editItem?.Account || '')) || null}
                fullWidth
                onChange={(_, newValue) =>
                  setEditItem({
                    ...editItem!,
                    Account: newValue ? newValue.Acc_No.substring(0, 10) : ''
                  })
                }
                isOptionEqualToValue={(option, value) => option.Acc_No === value.Acc_No}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Account"
                    fullWidth
                    required
                    error={!!errors.Account}
                    helperText={errors.Account}
                  />
                )}
              />
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <Autocomplete
                options={coaOptions}
                getOptionLabel={(option) => `${option.Acc_No} - ${option.Name_M}`}
                value={coaOptions.find(opt => opt.Acc_No === (editItem?.Debit_Account || '')) || null}
                onChange={(_, newValue) =>
                  setEditItem({
                    ...editItem!,
                    Debit_Account: newValue ? newValue.Acc_No.substring(0, 10) : ''
                  })
                }
                fullWidth
                isOptionEqualToValue={(option, value) => option.Acc_No === value.Acc_No}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Debit Account"
                    fullWidth
                    required
                    error={!!errors.Debit_Account}
                    helperText={errors.Debit_Account}
                  />
                )}
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseDialog} color="secondary">Cancel</Button>
            <Button onClick={handleSave} color="primary">{isEditMode ? 'Save Changes' : 'Save'}</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    
  );
};

export default ProductCategories;
