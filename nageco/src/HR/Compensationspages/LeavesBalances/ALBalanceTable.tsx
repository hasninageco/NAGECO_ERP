import React from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import {
  Box, IconButton, Tooltip, Button, useTheme,
  darken
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import AddIcon from '@mui/icons-material/Add';

export type EMPLOYEE = {
  ID_EMP: number;
  NAME: string | null;
  MAIL: string | null;
  End_contrat: string | null;
  STAR_CONTRAT: string | null;
  // New optional field used by the dialog: renewed/renewable contract start
  start_contrat_renouvellable?: string | null;
  // Opening balance for leaves (rasid conge)
  rasid_CONGE?: number | null;
  Nationality: string | null;
  Ref_emp: string | null;
  COST_CENTER: string | null;
  Picture: string | null;
  date_naissance: string | null;
  name_english: string | null;
  IS_FOREINGHT: boolean | null;
  attached_number: string | null;
  NAME_EN: string | null;
  IS_OK_POUR_MALAK: boolean | null;
  NetIjaza: number | null;
  NetIjaza_desert: number | null;
  SOLDE_JOUR_CONGEE_desert: number | null;
  Spends_Vacation: number | null;
  Spends_Field_Break: number | null;
  investissement?: string | number | null;
  coment_nidham_3amal?: string | null;
  RASID_HAKLIYA?: number | boolean | null;
  city: string | null;
  Desert_pass_No: string | null;
  Desert_pass_Comment: string | null;
  Desert_pass_Sent_Email: string | null;
  STATE: string | null;
};

export type EMPLOYEE_WITH_LOG = EMPLOYEE & { _withTimeline?: boolean };

interface ALBalanceTableProps {
  data: EMPLOYEE[];
  loading: boolean;
  stateFilter: 'all' | 'active' | 'inactive';
  setStateFilter: (val: 'all' | 'active' | 'inactive') => void;
  onAddNew: () => void;
  onExportExcel: () => void;
  onLogDialog: (emp: EMPLOYEE_WITH_LOG) => void;
  onFieldBreakLog: (emp: EMPLOYEE_WITH_LOG) => void;
  formatDate: (dateStr: string | null) => string;
}

const ALBalanceTable: React.FC<ALBalanceTableProps> = ({
  data,
  loading,
  stateFilter,
  setStateFilter,
  onAddNew,
  onExportExcel,
  onLogDialog,
  onFieldBreakLog,
  formatDate
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
 
  // Custom date formatter for 'MMM-dd-yyyy' (e.g., Nov-05-2025)
  const formatDateLocal = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    // Return in MMM-dd-yyyy order as requested
    return `${month}-${day}-${year}`;
  };
  // Add explicit types for cell/row in columns
  const columns = React.useMemo<MRT_ColumnDef<EMPLOYEE>[]>(() => [
          { accessorKey: 'investissement', header: 'Crew', size: 100 },
    { accessorKey: 'ID_EMP', header: 'ID', size: 80 },
    { accessorKey: 'Ref_emp', header: 'Employee No.', size: 80 },
    { accessorKey: 'NAME', header: 'Name', size: 150 },
    {
      accessorKey: 'STAR_CONTRAT',
      header: 'Start Contract',
      size: 120,
      Cell: ({ cell }) => formatDateLocal(cell.getValue() as string | null)
    },
    {
      accessorKey: 'End_contrat',
      header: 'End Contract',
      size: 120,
      Cell: ({ cell }) => formatDateLocal(cell.getValue() as string | null)
    },
    {
      accessorKey: 'date_naissance',
      header: 'Birth Date',
      size: 120,
      Cell: ({ cell }) => formatDateLocal(cell.getValue() as string | null)
    },
     
    { accessorKey: 'Spends_Vacation', header: 'Spends Vacation', size: 80 },
    { accessorKey: 'coment_nidham_3amal', header: 'Level', size: 160 },
    {
      accessorKey: 'STATE',
      header: 'State',
      size: 100,
      Cell: (params: { row: { original: EMPLOYEE } }) => {
        const value = params.row.original.STATE;
        if (typeof value === 'boolean') return value ? 'Active' : 'Inactive';
        return '-1';
      }
    },
    {
      header: 'Annual Leave Log',
      id: 'daysWorkedLog',
      size: 120,
      Cell: (params: { row: { original: EMPLOYEE } }) => {
        const emp = params.row.original;
        return (
          <Button size="small" variant="contained" color="info" onClick={() => onLogDialog({ ...emp, _withTimeline: true })}>
            Previews
          </Button>
        );
      },
    },
    {
      header: 'Field Break Log',
      id: 'fieldBreakLog',
      size: 140,
      Cell: (params: { row: { original: EMPLOYEE } }) => {
        const emp = params.row.original;
        const isCrew101 = Number(emp.investissement) === 101;
        if (isCrew101) return null;
        return (
          <Button size="small" variant="contained" color="info" onClick={() => onFieldBreakLog({ ...emp, _withTimeline: false })}>
            Previews
          </Button>
        );
      },
    },
  ], [onLogDialog, onFieldBreakLog, formatDate]);

  const table = useMaterialReactTable({
    columns,
    data,
    state: { isLoading: loading, density: 'compact' },
    enableDensityToggle: true,
    // Ensure the table follows the current MUI theme colors
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        backgroundColor: 'background.paper',
        color: 'text.primary',
      },
    },
    muiTableContainerProps: {
      sx: {
        backgroundColor: 'background.paper',
      },
    },
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderBottomColor: 'divider',
      },
    },
    muiTableBodyCellProps: {
      sx: {
        color: 'text.primary',
        borderBottomColor: 'divider',
      },
    },
    muiTableBodyRowProps: {
      sx: {
        '&:nth-of-type(even)': {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
        },
        '&:hover': {
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
      },
    },
  });

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'flex-start',
      px: { xs: 0, sm: 2, md: 3 },
      py: 1,
     
       
    }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <span style={{ marginRight: 8, fontWeight: 500 }}>State:</span>
          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value as 'all' | 'active' | 'inactive')}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', fontWeight: 500 }}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Box>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<ImportExportIcon />}
          onClick={onExportExcel}
          sx={{ mr: 1, borderRadius: 3, textTransform: 'none', fontWeight: 'bold', px: 3, py: 1 }}
        >
          Export Excel
        </Button>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAddNew}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 'bold', px: 3, py: 1 }}
        >
          New Entry
        </Button>
      </Box>
    
        <MaterialReactTable table={table} />
     
    </Box>
  );
};

export default ALBalanceTable;
