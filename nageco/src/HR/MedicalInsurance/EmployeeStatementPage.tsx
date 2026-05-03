import React, { useMemo, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import { buildApiUrl } from '../../utils/api';
import InsuranceHeaderTitle from './InsuranceHeaderTitle';
import { useTranslation } from 'react-i18next';

type StatementRow = {
  TxnId: number;
  EffectiveDate: string;
  TxnDate: string;
  TxnType: string;
  Source: string;
  Amount: number;
  Notes?: string | null;
  CounterpartyRef_emp?: string | null;
  TransferId?: number | null;
  ClaimId?: number | null;
  ClaimLineId?: number | null;
  ClaimNo?: string | null;
  ServiceId?: number | null;
  ServiceName?: string | null;
  runningBalance: number;
};

type StatementResp = {
  Ref_emp: string;
  from?: string | null;
  to?: string | null;
  openingBalance: number;
  rows: StatementRow[];
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

const EmployeeStatementPage: React.FC<Props> = ({ onBack }) => {
  const { t } = useTranslation();
  const balancesApi = useMemo(() => buildApiUrl('/medicalInsurance/balances'), []);
  const [refEmp, setRefEmp] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(todayIso());
  const [resp, setResp] = useState<StatementResp | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isPrintingStatement, setIsPrintingStatement] = useState(false);

  const money = (n: number | null | undefined) => {
    const v = typeof n === 'number' ? n : n !== null && n !== undefined ? Number(n) : NaN;
    if (!Number.isFinite(v)) return '0.00 LYD';
    return `${v.toFixed(2)} LYD`;
  };

  const withAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const fetchStatement = async () => {
    const headers = withAuth();
    if (!headers) {
      setMessage(t('insurance.statement.notLoggedIn'));
      return;
    }

    const ref = refEmp.trim();
    if (!ref) {
      setMessage(t('insurance.statement.enterEmployeeNo'));
      return;
    }

    setBusy(true);
    setMessage(null);
    setResp(null);
    try {
      const r = await axios.get<StatementResp>(`${balancesApi}/statement`, {
        headers,
        params: {
          Ref_emp: ref,
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        },
      });
      setResp(r.data);
    } catch (e: any) {
      console.error(e);
      setMessage(e?.response?.data?.message || t('insurance.statement.failedLoad'));
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = () => {
    if (!resp) return;
    setIsPrintingStatement(true);
  };

  React.useEffect(() => {
    if (!isPrintingStatement || !resp) return;

    const bodyClass = 'printing-employee-statement';
    document.body.classList.add(bodyClass);

    let cleaned = false;
    let fallbackTimer = 0;

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove(bodyClass);
      setIsPrintingStatement(false);
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
  }, [isPrintingStatement, resp]);

  return (
    <Box p={2}>
      <style>
        {`
          @media print {
            body.printing-employee-statement * { visibility: hidden; }
            body.printing-employee-statement #statement-print,
            body.printing-employee-statement #statement-print * { visibility: visible; }
            body.printing-employee-statement #statement-print {
              position: absolute !important;
              left: 0 !important;
              right: 0 !important;
              top: 0 !important;
              width: 100% !important;
              opacity: 1 !important;
              display: block !important;
              transform: none !important;
            }
          }
        `}
      </style>

      <Card elevation={3}>
        <CardHeader
          title={<InsuranceHeaderTitle title={t('insurance.statement.pageTitle')} />}
          action={
            <Stack direction="row" spacing={1}>
              {onBack && (
                <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
                  {t('common.back')}
                </Button>
              )}
              <Button startIcon={<PrintIcon />} onClick={handlePrint} disabled={!resp}>
                {t('insurance.statement.print')}
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

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label={t('insurance.statement.employeeNo')}
                value={refEmp}
                onChange={(e) => setRefEmp(e.target.value)}
                size="small"
                fullWidth
              />
              <TextField
                label={t('insurance.statement.fromOptional')}
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label={t('insurance.statement.to')}
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <Button variant="contained" startIcon={<SearchIcon />} onClick={fetchStatement} disabled={busy}>
                {t('insurance.statement.load')}
              </Button>
            </Stack>

            {resp && (
              <Box id="statement-print">
                <Typography variant="h6">
                  {t('insurance.statement.statement')}: {resp.Ref_emp}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('insurance.statement.openingBalance')}: {money(resp.openingBalance)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('insurance.statement.rows')}: {resp.rows?.length || 0}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('insurance.statement.cols.date')}</TableCell>
                      <TableCell>{t('insurance.statement.cols.type')}</TableCell>
                      <TableCell>{t('insurance.statement.cols.source')}</TableCell>
                      <TableCell align="right">{t('insurance.statement.cols.amount')}</TableCell>
                      <TableCell align="right">{t('insurance.statement.cols.running')}</TableCell>
                      <TableCell>{t('insurance.statement.cols.details')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(resp.rows || []).map((r) => {
                      const details =
                        r.Source === 'CLAIM_LINE'
                          ? t('insurance.statement.details.claimLine', {
                              claim: r.ClaimNo || r.ClaimId || '',
                              service: r.ServiceName || r.ServiceId || '',
                            })
                          : r.Source === 'TRANSFER'
                            ? t('insurance.statement.details.transfer', {
                                transferId: r.TransferId || '',
                                with: r.CounterpartyRef_emp || '',
                              })
                            : r.Notes || '';

                      return (
                        <TableRow key={r.TxnId}>
                          <TableCell>{r.EffectiveDate}</TableCell>
                          <TableCell>{r.TxnType}</TableCell>
                          <TableCell>{r.Source}</TableCell>
                          <TableCell align="right">{money(r.Amount)}</TableCell>
                          <TableCell align="right">{money(r.runningBalance)}</TableCell>
                          <TableCell>{details}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeeStatementPage;
