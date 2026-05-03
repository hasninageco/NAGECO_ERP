import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useTranslation } from 'react-i18next';
import { buildApiUrl } from '../../utils/api';
import InsuranceHeaderTitle from './InsuranceHeaderTitle';

type Employee = {
  ID_EMP: number;
  NAME: string;
  Ref_emp?: string | null;
};

type TransferResult = {
  transfer: {
    TransferId: number;
    FromRef_emp: string;
    ToRef_emp: string;
    Amount: number;
    EffectiveDate: string;
    Notes?: string | null;
    CreatedAt?: string;
  };
  balances?: {
    from: number;
    to: number;
  };
};

type TransferRow = {
  TransferId: number;
  FromRef_emp: string;
  FromName?: string | null;
  ToRef_emp: string;
  ToName?: string | null;
  Amount: number;
  EffectiveDate: string;
  Notes?: string | null;
  CreatedAt?: string | null;
};

type ReceiptData = {
  transfer: TransferResult['transfer'];
  fromName?: string;
  toName?: string;
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

const TransferBalancePage: React.FC<Props> = ({ onBack }) => {
  const { t: tr, i18n } = useTranslation();
  const isArabic = i18n.language?.toLowerCase().startsWith('ar');

  const balancesApi = useMemo(() => buildApiUrl('/medicalInsurance/balances'), []);
  const employeesApi = useMemo(() => buildApiUrl('/employees'), []);

  const money = (value: unknown) => `${Number(value || 0).toFixed(2)} LYD`;

  const [fromRef, setFromRef] = useState('');
  const [toRef, setToRef] = useState('');
  const [fromEmp, setFromEmp] = useState<Employee | null>(null);
  const [toEmp, setToEmp] = useState<Employee | null>(null);

  const [effectiveDate, setEffectiveDate] = useState(todayIso());
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null);

  const [receiptToPrint, setReceiptToPrint] = useState<ReceiptData | null>(null);
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);

  const [listBusy, setListBusy] = useState(false);
  const [transfers, setTransfers] = useState<TransferRow[]>([]);

  const withAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const findEmployee = async (ref: string, set: (e: Employee | null) => void) => {
    const headers = withAuth();
    if (!headers) {
      setMessage(tr('insurance.transferBalance.notLoggedIn'));
      return;
    }

    const v = ref.trim();
    if (!v) return;
    try {
      const emp = await axios.get<Employee>(`${employeesApi}/ref/${encodeURIComponent(v)}`, { headers });
      set(emp.data || null);
    } catch (e: any) {
      console.error(e);
      set(null);
      setMessage(e?.response?.data?.message || tr('insurance.transferBalance.employeeNotFound'));
    }
  };

  const doTransfer = async () => {
    const headers = withAuth();
    if (!headers) return;
    const f = fromRef.trim();
    const to = toRef.trim();
    const amt = Number(amount);
    if (!f || !to) {
      setMessage(tr('insurance.transferBalance.fromToRequired'));
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setMessage(tr('insurance.transferBalance.amountPositive'));
      return;
    }

    setBusy(true);
    setMessage(null);
    setTransferResult(null);
    try {
      const resp = await axios.post<TransferResult>(
        `${balancesApi}/transfer`,
        {
          FromRef_emp: f,
          ToRef_emp: to,
          EffectiveDate: effectiveDate,
          Amount: amt,
          Notes: notes || null,
        },
        { headers }
      );
      setTransferResult(resp.data);
      setMessage(tr('insurance.transferBalance.saved'));
      await loadTransfers();
    } catch (e: any) {
      console.error(e);
      setMessage(e?.response?.data?.message || tr('insurance.transferBalance.failed'));
    } finally {
      setBusy(false);
    }
  };

  const printReceipt = (data: ReceiptData) => {
    setReceiptToPrint(data);
    setIsPrintingReceipt(true);
  };

  useEffect(() => {
    if (!isPrintingReceipt || !receiptToPrint?.transfer) return;

    const bodyClass = 'printing-transfer-receipt';
    document.body.classList.add(bodyClass);

    let cleaned = false;
    let fallbackTimer = 0;

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove(bodyClass);
      setIsPrintingReceipt(false);
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
  }, [isPrintingReceipt, receiptToPrint]);

  const handlePrintLatest = () => {
    if (!transferResult?.transfer) return;
    printReceipt({
      transfer: transferResult.transfer,
      fromName: fromEmp?.NAME || undefined,
      toName: toEmp?.NAME || undefined,
    });
  };

  const loadTransfers = async () => {
    const headers = withAuth();
    if (!headers) {
      setMessage(tr('insurance.transferBalance.notLoggedIn'));
      return;
    }

    setListBusy(true);
    try {
      const resp = await axios.get<TransferRow[]>(`${balancesApi}/transfers`, { headers });
      setTransfers(Array.isArray(resp.data) ? resp.data : []);
    } catch (e: any) {
      console.error(e);
      setMessage(e?.response?.data?.message || tr('insurance.transferBalance.failedLoadTransfers'));
    } finally {
      setListBusy(false);
    }
  };

  const startNewTransfer = () => {
    setFromRef('');
    setToRef('');
    setFromEmp(null);
    setToEmp(null);
    setEffectiveDate(todayIso());
    setAmount('');
    setNotes('');
    setTransferResult(null);
    setMessage(null);
    setDialogOpen(true);
  };

  useEffect(() => {
    loadTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const receipt = transferResult?.transfer;
  const fromName = fromEmp?.NAME || '';
  const toName = toEmp?.NAME || '';

  return (
    <Box p={2}>
      <style>
        {`
          @media print {
            body.printing-transfer-receipt * { visibility: hidden; }
            body.printing-transfer-receipt #transfer-receipt,
            body.printing-transfer-receipt #transfer-receipt * { visibility: visible; }
            body.printing-transfer-receipt #transfer-receipt {
              position: absolute !important;
              left: 0 !important;
              right: 0 !important;
              top: 0 !important;
              width: 100% !important;
              opacity: 1 !important;
              display: block !important;
              transform: none !important;
            }
            #transfer-receipt, #transfer-receipt * { color: #000 !important; }
            #transfer-receipt .MuiTypography-root { font-weight: 800 !important; }
            #transfer-receipt .MuiChip-root { background: transparent !important; border: none !important; }
            #transfer-receipt .MuiChip-label { color: #000 !important; font-weight: 800 !important; white-space: normal !important; }
            #transfer-receipt { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            #transfer-receipt { background: #fff !important; }
            #transfer-receipt * { background: transparent !important; }
          }
        `}
      </style>

      {receiptToPrint?.transfer && (
        <Box
          id="transfer-receipt"
          dir={isArabic ? 'rtl' : 'ltr'}
          sx={{
            position: 'fixed',
            left: isPrintingReceipt ? 0 : -10000,
            right: isPrintingReceipt ? 0 : 'auto',
            top: 0,
            width: isPrintingReceipt ? '100%' : 900,
            p: 2,
            bgcolor: '#fff',
            opacity: isPrintingReceipt ? 1 : 0,
            pointerEvents: 'none',
            '& .MuiTypography-root': { color: '#000', fontWeight: 800 },
          }}
        >
          <Box sx={{ position: 'relative', mb: 1, minHeight: 130 }}>
            <Box sx={{ textAlign: 'center', pr: 40, pl: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                {tr('insurance.transferBalance.receipt.title')}
              </Typography>
            </Box>
            <Box
              component="img"
              src="/nag-insurance.png"
              alt="Insurance"
              sx={{
                height: 130,
                width: 'auto',
                maxWidth: 360,
                objectFit: 'contain',
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 900 }}>
            {tr('insurance.transferBalance.receipt.transferId')}: {receiptToPrint.transfer.TransferId}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 900 }}>
            {tr('insurance.transferBalance.receipt.effectiveDate')}: {receiptToPrint.transfer.EffectiveDate}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 900 }}>
            {tr('insurance.transferBalance.receipt.from')}: {receiptToPrint.transfer.FromRef_emp}{' '}
            {receiptToPrint.fromName ? `- ${receiptToPrint.fromName}` : ''}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 900 }}>
            {tr('insurance.transferBalance.receipt.to')}: {receiptToPrint.transfer.ToRef_emp}{' '}
            {receiptToPrint.toName ? `- ${receiptToPrint.toName}` : ''}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 900 }}>
            {tr('insurance.transferBalance.receipt.amount')}: {money(receiptToPrint.transfer.Amount)}
          </Typography>
          {receiptToPrint.transfer.Notes ? (
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {tr('insurance.transferBalance.receipt.notes')}: {receiptToPrint.transfer.Notes}
            </Typography>
          ) : null}

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1} sx={{ mt: 1 }}>
            <Chip
              variant="filled"
              label={
                <Box component="span">
                  <Box component="div">
                    {tr('insurance.transferBalance.receipt.statementLine1', {
                      amount: money(receiptToPrint.transfer.Amount),
                      from: `${receiptToPrint.transfer.FromRef_emp}${receiptToPrint.fromName ? ` - ${receiptToPrint.fromName}` : ''}`,
                      to: `${receiptToPrint.transfer.ToRef_emp}${receiptToPrint.toName ? ` - ${receiptToPrint.toName}` : ''}`,
                      date: String(receiptToPrint.transfer.EffectiveDate || '').slice(0, 10),
                      transferId: receiptToPrint.transfer.TransferId,
                    })}
                  </Box>
                  <Box component="div" sx={{ mt: 0.5 }}>
                    {tr('insurance.transferBalance.receipt.statementLine2')}
                  </Box>
                </Box>
              }
              sx={{
                bgcolor: 'transparent',
                border: 'none',
                height: 'auto',
                alignItems: 'flex-start',
                '& .MuiChip-label': { display: 'block', whiteSpace: 'normal', py: 0.75 },
              }}
            />
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ mt: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 900 }}>
                {tr('insurance.transferBalance.receipt.senderSignature')}
              </Typography>
              <Box sx={{ mt: 3, borderBottom: '1px solid', borderColor: 'text.primary' }} />
              <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.primary' }}>
                {tr('insurance.transferBalance.receipt.name')}: {receiptToPrint.fromName || '________________'}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 900 }}>
                {tr('insurance.transferBalance.receipt.hrInsurance')}
              </Typography>
              <Box sx={{ mt: 3, borderBottom: '1px solid', borderColor: 'text.primary' }} />
              <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.primary' }}>
                {tr('insurance.transferBalance.receipt.signature')}
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}

      <Card elevation={3}>
        <CardHeader
          title={<InsuranceHeaderTitle title={tr('insurance.transferBalance.pageTitle')} />}
          action={
            <Stack direction="row" spacing={1}>
              {onBack && (
                <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
                  {tr('common.back')}
                </Button>
              )}
              <Button variant="outlined" startIcon={<CompareArrowsIcon />} onClick={startNewTransfer}>
                {tr('insurance.transferBalance.newTransfer')}
              </Button>
              <Button startIcon={<PrintIcon />} onClick={handlePrintLatest} disabled={!receipt}>
                {tr('insurance.transferBalance.printReceipt')}
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

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {tr('insurance.transferBalance.transfersList')}
              </Typography>
              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{tr('insurance.transferBalance.cols.id')}</TableCell>
                      <TableCell>{tr('insurance.transferBalance.cols.effective')}</TableCell>
                      <TableCell>{tr('insurance.transferBalance.cols.from')}</TableCell>
                      <TableCell>{tr('insurance.transferBalance.cols.to')}</TableCell>
                      <TableCell align="right">{tr('insurance.transferBalance.cols.amount')}</TableCell>
                      <TableCell>{tr('insurance.transferBalance.cols.notes')}</TableCell>
                      <TableCell align="right">{tr('insurance.transferBalance.cols.receipt')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transfers.map((row) => (
                      <TableRow key={row.TransferId} hover>
                        <TableCell>{row.TransferId}</TableCell>
                        <TableCell>{String(row.EffectiveDate || '').slice(0, 10)}</TableCell>
                        <TableCell>
                          {row.FromRef_emp}
                          {row.FromName ? ` — ${row.FromName}` : ''}
                        </TableCell>
                        <TableCell>
                          {row.ToRef_emp}
                          {row.ToName ? ` — ${row.ToName}` : ''}
                        </TableCell>
                        <TableCell align="right">{Number(row.Amount || 0).toFixed(2)} LYD</TableCell>
                        <TableCell>{row.Notes || ''}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            startIcon={<PrintIcon />}
                            onClick={() =>
                              printReceipt({
                                transfer: {
                                  TransferId: row.TransferId,
                                  FromRef_emp: row.FromRef_emp,
                                  ToRef_emp: row.ToRef_emp,
                                  Amount: row.Amount,
                                  EffectiveDate: row.EffectiveDate,
                                  Notes: row.Notes || null,
                                  CreatedAt: row.CreatedAt || undefined,
                                },
                                fromName: row.FromName || undefined,
                                toName: row.ToName || undefined,
                              })
                            }
                          >
                            {tr('insurance.transferBalance.print')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!transfers.length && (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Typography variant="body2" color="text.secondary">
                            {listBusy ? tr('insurance.transferBalance.loading') : tr('insurance.transferBalance.noTransfers')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
              <DialogTitle>{tr('insurance.transferBalance.newTransfer')}</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                    <TextField
                      label={tr('insurance.transferBalance.fromEmployeeNo')}
                      value={fromRef}
                      onChange={(e) => setFromRef(e.target.value)}
                      size="small"
                      fullWidth
                    />
                    <Button
                      variant="outlined"
                      startIcon={<SearchIcon />}
                      onClick={() => findEmployee(fromRef, setFromEmp)}
                      disabled={busy}
                    >
                      {tr('insurance.transferBalance.find')}
                    </Button>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 220 }}>
                      {fromEmp ? fromEmp.NAME : '—'}
                    </Typography>
                  </Stack>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                    <TextField
                      label={tr('insurance.transferBalance.toEmployeeNo')}
                      value={toRef}
                      onChange={(e) => setToRef(e.target.value)}
                      size="small"
                      fullWidth
                    />
                    <Button
                      variant="outlined"
                      startIcon={<SearchIcon />}
                      onClick={() => findEmployee(toRef, setToEmp)}
                      disabled={busy}
                    >
                      {tr('insurance.transferBalance.find')}
                    </Button>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 220 }}>
                      {toEmp ? toEmp.NAME : '—'}
                    </Typography>
                  </Stack>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      label={tr('insurance.transferBalance.effectiveDate')}
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    <TextField
                      label={tr('insurance.transferBalance.amount')}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label={tr('insurance.transferBalance.notes')}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Stack>

                  {receipt && (
                    <Box
                      dir={isArabic ? 'rtl' : 'ltr'}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        '& .MuiTypography-root': { color: 'text.primary', fontWeight: 800 },
                      }}
                    >
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={1}
                        alignItems={{ xs: 'stretch', md: 'center' }}
                        justifyContent="space-between"
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ justifyContent: 'space-between' }}>
                          <Box sx={{ flex: 1, textAlign: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                              {tr('insurance.transferBalance.receipt.title')}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            startIcon={<PrintIcon />}
                            onClick={() =>
                              printReceipt({
                                transfer: receipt,
                                fromName: fromName || undefined,
                                toName: toName || undefined,
                              })
                            }
                          >
                            {tr('insurance.transferBalance.printReceipt')}
                          </Button>
                        </Stack>
                        <Box
                          component="img"
                          src="/nag-insurance.png"
                          alt="Insurance"
                          sx={{ height: 84, width: 'auto', maxWidth: 280, objectFit: 'contain', alignSelf: { xs: 'flex-end', md: 'center' } }}
                        />
                      </Stack>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>
                        {tr('insurance.transferBalance.receipt.transferId')}: {receipt.TransferId}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>
                        {tr('insurance.transferBalance.receipt.effectiveDate')}: {receipt.EffectiveDate}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>
                        {tr('insurance.transferBalance.receipt.from')}: {receipt.FromRef_emp} {fromName ? `- ${fromName}` : ''}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>
                        {tr('insurance.transferBalance.receipt.to')}: {receipt.ToRef_emp} {toName ? `- ${toName}` : ''}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>
                        {tr('insurance.transferBalance.receipt.amount')}: {money(receipt.Amount)}
                      </Typography>
                      {receipt.Notes ? (
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>
                          {tr('insurance.transferBalance.receipt.notes')}: {receipt.Notes}
                        </Typography>
                      ) : null}

                      <Divider sx={{ my: 1 }} />
                      <Stack spacing={1}>
                        <Chip
                          variant="filled"
                          label={
                            <Box component="span">
                              <Box component="div">
                                {tr('insurance.transferBalance.receipt.statementLine1', {
                                  amount: money(receipt.Amount),
                                  from: `${receipt.FromRef_emp}${fromName ? ` - ${fromName}` : ''}`,
                                  to: `${receipt.ToRef_emp}${toName ? ` - ${toName}` : ''}`,
                                  date: String(receipt.EffectiveDate || '').slice(0, 10),
                                  transferId: receipt.TransferId,
                                })}
                              </Box>
                              <Box component="div" sx={{ mt: 0.5 }}>
                                {tr('insurance.transferBalance.receipt.statementLine2')}
                              </Box>
                            </Box>
                          }
                          sx={{
                            bgcolor: 'transparent',
                            border: 'none',
                            height: 'auto',
                            alignItems: 'flex-start',
                            '& .MuiChip-label': { display: 'block', whiteSpace: 'normal', py: 0.75 },
                          }}
                        />
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDialogOpen(false)} disabled={busy}>
                  {tr('common.cancel')}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<CompareArrowsIcon />}
                  onClick={doTransfer}
                  disabled={busy}
                >
                  {tr('insurance.transferBalance.transfer')}
                </Button>
              </DialogActions>
            </Dialog>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TransferBalancePage;
