import * as React from 'react';
import { createTheme } from '@mui/material/styles';
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
import GeneralSettings from '../Setup/GS/GeneralSettings';
import HRSettings from '../Setup/HR/HRSettings';
import FinanceSettings from '../Setup/Finance/FinanceSettings';
import SCSSettings from '../Setup/SCS/SCSSettings';
import HRCompensaions from '../HR/Compensationspages/HRCompensaions';
import DashboardMain from './DS/DashboardMain';

const NAVIGATION: Navigation = [
  {
    kind: 'header',
    title: 'Main items',
  },
  {
    segment: 'dashboard',
    title: 'Dashboard',
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
    title: 'Human Ressources',
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

const demoTheme = createTheme({
  colorSchemes: { light: true, dark: true },
  cssVariables: {
    colorSchemeSelector: 'class',
  },
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


    default:
      return <div>404 - Page Not Found</div>;
  }
}

export default function Home(props: any) {
  const { window } = props;
  const router = useDemoRouter('/dashboard');
  const demoWindow = window ? window() : undefined;

  return (
    <AppProvider
      navigation={NAVIGATION}
      router={router}
      theme={demoTheme}
      window={demoWindow}
      branding={{
        logo: <Logo />,
        title: 'NAGECO',
      }}
    >
      <DashboardLayout>
        <PageContainer sx={{ ml:1  ,mr:1 }}>
          {getPageComponent(router.pathname)}
        </PageContainer>
      </DashboardLayout>
    </AppProvider>
  );
}
