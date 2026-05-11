import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import { buildApiUrl } from '../../../utils/api';
import {
  HEADER_PERMISSION_OPTIONS,
  SIDEBAR_PERMISSION_OPTIONS,
  parseWebPermissions,
  stringifyWebPermissions,
} from '../../../utils/webPermissions';

type UserRow = {
  USER_ID: number;
  Name_user: string | null;
  login_user: string | null;
  Action_user: string | null;
  Web_Permissions: string | null;
  State: boolean | null;
  ref_emp: string | null;
  ACCEPT_MODIFY: boolean | null;
  COST_CENTER_TO_MANAGE: string | null;
  WhareHouse_To_Manage: string | null;
};

type UserValidationErrors = {
  Name_user?: string;
  login_user?: string;
};

const parseUsers = (value: unknown): UserRow[] => {
  if (Array.isArray(value)) {
    return value as UserRow[];
  }

  if (value && typeof value === 'object') {
    const nested = (value as { data?: unknown }).data;
    if (Array.isArray(nested)) {
      return nested as UserRow[];
    }
  }

  return [];
};

const toBoolean = (value: boolean | null | undefined): boolean => Boolean(value);

export default function UsersList() {
  const navigate = useNavigate();
  const apiUrl = useMemo(() => buildApiUrl('/api/users'), []);

  const [data, setData] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [errors, setErrors] = useState<UserValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'active' | 'deactivated'>('active');

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchUsers = useCallback(async () => {
    const headers = getHeaders();
    if (!headers) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(apiUrl, { headers });
      setData(parseUsers(response.data));
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        navigate('/login');
      } else {
        alert('Failed to load users list');
      }
    } finally {
      setLoading(false);
    }
  }, [apiUrl, getHeaders, navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredData = useMemo(
    () =>
      data.filter((row) => {
        const isActive = toBoolean(row.State);
        return statusFilter === 'active' ? isActive : !isActive;
      }),
    [data, statusFilter]
  );

  const handleEdit = (row: UserRow) => {
    setEditUser({ ...row });
    setSelectedPermissionKeys(Array.from(parseWebPermissions(row.Web_Permissions).keys));
    setErrors({});
    setOpenDialog(true);
  };

  const handleSelectPermissionsFromColumn = (row: UserRow) => {
    setEditUser({ ...row });
    setSelectedPermissionKeys(Array.from(parseWebPermissions(row.Web_Permissions).keys));
    setErrors({});
    setOpenDialog(true);
    setPermissionsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving) return;
    setOpenDialog(false);
    setPermissionsDialogOpen(false);
    setEditUser(null);
    setErrors({});
  };

  const openPermissionsDialog = () => {
    setSelectedPermissionKeys(Array.from(parseWebPermissions(editUser?.Web_Permissions).keys));
    setPermissionsDialogOpen(true);
  };

  const togglePermissionKey = (permissionKey: string) => {
    setSelectedPermissionKeys((prev) =>
      prev.includes(permissionKey)
        ? prev.filter((key) => key !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const applySelectedPermissions = () => {
    const serialized = stringifyWebPermissions(selectedPermissionKeys);
    setEditUser((prev) =>
      prev
        ? {
            ...prev,
            Web_Permissions: serialized,
          }
        : prev
    );
    setPermissionsDialogOpen(false);
  };

  const validateForm = () => {
    const nextErrors: UserValidationErrors = {};

    if (!String(editUser?.Name_user || '').trim()) {
      nextErrors.Name_user = 'User name is required';
    }

    if (!String(editUser?.login_user || '').trim()) {
      nextErrors.login_user = 'Login user is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!editUser) return;
    if (!validateForm()) return;

    const headers = getHeaders();
    if (!headers) {
      navigate('/login');
      return;
    }

    setSaving(true);
    try {
      await axios.put(
        `${apiUrl}/${editUser.USER_ID}`,
        {
          Name_user: editUser.Name_user,
          login_user: editUser.login_user,
          Action_user: editUser.Action_user,
          Web_Permissions: editUser.Web_Permissions,
          State: editUser.State,
          ref_emp: editUser.ref_emp,
          ACCEPT_MODIFY: editUser.ACCEPT_MODIFY,
          COST_CENTER_TO_MANAGE: editUser.COST_CENTER_TO_MANAGE,
          WhareHouse_To_Manage: editUser.WhareHouse_To_Manage,
        },
        { headers }
      );

      await fetchUsers();
      handleCloseDialog();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || 'Failed to update user');
      } else {
        alert('Failed to update user');
      }
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo<MRT_ColumnDef<UserRow>[]>(
    () => [
      { accessorKey: 'USER_ID', header: 'ID', size: 60 },
      { accessorKey: 'Name_user', header: 'Name', size: 180 },
      { accessorKey: 'login_user', header: 'Login', size: 180 },
      {
        accessorKey: 'Web_Permissions',
        header: 'Permissions',
        size: 320,
        Cell: ({ row }) => {
          const permissionsCount = parseWebPermissions(row.original.Web_Permissions).keys.size;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                {permissionsCount} selected
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleSelectPermissionsFromColumn(row.original)}
              >
                Select Permissions
              </Button>
            </Box>
          );
        },
      },
      { accessorKey: 'ref_emp', header: 'Ref Employee', size: 120 },
      {
        accessorKey: 'State',
        header: 'Active',
        size: 80,
        Cell: ({ row }) => (toBoolean(row.original.State) ? 'Yes' : 'No'),
      },
      {
        accessorKey: 'ACCEPT_MODIFY',
        header: 'Can Modify',
        size: 100,
        Cell: ({ row }) => (toBoolean(row.original.ACCEPT_MODIFY) ? 'Yes' : 'No'),
      },
      {
        header: 'Actions',
        id: 'actions',
        size: 80,
        Cell: ({ row }) => (
          <Tooltip title="Edit user">
            <IconButton color="primary" size="small" onClick={() => handleEdit(row.original)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: filteredData,
    state: {
      isLoading: loading,
      density: 'compact',
    },
    enableDensityToggle: true,
  });

  return (
    <Box p={0.5} sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1, flexWrap: 'wrap' }}>
        <ButtonGroup variant="outlined" aria-label="user status filter">
          <Button
            variant={statusFilter === 'active' ? 'contained' : 'outlined'}
            onClick={() => setStatusFilter('active')}
          >
            Active Users
          </Button>
          <Button
            variant={statusFilter === 'deactivated' ? 'contained' : 'outlined'}
            onClick={() => setStatusFilter('deactivated')}
          >
            Deactivated Users
          </Button>
        </ButtonGroup>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchUsers}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 'bold', px: 3, py: 1 }}
        >
          Refresh
        </Button>
      </Box>

      <MaterialReactTable table={table} />

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>
          Edit User
          <Divider sx={{ mb: 0, borderColor: 'grey.300', borderBottomWidth: 2 }} />
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={editUser?.Name_user ?? ''}
              onChange={(e) =>
                setEditUser((prev) =>
                  prev
                    ? {
                        ...prev,
                        Name_user: e.target.value,
                      }
                    : prev
                )
              }
              error={Boolean(errors.Name_user)}
              helperText={errors.Name_user}
            />

            <TextField
              label="Login"
              fullWidth
              value={editUser?.login_user ?? ''}
              onChange={(e) =>
                setEditUser((prev) =>
                  prev
                    ? {
                        ...prev,
                        login_user: e.target.value,
                      }
                    : prev
                )
              }
              error={Boolean(errors.login_user)}
              helperText={errors.login_user}
            />

            <TextField
              label="Ref Employee"
              fullWidth
              value={editUser?.ref_emp ?? ''}
              onChange={(e) =>
                setEditUser((prev) =>
                  prev
                    ? {
                        ...prev,
                        ref_emp: e.target.value,
                      }
                    : prev
                )
              }
            />

            <TextField
              label="Cost Center To Manage"
              fullWidth
              value={editUser?.COST_CENTER_TO_MANAGE ?? ''}
              onChange={(e) =>
                setEditUser((prev) =>
                  prev
                    ? {
                        ...prev,
                        COST_CENTER_TO_MANAGE: e.target.value,
                      }
                    : prev
                )
              }
            />

            <TextField
              label="Warehouse To Manage"
              fullWidth
              value={editUser?.WhareHouse_To_Manage ?? ''}
              onChange={(e) =>
                setEditUser((prev) =>
                  prev
                    ? {
                        ...prev,
                        WhareHouse_To_Manage: e.target.value,
                      }
                    : prev
                )
              }
            />

            <TextField
              label="Web_Permissions"
              fullWidth
              multiline
              minRows={3}
              value={editUser?.Web_Permissions ?? ''}
              InputProps={{ readOnly: true }}
              onChange={(e) =>
                setEditUser((prev) =>
                  prev
                    ? {
                        ...prev,
                        Web_Permissions: e.target.value,
                      }
                    : prev
                )
              }
            />

            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
              <Button variant="outlined" onClick={openPermissionsDialog}>
                Select Permissions
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, width: '100%' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={toBoolean(editUser?.State)}
                    onChange={(e) =>
                      setEditUser((prev) =>
                        prev
                          ? {
                              ...prev,
                              State: e.target.checked,
                            }
                          : prev
                      )
                    }
                  />
                }
                label="Active"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={toBoolean(editUser?.ACCEPT_MODIFY)}
                    onChange={(e) =>
                      setEditUser((prev) =>
                        prev
                          ? {
                              ...prev,
                              ACCEPT_MODIFY: e.target.checked,
                            }
                          : prev
                      )
                    }
                  />
                }
                label="Can Modify"
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary" disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary" disabled={saving}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={permissionsDialogOpen}
        onClose={() => setPermissionsDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Select Permissions
          <Divider sx={{ mb: 0, borderColor: 'grey.300', borderBottomWidth: 2 }} />
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 2, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Sidebar Permissions
              </Typography>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1, maxHeight: 360, overflow: 'auto' }}>
                {SIDEBAR_PERMISSION_OPTIONS.map((item) => (
                  <FormControlLabel
                    key={item.key}
                    control={
                      <Checkbox
                        checked={selectedPermissionKeys.includes(item.key)}
                        onChange={() => togglePermissionKey(item.key)}
                      />
                    }
                    label={item.label}
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Top Header Permissions
              </Typography>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                {HEADER_PERMISSION_OPTIONS.map((item) => (
                  <FormControlLabel
                    key={item.key}
                    control={
                      <Checkbox
                        checked={selectedPermissionKeys.includes(item.key)}
                        onChange={() => togglePermissionKey(item.key)}
                      />
                    }
                    label={item.label}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setSelectedPermissionKeys(SIDEBAR_PERMISSION_OPTIONS.map((item) => item.key))}
            >
              Select All Sidebar
            </Button>
            <Button
              variant="outlined"
              onClick={() => setSelectedPermissionKeys([])}
            >
              Clear All
            </Button>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setPermissionsDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={applySelectedPermissions} color="primary">
            Apply Permissions
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
