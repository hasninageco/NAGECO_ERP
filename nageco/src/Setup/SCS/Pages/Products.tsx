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
  CssBaseline, Divider, Snackbar, Alert
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import * as XLSX from 'xlsx';

// === Type Definition
type Product = {
  Id_art: number | null;
  desig_art: string | null;
  BARCODE: string | null;
  Alternante_Code: string | null;
  ID_SECTION: number | null;
  Place_item: string | null;
  SECT: string | null;
  Price: number | null;
  QTY_SECURIT: number | null;
  SCIENTIFIC_NAME: string | null;
  PREPARATEUR: number | null;
  Comment: string | null;
  Is_Verified: boolean | null;
  SIZE_ART: string | null;
  contents: string | null;
  CLASSEMENT: string | null;
  CURRENCY: string | null;
  MANUFACRURE: string | null;
  COUNTRY: string | null;
  day_expired: number | null;
  pharmacy?: boolean | null;
  tt?: string | null;
  COST_CENTERS?: CostCenter[]; // For multi-select
};

type Section = {
  ID_SECTION: number;
  DESIG: string;
};

type CostCenter = {
  id_administratin: number;
  administration: string;
  Branche: string;
  administration_ar: string;
};

const initialProductState: Product = {
  Id_art: null,
  desig_art: '',
  BARCODE: '',
  Alternante_Code: '',
  ID_SECTION: null,
  Place_item: '',
  SECT: '',
  Price: null,
  QTY_SECURIT: null,
  SCIENTIFIC_NAME: '',
  PREPARATEUR: null,
  Comment: '',
  Is_Verified: false,
  SIZE_ART: '',
  contents: '',
  CLASSEMENT: '',
  CURRENCY: '',
  MANUFACRURE: '',
  COUNTRY: '',
  day_expired: null,
  pharmacy: false,
  tt: '',
  COST_CENTERS: [],
};

const theme = createTheme();

const Products = () => {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [sections, setSections] = useState<Section[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const navigate = useNavigate();

  const apiUrl = buildApiUrl('/products');

  // Fetch sections and cost centers for autocomplete
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchSections = async () => {
      try {
        const res = await axios.get<Section[]>(buildApiUrl('/sections/all'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSections(res.data);
      } catch {
        setSnackbar({ open: true, message: "Failed to load sections", severity: "error" });
      }
    };

    const fetchCostCenters = async () => {
      try {
        const res = await axios.get<CostCenter[]>(buildApiUrl('/costCenters/all'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCostCenters(res.data);
      } catch {
        setSnackbar({ open: true, message: "Failed to load cost centers", severity: "error" });
      }
    };

    fetchSections();
    fetchCostCenters();
    // eslint-disable-next-line
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate("/login");

    try {
      const response = await axios.get<Product[]>(`${apiUrl}/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) navigate("/login");
      else setSnackbar({ open: true, message: "Failed to fetch products", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [navigate]);

  // Edit handler: always preserve Id_art and map SECT to COST_CENTERS
  const handleEdit = (row: Product) => {
    setEditItem({
      ...row,
      COST_CENTERS: row.SECT
        ? costCenters.filter(cc => row.SECT?.split(',').includes(String(cc.id_administratin)))
        : [],
    });
    setIsEditMode(true);
    setOpenDialog(true);
  };

  // Add handler: always reset Id_art to null
  const handleAddNew = () => {
    setEditItem({ ...initialProductState, Id_art: null, COST_CENTERS: [] });
    setIsEditMode(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditItem(null);
    setErrors({});
  };

  // Only required fields show error coloring
  const validateForm = () => {
    const newErrors: any = {};
    if (!editItem?.desig_art) newErrors.desig_art = 'Designation is required';
    if (!editItem?.SCIENTIFIC_NAME) newErrors.SCIENTIFIC_NAME = 'Scientific Name is required';
    if (!editItem?.BARCODE) newErrors.BARCODE = 'Barcode is required';
    if (!editItem?.Alternante_Code) newErrors.Alternante_Code = 'Alternate Code is required';
    if (!editItem?.ID_SECTION && editItem?.ID_SECTION !== 0) newErrors.ID_SECTION = 'Section is required';
    if (!editItem?.Place_item) newErrors.Place_item = 'Place is required';
    if (!editItem?.COST_CENTERS || editItem?.COST_CENTERS.length === 0) newErrors.COST_CENTERS = 'At least one cost center is required';
    if (!editItem?.QTY_SECURIT && editItem?.QTY_SECURIT !== 0) newErrors.QTY_SECURIT = 'Min. Quantity is required';
    if (!editItem?.day_expired && editItem?.day_expired !== 0) newErrors.day_expired = 'Nbr of Days Expired is required';
    if (!editItem?.SIZE_ART) newErrors.SIZE_ART = 'Size is required';
    if (!editItem?.contents) newErrors.contents = 'Contents is required';
    if (!editItem?.CLASSEMENT) newErrors.CLASSEMENT = 'Classification is required';
    if (!editItem?.COUNTRY) newErrors.COUNTRY = 'Country is required';
    if (!editItem?.MANUFACRURE) newErrors.MANUFACRURE = 'Manufacturer is required';
    if (!editItem?.Comment) newErrors.Comment = 'Comment is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !editItem) return;
    const token = localStorage.getItem('token');

    // Store SECT as comma-separated string of cost center IDs
    const SECT = editItem.COST_CENTERS?.map(cc => cc.id_administratin).join(',') || '';

    try {
      if (isEditMode && editItem.Id_art) {
          
        await axios.put(`${apiUrl}/Update/${editItem.Id_art}`, { ...editItem, SECT }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({ open: true, message: "Product updated successfully", severity: "success" });
      } else {
        await axios.post(`${apiUrl}/Add`, { ...editItem, Id_art: null, SECT }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({ open: true, message: "Product added successfully", severity: "success" });
      }
      await fetchData();
      handleCloseDialog();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Save failed', severity: "error" });
    }
  };

  const handleDelete = async (row: Product) => {
    if (!window.confirm(`Delete "${row.desig_art}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${apiUrl}/Delete/${row.Id_art}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbar({ open: true, message: "Product deleted successfully", severity: "success" });
      await fetchData();
    } catch {
      setSnackbar({ open: true, message: "Delete failed", severity: "error" });
    }
  };

  const handleExportExcel = () => {
    const headers = [
      "ID", "Designation", "Barcode", "Alternate Code", "Section",
      "Place", "Cost Centers", "Price", "Security Qty", "Scientific Name",
      "Preparer", "Comment", "Verified",   "Size",
      "Contents", "Classification", "Currency", "Manufacturer",
      "Country",  "Days Expired" 
    ];

    const rows = data.map(p => [
      p.Id_art,
      p.desig_art,
      p.BARCODE,
      p.Alternante_Code,
      sections.find(s => s.ID_SECTION === p.ID_SECTION)?.DESIG || p.ID_SECTION,
      p.Place_item,
      // Show cost center names in export
      (p.SECT || '')
        .split(',')
        .map(id => costCenters.find(cc => String(cc.id_administratin) === id)?.administration || id)
        .join(', '),
      p.Price,
      p.QTY_SECURIT,
      p.SCIENTIFIC_NAME,
      p.PREPARATEUR,
      p.Comment,
      p.SIZE_ART,
      p.contents,
      p.CLASSEMENT,
      p.CURRENCY,
      p.MANUFACRURE,
      p.COUNTRY,
      p.day_expired,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "products_data.xlsx");
  };

 
  const countryOptions = ['USA', 'UK', 'France', 'Germany', 'Japan', 'China'];

  const columns = useMemo<MRT_ColumnDef<Product>[]>(() => [
    { accessorKey: 'Id_art', header: 'ID', size: 70 },
    {
      accessorKey: 'desig_art',
      header: 'Designation',
      Cell: ({ row }) => (
        <Box>
          <div style={{ fontWeight: 500 }}>{row.original.desig_art}</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            {row.original.SCIENTIFIC_NAME}
          </div>
        </Box>
      ),
    },
    { accessorKey: 'BARCODE', header: 'Barcode' },
    { accessorKey: 'Alternante_Code', header: 'Alternante Code' },
    {
      accessorKey: 'SECT',
      header: 'Related Cost Centers',
      Cell: ({ cell }) => {
        const sect = cell.getValue<string>() || '';
        const names = sect
          .split(',')
          .map(id =>
            costCenters.find(cc => String(cc.id_administratin) === id)?.administration || id
          )
          .join(', ');
        return names;
      }
    },
    {
      accessorKey: 'ID_SECTION',
      header: 'Section',
      Cell: ({ cell }) => {
        const section = sections.find(s => s.ID_SECTION === cell.getValue<number>());
        return section ? `${section.DESIG} (${section.ID_SECTION})` : '';
      }
    },
    { accessorKey: 'Comment', header: 'Comment' },
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
  ], [costCenters, sections]);

  const getSectionOptionLabel = (option: Section) => `${option.DESIG} (${option.ID_SECTION})`;
  const getCostCenterOptionLabel = (option: CostCenter) =>
    `${option.administration} (${option.Branche})`;

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
     
  });

  return (
    
      <Box p={1}>
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
            New Product
          </Button>
        </Box>

        <MaterialReactTable table={table} />

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {isEditMode ? 'Edit Product' : 'New Product'}
            <Divider sx={{ mb: 0, borderColor: 'grey.300', borderBottomWidth: 2 }} />
          </DialogTitle>

          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {/* 1st row */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Product designation"
                  value={editItem?.desig_art || ''}
                  onChange={(e) => setEditItem({ ...editItem!, desig_art: e.target.value })}
                  error={!!errors.desig_art}
                  helperText={errors.desig_art}
                  required
                  fullWidth
                />
                <TextField
                  label="Scientific Name"
                  value={editItem?.SCIENTIFIC_NAME || ''}
                  onChange={(e) => setEditItem({ ...editItem!, SCIENTIFIC_NAME: e.target.value })}
                  error={!!errors.SCIENTIFIC_NAME}
                  helperText={errors.SCIENTIFIC_NAME}
                  required
                  fullWidth
                />
              </Box>
              {/* 2nd row */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Barcode"
                  value={editItem?.BARCODE || ''}
                  onChange={(e) => setEditItem({ ...editItem!, BARCODE: e.target.value })}
                  error={!!errors.BARCODE}
                  helperText={errors.BARCODE}
                  required
                  fullWidth
                />
                <TextField
                  label="Classification"
                  value={editItem?.CLASSEMENT || ''}
                  onChange={(e) => setEditItem({ ...editItem!, CLASSEMENT: e.target.value })}
                  error={!!errors.CLASSEMENT}
                  helperText={errors.CLASSEMENT}
                  required
                  fullWidth
                />

                <TextField
                  label="Alternate Code"
                  value={editItem?.Alternante_Code || ''}
                  onChange={(e) => setEditItem({ ...editItem!, Alternante_Code: e.target.value })}
                  error={!!errors.Alternante_Code}
                  helperText={errors.Alternante_Code}
                  required
                  fullWidth
                />
              </Box>
              {/* 4th row */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Autocomplete
                  options={sections}
                  getOptionLabel={getSectionOptionLabel}
                  value={sections.find(s => s.ID_SECTION === editItem?.ID_SECTION) || null}
                  onChange={(_, newValue) => setEditItem({ ...editItem!, ID_SECTION: newValue?.ID_SECTION ?? null })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Section"
                      required
                      error={!!errors.ID_SECTION}
                      helperText={errors.ID_SECTION}
                      fullWidth
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.ID_SECTION === value.ID_SECTION}
                  fullWidth
                />


                <TextField
                  label="Place"
                  value={editItem?.Place_item || ''}
                  onChange={(e) => setEditItem({ ...editItem!, Place_item: e.target.value })}
                  error={!!errors.Place_item}
                  helperText={errors.Place_item}
                  required
                  fullWidth
                />

              </Box>
              {/* 5th row */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Min. Quantity"
                  type="number"
                  value={editItem?.QTY_SECURIT || ''}
                  onChange={(e) => setEditItem({
                    ...editItem!,
                    QTY_SECURIT: e.target.value ? parseInt(e.target.value) : null
                  })}
                  error={!!errors.QTY_SECURIT}
                  helperText={errors.QTY_SECURIT}
                  required
                  fullWidth
                />
                <TextField
                  label="Nbr of Days Expired"
                  type="number"
                  value={editItem?.day_expired || ''}
                  onChange={(e) => setEditItem({
                    ...editItem!,
                    day_expired: e.target.value ? parseInt(e.target.value) : null
                  })}
                  error={!!errors.day_expired}
                  helperText={errors.day_expired}
                  required
                  fullWidth
                />


                <TextField
                  label="Size"
                  value={editItem?.SIZE_ART || ''}
                  onChange={(e) => setEditItem({ ...editItem!, SIZE_ART: e.target.value })}
                  error={!!errors.SIZE_ART}
                  helperText={errors.SIZE_ART}
                  required
                  fullWidth
                />
                <TextField
                  label="Contents"
                  value={editItem?.contents || ''}
                  onChange={(e) => setEditItem({ ...editItem!, contents: e.target.value })}
                  error={!!errors.contents}
                  helperText={errors.contents}
                  required
                  fullWidth
                />
              </Box>
              {/* 7th row */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Autocomplete
                  options={countryOptions}
                  value={editItem?.COUNTRY || ''}
                  onChange={(event, newValue) => {
                    setEditItem({ ...editItem!, COUNTRY: newValue || '' });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Country" fullWidth required error={!!errors.COUNTRY} helperText={errors.COUNTRY} />
                  )}
                  fullWidth
                />
                <TextField
                  label="Manufacturer"
                  value={editItem?.MANUFACRURE || ''}
                  onChange={(e) => setEditItem({ ...editItem!, MANUFACRURE: e.target.value })}
                  error={!!errors.MANUFACRURE}
                  helperText={errors.MANUFACRURE}
                  required
                  fullWidth
                />
              </Box>




              <Autocomplete
                multiple
                options={costCenters}
                getOptionLabel={getCostCenterOptionLabel}
                value={editItem?.COST_CENTERS || []}
                onChange={(_, newValue) => setEditItem({ ...editItem!, COST_CENTERS: newValue })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Related Cost Centers"
                    required
                    error={!!errors.COST_CENTERS}
                    helperText={errors.COST_CENTERS}
                    fullWidth
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id_administratin === value.id_administratin}
                fullWidth
              />

              {/* 10th row: Comment full width */}
              <TextField
                label="Comment"
                multiline
                rows={3}
                value={editItem?.Comment || ''}
                onChange={(e) => setEditItem({ ...editItem!, Comment: e.target.value })}
                error={!!errors.Comment}
                helperText={errors.Comment}
                required
                fullWidth
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
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
     
  );
};

export default Products;