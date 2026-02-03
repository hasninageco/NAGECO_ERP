import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ALBalanceTable, { EMPLOYEE, EMPLOYEE_WITH_LOG } from './ALBalanceTable';
import AnnualLeaveDialog from './AnnualLeaveDialog';
import EmployeeDialog from './EmployeeDialog';
import DaysWorkedLogDialogAsync from './DaysWorkedLogDialogAsync';
import FieldBreakLogDialog from './FieldBreakLogDialog';
import {
  Box,
  Button,
  
} from '@mui/material';
import { buildApiUrl } from '../../../utils/api';

import * as XLSX from 'xlsx';
 
// Initial form state
const initialEmployeeState: EMPLOYEE = {
  ID_EMP: 0,
  NAME: '',
  MAIL: '',
  End_contrat: '',
  STAR_CONTRAT: '',
  Nationality: '',
  Ref_emp: '',
  COST_CENTER: '',
  Picture: '',
  date_naissance: '',
  name_english: '',
  IS_FOREINGHT: false,
  attached_number: '',
  NAME_EN: '',
  IS_OK_POUR_MALAK: false,
  NetIjaza: null,
  NetIjaza_desert: null,
  SOLDE_JOUR_CONGEE_desert: null,
  Spends_Vacation: null,
  Spends_Field_Break: null,
  city: '',
  Desert_pass_No: '',
  Desert_pass_Comment: '',
  Desert_pass_Sent_Email: '',
  STATE: '', // Added state field
  rasid_CONGE: null,
};

const ALbalance = () => {
  const [data, setData] = useState<EMPLOYEE[]>([]);
  const [loading, setLoading] = useState(true);
  const [annualLeaveOpen, setAnnualLeaveOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState<EMPLOYEE | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [stateFilter, setStateFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logDialogEmployee, setLogDialogEmployee] = useState<EMPLOYEE_WITH_LOG | null>(null);
  const [fieldBreakDialogOpen, setFieldBreakDialogOpen] = useState(false);
  const [fieldBreakDialogEmployee, setFieldBreakDialogEmployee] = useState<EMPLOYEE_WITH_LOG | null>(null);
  const navigate = useNavigate();

  const apiUrl = buildApiUrl('/employees');
  const apiUrlcongee = buildApiUrl('/Lleaves');
  const apiUrlJsi = buildApiUrl('/jsi');




  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    setLoading(true);
    try {
      const response = await axios.get<EMPLOYEE[]>(`${apiUrl}/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data);
    } catch (error: any) {
      if (error?.response?.status === 401) navigate('/login');
      else alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddNew = () => {
    setEditItem(initialEmployeeState);
    setIsEditMode(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditItem(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!editItem?.NAME) newErrors.NAME = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !editItem) return;
    const token = localStorage.getItem('token');

    try {
      if (isEditMode) {
        await axios.put(`${apiUrl}/update/${editItem.ID_EMP}`, editItem, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${apiUrl}/add`, editItem, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await fetchData();
      handleCloseDialog();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Save failed');
    }
  };

  const handleExportExcel = () => {
    const headers = [
      "ID_EMP", "NAME", "MAIL", "End_contrat", "STAR_CONTRAT", "Nationality", "Ref_emp", "COST_CENTER", "Picture",
      "date_naissance", "name_english", "IS_FOREINGHT", "attached_number", "NAME_EN", "IS_OK_POUR_MALAK",
      "NetIjaza", "NetIjaza_desert", "SOLDE_JOUR_CONGEE_desert", "Spends_Vacation", "Spends_Field_Break",
      "city", "Desert_pass_No", "Desert_pass_Comment", "Desert_pass_Sent_Email"
    ];
    const rows = data.map(s => [
      s.ID_EMP, s.NAME, s.MAIL, s.End_contrat, s.STAR_CONTRAT, s.Nationality, s.Ref_emp, s.COST_CENTER, s.Picture,
      s.date_naissance, s.name_english, s.IS_FOREINGHT, s.attached_number, s.NAME_EN, s.IS_OK_POUR_MALAK,
      s.NetIjaza, s.NetIjaza_desert, s.SOLDE_JOUR_CONGEE_desert, s.Spends_Vacation, s.Spends_Field_Break,
      s.city, s.Desert_pass_No, s.Desert_pass_Comment, s.Desert_pass_Sent_Email
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Balance");
    XLSX.writeFile(workbook, "employee_balance.xlsx");
  };

  // Helper to format date as dd-MMM-yyyy
  const formatDate = (dateInput: string | number | Date | null | undefined): string => {
    if (!dateInput) return '';
    let date: Date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      return '';
    }
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Helper to calculate number of days between two dates
  const filteredData = useMemo(() => {
    if (stateFilter === 'all') return data;
    if (stateFilter === 'active') return data.filter(emp => {
      const val = emp.STATE;
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') return val.toLowerCase() === 'true';
      if (typeof val === 'number') return val === 1;
      return false;
    });
    if (stateFilter === 'inactive') return data.filter(emp => {
      const val = emp.STATE;
      if (typeof val === 'boolean') return !val;
      if (typeof val === 'string') return val.toLowerCase() === 'false';
      if (typeof val === 'number') return val === 0;
      return false;
    });
    return data;
  }, [data, stateFilter]);


  // Return structured data to support pagination in the dialog
  const getDaysWorkedLog = async (
    emp: EMPLOYEE_WITH_LOG,
    withTimeline = true
  ): Promise<{
    headerHtml: string;
    timelineRows: string[];
    detailsHtml: string;
    footerHtml: string;
    currentBalance: number;
    totalDivisor: number;
  }> => {
    // Cache Q sums per (emp, month, year) to avoid duplicate requests when the divisor changes mid-month
    const sumQCache = new Map<string, number>();
    const getSumQForMonthYear = async (date: Date): Promise<number> => {
      if (!date || isNaN(date.getTime()) || !emp?.ID_EMP) return 0;
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const key = `${emp.ID_EMP}-${month}-${year}`;
      if (sumQCache.has(key)) return sumQCache.get(key) as number;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${apiUrlJsi}/getsum_q`, {
          params: { id_emp: emp.ID_EMP, month, year },
          headers: { Authorization: `Bearer ${token}` },
        });
        const totalQ = typeof res.data?.totalQ === 'number' ? res.data.totalQ : 0;
        sumQCache.set(key, totalQ);
        return totalQ;
      } catch (err: any) {
        // Surface request issues for debugging instead of silently swallowing
        console.warn('SumQ request failed', {
          empId: emp.ID_EMP,
          month,
          year,
          message: err?.message,
          status: err?.response?.status,
          data: err?.response?.data,
        });
        // On error fall back to zero to keep the dialog usable
        return 0;
      }
    };
    // Helper to render current balance formula with values
    const describeCurrentBalance = (opening: number, divisorSum: number, spent: number) => {
      const total = opening + divisorSum - spent;
      return `Current Balance = ${opening.toFixed(0)} + ${divisorSum.toFixed(0)} - ${spent.toFixed(0)} = ${total.toFixed(0)}`;
    };
    let isActive = false;
    const val = emp.STATE;
    if (typeof val === 'boolean') isActive = val;
    else if (typeof val === 'string') isActive = val.toLowerCase() === 'true';
    else if (typeof val === 'number') isActive = val === 1;
    const now = new Date();
    // Prefer `start_contrat_renouvellable` when available, otherwise fall back to legacy `STAR_CONTRAT`
    const startContract = emp.start_contrat_renouvellable
      ? new Date(emp.start_contrat_renouvellable as any)
      : (emp.STAR_CONTRAT ? new Date(emp.STAR_CONTRAT) : null);
    const endDate = (!isActive && emp.End_contrat) ? new Date(emp.End_contrat) : now;
    const birthDate = emp.date_naissance ? new Date(emp.date_naissance) : null;
    const openingBalance = emp.rasid_CONGE ? parseFloat(String(emp.rasid_CONGE)) : 0;
    // If required dates are missing, log the employee object for debugging and return early.
    if (!startContract || !endDate || isNaN(startContract.getTime()) || isNaN(endDate.getTime())) {
      return {
        headerHtml: `<tr><th>Date</th><th>New Annual Leave</th><th>Days Worked</th><th>Cumulative Balance</th></tr>`,
        timelineRows: [],
        detailsHtml: '',
        footerHtml: '',
        currentBalance: 0,
        totalDivisor: 0,
      };
    }
    // Determine whether the employee reaches 50 years of age (from date_naissance)
    // or 20 years of experience (from STAR_CONTRAT). If both happen, pick the
    // earliest date. The divisor should switch from 2.5 to 3.75 on that exact date.
    let date50: Date | null = null;
    if (birthDate && !isNaN(birthDate.getTime())) {
      const d = new Date(birthDate);
      d.setFullYear(d.getFullYear() + 50);
      date50 = d;
    }

    // For experience we must use the original STAR_CONTRAT field (not the
    // possibly-renewable start) as requested.
    let date20: Date | null = null;
    if (emp.STAR_CONTRAT) {
      const sc = new Date(emp.STAR_CONTRAT);
      if (!isNaN(sc.getTime())) {
        const d = new Date(sc);
        d.setFullYear(d.getFullYear() + 20);
        date20 = d;
      }
    }

    let conditionMet = '';
    let conditionDate: Date | null = null;
    // Choose earliest condition date (if any) between date50 and date20 regardless
    // of whether it falls inside the current contract period. We'll decide later
    // whether it affects the timeline (before start => all period at 3.75, within => split).
    if (date50 && date20) {
      if (date50 <= date20) {
        conditionMet = 'Reached 50 years old (from Birth Date)';
        conditionDate = date50;
      } else {
        conditionMet = '20 years of service (from Start Contract)';
        conditionDate = date20;
      }
    } else if (date50) {
      conditionMet = 'Reached 50 years old (from Birth Date)';
      conditionDate = date50;
    } else if (date20) {
      conditionMet = '20 years of service (from Start Contract)';
      conditionDate = date20;
    }
    // Format dates as 'MMM-dd-yyyy' for the dialog (e.g., Nov-05-2025)
    // Accept Date | string | number | null so callers that pass string dates
    // (e.g. from the API) won't cause date.getDate is not a function errors.
    const formatDate = (dateInput: Date | string | number | null) => {
      if (!dateInput && dateInput !== 0) return '';
      let date: Date;
      if (dateInput instanceof Date) {
        date = dateInput;
      } else {
        date = new Date(dateInput as any);
      }
      if (isNaN(date.getTime())) return '';
      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${month}-${day}-${year}`;
    };
    let details = '';
    // If there is a condition date inside the employment period, switch the
    // divisor to 3.75 starting on that exact date (inclusive). We treat the
    // day of the condition as part of the second period.
    if (conditionDate && conditionDate > startContract && conditionDate <= endDate) {
      // Two periods: before and after (including condition date in after)
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysBefore = Math.max(0, Math.floor((conditionDate.getTime() - startContract.getTime()) / msPerDay));
      // include the condition date in the 'after' period
      const daysAfter = Math.max(0, Math.floor((endDate.getTime() - conditionDate.getTime()) / msPerDay) + 1);
      const resultBefore = daysBefore / 2.5;
      const resultAfter = daysAfter / 3.75;
      const total = resultBefore + resultAfter;
      details = `
        <b>First period (before condition met)</b><br/>
        • From <b>${formatDate(startContract)}</b> to <b>${formatDate(conditionDate)}</b><br/>
        • Days: <b>${daysBefore}</b><br/>• Add: <b>2.5</b><br/>• Result: <b>${resultBefore.toFixed(0)}</b><br/>
        <b>Condition met:</b> <span style='color:#1976d2'><b>${conditionMet} on ${formatDate(conditionDate)}</b></span><br/>
        <b>Second period (after condition met)</b><br/>
        • From <b>${formatDate(conditionDate)}</b> to <b>${formatDate(endDate)}</b><br/>
        • Days: <b>${daysAfter}</b><br/>• Divisor: <b>3.75</b><br/>• Result: <b>${resultAfter.toFixed(0)}</b><br/>
        <b>Total result:</b> <span style='color:#388e3c'><b>${total.toFixed(0)}</b></span>
      `;
    } else if (conditionDate && conditionDate <= startContract) {
      // Condition met before or on start: all period at 3.75
      const daysWorked = Math.max(0, Math.floor((endDate.getTime() - startContract.getTime()) / (1000 * 60 * 60 * 24)));
      const result = daysWorked / 3.75;
      details = `
        <b>All period (since start):</b><br/>
        • From <b>${formatDate(startContract)}</b> to <b>${formatDate(endDate)}</b><br/>• Days: <b>${daysWorked}</b><br/>• Divisor: <b>3.75</b><br/>• Result: <b>${result.toFixed(0)}</b><br/>
 
      `;
    } else {
      // Condition never met: all period at 2.5
      const daysWorked = Math.max(0, Math.floor((endDate.getTime() - startContract.getTime()) / (1000 * 60 * 60 * 24)));
      const result = daysWorked / 2.5;
      details = `
        <b>All period (since start):</b><br/>
        • From <b>${formatDate(startContract)}</b> to <b>${formatDate(endDate)}</b><br/>• Days: <b>${daysWorked}</b><br/>• Divisor: <b>2.5</b><br/>• Result: <b>${result.toFixed(0)}</b><br/>
        <b>Condition not met during employment.</b>
      `;
    }
    // Build timeline rows (without header, for pagination in dialog)
    let timelineRows: string[] = [];
    // Tracks total accrual (divisor) before any leave deductions.
    let totalDivisor = 0; // excludes opening balance per request
    // Fetch leaves for this employee
    let leaves: any[] = [];
    try {
      // Debug: ensure the function actually runs and what employee was passed
      const token = localStorage.getItem('token');
      const url = `${apiUrlcongee}/by-employee/${emp.ID_EMP}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      // Log raw API response for debugging
      leaves = Array.isArray(res.data) ? res.data : [];
    } catch (err: any) {
      leaves = [];
      // Provide more detailed error logging: network, status and server payload

    }
    // Normalize fields and filter client-side: only annual leave type 'V'.
    if (leaves.length > 0) {
      leaves = leaves.map(lv => ({
        // normalize common possible field names
        date_depart: lv.date_depart || lv.DATE_DEPART || lv.dateDepart || lv.DATE_DEPART || null,
        nbr_jour: (lv.nbr_jour ?? lv.NBR_JOUR ?? lv.nbr_jour_demande ?? 0),
        type_congeee: (lv.type_congeee || lv.type_congee || lv.TYPE_CONGEE || '').toString(),
        id_emp: lv.id_emp ?? lv.ID_emp ?? lv.ID_EMP ?? null,
        raw: lv,
      })).filter(lv => (lv.type_congeee && String(lv.type_congeee).toUpperCase() === 'V'));

      // Log normalized and filtered leaves

      // NOTE: we keep leaves in the `leaves` array to apply deductions to the
      // timeline calculation, but we no longer render a separate "Leaves Taken"
      // table. That visual table has been removed per request.
    }
    let lastCumulative = 0;
    if (withTimeline && startContract && endDate) {
      let current = new Date(startContract);
      let end = new Date(endDate);
      // Opening balance (rasid_CONGE) added to cumulative balance
      let cumulativeDivisor = openingBalance;
      // Do not add opening balance to totalDivisor; footer should only sum accruals
      lastCumulative = cumulativeDivisor;
      // If condition date is before or on the start contract, the whole period uses 3.75
      const conditionBeforeOrOnStart = conditionDate && conditionDate <= startContract ? true : false;
      let divisor = conditionBeforeOrOnStart ? 3.75 : 2.5;
      let switchDate = conditionDate && conditionDate >= startContract && conditionDate <= endDate ? conditionDate : null;
      // If already before/on start, mark switched so we don't attempt to switch later
      let switched = conditionBeforeOrOnStart;
      // Pro-rate monthly accrual by actual days and subtract any Sum(Q) days.
      const calculateAccrual = (daysWorked: number, divisorValue: number, sumQValue: number) => {
        const safeDays = Math.max(0, daysWorked);
        const appliedQ = Math.min(Math.max(0, sumQValue || 0), safeDays);
        if (safeDays <= 0) return { accrual: 0, adjustedDays: 0, appliedQ: 0 };
        const adjustedDays = Math.max(0, safeDays - appliedQ);
        const accrual = (adjustedDays * divisorValue) / 30;
        return { accrual, adjustedDays, appliedQ };
      };
      // Opening balance row as the first data row
      timelineRows.push(`<tr><td>Opening balance</td><td>-</td><td>-</td><td>-</td><td>${cumulativeDivisor.toFixed(2)}</td></tr>`);
      while (current <= end) {
        let next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        let periodEnd = next < end ? new Date(next.getTime() - 1) : end;
        let periodStart = new Date(current);
        let daysInPeriod = Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const sumQForPeriod = await getSumQForMonthYear(periodStart);
        if (switchDate && !switched && switchDate >= periodStart && switchDate <= periodEnd) {
          let daysBeforeSwitch = Math.floor((switchDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
          if (daysBeforeSwitch > 0) {
            const qBefore = Math.min(sumQForPeriod, Math.round((sumQForPeriod * daysBeforeSwitch) / daysInPeriod));
            const before = calculateAccrual(daysBeforeSwitch, 2.5, qBefore);
            cumulativeDivisor += before.accrual;
            totalDivisor += before.accrual;
            lastCumulative = cumulativeDivisor;
            const daysDisplay = before.appliedQ > 0 ? `${before.adjustedDays} (raw ${daysBeforeSwitch})` : `${daysBeforeSwitch}`;
            const shownDivisorValue = before.accrual.toFixed(2);
            timelineRows.push(`<tr><td>${formatDate(periodStart)}</td><td>${shownDivisorValue}</td><td>${daysDisplay}</td><td>${before.appliedQ}</td><td>${cumulativeDivisor.toFixed(2)}</td></tr>`);
          }
          divisor = 3.75;
          switched = true;
          let daysAfterSwitch = daysInPeriod - daysBeforeSwitch;
          if (daysAfterSwitch > 0) {
            const qBefore = Math.min(sumQForPeriod, Math.round((sumQForPeriod * daysBeforeSwitch) / daysInPeriod));
            const qAfter = Math.max(0, sumQForPeriod - qBefore);
            const after = calculateAccrual(daysAfterSwitch, 3.75, qAfter);
            cumulativeDivisor += after.accrual;
            totalDivisor += after.accrual;
            lastCumulative = cumulativeDivisor;
            const daysDisplay = after.appliedQ > 0 ? `${after.adjustedDays} (raw ${daysAfterSwitch})` : `${daysAfterSwitch}`;
            const shownDivisorValue = after.accrual.toFixed(2);
            timelineRows.push(`<tr><td>${formatDate(switchDate)}</td><td>${shownDivisorValue}</td><td>${daysDisplay}</td><td>${after.appliedQ}</td><td>${cumulativeDivisor.toFixed(2)}</td></tr>`);
          }
        } else {
          const accrualInfo = calculateAccrual(daysInPeriod, divisor, sumQForPeriod);
          cumulativeDivisor += accrualInfo.accrual;
          totalDivisor += accrualInfo.accrual;
          lastCumulative = cumulativeDivisor;
          const daysDisplay = accrualInfo.appliedQ > 0 ? `${accrualInfo.adjustedDays} (raw ${daysInPeriod})` : `${daysInPeriod}`;
          const shownDivisorValue = accrualInfo.accrual.toFixed(2);
          timelineRows.push(`<tr><td>${formatDate(periodStart)}</td><td>${shownDivisorValue}</td><td>${daysDisplay}</td><td>${accrualInfo.appliedQ}</td><td>${cumulativeDivisor.toFixed(2)}</td></tr>`);
        }
        // After adding the monthly row, insert any leaves (annual) that fall inside this period
        if (leaves && leaves.length > 0) {
          // find leaves within this period
          const leavesInPeriod = leaves.filter(lv => {
            const d = new Date(lv.date_depart);
            return !isNaN(d.getTime()) && d >= periodStart && d <= periodEnd;
          }).sort((a, b) => new Date(a.date_depart).getTime() - new Date(b.date_depart).getTime());
          for (const lv of leavesInPeriod) {
            const deduct = parseFloat(String(lv.nbr_jour)) || 0;
            cumulativeDivisor = Math.max(0, cumulativeDivisor - deduct);
            lastCumulative = cumulativeDivisor;
            // Render leave deduction row with italic text and a light background to distinguish it
            timelineRows.push(`<tr style='font-style:italic;'><td>${formatDate(lv.date_depart)}</td><td>Spended Annual leave</td><td>${lv.nbr_jour}</td><td>-</td><td style='color:red;'>${cumulativeDivisor.toFixed(2)}</td></tr>`);
          }
        }
        current = next;
      }
    }
    const headerHtml = `<tr><th>Date</th><th>New Annual Leave</th><th>Days Worked</th><th>Sum(Q)</th><th>Cumulative Balance</th></tr>`;

    // Calculate total spended annual leave (sum of nbr_jour) limited to the employment period
    const totalSpentAnnual = (leaves || []).reduce((sum, lv) => {
      const v = parseFloat(String(lv.nbr_jour || 0));
      if (isNaN(v)) return sum;
      const d = new Date(lv.date_depart);
      const inRange = !isNaN(d.getTime()) && d >= startContract && d <= endDate;
      return inRange ? sum + v : sum;
    }, 0);

    // Current balance = opening balance + accrued divisor - leaves spent
    const computedCurrentBalance = openingBalance + totalDivisor - totalSpentAnnual;
    lastCumulative = computedCurrentBalance;

    const footer = `
      <div style='margin-top:12px;font-size:14px;font-weight:600; display:flex; gap:18px; align-items:center; flex-wrap:wrap;'>
        <span>Total Spended Annual leave: <span style='color:#d32f2f;'>${totalSpentAnnual.toFixed(0)}</span> days</span>
        <span>New Annual Leave : <span style='color:#1976d2;'>${totalDivisor.toFixed(0)}</span></span>
        <span>Current Balance: <span style='color:#388e3c;'>${computedCurrentBalance.toFixed(0)}</span></span>
      </div>
      <div style='margin-top:4px;font-size:13px;color:#555;'>${describeCurrentBalance(openingBalance, totalDivisor, totalSpentAnnual)}</div>
    `;

    return {
      headerHtml,
      timelineRows: withTimeline ? timelineRows : [],
      detailsHtml: details,
      footerHtml: footer,
      currentBalance: lastCumulative,
      totalDivisor,
    };
  };
  return (


  


      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button variant="outlined" size="small" onClick={() => setAnnualLeaveOpen(true)}>
            New Annual Leave
          </Button>
        </Box>
        <ALBalanceTable
          data={filteredData}
          loading={loading}
          stateFilter={stateFilter}
          setStateFilter={setStateFilter}
          onAddNew={handleAddNew}
          onExportExcel={handleExportExcel}
          onLogDialog={(emp) => { setLogDialogEmployee(emp); setLogDialogOpen(true); }}
          onFieldBreakLog={(emp) => { setFieldBreakDialogEmployee(emp); setFieldBreakDialogOpen(true); }}
          formatDate={formatDate}
        />
        <EmployeeDialog
          open={openDialog}
          isEditMode={isEditMode}
          editItem={editItem}
          errors={errors}
          onClose={handleCloseDialog}
          onSave={handleSave}
          setEditItem={(item) => setEditItem(item)}
        />
        {/* Async Days Worked Log Dialog */}
        {logDialogOpen && logDialogEmployee && (
          <DaysWorkedLogDialogAsync
            open={logDialogOpen}
            employee={logDialogEmployee}
            onClose={() => setLogDialogOpen(false)}
            getDaysWorkedLog={getDaysWorkedLog}
          />
        )}
        {fieldBreakDialogOpen && fieldBreakDialogEmployee && (
          <FieldBreakLogDialog
            open={fieldBreakDialogOpen}
            employee={fieldBreakDialogEmployee}
            onClose={() => { setFieldBreakDialogOpen(false); setFieldBreakDialogEmployee(null); }}
          />
        )}
        {annualLeaveOpen && (
          <AnnualLeaveDialog
            open={annualLeaveOpen}
            employees={data}
            onClose={() => setAnnualLeaveOpen(false)}
            onSaved={() => {
              fetchData();
            }}
          />
        )}
      </Box>  

  );
};

export default ALbalance;
