import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../../utils/api';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { MRT_Localization_AR } from 'material-react-table/locales/ar';
import { Box, Button, Card, CardHeader, CardContent, IconButton, TextField, Stack } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import ChildrenDialog from './ChildrenDialog';
import InsuranceHeaderTitle from './InsuranceHeaderTitle';
import { useTranslation } from 'react-i18next';

type Employee = {
  ID_EMP: number;
  NAME: string;
  Ref_emp?: string | null;
  MAIL?: string | null;
  TEL?: string | null;
};

const EmployeeInsuranceList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const apiUrl = buildApiUrl('/employees');

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    try {
      const resp = await axios.get<Employee[]>(`${apiUrl}/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(resp.data || []);
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/login');
      else console.error('Error fetching employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredData = useMemo(() => {
    if (!query) return data;
    const q = query.toLowerCase();
    return data.filter(
      (e) =>
        String(e.ID_EMP).includes(q) ||
        (e.Ref_emp || '').toLowerCase().includes(q) ||
        (e.NAME || '').toLowerCase().includes(q) ||
        (e.MAIL || '').toLowerCase().includes(q) ||
        (e.TEL || '').toLowerCase().includes(q)
    );
  }, [data, query]);

  const columns = useMemo<MRT_ColumnDef<Employee>[]>(
    () => [
      { accessorKey: 'ID_EMP', header: t('insurance.workers.cols.id'), size: 60 },
      { accessorKey: 'Ref_emp', header: t('insurance.workers.cols.employeeNo'), size: 110 },
      { accessorKey: 'NAME', header: t('insurance.workers.cols.name'), size: 220 },
      { accessorKey: 'TEL', header: t('insurance.workers.cols.phone'), size: 140 },
      { accessorKey: 'MAIL', header: t('insurance.workers.cols.email'), size: 200 },
    ],
    [t]
  );

  const table = useMaterialReactTable({
    columns,
    data: filteredData,
    state: { isLoading: loading, density: 'comfortable' },
    enableDensityToggle: true,
    enableGlobalFilter: false,
    initialState: { columnVisibility: { Ref_emp: true } },
    enableRowActions: true,
    displayColumnDefOptions: {
      'mrt-row-actions': {
        header: t('common.actions'),
      },
    },
    localization: (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase().startsWith('ar')
      ? (MRT_Localization_AR as any)
      : undefined,
    renderRowActions: ({ row }: any) => (
      <Stack direction="row" spacing={1}>
        <IconButton
          title={t('insurance.workers.children')}
          onClick={() => openChildDialog(row.original.Ref_emp || row.original.ID_EMP)}
        >
          <PeopleIcon />
        </IconButton>
      </Stack>
    ),
    // ensure actions column appears at the rightmost position
    positionActionsColumn: 'last',
  });

  // Child dialog state (delegated to ChildrenDialog)
  const [childOpen, setChildOpen] = useState(false);
  const [selectedRef, setSelectedRef] = useState<string | number | null>(null);

  const encodeRef = (v: string | number) => {
    try {
      return btoa(encodeURIComponent(String(v)));
    } catch (e) {
      return String(v);
    }
  };

  const decodeRef = (s: string) => {
    try {
      return decodeURIComponent(atob(s));
    } catch (e) {
      return s;
    }
  };

  const openChildDialog = (ref: string | number) => {
    const enc = encodeRef(ref);
    // add query param so refresh keeps dialog open
    navigate(`${location.pathname}?child=${enc}`, { replace: false });
    setSelectedRef(ref);
    setChildOpen(true);
  };

  const closeChildDialog = () => {
    // remove child param from url
    navigate(location.pathname, { replace: false });
    setChildOpen(false);
    setSelectedRef(null);
  };

  // On mount, check URL for child param to restore dialog state
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const enc = params.get('child');
    if (enc) {
      const val = decodeRef(enc);
      setSelectedRef(val);
      setChildOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box p={2}>
      <Card elevation={3}>
        <CardHeader
          title={<InsuranceHeaderTitle title={t('insurance.workers.title')} />}
          subheader={t('insurance.workers.subheader')}
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                placeholder={t('insurance.workers.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                }}
                sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
              />
              <IconButton aria-label="refresh" onClick={() => fetchData()}>
                <RefreshIcon />
              </IconButton>
              <Button variant="contained" color="primary" startIcon={<AddIcon />} sx={{ ml: 1 }}>
                {t('insurance.workers.newInsurance')}
              </Button>
            </Stack>
          }
        />
        <CardContent>
          <MaterialReactTable table={table} />

          <ChildrenDialog open={childOpen} onClose={closeChildDialog} empRef={selectedRef} />
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeeInsuranceList;
