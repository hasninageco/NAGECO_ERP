import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import DescriptionIcon from '@mui/icons-material/Description';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useTranslation } from 'react-i18next';
import { buildApiUrl } from '../utils/api';

type Props = {
  onOpen: (path: string) => void;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  errors?: Array<{ field?: string; message?: string }>;
};

type VehicleRow = {
  STATUS?: string | null;
};

type MaintenanceRow = {
  STATUS?: string | null;
};

type FleetOverviewStats = {
  totalVehicles: number;
  activeVehicles: number;
  vehiclesInMaintenance: number;
  vehiclesInTrip: number;
  totalMaintenance: number;
  plannedMaintenance: number;
  inProgressMaintenance: number;
  completedMaintenance: number;
  dueMaintenance: number;
  overdueMaintenance: number;
  totalTrips: number;
  totalSuppliers: number;
  totalInsurance: number;
  totalDocuments: number;
  totalNotifications: number;
};

type OverviewCardProps = {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  onOpen?: () => void;
};

const EMPTY_STATS: FleetOverviewStats = {
  totalVehicles: 0,
  activeVehicles: 0,
  vehiclesInMaintenance: 0,
  vehiclesInTrip: 0,
  totalMaintenance: 0,
  plannedMaintenance: 0,
  inProgressMaintenance: 0,
  completedMaintenance: 0,
  dueMaintenance: 0,
  overdueMaintenance: 0,
  totalTrips: 0,
  totalSuppliers: 0,
  totalInsurance: 0,
  totalDocuments: 0,
  totalNotifications: 0,
};

const toStatusCount = <T extends { STATUS?: string | null }>(rows: T[], expectedStatus: string): number =>
  rows.filter(
    (item) => String(item.STATUS || '').trim().toLowerCase() === expectedStatus.trim().toLowerCase()
  ).length;

const getArrayData = <T,>(payload: ApiEnvelope<unknown> | undefined): T[] => {
  const value = payload?.data;
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === 'object') {
    const objectData = value as Record<string, unknown>;
    if (Array.isArray(objectData.rows)) {
      return objectData.rows as T[];
    }
    if (Array.isArray(objectData.items)) {
      return objectData.items as T[];
    }
  }

  return [];
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const respData = error.response?.data as ApiEnvelope<unknown> | undefined;
    const rawErrors = respData?.errors;
    const apiErrors = Array.isArray(rawErrors) ? rawErrors : [];
    if (apiErrors.length > 0) {
      const msg = apiErrors.map((e) => e.message).filter(Boolean).join('\n');
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

const OverviewCard: React.FC<OverviewCardProps> = ({ title, value, subtitle, icon, onOpen }) => {
  return (
    <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.15 }}>
              {value.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>

          <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>{icon}</Box>
        </Stack>
      </CardContent>

      {onOpen && (
        <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2, pt: 0 }}>
          <Button size="small" variant="outlined" onClick={onOpen}>
            Open
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

const FleetManagementLanding: React.FC<Props> = ({ onOpen }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [stats, setStats] = useState<FleetOverviewStats>(EMPTY_STATS);

  const withAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  }, [navigate]);

  const loadOverview = useCallback(async () => {
    const headers = withAuth();
    if (!headers) return;

    setLoading(true);
    setLoadError('');

    try {
      const [
        vehiclesResp,
        maintenanceResp,
        dueResp,
        overdueResp,
        tripsResp,
        suppliersResp,
        insuranceResp,
        documentsResp,
        notificationsResp,
      ] = await Promise.all([
        axios.get<ApiEnvelope<unknown>>(buildApiUrl('/fleet/vehicles'), { headers }),
        axios.get<ApiEnvelope<unknown>>(buildApiUrl('/fleet/maintenance'), { headers }),
        axios.get<ApiEnvelope<unknown>>(buildApiUrl('/fleet/maintenance/due'), { headers }),
        axios.get<ApiEnvelope<unknown>>(buildApiUrl('/fleet/maintenance/overdue'), { headers }),
        axios.get<ApiEnvelope<unknown>>(buildApiUrl('/fleet/trips'), { headers }),
        axios.get<ApiEnvelope<unknown>>(buildApiUrl('/fleet/suppliers'), { headers }),
        axios.get<ApiEnvelope<unknown>>(buildApiUrl('/fleet/insurance'), { headers }),
        axios.get<ApiEnvelope<unknown>>(buildApiUrl('/fleet/documents'), { headers }),
        axios.get<ApiEnvelope<unknown>>(buildApiUrl('/fleet/notifications'), { headers }),
      ]);

      const vehicles = getArrayData<VehicleRow>(vehiclesResp.data);
      const maintenance = getArrayData<MaintenanceRow>(maintenanceResp.data);
      const dueMaintenance = getArrayData<MaintenanceRow>(dueResp.data);
      const overdueMaintenance = getArrayData<MaintenanceRow>(overdueResp.data);
      const trips = getArrayData<Record<string, unknown>>(tripsResp.data);
      const suppliers = getArrayData<Record<string, unknown>>(suppliersResp.data);
      const insurance = getArrayData<Record<string, unknown>>(insuranceResp.data);
      const documents = getArrayData<Record<string, unknown>>(documentsResp.data);
      const notifications = getArrayData<Record<string, unknown>>(notificationsResp.data);

      setStats({
        totalVehicles: vehicles.length,
        activeVehicles: toStatusCount(vehicles, 'Active'),
        vehiclesInMaintenance: toStatusCount(vehicles, 'In Maintenance'),
        vehiclesInTrip: toStatusCount(vehicles, 'In Trip'),
        totalMaintenance: maintenance.length,
        plannedMaintenance: toStatusCount(maintenance, 'Planned'),
        inProgressMaintenance: toStatusCount(maintenance, 'In Progress'),
        completedMaintenance: toStatusCount(maintenance, 'Completed'),
        dueMaintenance: dueMaintenance.length,
        overdueMaintenance: overdueMaintenance.length,
        totalTrips: trips.length,
        totalSuppliers: suppliers.length,
        totalInsurance: insurance.length,
        totalDocuments: documents.length,
        totalNotifications: notifications.length,
      });

      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/');
      } else {
        setLoadError(extractErrorMessage(error, 'Failed to load fleet overview'));
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, withAuth]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const quickLinks = useMemo(
    () => [
      {
        key: 'vehicles',
        title: t('nav.fleetVehicles'),
        description: 'Manage fleet vehicles, status, mileage, and employee assignment.',
        icon: <DirectionsCarIcon sx={{ fontSize: 40 }} />,
        path: '/fleetManagement/vehicles',
      },
      {
        key: 'maintenance',
        title: t('nav.fleetMaintenance'),
        description: 'Track maintenance lifecycle including start, complete, and cancel actions.',
        icon: <BuildIcon sx={{ fontSize: 40 }} />,
        path: '/fleetManagement/maintenance',
      },
      {
        key: 'trips',
        title: t('nav.fleetTrips'),
        description: 'Manage trip requests, approvals, and trip execution details.',
        icon: <AltRouteIcon sx={{ fontSize: 40 }} />,
        path: '/fleetManagement/trips',
      },
      {
        key: 'suppliers',
        title: t('nav.fleetSuppliers'),
        description: 'Maintain workshops and supplier records used by fleet operations.',
        icon: <PeopleAltIcon sx={{ fontSize: 40 }} />,
        path: '/fleetManagement/suppliers',
      },
      {
        key: 'insurance',
        title: t('nav.fleetInsurance'),
        description: 'Review insurance policies and policy validity for fleet assets.',
        icon: <LocalHospitalIcon sx={{ fontSize: 40 }} />,
        path: '/fleetManagement/insurance',
      },
      {
        key: 'documents',
        title: t('nav.fleetDocuments'),
        description: 'Track vehicle documents and expiration timelines in one place.',
        icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
        path: '/fleetManagement/documents',
      },
      {
        key: 'notifications',
        title: t('nav.fleetNotifications'),
        description: 'Review generated alerts and monitor operational notifications.',
        icon: <NotificationsActiveIcon sx={{ fontSize: 40 }} />,
        path: '/fleetManagement/notifications',
      },
    ],
    [t]
  );

  return (
    <Box p={2}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <LocalShippingIcon sx={{ fontSize: 42 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {t('nav.fleetManagementSystem')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('fleet.landingDescription')}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => void loadOverview()}>
            {t('common.refresh')}
          </Button>
        </Stack>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {loadError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      <Card elevation={3} sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
            <AssessmentIcon />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Fleet Overview Dashboard
            </Typography>
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Last updated: {lastUpdated || '-'}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
            }}
          >
            <OverviewCard
              title="Vehicles"
              value={stats.totalVehicles}
              subtitle={`Active ${stats.activeVehicles} | In maintenance ${stats.vehiclesInMaintenance} | In trip ${stats.vehiclesInTrip}`}
              icon={<DirectionsCarIcon />}
              onOpen={() => onOpen('/fleetManagement/vehicles')}
            />

            <OverviewCard
              title="Maintenance"
              value={stats.totalMaintenance}
              subtitle={`Planned ${stats.plannedMaintenance} | In progress ${stats.inProgressMaintenance} | Completed ${stats.completedMaintenance}`}
              icon={<BuildIcon />}
              onOpen={() => onOpen('/fleetManagement/maintenance')}
            />

            <OverviewCard
              title="Due / Overdue"
              value={stats.dueMaintenance + stats.overdueMaintenance}
              subtitle={`Due ${stats.dueMaintenance} | Overdue ${stats.overdueMaintenance}`}
              icon={<NotificationsActiveIcon />}
              onOpen={() => onOpen('/fleetManagement/maintenance')}
            />

            <OverviewCard
              title="Trips"
              value={stats.totalTrips}
              subtitle="Total registered trips"
              icon={<AltRouteIcon />}
              onOpen={() => onOpen('/fleetManagement/trips')}
            />

            <OverviewCard
              title="Suppliers"
              value={stats.totalSuppliers}
              subtitle="Active supplier records"
              icon={<PeopleAltIcon />}
              onOpen={() => onOpen('/fleetManagement/suppliers')}
            />

            <OverviewCard
              title="Insurance"
              value={stats.totalInsurance}
              subtitle="Insurance records"
              icon={<LocalHospitalIcon />}
              onOpen={() => onOpen('/fleetManagement/insurance')}
            />

            <OverviewCard
              title="Documents"
              value={stats.totalDocuments}
              subtitle="Fleet document records"
              icon={<DescriptionIcon />}
              onOpen={() => onOpen('/fleetManagement/documents')}
            />

            <OverviewCard
              title="Notifications"
              value={stats.totalNotifications}
              subtitle="Generated system notifications"
              icon={<NotificationsActiveIcon />}
              onOpen={() => onOpen('/fleetManagement/notifications')}
            />
          </Box>
        </CardContent>
      </Card>

      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
        Quick Access
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        }}
      >
        {quickLinks.map((item) => (
          <Card key={item.key} elevation={3}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {item.icon}
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {item.description}
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
              <Button variant="contained" onClick={() => onOpen(item.path)}>
                {t('common.open')}
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default FleetManagementLanding;
