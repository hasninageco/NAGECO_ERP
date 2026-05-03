// ✅ Full React Component: Accounts.tsx with Hierarchical Validation

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
  Box, IconButton, Tooltip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Checkbox, FormControlLabel, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import Autocomplete from '@mui/material/Autocomplete';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

type Account = {
  IND: number;
  Acc_No: string | null;
  Name_M: string | null;
  Date_m: string | null;
  State: boolean | null;
  solde_initiale: number | null;
  type_acc: string | null;
  ancien_acc_no: string | null;
  percent_budget: number | null;
  solde_by_currency: number | null;
  d1: string | null;
  d2: string | null;
  L10: number | null;
};

const initialAccountState: Account = {
  IND: 0, Acc_No: '', Name_M: '', Date_m: '', State: false,
  solde_initiale: 0, type_acc: '', ancien_acc_no: '',
  percent_budget: 0, solde_by_currency: 0, d1: '', d2: '', L10: 0
};

const Accounts = () => {
  const [data, setData] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState<Account | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();

  const apiUrl = buildApiUrl('/coas');
  const typeOptions = ['D', 'C'];

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate("/login");

    try {
      const response = await axios.get<Account[]>(`${apiUrl}/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) navigate("/login");
      else alert(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (row: Account) => {

   
    setEditItem(row);


   
    setIsEditMode(true);
    setOpenDialog(true);
  };

  const handleAddNew = () => {
    setEditItem(initialAccountState);
    setIsEditMode(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditItem(null);
    setErrors({});
  };

  const allowedLengths = [1, 2, 4, 10];

  const validateForm = () => {
    const newErrors: any = {};
    if (!editItem?.Name_M) newErrors.Name_M = 'Name is required';
    if (!editItem?.Acc_No) newErrors.Acc_No = 'Account Number is required';

    // Only allow lengths 1, 2, 4, 10
    if (editItem?.Acc_No && !allowedLengths.includes(editItem.Acc_No.length)) {
      newErrors.Acc_No = 'Account Number length must be 1, 2, 4, or 10';
    }

    // Check for duplicate Acc_No
    if (!isEditMode && data.some(acc => acc.Acc_No === editItem?.Acc_No)) {
      newErrors.Acc_No = 'Account number already exists';
    }

    // Check for parent existence
    if (editItem?.Acc_No) {
      const parentCandidates = data.map(a => a.Acc_No!).filter(p => editItem.Acc_No!.startsWith(p) && p !== editItem.Acc_No);
      const parentExists = parentCandidates.sort((a, b) => b.length - a.length)[0];
      if (!parentExists && editItem.Acc_No.length > 1) {
        newErrors.Acc_No = 'No valid parent account exists';
      }
      // Refuse insert/update if this Acc_No is a parent for any other account
      if (
        isEditMode &&
        data.some(acc => acc.Acc_No !== editItem.Acc_No && acc.Acc_No?.startsWith(editItem.Acc_No!))
      ) {
        newErrors.Acc_No = 'Cannot update: This account is a parent for other accounts';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !editItem) return;
    const token = localStorage.getItem('token');

    try {
      if (isEditMode) {
        if (!editItem.IND) {
          showSnackbar("ID is missing for update.", 'error');
          return;
        }
        await axios.put(`${apiUrl}/Update/${editItem.IND}`, editItem, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSnackbar('Account updated successfully', 'success');
      } else {
        await axios.post(`${apiUrl}/Add`, editItem, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSnackbar('Account added successfully', 'success');
      }
      await fetchData();
      handleCloseDialog();
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Save failed', 'error');
    }
  };

  const handleDelete = async (row: Account) => {
    if (data.some(acc => acc.Acc_No !== row.Acc_No && acc.Acc_No?.startsWith(row.Acc_No!))) {
      showSnackbar('Cannot delete: This account is a parent for other accounts.', 'error');
      return;
    }
    if (!window.confirm(`Delete "${row.Name_M}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${apiUrl}/Delete/${row.IND}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchData();
      showSnackbar('Account deleted successfully', 'success');
    } catch {
      showSnackbar('Delete failed', 'error');
    }
  };

  const columns = useMemo<MRT_ColumnDef<Account>[]>(() => [
    { accessorKey: 'IND', header: 'ID', size: 70 },
    { accessorKey: 'Acc_No', header: 'Account No' },
    { accessorKey: 'Name_M', header: 'Name' },
    { accessorKey: 'Date_m', header: 'Creation Date' },
    {
      accessorKey: 'State',
      header: 'State',
      Cell: ({ cell }) => (cell.getValue() ? "Active" : "Inactive")
    },
    {
      accessorKey: 'type_acc', header: 'Account Type',
      Cell: ({ cell }) => (cell.getValue() === 'D' ? "Debit" : "Credit")
    },
    { accessorKey: 'solde_by_currency', header: 'Currency Balance' },
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
  ], [data]);

  const table = useMaterialReactTable({
    columns,
    data,
    state: { isLoading: loading, density: 'compact' },
    enableDensityToggle: true
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box p={1}>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<ImportExportIcon />}
          onClick={() => alert("Excel Export is handled separately")}
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
          New Account
        </Button>
      </Box>

      <MaterialReactTable table={table} />

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isEditMode ? 'Edit Account' : 'New Account'}</DialogTitle>
        <Divider />
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            <TextField label="Account No" fullWidth value={editItem?.Acc_No || ''} onChange={(e) => setEditItem({ ...editItem!, Acc_No: e.target.value })} error={!!errors.Acc_No} helperText={errors.Acc_No} />
            <TextField label="Name" fullWidth value={editItem?.Name_M || ''} onChange={(e) => setEditItem({ ...editItem!, Name_M: e.target.value })} error={!!errors.Name_M} helperText={errors.Name_M} />
            <FormControlLabel control={<Checkbox checked={editItem?.State || false} onChange={(e) => setEditItem({ ...editItem!, State: e.target.checked })} />} label="Active" />
            <Autocomplete
              fullWidth
              options={typeOptions}
              value={editItem?.type_acc || ''}
              onChange={(event, newValue) => setEditItem({ ...editItem!, type_acc: newValue || '' })}
              renderInput={(params) => <TextField {...params} label="Account Type" fullWidth />}
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
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }} elevation={6} variant="filled">
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default Accounts;