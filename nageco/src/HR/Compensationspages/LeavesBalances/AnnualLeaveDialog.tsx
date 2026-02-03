import * as React from 'react';
import axios from 'axios';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { buildApiUrl } from '../../../utils/api';
import type { EMPLOYEE } from './ALBalanceTable';

export type AnnualLeaveDialogProps = {
  open: boolean;
  onClose: () => void;
  employees: EMPLOYEE[];
  onSaved?: () => void;
};

export default function AnnualLeaveDialog(props: AnnualLeaveDialogProps) {
  const { open, onClose, employees, onSaved } = props;
  const apiUrlCongee = buildApiUrl('/Lleaves');
  const apiUrlWw = buildApiUrl('/wws');
  const apiUrlHolidays = buildApiUrl('/holidays');
  const [snack, setSnack] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Controls how requested days/end date stay in sync:
  // - 'requested': user types requested days => we compute end date from start date
  // - 'dates': user picks end date => we compute requested days from dates
  const requestedSyncModeRef = React.useRef<'requested' | 'dates'>('dates');

  const filterOptions = React.useMemo(() => {
    return createFilterOptions<EMPLOYEE>({
      stringify: (emp) => `${emp.NAME ?? ''} ${emp.Ref_emp ?? ''}`,
      trim: true,
    });
  }, []);

  const [form, setForm] = React.useState({
    id_emp: '' as string | number,
    type_congeee: 'V', // Annual leave
    date_depart: '',
    date_end: '',
    date_retour: '',
    nbr_jour_demande: 0,
    jour_furier: 0,
    nbr_jour: 0,
    Cause: '',
  });

  type WW = {
    int_can: number;
    desig_can: string | null;
    code: string | null;
  };

  type Holiday = {
    ID_HOLIDAYS: number;
    DATE_H: string | null;
    COMMENT_H: string | null;
    IN_CALL: boolean | null;
  };

  type HolidayCheckDay = {
    date: string;
    exists: boolean;
    ID_HOLIDAYS: number | null;
    COMMENT_H: string | null;
    IN_CALL: boolean | null;
  };

  const [vacationTypes, setVacationTypes] = React.useState<Array<{ int_can: number; desig_can: string; code: string }>>([]);
  const [vacationTypesLoading, setVacationTypesLoading] = React.useState(false);

  const [holidaysRows, setHolidaysRows] = React.useState<Holiday[]>([]);
  const [holidayDays, setHolidayDays] = React.useState<HolidayCheckDay[]>([]);

  const [calendarValue, setCalendarValue] = React.useState<Dayjs>(() => dayjs());

  const isWeekendFriSat = React.useCallback((d: Dayjs) => {
    const dow = d.day();
    return dow === 5 || dow === 6;
  }, []);

  const vacationTypeFilterOptions = React.useMemo(() => {
    return createFilterOptions<{ int_can: number; desig_can: string; code: string }>({
      stringify: (t) => `${t.desig_can ?? ''} ${t.code ?? ''}`,
      trim: true,
    });
  }, []);

  const vacationTypeOptions = React.useMemo(() => {
    if (vacationTypes.length > 0) return vacationTypes;
    return [
      { int_can: 0, desig_can: 'Annual Leave', code: 'V' },
      { int_can: -1, desig_can: 'Emergency Leave', code: 'E' },
    ];
  }, [vacationTypes]);

  const selectedVacationType = React.useMemo(() => {
    const code = (form.type_congeee ?? '').toString().trim();
    if (!code) return null;
    return vacationTypeOptions.find((t) => (t.code ?? '').toString().trim() === code) ?? null;
  }, [form.type_congeee, vacationTypeOptions]);

  React.useEffect(() => {
    if (!open) {
      // reset when closing
      requestedSyncModeRef.current = 'dates';
      setForm({
        id_emp: '',
        type_congeee: 'V',
        date_depart: '',
        date_end: '',
        date_retour: '',
        nbr_jour_demande: 0,
        jour_furier: 0,
        nbr_jour: 0,
        Cause: '',
      });

      setVacationTypes([]);
      setVacationTypesLoading(false);

      setHolidaysRows([]);
      setHolidayDays([]);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const d = form.date_depart ? dayjs(form.date_depart) : null;
    setCalendarValue(d && d.isValid() ? d : dayjs());
  }, [open, form.date_depart]);

  React.useEffect(() => {
    if (!open) return;

    let alive = true;
    const token = localStorage.getItem('token');
    if (!token) return;

    setVacationTypesLoading(true);
    axios
      .get<WW[]>(`${apiUrlWw}/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!alive) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        const normalized = rows
          .map((r) => ({
            int_can: Number(r.int_can),
            desig_can: (r.desig_can ?? '').toString().trim(),
            code: (r.code ?? '').toString().trim(),
          }))
          .filter((r) => !!r.code);

        setVacationTypes(normalized);

        // If current value isn't in list, default to first available option.
        if (normalized.length > 0) {
          setForm((f) => {
            const current = (f.type_congeee ?? '').toString().trim();
            const exists = normalized.some((t) => t.code === current);
            return exists ? f : { ...f, type_congeee: normalized[0].code };
          });
        }
      })
      .catch(() => {
        if (!alive) return;
        setVacationTypes([]);
      })
      .finally(() => {
        if (!alive) return;
        setVacationTypesLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [open, apiUrlWw]);

  // Fetch holiday existence (and holiday ID) for each date in the visible period:
  // From Date -> Work Date (if available), otherwise From Date -> To Date.
  React.useEffect(() => {
    if (!open) return;

    const start = form.date_depart ? dayjs(form.date_depart) : null;
    const endPrimary = form.date_retour ? dayjs(form.date_retour) : null;
    const endFallback = form.date_end ? dayjs(form.date_end) : null;
    const end = endPrimary && endPrimary.isValid() ? endPrimary : endFallback;

    if (!start || !end || !start.isValid() || !end.isValid()) {
      setHolidayDays([]);
      setHolidaysRows([]);
      return;
    }

    const from = (start.isAfter(end) ? end : start).format('YYYY-MM-DD');
    const to = (start.isAfter(end) ? start : end).format('YYYY-MM-DD');

    let alive = true;
    const token = localStorage.getItem('token');
    if (!token) return;

    axios
      .get<{ from: string; to: string; days: HolidayCheckDay[] }>(
        `${apiUrlHolidays}/check-period`,
        {
          params: { from, to },
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => {
        if (!alive) return;
        const days = Array.isArray(res.data?.days) ? res.data.days : [];
        setHolidayDays(days);

        // Convert back into the existing Holiday[] shape used by the calculation logic.
        const holidaysInRange: Holiday[] = days
          .filter((d) => d.exists && !!d.ID_HOLIDAYS)
          .map((d) => ({
            ID_HOLIDAYS: Number(d.ID_HOLIDAYS),
            DATE_H: d.date,
            COMMENT_H: d.COMMENT_H ?? null,
            IN_CALL: d.IN_CALL ?? null,
          }));
        setHolidaysRows(holidaysInRange);
      })
      .catch(() => {
        if (!alive) return;
        setHolidayDays([]);
        setHolidaysRows([]);
      })
      .finally(() => {
        // no loading UI
      });

    return () => {
      alive = false;
    };
  }, [open, apiUrlHolidays, form.date_depart, form.date_end, form.date_retour]);

  // Work Date (date_retour) = From Date + Day Requested, then shift forward if Fri/Sat or holiday.
  React.useEffect(() => {
    if (!open) return;

    const start = form.date_depart ? dayjs(form.date_depart) : null;
    const requested = Number(form.nbr_jour_demande || 0);

    if (!start || !start.isValid() || requested <= 0) {
      if (form.date_retour) setForm((f) => ({ ...f, date_retour: '' }));
      return;
    }

    // As requested: work date = from date + day requested
    let candidate = start.add(requested, 'day');

    // Always skip Fri/Sat locally first
    while (isWeekendFriSat(candidate)) {
      candidate = candidate.add(1, 'day');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      const s = candidate.format('YYYY-MM-DD');
      if (s !== form.date_retour) setForm((f) => ({ ...f, date_retour: s }));
      return;
    }

    let alive = true;
    const from = candidate.format('YYYY-MM-DD');
    const to = candidate.add(60, 'day').format('YYYY-MM-DD');

    axios
      .get<{ from: string; to: string; days: HolidayCheckDay[] }>(
        `${apiUrlHolidays}/check-period`,
        {
          params: { from, to },
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => {
        if (!alive) return;
        const days = Array.isArray(res.data?.days) ? res.data.days : [];
        const holidaySet = new Set<string>(days.filter((d) => d.exists).map((d) => d.date));

        let next = candidate;
        for (let i = 0; i <= 60; i++) {
          const s = next.format('YYYY-MM-DD');
          if (!isWeekendFriSat(next) && !holidaySet.has(s)) {
            if (s !== form.date_retour) setForm((f) => ({ ...f, date_retour: s }));
            return;
          }
          next = next.add(1, 'day');
        }
      })
      .catch(() => {
        if (!alive) return;
        const s = candidate.format('YYYY-MM-DD');
        if (s !== form.date_retour) setForm((f) => ({ ...f, date_retour: s }));
      });

    return () => {
      alive = false;
    };
  }, [open, form.date_depart, form.nbr_jour_demande, form.date_retour, apiUrlHolidays, isWeekendFriSat]);

  React.useEffect(() => {
    if (!open) return;

    const start = form.date_depart ? dayjs(form.date_depart) : null;
    const end = form.date_end ? dayjs(form.date_end) : null;
    if (!start || !end || !start.isValid() || !end.isValid()) {
      if (form.jour_furier !== 0) setForm((f) => ({ ...f, jour_furier: 0 }));
      return;
    }

    // Ensure start <= end
    const from = start.isAfter(end) ? end : start;
    const to = start.isAfter(end) ? start : end;
    const days = to.diff(from, 'day');

    const excludedDates = new Set<string>();

    // Count Fridays & Saturdays inside the period (inclusive)
    for (let i = 0; i <= days; i++) {
      const d = from.add(i, 'day');
      const dow = d.day();
      if (dow === 5 || dow === 6) {
        excludedDates.add(d.format('YYYY-MM-DD'));
      }
    }

    // Add holidays from HOLIDAYS table inside the period (inclusive)
    for (const h of holidaysRows) {
      if (!h?.DATE_H) continue;
      const hd = dayjs(h.DATE_H);
      if (!hd.isValid()) continue;
      if (hd.isBefore(from, 'day') || hd.isAfter(to, 'day')) continue;
      excludedDates.add(hd.format('YYYY-MM-DD'));
    }

    const computed = excludedDates.size;
    if (Number(form.jour_furier || 0) === computed) return;
    setForm((f) => ({ ...f, jour_furier: computed }));
  }, [open, form.date_depart, form.date_end, holidaysRows, form.jour_furier]);

  React.useEffect(() => {
    if (!open) return;
    if (requestedSyncModeRef.current !== 'dates') return;

    const start = form.date_depart ? dayjs(form.date_depart) : null;
    const end = form.date_end ? dayjs(form.date_end) : null;
    if (!start || !end || !start.isValid() || !end.isValid()) return;

    const requested = Math.max(0, end.diff(start, 'day') + 1); // inclusive
    if (requested === form.nbr_jour_demande) return;

    setForm((f) => ({ ...f, nbr_jour_demande: requested }));
  }, [open, form.date_depart, form.date_end, form.nbr_jour_demande]);

  React.useEffect(() => {
    if (!open) return;
    if (requestedSyncModeRef.current !== 'requested') return;

    const requested = Number(form.nbr_jour_demande || 0);
    const start = form.date_depart ? dayjs(form.date_depart) : null;
    if (!start || !start.isValid() || requested <= 0) return;

    const end = start.add(requested - 1, 'day'); // inclusive
    const endStr = end.format('YYYY-MM-DD');
    if (endStr === form.date_end) return;

    setForm((f) => ({ ...f, date_end: endStr }));
  }, [open, form.date_depart, form.nbr_jour_demande, form.date_end]);

  React.useEffect(() => {
    const requested = Number(form.nbr_jour_demande || 0);
    const holidays = Number(form.jour_furier || 0);
    const net = Math.max(0, requested - holidays);
    if (net === form.nbr_jour) return;
    setForm((f) => ({ ...f, nbr_jour: net }));
  }, [form.nbr_jour_demande, form.jour_furier, form.nbr_jour]);

  const handleChange = (field: keyof typeof form, value: any) => {
    if (field === 'nbr_jour_demande') requestedSyncModeRef.current = 'requested';
    if (field === 'date_end') requestedSyncModeRef.current = 'dates';
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toDayjs = React.useCallback((value: string) => {
    if (!value) return null;
    const d = dayjs(value);
    return d.isValid() ? d : null;
  }, []);

  const fromDayjs = React.useCallback((value: Dayjs | null) => {
    if (!value || !value.isValid()) return '';
    return value.format('YYYY-MM-DD');
  }, []);

  const handleSave = async () => {
    if (!form.id_emp || !form.date_depart || !form.date_end) {
      setSnack({ type: 'error', message: 'Employee, From date and To date are required' });
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${apiUrlCongee}/Add`,
        {
          id_emp: Number(form.id_emp),
          type_congeee: form.type_congeee,
          date_depart: form.date_depart,
          date_end: form.date_end,
          date_retour: form.date_retour || null,
          nbr_jour_demande: form.nbr_jour_demande,
          jour_furier: form.jour_furier,
          nbr_jour: form.nbr_jour,
          Cause: form.Cause,
          date_creation: new Date().toISOString(),
          state: 'pending',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnack({ type: 'success', message: 'Annual leave added' });
      onSaved?.();
      onClose();
    } catch (err: any) {
      setSnack({ type: 'error', message: err?.response?.data?.message || 'Save failed' });
    }
  };

  const selectedEmployee = React.useMemo(() => {
    if (!form.id_emp) return null;
    const id = Number(form.id_emp);
    return employees.find((e) => Number(e.ID_EMP) === id) ?? null;
  }, [employees, form.id_emp]);

  const rangeFromTo = React.useMemo(() => {
    const start = form.date_depart ? dayjs(form.date_depart) : null;
    const end = form.date_end ? dayjs(form.date_end) : null;
    if (!start || !end || !start.isValid() || !end.isValid()) return { from: null as Dayjs | null, to: null as Dayjs | null };
    return start.isAfter(end) ? { from: end, to: start } : { from: start, to: end };
  }, [form.date_depart, form.date_end]);

  const holidayInfoByDate = React.useMemo(() => {
    const map = new Map<string, HolidayCheckDay>();
    for (const d of holidayDays) {
      if (!d?.date) continue;
      map.set(d.date, d);
    }
    return map;
  }, [holidayDays]);

  const returnDay = React.useMemo(() => {
    const d = form.date_retour ? dayjs(form.date_retour) : null;
    return d && d.isValid() ? d : null;
  }, [form.date_retour]);

  type CalendarDayProps = PickersDayProps & {
    day: Dayjs;
    rangeFrom: Dayjs | null;
    rangeTo: Dayjs | null;
    holidayInfoByDate: Map<string, HolidayCheckDay>;
    returnDay: Dayjs | null;
  };

  function CalendarDay(props: CalendarDayProps) {
    const { day, outsideCurrentMonth, rangeFrom, rangeTo, holidayInfoByDate, returnDay, ...other } = props;

    const key = day.format('YYYY-MM-DD');
    const holiday = holidayInfoByDate.get(key);
    const isHoliday = !!holiday?.exists;
    const isWeekend = day.day() === 5 || day.day() === 6; // Fri/Sat

    const isStart = !!rangeFrom && day.isSame(rangeFrom, 'day');
    const isEnd = !!rangeTo && day.isSame(rangeTo, 'day');
    const isInRange = !!rangeFrom && !!rangeTo && (day.isSame(rangeFrom, 'day') || day.isSame(rangeTo, 'day') || (day.isAfter(rangeFrom, 'day') && day.isBefore(rangeTo, 'day')));

    const isReturn = !!returnDay && day.isSame(returnDay, 'day');

    // Priority: start/end > holiday > weekend-in-range > in-range > weekend
    const daySx = (theme: any) => {
      const sx: any = {};

      if (isStart || isEnd) {
        sx.backgroundColor = theme.palette.primary.main;
        sx.color = theme.palette.primary.contrastText;
        sx['&:hover, &:focus'] = { backgroundColor: theme.palette.primary.dark };
      } else if (isHoliday && !outsideCurrentMonth) {
        sx.backgroundColor = theme.palette.error.main;
        sx.color = theme.palette.error.contrastText;
        sx['&:hover, &:focus'] = { backgroundColor: theme.palette.error.dark };
      } else if (isWeekend && isInRange && !outsideCurrentMonth) {
        sx.backgroundColor = theme.palette.success.light;
        sx.color = theme.palette.getContrastText(theme.palette.success.light);
        sx['&:hover, &:focus'] = { backgroundColor: theme.palette.success.main, color: theme.palette.success.contrastText };
      } else if (isInRange && !outsideCurrentMonth) {
        sx.backgroundColor = theme.palette.primary.light;
        sx.color = theme.palette.getContrastText(theme.palette.primary.light);
        sx['&:hover, &:focus'] = { backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText };
      } else if (isWeekend && !outsideCurrentMonth) {
        sx.color = theme.palette.text.disabled;
      }

      if (isReturn && !outsideCurrentMonth) {
        sx.border = `2px solid ${theme.palette.success.main}`;
        sx.boxSizing = 'border-box';
      }

      return sx;
    };

    const tooltip = (() => {
      if (isStart) return 'Vacation start';
      if (isEnd) return 'Vacation end';
      if (isHoliday) {
        const id = holiday?.ID_HOLIDAYS != null ? `ID ${holiday.ID_HOLIDAYS}` : 'Holiday';
        const comment = (holiday?.COMMENT_H ?? '').toString().trim();
        return comment ? `${id}: ${comment}` : id;
      }
      if (isWeekend && isInRange) return 'Weekend (Fri/Sat) in period';
      if (isWeekend) return 'Weekend (Fri/Sat)';
      if (isInRange) return 'Vacation day';
      if (isReturn) return 'Work/Return date';
      return '';
    })();

    const dayNode = (
      <PickersDay
        {...other}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        sx={daySx}
      />
    );

    // Avoid empty tooltip wrappers
    if (!tooltip) return dayNode;
    return (
      <Tooltip title={tooltip} arrow>
        <span>{dayNode}</span>
      </Tooltip>
    );
  }

  const DaySlot = (dayProps: PickersDayProps) => (
    <CalendarDay
      {...dayProps}
      rangeFrom={rangeFromTo.from}
      rangeTo={rangeFromTo.to}
      holidayInfoByDate={holidayInfoByDate}
      returnDay={returnDay}
    />
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          width: '65vw',
          maxWidth: 1200,
        },
      }}
    >
      <DialogTitle>Vacation Entry</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack direction={{   md: 'row' }}   alignItems="flex-start">
              {/* Left: Form */}
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Stack spacing={2}>
                  {/* Row 1: Employee */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Autocomplete
                      size="small"
                      sx={{ width: { xs: '100%', sm: 520 }, maxWidth: 520 }}
                      options={employees}
                      value={selectedEmployee}
                      filterOptions={filterOptions}
                      isOptionEqualToValue={(option, value) => Number(option.ID_EMP) === Number(value.ID_EMP)}
                      getOptionLabel={(emp) => `${emp?.NAME ?? ''} (${emp?.Ref_emp ?? ''})`}
                      onChange={(_, value) => handleChange('id_emp', value ? value.ID_EMP : '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Employee"
                          placeholder="Type to search"
                        />
                      )}
                      renderOption={(optionProps, emp) => (
                        <li {...optionProps} key={emp.ID_EMP}>
                          {emp.NAME} ({emp.Ref_emp})
                        </li>
                      )}
                    />
                  </Stack>

                  {/* Row 2: Vacation Type */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Autocomplete
                      size="small"
                      sx={{ width: { xs: '100%', sm: 520 }, maxWidth: 520 }}
                      options={vacationTypeOptions}
                      value={selectedVacationType}
                      loading={vacationTypesLoading}
                      filterOptions={vacationTypeFilterOptions}
                      isOptionEqualToValue={(option, value) => (option.code ?? '').toString() === (value.code ?? '').toString()}
                      getOptionLabel={(t) => `${t?.desig_can ?? ''}${t?.code ? ` (${t.code})` : ''}`}
                      onChange={(_, value) => handleChange('type_congeee', value ? value.code : '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Vacation Type"
                          placeholder="Type to search"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {vacationTypesLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      renderOption={(optionProps, t) => (
                        <li {...optionProps} key={`${t.int_can}-${t.code}`}>
                          {t.desig_can || t.code}
                          {t.code ? ` (${t.code})` : ''}
                        </li>
                      )}
                    />
                  </Stack>

                  {/* Row 3: Dates */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap flexWrap="wrap">
                    <TextField
                      label="Day Requested"
                      type="number"
                      size="small"
                      value={form.nbr_jour_demande}
                      onChange={(e) => handleChange('nbr_jour_demande', Math.max(0, Number(e.target.value || 0)))}
                      sx={{ width: 120 }}
                    />

                    <DatePicker
                      label="From Date"
                      value={toDayjs(form.date_depart)}
                      onChange={(value) => handleChange('date_depart', fromDayjs(value))}
                      slotProps={{
                        textField: {
                          size: 'small',
                          sx: { width: 200 },
                        },
                      }}
                    />

                    <DatePicker
                      label="To Date"
                      value={toDayjs(form.date_end)}
                      onChange={(value) => handleChange('date_end', fromDayjs(value))}
                      slotProps={{
                        textField: {
                          size: 'small',
                          sx: { width: 200 },
                        },
                      }}
                    />
                  </Stack>

                  {/* Row 4: Numbers */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap flexWrap="wrap">
                     

                    <TextField
                      label="Net Vacation"
                      type="number"
                      size="small"
                      value={form.nbr_jour}
                      InputProps={{ readOnly: true }}
                      sx={{ width: 120 }}
                    />

                    <TextField
                      type="date"
                      label="Work Date"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={form.date_retour}
                      InputProps={{ readOnly: true }}
                      sx={{ width: 200 }}
                    />
                  </Stack>

                  {/* Row 5: Note */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Note"
                      size="small"
                      value={form.Cause}
                      onChange={(e) => handleChange('Cause', e.target.value)}
                      multiline
                      minRows={2}
                      sx={{ width: { xs: '100%', sm: 520 }, maxWidth: 520 }}
                    />
                  </Stack>
                </Stack>
              </Box>

              {/* Right: Calendar */}
              <Box
                sx={{
                  width: { xs: '100%', md: 360 },
                  minWidth: { xs: '100%', md: 360 },
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1,
                }}
              >
                <Typography variant="subtitle2" sx={{ px: 1, pt: 0.5 }}>
                  Calendar
                </Typography>
                <DateCalendar
                  value={calendarValue}
                  onChange={(value) => {
                    if (!value) return;
                    setCalendarValue(value);
                  }}
                  slots={{ day: DaySlot }}
                  sx={{
                    '& .MuiPickersCalendarHeader-root': { px: 1 },
                  }}
                />

                <Stack spacing={0.5} sx={{ px: 1, pb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Colors: Start/End (blue), In-range (light blue), Holiday (red), Fri/Sat in period (green), Work Date (green border)
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </LocalizationProvider>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Net = Day Requested - Holidays (computed automatically)
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
      {snack ? (
        <Snackbar open autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity={snack.type} variant="filled" onClose={() => setSnack(null)}>
            {snack.message}
          </Alert>
        </Snackbar>
      ) : null}
    </Dialog>
  );
}
