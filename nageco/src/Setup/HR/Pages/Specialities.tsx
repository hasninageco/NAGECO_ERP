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

// Define the type based on your table structure
type Specialite = {
  id_specialite: number;
  nom_specialite: string;
};

// Initial form state
const initialSpecialiteState: Specialite = {
  id_specialite: 0,
  nom_specialite: '',
};

const Specialities = () => {
  const [data, setData] = useState<Specialite[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editSpecialite, setEditSpecialite] = useState<Specialite | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const navigate = useNavigate();

  // Update your API URL here
  const apiUrl = buildApiUrl('/specialities');

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate("/login");

    try {
      const response = await axios.get<Specialite[]>(`${apiUrl}/all`, {
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

  const handleEdit = (row: Specialite) => {
    setEditSpecialite(row);
    setIsEditMode(true);
    setOpenDialog(true);
  };

  const handleAddNew = () => {
    setEditSpecialite(initialSpecialiteState);
    setIsEditMode(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditSpecialite(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!editSpecialite?.nom_specialite) newErrors.nom_specialite = 'Specialty name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !editSpecialite) return;
    const token = localStorage.getItem('token');

    try {
      if (isEditMode) {
        await axios.put(`${apiUrl}/Update/${editSpecialite.id_specialite}`, editSpecialite, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${apiUrl}/Add`, editSpecialite, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await fetchData();
      handleCloseDialog();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (row: Specialite) => {
    if (!window.confirm(`Delete "${row.nom_specialite}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${apiUrl}/Delete/${row.id_specialite}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchData();
    } catch {
      alert('Delete failed');
    }
  };

  const handleExportExcel = () => {
    const headers = ["ID", "Specialty"];
    const rows = data.map(s => [
      s.id_specialite,
      s.nom_specialite,
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Specialites");
    XLSX.writeFile(workbook, "specialites.xlsx");
  };

  const columns = useMemo<MRT_ColumnDef<Specialite>[]>(() => [
    { accessorKey: 'id_specialite', header: 'ID', size: 80 },
    { accessorKey: 'nom_specialite', header: 'Specialty', size: 200 },
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
            New Specialty
          </Button>
        </Box>

        <MaterialReactTable table={table} />

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>
            {isEditMode ? 'Edit Specialty' : 'New Specialty'}
            <Divider sx={{ mb: 0, borderColor: 'grey.300', borderBottomWidth: 2 }} />
          </DialogTitle>

          <DialogContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <TextField
                label="Specialty Name"
                fullWidth
                value={editSpecialite?.nom_specialite || ''}
                onChange={(e) => setEditSpecialite({ ...editSpecialite!, nom_specialite: e.target.value })}
                error={!!errors.nom_specialite}
                helperText={errors.nom_specialite}
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

export default Specialities;
