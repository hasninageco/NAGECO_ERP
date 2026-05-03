import React, { useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import PaidIcon from '@mui/icons-material/Paid';
import PrintIcon from '@mui/icons-material/Print';
import { buildApiUrl } from '../../utils/api';
import InsuranceHeaderTitle from './InsuranceHeaderTitle';
import { useTranslation } from 'react-i18next';

type ApprovedLine = {
  ClaimLineId: number;
  ClaimId: number;
  ClaimNo: string;
  Ref_emp: string;
  EMP_CHILD?: string | null;
  PatientName?: string | null;
  ClaimDate: string;
  SubmissionDate?: string | null;
  ClaimType?: string | null;
  ClaimStatus?: string | null;

  PaymentId?: number | null;
  PaymentStatus?: string | null;
  PaidAt?: string | null;

  ServiceId: number;
  ServiceName?: string | null;
  ServiceArabicName?: string | null;

  Qty?: number | null;
  UnitPrice?: number | null;
  ClaimedAmount?: number | null;
  ApprovedAmount?: number | null;
  CompanyPay?: number | null;
  EmployeePay?: number | null;
  LineStatus?: string | null;

  ClaimNotes?: string | null;
  LineNotes?: string | null;
};

type Props = {
  onBack?: () => void;
};

type PaymentsReportRow = ApprovedLine;

type PaymentsReportData = {
  paidFilter: 'unpaid' | 'paid';
  month: number;
  year: number;
  rows: PaymentsReportRow[];
  totalCompany: number;
  totalEmployee: number;
  printedAt: string;
};

const money = (n: number | null | undefined) => {
  const v = typeof n === 'number' ? n : n !== null && n !== undefined ? Number(n) : NaN;
  if (!Number.isFinite(v)) return '0.00 LYD';
  return `${v.toFixed(2)} LYD`;
};

const FinanceTransferPage: React.FC<Props> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const financeApi = useMemo(() => buildApiUrl('/medicalInsurance/finance'), []);

  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  const [rows, setRows] = useState<ApprovedLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paidFilter, setPaidFilter] = useState<'unpaid' | 'paid'>('unpaid');

  const [reportToPrint, setReportToPrint] = useState<PaymentsReportData | null>(null);
  const [isPrintingReport, setIsPrintingReport] = useState(false);

  const withAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const load = useCallback(async () => {
    const headers = withAuth();
    if (!headers) {
      setMessage(t('insurance.financePayments.notLoggedIn'));
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const paid = paidFilter === 'paid' ? 1 : 0;
      const qs = new URLSearchParams();
      qs.set('paid', String(paid));
      if (Number.isFinite(month) && month >= 1 && month <= 12) qs.set('month', String(month));
      if (Number.isFinite(year) && year >= 1900) qs.set('year', String(year));
      const resp = await axios.get<ApprovedLine[]>(`${financeApi}/approvedLines?${qs.toString()}`, { headers });
      setRows(Array.isArray(resp.data) ? resp.data : []);
    } catch (e: any) {
      console.error(e);
      setMessage(e?.response?.data?.message || t('insurance.financePayments.failedLoadApproved'));
    } finally {
      setBusy(false);
    }
  }, [financeApi, paidFilter, month, year, t]);

  const fmtDate = (v: any) => {
    const s = v ? String(v) : '';
    if (!s) return '—';
    // Most server dates are ISO; show YYYY-MM-DD
    if (s.includes('T')) return s.slice(0, 10);
    return s.length >= 10 ? s.slice(0, 10) : s;
  };

  const markPaid = useCallback(
    async (claimLineId: number) => {
      const headers = withAuth();
      if (!headers) return;

      setBusy(true);
      setMessage(null);
      try {
        await axios.post(
          `${financeApi}/markPaid`,
          { ClaimLineId: claimLineId },
          { headers }
        );
        setRows((prev) => prev.filter((r) => r.ClaimLineId !== claimLineId));
      } catch (e: any) {
        console.error(e);
        setMessage(e?.response?.data?.message || t('insurance.financePayments.failedMarkPaid'));
      } finally {
        setBusy(false);
      }
    },
    [financeApi, t]
  );

  const markAllPaid = useCallback(async () => {
    const headers = withAuth();
    if (!headers) return;
    if (!rows.length) return;
    if (paidFilter !== 'unpaid') return;

    setBusy(true);
    setMessage(null);
    try {
      await axios.post(
        `${financeApi}/markPaid`,
        { ClaimLineIds: rows.map((r) => r.ClaimLineId) },
        { headers }
      );
      setRows([]);
      setMessage(t('insurance.financePayments.markedAllPaid'));
    } catch (e: any) {
      console.error(e);
      setMessage(e?.response?.data?.message || t('insurance.financePayments.failedMarkAllPaid'));
    } finally {
      setBusy(false);
    }
  }, [financeApi, paidFilter, rows, t]);

  const totalCompany = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.CompanyPay) || 0), 0),
    [rows]
  );
  const totalEmployee = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.EmployeePay) || 0), 0),
    [rows]
  );

  const printReport = () => {
    setReportToPrint({
      paidFilter,
      month,
      year,
      rows: [...rows],
      totalCompany,
      totalEmployee,
      printedAt: new Date().toISOString(),
    });
    setIsPrintingReport(true);
  };

  React.useEffect(() => {
    if (!isPrintingReport || !reportToPrint) return;

    const bodyClass = 'printing-finance-report';
    document.body.classList.add(bodyClass);

    let cleaned = false;
    let fallbackTimer = 0;

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove(bodyClass);
      setIsPrintingReport(false);
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
  }, [isPrintingReport, reportToPrint]);

  React.useEffect(() => {
    load();
  }, [load]);

  const subtitle =
    paidFilter === 'paid'
      ? t('insurance.financePayments.subtitlePaid')
      : t('insurance.financePayments.subtitleUnpaid');

  const monthLabel = (m: number) =>
    new Intl.DateTimeFormat(i18n.resolvedLanguage || i18n.language || 'en', { month: 'short' }).format(
      new Date(2000, Math.max(0, Math.min(11, (Number(m) || 1) - 1)), 1)
    );

  return (
    <Box p={2}>
      <style>
        {`
          @page {
            size: landscape;
            margin: 12mm;
          }
          @media print {
            body.printing-finance-report * { visibility: hidden; }
            body.printing-finance-report #finance-payments-report,
            body.printing-finance-report #finance-payments-report * { visibility: visible; }
            body.printing-finance-report #finance-payments-report {
              position: absolute !important;
              left: 0 !important;
              right: 0 !important;
              top: 0 !important;
              width: 100% !important;
              opacity: 1 !important;
              display: block !important;
              transform: none !important;
            }
            #finance-payments-report, #finance-payments-report * { color: #000 !important; }
            #finance-payments-report .MuiTypography-root { font-weight: 800 !important; }
            #finance-payments-report { font-size: 11px !important; }
            #finance-payments-report .MuiTableCell-root { font-size: 10.5px !important; padding: 4px 6px !important; }
            #finance-payments-report .MuiTypography-root { font-size: 11px !important; }
            #finance-payments-report .MuiTypography-h6 { font-size: 14px !important; }
            #finance-payments-report .MuiTypography-subtitle2 { font-size: 12px !important; }
            #finance-payments-report .MuiTypography-caption { font-size: 10px !important; }
            #finance-payments-report { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            #finance-payments-report { background: #fff !important; }
            #finance-payments-report * { background: transparent !important; }
          }
        `}
      </style>

      {reportToPrint ? (
        <Box
          id="finance-payments-report"
          sx={{
            position: 'fixed',
            left: isPrintingReport ? 0 : -10000,
            right: isPrintingReport ? 0 : 'auto',
            top: 0,
            width: isPrintingReport ? '100%' : 1200,
            p: 2,
            bgcolor: '#fff',
            opacity: isPrintingReport ? 1 : 0,
            pointerEvents: 'none',
            '& .MuiTypography-root': { color: '#000', fontWeight: 800 },
          }}
        >
          <Box sx={{ position: 'relative', mb: 1.5, minHeight: 105 }}>
            <Box sx={{ textAlign: 'left', pr: 34, pl: 2, pt: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                {t('insurance.financePayments.reportTitle')}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, lineHeight: 1.1 }} dir="rtl">
                {t('insurance.financePayments.reportTitleAr')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 900, mt: 0.5 }}>
                {reportToPrint.paidFilter === 'paid'
                  ? t('insurance.financePayments.filter.paid')
                  : t('insurance.financePayments.filter.unpaid')}{' '}
                — {String(reportToPrint.year)}-{String(reportToPrint.month).padStart(2, '0')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                {t('insurance.financePayments.printedAt')}: {new Date(reportToPrint.printedAt).toLocaleString()}
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
                top: '45%',
                transform: 'translateY(-55%)',
              }}
            />
          </Box>

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {t('insurance.financePayments.lines')}: {reportToPrint.rows.length}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {t('insurance.financePayments.totalCompanyPay')}: {money(reportToPrint.totalCompany)}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {t('insurance.financePayments.totalEmployeePay')}: {money(reportToPrint.totalEmployee)}
            </Typography>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <TableContainer sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table size="small" aria-label="Finance payments report">
              <TableHead>
                <TableRow>
                  <TableCell>{t('insurance.financePayments.cols.service')}</TableCell>
                  <TableCell>{t('insurance.financePayments.cols.arabic')}</TableCell>
                  <TableCell>{t('insurance.financePayments.cols.claimNo')}</TableCell>
                  <TableCell>{t('insurance.financePayments.cols.patient')}</TableCell>
                  <TableCell>{t('insurance.financePayments.cols.employeeNo')}</TableCell>
                  <TableCell>{t('insurance.financePayments.cols.claimDate')}</TableCell>
                  <TableCell>{t('insurance.financePayments.cols.paidDate')}</TableCell>
                  <TableCell align="right">{t('insurance.financePayments.cols.company')}</TableCell>
                  <TableCell align="right">{t('insurance.financePayments.cols.employee')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportToPrint.rows.map((r) => (
                  <TableRow key={r.ClaimLineId}>
                    <TableCell sx={{ fontWeight: 900 }}>{r.ServiceName || t('insurance.financePayments.fallbackService')}</TableCell>
                    <TableCell>{r.ServiceArabicName || ''}</TableCell>
                    <TableCell>{r.ClaimNo}</TableCell>
                    <TableCell>{r.PatientName || t('insurance.financePayments.dash')}</TableCell>
                    <TableCell>{r.Ref_emp}</TableCell>
                    <TableCell>{fmtDate(r.ClaimDate)}</TableCell>
                    <TableCell>{reportToPrint.paidFilter === 'paid' ? fmtDate(r.PaidAt) : ''}</TableCell>
                    <TableCell align="right">{money(r.CompanyPay)}</TableCell>
                    <TableCell align="right">{money(r.EmployeePay)}</TableCell>
                  </TableRow>
                ))}
                {!reportToPrint.rows.length ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography variant="body2" color="text.secondary">
                        {t('insurance.financePayments.noRows')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : null}

                {reportToPrint.rows.length ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ fontWeight: 900 }}>
                      {t('insurance.financePayments.totals')}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      {money(reportToPrint.totalCompany)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      {money(reportToPrint.totalEmployee)}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="baseline">
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {t('insurance.financePayments.totalCovered')}: {money(reportToPrint.totalCompany)}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 900 }} dir="rtl">
              إجمالي التغطية: {money(reportToPrint.totalCompany)}
            </Typography>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 2,
              mt: 1,
            }}
          >
            {[ 
              { en: 'Prepared by', ar: 'إعداد' },
              { en: 'Reviewed by', ar: 'مراجعة' },
              { en: 'Approved by', ar: 'اعتماد' },
              { en: 'Doctor approval', ar: 'اعتماد الطبيب' },
            ].map((s) => (
              <Box key={s.en} sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                  {s.en}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.1 }} dir="rtl">
                  {s.ar}
                </Typography>
                <Box sx={{ mt: 2, borderBottom: '1px solid #000', height: 18 }} />
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}

      <Card elevation={3}>
        <CardHeader
          title={<InsuranceHeaderTitle title={t('insurance.financePayments.pageTitle')} />}
          subheader={subtitle}
          action={
            <Stack direction="row" spacing={1}>
              {onBack && (
                <Button startIcon={<ArrowBackIcon />} onClick={onBack} disabled={busy}>
                  {t('common.back')}
                </Button>
              )}
              <TextField
                select
                size="small"
                label={t('insurance.financePayments.filter.label')}
                value={paidFilter}
                onChange={(e) => setPaidFilter(e.target.value as any)}
                disabled={busy}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="unpaid">{t('insurance.financePayments.filter.unpaid')}</MenuItem>
                <MenuItem value="paid">{t('insurance.financePayments.filter.paid')}</MenuItem>
              </TextField>

              <TextField
                select
                size="small"
                label={t('insurance.financePayments.month')}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                disabled={busy}
                sx={{ minWidth: 130 }}
              >
                {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                  <MenuItem key={m} value={m}>
                    {monthLabel(m)}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                type="number"
                label={t('insurance.financePayments.year')}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                disabled={busy}
                sx={{ width: 110 }}
              />

              <Button startIcon={<RefreshIcon />} onClick={load} disabled={busy}>
                {t('common.refresh')}
              </Button>

              <Button startIcon={<PrintIcon />} onClick={printReport} disabled={busy}>
                {t('insurance.financePayments.printReport')}
              </Button>
              <Button
                variant="contained"
                startIcon={<PaidIcon />}
                onClick={markAllPaid}
                disabled={busy || !rows.length || paidFilter !== 'unpaid'}
              >
                {t('insurance.financePayments.markAllPaid')}
              </Button>
            </Stack>
          }
        />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="body2" color={message ? 'error' : 'text.secondary'}>
              {message || ''}
            </Typography>

            <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {t('insurance.financePayments.lines')}: <b>{rows.length}</b>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('insurance.financePayments.totalCompanyPay')}: <b>{money(totalCompany)}</b>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('insurance.financePayments.totalEmployeePay')}: <b>{money(totalEmployee)}</b>
              </Typography>
            </Stack>

            <Divider />

            <Stack spacing={1}>
              {rows.map((r) => (
                <Box
                  key={r.ClaimLineId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    flexWrap: 'wrap',
                    p: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={2}
                    flexWrap="wrap"
                    alignItems="center"
                    sx={{ flex: '1 1 520px', minWidth: 280 }}
                  >
                    <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="baseline">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {r.ServiceName || t('insurance.financePayments.fallbackService')}
                      </Typography>
                      {!!(r.ServiceArabicName || '').trim() && (
                        <Typography variant="body2" color="text.secondary">
                          ({r.ServiceArabicName})
                        </Typography>
                      )}
                    </Stack>

                    {paidFilter === 'paid' && (
                      <Typography variant="body2" color="text.secondary">
                        {t('insurance.financePayments.paid')}: <b>{fmtDate(r.PaidAt)}</b>
                      </Typography>
                    )}

                    <Typography variant="body2" color="text.secondary">
                      {t('insurance.financePayments.claim')}: <b>{r.ClaimNo}</b>
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {t('insurance.financePayments.patient')}: <b>{r.PatientName || t('insurance.financePayments.dash')}</b>
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {t('insurance.financePayments.employeeNo')}: <b>{r.Ref_emp}</b>
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {t('insurance.financePayments.date')}: <b>{r.ClaimDate || t('insurance.financePayments.dash')}</b>
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {t('insurance.financePayments.company')}: <b>{money(r.CompanyPay)}</b>
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {t('insurance.financePayments.employee')}: <b>{money(r.EmployeePay)}</b>
                    </Typography>
                  </Stack>

                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PaidIcon />}
                    onClick={() => markPaid(r.ClaimLineId)}
                    disabled={busy || paidFilter !== 'unpaid'}
                    sx={{ flex: '0 0 auto' }}
                  >
                    {t('insurance.financePayments.markPaid')}
                  </Button>
                </Box>
              ))}

              {!rows.length && (
                <Typography variant="body2" color="text.secondary">
                  {t('insurance.financePayments.nonePending')}
                </Typography>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FinanceTransferPage;
