import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionIcon from '@mui/icons-material/Description';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

import { buildApiUrl } from '../../utils/api';
import InsuranceHeaderTitle from './InsuranceHeaderTitle';

type Claim = {
  ClaimId: number;
  ClaimNo: string;
  Ref_emp: string;
  EMP_CHILD?: string | null;
  ClaimDate: string;
  ClaimType: string;
  Status: string;
  TotalClaimed: number;
  TotalApproved: number;
  CompanyShare: number;
  EmployeeShare: number;
  Notes?: string | null;
  SubmissionDate?: string | null;
};

type ClaimLine = {
  ClaimLineId: number;
  ClaimId: number;
  ServiceId: number;
  Qty?: number | null;
  UnitPrice?: number | null;
  CoverageUsed?: number | null;
  ApprovedAmount?: number | null;
  CompanyPay?: number | null;
  EmployeePay?: number | null;
  LineStatus?: string | null;
  Notes?: string | null;
};

type ClaimDoc = {
  ClaimId: number;
  FileName: string;
  FileType?: string | null;
  Size?: number | null;
  ModifiedAt?: string | null;
};

type Service = {
  ServiceId: number;
  ServiceCode?: string | null;
  ServiceName?: string | null;
  ArabicName?: string | null;
};

type Employee = {
  Ref_emp?: string | null;
  date_naissance?: string | null;
  SEXE?: string | null;
  NAME?: string | null;
};

type Child = {
  ID_CHILD: number;
  DATE_NAISSANCE?: string | null;
  SEX?: string | null;
  NAME_CHILD?: string | null;
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

const DoctorReviewPage: React.FC<Props> = ({ onBack }) => {
  const { t: tr } = useTranslation();
  const claimsApi = useMemo(() => buildApiUrl('/medicalInsurance/claims'), []);
  const linesApi = useMemo(() => buildApiUrl('/medicalInsurance/claimLines'), []);
  const docsApi = useMemo(() => buildApiUrl('/medicalInsurance/claimDocuments'), []);
  const servicesApi = useMemo(() => buildApiUrl('/medicalInsurance/services'), []);
  const employeesApi = useMemo(() => buildApiUrl('/employees'), []);
  const childrenApi = useMemo(() => buildApiUrl('/children'), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingClaims, setPendingClaims] = useState<Claim[]>([]);
  const [selected, setSelected] = useState<Claim | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [lines, setLines] = useState<ClaimLine[]>([]);
  const [docs, setDocs] = useState<ClaimDoc[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [lineSavingId, setLineSavingId] = useState<number | null>(null);

  const [personLoading, setPersonLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [personBirthDate, setPersonBirthDate] = useState<string | null>(null);
  const [personSex, setPersonSex] = useState<string | null>(null);
  const [personAge, setPersonAge] = useState<number | null>(null);

  const [reqDocsOpen, setReqDocsOpen] = useState(false);
  const [reqDocsLine, setReqDocsLine] = useState<ClaimLine | null>(null);
  const [reqDocsText, setReqDocsText] = useState('');
  const [reqDocsError, setReqDocsError] = useState<string | null>(null);

  const [reviewDate, setReviewDate] = useState(todayIso());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const withAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const normalizeLineStatus = (status: string | null | undefined) => {
    const s = String(status || '').trim().toLowerCase();
    if (!s) return 'pending';
    if (s === 'approved' || s === 'accept' || s === 'accepted') return 'approved';
    if (s === 'rejected' || s === 'refused' || s === 'refuse' || s === 'reject') return 'rejected';
    if (
      s === 'needdocuments' ||
      s === 'need_documents' ||
      s === 'need-documents' ||
      s === 'need_docs' ||
      s === 'need-docs' ||
      s === 'requestdocuments' ||
      s === 'request_documents' ||
      s === 'request-documents' ||
      s === 'request_docs' ||
      s === 'request-docs' ||
      s === 'more-docs' ||
      s === 'more_docs'
    )
      return 'need_documents';
    if (s === 'submitted') return 'pending';
    return s;
  };

  const lineStatusLabel = (status: string | null | undefined) => {
    const s = normalizeLineStatus(status);
    if (s === 'approved') return tr('insurance.doctorReview.status.approved');
    if (s === 'rejected') return tr('insurance.doctorReview.status.rejected');
    if (s === 'need_documents') return tr('insurance.doctorReview.status.needDocs');
    if (s === 'pending') return tr('insurance.doctorReview.status.pending');
    return String(status || tr('insurance.doctorReview.status.pending'));
  };

  const statusChip = (status: string | null | undefined) => {
    const s = normalizeLineStatus(status);
    if (s === 'approved') {
      return (
        <Chip
          size="small"
          color="success"
          icon={<CheckIcon />}
          label={lineStatusLabel(s)}
          sx={{ fontWeight: 900 }}
        />
      );
    }
    if (s === 'rejected') {
      return <Chip size="small" color="error" icon={<CloseIcon />} label={lineStatusLabel(s)} sx={{ fontWeight: 900 }} />;
    }
    if (s === 'need_documents') {
      return <Chip size="small" color="info" icon={<UploadFileIcon />} label={lineStatusLabel(s)} sx={{ fontWeight: 900 }} />;
    }
    return <Chip size="small" color="warning" icon={<HourglassEmptyIcon />} label={lineStatusLabel(s)} sx={{ fontWeight: 900 }} />;
  };

  const normalizeClaimStatus = (status: string | null | undefined) => {
    const s = String(status || '').trim().toLowerCase();
    if (!s) return 'pending';
    if (s === 'approved' || s === 'accept' || s === 'accepted') return 'approved';
    if (s === 'rejected' || s === 'refused' || s === 'refuse' || s === 'reject') return 'rejected';
    if (
      s === 'needdocuments' ||
      s === 'need_documents' ||
      s === 'need-documents' ||
      s === 'need_docs' ||
      s === 'need-docs' ||
      s === 'requestdocuments' ||
      s === 'request_documents' ||
      s === 'request-documents' ||
      s === 'request_docs' ||
      s === 'request-docs' ||
      s === 'more-docs' ||
      s === 'more_docs'
    )
      return 'need_documents';
    if (s === 'pending' || s === 'submitted') return 'pending';
    return s;
  };

  const claimStatusLabel = (status: string | null | undefined) => {
    const s = normalizeClaimStatus(status);
    if (s === 'approved') return tr('insurance.doctorReview.claimStatus.accepted');
    if (s === 'rejected') return tr('insurance.doctorReview.claimStatus.refused');
    if (s === 'need_documents') return tr('insurance.doctorReview.claimStatus.needDocs');
    if (s === 'pending') return tr('insurance.doctorReview.claimStatus.pending');
    return String(status || tr('insurance.doctorReview.claimStatus.pending'));
  };

  const claimStatusChip = (status: string | null | undefined) => {
    const s = normalizeClaimStatus(status);
    const commonSx = { fontWeight: 900 } as const;

    if (s === 'approved') {
      return <Chip size="small" variant="outlined" color="success" icon={<CheckIcon />} label={claimStatusLabel(s)} sx={commonSx} />;
    }
    if (s === 'rejected') {
      return <Chip size="small" variant="outlined" color="error" icon={<CloseIcon />} label={claimStatusLabel(s)} sx={commonSx} />;
    }
    if (s === 'need_documents') {
      return <Chip size="small" variant="outlined" color="warning" icon={<UploadFileIcon />} label={claimStatusLabel(s)} sx={commonSx} />;
    }
    if (s === 'pending') {
      return <Chip size="small" variant="outlined" color="default" icon={<HourglassEmptyIcon />} label={claimStatusLabel(s)} sx={commonSx} />;
    }
    return <Chip size="small" variant="outlined" color="default" icon={<HourglassEmptyIcon />} label={claimStatusLabel(status)} sx={commonSx} />;
  };

  const formatMoney = (n: number) => {
    const v = Number(n ?? 0);
    if (!Number.isFinite(v)) return '0.00 LYD';
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v);
    return `${formatted} LYD`;
  };

  const toNumber = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const calculateAgeYears = (birthStr: string | null | undefined): number | null => {
    if (!birthStr) return null;
    const birthDate = new Date(birthStr as string);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return Number.isFinite(age) ? age : null;
  };

  const loadPersonInfo = async (claim: Claim) => {
    const headers = withAuth();
    if (!headers) return;

    const ref = String(claim.Ref_emp || '').trim();
    if (!ref) {
      setEmployeeName(null);
      setPersonBirthDate(null);
      setPersonSex(null);
      setPersonAge(null);
      return;
    }

    setPersonLoading(true);
    try {
      const empResp = await axios.get<Employee>(`${employeesApi}/ref/${encodeURIComponent(ref)}`, { headers });
      const emp = empResp.data || {};

      const childIdRaw = claim.EMP_CHILD;
      const childId = childIdRaw === null || childIdRaw === undefined ? null : String(childIdRaw).trim();

      if (!childId || childId.toUpperCase() === 'NULL' || childId.toLowerCase() === 'null') {
        setEmployeeName(emp.NAME ?? null);
        const bd = emp.date_naissance ?? null;
        const sex = emp.SEXE ?? null;
        setPersonBirthDate(bd);
        setPersonSex(sex);
        setPersonAge(calculateAgeYears(bd));
        return;
      }

      // In this system, children endpoint uses Ref_emp and returns all children for that employee.
      const childrenResp = await axios.get<Child[]>(`${childrenApi}/employee/${encodeURIComponent(ref)}`, { headers });
      const list = childrenResp.data || [];
      const wantedId = Number(childId);
      const child = list.find((c) => Number(c.ID_CHILD) === wantedId) || null;

      setEmployeeName((child?.NAME_CHILD ?? emp.NAME) ?? null);

      const bd = child?.DATE_NAISSANCE ?? emp.date_naissance ?? null;
      const sex = child?.SEX ?? emp.SEXE ?? null;
      setPersonBirthDate(bd);
      setPersonSex(sex);
      setPersonAge(calculateAgeYears(bd));
    } catch (e) {
      // non-fatal
      setEmployeeName(null);
      setPersonBirthDate(null);
      setPersonSex(null);
      setPersonAge(null);
    } finally {
      setPersonLoading(false);
    }
  };

  const totals = useMemo(() => {
    if (!selected) {
      return {
        totalClaimed: 0,
        totalApproved: 0,
        companyShare: 0,
        employeeShare: 0,
      };
    }

    // Pending claim headers often have 0 totals until the claim is reviewed.
    // Prefer computing totals from loaded claim lines.
    if (!lines.length) {
      return {
        totalClaimed: toNumber(selected.TotalClaimed),
        totalApproved: toNumber(selected.TotalApproved),
        companyShare: toNumber(selected.CompanyShare),
        employeeShare: toNumber(selected.EmployeeShare),
      };
    }

    let totalClaimed = 0;
    let totalApproved = 0;
    let companyShare = 0;
    let employeeShare = 0;

    for (const ln of lines) {
      const qty = toNumber(ln.Qty);
      const unitPrice = toNumber(ln.UnitPrice);
      totalClaimed += qty * unitPrice;

      const status = normalizeLineStatus(ln.LineStatus);
      if (status === 'approved') {
        const companyPay = toNumber(ln.CompanyPay ?? ln.ApprovedAmount);
        const employeePay = toNumber(ln.EmployeePay);
        totalApproved += companyPay;
        companyShare += companyPay;
        employeeShare += employeePay;
      }
    }

    const round2 = (v: number) => Math.round(v * 100) / 100;
    return {
      totalClaimed: round2(totalClaimed),
      totalApproved: round2(totalApproved),
      companyShare: round2(companyShare),
      employeeShare: round2(employeeShare),
    };
  }, [selected, lines]);

  const serviceNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of services) {
      map.set(Number(s.ServiceId), String((s.ArabicName || s.ServiceName) ?? s.ServiceCode ?? s.ServiceId));
    }
    return map;
  }, [services]);

  const loadServices = async () => {
    const headers = withAuth();
    if (!headers) return;
    try {
      const resp = await axios.get<Service[]>(`${servicesApi}/all`, { headers });
      setServices(resp.data || []);
    } catch (e) {
      // non-fatal; we can still display ServiceId
      console.warn('Load services error', e);
      setServices([]);
    }
  };

  const loadDetails = async (claim: Claim) => {
    const headers = withAuth();
    if (!headers) {
      setError(tr('insurance.recharge.notLoggedIn'));
      return;
    }

    setDetailsLoading(true);
    setError(null);
    try {
      const [linesResp, docsResp] = await Promise.all([
        axios.get<ClaimLine[]>(`${linesApi}/all?ClaimId=${encodeURIComponent(String(claim.ClaimId))}`, { headers }),
        axios.get<ClaimDoc[]>(`${docsApi}/all?ClaimId=${encodeURIComponent(String(claim.ClaimId))}`, { headers }),
      ]);
      setLines(linesResp.data || []);
      setDocs(docsResp.data || []);
    } catch (e: any) {
      console.error('Load doctor review details error', e);
      setError(e.response?.data?.message || tr('insurance.doctorReview.failedLoadClaimDetails'));
      setLines([]);
      setDocs([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateLineStatus = async (line: ClaimLine, next: 'Approved' | 'Rejected' | 'NeedDocuments', nextNotes?: string) => {
    const headers = withAuth();
    if (!headers) {
      setError(tr('insurance.recharge.notLoggedIn'));
      return;
    }

    setLineSavingId(line.ClaimLineId);
    setError(null);
    try {
      await axios.put(
        `${linesApi}/Update/${encodeURIComponent(String(line.ClaimLineId))}`,
        {
          ClaimId: line.ClaimId,
          ServiceId: line.ServiceId,
          Qty: line.Qty,
          UnitPrice: line.UnitPrice,
          CoverageUsed: line.CoverageUsed,
          ApprovedAmount: line.ApprovedAmount,
          CompanyPay: line.CompanyPay,
          EmployeePay: line.EmployeePay,
          LineStatus: next,
          Notes: nextNotes !== undefined ? nextNotes : line.Notes,
        },
        { headers }
      );

      setLines((prev) =>
        prev.map((x) =>
          x.ClaimLineId === line.ClaimLineId
            ? { ...x, LineStatus: next, Notes: nextNotes !== undefined ? nextNotes : x.Notes }
            : x
        )
      );
    } catch (e: any) {
      console.error('Update claim line status error', e);
      setError(e.response?.data?.message || tr('insurance.doctorReview.failedUpdateServiceStatus'));
    } finally {
      setLineSavingId(null);
    }
  };

  const requestDocsForLine = async (line: ClaimLine) => {
    const existing = String(line.Notes || '').trim();
    setReqDocsLine(line);
    setReqDocsText(existing);
    setReqDocsError(null);
    setReqDocsOpen(true);
  };

  const submitReqDocs = async () => {
    if (!reqDocsLine) return;
    const next = String(reqDocsText || '').trim();
    if (!next) {
      setReqDocsError(tr('insurance.doctorReview.reqDocsErrorRequired'));
      return;
    }

    setReqDocsError(null);
    setReqDocsOpen(false);
    const line = reqDocsLine;
    setReqDocsLine(null);
    await updateLineStatus(line, 'NeedDocuments', next);
  };

  const openDoc = async (claimId: number, fileName: string) => {
    const headers = withAuth();
    if (!headers) {
      setError(tr('insurance.recharge.notLoggedIn'));
      return;
    }
    const token = String(headers.Authorization).replace('Bearer ', '');
    const url = `${docsApi}/content?ClaimId=${encodeURIComponent(String(claimId))}&FileName=${encodeURIComponent(String(fileName))}`;
    try {
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (e) {
      console.error('Open document error', e);
      setError(tr('insurance.doctorReview.failedOpenDocument'));
    }
  };

  const loadPending = async () => {
    const headers = withAuth();
    if (!headers) {
      setError(tr('insurance.recharge.notLoggedIn'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const resp = await axios.get<Claim[]>(`${claimsApi}/pending`, { headers });
      const rows = resp.data || [];
      setPendingClaims(rows);
      setSelected((prev) => {
        if (!rows.length) return null;
        if (prev && rows.some((r) => r.ClaimId === prev.ClaimId)) return prev;
        return rows[0];
      });
    } catch (e) {
      console.error('Load pending claims error', e);
      setError(tr('insurance.doctorReview.failedLoadPendingClaims'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadServices().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // reset inputs when selection changes
    setNotes('');
    setReviewDate(todayIso());
    if (selected) loadDetails(selected).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.ClaimId]);

  useEffect(() => {
    if (!selected) {
      setEmployeeName(null);
      setPersonBirthDate(null);
      setPersonSex(null);
      setPersonAge(null);
      return;
    }
    loadPersonInfo(selected).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.ClaimId]);

  const submitReview = async (action: 'approve' | 'reject' | 'need_docs') => {
    const headers = withAuth();
    if (!headers) {
      setError(tr('insurance.recharge.notLoggedIn'));
      return;
    }
    if (!selected) return;

    if (action === 'need_docs') {
      if (!String(notes || '').trim()) {
        setError(tr('insurance.doctorReview.errorNeedDocsNotes'));
        return;
      }
    }

    if (action === 'approve') {
      const undecided = lines.filter((ln) => {
        const s = normalizeLineStatus(ln.LineStatus);
        return s !== 'approved' && s !== 'rejected';
      });
      if (undecided.length) {
        setError(tr('insurance.doctorReview.errorDecideAllServices'));
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      await axios.post(
        `${claimsApi}/review/${encodeURIComponent(String(selected.ClaimId))}`,
        {
          action,
          Notes: notes,
          ReviewDate: reviewDate,
        },
        { headers }
      );

      setPendingClaims((prev) => prev.filter((c) => c.ClaimId !== selected.ClaimId));
      setSelected(null);
    } catch (e: any) {
      console.error('Review claim error', e);
      setError(e.response?.data?.message || tr('insurance.doctorReview.failedSubmitReview'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box p={2}>
      <Dialog
        open={reqDocsOpen}
        onClose={() => {
          setReqDocsOpen(false);
          setReqDocsLine(null);
          setReqDocsError(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{tr('insurance.doctorReview.reqDocsTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={tr('insurance.doctorReview.reqDocsLabel')}
            fullWidth
            multiline
            minRows={3}
            value={reqDocsText}
            onChange={(e) => {
              setReqDocsText(e.target.value);
              if (reqDocsError) setReqDocsError(null);
            }}
            error={Boolean(reqDocsError)}
            helperText={reqDocsError || tr('insurance.doctorReview.reqDocsHelper')}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setReqDocsOpen(false);
              setReqDocsLine(null);
              setReqDocsError(null);
            }}
          >
            {tr('common.cancel')}
          </Button>
          <Button variant="contained" onClick={submitReqDocs}>
            {tr('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Stack direction="row" spacing={2} alignItems="stretch">
        <Card elevation={3} sx={{ width: 420, flexShrink: 0 }}>
          <CardHeader
            title={<InsuranceHeaderTitle title={tr('insurance.doctorReview.pageTitle')} />}
            action={
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton aria-label={tr('common.refresh')} onClick={() => loadPending()} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => (onBack ? onBack() : window.history.back())}
                  sx={{ textTransform: 'none' }}
                >
                  {tr('common.back')}
                </Button>
              </Stack>
            }
          />
          <CardContent>
            {error ? (
              <Alert severity="error" sx={{ mb: 1 }}>
                {error}
              </Alert>
            ) : null}

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {tr('insurance.doctorReview.pendingClaims')}
            </Typography>

            {loading ? (
              <Typography variant="body2" color="text.secondary">
                {tr('insurance.doctorReview.loading')}
              </Typography>
            ) : pendingClaims.length ? (
              <List disablePadding sx={{ display: 'grid', gap: 1 }}>
                {pendingClaims.map((c) => {
                  const isSelected = selected?.ClaimId === c.ClaimId;
                  return (
                    <ListItem key={c.ClaimId} disablePadding>
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => setSelected(c)}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                        }}
                      >
                        <ListItemText
                          primary={tr('insurance.doctorReview.listItemPrimary', {
                            claimNo: c.ClaimNo,
                            empNo: c.Ref_emp,
                          })}
                          secondary={tr('insurance.doctorReview.listItemSecondary', {
                            date: String(c.ClaimDate).slice(0, 10),
                            type: c.ClaimType,
                          })}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {tr('insurance.doctorReview.noPendingClaims')}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card elevation={3}>
            <CardHeader title={<InsuranceHeaderTitle title={tr('insurance.doctorReview.reviewDetails')} />} />
            <CardContent>
              {selected ? (
                <Stack spacing={2}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                      <Stack direction="row" spacing={2} alignItems="baseline" flexWrap="wrap" useFlexGap>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          {selected.ClaimNo}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tr('insurance.doctorReview.employeeNumber', { empNo: selected.Ref_emp })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tr('insurance.doctorReview.patientName', { name: employeeName || '-' })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tr('insurance.doctorReview.claimDate', { date: String(selected.ClaimDate).slice(0, 10) })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tr('insurance.doctorReview.birthDate', {
                            date: personBirthDate ? String(personBirthDate).slice(0, 10) : '-',
                          })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tr('insurance.doctorReview.sex', { sex: personSex ? String(personSex) : '-' })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tr('insurance.doctorReview.age', {
                            age: personAge === null ? '-' : String(personAge),
                            years: personAge === null ? '' : tr('insurance.doctorReview.yearsShort'),
                          })}
                          {personLoading ? ` ${tr('insurance.doctorReview.loadingInline')}` : ''}
                        </Typography>
                      </Stack>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                        {claimStatusChip(selected.Status)}
                      </Box>
                    </Stack>
                  </Box>

                  <Divider />

                  <Stack direction="row" spacing={2} alignItems="baseline" flexWrap="wrap" useFlexGap>
                    <Typography variant="body2">
                      {tr('insurance.doctorReview.totals.totalClaimed', { amount: formatMoney(totals.totalClaimed) })}
                    </Typography>
                    <Typography variant="body2">
                      {tr('insurance.doctorReview.totals.totalApproved', { amount: formatMoney(totals.totalApproved) })}
                    </Typography>
                    <Typography variant="body2">
                      {tr('insurance.doctorReview.totals.companyShare', { amount: formatMoney(totals.companyShare) })}
                    </Typography>
                    <Typography variant="body2">
                      {tr('insurance.doctorReview.totals.employeeShare', { amount: formatMoney(totals.employeeShare) })}
                    </Typography>
                  </Stack>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {tr('insurance.doctorReview.servicesHeader')}
                    </Typography>

                    {detailsLoading ? (
                      <Typography variant="body2" color="text.secondary">
                        {tr('insurance.doctorReview.loading')}
                      </Typography>
                    ) : lines.length ? (
                      <List disablePadding sx={{ display: 'grid', gap: 1 }}>
                        {lines.map((ln) => {
                          const qty = Number(ln.Qty ?? 0);
                          const unit = Number(ln.UnitPrice ?? 0);
                          const claimed = (Number.isFinite(qty) ? qty : 0) * (Number.isFinite(unit) ? unit : 0);
                          const coverage = Number(ln.CoverageUsed ?? 0);
                          const company = Number(ln.CompanyPay ?? ln.ApprovedAmount ?? 0);
                          const employee = Number(ln.EmployeePay ?? 0);
                          const s = normalizeLineStatus(ln.LineStatus);
                          const isBusy = lineSavingId === ln.ClaimLineId;

                          return (
                            <ListItem
                              key={ln.ClaimLineId}
                              disablePadding
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                overflow: 'hidden',
                              }}
                              secondaryAction={
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ pr: 1 }}>
                                  <Button
                                    size="small"
                                    variant={s === 'approved' ? 'contained' : 'outlined'}
                                    color="success"
                                    startIcon={<CheckIcon />}
                                    disabled={isBusy}
                                    onClick={() => updateLineStatus(ln, 'Approved')}
                                    sx={{ textTransform: 'none' }}
                                  >
                                    {tr('insurance.doctorReview.approve')}
                                  </Button>
                                  <Button
                                    size="small"
                                    variant={s === 'need_documents' ? 'contained' : 'outlined'}
                                    color="warning"
                                    startIcon={<UploadFileIcon />}
                                    disabled={isBusy}
                                    onClick={() => requestDocsForLine(ln)}
                                    sx={{ textTransform: 'none' }}
                                  >
                                    {tr('insurance.doctorReview.needDocs')}
                                  </Button>
                                  <Button
                                    size="small"
                                    variant={s === 'rejected' ? 'contained' : 'outlined'}
                                    color="error"
                                    startIcon={<CloseIcon />}
                                    disabled={isBusy}
                                    onClick={() => updateLineStatus(ln, 'Rejected')}
                                    sx={{ textTransform: 'none' }}
                                  >
                                    {tr('insurance.doctorReview.refuse')}
                                  </Button>
                                </Stack>
                              }
                            >
                              <ListItemButton sx={{ cursor: 'default' }}>
                                <ListItemText
                                  primary={
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 800, maxWidth: 520, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {serviceNameById.get(Number(ln.ServiceId)) ||
                                          tr('insurance.doctorReview.serviceFallback', { id: ln.ServiceId })}
                                      </Typography>
                                      {statusChip(ln.LineStatus)}
                                      {isBusy ? (
                                        <Chip size="small" color="info" label={tr('insurance.doctorReview.saving')} sx={{ fontWeight: 900 }} />
                                      ) : null}
                                    </Stack>
                                  }
                                  secondary={
                                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                                      {tr('insurance.doctorReview.lineSummary', {
                                        qty: Number.isFinite(qty) ? qty : 0,
                                        unit: formatMoney(unit),
                                        claimed: formatMoney(claimed),
                                        coverage: Number.isFinite(coverage) ? coverage : 0,
                                        company: formatMoney(Number.isFinite(company) ? company : 0),
                                        employee: formatMoney(Number.isFinite(employee) ? employee : 0),
                                      })}
                                    </Typography>
                                  }
                                />
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {tr('insurance.doctorReview.noServices')}
                      </Typography>
                    )}
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {tr('insurance.doctorReview.uploadedDocuments')}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Chip
                        size="small"
                        color="default"
                        variant="outlined"
                        icon={<UploadFileIcon />}
                        label={tr('insurance.doctorReview.filesCount', { count: docs.length })}
                      />
                    </Stack>

                    {detailsLoading ? (
                      <Typography variant="body2" color="text.secondary">
                        {tr('insurance.doctorReview.loading')}
                      </Typography>
                    ) : docs.length ? (
                      <List disablePadding sx={{ display: 'grid', gap: 1 }}>
                        {docs.map((d) => (
                          <ListItem
                            key={`${d.ClaimId}-${d.FileName}`}
                            disablePadding
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
                                sx={{ textTransform: 'none', mr: 1 }}
                              >
                                {tr('insurance.doctorReview.view')}
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
                                    {tr('insurance.doctorReview.docType', { type: d.FileType || '-' })}
                                    {typeof d.Size === 'number'
                                      ? ` | ${tr('insurance.doctorReview.docSize', {
                                          size: new Intl.NumberFormat('en-US').format(d.Size),
                                          bytes: tr('insurance.doctorReview.bytes'),
                                        })}`
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
                        {tr('insurance.doctorReview.noDocuments')}
                      </Typography>
                    )}
                  </Box>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-start' }}>
                    <TextField
                      label={tr('insurance.doctorReview.reviewDate')}
                      type="date"
                      size="small"
                      value={reviewDate}
                      onChange={(e) => setReviewDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ width: 220 }}
                    />

                    <TextField
                      label={tr('insurance.doctorReview.doctorNotes')}
                      size="small"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      multiline
                      minRows={3}
                      fullWidth
                    />
                  </Stack>

                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<UploadFileIcon />}
                      sx={{ textTransform: 'none' }}
                      onClick={() => submitReview('need_docs')}
                      disabled={saving}
                    >
                      {tr('insurance.doctorReview.needMoreDocuments')}
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckIcon />}
                      sx={{ textTransform: 'none' }}
                      onClick={() => submitReview('approve')}
                      disabled={saving}
                    >
                      {tr('insurance.doctorReview.accept')}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<CloseIcon />}
                      sx={{ textTransform: 'none' }}
                      onClick={() => submitReview('reject')}
                      disabled={saving}
                    >
                      {tr('insurance.doctorReview.reject')}
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {tr('insurance.doctorReview.selectFromLeft')}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
};

export default DoctorReviewPage;
