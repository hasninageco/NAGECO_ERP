import React, { ChangeEvent, useEffect, useState, useMemo } from 'react';
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
  Divider, Snackbar, Alert
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

// Vendor type
type Vendor = {
  id_supplier_client: number | null;
  Name_supplier_client: string;
  Code__supplier_client: string;
  Tel: string;
  Adress: string;
  Control_Account: string;
  Email: string;
  List_currency: string[];
  TYPE_CUS_SUPP: boolean;
  logo: string | null;
  Files: string[];
};

type COAAccount = { Acc_No: string; Name_M: string };

const initialVendorState: Vendor = {
  id_supplier_client: null,
  Name_supplier_client: '',
  Code__supplier_client: '',
  Tel: '',
  Adress: '',
  Control_Account: '',
  Email: '',
  List_currency: [],
  TYPE_CUS_SUPP: false,
  logo: '',
  Files: [],
};

const currencyOptions = [
  { label: 'LYD' },
  { label: 'USD' },
  { label: 'EUR' },
  { label: 'GBP' },
  { label: 'CNY' },
  { label: 'JPY' },
];

const Vendors = () => {
  const [data, setData] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState<Vendor | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [coaOptions, setCoaOptions] = useState<COAAccount[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const navigate = useNavigate();

  const apiUrl = buildApiUrl('/vendors');

  // Fetch COA accounts
  useEffect(() => {
    const fetchCOA = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get<COAAccount[]>(buildApiUrl('/coas/all'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCoaOptions(res.data);
      } catch {
        setCoaOptions([]);
      }
    };
    fetchCOA();
  }, []);

  // Fetch vendors
  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate("/login");
    try {
      const response = await axios.get<Vendor[]>(`${apiUrl}/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) navigate("/login");
      else setSnackbar({ open: true, message: "Failed to fetch vendors", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  // Show preview when editing
  useEffect(() => {
    if (editItem?.logo && typeof editItem.logo === 'string' && editItem.logo.startsWith('data:image')) {
      setLogoPreview(editItem.logo);
    } else {
      setLogoPreview(null);
    }
  }, [editItem]);

  const handleEdit = (row: Vendor) => {
    setEditItem({ ...row });
    setIsEditMode(true);
    setOpenDialog(true);
  };

  const handleAddNew = () => {
    setEditItem({ ...initialVendorState });
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
    if (!editItem?.Name_supplier_client) newErrors.Name_supplier_client = 'Name is required';
    if (!editItem?.Code__supplier_client) newErrors.Code__supplier_client = 'Code is required';
    if (!editItem?.Tel) newErrors.Tel = 'Tel is required';
    if (!editItem?.Adress) newErrors.Adress = 'Address is required';
    if (!editItem?.Control_Account) newErrors.Control_Account = 'Control Account is required';
    else if (editItem.Control_Account.length !== 10) newErrors.Control_Account = 'Control Account must be exactly 10 characters';
    if (!editItem?.Email) newErrors.Email = 'Email is required';
    if (!editItem?.List_currency || editItem.List_currency.length === 0) newErrors.List_currency = 'At least one currency is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !editItem) return;
    const token = localStorage.getItem('token');
    const payload = {
      ...editItem,
      List_currency: Array.isArray(editItem.List_currency)
        ? editItem.List_currency.join(',')
        : editItem.List_currency,
      Files: Array.isArray(editItem.Files) ? editItem.Files : [],
    };
    try {
      if (isEditMode && editItem.id_supplier_client) {
        await axios.put(`${apiUrl}/update/${editItem.id_supplier_client}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({ open: true, message: "Vendor updated successfully", severity: "success" });
      } else {
        await axios.post(`${apiUrl}/add`, { ...payload, id_supplier_client: null }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({ open: true, message: "Vendor added successfully", severity: "success" });
      }
      await fetchData();
      handleCloseDialog();
    } catch (error: any) {
      console.error("Save error:", error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Save failed', severity: "error" });
    }
  };

  const handleDelete = async (row: Vendor) => {
    if (!window.confirm(`Delete "${row.Name_supplier_client}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${apiUrl}/delete/${row.id_supplier_client}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbar({ open: true, message: "Vendor deleted successfully", severity: "success" });
      await fetchData();
    } catch {
      setSnackbar({ open: true, message: "Delete failed", severity: "error" });
    }
  };

  // Handle file input
  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setLogoPreview(base64);
      setEditItem((prev) => prev ? { ...prev, logo: base64 } : prev);
    };
    reader.readAsDataURL(file);
  };

  // Add file handler
  const handleFilesChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    try {
      const res = await axios.post(buildApiUrl('/upload/files'), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Save only the URLs in Files
      const fileUrls = res.data.files.map((f: any) => f.url);
      setEditItem(prev => prev ? { ...prev, Files: [...(prev.Files || []), ...fileUrls] } : prev);
    } catch (err) {
      console.error("File upload error:", err);
      setSnackbar({ open: true, message: "File upload failed", severity: "error" });
    }
  };

  const columns = useMemo<MRT_ColumnDef<Vendor>[]>(() => [
    {
      accessorKey: 'logo',
      header: 'Logo',
      Cell: ({ cell }) => {
        const value = cell.getValue<string>();
        if (typeof value === 'string' && value.startsWith('data:image')) {
          return (
            <img
              src={value}
              alt="logo"
              style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4, border: '1px solid #eee' }}
            />
          );
        }
        return null;
      }
    },
    { accessorKey: 'id_supplier_client', header: 'ID', size: 70 },
    { accessorKey: 'Name_supplier_client', header: 'Name' },
    { accessorKey: 'Code__supplier_client', header: 'Code' },
    { accessorKey: 'Tel', header: 'Tel' },
    { accessorKey: 'Adress', header: 'Address' },
    
    { accessorKey: 'Email', header: 'Email' },
    
     
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
    state: { isLoading: loading },
    enableRowSelection: false,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: true,
    enablePagination: true,
    initialState: { pagination: { pageSize: 5, pageIndex: 0 } },
    muiTableContainerProps: {
      sx: { maxWidth: '100vw', overflowX: 'auto' }
    }
  });

  return (
   
      <Box sx={{ p: { xs: 0.5, sm: 2 }, width: '100%' }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'flex-end',
          mb: 1,
          gap: 1
        }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
              py: 1,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            New Vendor
          </Button>
        </Box>

        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <MaterialReactTable table={table} />
        </Box>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {isEditMode ? 'Edit Vendor' : 'New Vendor'}
            <Divider sx={{ mb: 0, borderColor: 'grey.300', borderBottomWidth: 2 }} />
          </DialogTitle>

          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {/* Logo upload and preview */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    border: '1px solid #ccc',
                    background: '#fafafa',
                    p: 0.5,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    '&:hover .upload-overlay': { opacity: 1 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleLogoChange}
                  />
                  {logoPreview ? (
                    <Box
                      component="img"
                      src={logoPreview}
                      alt="Logo Preview"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        borderRadius: 2,
                      }}
                    />
                  ) : (
                    <PhotoCamera sx={{ fontSize: 32, color: '#bbb' }} />
                  )}
                  <Box
                    className="upload-overlay"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      bgcolor: 'rgba(0,0,0,0.4)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      fontWeight: 'bold',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Upload Logo
                  </Box>
                </Box>
              </Box>

              <TextField
                label="Name"
                value={editItem?.Name_supplier_client || ''}
                onChange={(e) => setEditItem({ ...editItem!, Name_supplier_client: e.target.value })}
                error={!!errors.Name_supplier_client}
                helperText={errors.Name_supplier_client}
                required
                fullWidth
              />
              <TextField
                label="Code"
                value={editItem?.Code__supplier_client || ''}
                onChange={(e) => setEditItem({ ...editItem!, Code__supplier_client: e.target.value })}
                error={!!errors.Code__supplier_client}
                helperText={errors.Code__supplier_client}
                required
                fullWidth
              />

              {/* Tel and Type on the same line */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Tel"
                  value={editItem?.Tel || ''}
                  onChange={(e) => setEditItem({ ...editItem!, Tel: e.target.value })}
                  error={!!errors.Tel}
                  helperText={errors.Tel}
                  required
                  fullWidth
                  sx={{ flex: 1 }}
                />
                <Autocomplete
                  options={[
                    { label: "Supplier", value: true },
                    { label: "Customer", value: false }
                  ]}
                  getOptionLabel={option => option.label}
                  value={editItem ? (editItem.TYPE_CUS_SUPP ? { label: "Supplier", value: true } : { label: "Customer", value: false }) : null}
                  onChange={(_, newValue) => setEditItem({ ...editItem!, TYPE_CUS_SUPP: newValue?.value ?? false })}
                  renderInput={(params) => (
                    <TextField {...params} label="Type" required fullWidth />
                  )}
                  fullWidth
                  sx={{ flex: 1 }}
                />
              </Box>

              <TextField
                label="Address"
                value={editItem?.Adress || ''}
                onChange={(e) => setEditItem({ ...editItem!, Adress: e.target.value })}
                error={!!errors.Adress}
                helperText={errors.Adress}
                required
                fullWidth
              />
              <Autocomplete
                options={coaOptions}
                getOptionLabel={(option) => `${option.Acc_No} - ${option.Name_M}`}
                value={coaOptions.find(acc => acc.Acc_No === editItem?.Control_Account) || null}
                onChange={(_, newValue) => setEditItem({ ...editItem!, Control_Account: newValue?.Acc_No || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Control Account"
                    required
                    error={!!errors.Control_Account}
                    helperText={errors.Control_Account}
                    fullWidth
                  />
                )}
                isOptionEqualToValue={(option, value) => option.Acc_No === value.Acc_No}
                fullWidth
              />
              <TextField
                label="Email"
                value={editItem?.Email || ''}
                onChange={(e) => setEditItem({ ...editItem!, Email: e.target.value })}
                error={!!errors.Email}
                helperText={errors.Email}
                required
                fullWidth
              />
              <Autocomplete
                multiple
                options={currencyOptions}
                getOptionLabel={option => option.label}
                value={currencyOptions.filter(opt => editItem?.List_currency?.includes(opt.label))}
                onChange={(_, newValue) =>
                  setEditItem({
                    ...editItem!,
                    List_currency: newValue.map(opt => opt.label)
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Currency"
                    required
                    error={!!errors.List_currency}
                    helperText={errors.List_currency}
                    fullWidth
                  />
                )}
                fullWidth
              />

              {/* File upload section */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCamera />}
                >
                  Upload Files
                  <input
                    type="file"
                    multiple
                    hidden
                    onChange={handleFilesChange}
                  />
                </Button>
                {editItem?.Files && editItem.Files.length > 0 && (
                  <Box>
                    {editItem.Files.map((file, idx) => (
                      <a
                        key={idx}
                        href={`${buildApiUrl('')}${file.startsWith('/uploads/') ? file : '/uploads/' + file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'block', fontSize: 12 }}
                      >
                        File {idx + 1}
                      </a>
                    ))}
                  </Box>
                )}
              </Box>
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
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
     
  );
};

export default Vendors;