import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
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
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useTranslation } from 'react-i18next';
import { buildApiUrl } from '../../utils/api';
import InsuranceHeaderTitle from './InsuranceHeaderTitle';

type Period = {
  BalancePeriodId: number;
  Ref_emp: string;
  PeriodName?: string | null;
  ValidFrom: string;
  ValidTo: string;
  IsActive: boolean;
  CurrencyCode?: string | null;
  Notes?: string | null;
};

type Employee = {
  ID_EMP: number;
  NAME: string;
  Ref_emp?: string | null;
};

type RechargeTxn = {
  TxnId: number;
  Ref_emp: string;
  BalancePeriodId: number;
  TxnType: 'CREDIT' | 'DEBIT';
  Amount: number;
  EffectiveDate: string;
  Source: string;
  Notes?: string | null;
  TxnDate?: string | null;
};

type DistinctPeriod = {
  PeriodName?: string | null;
  ValidFrom: string;
  ValidTo: string;
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

  type BulkMode = 'existing' | 'new';
type Flash = {
  kind: 'success' | 'error' | 'info';
  text: string;
};

const RechargePage: React.FC<Props> = ({ onBack }) => {
  const { t: tr } = useTranslation();

  const money = (value: unknown) => `${Number(value || 0).toFixed(2)} LYD`;

  const balancesApi = useMemo(() => buildApiUrl('/medicalInsurance/balances'), []);
  const employeesApi = useMemo(() => buildApiUrl('/employees'), []);

  const buttonSx = useMemo(() => ({ textTransform: 'none' as const }), []);

  const [refEmp, setRefEmp] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | ''>('');

  const [periodName, setPeriodName] = useState('');
  const [validFrom, setValidFrom] = useState(todayIso());
  const [validTo, setValidTo] = useState(todayIso());

  const [effectiveDate, setEffectiveDate] = useState(todayIso());
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [recharges, setRecharges] = useState<RechargeTxn[]>([]);
  const [editingTxnId, setEditingTxnId] = useState<number | null>(null);

  const [balance, setBalance] = useState<number | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [busy, setBusy] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkFlash, setBulkFlash] = useState<Flash | null>(null);
  const [bulkEmployeeCount, setBulkEmployeeCount] = useState<number>(0);
  const [bulkPeriods, setBulkPeriods] = useState<DistinctPeriod[]>([]);
  const [bulkPeriodKey, setBulkPeriodKey] = useState('');
  const [bulkAmount, setBulkAmount] = useState<string>('');
  const [bulkNotes, setBulkNotes] = useState('');

  const hasEmployee = Boolean(employee && refEmp.trim());

    const [bulkMode, setBulkMode] = useState<BulkMode>('existing');
    const [bulkNewPeriodName, setBulkNewPeriodName] = useState('');
    const [bulkNewValidFrom, setBulkNewValidFrom] = useState(todayIso());
    const [bulkNewValidTo, setBulkNewValidTo] = useState(todayIso());
  const selectedPeriod = useMemo(() => {
    if (!selectedPeriodId) return null;
    return (periods || []).find((p) => Number(p.BalancePeriodId) === Number(selectedPeriodId)) || null;
  }, [periods, selectedPeriodId]);

  const periodById = useMemo(() => {
    const m = new Map<number, Period>();
    (periods || []).forEach((p) => m.set(Number(p.BalancePeriodId), p));
    return m;
  }, [periods]);

  const periodLabel = (p: Period) => {
    const name = p.PeriodName || tr('insurance.recharge.noName');
    const from = String(p.ValidFrom || '').slice(0, 10);
    const to = String(p.ValidTo || '').slice(0, 10);
    return `${name} (${from} → ${to})${p.IsActive ? '' : ` ${tr('insurance.recharge.inactiveTag')}`}`;
  };

  const distinctPeriodKey = (p: DistinctPeriod) => {
    const from = String(p.ValidFrom || '').slice(0, 10);
    const to = String(p.ValidTo || '').slice(0, 10);
    const name = p.PeriodName ?? '';
    return `${from}|${to}|${name}`;
  };

  const distinctPeriodLabel = (p: DistinctPeriod) => {
    const name = p.PeriodName || tr('insurance.recharge.noName');
    const from = String(p.ValidFrom || '').slice(0, 10);
    const to = String(p.ValidTo || '').slice(0, 10);
    return `${name} (${from} → ${to})`;
  };

  const selectedBulkPeriod = useMemo(() => {
    if (!bulkPeriodKey) return null;
    return (bulkPeriods || []).find((p) => distinctPeriodKey(p) === bulkPeriodKey) || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkPeriodKey, bulkPeriods]);

  const withAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const openBulk = async () => {
    const headers = withAuth();
    if (!headers) {
      setFlash({ kind: 'error', text: tr('insurance.recharge.notLoggedIn') });
      return;
    }

    setBulkOpen(true);
    setBulkFlash(null);
    setBulkLoading(true);
    try {
      const [empsResp, periodsResp] = await Promise.all([
        axios.get<any[]>(`${employeesApi}/all`, { headers }),
        axios.get<DistinctPeriod[]>(`${balancesApi}/periods/distinct`, { headers }),
      ]);

      const refs = (empsResp.data || [])
        .map((e: any) => String(e?.Ref_emp || '').trim())
        .filter((v: string) => v);

      setBulkEmployeeCount(refs.length);
      setBulkPeriods(periodsResp.data || []);

      const defaultPeriod = (periodsResp.data || [])[0] || null;
      if (defaultPeriod) {
        setBulkPeriodKey(distinctPeriodKey(defaultPeriod));
      } else {
        setBulkPeriodKey('');
      }
    } catch (e: any) {
      console.error(e);
          setBulkMode('existing');
      setBulkFlash({ kind: 'error', text: e?.response?.data?.message || tr('insurance.recharge.bulk.failedLoadEmployeesPeriods') });
    } finally {
          setBulkMode('new');
      setBulkLoading(false);

        setBulkNewPeriodName('');
        setBulkNewValidFrom(todayIso());
        setBulkNewValidTo(todayIso());
    }
  };

  const closeBulk = () => {
    if (bulkSaving) return;
    setBulkOpen(false);
    setBulkFlash(null);
  };

  const saveBulk = async () => {
    const headers = withAuth();
    if (!headers) return;

    const amt = Number(bulkAmount);
    if (bulkMode === 'existing') {
      if (!selectedBulkPeriod) {
        setBulkFlash({ kind: 'error', text: tr('insurance.recharge.pleaseSelectPeriod') });
        return;
      }
    } else {
      const vf = String(bulkNewValidFrom || '').slice(0, 10);
      const vt = String(bulkNewValidTo || '').slice(0, 10);
      if (!vf || !vt) {
        setBulkFlash({ kind: 'error', text: tr('insurance.recharge.validFromToRequired') });
        return;
      }
      if (vf > vt) {
        setBulkFlash({ kind: 'error', text: tr('insurance.recharge.validFromLeValidTo') });
        return;
      }
    }

    if (!Number.isFinite(amt) || amt <= 0) {
      setBulkFlash({ kind: 'error', text: tr('insurance.recharge.amountPositive') });
      return;
    }
    // Backend can fetch eligible employees automatically; count is only for display.

    setBulkSaving(true);
    setBulkFlash(null);
    try {
      let periodValidFrom = '';
      let periodValidTo = '';

      if (bulkMode === 'new') {
        periodValidFrom = String(bulkNewValidFrom || '').slice(0, 10);
        periodValidTo = String(bulkNewValidTo || '').slice(0, 10);

        await axios.post(
          `${balancesApi}/periods/bulkCreate`,
          {
            PeriodName: bulkNewPeriodName || null,
            ValidFrom: periodValidFrom,
            ValidTo: periodValidTo,
            Notes: bulkNotes || null,
          },
          { headers }
        );

        // Reload distinct periods list so the UI stays in sync
        const periodsResp = await axios.get<DistinctPeriod[]>(`${balancesApi}/periods/distinct`, { headers });
        setBulkPeriods(periodsResp.data || []);
      } else {
        periodValidFrom = String(selectedBulkPeriod!.ValidFrom || '').slice(0, 10);
        periodValidTo = String(selectedBulkPeriod!.ValidTo || '').slice(0, 10);
      }

      const resp = await axios.post(
        `${balancesApi}/recharge/bulk`,
        {
          ValidFrom: periodValidFrom,
          ValidTo: periodValidTo,
          Amount: amt,
          Notes: bulkNotes || null,
        },
        { headers }
      );

      const created = resp.data?.created ?? 0;
      const skipped = resp.data?.skippedCount ?? 0;
      setBulkFlash({ kind: 'success', text: tr('insurance.recharge.bulk.done', { created, skipped }) });
      // Refresh current employee view if any
      const ref = refEmp.trim();
      if (hasEmployee && ref) {
        await loadRecharges(ref);
        await loadBalance(ref, effectiveDate);
      }
    } catch (e: any) {
      console.error(e);
      setBulkFlash({ kind: 'error', text: e?.response?.data?.message || tr('insurance.recharge.bulk.failed') });
    } finally {
      setBulkSaving(false);
    }
  };

  const loadPeriods = async (ref: string) => {
    const headers = withAuth();
    if (!headers) return;
    const resp = await axios.get<Period[]>(`${balancesApi}/periods/all`, {
      headers,
      params: { Ref_emp: ref },
    });
    setPeriods(resp.data || []);
  };

  const loadBalance = async (ref: string, dateIso: string) => {
    const headers = withAuth();
    if (!headers) return;

    const resp = await axios.get(`${balancesApi}/balance`, {
      headers,
      params: { Ref_emp: ref, date: dateIso },
    });

    const b = resp.data?.balance;
    setBalance(typeof b === 'number' ? b : Number(b ?? 0));
    if (resp.data?.message) {
      setFlash({ kind: 'info', text: String(resp.data.message) });
    }
  };

  const loadRecharges = async (ref: string) => {
    const headers = withAuth();
    if (!headers) return;

    const resp = await axios.get<RechargeTxn[]>(`${balancesApi}/transactions`, {
      headers,
      params: { Ref_emp: ref, Source: 'RECHARGE' },
    });
    setRecharges(resp.data || []);
  };

  const findEmployee = async () => {
    const headers = withAuth();
    if (!headers) {
      setFlash({ kind: 'error', text: tr('insurance.recharge.notLoggedIn') });
      return;
    }
    const ref = refEmp.trim();
    if (!ref) {
      setFlash({ kind: 'error', text: tr('insurance.recharge.enterEmployeeNo') });
      return;
    }

    setBusy(true);
    setFlash(null);
    setEmployee(null);
    setPeriods([]);
    setSelectedPeriodId('');
    setRecharges([]);
    setBalance(null);
    setEditingTxnId(null);
    try {
      const emp = await axios.get<Employee>(`${employeesApi}/ref/${encodeURIComponent(ref)}`, { headers });
      setEmployee(emp.data || null);
      await loadPeriods(ref);
      await loadRecharges(ref);
      await loadBalance(ref, effectiveDate);
    } catch (e: any) {
      console.error(e);
      setFlash({ kind: 'error', text: e?.response?.data?.message || tr('insurance.recharge.employeeNotFound') });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const ref = refEmp.trim();
    if (!ref) return;
    const headers = withAuth();
    if (!headers) return;
    // refresh displayed balance when date changes
    loadBalance(ref, effectiveDate).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveDate]);

  useEffect(() => {
    if (!hasEmployee) return;
    if (editingTxnId) return;

    const active = (periods || []).filter((p) => p.IsActive);
    const today = todayIso();
    const defaultPeriod =
      active.find((p) => String(p.ValidFrom).slice(0, 10) <= today && String(p.ValidTo).slice(0, 10) >= today) ||
      active[0] ||
      (periods || [])[0] ||
      null;

    if (!defaultPeriod) return;
    const hasSelection = selectedPeriodId !== '';
    const selectionStillExists = hasSelection
      ? (periods || []).some((p) => Number(p.BalancePeriodId) === Number(selectedPeriodId))
      : false;

    if (!hasSelection || !selectionStillExists) {
      setSelectedPeriodId(defaultPeriod.BalancePeriodId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periods, hasEmployee, editingTxnId]);

  useEffect(() => {
    if (!hasEmployee) return;
    if (editingTxnId) return;
    if (!selectedPeriod) return;

    const today = todayIso();
    const from = String(selectedPeriod.ValidFrom || '').slice(0, 10);
    const to = String(selectedPeriod.ValidTo || '').slice(0, 10);
    const nextDate = from <= today && to >= today ? today : from;
    if (nextDate && nextDate !== effectiveDate) setEffectiveDate(nextDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriodId, selectedPeriod, hasEmployee, editingTxnId]);

  const addPeriod = async () => {
    const headers = withAuth();
    if (!headers) return;
    const ref = refEmp.trim();
    if (!ref) return;

    setBusy(true);
    setFlash(null);
    try {
      await axios.post(
        `${balancesApi}/periods/Add`,
        {
          Ref_emp: ref,
          PeriodName: periodName || null,
          ValidFrom: validFrom,
          ValidTo: validTo,
        },
        { headers }
      );
      await loadPeriods(ref);
      setFlash({ kind: 'success', text: tr('insurance.recharge.periodCreated') });
    } catch (e: any) {
      console.error(e);
      setFlash({ kind: 'error', text: e?.response?.data?.message || tr('insurance.recharge.failedCreatePeriod') });
    } finally {
      setBusy(false);
    }
  };

  const doRecharge = async () => {
    const headers = withAuth();
    if (!headers) return;
    const ref = refEmp.trim();
    if (!ref) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setFlash({ kind: 'error', text: tr('insurance.recharge.amountPositive') });
      return;
    }

    setBusy(true);
    setFlash(null);
    try {
      if (editingTxnId) {
        await axios.put(
          `${balancesApi}/transactions/Update/${editingTxnId}`,
          {
            EffectiveDate: effectiveDate,
            Amount: amt,
            Notes: notes || null,
          },
          { headers }
        );
        setEditingTxnId(null);
        setFlash({ kind: 'success', text: tr('insurance.recharge.rechargeUpdated') });
      } else {
        if (!selectedPeriodId) {
          setFlash({ kind: 'error', text: tr('insurance.recharge.pleaseSelectPeriod') });
          return;
        }
        await axios.post(
          `${balancesApi}/recharge`,
          {
            Ref_emp: ref,
            BalancePeriodId: selectedPeriodId,
            EffectiveDate: effectiveDate,
            Amount: amt,
            Notes: notes || null,
          },
          { headers }
        );
        setFlash({ kind: 'success', text: tr('insurance.recharge.rechargeSaved') });
      }

      setAmount('');
      setNotes('');
      await loadRecharges(ref);
      await loadBalance(ref, effectiveDate);
    } catch (e: any) {
      console.error(e);
      setFlash({
        kind: 'error',
        text:
          e?.response?.data?.message ||
          (editingTxnId ? tr('insurance.recharge.updateFailed') : tr('insurance.recharge.rechargeFailed')),
      });
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (txn: RechargeTxn) => {
    setEditingTxnId(txn.TxnId);
    setEffectiveDate((txn.EffectiveDate || '').slice(0, 10));
    setAmount(String(txn.Amount ?? ''));
    setNotes(txn.Notes || '');
    setFlash({ kind: 'info', text: tr('insurance.recharge.editingRecharge') });
  };

  const cancelEdit = () => {
    setEditingTxnId(null);
    setAmount('');
    setNotes('');
    setFlash(null);
  };

  const deleteRecharge = async (txn: RechargeTxn) => {
    const headers = withAuth();
    if (!headers) return;
    const ref = refEmp.trim();
    if (!ref) return;

    const ok = window.confirm(
      tr('insurance.recharge.confirmDelete', {
        date: String(txn.EffectiveDate).slice(0, 10),
        amount: money(txn.Amount),
      })
    );
    if (!ok) return;

    setBusy(true);
    setFlash(null);
    try {
      await axios.delete(`${balancesApi}/transactions/Delete/${txn.TxnId}`, { headers });
      if (editingTxnId === txn.TxnId) cancelEdit();
      await loadRecharges(ref);
      await loadBalance(ref, effectiveDate);
      setFlash({ kind: 'success', text: tr('insurance.recharge.rechargeDeleted') });
    } catch (e: any) {
      console.error(e);
      setFlash({ kind: 'error', text: e?.response?.data?.message || tr('insurance.recharge.deleteFailed') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box p={2}>
      <Card elevation={3}>
        <CardHeader
          title={<InsuranceHeaderTitle title={tr('insurance.recharge.pageTitle')} />}
          action={
            <Stack direction="row" spacing={1}>
              {onBack && (
                <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={buttonSx}>
                  {tr('common.back')}
                </Button>
              )}
              <Button variant="outlined" onClick={openBulk} disabled={busy} sx={buttonSx}>
                {tr('insurance.recharge.bulk.open')}
              </Button>
              <Button startIcon={<RefreshIcon />} onClick={findEmployee} disabled={busy} sx={buttonSx}>
                {tr('common.refresh')}
              </Button>
            </Stack>
          }
        />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <TextField
                label={tr('insurance.recharge.employeeNo')}
                value={refEmp}
                onChange={(e) => setRefEmp(e.target.value)}
                size="small"
                fullWidth
              />
              <Button variant="contained" startIcon={<SearchIcon />} onClick={findEmployee} disabled={busy} sx={buttonSx}>
                {tr('insurance.recharge.find')}
              </Button>
            </Stack>

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              justifyContent="space-between"
            >
              <Typography variant="body2" color="text.secondary">
                {employee ? tr('insurance.recharge.employee', { name: employee.NAME }) : tr('insurance.recharge.employeeEmpty')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {balance !== null ? tr('insurance.recharge.balanceOn', { date: effectiveDate, balance: money(balance) }) : ''}
              </Typography>
            </Stack>

            {flash?.text && (
              <Alert severity={flash.kind} variant="outlined">
                {flash.text}
              </Alert>
            )}

            <Divider />

            <Typography variant="h6">{tr('insurance.recharge.balancePeriods')}</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label={tr('insurance.recharge.periodNameOptional')}
                value={periodName}
                onChange={(e) => setPeriodName(e.target.value)}
                size="small"
                fullWidth
              />
              <TextField
                label={tr('insurance.recharge.validFrom')}
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label={tr('insurance.recharge.validTo')}
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addPeriod}
                disabled={busy || !hasEmployee}
                sx={buttonSx}
              >
                {tr('common.save')}
              </Button>
            </Stack>

            <Divider />

            <Typography variant="h6">{tr('insurance.recharge.addNewRecharge')}</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              {!editingTxnId ? (
                <TextField
                  label={tr('insurance.recharge.period')}
                  select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value === '' ? '' : Number(e.target.value))}
                  size="small"
                  fullWidth
                  disabled={busy || !hasEmployee}
                >
                  <MenuItem value="">{tr('insurance.recharge.selectPeriod')}</MenuItem>
                  {(periods || [])
                    .filter((p) => p.IsActive)
                    .map((p) => (
                      <MenuItem key={p.BalancePeriodId} value={p.BalancePeriodId}>
                        {periodLabel(p)}
                      </MenuItem>
                    ))}
                </TextField>
              ) : (
                <TextField
                  label={tr('insurance.recharge.effectiveDate')}
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              )}

              {!editingTxnId && (
                <TextField
                  label={tr('insurance.recharge.effectiveDate')}
                  type="date"
                  value={effectiveDate}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  disabled
                />
              )}
              <TextField
                label={tr('insurance.recharge.amount')}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                size="small"
                fullWidth
              />
              <TextField
                label={tr('insurance.recharge.notes')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                size="small"
                fullWidth
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="contained"
                  onClick={doRecharge}
                  disabled={busy || !hasEmployee || (!editingTxnId && !selectedPeriodId)}
                  sx={buttonSx}
                >
                  {editingTxnId ? tr('insurance.recharge.update') : tr('common.save')}
                </Button>
                {editingTxnId && (
                  <Button variant="outlined" onClick={cancelEdit} disabled={busy} sx={buttonSx}>
                    {tr('common.cancel')}
                  </Button>
                )}
              </Stack>
            </Stack>

            <Divider />

            <Typography variant="h6">{tr('insurance.recharge.rechargeList')}</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{tr('insurance.recharge.cols.date')}</TableCell>
                    <TableCell>{tr('insurance.recharge.cols.period')}</TableCell>
                    <TableCell align="right">{tr('insurance.recharge.cols.amount')}</TableCell>
                    <TableCell>{tr('insurance.recharge.cols.notes')}</TableCell>
                    <TableCell align="right">{tr('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(recharges || []).map((r) => (
                    <TableRow key={r.TxnId} hover selected={editingTxnId === r.TxnId}>
                      <TableCell>{String(r.EffectiveDate || '').slice(0, 10)}</TableCell>
                      <TableCell>
                        {(() => {
                          const p = periodById.get(Number(r.BalancePeriodId));
                          return p ? periodLabel(p) : String(r.BalancePeriodId ?? '');
                        })()}
                      </TableCell>
                      <TableCell align="right">{money(r.Amount)}</TableCell>
                      <TableCell>{r.Notes || ''}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => startEdit(r)} disabled={busy || !hasEmployee}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => deleteRecharge(r)} disabled={busy || !hasEmployee}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!recharges?.length && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary">
                          {tr('insurance.recharge.noRecharges')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider />

            <Typography variant="h6">{tr('insurance.recharge.periodList')}</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{tr('insurance.recharge.cols.period')}</TableCell>
                    <TableCell>{tr('insurance.recharge.cols.validFrom')}</TableCell>
                    <TableCell>{tr('insurance.recharge.cols.validTo')}</TableCell>
                    <TableCell>{tr('insurance.recharge.cols.status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(periods || []).map((p) => (
                    <TableRow key={p.BalancePeriodId} hover>
                      <TableCell>{p.PeriodName || tr('insurance.recharge.noName')}</TableCell>
                      <TableCell>{String(p.ValidFrom || '').slice(0, 10)}</TableCell>
                      <TableCell>{String(p.ValidTo || '').slice(0, 10)}</TableCell>
                      <TableCell>{p.IsActive ? tr('insurance.recharge.active') : tr('insurance.recharge.inactive')}</TableCell>
                    </TableRow>
                  ))}
                  {!periods?.length && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="body2" color="text.secondary">
                          {tr('insurance.recharge.noPeriods')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={bulkOpen} onClose={closeBulk} fullWidth maxWidth="sm">
        <DialogTitle>{tr('insurance.recharge.bulk.title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {bulkSaving && <LinearProgress />}
            {bulkFlash?.text && (
              <Alert severity={bulkFlash.kind} variant="outlined">
                {bulkFlash.text}
              </Alert>
            )}

            {bulkLoading ? (
              <Stack direction="row" spacing={2} alignItems="center">
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  {tr('insurance.recharge.bulk.loadingEmployeesPeriods')}
                </Typography>
              </Stack>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  {tr('insurance.recharge.bulk.eligibleEmployees', { count: bulkEmployeeCount })}
                </Typography>

                <TextField
                  label={tr('insurance.recharge.bulk.mode')}
                  select
                  value={bulkMode}
                  onChange={(e) => setBulkMode(e.target.value as BulkMode)}
                  size="small"
                  fullWidth
                  disabled={bulkSaving}
                >
                  <MenuItem value="existing">{tr('insurance.recharge.bulk.modeExisting')}</MenuItem>
                  <MenuItem value="new">{tr('insurance.recharge.bulk.modeNew')}</MenuItem>
                </TextField>

                {bulkMode === 'existing' ? (
                  <TextField
                    label={tr('insurance.recharge.period')}
                    select
                    value={bulkPeriodKey}
                    onChange={(e) => setBulkPeriodKey(String(e.target.value))}
                    size="small"
                    fullWidth
                    disabled={bulkSaving}
                  >
                    <MenuItem value="">{tr('insurance.recharge.selectPeriod')}</MenuItem>
                    {(bulkPeriods || []).map((p) => (
                      <MenuItem key={distinctPeriodKey(p)} value={distinctPeriodKey(p)}>
                        {distinctPeriodLabel(p)}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label={tr('insurance.recharge.periodNameOptional')}
                      value={bulkNewPeriodName}
                      onChange={(e) => setBulkNewPeriodName(e.target.value)}
                      size="small"
                      fullWidth
                      disabled={bulkSaving}
                    />
                    <TextField
                      label={tr('insurance.recharge.validFrom')}
                      type="date"
                      value={bulkNewValidFrom}
                      onChange={(e) => setBulkNewValidFrom(e.target.value)}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      disabled={bulkSaving}
                    />
                    <TextField
                      label={tr('insurance.recharge.validTo')}
                      type="date"
                      value={bulkNewValidTo}
                      onChange={(e) => setBulkNewValidTo(e.target.value)}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      disabled={bulkSaving}
                    />
                  </Stack>
                )}

                <TextField
                  label={tr('insurance.recharge.amount')}
                  value={bulkAmount}
                  onChange={(e) => setBulkAmount(e.target.value)}
                  size="small"
                  fullWidth
                  disabled={bulkSaving}
                />

                <TextField
                  label={tr('insurance.recharge.notes')}
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  size="small"
                  fullWidth
                  disabled={bulkSaving}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBulk} disabled={bulkSaving} sx={buttonSx}>
            {tr('common.close')}
          </Button>
          <Button
            variant="contained"
            onClick={saveBulk}
            disabled={bulkLoading || bulkSaving || (bulkMode === 'existing' && !bulkPeriodKey)}
            sx={buttonSx}
          >
            {bulkSaving ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} />
                <span>{tr('common.save')}</span>
              </Stack>
            ) : (
              tr('common.save')
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RechargePage;
