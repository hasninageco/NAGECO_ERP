import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import axios from 'axios';
import { EMPLOYEE_WITH_LOG } from './ALBalanceTable';
import { buildApiUrl } from '../../../utils/api';

interface FieldBreakLogDialogProps {
  open: boolean;
  employee: EMPLOYEE_WITH_LOG | null;
  onClose: () => void;
}

type Row = {
  monthLabel: string;
  workedDays: number; // adjusted P or TD per level
  breakDays: number;  // B
  cumulative: number;
  helper: string;
};

const FieldBreakLogDialog: React.FC<FieldBreakLogDialogProps> = ({ open, employee, onClose }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const apiUrlJsi = buildApiUrl('/jsi');
  const round0 = (n: number) => Math.round(Number(n) || 0);
  const fmt2 = (n: number) => (Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '0.00');
  const handleExport = () => {
    if (!rows || rows.length === 0) return;
    const header = ['Month', 'Worked Days (P/TD adj)', 'Break (B)', 'Cumulative Balance'];
    const csvRows = rows.map(r => [r.monthLabel, r.workedDays, r.breakDays, fmt2(r.cumulative)].join(','));
    const csv = [header.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const ref = (employee as any)?.Ref_emp || 'employee';
    link.download = `field_break_log_${ref}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const totals = useMemo(() => {
    if (!rows || rows.length === 0) return { worked: 0, breaks: 0, balance: 0 };
    // Exclude the opening balance row from worked/break sums, but include in final balance via last cumulative
    const dataRows = rows.filter(r => r.monthLabel !== 'Opening balance');
    const worked = dataRows.reduce((s, r) => s + (Number(r.workedDays) || 0), 0);
    const breaks = dataRows.reduce((s, r) => s + (Number(r.breakDays) || 0), 0);
    const balance = rows[rows.length - 1]?.cumulative || 0;
    return { worked, breaks, balance };
  }, [rows]);

  const formatMonthLabel = (date: Date) => {
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  };

  const getSumPT = async (idEmp: number, date: Date): Promise<number> => {
    const token = localStorage.getItem('token');
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    try {
      const res = await axios.get(`${apiUrlJsi}/getsum_pt`, {
        params: { id_emp: idEmp, month, year },
        headers: { Authorization: `Bearer ${token}` },
      });
      return typeof res.data?.totalPT === 'number' ? res.data.totalPT : 0;
    } catch {
      return 0;
    }
  };

  const getSumB = async (idEmp: number, date: Date): Promise<number> => {
    const token = localStorage.getItem('token');
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    try {
      const res = await axios.get(`${apiUrlJsi}/getsum_b`, {
        params: { id_emp: idEmp, month, year },
        headers: { Authorization: `Bearer ${token}` },
      });
      return typeof res.data?.totalB === 'number' ? res.data.totalB : 0;
    } catch {
      return 0;
    }
  };

  const employmentDates = useMemo(() => {
    if (!employee) return { start: null as Date | null, end: null as Date | null };
    let start: Date | null = null;
    if (employee.start_contrat_renouvellable) start = new Date(employee.start_contrat_renouvellable);
    else if (employee.STAR_CONTRAT) start = new Date(employee.STAR_CONTRAT);
    const active = (() => {
      const val = employee.STATE;
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') return val.toLowerCase() === 'true';
      if (typeof val === 'number') return val === 1;
      return false;
    })();
    const end = (!active && employee.End_contrat) ? new Date(employee.End_contrat) : new Date();
    if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) return { start: null, end: null };
    return { start, end };
  }, [employee]);

  const getLevelFactor = (levelRaw: any) => {
    const s = (levelRaw ?? '').toString().trim().toLowerCase();
    if (s === 'senior staff') return 0.67;
    if (s === 'junior staff') return 0.6;
    if (s === 'supervisor') return 0.67;
    return 1; // default
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!employee || !employmentDates.start || !employmentDates.end || !employee.ID_EMP) {
        setRows([]);
        return;
      }
      const result: Row[] = [];
      let cumulative = 0;
      const factor = getLevelFactor((employee as any)?.coment_nidham_3amal); // Keep the factor calculation
      const start = new Date(employmentDates.start.getFullYear(), employmentDates.start.getMonth(), 1);
      const end = new Date(employmentDates.end.getFullYear(), employmentDates.end.getMonth(), 1);
      // Opening balance from RASID_HAKLIYA
      const rawOpen = (employee as any)?.RASID_HAKLIYA;
      let openingBalance = 0;
      if (typeof rawOpen === 'number') openingBalance = rawOpen;
      else if (typeof rawOpen === 'boolean') openingBalance = rawOpen ? 1 : 0;
      else if (rawOpen != null) {
        const parsed = parseFloat(String(rawOpen));
        openingBalance = Number.isFinite(parsed) ? parsed : 0;
      }
      cumulative = openingBalance;
      result.push({ monthLabel: 'Opening balance', workedDays: 0, breakDays: 0, cumulative, helper: 'Opening Balance' });
      let cursor = new Date(start);
      while (cursor <= end) {
        const workedRaw = await getSumPT(employee.ID_EMP, cursor);
        const breaks = await getSumB(employee.ID_EMP, cursor);
        const workedAdj = +(workedRaw * factor).toFixed(2);
        cumulative += (workedAdj - breaks);
        const helper = `${workedRaw} * ${factor} = ${workedAdj}`; // Removed level from helper
        result.push({ monthLabel: formatMonthLabel(cursor), workedDays: workedAdj, breakDays: breaks, cumulative, helper });
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      }
      if (!cancelled) {
        setRows(result);
        setPage(0);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [employee, employmentDates, apiUrlJsi]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Field Break Log</DialogTitle>
      <DialogContent>
        <div style={{ marginBottom: 6, fontSize: 14 }}>
          <div><b>Name:</b> {(employee as any)?.NAME || '-'}</div>
          <div><b>Employee No:</b> {(employee as any)?.Ref_emp || '-'}</div>
        </div>
        <div style={{ marginBottom: 8, fontSize: 13 }}>
          <b>Level:</b> {String((employee as any)?.coment_nidham_3amal ?? 'N/A')}
          <span style={{ marginLeft: 10, color: '#555' }}>
            Factor: {getLevelFactor((employee as any)?.coment_nidham_3amal)}
          </span>
        </div>
        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Final Balance: {round0(totals.balance)}</span>
          <Button variant="outlined" size="small" onClick={handleExport} disabled={!rows.length}>Export to Excel</Button>
        </div>
        {rows.length > 0 ? (
          <div>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }} border={1} cellPadding={4}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Worked Days (P/TD adj)</th>
                  <th>Break (B)</th>
                  <th>Cumulative Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.monthLabel}</td>
                    <td>
                      <div>{r.workedDays}</div>
                      {r.helper ? (
                        <div style={{ fontSize: 11, color: '#666' }}>{r.helper}</div>
                      ) : null}
                    </td>
                    <td>{r.breakDays}</td>
                    <td>{fmt2(r.cumulative)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>
              <div>Sum(Worked adj): {round0(totals.worked)}</div>
              <div>Sum(Break): {round0(totals.breaks)}</div>
              <div>
                Final Balance: {round0(totals.balance)}
                <br />
                <span style={{   color: '#fc0505', fontWeight: 400 }}>
                Helper: {round0(totals.worked)} - {round0(totals.breaks)} + Opening = {round0(totals.balance)}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 12 }}>
                Rows {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, rows.length)} of {rows.length}
              </span>
              <div>
                <Button variant="outlined" size="small" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} sx={{ mr: 1 }}>Previous</Button>
                <Button variant="outlined" size="small" onClick={() => setPage(p => ((p + 1) * rowsPerPage < rows.length ? p + 1 : p))} disabled={(page + 1) * rowsPerPage >= rows.length}>Next</Button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 14 }}>No data.</div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FieldBreakLogDialog;
