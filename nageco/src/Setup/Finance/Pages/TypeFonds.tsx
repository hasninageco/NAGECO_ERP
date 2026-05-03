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
  Box, IconButton, Tooltip, Button, Dialog,
  DialogActions, DialogContent, DialogTitle, TextField,
  Divider
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import * as XLSX from 'xlsx';

// Define the type
type TypeFond = {
  id_type_fond: number;
  desig_type_font: string | null;
  Account_numbrer_debit: string | null;
  Account_numbrer_credit: string | null;
};

const initialTypeFondState: TypeFond = {
  id_type_fond: 0,
  desig_type_font: '',
  Account_numbrer_debit: '',
  Account_numbrer_credit: '',
};

const TypeFonds = () => {
  const [data, setData] = useState<TypeFond[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState<TypeFond | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const navigate = useNavigate();

  const apiUrl = buildApiUrl('/typeFond');

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate("/login");

    try {
      const response = await axios.get<TypeFond[]>(`${apiUrl}/all`, {
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

  const handleEdit = (row: TypeFond) => {
    setEditItem(row);
    setIsEditMode(true);
    setOpenDialog(true);
  };

  const handleAddNew = () => {
    setEditItem(initialTypeFondState);
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
    if (!editItem?.desig_type_font) newErrors.desig_type_font = 'Designation is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !editItem) return;
    const token = localStorage.getItem('token');

    try {
      if (isEditMode) {
        await axios.put(`${apiUrl}/Update/${editItem.id_type_fond}`, editItem, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${apiUrl}/Add`, editItem, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await fetchData();
      handleCloseDialog();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (row: TypeFond) => {
    if (!window.confirm(`Delete "${row.desig_type_font}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${apiUrl}/Delete/${row.id_type_fond}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchData();
    } catch {
      alert('Delete failed');
    }
  };

  const handleExportExcel = () => {
    const headers = ["ID", "Designation", "Account Debit", "Account Credit"];
    const rows = data.map(s => [
      s.id_type_fond,
      s.desig_type_font,
      s.Account_numbrer_debit,
      s.Account_numbrer_credit,
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TypeFond Data");
    XLSX.writeFile(workbook, "typefond_data.xlsx");
  };

  const columns = useMemo<MRT_ColumnDef<TypeFond>[]>(() => [
    { accessorKey: 'id_type_fond', header: 'ID', size: 80 },
    { accessorKey: 'desig_type_font', header: 'Designation', size: 200 },
    { accessorKey: 'Account_numbrer_debit', header: 'Account Debit', size: 200 },
    { accessorKey: 'Account_numbrer_credit', header: 'Account Credit', size: 200 },
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
            New Asset group
          </Button>
        </Box>

        <MaterialReactTable table={table} />

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>
            {isEditMode ? 'Edit TypeFond' : 'New TypeFond'}
            <Divider sx={{ mb: 0, borderColor: 'grey.300', borderBottomWidth: 2 }} />
          </DialogTitle>

          <DialogContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <TextField
                label="Designation"
                fullWidth
                value={editItem?.desig_type_font || ''}
                onChange={(e) => setEditItem({ ...editItem!, desig_type_font: e.target.value })}
                error={!!errors.desig_type_font}
                helperText={errors.desig_type_font}
              />
              <TextField
                label="Account Number Debit"
                fullWidth
                value={editItem?.Account_numbrer_debit || ''}
                onChange={(e) => setEditItem({ ...editItem!, Account_numbrer_debit: e.target.value })}
              />
              <TextField
                label="Account Number Credit"
                fullWidth
                value={editItem?.Account_numbrer_credit || ''}
                onChange={(e) => setEditItem({ ...editItem!, Account_numbrer_credit: e.target.value })}
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

export default TypeFonds;
