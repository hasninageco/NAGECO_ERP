import * as React from 'react';
import { createTheme, ThemeProvider, Theme } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from '@mui/stylis-plugin-rtl';
import { prefixer } from 'stylis';
import {
  AppProvider,
  Navigation,
  Router,
  DashboardLayout,
  PageContainer,
} from '@toolpad/core';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArchiveIcon from '@mui/icons-material/Archive';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BadgeIcon from '@mui/icons-material/Badge';
import FolderIcon from '@mui/icons-material/Folder';
import SettingsIcon from '@mui/icons-material/Settings';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import TuneIcon from '@mui/icons-material/Tune';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CategoryIcon from '@mui/icons-material/Category';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import GradeIcon from '@mui/icons-material/Grade';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import DescriptionIcon from '@mui/icons-material/Description';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SupplyChainPage from '../SupplyChain/SupplyChainPage';



 
import RequisitionEditor from '../SupplyChain/Requisitions/pages/RequisitionEditor';
import RequisitionDetails from '../SupplyChain/Requisitions/pages/RequisitionDetails';
import RequisitionReports from '../SupplyChain/Requisitions/pages/RequisitionReports';
import QuoteRequestsPage from '../SupplyChain/Requisitions/pages/QuoteRequestsPage';





import Logo from '../ui-component/Logo2';
import nagecoLogo from '../NAGECO.jpg';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import MeetingCalendar from '../Meeting/MeetingCalendar';
import { useTranslation } from 'react-i18next';
import GeneralSettings from '../Setup/GS/GeneralSettings';
import HRSettings from '../Setup/HR/HRSettings';
import FinanceSettings from '../Setup/Finance/FinanceSettings';
import SCSSettings from '../Setup/SCS/SCSSettings';
import HRCompensaions from '../HR/Compensationspages/HRCompensaions';
import PromotionsPage from '../HR/Compensationspages/PromotionsPage';
import EmployeesPage from '../HR/Employees/EmployeesPage';
import DashboardMain from './DS/DashboardMain';
import TimesheetsPage from '../HR/Timesheets/TimesheetsPage';
import {
  InsuranceManagementLanding,
  ServicesPage,
  ProvidersPage,
  ClaimsPage,
  DoctorReviewPage,
  DoctorReviewedClaimsPage,
  EmployeeInsuranceList,
  RechargePage,
  TransferBalancePage,
  EmployeeStatementPage,
  FinanceTransferPage,
} from '../HR/MedicalInsurance';
import {
  FleetManagementLanding,
  VehiclesPage,
  MaintenancePage,
  TripsPage,
  InsurancePage,
  DocumentsPage,
  NotificationsPage,
  SuppliersPage,
} from '../Fleet';
import { encode, decode } from '../utils/urlCrypt';
import {
  HEADER_PERMISSION_KEYS,
  type ParsedPermissions,
  parseWebPermissions,
  routePermissionKey,
} from '../utils/webPermissions';

const rtlCache = createCache({ key: 'muirtl', stylisPlugins: [prefixer, rtlPlugin] });
const ltrCache = createCache({ key: 'muiltr' });

type TFunction = (key: string) => string;

const getNavigation = (t: TFunction): Navigation => [
  {
    kind: 'header',
    title: t('nav.mainItems'),
  },
  {
    segment: 'dashboard',
    title: t('nav.dashboard'),
    icon: <DashboardIcon />,
  },
  {
    segment: 'bookingSystem',
    title: t('nav.bookingSystem'),
    icon: <EventAvailableIcon />,
    children: [
      {
        segment: 'calendar',
        title: t('nav.calendar'),
        icon: <CalendarMonthIcon />,
      },
      {
        segment: 'reports',
        title: t('nav.meetingReports'),
        icon: <DescriptionIcon />,
      },
    ],
  },
  {
    kind: 'divider',
  },
  {
    kind: 'header',
    title: t('nav.actions'),
  },
  {
    segment: 'setting',
    title: t('nav.setting'),
    icon: <TuneIcon />,
    children: [
      {
        segment: 'generals',
        title: t('nav.generalSettings'),
        icon: <SettingsIcon />,
      },
      {
        segment: 'hrSetting',
        title: t('nav.hrSettings'),
        icon: <PeopleAltIcon />,
      },
      {
        segment: 'finSetting',
        title: t('nav.financeSettings'),
        icon: <MonetizationOnIcon />,
      },
      {
        segment: 'spySetting',
        title: t('nav.supplyChainSettings'),
        icon: <WarehouseIcon />,
      },
    ],
  },
  {
    segment: 'medicalInsurance',
    title: t('nav.insuranceManagement'),
    icon: <LocalHospitalIcon />,
    children: [
      {
        segment: 'overview',
        title: t('nav.overview'),
        icon: <DashboardIcon />,
      },
      {
        segment: 'workers',
        title: t('nav.workers'),
        icon: <PeopleAltIcon />,
      },
      {
        segment: 'services',
        title: t('nav.services'),
        icon: <CategoryIcon />,
      },
      {
        segment: 'providers',
        title: t('nav.providers'),
        icon: <LocalHospitalIcon />,
      },
      {
        segment: 'claims',
        title: t('nav.claims'),
        icon: <AssignmentTurnedInIcon />,
      },
      {
        segment: 'doctorReview',
        title: t('nav.doctorReview'),
        icon: <AssignmentTurnedInIcon />,
      },
      {
        segment: 'doctorReviewed',
        title: t('nav.reviewedClaims'),
        icon: <AssignmentTurnedInIcon />,
      },
      {
        segment: 'recharge',
        title: t('nav.recharge'),
        icon: <MonetizationOnIcon />,
      },
      {
        segment: 'transfer',
        title: t('nav.transferBalance'),
        icon: <CompareArrowsIcon />,
      },
      {
        segment: 'statement',
        title: t('nav.statement'),
        icon: <DescriptionIcon />,
      },
      {
        segment: 'finance',
        title: t('nav.financePayments'),
        icon: <MonetizationOnIcon />,
      },
    ],
  },
  {
    segment: 'fleetManagement',
    title: t('nav.fleetManagementSystem'),
    icon: <LocalShippingIcon />,
    children: [
      {
        segment: 'overview',
        title: t('nav.overview'),
        icon: <DashboardIcon />,
      },
      {
        segment: 'vehicles',
        title: t('nav.fleetVehicles'),
        icon: <DirectionsCarIcon />,
      },
      {
        segment: 'maintenance',
        title: t('nav.fleetMaintenance'),
        icon: <BuildIcon />,
      },
      {
        segment: 'trips',
        title: t('nav.fleetTrips'),
        icon: <AltRouteIcon />,
      },
      {
        segment: 'suppliers',
        title: t('nav.fleetSuppliers'),
        icon: <PeopleAltIcon />,
      },
      {
        segment: 'insurance',
        title: t('nav.fleetInsurance'),
        icon: <LocalHospitalIcon />,
      },
      {
        segment: 'documents',
        title: t('nav.fleetDocuments'),
        icon: <DescriptionIcon />,
      },
      {
        segment: 'notifications',
        title: t('nav.fleetNotifications'),
        icon: <NotificationsActiveIcon />,
      },
    ],
  },
  {
    segment: 'humanRessources',
    title: t('nav.hr'),
    icon: <Diversity3Icon />,
    children: [
      {
        segment: 'employees',
        title: t('nav.employees'),
        icon: <PeopleAltIcon />,
      },
      {
        segment: 'regulationscompensations',
        title: t('nav.compensations'),
        icon: <CategoryIcon />,
        children: [
          {
            segment: 'vacations',
            title: t('nav.annualLeaveBalances'),
            icon: <FlightTakeoffIcon />,
          },
          {
            segment: 'timeheets',
            title: t('nav.timeSheets'),
            icon: <AccessTimeIcon />,
          },
          {
            segment: 'promotions',
            title: t('nav.promotions'),
            icon: <TrendingUpIcon />,
          },
          {
            segment: 'wletter',
            title: t('nav.warningLetter'),
            icon: <ReportProblemIcon />,
          },
          {
            segment: 'productivity',
            title: t('nav.productivity'),
            icon: <TrendingFlatIcon />,
          },
          {
            segment: 'transfer',
            title: t('nav.transfer'),
            icon: <CompareArrowsIcon />,
          },
          {
            segment: 'evaluation',
            title: t('nav.evaluation'),
            icon: <GradeIcon />,
          },
          {
            segment: 'missions',
            title: t('nav.missions'),
            icon: <AssignmentTurnedInIcon />,
          },
          {
            segment: 'lequipement',
            title: t('nav.loanEquipment'),
            icon: <DevicesOtherIcon />,
          },
          {
            segment: 'delegation',
            title: t('nav.delegation'),
            icon: <PeopleAltIcon />,
          },
        ],
      },
    ],
  },

  {
    segment: 'archive',
    title: t('nav.archive'),
    icon: <ArchiveIcon />,
    children: [
      {
        segment: 'paper-types',
        title: t('nav.paperTypes'),
        icon: <CategoryIcon />,
      },
      {
        segment: 'companies',
        title: t('nav.companies'),
        icon: <PeopleAltIcon />,
      },
      {
        segment: 'finance',
        title: t('nav.financeArchive'),
        icon: <AccountBalanceIcon />,
      },
      {
        segment: 'hr',
        title: t('nav.hrArchive'),
        icon: <BadgeIcon />,
      },
      {
        segment: 'general',
        title: t('nav.generalArchive'),
        icon: <FolderIcon />,
      },
    ],
  },





  // ✅ Supply Chain (مكانه الصح هنا)
  // ✅ Supply Chain
  {
    segment: 'supplyChain',
    title: 'Supply Chain',
    icon: <WarehouseIcon />,
    children: [
      {
        segment: 'sections-products',
        title: 'Sections & Products',
        icon: <CategoryIcon />,
      },
      {
        segment: 'requisitions',
        title: 'Requisitions',
        icon: <DescriptionIcon />, // أو ListAltIcon
      },
      {
        segment: 'requisition-reports',
        title: 'Requisition Reports',
        icon: <DescriptionIcon />,
      },
      {
        segment: 'quote-requests',
        title: 'Quote Requests',
        icon: <DescriptionIcon />,
      },
    ],
  },
];

const createDemoTheme = (mode: 'light' | 'dark', direction: 'ltr' | 'rtl'): Theme =>
  createTheme({
    direction,
    palette: {
      mode,
    },
    typography: {
      button: {
        textTransform: 'none',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
    },
    // Remove colorSchemes/cssVariables to avoid rendering AppProvider's
    // built-in color scheme toggle, keeping our custom IconButton as the
    // single source of truth for theme mode.
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 600,
        lg: 1500,
        xl: 1536,
      },
    },
  });

const isStructureNode = (item: any) => item?.kind === 'header' || item?.kind === 'divider';

const trimNavigationStructure = (items: any[]): any[] => {
  const next = [...items];

  while (next.length && isStructureNode(next[0])) {
    next.shift();
  }

  while (next.length && isStructureNode(next[next.length - 1])) {
    next.pop();
  }

  const collapsed: any[] = [];
  for (const item of next) {
    const previous = collapsed[collapsed.length - 1];
    if (isStructureNode(item) && isStructureNode(previous)) {
      continue;
    }
    collapsed.push(item);
  }

  return collapsed;
};

const filterNavigationByPermissions = (
  items: any[],
  permissions: ParsedPermissions,
  parentPath: string = '',
): any[] => {
  if (!permissions.configured) {
    return items;
  }

  const filtered: any[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    if (isStructureNode(item)) {
      filtered.push(item);
      continue;
    }

    const segment = typeof item.segment === 'string' ? item.segment : '';
    const itemPath = segment
      ? `${parentPath}/${segment}`.replace(/\/+/g, '/')
      : parentPath;

    const children = Array.isArray(item.children)
      ? filterNavigationByPermissions(item.children, permissions, itemPath)
      : undefined;

    const isAllowed = permissions.keys.has(routePermissionKey(itemPath));
    const hasAllowedChildren = Boolean(children && children.length > 0);
    const parentAllowed = parentPath && permissions.keys.has(routePermissionKey(parentPath));

    // Show item if: explicitly allowed OR has allowed children OR is a direct child of an allowed parent
    if (isAllowed || hasAllowedChildren || parentAllowed) {
      filtered.push({
        ...item,
        ...(Array.isArray(item.children) ? { children } : {}),
      });
    }
  }

  return trimNavigationStructure(filtered);
};

function useDemoRouter(initialPath: string): Router {
  // If an encoded path present in the URL (query param `p`), decode and use it
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const encoded = params.get('p');
  const start = encoded ? decode(encoded) : initialPath;

  const [pathname, setPathname] = React.useState(start);

  const router = React.useMemo(() => {
    return {
      pathname,
      searchParams: new URLSearchParams(),
      navigate: (path: string | URL) => {
        const p = String(path);
        // update internal router state
        setPathname(p);
        try {
          // push encoded path to browser URL as ?p=<enc>
          const enc = encode(p);
          const newUrl = `${window.location.pathname}?p=${enc}`;
          window.history.pushState({}, '', newUrl);
        } catch (e) {
          // fallback: do nothing
        }
      },
    };
  }, [pathname]);

  return router;
}

const DashboardPage = () => <DashboardMain />;

function FleetPlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <Paper
      elevation={1}
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
        {description}
      </Typography>
    </Paper>
  );
}

function DashboardNoAccessInfo({ t, isRtl }: { t: TFunction; isRtl: boolean }) {
  const insuranceLogo = '/nag-insurance.png';

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        direction: 'ltr',
        py: 2,
        alignItems: 'stretch',
        '@keyframes riseIn': {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <Paper
        elevation={1}
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          direction: 'ltr',
          backgroundColor: 'background.paper',
          animation: 'riseIn 550ms ease-out both',
          transition: 'transform 200ms ease, box-shadow 200ms ease',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: 4,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Box
            component="img"
            src={nagecoLogo}
            alt="NAGECO"
            sx={{
              width: { xs: 120, sm: 160 },
              height: 'auto',
              borderRadius: 2,
              objectFit: 'contain',
            }}
          />
        </Box>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, textAlign: 'left', letterSpacing: 0.2 }}>
          {t('home.aboutNagecoTitle')}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-line',
            lineHeight: 1.9,
            textAlign: 'left',
            direction: 'ltr',
            color: 'text.secondary',
          }}
        >
          {t('home.aboutNagecoParagraph')}
        </Typography>
      </Paper>

      <Paper
        elevation={1}
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          direction: 'ltr',
          backgroundColor: 'background.paper',
          animation: 'riseIn 650ms ease-out both',
          animationDelay: '120ms',
          transition: 'transform 200ms ease, box-shadow 200ms ease',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: 4,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Box
            component="img"
            src={insuranceLogo}
            alt="NAGECO Insurance"
            sx={{
              width: { xs: 120, sm: 170 },
              height: 'auto',
              borderRadius: 2,
              objectFit: 'contain',
            }}
          />
        </Box>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, textAlign: 'left', letterSpacing: 0.2 }}>
          {t('home.aboutInsuranceTitle')}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-line',
            lineHeight: 1.9,
            textAlign: 'left',
            direction: 'ltr',
            color: 'text.secondary',
          }}
        >
          {t('home.aboutInsuranceParagraph')}
        </Typography>
      </Paper>
    </Box>
  );
}

export default function Home(props: any) {
  const { t, i18n } = useTranslation();
  const activeLang = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase().startsWith('ar') ? 'ar' : 'en';
  const isRtl = activeLang === 'ar';
  // Meeting dialog state
  const [meetingDialogOpen, setMeetingDialogOpen] = React.useState(false);
  const handleOpenMeetingDialog = () => setMeetingDialogOpen(true);
  const handleCloseMeetingDialog = () => setMeetingDialogOpen(false);
 
  const router = useDemoRouter('/dashboard');

  const actionUser = React.useMemo(() => {
    try {
      const stored = String(localStorage.getItem('Action_user') || '').trim();
      if (stored) return stored;

      const token = String(localStorage.getItem('token') || '');
      if (!token || !token.includes('.')) return '';

      const payloadPart = token.split('.')[1] || '';
      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const decoded = JSON.parse(atob(padded));
      const fromToken = typeof decoded?.actionUser === 'string' ? decoded.actionUser : '';
      if (fromToken) {
        localStorage.setItem('Action_user', fromToken);
      }
      return fromToken;
    } catch (e) {
      return '';
    }
  }, []);

  const loggedUser = React.useMemo(() => {
    try {
      const storedUser = localStorage.getItem('userSN');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && typeof parsed === 'object') {
          return parsed as Record<string, unknown>;
        }
      }

      const token = String(localStorage.getItem('token') || '');
      if (token && token.includes('.')) {
        const payloadPart = token.split('.')[1] || '';
        const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
        const decoded = JSON.parse(atob(padded));
        const fromToken = decoded?.userSN && typeof decoded.userSN === 'object' ? decoded.userSN : decoded;
        if (fromToken && typeof fromToken === 'object') {
          return fromToken as Record<string, unknown>;
        }
      }

      const username = String(localStorage.getItem('username') || '').trim();
      return username ? ({ Name_user: username, login_user: username } as Record<string, unknown>) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const pickFirstString = React.useCallback((source: Record<string, unknown> | null, keys: string[]) => {
    if (!source) return '';
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
      if (typeof value === 'number' || typeof value === 'bigint') {
        return String(value);
      }
    }
    return '';
  }, []);

  const loggedUserName = React.useMemo(
    () => pickFirstString(loggedUser, ['Name_user', 'name_user', 'login_user', 'username', 'email']),
    [loggedUser, pickFirstString],
  );

  const loggedUserRefEmp = React.useMemo(() => {
    const direct = pickFirstString(loggedUser, ['ref_emp', 'Ref_emp', 'REF_EMP', 'refEmp']);
    if (direct) return direct;

    const root = loggedUser as Record<string, unknown> | null;
    if (root) {
      const nestedUser = root.userSN;
      if (nestedUser && typeof nestedUser === 'object') {
        const nestedRef = pickFirstString(nestedUser as Record<string, unknown>, ['ref_emp', 'Ref_emp', 'REF_EMP', 'refEmp']);
        if (nestedRef) return nestedRef;
      }

      const dataValues = root.dataValues;
      if (dataValues && typeof dataValues === 'object') {
        const dataValuesRef = pickFirstString(dataValues as Record<string, unknown>, ['ref_emp', 'Ref_emp', 'REF_EMP', 'refEmp']);
        if (dataValuesRef) return dataValuesRef;
      }
    }

    try {
      return String(
        localStorage.getItem('ref_emp') ||
        localStorage.getItem('Ref_emp') ||
        localStorage.getItem('REF_EMP') ||
        '',
      ).trim();
    } catch (e) {
      return '';
    }
  }, [loggedUser, pickFirstString]);

  const rawWebPermissions = React.useMemo(() => {
    const direct = pickFirstString(loggedUser, ['Web_Permissions', 'web_permissions', 'webPermissions']);
    if (direct) return direct;

    const root = loggedUser as Record<string, unknown> | null;
    if (root) {
      const nestedUser = root.userSN;
      if (nestedUser && typeof nestedUser === 'object') {
        const nested = pickFirstString(nestedUser as Record<string, unknown>, ['Web_Permissions', 'web_permissions', 'webPermissions']);
        if (nested) return nested;
      }

      const dataValues = root.dataValues;
      if (dataValues && typeof dataValues === 'object') {
        const nested = pickFirstString(dataValues as Record<string, unknown>, ['Web_Permissions', 'web_permissions', 'webPermissions']);
        if (nested) return nested;
      }
    }

    try {
      return String(
        localStorage.getItem('webPermissions') ||
        localStorage.getItem('Web_Permissions') ||
        '',
      ).trim();
    } catch (e) {
      return '';
    }
  }, [loggedUser, pickFirstString]);

  const webPermissions = React.useMemo(() => parseWebPermissions(rawWebPermissions), [rawWebPermissions]);

  const hasPermissionForRoute = React.useCallback(
    (path: string) => {
      if (!webPermissions.configured) return true;
      return webPermissions.keys.has(routePermissionKey(path));
    },
    [webPermissions],
  );

  const hasPermissionForHeader = React.useCallback(
    (permissionKey: string) => {
      if (!webPermissions.configured) return true;
      return webPermissions.keys.has(permissionKey);
    },
    [webPermissions],
  );

  const hasDashboardAccess = React.useMemo(() => actionUser.toLowerCase().includes('dsh'), [actionUser]);

  const pageComponent = React.useMemo(() => {
    if (!hasPermissionForRoute(router.pathname)) {
      return (
        <FleetPlaceholderPage
          title="Access Restricted"
          description="You do not have permission to view this section."
        />
      );
    }

    switch (router.pathname) {
      case '/setting/generals':
        return <GeneralSettings />;
      case '/dashboard':
        return hasDashboardAccess ? (
          <DashboardPage />
        ) : (
          <DashboardNoAccessInfo t={t} isRtl={isRtl} />
        );
      case '/bookingSystem':
      case '/bookingSystem/calendar':
        return <MeetingCalendar section="calendar" />;
      case '/bookingSystem/reports':
        return <MeetingCalendar section="reports" />;
      case '/setting/hrSetting':
        return <HRSettings />;
      case '/setting/finSetting':
        return <FinanceSettings />;
      case '/setting/spySetting':
        return <SCSSettings />;

      case '/humanRessources/regulationscompensations/vacations':
        return <HRCompensaions />;

      case '/humanRessources/employees':
        return <EmployeesPage />;

      case '/humanRessources/regulationscompensations/timeheets':
        return <TimesheetsPage attachedNumberPrefix={loggedUserRefEmp} />;

      case '/humanRessources/regulationscompensations/promotions':
        return <PromotionsPage />;

      // tolerate common spelling variant
      case '/humanRessources/regulationscompensations/timesheets':
        return <TimesheetsPage attachedNumberPrefix={loggedUserRefEmp} />;

      case '/medicalInsurance':
        return <InsuranceManagementLanding onOpen={(p) => router.navigate(p)} />;
      // backward compatibility with older segment name
      case '/medicalInsurance/overview':
        return <InsuranceManagementLanding onOpen={(p) => router.navigate(p)} />;
      case '/medicalInsurance/medicalOverview':
        return <InsuranceManagementLanding onOpen={(p) => router.navigate(p)} />;
      case '/medicalInsurance/services':
        return <ServicesPage onBack={() => router.navigate('/medicalInsurance')} />;
      case '/medicalInsurance/providers':
        return <ProvidersPage onBack={() => router.navigate('/medicalInsurance')} />;
      case '/medicalInsurance/claims':
        return <ClaimsPage onBack={() => router.navigate('/medicalInsurance')} />;
      case '/medicalInsurance/doctorReview':
        return <DoctorReviewPage onBack={() => router.navigate('/medicalInsurance')} />;
      case '/medicalInsurance/doctorReviewed':
        return <DoctorReviewedClaimsPage onBack={() => router.navigate('/medicalInsurance')} />;
      case '/medicalInsurance/workers':
        return <EmployeeInsuranceList />;
      case '/medicalInsurance/recharge':
        return <RechargePage onBack={() => router.navigate('/medicalInsurance')} />;
      case '/medicalInsurance/transfer':
        return <TransferBalancePage onBack={() => router.navigate('/medicalInsurance')} />;
      case '/medicalInsurance/statement':
        return <EmployeeStatementPage onBack={() => router.navigate('/medicalInsurance')} />;
      case '/medicalInsurance/finance':
        return <FinanceTransferPage onBack={() => router.navigate('/medicalInsurance')} />;

      case '/fleetManagement':
        return <FleetManagementLanding onOpen={(p) => router.navigate(p)} />;
      case '/fleetManagement/overview':
        return <FleetManagementLanding onOpen={(p) => router.navigate(p)} />;
      case '/fleetManagement/vehicles':
        return <VehiclesPage onBack={() => router.navigate('/fleetManagement')} />;
      case '/fleetManagement/maintenance':
        return <MaintenancePage onBack={() => router.navigate('/fleetManagement')} />;
      case '/fleetManagement/trips':
        return <TripsPage onBack={() => router.navigate('/fleetManagement')} />;
      case '/fleetManagement/suppliers':
        return <SuppliersPage onBack={() => router.navigate('/fleetManagement')} />;
      case '/fleetManagement/insurance':
        return <InsurancePage onBack={() => router.navigate('/fleetManagement')} />;
      case '/fleetManagement/documents':
        return <DocumentsPage onBack={() => router.navigate('/fleetManagement')} />;
      case '/fleetManagement/notifications':
        return <NotificationsPage onBack={() => router.navigate('/fleetManagement')} />;

      case '/archive':
        return (
          <FleetPlaceholderPage
            title={t('nav.archive')}
            description={t('archive.landingDescription')}
          />
        );
      case '/archive/paper-types':
        return (
          <FleetPlaceholderPage
            title={t('nav.paperTypes')}
            description={t('archive.paperTypesDescription')}
          />
        );
      case '/archive/companies':
        return (
          <FleetPlaceholderPage
            title={t('nav.companies')}
            description={t('archive.companiesDescription')}
          />
        );
      case '/archive/finance':
        return (
          <FleetPlaceholderPage
            title={t('nav.financeArchive')}
            description={t('archive.financeDescription')}
          />
        );
      case '/archive/hr':
        return (
          <FleetPlaceholderPage
            title={t('nav.hrArchive')}
            description={t('archive.hrDescription')}
          />
        );
      case '/archive/general':
        return (
          <FleetPlaceholderPage
            title={t('nav.generalArchive')}
            description={t('archive.generalDescription')}
          />
        );




         case '/supplyChain/sections-products':
      return <SupplyChainPage />;

    case '/supplyChain/requisitions':
      return <RequisitionEditor />;

    case '/supplyChain/requisition-reports':
      return <RequisitionReports onBack={() => router?.navigate('/supplyChain/requisitions')} />;

    case '/supplyChain/quote-requests':
      return <QuoteRequestsPage onBack={() => router?.navigate('/supplyChain/requisition-reports')} />;



      default:
        return <div>{t('common.pageNotFound')}</div>;
    }
  }, [hasDashboardAccess, hasPermissionForRoute, isRtl, router, t]);
   
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  // Theme mode state: 'light' or 'dark'
  const [mode, setMode] = React.useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
    } catch (e) {
      // ignore
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('theme', mode);
    } catch (e) {
      // ignore
    }
  }, [mode]);

  // computed theme
  const demoTheme = React.useMemo(() => createDemoTheme(mode, isRtl ? 'rtl' : 'ltr'), [mode, isRtl]);

  const navigation = React.useMemo(
    () => filterNavigationByPermissions(getNavigation(t) as any[], webPermissions) as Navigation,
    [t, webPermissions],
  );

  const toggleTheme = () => setMode(prev => (prev === 'light' ? 'dark' : 'light'));
   

  // Responsive sidebar toggle button
   



  return (
    <CacheProvider value={isRtl ? rtlCache : ltrCache}>
      <AppProvider
        navigation={navigation}
        router={router}
        theme={demoTheme}
        branding={{
          logo: <Logo />,
          title: 'NAGECO',
        }}
      >
        <ThemeProvider theme={demoTheme}>



        {/* Header custom actions */}
        <div style={{
          position: 'absolute',
          top: 10,
          ...(isRtl ? { left: 50 } : { right: 50 }),
          zIndex: 1500,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          {/* New Meeting Button */}
          {hasPermissionForHeader(HEADER_PERMISSION_KEYS.meetingsSchedule) && (
          <Button
            variant="outlined"
            color="primary"
            onClick={handleOpenMeetingDialog}
            size="small"
            sx={{
              textTransform: 'none',
              borderRadius: '16px',
              fontSize: '0.68rem',
              mt: 1,
              mr: 1,
              minHeight: 28,
              height: 28,
              padding: '4px 10px',
              lineHeight: 1,
            }}
          >
            {t('home.meetingsSchedule')}
          </Button>
          )}
          {hasPermissionForHeader(HEADER_PERMISSION_KEYS.languageSelector) && (
          <TextField
            select
            size="small"
            variant="outlined"
            label={t('common.language')}
            value={activeLang}
            onChange={(e) => i18n.changeLanguage(String(e.target.value))}
            sx={{
              minWidth: 120,
              mt: 1,
              mr: 1,
              '& .MuiInputBase-root': {
                borderRadius: '16px',
                minHeight: 28,
                height: 28,
                paddingRight: '8px',
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.68rem',
                top: -2,
              },
              '& .MuiSelect-select': {
                fontSize: '0.68rem',
                paddingTop: '4px',
                paddingBottom: '4px',
              },
            }}
          >
            <MenuItem value="en">{t('common.english')}</MenuItem>
            <MenuItem value="ar">{t('common.arabic')}</MenuItem>
          </TextField>
          )}
          {hasPermissionForHeader(HEADER_PERMISSION_KEYS.userInfo) && (loggedUserName || loggedUserRefEmp) && (
            <Box
              sx={{
                mt: 1,
                px: 1.2,
                py: 0.4,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                lineHeight: 1.1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: isRtl ? 'flex-end' : 'flex-start',
                minHeight: 28,
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 600 }}>
                {loggedUserName}
              </Typography>
              <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary' }}>
                 {loggedUserRefEmp || '-'}
              </Typography>
            </Box>
          )}
          {/* Logout Button */}
          {hasPermissionForHeader(HEADER_PERMISSION_KEYS.logout) && (
            <Button
            variant="outlined"
            color="error"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('Action_user');
              localStorage.removeItem('username');
              localStorage.removeItem('userSN');
              localStorage.removeItem('ref_emp');
              localStorage.removeItem('Ref_emp');
              localStorage.removeItem('REF_EMP');
              if (typeof globalThis !== 'undefined' && globalThis.window) {
                globalThis.window.location.href = '/';
              }
            }}
            size="small"
            sx={{
              textTransform: 'none',
              borderRadius: '16px',
              fontSize: '0.68rem',
              mt: 1,
              minHeight: 28,
              height: 28,
              padding: '4px 10px',
              lineHeight: 1,
            }}
            >
              {t('common.logout')}
            </Button>
          )}

          {/* Dark / Light toggle */}
          {hasPermissionForHeader(HEADER_PERMISSION_KEYS.themeToggle) && (
          <IconButton
            onClick={toggleTheme}
            size="small"
            color="inherit"
            aria-label="toggle theme"
            sx={{
              borderRadius: '10px',
              bgcolor: 'background.paper',
              padding: 0.5,
            }}
          >
            {mode === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2"></path><path d="M12 21v2"></path><path d="M4.22 4.22l1.42 1.42"></path><path d="M18.36 18.36l1.42 1.42"></path><path d="M1 12h2"></path><path d="M21 12h2"></path><path d="M4.22 19.78l1.42-1.42"></path><path d="M18.36 5.64l1.42-1.42"></path></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path></svg>
            )}
          </IconButton>
          )}
        </div>

        {/* Meeting Dialog */}
        <Dialog open={meetingDialogOpen} onClose={handleCloseMeetingDialog} maxWidth="lg" fullWidth>
          
          <DialogContent>
            {/* Calendar component styled like Microsoft Teams */}
            <MeetingCalendar section="calendar" />
          </DialogContent>
        </Dialog>

        {/* Show toggle button only on mobile */}
        
        <DashboardLayout
          defaultSidebarCollapsed={!sidebarOpen}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            minHeight: '100vh',
          }}
        >
          <PageContainer
            title=""
            sx={{
              maxWidth: '100% !important',
              p: 0,
              pl: '2% !important',
              pr: '2% !important',
              m: 0,
              '&.MuiContainer-root': {
                maxWidth: '100% !important',
                paddingLeft: '2% !important',
                paddingRight: '2% !important',
              },
            }}
          >
            {pageComponent}
          </PageContainer>
        </DashboardLayout>
        {/* Overlay sidebar for mobile */}
        {sidebarOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.3)',
              zIndex: 1200,
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}


        </ThemeProvider>
      </AppProvider>
    </CacheProvider>
  );
}
