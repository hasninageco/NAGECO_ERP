import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../../utils/api';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import InsuranceHeaderTitle from './InsuranceHeaderTitle';

type Claim = {
  ClaimId: number;
  ClaimNo: string;
  Ref_emp: string;
  EMP_CHILD?: string | null;
  ProviderId?: number | null;
  ClaimDate: string;
  SubmissionDate?: string | null;
  ClaimType: string;
  Status: string;
  TotalClaimed: number;
  TotalApproved: number;
  CompanyShare: number;
  EmployeeShare: number;
  Notes?: string | null;
};

type Employee = {
  ID_EMP: number;
  NAME: string;
  Ref_emp?: string | null;
  COST_CENTER?: string | null; // stores cost center id (Adminstration.id_administratin)
  COST_CENTER_NAME?: string | null;
  COST_CENTER_AR?: string | null;
  COST_CENTER_CODE?: string | null; // Branche
};

type Child = {
  ID_CHILD: number;
  NAME_CHILD?: string | null;
  DATE_NAISSANCE?: string | null;
  SEX?: string | null;
  type_child?: string | null;
  STATE?: boolean | null;
  EMP_CHILD?: number | null;
};

const EMPLOYEE_MEMBER_ID = -1;
const isEmployeeMember = (m: Child | null | undefined) => m?.ID_CHILD === EMPLOYEE_MEMBER_ID;

type Service = {
  ServiceId: number;
  ServiceCode: string;
  ServiceName: string;
  ArabicName?: string | null;
  clinic_category?: string | null;
};

type ClaimLine = {
  ClaimLineId: number;
  ClaimId: number;
  ServiceId: number;
  Qty: number;
  UnitPrice: number;
  CoverageUsed?: number | null;
  ApprovedAmount?: number | null;
  CompanyPay?: number | null;
  EmployeePay?: number | null;
  LineStatus?: string | null;
  Notes?: string | null;
};

type ClaimDocument = {
  ClaimId: number;
  FileName: string;
  FileType?: string | null;
  Size?: number | null;
  ModifiedAt?: string | null;
};

type ClaimReceiptData = {
  claim: Claim;
  employee: Employee | null;
  member: Child | null;
  memberLabel: string;
  totals: { claimed: number; approved: number; company: number; employee: number };
  lines: ClaimLine[];
  docs: ClaimDocument[];
  printedAt: string;
};

const todayIso = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

type Props = {
  onBack?: () => void;
};

const ClaimsPage: React.FC<Props> = ({ onBack }) => {
  const { t: tr, i18n } = useTranslation();
  const isArabic = i18n.language?.toLowerCase().startsWith('ar');

  const [refEmp, setRefEmp] = useState('');
  const [finding, setFinding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceValue, setBalanceValue] = useState<number | null>(null);
  const [balanceInfo, setBalanceInfo] = useState<string>('');

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [members, setMembers] = useState<Child[]>([]);
  const [selectedMember, setSelectedMember] = useState<Child | null>(null);

  const [claims, setClaims] = useState<Claim[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [lines, setLines] = useState<ClaimLine[]>([]);
  const [docs, setDocs] = useState<ClaimDocument[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [claimReceiptToPrint, setClaimReceiptToPrint] = useState<ClaimReceiptData | null>(null);
  const [isPrintingClaimReceipt, setIsPrintingClaimReceipt] = useState(false);

  const [newLine, setNewLine] = useState<Partial<ClaimLine>>({ Qty: 1, UnitPrice: 0 });
  const [uploading, setUploading] = useState(false);

  const safeNum = (v: any) => {
    const n = typeof v === 'number' ? v : Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  const calcTotalsFromLines = (rows: ClaimLine[]) => {
    const claimed = rows.reduce((acc, ln) => {
      const qty = safeNum(ln.Qty);
      const unit = safeNum(ln.UnitPrice);
      return acc + qty * unit;
    }, 0);
    const company = rows.reduce((acc, ln) => {
      const v = ln.CompanyPay ?? ln.ApprovedAmount ?? 0;
      return acc + safeNum(v);
    }, 0);
    const employee = rows.reduce((acc, ln) => acc + safeNum(ln.EmployeePay), 0);
    return {
      claimed: Math.round(claimed * 100) / 100,
      approved: Math.round(company * 100) / 100,
      company: Math.round(company * 100) / 100,
      employee: Math.round(employee * 100) / 100,
    };
  };

  const displayClaimTotals = useMemo(() => {
    if (!selectedClaim) return null;
    const fromLines = calcTotalsFromLines(lines);
    const hasLinesTotals = fromLines.claimed !== 0 || fromLines.company !== 0 || fromLines.employee !== 0;
    if (hasLinesTotals) return fromLines;
    return {
      claimed: Math.round(safeNum(selectedClaim.TotalClaimed) * 100) / 100,
      approved: Math.round(safeNum(selectedClaim.TotalApproved) * 100) / 100,
      company: Math.round(safeNum(selectedClaim.CompanyShare) * 100) / 100,
      employee: Math.round(safeNum(selectedClaim.EmployeeShare) * 100) / 100,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClaim?.ClaimId, lines]);

  const getCostCenterParts = (e: Employee) => {
    const code = (e.COST_CENTER_CODE || '').trim();
    const name = (e.COST_CENTER_NAME || '').trim();
    const arabicName = (e.COST_CENTER_AR || '').trim();
    return {
      code: code || '-',
      name: name || '-',
      arabicName: arabicName || '-',
    };
  };


  const claimsApi = buildApiUrl('/medicalInsurance/claims');
  const linesApi = buildApiUrl('/medicalInsurance/claimLines');
  const docsApi = buildApiUrl('/medicalInsurance/claimDocuments');
  const balancesApi = buildApiUrl('/medicalInsurance/balances');
  const employeesApi = buildApiUrl('/employees');
  const childrenApi = buildApiUrl('/children');
  const servicesApi = buildApiUrl('/medicalInsurance/services');

  const withAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const loadServices = async () => {
    const headers = withAuth();
    if (!headers) return;
    try {
      const resp = await axios.get<Service[]>(`${servicesApi}/all`, { headers });
      setServices(resp.data || []);
    } catch (err) {
      console.error('Error fetching services', err);
    }
  };

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBalance = async (ref: string, dateIso: string) => {
    const headers = withAuth();
    if (!headers) return;

    setBalanceLoading(true);
    try {
      const resp = await axios.get(`${balancesApi}/balance`, {
        headers,
        params: { Ref_emp: ref, date: dateIso },
      });

      const b = resp.data?.balance;
      const n = typeof b === 'number' ? b : Number(b ?? 0);
      setBalanceValue(Number.isFinite(n) ? n : 0);
      setBalanceInfo(resp.data?.message ? String(resp.data.message) : '');
    } catch (e) {
      console.error('Balance load error', e);
      setBalanceValue(null);
      setBalanceInfo(tr('insurance.claimsPage.failedLoadBalance'));
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    const ref = String(employee?.Ref_emp || '').trim();
    if (!ref) {
      setBalanceValue(null);
      setBalanceInfo('');
      return;
    }
    const dateIso = String(selectedClaim?.ClaimDate || todayIso()).slice(0, 10);
    loadBalance(ref, dateIso).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee?.Ref_emp, selectedClaim?.ClaimDate]);

  const findEmployee = async () => {
    const headers = withAuth();
    if (!headers) {
      setError(tr('insurance.claimsPage.notLoggedIn'));
      return;
    }

    const ref = refEmp.trim();
    if (!ref) {
      setError(tr('insurance.claimsPage.enterEmployeeNo'));
      return;
    }

    setError(null);
    setFinding(true);
    setEmployee(null);
    setMembers([]);
    setSelectedMember(null);
    setClaims([]);
    setSelectedClaim(null);
    setLines([]);
    setDocs([]);
    setBalanceValue(null);
    setBalanceInfo('');

    try {
      const empResp = await axios.get<Employee>(`${employeesApi}/ref/${encodeURIComponent(ref)}`, {
        headers,
      });
      setEmployee(empResp.data);

      // Existing endpoint: /children/employee/:EMP_CHILD (in this system EMP_CHILD is often Ref_emp)
      const chResp = await axios.get<Child[]>(`${childrenApi}/employee/${encodeURIComponent(ref)}`, {
        headers,
      });
      setMembers(chResp.data || []);
    } catch (err: any) {
      if (err.response?.status === 401) setError(tr('insurance.claimsPage.sessionExpired'));
      else if (err.response?.status === 404) setError(tr('insurance.claimsPage.employeeNotFound'));
      else {
        console.error('Find employee error', err);
        setError(tr('insurance.claimsPage.failedFindEmployee'));
      }
    } finally {
      setFinding(false);
    }
  };

  const formatMoney = (n: number) => {
    if (!Number.isFinite(n)) return '0.00 LYD';
    const formatted = new Intl.NumberFormat(isArabic ? 'ar-LY' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
    return `${formatted} LYD`;
  };

  const statusText = (status: string | null | undefined) => {
    const raw = String(status || '').trim();
    const s = raw.toLowerCase();
    if (!raw) return '-';
    if (s === 'approved' || s === 'accept' || s === 'accepted') return tr('insurance.claimsPage.statusTexts.approved');
    if (s === 'rejected' || s === 'refused' || s === 'رفض' || s === 'refuse') return tr('insurance.claimsPage.statusTexts.rejected');
    if (s === 'pending' || s === 'draft' || s === 'submitted') return tr('insurance.claimsPage.statusTexts.pending');
    return raw;
  };

  const statusIcon = (status: string | null | undefined) => {
    const s = String(status || '').trim().toLowerCase();
    if (!s) return null;

    if (s === 'approved' || s === 'accept' || s === 'accepted') {
      return <CheckCircleIcon fontSize="small" color="success" />;
    }
    if (s === 'rejected' || s === 'refused' || s === 'رفض' || s === 'refuse') {
      return <CancelIcon fontSize="small" color="error" />;
    }

    // default: pending/submitted/draft/anything else
    return <HourglassEmptyIcon fontSize="small" color="warning" />;
  };

  const membersTableData = useMemo<Child[]>(() => {
    if (!employee) return members;
    const employeeRow: Child = {
      ID_CHILD: EMPLOYEE_MEMBER_ID,
      NAME_CHILD: employee.NAME,
      type_child: 'موظف',
      STATE: true,
      EMP_CHILD: null,
    };
    return [employeeRow, ...members];
  }, [employee, members]);

  const loadClaimDetails = async (claim: Claim) => {
    const headers = withAuth();
    if (!headers) return;

    setDetailsLoading(true);
    try {
      const [linesResp, docsResp] = await Promise.all([
        axios.get<ClaimLine[]>(`${linesApi}/all?ClaimId=${encodeURIComponent(String(claim.ClaimId))}`,
          { headers }),
        axios.get<ClaimDocument[]>(`${docsApi}/all?ClaimId=${encodeURIComponent(String(claim.ClaimId))}`,
          { headers }),
      ]);
      setLines(linesResp.data || []);
      setDocs(docsResp.data || []);
    } catch (err) {
      console.error('Error loading claim details', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const loadClaimsForMember = async (ref: string, member: Child) => {
    const headers = withAuth();
    if (!headers) return;

    setClaimsLoading(true);
    try {
      const empChildParam = isEmployeeMember(member) ? 'NULL' : String(member.ID_CHILD);
      const resp = await axios.get<Claim[]>(
        `${claimsApi}/all?Ref_emp=${encodeURIComponent(ref)}&EMP_CHILD=${encodeURIComponent(empChildParam)}`,
        { headers }
      );
      const rows = resp.data || [];
      setClaims(rows);
      const first = rows[0] ?? null;
      setSelectedClaim(first);
      if (first) await loadClaimDetails(first);
      else {
        setLines([]);
        setDocs([]);
      }
    } catch (err) {
      console.error('Error fetching member claims', err);
    } finally {
      setClaimsLoading(false);
    }
  };

  const selectMember = async (member: Child) => {
    const ref = String(employee?.Ref_emp || refEmp.trim());
    setSelectedMember(member);
    setSelectedClaim(null);
    setLines([]);
    setDocs([]);
    if (!ref) return;
    await loadClaimsForMember(ref, member);
  };

  const createClaimForMember = async (member: Child) => {
    const headers = withAuth();
    if (!headers) {
      setError(tr('insurance.claimsPage.notLoggedIn'));
      return;
    }
    const ref = (employee?.Ref_emp || refEmp).trim();
    if (!ref) {
      setError(tr('insurance.claimsPage.enterEmployeeNo'));
      return;
    }

    setError(null);
    try {
      await axios.post(
        `${claimsApi}/Add`,
        {
          Ref_emp: ref,
          ...(isEmployeeMember(member) ? {} : { EMP_CHILD: String(member.ID_CHILD) }),
          ClaimDate: todayIso(),
          ClaimType: 'Medical',
          Status: 'Pending',
        },
        { headers }
      );

      await selectMember(member);
    } catch (err: any) {
      console.error('Error creating claim', err);
      alert(err.response?.data?.message || tr('insurance.claimsPage.failedCreateClaim'));
    }
  };

  const addLine = async () => {
    const headers = withAuth();
    if (!headers) return;
    if (!selectedClaim) return;
    if (!newLine.ServiceId) return alert(tr('insurance.claimsPage.selectService'));

    try {
      await axios.post(
        `${linesApi}/Add`,
        {
          ClaimId: selectedClaim.ClaimId,
          ServiceId: newLine.ServiceId,
          Qty: newLine.Qty ?? 1,
          UnitPrice: newLine.UnitPrice ?? 0,
          Notes: newLine.Notes,
        },
        { headers }
      );
      setNewLine({ Qty: 1, UnitPrice: 0 });
      await loadClaimDetails(selectedClaim);
    } catch (err: any) {
      console.error('Error adding claim line', err);
      alert(err.response?.data?.message || tr('insurance.claimsPage.failedAddService'));
    }
  };

  const serviceNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of services) map.set(s.ServiceId, s.ArabicName || s.ServiceName || s.ServiceCode);
    return map;
  }, [services]);

  const deleteClaimLine = async (line: ClaimLine) => {
    const headers = withAuth();
    if (!headers) {
      setError(tr('insurance.claimsPage.notLoggedIn'));
      return;
    }
    if (!selectedClaim) return;

    const serviceLabel = serviceNameById.get(Number(line.ServiceId)) || String(line.ServiceId);
    const confirmed = window.confirm(
      tr('insurance.claimsPage.confirmDeleteService', { service: serviceLabel })
    );
    if (!confirmed) return;

    try {
      await axios.delete(`${linesApi}/Delete/${line.ClaimLineId}`, { headers });
      await loadClaimDetails(selectedClaim);
    } catch (err: any) {
      console.error('Error deleting claim service line', err);
      alert(err.response?.data?.message || tr('insurance.claimsPage.failedDeleteService'));
    }
  };

  const uploadDoc = async (file: File) => {
    const headers = withAuth();
    if (!headers) return;
    if (!selectedClaim) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append('ClaimId', String(selectedClaim.ClaimId));
      form.append('file', file, file.name);

      await axios.post(`${docsApi}/Upload`, form, {
        headers: {
          ...headers,
          // Let axios set the correct boundary
        },
      });
      await loadClaimDetails(selectedClaim);
    } catch (err: any) {
      console.error('Error uploading document', err);
      alert(err.response?.data?.message || tr('insurance.claimsPage.failedUploadDocument'));
    } finally {
      setUploading(false);
    }
  };

  const openDoc = async (claimId: number, fileName: string) => {
    const headers = withAuth();
    if (!headers) return;
    const token = String(headers.Authorization).replace('Bearer ', '');
    const url = `${docsApi}/content?ClaimId=${encodeURIComponent(String(claimId))}&FileName=${encodeURIComponent(String(fileName))}`;

    try {
      const blob = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((r) => {
        if (!r.ok) throw new Error('Failed to fetch');
        return r.blob();
      });
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      alert(tr('insurance.claimsPage.failedOpenDocument'));
    }
  };

  const printClaimReceipt = (data: ClaimReceiptData) => {
    setClaimReceiptToPrint(data);
    setIsPrintingClaimReceipt(true);
  };

  useEffect(() => {
    if (!isPrintingClaimReceipt || !claimReceiptToPrint?.claim) return;

    const bodyClass = 'printing-claim-receipt';
    document.body.classList.add(bodyClass);

    let cleaned = false;
    let fallbackTimer = 0;

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove(bodyClass);
      setIsPrintingClaimReceipt(false);
      window.removeEventListener('afterprint', cleanup);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };

    window.addEventListener('afterprint', cleanup);

    const printTimer = window.setTimeout(() => {
      window.print();
      fallbackTimer = window.setTimeout(cleanup, 5000);
    }, 120);

    return () => {
      window.clearTimeout(printTimer);
      cleanup();
    };
  }, [isPrintingClaimReceipt, claimReceiptToPrint]);

  const handlePrintSelectedClaim = () => {
    if (!selectedClaim) return;

    const memberLabel = isEmployeeMember(selectedMember)
      ? tr('insurance.claimsPage.employeeMemberLabel', { name: employee?.NAME || '-' })
      : tr('insurance.claimsPage.dependentMemberLabel', {
          name: selectedMember?.NAME_CHILD || selectedMember?.ID_CHILD || '-',
        });

    printClaimReceipt({
      claim: selectedClaim,
      employee,
      member: selectedMember,
      memberLabel,
      totals: {
        claimed: Number(displayClaimTotals?.claimed ?? 0),
        approved: Number(displayClaimTotals?.approved ?? 0),
        company: Number(displayClaimTotals?.company ?? 0),
        employee: Number(displayClaimTotals?.employee ?? 0),
      },
      lines: [...lines],
      docs: [...docs],
      printedAt: new Date().toISOString(),
    });
  };

  return (
    <Box p={2}>
      <style>
        {`
          @media print {
            body.printing-claim-receipt * { visibility: hidden; }
            body.printing-claim-receipt #claim-receipt,
            body.printing-claim-receipt #claim-receipt * { visibility: visible; }
            body.printing-claim-receipt #claim-receipt {
              position: absolute !important;
              left: 0 !important;
              right: 0 !important;
              top: 0 !important;
              width: 100% !important;
              opacity: 1 !important;
              display: block !important;
              transform: none !important;
            }
            #claim-receipt, #claim-receipt * { color: #000 !important; }
            #claim-receipt .MuiTypography-root { font-weight: 800 !important; }
            #claim-receipt { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            #claim-receipt { background: #fff !important; }
            #claim-receipt * { background: transparent !important; }
          }
        `}
      </style>

      {claimReceiptToPrint?.claim ? (
        <Box
          id="claim-receipt"
          dir={isArabic ? 'rtl' : 'ltr'}
          sx={{
            position: 'fixed',
            left: isPrintingClaimReceipt ? 0 : -10000,
            right: isPrintingClaimReceipt ? 0 : 'auto',
            top: 0,
            width: isPrintingClaimReceipt ? '100%' : 900,
            p: 2,
            bgcolor: '#fff',
            opacity: isPrintingClaimReceipt ? 1 : 0,
            pointerEvents: 'none',
            '& .MuiTypography-root': { color: '#000', fontWeight: 800 },
          }}
        >
          <Box sx={{ position: 'relative', mb: 2, minHeight: 110 }}>
            <Box sx={{ textAlign: 'center', pr: 34, pl: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                {tr('insurance.claimsPage.pageTitle')}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, lineHeight: 1.1 }} dir="rtl">
                إيصال مطالبة التأمين الصحي
              </Typography>
            </Box>
            <Box
              component="img"
              src="/nag-insurance.png"
              alt="Insurance"
              sx={{
                height: 110,
                width: 'auto',
                maxWidth: 320,
                objectFit: 'contain',
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
          </Box>

          <Stack spacing={0.5}>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {tr('insurance.claimsPage.claimNo')}: {claimReceiptToPrint.claim.ClaimNo}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {tr('insurance.claimsPage.status')}: {statusText(claimReceiptToPrint.claim.Status)}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {tr('insurance.claimsPage.claimDate')}: {String(claimReceiptToPrint.claim.ClaimDate || '').slice(0, 10)}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {tr('insurance.claimsPage.employeeNo')}: {claimReceiptToPrint.claim.Ref_emp}
              {claimReceiptToPrint.employee?.NAME ? ` - ${claimReceiptToPrint.employee.NAME}` : ''}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {claimReceiptToPrint.memberLabel}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              {tr('insurance.claimsPage.printedAt')}: {new Date(claimReceiptToPrint.printedAt).toLocaleString(isArabic ? 'ar-LY' : 'en-US')}
            </Typography>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {tr('insurance.claimsPage.totals.claimed')}: {formatMoney(Number(claimReceiptToPrint.totals.claimed || 0))}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {tr('insurance.claimsPage.totals.approved')}: {formatMoney(Number(claimReceiptToPrint.totals.approved || 0))}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {tr('insurance.claimsPage.totals.company')}: {formatMoney(Number(claimReceiptToPrint.totals.company || 0))}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {tr('insurance.claimsPage.totals.employee')}: {formatMoney(Number(claimReceiptToPrint.totals.employee || 0))}
            </Typography>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
              {tr('insurance.claimsPage.servicesSection')}
            </Typography>
            {claimReceiptToPrint.lines.length ? (
              <Stack spacing={0.75}>
                {claimReceiptToPrint.lines.map((ln, idx) => {
                  const qty = Number(ln.Qty ?? 0);
                  const unit = Number(ln.UnitPrice ?? 0);
                  const claimed = (Number.isFinite(qty) ? qty : 0) * (Number.isFinite(unit) ? unit : 0);
                  const covered = Number(ln.CompanyPay ?? ln.ApprovedAmount ?? 0);
                  const employeePay = Number(ln.EmployeePay ?? 0);

                  return (
                    <Box
                      key={ln.ClaimLineId}
                      sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        pb: 0.75,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="baseline" justifyContent="space-between">
                        <Typography variant="body2" sx={{ fontWeight: 900, pr: 1 }}>
                          {idx + 1}. {serviceNameById.get(Number(ln.ServiceId)) || String(ln.ServiceId)}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 900, whiteSpace: 'nowrap' }}>
                          {tr('insurance.claimsPage.claimedLabel')}: {formatMoney(Number.isFinite(claimed) ? claimed : 0)}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ fontWeight: 800 }}>
                        {tr('insurance.claimsPage.qtyLabel')}: {ln.Qty} | {tr('insurance.claimsPage.unitLabel')}: {formatMoney(Number.isFinite(unit) ? unit : 0)} | {tr('insurance.claimsPage.coveredLabel')}: {formatMoney(Number.isFinite(covered) ? covered : 0)} | {tr('insurance.claimsPage.employeeLabel')}: {formatMoney(Number.isFinite(employeePay) ? employeePay : 0)}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {tr('insurance.claimsPage.noServices')}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" sx={{ fontWeight: 900 }}>
            {tr('insurance.claimsPage.documentsCount')}: {claimReceiptToPrint.docs.length}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={2} alignItems="baseline" justifyContent="space-between">
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {tr('insurance.claimsPage.totals.covered')}: {formatMoney(
                claimReceiptToPrint.lines.reduce((acc, ln) => {
                  const covered = Number(ln.CompanyPay ?? ln.ApprovedAmount ?? 0);
                  return acc + (Number.isFinite(covered) ? covered : 0);
                }, 0)
              )}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800 }} dir="rtl">
              إجمالي التغطية
            </Typography>
          </Stack>
        </Box>
      ) : null}

      <Stack direction="row" spacing={2} alignItems="stretch">
        {/* Sidebar */}
        <Card elevation={3} sx={{ width: 380, flexShrink: 0 }}>
          <CardHeader
            title={<InsuranceHeaderTitle title={tr('insurance.claimsPage.pageTitle')} />}
           
            action={
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => (onBack ? onBack() : window.history.back())}
              >
                {tr('insurance.claimsPage.back')}
              </Button>
            }
          />
          <CardContent>
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder={tr('insurance.claimsPage.employeeNoPlaceholder')}
                  value={refEmp}
                  onChange={(e) => setRefEmp(e.target.value)}
                  InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
                  fullWidth
                />
                <Button variant="contained" onClick={findEmployee} disabled={finding}>
                  {tr('insurance.claimsPage.find')}
                </Button>
              </Stack>

              {error ? <Box sx={{ color: 'error.main' }}>{error}</Box> : null}

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  {tr('insurance.claimsPage.employeeSection')}
                </Typography>
                {employee ? (
                  <Box sx={{ display: 'grid', gap: 0.5 }}>
                    <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="baseline">
                      <Typography variant="body2">{tr('insurance.claimsPage.employeeNo')}: {employee.Ref_emp || '-'}</Typography>
                      <Typography variant="body2">{tr('insurance.claimsPage.employeeName')}: {employee.NAME || '-'}</Typography>
                    </Stack>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {tr('insurance.claimsPage.costCenter')}
                      </Typography>
                      {(() => {
                        const cc = getCostCenterParts(employee);
                        return (
                          <Box component="ul" sx={{ m: 0, pl: 3 }}>
                            <Typography component="li" variant="body2">
                              {tr('insurance.claimsPage.code')}: {cc.code}
                            </Typography>
                            <Typography component="li" variant="body2">
                              {tr('insurance.claimsPage.name')}: {cc.name}
                            </Typography>
                            <Typography component="li" variant="body2">
                              {tr('insurance.claimsPage.arabicName')}: {cc.arabicName}
                            </Typography>
                          </Box>
                        );
                      })()}
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {tr('insurance.claimsPage.enterEmployeeHint')}
                  </Typography>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {tr('insurance.claimsPage.membersSection')}
                </Typography>
                {finding ? (
                  <Typography variant="body2" color="text.secondary">
                    {tr('insurance.claimsPage.loading')}
                  </Typography>
                ) : (
                  <List disablePadding sx={{ display: 'grid', gap: 1 }}>
                    {membersTableData.map((m) => {
                      const isSelected = selectedMember?.ID_CHILD === m.ID_CHILD;
                      const employeeRow = isEmployeeMember(m);
                      return (
                        <ListItem
                          key={m.ID_CHILD}
                          disablePadding
                          component={Paper}
                          elevation={0}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            overflow: 'hidden',
                            ...(employeeRow
                              ? {
                                  borderLeft: '6px solid',
                                  borderLeftColor: 'primary.main',
                                }
                              : {}),
                            bgcolor: isSelected
                              ? 'action.selected'
                              : employeeRow
                                ? (theme) => alpha(theme.palette.primary.main, 0.06)
                                : 'background.paper',
                          }}
                          secondaryAction={
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<AddIcon />}
                              sx={{ textTransform: 'none' }}
                              onClick={() => createClaimForMember(m)}
                            >
                              {tr('insurance.claimsPage.createClaim')}
                            </Button>
                          }
                        >
                          <ListItemButton
                            onClick={() => selectMember(m)}
                            sx={{ pr: 16 }}
                          >
                            <ListItemText
                              primary={
                                <Stack direction="row" spacing={1} alignItems="baseline" sx={{ minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 700,
                                      lineHeight: 1.2,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {m.NAME_CHILD || '-'}
                                  </Typography>
                                  {employeeRow ? (
                                    <Typography
                                      variant="caption"
                                      sx={{ color: 'primary.main', fontWeight: 700, flexShrink: 0 }}
                                    >
                                      {tr('insurance.claimsPage.employeeBadge')}
                                    </Typography>
                                  ) : null}
                                </Stack>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.1 }}>
                                  {tr('insurance.claimsPage.id')}: {m.ID_CHILD} | {tr('insurance.claimsPage.type')}: {m.type_child || '-'} | {tr('insurance.claimsPage.sex')}: {m.SEX || '-'}
                                </Typography>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Main body */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card elevation={3}>
            <CardHeader
              sx={{ pb: 0 }}
              title={
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="baseline"
                  sx={{ flexWrap: 'wrap', minWidth: 0 }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.15 }}>
                    {tr('insurance.claimsPage.claimDetails')}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 900, lineHeight: 1.15, minWidth: 0, color: 'primary.main' }}
                  >
                    {selectedMember
                      ? `${tr('insurance.claimsPage.memberPrefix')}: ${selectedMember.NAME_CHILD || selectedMember.ID_CHILD}`
                      : tr('insurance.claimsPage.selectMemberFromLeft')}
                  </Typography>
                </Stack>
              }
              action={
                <Stack direction="row" spacing={1} alignItems="center">
                  {employee?.Ref_emp ? (
                    <Chip
                      size="medium"
                      variant="filled"
                      color={
                        balanceLoading
                          ? 'info'
                          : balanceValue === null
                            ? 'error'
                            : balanceInfo
                              ? 'warning'
                              : 'success'
                      }
                      sx={{
                        height: 40,
                        '& .MuiChip-label': {
                          fontWeight: 900,
                          fontSize: '1.2rem',
                          py: 0.5,
                        },
                      }}
                      label={
                        balanceLoading
                          ? tr('insurance.claimsPage.balanceLoading')
                          : balanceValue !== null
                            ? selectedClaim
                              ? tr('insurance.claimsPage.balanceWithClaim', {
                                  balance: formatMoney(balanceValue),
                                  claimNo: selectedClaim.ClaimNo,
                                  approved: formatMoney(Number(displayClaimTotals?.approved ?? 0)),
                                })
                              : tr('insurance.claimsPage.balanceOnly', { amount: formatMoney(balanceValue) })
                            : tr('insurance.claimsPage.balanceEmpty')
                      }
                      title={
                        selectedClaim
                          ? `${tr('insurance.claimsPage.employeeNo')}: ${employee.Ref_emp} | ${tr('insurance.claimsPage.claimNo')}: ${selectedClaim.ClaimNo} | ${tr('insurance.claimsPage.status')}: ${statusText(selectedClaim.Status)} | ${tr('insurance.claimsPage.totals.claimed')}: ${formatMoney(
                              Number(displayClaimTotals?.claimed ?? 0)
                            )} | ${tr('insurance.claimsPage.totals.approved')}: ${formatMoney(Number(displayClaimTotals?.approved ?? 0))} | ${tr('insurance.claimsPage.totals.company')}: ${formatMoney(
                              Number(displayClaimTotals?.company ?? 0)
                            )} | ${tr('insurance.claimsPage.totals.employee')}: ${formatMoney(Number(displayClaimTotals?.employee ?? 0))}${balanceInfo ? ` | ${balanceInfo}` : ''}`
                          : balanceInfo || ''
                      }
                    />
                  ) : null}

                  <IconButton
                    aria-label="print-claim"
                    onClick={handlePrintSelectedClaim}
                    disabled={!selectedClaim || detailsLoading}
                    title={selectedClaim ? tr('insurance.claimsPage.printClaim') : tr('insurance.claimsPage.selectClaimFirst')}
                  >
                    <PrintIcon />
                  </IconButton>

                  <IconButton
                    aria-label="refresh"
                    onClick={() => {
                      if (selectedClaim) loadClaimDetails(selectedClaim);
                      if (employee?.Ref_emp && selectedMember) {
                        loadClaimsForMember(String(employee.Ref_emp), selectedMember);
                      }
                      if (employee?.Ref_emp) {
                        const dateIso = String(selectedClaim?.ClaimDate || todayIso()).slice(0, 10);
                        loadBalance(String(employee.Ref_emp), dateIso);
                      }
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Stack>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              {selectedMember ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {tr('insurance.claimsPage.claimsForMember')}
                    </Typography>
                    {claimsLoading ? (
                      <Typography variant="body2" color="text.secondary">
                        {tr('insurance.claimsPage.loading')}
                      </Typography>
                    ) : claims.length ? (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {claims.map((c) => (
                          <Button
                            key={c.ClaimId}
                            variant={selectedClaim?.ClaimId === c.ClaimId ? 'contained' : 'outlined'}
                            onClick={async () => {
                              setSelectedClaim(c);
                              await loadClaimDetails(c);
                            }}
                          >
                            {c.ClaimNo}
                          </Button>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {tr('insurance.claimsPage.noClaimsYet')}
                      </Typography>
                    )}
                  </Box>

                  <Divider />

                  {selectedClaim ? (
                    <>
                      <Stack direction="row" spacing={2} alignItems="baseline" flexWrap="wrap" useFlexGap>
                        <Typography variant="body2">
                          {tr('insurance.claimsPage.totals.claimed')}: {formatMoney(Number(displayClaimTotals?.claimed ?? 0))}
                        </Typography>
                        <Typography variant="body2">
                          {tr('insurance.claimsPage.totals.approved')}: {formatMoney(Number(displayClaimTotals?.approved ?? 0))}
                        </Typography>
                        <Typography variant="body2">
                          {tr('insurance.claimsPage.totals.company')}: {formatMoney(Number(displayClaimTotals?.company ?? 0))}
                        </Typography>
                        <Typography variant="body2">
                          {tr('insurance.claimsPage.totals.employee')}: {formatMoney(Number(displayClaimTotals?.employee ?? 0))}
                        </Typography>
                      </Stack>

                      {selectedClaim.Notes ? (
                        <Chip
                          size="small"
                          variant="outlined"
                          color="error"
                          label={tr('insurance.claimsPage.claimNotes', { notes: selectedClaim.Notes })}
                          sx={{
                            fontWeight: 800,
                            backgroundColor: 'transparent',
                            maxWidth: '100%',
                            height: 'auto',
                            '& .MuiChip-label': { whiteSpace: 'normal' },
                          }}
                        />
                      ) : null}

                      <Divider />

                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          {tr('insurance.claimsPage.servicesSection')}
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mb: 1, flexWrap: 'wrap' }}
                        >
                          <TextField
                            select
                            size="small"
                            label={tr('insurance.claimsPage.serviceLabel')}
                            value={newLine.ServiceId ?? ''}
                            onChange={(e) =>
                              setNewLine((p) => ({ ...p, ServiceId: Number(e.target.value) }))
                            }
                            sx={{ minWidth: 260 }}
                          >
                            {services.map((s) => (
                              <MenuItem key={s.ServiceId} value={s.ServiceId}>
                                {(s.ArabicName || s.ServiceName) ?? s.ServiceCode}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            size="small"
                            label={tr('insurance.claimsPage.qtyLabel')}
                            type="number"
                            value={newLine.Qty ?? 1}
                            onChange={(e) => setNewLine((p) => ({ ...p, Qty: Number(e.target.value) }))}
                            sx={{ width: 110 }}
                          />
                          <TextField
                            size="small"
                            label={`${tr('insurance.claimsPage.unitLabel')} (LYD)`}
                            type="number"
                            value={newLine.UnitPrice ?? 0}
                            onChange={(e) =>
                              setNewLine((p) => ({ ...p, UnitPrice: Number(e.target.value) }))
                            }
                            sx={{ width: 140 }}
                          />
                          <Button variant="contained" onClick={addLine} startIcon={<AddIcon />}>
                            {tr('insurance.claimsPage.addService')}
                          </Button>
                        </Stack>

                            {detailsLoading ? (
                              <Typography variant="body2" color="text.secondary">
                                {tr('insurance.claimsPage.loading')}
                              </Typography>
                            ) : lines.length ? (
                              <List disablePadding sx={{ display: 'grid', gap: 1 }}>
                                {lines.map((ln) => (
                                  <ListItem
                                    key={ln.ClaimLineId}
                                    disablePadding
                                    component={Paper}
                                    elevation={0}
                                    sx={{
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      borderRadius: 1,
                                      overflow: 'hidden',
                                    }}
                                    secondaryAction={
                                      <Button
                                        size="small"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => deleteClaimLine(ln)}
                                        disabled={detailsLoading}
                                      >
                                        {tr('insurance.claimsPage.deleteService')}
                                      </Button>
                                    }
                                  >
                                    <ListItemButton sx={{ cursor: 'default', pr: 16 }}>
                                      <ListItemText
                                        primary={
                                          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flexWrap: 'wrap' }}>
                                            <Box
                                              sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}
                                              aria-label={ln.LineStatus ? `status-${ln.LineStatus}` : 'status'}
                                            >
                                              {statusIcon(ln.LineStatus)}
                                              <Typography
                                                variant="body2"
                                                sx={{
                                                  fontWeight: 800,
                                                  lineHeight: 1.2,
                                                  whiteSpace: 'nowrap',
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                  maxWidth: 320,
                                                }}
                                              >
                                                {serviceNameById.get(Number(ln.ServiceId)) || String(ln.ServiceId)}
                                              </Typography>
                                            </Box>

                                            {(() => {
                                              const qty = Number(ln.Qty ?? 0);
                                              const unit = Number(ln.UnitPrice ?? 0);
                                              const claimed = (Number.isFinite(qty) ? qty : 0) * (Number.isFinite(unit) ? unit : 0);
                                              const coverage = Number(ln.CoverageUsed ?? 0);
                                              const covered = Number(ln.ApprovedAmount ?? ln.CompanyPay ?? 0);

                                              return (
                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                                                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.1 }}>
                                                    {`${tr('insurance.claimsPage.qtyLabel')}: ${ln.Qty} | ${tr('insurance.claimsPage.unitLabel')}: ${formatMoney(unit)} | ${tr('insurance.claimsPage.claimedLabel')}: ${formatMoney(claimed)} | ${tr('insurance.claimsPage.coverageLabel')}: ${Number.isFinite(coverage) ? coverage : 0}%`}
                                                  </Typography>
                                                  <Chip
                                                    size="small"
                                                    color="success"
                                                    variant="filled"
                                                    label={`${tr('insurance.claimsPage.coveredLabel')}: ${formatMoney(Number.isFinite(covered) ? covered : 0)}`}
                                                    sx={{
                                                      height: 22,
                                                      '& .MuiChip-label': { fontWeight: 900, fontSize: '0.75rem' },
                                                    }}
                                                  />
                                                </Stack>
                                              );
                                            })()}
                                          </Stack>
                                        }
                                      />
                                    </ListItemButton>
                                  </ListItem>
                                ))}
                              </List>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                {tr('insurance.claimsPage.noServicesAdded')}
                              </Typography>
                            )}
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          {tr('insurance.claimsPage.documentsSection')}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Button
                            component="label"
                            variant="contained"
                            startIcon={<UploadFileIcon />}
                            disabled={uploading}
                          >
                            {tr('insurance.claimsPage.upload')}
                            <input
                              hidden
                              type="file"
                              onChange={async (e) => {
                                const input = e.currentTarget;
                                const f = input?.files?.[0];
                                // Clear immediately (avoids React event pooling/nulling issues after await)
                                if (input) input.value = '';
                                if (f) await uploadDoc(f);
                              }}
                            />
                          </Button>
                          {uploading ? (
                            <Typography variant="body2" color="text.secondary">
                              {tr('insurance.claimsPage.uploading')}
                            </Typography>
                          ) : null}
                        </Stack>

                        {detailsLoading ? (
                          <Typography variant="body2" color="text.secondary">
                            {tr('insurance.claimsPage.loading')}
                          </Typography>
                        ) : docs.length ? (
                          <List disablePadding sx={{ display: 'grid', gap: 1 }}>
                            {docs.map((d) => (
                              <ListItem
                                key={`${d.ClaimId}-${d.FileName}`}
                                disablePadding
                                component={Paper}
                                elevation={0}
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 1,
                                  overflow: 'hidden',
                                }}
                                secondaryAction={
                                  <Button
                                    size="small"
                                    startIcon={<DescriptionIcon />}
                                    onClick={() => openDoc(d.ClaimId, d.FileName)}
                                  >
                                    {tr('insurance.claimsPage.view')}
                                  </Button>
                                }
                              >
                                <ListItemButton sx={{ pr: 10, cursor: 'default' }}>
                                  <ListItemText
                                    primary={
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontWeight: 700,
                                          lineHeight: 1.2,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        {d.FileName}
                                      </Typography>
                                    }
                                    secondary={
                                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.1 }}>
                                        {tr('insurance.claimsPage.fileType')}: {d.FileType || '-'}
                                        {typeof d.Size === 'number'
                                          ? ` | ${tr('insurance.claimsPage.fileSize')}: ${new Intl.NumberFormat(isArabic ? 'ar-LY' : 'en-US').format(d.Size)} ${tr('insurance.claimsPage.bytes')}`
                                          : ''}
                                      </Typography>
                                    }
                                  />
                                </ListItemButton>
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {tr('insurance.claimsPage.noDocuments')}
                          </Typography>
                        )}
                      </Box>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {tr('insurance.claimsPage.selectClaimHint')}
                    </Typography>
                  )}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {tr('insurance.claimsPage.sidebarHint')}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
};

export default ClaimsPage;
