export type PermissionGroup = 'Sidebar' | 'Top Header';

export type PermissionOption = {
  key: string;
  label: string;
  group: PermissionGroup;
  path?: string;
};

const ROUTE_ALIASES: Record<string, string> = {
  '/medicalInsurance/medicalOverview': '/medicalInsurance/overview',
  '/humanRessources/regulationscompensations/timesheets': '/humanRessources/regulationscompensations/timeheets',
};

export const normalizeRoutePath = (path: string): string => {
  const trimmed = String(path || '').trim();
  if (!trimmed) return '/';

  const prefixed = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const normalized = prefixed.replace(/\/+/g, '/').replace(/\/+$|^$/g, '');

  if (!normalized) return '/';
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

export const toPermissionRoutePath = (path: string): string => {
  const normalized = normalizeRoutePath(path);
  return ROUTE_ALIASES[normalized] || normalized;
};

export const routePermissionKey = (path: string): string => `route:${toPermissionRoutePath(path)}`;

export const HEADER_PERMISSION_KEYS = {
  meetingsSchedule: 'header:meetingsSchedule',
  languageSelector: 'header:languageSelector',
  userInfo: 'header:userInfo',
  logout: 'header:logout',
  themeToggle: 'header:themeToggle',
} as const;

const SIDEBAR_ITEMS: Array<{ path: string; label: string }> = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/bookingSystem', label: 'Booking System' },
  { path: '/bookingSystem/calendar', label: 'Booking Calendar' },
  { path: '/bookingSystem/reports', label: 'Meeting Reports' },

  { path: '/setting', label: 'Settings' },
  { path: '/setting/generals', label: 'General Settings' },
  { path: '/setting/hrSetting', label: 'HR Settings' },
  { path: '/setting/finSetting', label: 'Finance Settings' },
  { path: '/setting/spySetting', label: 'Supply Chain Settings' },

  { path: '/medicalInsurance', label: 'Insurance Management' },
  { path: '/medicalInsurance/overview', label: 'Insurance Overview' },
  { path: '/medicalInsurance/workers', label: 'Insurance Workers' },
  { path: '/medicalInsurance/services', label: 'Insurance Services' },
  { path: '/medicalInsurance/providers', label: 'Insurance Providers' },
  { path: '/medicalInsurance/claims', label: 'Insurance Claims' },
  { path: '/medicalInsurance/doctorReview', label: 'Doctor Review' },
  { path: '/medicalInsurance/doctorReviewed', label: 'Reviewed Claims' },
  { path: '/medicalInsurance/recharge', label: 'Recharge' },
  { path: '/medicalInsurance/transfer', label: 'Transfer Balance' },
  { path: '/medicalInsurance/statement', label: 'Statement' },
  { path: '/medicalInsurance/finance', label: 'Finance Payments' },

  { path: '/fleetManagement', label: 'Fleet Management' },
  { path: '/fleetManagement/overview', label: 'Fleet Overview' },
  { path: '/fleetManagement/vehicles', label: 'Fleet Vehicles' },
  { path: '/fleetManagement/maintenance', label: 'Fleet Maintenance' },
  { path: '/fleetManagement/trips', label: 'Fleet Trips' },
  { path: '/fleetManagement/suppliers', label: 'Fleet Suppliers' },
  { path: '/fleetManagement/insurance', label: 'Fleet Insurance' },
  { path: '/fleetManagement/documents', label: 'Fleet Documents' },
  { path: '/fleetManagement/notifications', label: 'Fleet Notifications' },

  { path: '/humanRessources', label: 'Human Resources' },
  { path: '/humanRessources/employees', label: 'HR Employees' },
  { path: '/humanRessources/regulationscompensations', label: 'Compensations' },
  { path: '/humanRessources/regulationscompensations/vacations', label: 'Annual Leave Balances' },
  { path: '/humanRessources/regulationscompensations/timeheets', label: 'Time Sheets' },
  { path: '/humanRessources/regulationscompensations/promotions', label: 'Promotions' },
  { path: '/humanRessources/regulationscompensations/wletter', label: 'Warning Letter' },
  { path: '/humanRessources/regulationscompensations/productivity', label: 'Productivity' },
  { path: '/humanRessources/regulationscompensations/transfer', label: 'Transfer' },
  { path: '/humanRessources/regulationscompensations/evaluation', label: 'Evaluation' },
  { path: '/humanRessources/regulationscompensations/missions', label: 'Missions' },
  { path: '/humanRessources/regulationscompensations/lequipement', label: 'Loan Equipment' },
  { path: '/humanRessources/regulationscompensations/delegation', label: 'Delegation' },

  { path: '/archive', label: 'Archive' },
  { path: '/archive/paper-types', label: 'Paper Types' },
  { path: '/archive/companies', label: 'Companies' },
  { path: '/archive/finance', label: 'Finance Archive' },
  { path: '/archive/hr', label: 'HR Archive' },
  { path: '/archive/general', label: 'General Archive' },

  { path: '/supplyChain', label: 'Supply Chain' },
  { path: '/supplyChain/sections-products', label: 'Sections and Products' },
  { path: '/supplyChain/requisitions', label: 'Requisitions' },
  { path: '/supplyChain/requisition-reports', label: 'Requisition Reports' },
  { path: '/supplyChain/quote-requests', label: 'Quote Requests' },
];

export const SIDEBAR_PERMISSION_OPTIONS: PermissionOption[] = SIDEBAR_ITEMS.map((item) => {
  const path = toPermissionRoutePath(item.path);
  return {
    key: routePermissionKey(path),
    label: item.label,
    group: 'Sidebar',
    path,
  };
});

export const HEADER_PERMISSION_OPTIONS: PermissionOption[] = [
  {
    key: HEADER_PERMISSION_KEYS.meetingsSchedule,
    label: 'Header: Meetings Schedule Button',
    group: 'Top Header',
  },
  {
    key: HEADER_PERMISSION_KEYS.languageSelector,
    label: 'Header: Language Selector',
    group: 'Top Header',
  },
  {
    key: HEADER_PERMISSION_KEYS.userInfo,
    label: 'Header: User Info',
    group: 'Top Header',
  },
  {
    key: HEADER_PERMISSION_KEYS.logout,
    label: 'Header: Logout Button',
    group: 'Top Header',
  },
  {
    key: HEADER_PERMISSION_KEYS.themeToggle,
    label: 'Header: Theme Toggle',
    group: 'Top Header',
  },
];

export const ALL_PERMISSION_OPTIONS: PermissionOption[] = [
  ...SIDEBAR_PERMISSION_OPTIONS,
  ...HEADER_PERMISSION_OPTIONS,
];

export type ParsedPermissions = {
  configured: boolean;
  keys: Set<string>;
};

export const parseWebPermissions = (raw: unknown): ParsedPermissions => {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!text) {
    return { configured: false, keys: new Set<string>() };
  }

  const keys = new Set<string>();
  const addKey = (value: unknown) => {
    if (typeof value !== 'string') return;
    const key = value.trim();
    if (key) keys.add(key);
  };

  try {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) {
      parsed.forEach(addKey);
    } else if (parsed && typeof parsed === 'object') {
      const maybePermissions = (parsed as { permissions?: unknown }).permissions;
      if (Array.isArray(maybePermissions)) {
        maybePermissions.forEach(addKey);
      }
    } else {
      addKey(parsed);
    }
  } catch {
    text.split(/[\n,;|]+/).forEach(addKey);
  }

  return { configured: true, keys };
};

export const stringifyWebPermissions = (keys: Iterable<string>): string => {
  const normalized = Array.from(new Set(Array.from(keys)
    .map((key) => String(key || '').trim())
    .filter((key) => Boolean(key))));

  normalized.sort((a, b) => a.localeCompare(b));
  return JSON.stringify(normalized);
};