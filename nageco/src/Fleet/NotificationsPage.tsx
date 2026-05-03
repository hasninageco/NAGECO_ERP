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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import { useTranslation } from 'react-i18next';
import { buildApiUrl } from '../utils/api';

type Props = {
  onBack?: () => void;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  errors?: Array<{ field?: string; message?: string }>;
};

type NotificationItem = {
  ID_NOTIFICATION: number;
  TRANSACTION_TYPE: string;
  TRANSACTION_ID: number;
  ID_VEHICLE?: number | null;
  ID_EMP?: string | null;
  TITLE: string;
  MESSAGE?: string | null;
  END_DATE?: string | null;
  DAYS_BEFORE?: number | null;
  REMAINING_DAYS?: number | null;
  PRIORITY?: string | null;
  STATUS: string;
  READ_AT?: string | null;
};

type NotificationRule = {
  ID_RULE: number;
  TRANSACTION_TYPE: string;
  DAYS_BEFORE: number;
  NOTIFY_ROLE?: string | null;
  PRIORITY: string;
  IS_ACTIVE: boolean | number;
};

type EditRule = {
  idRule?: number;
  transactionType: string;
  daysBefore: number | '';
  notifyRole: string;
  priority: string;
  isActive: boolean;
};

const TRANSACTION_TYPES = ['Vehicle Insurance', 'Maintenance', 'Trip', 'Document', 'Employee Contract'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const toBoolean = (value: unknown): boolean => value === true || value === 1 || value === '1';

const defaultEditRule = (): EditRule => ({
  transactionType: 'Document',
  daysBefore: '',
  notifyRole: '',
  priority: 'Medium',
  isActive: true,
});

const NotificationsPage: React.FC<Props> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const notificationsApiUrl = buildApiUrl('/fleet/notifications');
  const rulesApiUrl = buildApiUrl('/fleet/notifications/rules');

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notificationQuery, setNotificationQuery] = useState<string>('');
  const [ruleQuery, setRuleQuery] = useState<string>('');
  const [editRuleOpen, setEditRuleOpen] = useState<boolean>(false);
  const [editRule, setEditRule] = useState<EditRule | null>(null);

  const withAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  }, [navigate]);

  const extractErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      const respData = error.response?.data as ApiEnvelope<unknown> | undefined;
      const rawErrors = respData?.errors;
      const apiErrors = Array.isArray(rawErrors) ? rawErrors : [];
      if (apiErrors.length > 0) {
        const msg = apiErrors
          .map((e) => e.message)
          .filter(Boolean)
          .join('\n');
        if (msg) return msg;
      }
      if (typeof respData?.message === 'string' && respData.message.trim()) {
        return respData.message;
      }
      if (typeof error.message === 'string' && error.message.trim()) {
        return error.message;
      }
    }
    return fallback;
  };

  const fetchData = useCallback(async () => {
    const headers = withAuth();
    if (!headers) return;

    setLoading(true);
    try {
      const [notificationsResp, rulesResp] = await Promise.all([
        axios.get<ApiEnvelope<NotificationItem[]>>(notificationsApiUrl, { headers }),
        axios.get<ApiEnvelope<NotificationRule[]>>(rulesApiUrl, { headers }),
      ]);

      setNotifications(Array.isArray(notificationsResp.data?.data) ? notificationsResp.data.data : []);
      setRules(Array.isArray(rulesResp.data?.data) ? rulesResp.data.data : []);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to load notifications data'));
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, notificationsApiUrl, rulesApiUrl, withAuth]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => String(item.STATUS || '').toLowerCase() === 'unread').length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    const q = notificationQuery.trim().toLowerCase();
    if (!q) return notifications;

    return notifications.filter((row) => {
      return (
        String(row.ID_NOTIFICATION).includes(q) ||
        String(row.TRANSACTION_TYPE || '').toLowerCase().includes(q) ||
        String(row.TRANSACTION_ID || '').includes(q) ||
        String(row.ID_EMP || '').toLowerCase().includes(q) ||
        String(row.TITLE || '').toLowerCase().includes(q) ||
        String(row.MESSAGE || '').toLowerCase().includes(q) ||
        String(row.PRIORITY || '').toLowerCase().includes(q) ||
        String(row.STATUS || '').toLowerCase().includes(q)
      );
    });
  }, [notificationQuery, notifications]);

  const filteredRules = useMemo(() => {
    const q = ruleQuery.trim().toLowerCase();
    if (!q) return rules;

    return rules.filter((row) => {
      return (
        String(row.ID_RULE).includes(q) ||
        String(row.TRANSACTION_TYPE || '').toLowerCase().includes(q) ||
        String(row.DAYS_BEFORE || '').includes(q) ||
        String(row.NOTIFY_ROLE || '').toLowerCase().includes(q) ||
        String(row.PRIORITY || '').toLowerCase().includes(q) ||
        String(toBoolean(row.IS_ACTIVE)).toLowerCase().includes(q)
      );
    });
  }, [ruleQuery, rules]);

  const notificationColumns = useMemo<MRT_ColumnDef<NotificationItem>[]>(
    () => [
      { accessorKey: 'ID_NOTIFICATION', header: 'ID', size: 70 },
      { accessorKey: 'TRANSACTION_TYPE', header: 'Type', size: 140 },
      { accessorKey: 'TRANSACTION_ID', header: 'Ref ID', size: 90 },
      { accessorKey: 'ID_EMP', header: 'Employee Ref', size: 120 },
      { accessorKey: 'TITLE', header: 'Title', size: 190 },
      {
        accessorKey: 'MESSAGE',
        header: 'Message',
        size: 260,
        Cell: ({ row }) => {
          const value = String(row.original.MESSAGE || '');
          return value.length > 100 ? `${value.slice(0, 100)}...` : value;
        },
      },
      { accessorKey: 'END_DATE', header: 'End Date', size: 120 },
      { accessorKey: 'DAYS_BEFORE', header: 'Days Before', size: 100 },
      { accessorKey: 'REMAINING_DAYS', header: 'Remaining', size: 100 },
      { accessorKey: 'PRIORITY', header: 'Priority', size: 90 },
      { accessorKey: 'STATUS', header: 'Status', size: 100 },
    ],
    []
  );

  const ruleColumns = useMemo<MRT_ColumnDef<NotificationRule>[]>(
    () => [
      { accessorKey: 'ID_RULE', header: 'Rule ID', size: 80 },
      { accessorKey: 'TRANSACTION_TYPE', header: 'Transaction Type', size: 180 },
      { accessorKey: 'DAYS_BEFORE', header: 'Days Before', size: 110 },
      { accessorKey: 'NOTIFY_ROLE', header: 'Notify Role', size: 130 },
      { accessorKey: 'PRIORITY', header: 'Priority', size: 100 },
      {
        accessorKey: 'IS_ACTIVE',
        header: 'Active',
        size: 80,
        Cell: ({ row }) => (toBoolean(row.original.IS_ACTIVE) ? 'Yes' : 'No'),
      },
    ],
    []
  );

  const markAsRead = async (item: NotificationItem) => {
    const headers = withAuth();
    if (!headers) return;

    try {
      await axios.patch(`${notificationsApiUrl}/${item.ID_NOTIFICATION}/read`, {}, { headers });
      await fetchData();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to mark notification as read'));
      }
    }
  };

  const dismiss = async (item: NotificationItem) => {
    const headers = withAuth();
    if (!headers) return;

    try {
      await axios.patch(`${notificationsApiUrl}/${item.ID_NOTIFICATION}/dismiss`, {}, { headers });
      await fetchData();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to dismiss notification'));
      }
    }
  };

  const generateNotifications = async () => {
    const headers = withAuth();
    if (!headers) return;

    try {
      const resp = await axios.post<ApiEnvelope<Record<string, number>>>(`${notificationsApiUrl}/generate`, {}, { headers });
      const data = resp.data?.data;
      alert(`Generated: ${data?.generated ?? 0}\nSkipped: ${data?.skipped ?? 0}`);
      await fetchData();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to generate notifications'));
      }
    }
  };

  const openCreateRule = () => {
    setEditRule(defaultEditRule());
    setEditRuleOpen(true);
  };

  const openEditRule = (row: NotificationRule) => {
    setEditRule({
      idRule: row.ID_RULE,
      transactionType: row.TRANSACTION_TYPE || 'Document',
      daysBefore: row.DAYS_BEFORE,
      notifyRole: row.NOTIFY_ROLE || '',
      priority: row.PRIORITY || 'Medium',
      isActive: toBoolean(row.IS_ACTIVE),
    });
    setEditRuleOpen(true);
  };

  const closeRuleEdit = () => {
    setEditRuleOpen(false);
    setEditRule(null);
  };

  const saveRule = async () => {
    if (!editRule) return;

    const headers = withAuth();
    if (!headers) return;

    const payload = {
      transactionType: editRule.transactionType,
      daysBefore: Number(editRule.daysBefore),
      notifyRole: editRule.notifyRole.trim() || null,
      priority: editRule.priority,
      isActive: editRule.isActive,
    };

    try {
      if (editRule.idRule) {
        await axios.put(`${rulesApiUrl}/${editRule.idRule}`, payload, { headers });
      } else {
        await axios.post(rulesApiUrl, payload, { headers });
      }
      closeRuleEdit();
      await fetchData();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to save notification rule'));
      }
    }
  };

  const deleteRule = async (row: NotificationRule) => {
    const headers = withAuth();
    if (!headers) return;

    const ok = window.confirm(`Delete rule #${row.ID_RULE}?`);
    if (!ok) return;

    try {
      await axios.delete(`${rulesApiUrl}/${row.ID_RULE}`, { headers });
      await fetchData();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        alert(extractErrorMessage(error, 'Failed to delete notification rule'));
      }
    }
  };

  const canSaveRule = useMemo(() => {
    if (!editRule) return false;
    if (!TRANSACTION_TYPES.includes(editRule.transactionType)) return false;
    if (!PRIORITIES.includes(editRule.priority)) return false;
    if (editRule.daysBefore === '') return false;
    const daysBefore = Number(editRule.daysBefore);
    if (!Number.isInteger(daysBefore) || daysBefore < 0) return false;
    return true;
  }, [editRule]);

  const notificationsTable = useMaterialReactTable({
    columns: notificationColumns,
    data: filteredNotifications,
    state: { isLoading: loading, density: 'comfortable' },
    enableDensityToggle: true,
    enableGlobalFilter: false,
    enableRowActions: true,
    positionActionsColumn: 'last',
    displayColumnDefOptions: {
      'mrt-row-actions': {
        header: t('common.actions'),
      },
    },
    localization: (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase().startsWith('ar')
      ? (MRT_Localization_AR as unknown as undefined)
      : undefined,
    renderRowActions: ({ row }) => {
      const item = row.original;
      const status = String(item.STATUS || '').toLowerCase();
      return (
        <Stack direction="row" spacing={0.5}>
          <IconButton
            title="Mark as Read"
            onClick={() => void markAsRead(item)}
            disabled={status === 'read' || status === 'dismissed'}
          >
            <MarkEmailReadIcon />
          </IconButton>
          <IconButton
            title="Dismiss"
            onClick={() => void dismiss(item)}
            disabled={status === 'dismissed'}
          >
            <BlockIcon />
          </IconButton>
        </Stack>
      );
    },
  });

  const rulesTable = useMaterialReactTable({
    columns: ruleColumns,
    data: filteredRules,
    state: { isLoading: loading, density: 'comfortable' },
    enableDensityToggle: true,
    enableGlobalFilter: false,
    enableRowActions: true,
    positionActionsColumn: 'last',
    displayColumnDefOptions: {
      'mrt-row-actions': {
        header: t('common.actions'),
      },
    },
    localization: (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase().startsWith('ar')
      ? (MRT_Localization_AR as unknown as undefined)
      : undefined,
    renderRowActions: ({ row }) => (
      <Stack direction="row" spacing={0.5}>
        <IconButton title={t('common.edit')} onClick={() => openEditRule(row.original)}>
          <EditIcon />
        </IconButton>
        <IconButton title={t('common.delete')} onClick={() => void deleteRule(row.original)}>
          <DeleteIcon />
        </IconButton>
      </Stack>
    ),
  });

  return (
    <Box p={2}>
      <Card elevation={3} sx={{ mb: 2 }}>
        <CardHeader
          title={
            <Stack direction="row" spacing={1.5} alignItems="center">
              <NotificationsActiveIcon />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {t('nav.fleetNotifications')}
              </Typography>
            </Stack>
          }
          subheader={`Unread notifications: ${unreadCount}`}
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
                placeholder="Search notifications"
                value={notificationQuery}
                onChange={(e) => setNotificationQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                }}
                sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
              />

              <IconButton aria-label="refresh" onClick={() => void fetchData()}>
                <RefreshIcon />
              </IconButton>

              <Button variant="contained" startIcon={<AutoFixHighIcon />} onClick={() => void generateNotifications()}>
                Generate
              </Button>

              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateRule}>
                {t('common.add')}
              </Button>
            </Stack>
          }
        />

        <CardContent>
          <MaterialReactTable table={notificationsTable} />
        </CardContent>
      </Card>

      <Card elevation={3}>
        <CardHeader
          title={
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TuneIcon />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Notification Rules
              </Typography>
            </Stack>
          }
          subheader="Define when notifications are generated"
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                placeholder="Search rules"
                value={ruleQuery}
                onChange={(e) => setRuleQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                }}
                sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
              />

              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateRule}>
                {t('common.add')}
              </Button>
            </Stack>
          }
        />

        <CardContent>
          <MaterialReactTable table={rulesTable} />
        </CardContent>
      </Card>

      <Dialog open={editRuleOpen} onClose={closeRuleEdit} fullWidth maxWidth="sm">
        <DialogTitle>{editRule?.idRule ? 'Edit Notification Rule' : 'Add Notification Rule'}</DialogTitle>
        <DialogContent dividers>
          {editRule && (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <TextField
                label="Transaction Type"
                select
                value={editRule.transactionType}
                onChange={(e) =>
                  setEditRule((prev) => (prev ? { ...prev, transactionType: e.target.value } : prev))
                }
                required
                fullWidth
              >
                {TRANSACTION_TYPES.map((transactionType) => (
                  <MenuItem key={transactionType} value={transactionType}>
                    {transactionType}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Days Before"
                type="number"
                value={editRule.daysBefore}
                onChange={(e) =>
                  setEditRule((prev) =>
                    prev
                      ? {
                          ...prev,
                          daysBefore: e.target.value === '' ? '' : Number(e.target.value),
                        }
                      : prev
                  )
                }
                required
                fullWidth
              />

              <TextField
                label="Notify Role"
                value={editRule.notifyRole}
                onChange={(e) => setEditRule((prev) => (prev ? { ...prev, notifyRole: e.target.value } : prev))}
                fullWidth
              />

              <TextField
                label="Priority"
                select
                value={editRule.priority}
                onChange={(e) => setEditRule((prev) => (prev ? { ...prev, priority: e.target.value } : prev))}
                fullWidth
              >
                {PRIORITIES.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Rule Status"
                select
                value={editRule.isActive ? 'true' : 'false'}
                onChange={(e) =>
                  setEditRule((prev) => (prev ? { ...prev, isActive: e.target.value === 'true' } : prev))
                }
                fullWidth
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRuleEdit} color="secondary">
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void saveRule()} variant="contained" disabled={!canSaveRule}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationsPage;