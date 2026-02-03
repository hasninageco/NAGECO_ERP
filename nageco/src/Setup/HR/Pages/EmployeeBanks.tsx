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
  CssBaseline, Divider
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import ImportExportIcon from '@mui/icons-material/ImportExport';

import * as XLSX from 'xlsx';

type Banque = {
  id_Banque: number;
  desig_banque: string;
  checkkkkkk: string;
  BankID: number | null;
};

const theme = createTheme();

const initialBankState: Banque = {
  id_Banque: 0,
  desig_banque: '',
  checkkkkkk: '',
  BankID: null,
};

const EmployeeBanks = () => {
  const [data, setData] = useState<Banque[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editBank, setEditBank] = useState<Banque | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const navigate = useNavigate();
  const apiUrl = buildApiUrl('/employeeBanks');

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate("/login");

    try {
      const response = await axios.get<Banque[]>(`${apiUrl}/all`, {
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

  const handleEdit = (row: Banque) => {
    setEditBank(row);
    setIsEditMode(true);
    setOpenDialog(true);
  };

  const handleAddNew = () => {
    setEditBank(initialBankState);
    setIsEditMode(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditBank(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!editBank?.desig_banque) newErrors.desig_banque = 'Bank name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !editBank) return;
    const token = localStorage.getItem('token');

    try {
      if (isEditMode) {
        await axios.put(`${apiUrl}/Update/${editBank.id_Banque}`, editBank, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${apiUrl}/Add`, editBank, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await fetchData();
      handleCloseDialog();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (row: Banque) => {
    if (!window.confirm(`Delete "${row.desig_banque}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${apiUrl}/Delete/${row.id_Banque}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchData();
    } catch {
      alert('Delete failed');
    }
  };

  const handleExportExcel = () => {
    const headers = ["ID", "Bank Name", "Check", "BankID"];
    const rows = data.map(c => [
      c.id_Banque,
      c.desig_banque,
      c.checkkkkkk,
      c.BankID,
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "EmployeeBanks");
    XLSX.writeFile(workbook, "employee_banks.xlsx");
  };

  const columns = useMemo<MRT_ColumnDef<Banque>[]>(() => [
    { accessorKey: 'id_Banque', header: 'ID', size: 60 },
    { accessorKey: 'desig_banque', header: 'Bank Name', size: 150 },
    { accessorKey: 'checkkkkkk', header: 'Check No Affected from Payroll', size: 150 },
    { accessorKey: 'BankID', header: 'Paid by', size: 100 },
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
  ], []);

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
            New Bank
          </Button>
        </Box>

        <MaterialReactTable table={table} />

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>
            {isEditMode ? 'Edit Bank' : 'New Bank'}
            <Divider sx={{ mb: 0, borderColor: 'grey.300', borderBottomWidth: 2 }} />
          </DialogTitle>

          <DialogContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <TextField
                label="Bank Name"
                fullWidth
                value={editBank?.desig_banque || ''}
                onChange={(e) => setEditBank({ ...editBank!, desig_banque: e.target.value })}
                error={!!errors.desig_banque}
                helperText={errors.desig_banque}
              />
              <TextField
                label="Check No Affected from Payroll"
                fullWidth
                value={editBank?.checkkkkkk || ''}
                onChange={(e) => setEditBank({ ...editBank!, checkkkkkk: e.target.value })}
              />
              <TextField
                label="Paid by"
                type="number"
                fullWidth
                value={editBank?.BankID || ''}
                onChange={(e) =>
                  setEditBank({ ...editBank!, BankID: parseInt(e.target.value) || null })
                }
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseDialog} color="secondary">Cancel</Button>
            <Button onClick={handleSave} color="primary">{isEditMode ? 'Save Changes' : 'Save'}</Button>
          </DialogActions>
        </Dialog>
      </Box>
     
  );
};

export default EmployeeBanks;
