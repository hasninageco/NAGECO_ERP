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

type Administration = {
  id_administratin: number;
  administration: string;
  Branche: string;
  administration_ar: string;
};

const theme = createTheme();

const initialAdminState: Administration = {
  id_administratin: 0,
  administration: '',
  Branche: '',
  administration_ar: '',
};

const Administration = () => {
  const [data, setData] = useState<Administration[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editAdmin, setEditAdmin] = useState<Administration | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const navigate = useNavigate();
  const apiUrl = buildApiUrl('/costCenters');

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate("/login");

    try {
      const response = await axios.get<Administration[]>(`${apiUrl}/all`, {
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

  const handleEdit = (row: Administration) => {
    setEditAdmin(row);
    setIsEditMode(true);
    setOpenDialog(true);
  };

  const handleAddNew = () => {
    setEditAdmin(initialAdminState);
    setIsEditMode(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditAdmin(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!editAdmin?.administration) newErrors.administration = 'Administration name is required';
    if (!editAdmin?.administration_ar) newErrors.administration_ar = 'Arabic name is required';
    if (!editAdmin?.Branche) newErrors.Branche = 'Branch is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !editAdmin) return;
    const token = localStorage.getItem('token');

    try {
      if (isEditMode) {
        await axios.put(`${apiUrl}/Update/${editAdmin.id_administratin}`, editAdmin, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${apiUrl}/Add`, editAdmin, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await fetchData();
      handleCloseDialog();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (row: Administration) => {
    if (!window.confirm(`Delete "${row.administration}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${apiUrl}/Delete/${row.id_administratin}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchData();
    } catch {
      alert('Delete failed');
    }
  };

  const handleExportExcel = () => {
    const headers = ["ID", "Administration", "Arabic Name", "Branch"];
    const rows = data.map(c => [
      c.id_administratin,
      c.administration,
      c.administration_ar,
      c.Branche,
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Administrations");
    XLSX.writeFile(workbook, "administrations.xlsx");
  };

  const columns = useMemo<MRT_ColumnDef<Administration>[]>(() => [
    { accessorKey: 'id_administratin', header: 'ID', size: 60  },
    { accessorKey: 'administration', header: 'Administration', size: 150 },
    { accessorKey: 'administration_ar', header: 'Arabic Name', size: 150 },
    { accessorKey: 'Branche', header: 'Branch', size: 150 },
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
    <>
       
     <Box
        p={0.5}
      
      >
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
            New Cost Center
          </Button>
        </Box>

        <MaterialReactTable table={table} />

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>
            {isEditMode ? 'Edit Administration' : 'New Administration'}
            <Divider sx={{ mb: 0, borderColor: 'grey.300', borderBottomWidth: 2 }} />
          </DialogTitle>

          <DialogContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <TextField
                label="Administration"
                fullWidth
                value={editAdmin?.administration || ''}
                onChange={(e) => setEditAdmin({ ...editAdmin!, administration: e.target.value })}
                error={!!errors.administration}
                helperText={errors.administration}
              />
              <TextField
                label="Arabic Name"
                fullWidth
                value={editAdmin?.administration_ar || ''}
                onChange={(e) => setEditAdmin({ ...editAdmin!, administration_ar: e.target.value })}
                error={!!errors.administration_ar}
                helperText={errors.administration_ar}
              />
              <TextField
                label="Branch"
                fullWidth
                value={editAdmin?.Branche || ''}
                onChange={(e) => setEditAdmin({ ...editAdmin!, Branche: e.target.value })}
                error={!!errors.Branche}
                helperText={errors.Branche}
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseDialog} color="secondary">Cancel</Button>
            <Button onClick={handleSave} color="primary">{isEditMode ? 'Save Changes' : 'Save'}</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default Administration;
