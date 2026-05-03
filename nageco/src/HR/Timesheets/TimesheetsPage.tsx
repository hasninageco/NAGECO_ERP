import * as React from 'react';
import axios from 'axios';
import { Box, Paper, Snackbar, Alert, TextField } from '@mui/material';
import { buildApiUrl } from '../../utils/api';
import TimesheetsToolbar from './components/TimesheetsToolbar';
import TimesheetsGrid from './components/TimesheetsGrid';
import type { DayKey, EmployeeTypeFilter, TimesheetApiRow } from './types';
import { dayKey, getDaysInMonth, normalizeDayValue } from './timesheetUtils';

const apiUrlJsi = buildApiUrl('/jsi');
const apiUrlWw = buildApiUrl('/wws');

function getDefaultMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

type TimesheetsPageProps = {
  attachedNumberPrefix?: string;
};

export default function TimesheetsPage({ attachedNumberPrefix = '' }: TimesheetsPageProps) {
  const def = React.useMemo(() => getDefaultMonthYear(), []);
  const [month, setMonth] = React.useState(def.month);
  const [year, setYear] = React.useState(def.year);
  const [employeeType, setEmployeeType] = React.useState<EmployeeTypeFilter>('all');

  const [rows, setRows] = React.useState<TimesheetApiRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [snack, setSnack] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Find/search
  const [searchInput, setSearchInput] = React.useState('');
  const [searchApplied, setSearchApplied] = React.useState('');
  const [tableFilters, setTableFilters] = React.useState({
    costCenter: '',
    employeeName: '',
    empNo: '',
  });

  // Multi-cell selection (spreadsheet-like)
  const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);
  const selectedSet = React.useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const parseCellKey = React.useCallback((key: string): { id_tran: number; field: DayKey } | null => {
    const idx = key.indexOf(':');
    if (idx < 0) return null;
    const id = Number(key.slice(0, idx));
    const field = key.slice(idx + 1) as DayKey;
    if (!Number.isFinite(id)) return null;
    return { id_tran: id, field };
  }, []);

  // id_tran -> changed day fields
  const [dirty, setDirty] = React.useState<Record<number, Partial<Record<DayKey, string | null>>>>({});

  const daysInMonth = React.useMemo(() => getDaysInMonth(year, month), [year, month]);
  const effectiveAttachedNumberPrefix = React.useMemo(
    () => String(attachedNumberPrefix || '').trim(),
    [attachedNumberPrefix],
  );

  const fetchTimesheets = React.useCallback(async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const params: Record<string, string | number> = { month, year, employeeType };
      if (effectiveAttachedNumberPrefix) {
        params.attachedNumberPrefix = effectiveAttachedNumberPrefix;
      }

      const res = await axios.get<TimesheetApiRow[]>(`${apiUrlJsi}/timesheets`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      // Normalize day values
      const normalized = res.data.map((r) => {
        const next: TimesheetApiRow = { ...r } as any;
        next.employeeName = (r.NAME ?? r.nom ?? '') as any;
        for (let d = 1; d <= 31; d++) {
          const k = dayKey(d);
          next[k] = normalizeDayValue((r as any)[k]);
        }
        return next;
      });
      setRows(normalized);
      setDirty({});
      setSelectedKeys([]);
      // Keep current search applied, but clear selection
    } catch (err: any) {
      setSnack({ type: 'error', message: err?.response?.data?.message || 'Failed to load timesheets' });
    } finally {
      setLoading(false);
    }
  }, [effectiveAttachedNumberPrefix, employeeType, month, year]);

  React.useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  const dirtyCount = React.useMemo(() => Object.keys(dirty).length, [dirty]);

  const visibleRows = React.useMemo(() => {
    const q = searchApplied.trim().toLowerCase();

    const costCenterFilter = tableFilters.costCenter.trim().toLowerCase();
    const employeeNameFilter = tableFilters.employeeName.trim().toLowerCase();
    const empNoFilter = tableFilters.empNo.trim().toLowerCase();

    return rows.filter((r) => {
      const ccText = String(r.COST_CENTER_CODE ?? r.COST_CENTER ?? '').toLowerCase();
      const nameText = String(r.employeeName ?? r.NAME ?? r.nom ?? '').toLowerCase();
      const empNoText = String(r.Ref_emp ?? '').toLowerCase();

      if (costCenterFilter && !ccText.includes(costCenterFilter)) return false;
      if (employeeNameFilter && !nameText.includes(employeeNameFilter)) return false;
      if (empNoFilter && !empNoText.includes(empNoFilter)) return false;

      if (!q) return true;

      const hay = [
        r.COST_CENTER_CODE,
        r.COST_CENTER,
        r.Ref_emp,
        r.employeeName,
        r.NAME,
        r.nom,
        r.id_emp != null ? String(r.id_emp) : null,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, searchApplied, tableFilters.costCenter, tableFilters.employeeName, tableFilters.empNo]);

  const handleSave = React.useCallback(async () => {
    const token = localStorage.getItem('token');
    const updates = Object.entries(dirty).map(([id, fields]) => ({
      id_tran: Number(id),
      fields,
    }));

    if (updates.length === 0) return;

    setLoading(true);
    try {
      const res = await axios.post(
        `${apiUrlJsi}/timesheets/bulk-update`,
        { updates },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = typeof res.data?.updated === 'number' ? res.data.updated : undefined;
      setSnack({ type: 'success', message: updated != null ? `Saved (${updated})` : 'Saved' });
      await fetchTimesheets();
    } catch (err: any) {
      setSnack({ type: 'error', message: err?.response?.data?.message || 'Save failed' });
      setLoading(false);
    }
  }, [dirty, fetchTimesheets]);

  const onRowUpdate = React.useCallback(
    (newRow: TimesheetApiRow, oldRow: TimesheetApiRow) => {
      const changes: Partial<Record<DayKey, string | null>> = {};

      for (let d = 1; d <= 31; d++) {
        const k = dayKey(d);
        const nv = normalizeDayValue((newRow as any)[k]);
        const ov = normalizeDayValue((oldRow as any)[k]);
        if (nv !== ov) changes[k] = nv;
      }

      const changedKeys = Object.keys(changes) as DayKey[];

      if (changedKeys.length > 0) {
        setDirty((prev) => ({
          ...prev,
          [newRow.id_tran]: { ...(prev[newRow.id_tran] || {}), ...changes },
        }));

        // If user has a multi selection and they edited one cell,
        // apply the same value to all selected cells.
        if (selectedSet.size > 1 && changedKeys.length === 1) {
          const editedKey = changedKeys[0];
          const editedValue = changes[editedKey] ?? null;

          setRows((prevRows) => {
            const nextRows = prevRows.map((r) => ({ ...r }));
            for (const sk of Array.from(selectedSet)) {
              const parsed = parseCellKey(sk);
              if (!parsed) continue;
              const row = nextRows.find((x) => x.id_tran === parsed.id_tran);
              if (!row) continue;
              (row as any)[parsed.field] = editedValue;
            }
            return nextRows;
          });

          setDirty((prev) => {
            const next = { ...prev };
            for (const sk of Array.from(selectedSet)) {
              const parsed = parseCellKey(sk);
              if (!parsed) continue;
              const rowId = parsed.id_tran;
              next[rowId] = { ...(next[rowId] || {}), [parsed.field]: editedValue };
            }
            return next;
          });
        }
      }

      return newRow;
    },
    [parseCellKey, selectedSet]
  );

  const applyValueToSelected = React.useCallback(
    async (value: string | null) => {
      if (selectedKeys.length === 0) return;
      const token = localStorage.getItem('token');

      // Validate code against WADH3_WADHIFI before applying (only when a value is provided)
      if (value != null) {
        const vTrimmed = String(value).toUpperCase().trim();
        if (!vTrimmed) return;

        try {
          const res = await axios.get(`${apiUrlWw}/check`, {
            params: { code: vTrimmed },
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.data?.exists) {
            setSnack({ type: 'error', message: 'Code entred not found' });
            return;
          }
        } catch (err: any) {
          setSnack({ type: 'error', message: err?.response?.data?.message || 'Code validation failed' });
          return;
        }
      }

      const v = value == null ? null : String(value).toUpperCase();

      // Update visible grid rows
      setRows((prevRows) => {
        const nextRows = prevRows.map((r) => ({ ...r }));
        const indexById = new Map<number, number>();
        nextRows.forEach((r, idx) => indexById.set(r.id_tran, idx));

        for (const sk of selectedKeys) {
          const parsed = parseCellKey(sk);
          if (!parsed) continue;
          const idx = indexById.get(parsed.id_tran);
          if (idx == null) continue;
          (nextRows[idx] as any)[parsed.field] = v;
        }
        return nextRows;
      });

      // Mark dirty for API save
      setDirty((prev) => {
        const next = { ...prev };
        for (const sk of selectedKeys) {
          const parsed = parseCellKey(sk);
          if (!parsed) continue;
          const rowId = parsed.id_tran;
          next[rowId] = { ...(next[rowId] || {}), [parsed.field]: v };
        }
        return next;
      });
    },
    [apiUrlWw, parseCellKey, selectedKeys]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ p: 1.5 }} variant="outlined">
        <TimesheetsToolbar
          month={month}
          year={year}
          employeeType={employeeType}
          dirtyCount={dirtyCount}
          loading={loading}
          searchText={searchInput}
          onMonthChange={setMonth}
          onYearChange={setYear}
          onEmployeeTypeChange={setEmployeeType}
          onRefresh={fetchTimesheets}
          onSave={handleSave}
          onSearchTextChange={setSearchInput}
          onFind={() => setSearchApplied(searchInput)}
          onClearSearch={() => {
            setSearchInput('');
            setSearchApplied('');
          }}
        />
      </Paper>

      <Paper sx={{ p: 1.5 }} variant="outlined">
        <Box
          sx={{
            display: 'grid',
            gap: 1,
            mb: 1,
            pb: 1,
            borderBottom: 1,
            borderColor: 'divider',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          <TextField
            size="small"
            label="Cost Center"
            value={tableFilters.costCenter}
            onChange={(e) => setTableFilters((prev) => ({ ...prev, costCenter: e.target.value }))}
          />
          <TextField
            size="small"
            label="Employee Name"
            value={tableFilters.employeeName}
            onChange={(e) => setTableFilters((prev) => ({ ...prev, employeeName: e.target.value }))}
          />
          <TextField
            size="small"
            label="Emp. No"
            value={tableFilters.empNo}
            onChange={(e) => setTableFilters((prev) => ({ ...prev, empNo: e.target.value }))}
          />
        </Box>

        <TimesheetsGrid
          rows={visibleRows}
          daysInMonth={daysInMonth}
          loading={loading}
          onRowUpdate={onRowUpdate}
          onRowUpdateError={(e) => setSnack({ type: 'error', message: (e as any)?.message || 'Edit failed' })}
          selectedKeys={selectedKeys}
          onSelectedKeysChange={setSelectedKeys}
          onApplyValueToSelected={applyValueToSelected}
        />
        <Box
          sx={{
            mt: 1,
            px: 0.5,
            py: 0.5,
            borderTop: 1,
            borderColor: 'divider',
            textAlign: 'right',
            fontSize: 13,
            color: 'text.secondary',
          }}
        >
          Employee count: {visibleRows.length}
          {visibleRows.length !== rows.length ? ` of ${rows.length}` : ''}
        </Box>
      </Paper>

      {snack ? (
        <Snackbar
          open
          autoHideDuration={4000}
          onClose={() => setSnack(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snack.type} variant="filled" onClose={() => setSnack(null)}>
            {snack.message}
          </Alert>
        </Snackbar>
      ) : null}
    </Box>
  );
}
