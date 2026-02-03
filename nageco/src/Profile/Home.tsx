import * as React from 'react';
import { createTheme, ThemeProvider, Theme } from '@mui/material/styles';
import {
  AppProvider,
  Navigation,
  Router,
  DashboardLayout,
  PageContainer,
} from '@toolpad/core';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import WarehouseIcon from '@mui/icons-material/Warehouse';
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

import Logo from '../ui-component/Logo2';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MeetingCalendar from '../Meeting/MeetingCalendar';
import GeneralSettings from '../Setup/GS/GeneralSettings';
import HRSettings from '../Setup/HR/HRSettings';
import FinanceSettings from '../Setup/Finance/FinanceSettings';
import SCSSettings from '../Setup/SCS/SCSSettings';
import HRCompensaions from '../HR/Compensationspages/HRCompensaions';
import DashboardMain from './DS/DashboardMain';
import TimesheetsPage from '../HR/Timesheets/TimesheetsPage';

const NAVIGATION: Navigation = [
  {
    kind: 'header',
    title: 'Main items',
  },
  {
    segment: 'dashboard',
    title: '',
    icon: <DashboardIcon />,
  },
  {
    kind: 'divider',
  },
  {
    kind: 'header',
    title: 'Actions',
  },
  {
    segment: 'setting',
    title: 'Setting',
    icon: <TuneIcon />,
    children: [
      {
        segment: 'generals',
        title: 'General Settings',
        icon: <SettingsIcon />,
      },
      {
        segment: 'hrSetting',
        title: 'HR Settings',
        icon: <PeopleAltIcon />,
      },
      {
        segment: 'finSetting',
        title: 'Finance Settings',
        icon: <MonetizationOnIcon />,
      },
      {
        segment: 'spySetting',
        title: 'Supply Chain Settings',
        icon: <WarehouseIcon />,
      },
    ],
  },
  {
    segment: 'humanRessources',
    title: 'HR',
    icon: <Diversity3Icon />,
    children: [
      {
        segment: 'regulationscompensations',
        title: 'Compensations',
        icon: <CategoryIcon />,
        children: [
          {
            segment: 'vacations',
            title: 'Annual Leave Balances',
            icon: <FlightTakeoffIcon />,

          },
          {
            segment: 'timeheets',
            title: 'Time Sheets',
            icon: <AccessTimeIcon />,
          },
          {
            segment: 'promotions',
            title: 'Promotions',
            icon: <TrendingUpIcon />,
          },
          {
            segment: 'wletter',
            title: 'Warning Letter',
            icon: <ReportProblemIcon />,
          },
          {
            segment: 'productivity',
            title: 'Productivity',
            icon: <TrendingFlatIcon />,
          },
          {
            segment: 'transfer',
            title: 'Transfer',
            icon: <CompareArrowsIcon />,
          },
          {
            segment: 'evaluation',
            title: 'Evaluation',
            icon: <GradeIcon />,
          },
          {
            segment: 'missions',
            title: 'Missions',
            icon: <AssignmentTurnedInIcon />,
          },
          {
            segment: 'lequipement',
            title: 'Loan Equipment',
            icon: <DevicesOtherIcon />,
          },
          {
            segment: 'delegation',
            title: 'Delegation',
            icon: <PeopleAltIcon />,
          },
        ],
      },
    ],
  },
];

const createDemoTheme = (mode: 'light' | 'dark'): Theme =>
  createTheme({
    palette: {
      mode,
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

function useDemoRouter(initialPath: string): Router {
  const [pathname, setPathname] = React.useState(initialPath);

  const router = React.useMemo(() => {
    return {
      pathname,
      searchParams: new URLSearchParams(),
      navigate: (path: string | URL) => setPathname(String(path)),
    };
  }, [pathname]);

  return router;
}

const DashboardPage = () => <DashboardMain />;

function getPageComponent(pathname: string) {
  switch (pathname) {
    case '/setting/generals':
      return <GeneralSettings />;
    case '/dashboard':
      return <DashboardPage />;
    case '/setting/hrSetting':
      return <HRSettings />;
    case '/setting/finSetting':
      return <FinanceSettings />;
    case '/setting/spySetting':
      return <SCSSettings />;

    case '/humanRessources/regulationscompensations/vacations':
      return <HRCompensaions />;

    case '/humanRessources/regulationscompensations/timeheets':
      return <TimesheetsPage />;

    // tolerate common spelling variant
    case '/humanRessources/regulationscompensations/timesheets':
      return <TimesheetsPage />;


    default:
      return <div>404 - Page Not Found</div>;
  }
}

export default function Home(props: any) {
  // Meeting dialog state
  const [meetingDialogOpen, setMeetingDialogOpen] = React.useState(false);
  const handleOpenMeetingDialog = () => setMeetingDialogOpen(true);
  const handleCloseMeetingDialog = () => setMeetingDialogOpen(false);
 
  const router = useDemoRouter('/dashboard');
   
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
  const demoTheme = React.useMemo(() => createDemoTheme(mode), [mode]);

  const toggleTheme = () => setMode(prev => (prev === 'light' ? 'dark' : 'light'));
   

  // Responsive sidebar toggle button
   



  return (
    <AppProvider
      navigation={NAVIGATION}
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
          right: 50,
          zIndex: 1500,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          {/* New Meeting Button */}
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
            Meetings Schedule
          </Button>
          {/* Logout Button */}
            <Button
            variant="outlined"
            color="error"
            onClick={() => {
              localStorage.removeItem('token');
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
            Logout
            </Button>
          {/* Dark / Light toggle */}
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
        </div>

        {/* Meeting Dialog */}
        <Dialog open={meetingDialogOpen} onClose={handleCloseMeetingDialog} maxWidth="lg" fullWidth>
          
          <DialogContent>
            {/* Calendar component styled like Microsoft Teams */}
            <MeetingCalendar />
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
            {getPageComponent(router.pathname)}
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
  );
}
