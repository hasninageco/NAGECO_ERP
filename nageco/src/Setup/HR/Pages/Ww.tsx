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

// Define the type based on your model
type WW = {
  int_can: number;
  desig_can: string | null;
  code: string | null;
};

// Initial form state
const initialWWState: WW = {
  int_can: 0,
  desig_can: '',
  code: '',
};

const Ww = () => {
  const [data, setData] = useState<WW[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState<WW | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const navigate = useNavigate();

  const apiUrl = buildApiUrl('/wws');

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate("/login");

    try {
      const response = await axios.get<WW[]>(`${apiUrl}/all`, {
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
    // eslint-disable-next-line
  }, [navigate]);

  const handleEdit = (row: WW) => {
    setEditItem(row);
    setIsEditMode(true);
    setOpenDialog(true);
  };

  const handleAddNew = () => {
    setEditItem(initialWWState);
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
    if (!editItem?.desig_can) newErrors.desig_can = 'Designation is required';
    if (!editItem?.code) newErrors.code = 'Code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !editItem) return;
    const token = localStorage.getItem('token');

    try {
      if (isEditMode) {
        await axios.put(`${apiUrl}/update/${editItem.int_can}`, editItem, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${apiUrl}/add`, editItem, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await fetchData();
      handleCloseDialog();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (row: WW) => {
    if (!window.confirm(`Delete "${row.desig_can}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${apiUrl}/delete/${row.int_can}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchData();
    } catch {
      alert('Delete failed');
    }
  };

  const handleExportExcel = () => {
    const headers = ["ID", "Designation", "Code"];
    const rows = data.map(s => [
      s.int_can,
      s.desig_can,
      s.code,
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "WW Data");
    XLSX.writeFile(workbook, "ww_data.xlsx");
  };

  const columns = useMemo<MRT_ColumnDef<WW>[]>(() => [
    { accessorKey: 'int_can', header: 'ID', size: 80 },
    { accessorKey: 'desig_can', header: 'Designation', size: 300 },
    { accessorKey: 'code', header: 'Code', size: 150 },
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

    initialState: { pagination: { pageSize: 10, pageIndex: 0 } },
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
            New Entry
          </Button>
        </Box>

        <MaterialReactTable table={table} />

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>
            {isEditMode ? 'Edit Entry' : 'New Entry'}
            <Divider sx={{ mb: 0, borderColor: 'grey.300', borderBottomWidth: 2 }} />
          </DialogTitle>

          <DialogContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <TextField
                label="Designation"
                fullWidth
                value={editItem?.desig_can || ''}
                onChange={(e) => setEditItem({ ...editItem!, desig_can: e.target.value })}
                error={!!errors.desig_can}
                helperText={errors.desig_can}
              />
              <TextField
                label="Code"
                fullWidth
                value={editItem?.code || ''}
                onChange={(e) => setEditItem({ ...editItem!, code: e.target.value })}
                error={!!errors.code}
                helperText={errors.code}
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

export default Ww;
