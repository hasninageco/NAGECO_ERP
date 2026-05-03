import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { MRT_Localization_AR } from 'material-react-table/locales/ar';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import TableViewIcon from '@mui/icons-material/TableView';
import { useTranslation } from 'react-i18next';
import { buildApiUrl } from '../utils/api';

type Props = {
  title: string;
  endpoint: string;
  onBack?: () => void;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  errors?: Array<{ field?: string; message?: string }>;
};

type DataRow = Record<string, string | number | boolean | null>;

const normalizeCellValue = (value: unknown): string | number | boolean | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return String(value);
  }
};

const normalizeRows = (input: unknown): DataRow[] => {
  if (!Array.isArray(input)) return [];

  return input
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const source = item as Record<string, unknown>;
      const out: DataRow = {};
      Object.keys(source).forEach((key) => {
        out[key] = normalizeCellValue(source[key]);
      });
      return out;
    });
};

const FleetReadOnlyPage: React.FC<Props> = ({ title, endpoint, onBack }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [rows, setRows] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>('');

  const apiUrl = buildApiUrl(endpoint);

  const withAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  }, [navigate]);

  const fetchRows = useCallback(async () => {
    const headers = withAuth();
    if (!headers) return;

    setLoading(true);
    try {
      const resp = await axios.get<ApiEnvelope<unknown>>(apiUrl, { headers });
      setRows(normalizeRows(resp.data?.data));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to load data';
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  }, [apiUrl, navigate, withAuth]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) => {
      return Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(q));
    });
  }, [query, rows]);

  const keys = useMemo(() => {
    const allKeys = new Set<string>();
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => allKeys.add(key));
    });
    return Array.from(allKeys);
  }, [rows]);

  const columns = useMemo<MRT_ColumnDef<DataRow>[]>(
    () =>
      keys.map((key) => ({
        accessorKey: key,
        header: key,
        size: 150,
        Cell: ({ row }) => String(row.original[key] ?? '-'),
      })),
    [keys]
  );

  const table = useMaterialReactTable({
    columns,
    data: filteredRows,
    state: { isLoading: loading, density: 'comfortable' },
    enableDensityToggle: true,
    enableGlobalFilter: false,
    localization: (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase().startsWith('ar')
      ? (MRT_Localization_AR as unknown as undefined)
      : undefined,
  });

  return (
    <Box p={2}>
      <Card elevation={3}>
        <CardHeader
          title={
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TableViewIcon />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {title}
              </Typography>
            </Stack>
          }
          subheader="Read-only view connected to backend data"
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => (onBack ? onBack() : window.history.back())}
              >
                {t('common.back')}
              </Button>

              <TextField
                size="small"
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                }}
                sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
              />

              <IconButton aria-label="refresh" onClick={() => void fetchRows()}>
                <RefreshIcon />
              </IconButton>
            </Stack>
          }
        />

        <CardContent>
          <MaterialReactTable table={table} />
        </CardContent>
      </Card>
    </Box>
  );
};

export default FleetReadOnlyPage;
