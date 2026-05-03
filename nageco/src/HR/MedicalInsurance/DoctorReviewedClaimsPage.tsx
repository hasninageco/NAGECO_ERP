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
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionIcon from '@mui/icons-material/Description';

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

type Props = {
  onBack?: () => void;
};

const DoctorReviewedClaimsPage: React.FC<Props> = ({ onBack }) => {
  const { t: tr } = useTranslation();
  const claimsApi = useMemo(() => buildApiUrl('/medicalInsurance/claims'), []);
  const linesApi = useMemo(() => buildApiUrl('/medicalInsurance/claimLines'), []);
  const docsApi = useMemo(() => buildApiUrl('/medicalInsurance/claimDocuments'), []);
  const servicesApi = useMemo(() => buildApiUrl('/medicalInsurance/services'), []);
  const employeesApi = useMemo(() => buildApiUrl('/employees'), []);
  const childrenApi = useMemo(() => buildApiUrl('/children'), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refEmpFilter, setRefEmpFilter] = useState('');

  const [claims, setClaims] = useState<Claim[]>([]);
  const [selected, setSelected] = useState<Claim | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [lines, setLines] = useState<ClaimLine[]>([]);
  const [docs, setDocs] = useState<ClaimDoc[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [personLoading, setPersonLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [personBirthDate, setPersonBirthDate] = useState<string | null>(null);
  const [personSex, setPersonSex] = useState<string | null>(null);
  const [personAge, setPersonAge] = useState<number | null>(null);

  const withAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
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
      setEmployeeName(null);
      setPersonBirthDate(null);
      setPersonSex(null);
      setPersonAge(null);
    } finally {
      setPersonLoading(false);
    }
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

  const statusLabel = (status: string | null | undefined) => {
    const s = normalizeLineStatus(status);
    if (s === 'approved') return tr('insurance.doctorReviewed.status.approved');
    if (s === 'rejected') return tr('insurance.doctorReviewed.status.rejected');
    if (s === 'need_documents') return tr('insurance.doctorReviewed.status.needDocs');
    return tr('insurance.doctorReviewed.status.pending');
  };

  const statusChip = (status: string | null | undefined) => {
    const s = normalizeLineStatus(status);
    if (s === 'approved') return <Chip size="small" color="success" label={statusLabel(s)} sx={{ fontWeight: 900 }} />;
    if (s === 'rejected') return <Chip size="small" color="error" label={statusLabel(s)} sx={{ fontWeight: 900 }} />;
    if (s === 'need_documents') return <Chip size="small" color="info" label={statusLabel(s)} sx={{ fontWeight: 900 }} />;
    return <Chip size="small" color="warning" label={statusLabel(s)} sx={{ fontWeight: 900 }} />;
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

  const serviceNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of services) {
      map.set(Number(s.ServiceId), String((s.ArabicName || s.ServiceName) ?? s.ServiceCode ?? s.ServiceId));
    }
    return map;
  }, [services]);

  const totals = useMemo(() => {
    if (!selected) {
      return { totalClaimed: 0, totalApproved: 0, companyShare: 0, employeeShare: 0 };
    }

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
      totalClaimed += toNumber(ln.Qty) * toNumber(ln.UnitPrice);
      const s = normalizeLineStatus(ln.LineStatus);
      if (s === 'approved') {
        const company = toNumber(ln.CompanyPay ?? ln.ApprovedAmount);
        const employee = toNumber(ln.EmployeePay);
        totalApproved += company;
        companyShare += company;
        employeeShare += employee;
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

  const loadServices = async () => {
    const headers = withAuth();
    if (!headers) return;
    try {
      const resp = await axios.get<Service[]>(`${servicesApi}/all`, { headers });
      setServices(resp.data || []);
    } catch (e) {
      console.warn('Load services error', e);
      setServices([]);
    }
  };

  const loadReviewedClaims = async (overrideRefEmp?: string) => {
    const headers = withAuth();
    if (!headers) {
      setError(tr('insurance.recharge.notLoggedIn'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const effectiveRefEmp = String(overrideRefEmp ?? refEmpFilter).trim();
      const query = effectiveRefEmp ? `?Ref_emp=${encodeURIComponent(effectiveRefEmp)}` : '';
      const resp = await axios.get<Claim[]>(`${claimsApi}/all${query}`, { headers });
      const claimDateRank = (claim: Claim) => {
        const reviewedTs = Date.parse(String(claim.SubmissionDate || ''));
        if (!Number.isNaN(reviewedTs)) return reviewedTs;
        const claimTs = Date.parse(String(claim.ClaimDate || ''));
        if (!Number.isNaN(claimTs)) return claimTs;
        return 0;
      };
      const rows = (resp.data || []).filter((c) => {
        const s = String(c.Status || '').trim().toLowerCase();
        return s === 'approved' || s === 'rejected' || s === 'needdocuments';
      }).sort((a, b) => {
        const byDate = claimDateRank(b) - claimDateRank(a);
        if (byDate !== 0) return byDate;
        return Number(b.ClaimId || 0) - Number(a.ClaimId || 0);
      });
      setClaims(rows);
      setSelected((prev) => {
        if (!rows.length) return null;
        if (prev && rows.some((r) => r.ClaimId === prev.ClaimId)) return prev;
        return rows[0];
      });
    } catch (e: any) {
      console.error('Load reviewed claims error', e);
      setError(e.response?.data?.message || tr('insurance.doctorReviewed.failedLoadReviewedClaims'));
      setClaims([]);
      setSelected(null);
    } finally {
      setLoading(false);
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
      console.error('Load reviewed claim details error', e);
      setError(e.response?.data?.message || tr('insurance.doctorReviewed.failedLoadClaimDetails'));
      setLines([]);
      setDocs([]);
    } finally {
      setDetailsLoading(false);
    }
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
      setError(tr('insurance.doctorReviewed.failedOpenDocument'));
    }
  };

  useEffect(() => {
    loadReviewedClaims().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadServices().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
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

  return (
    <Box p={2}>
      <Stack direction="row" spacing={2} alignItems="stretch">
        <Card elevation={3} sx={{ width: 420, flexShrink: 0 }}>
          <CardHeader
            title={<InsuranceHeaderTitle title={tr('insurance.doctorReviewed.pageTitle')} />}
            action={
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton aria-label={tr('common.refresh')} onClick={() => loadReviewedClaims()} disabled={loading}>
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
              {tr('insurance.doctorReviewed.reviewedClaims')}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1.5 }}>
              <TextField
                size="small"
                fullWidth
                label={tr('insurance.doctorReviewed.refEmpFilterLabel')}
                placeholder={tr('insurance.doctorReviewed.refEmpFilterPlaceholder')}
                value={refEmpFilter}
                onChange={(e) => setRefEmpFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    loadReviewedClaims().catch(() => undefined);
                  }
                }}
              />
              <Button
                variant="outlined"
                onClick={() => loadReviewedClaims().catch(() => undefined)}
                disabled={loading}
                sx={{ textTransform: 'none', minWidth: 120 }}
              >
                {tr('common.search')}
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  setRefEmpFilter('');
                  loadReviewedClaims('').catch(() => undefined);
                }}
                disabled={loading || !refEmpFilter.trim()}
                sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
              >
                {tr('insurance.doctorReviewed.clearFilter')}
              </Button>
            </Stack>

            {loading ? (
              <Typography variant="body2" color="text.secondary">
                {tr('insurance.doctorReviewed.loading')}
              </Typography>
            ) : claims.length ? (
              <List disablePadding sx={{ display: 'grid', gap: 1 }}>
                {claims.map((c) => {
                  const isSelected = selected?.ClaimId === c.ClaimId;
                  const status = statusLabel(c.Status);
                  const reviewedAt = c.SubmissionDate ? String(c.SubmissionDate).slice(0, 10) : '-';
                  return (
                    <ListItem key={c.ClaimId} disablePadding>
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => setSelected(c)}
                        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                      >
                        <ListItemText
                          primary={tr('insurance.doctorReviewed.listItemPrimary', {
                            claimNo: c.ClaimNo,
                            empNo: c.Ref_emp,
                          })}
                          secondary={tr('insurance.doctorReviewed.listItemSecondary', {
                            status,
                            reviewedAt,
                          })}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {tr('insurance.doctorReviewed.noReviewedClaims')}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card elevation={3}>
            <CardHeader title={<InsuranceHeaderTitle title={tr('insurance.doctorReviewed.fullDetails')} />} />
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
                          {tr('insurance.doctorReviewed.employeeNumberClaimDate', {
                            empNo: selected.Ref_emp,
                            claimDate: String(selected.ClaimDate).slice(0, 10),
                          })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tr('insurance.doctorReviewed.patientName', { name: employeeName || '-' })}
                          {personLoading ? ` ${tr('insurance.doctorReviewed.loadingInline')}` : ''}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tr('insurance.doctorReviewed.birthSexAge', {
                            birthDate: personBirthDate ? String(personBirthDate).slice(0, 10) : '-',
                            sex: personSex ? String(personSex) : '-',
                            age: personAge === null ? '-' : String(personAge),
                            years: personAge === null ? '' : tr('insurance.doctorReviewed.yearsShort'),
                          })}
                          {personLoading ? ` ${tr('insurance.doctorReviewed.loadingInline')}` : ''}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tr('insurance.doctorReviewed.reviewedAt', {
                            reviewedAt: selected.SubmissionDate ? String(selected.SubmissionDate).slice(0, 10) : '-',
                          })}
                        </Typography>
                      </Stack>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                        {(() => {
                          const s = normalizeLineStatus(selected.Status);
                          const color =
                            s === 'approved' ? 'success' : s === 'rejected' ? 'error' : s === 'need_documents' ? 'info' : 'warning';
                          const label = statusLabel(s);
                          return (
                            <Chip
                              size="small"
                              variant="outlined"
                              color={color}
                              label={label}
                              sx={{ fontWeight: 900, backgroundColor: 'transparent' }}
                            />
                          );
                        })()}
                      </Box>
                    </Stack>

                    {selected.Notes ? (
                      <Chip
                        size="small"
                        variant="outlined"
                        color="error"
                        label={tr('insurance.doctorReviewed.notes', { notes: selected.Notes })}
                        sx={{
                          mt: 1,
                          fontWeight: 800,
                          backgroundColor: 'transparent',
                          maxWidth: '100%',
                          height: 'auto',
                          '& .MuiChip-label': { whiteSpace: 'normal' },
                        }}
                      />
                    ) : null}
                  </Box>

                  <Divider />

                  <Stack direction="row" spacing={2} alignItems="baseline" flexWrap="wrap" useFlexGap>
                    <Typography variant="body2">
                      {tr('insurance.doctorReviewed.totals.totalClaimed', { amount: formatMoney(totals.totalClaimed) })}
                    </Typography>
                    <Typography variant="body2">
                      {tr('insurance.doctorReviewed.totals.totalApproved', { amount: formatMoney(totals.totalApproved) })}
                    </Typography>
                    <Typography variant="body2">
                      {tr('insurance.doctorReviewed.totals.companyShare', { amount: formatMoney(totals.companyShare) })}
                    </Typography>
                    <Typography variant="body2">
                      {tr('insurance.doctorReviewed.totals.employeeShare', { amount: formatMoney(totals.employeeShare) })}
                    </Typography>
                  </Stack>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {tr('insurance.doctorReviewed.services')}
                    </Typography>

                    {detailsLoading ? (
                      <Typography variant="body2" color="text.secondary">
                        {tr('insurance.doctorReviewed.loading')}
                      </Typography>
                    ) : lines.length ? (
                      <List disablePadding sx={{ display: 'grid', gap: 1 }}>
                        {lines.map((ln) => {
                          const qty = toNumber(ln.Qty);
                          const unit = toNumber(ln.UnitPrice);
                          const claimed = qty * unit;
                          const coverage = toNumber(ln.CoverageUsed);
                          const company = toNumber(ln.CompanyPay ?? ln.ApprovedAmount);
                          const employee = toNumber(ln.EmployeePay);

                          return (
                            <ListItem
                              key={ln.ClaimLineId}
                              disablePadding
                              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}
                            >
                              <ListItemButton sx={{ cursor: 'default' }}>
                                <ListItemText
                                  primary={
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                                      <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 800, maxWidth: 520, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                      >
                                        {serviceNameById.get(Number(ln.ServiceId)) ||
                                          tr('insurance.doctorReviewed.serviceFallback', { id: ln.ServiceId })}
                                      </Typography>
                                      {statusChip(ln.LineStatus)}
                                    </Stack>
                                  }
                                  secondary={
                                    <Box sx={{ display: 'grid', gap: 0.25 }}>
                                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                                        {tr('insurance.doctorReviewed.lineSummary', {
                                          qty,
                                          unit: formatMoney(unit),
                                          claimed: formatMoney(claimed),
                                          coverage,
                                          company: formatMoney(company),
                                          employee: formatMoney(employee),
                                        })}
                                      </Typography>
                                      {ln.Notes ? (
                                        <Chip
                                          size="small"
                                          variant="outlined"
                                          color="error"
                                          label={tr('insurance.doctorReviewed.notes', { notes: ln.Notes })}
                                          sx={{
                                            fontWeight: 800,
                                            backgroundColor: 'transparent',
                                            maxWidth: '100%',
                                            height: 'auto',
                                            '& .MuiChip-label': { whiteSpace: 'normal' },
                                          }}
                                        />
                                      ) : null}
                                    </Box>
                                  }
                                />
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {tr('insurance.doctorReviewed.noServices')}
                      </Typography>
                    )}
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {tr('insurance.doctorReviewed.uploadedDocuments')}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Chip
                        size="small"
                        color="default"
                        variant="outlined"
                        icon={<UploadFileIcon />}
                        label={tr('insurance.doctorReviewed.filesCount', { count: docs.length })}
                      />
                    </Stack>

                    {detailsLoading ? (
                      <Typography variant="body2" color="text.secondary">
                        {tr('insurance.doctorReviewed.loading')}
                      </Typography>
                    ) : docs.length ? (
                      <List disablePadding sx={{ display: 'grid', gap: 1 }}>
                        {docs.map((d) => (
                          <ListItem
                            key={`${d.ClaimId}-${d.FileName}`}
                            disablePadding
                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}
                            secondaryAction={
                              <Button
                                size="small"
                                startIcon={<DescriptionIcon />}
                                onClick={() => openDoc(d.ClaimId, d.FileName)}
                                sx={{ textTransform: 'none', mr: 1 }}
                              >
                                {tr('insurance.doctorReviewed.view')}
                              </Button>
                            }
                          >
                            <ListItemButton sx={{ pr: 10, cursor: 'default' }}>
                              <ListItemText
                                primary={
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                  >
                                    {d.FileName}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.1 }}>
                                    {tr('insurance.doctorReviewed.docType', { type: d.FileType || '-' })}
                                    {typeof d.Size === 'number'
                                      ? ` | ${tr('insurance.doctorReviewed.docSize', {
                                          size: new Intl.NumberFormat('en-US').format(d.Size),
                                          bytes: tr('insurance.doctorReviewed.bytes'),
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
                        {tr('insurance.doctorReviewed.noDocuments')}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {tr('insurance.doctorReviewed.selectFromLeft')}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
};

export default DoctorReviewedClaimsPage;
