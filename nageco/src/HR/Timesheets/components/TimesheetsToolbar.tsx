import * as React from 'react';
import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CalculateIcon from '@mui/icons-material/Calculate';
import EventNoteIcon from '@mui/icons-material/EventNote';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import type { EmployeeTypeFilter } from '../types';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export type TimesheetsToolbarProps = {
  month: number;
  year: number;
  employeeType: EmployeeTypeFilter;
  dirtyCount: number;
  loading?: boolean;
  searchText: string;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onEmployeeTypeChange: (type: EmployeeTypeFilter) => void;
  onRefresh: () => void;
  onSave: () => void;
  onSearchTextChange: (value: string) => void;
  onFind: () => void;
  onClearSearch: () => void;
};

export default function TimesheetsToolbar(props: TimesheetsToolbarProps) {
  const {
    month,
    year,
    employeeType,
    dirtyCount,
    loading,
    searchText,
    onMonthChange,
    onYearChange,
    onEmployeeTypeChange,
    onRefresh,
    onSave,
    onSearchTextChange,
    onFind,
    onClearSearch,
  } = props;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="ts-month-label">Month</InputLabel>
            <Select
              labelId="ts-month-label"
              label="Month"
              value={month}
              onChange={(e) => onMonthChange(Number(e.target.value))}
            >
              {MONTHS.map((m, idx) => (
                <MenuItem key={m} value={idx + 1}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Year"
            type="number"
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            inputProps={{ min: 2000, max: 2100 }}
            sx={{ width: 120 }}
          />

          <ToggleButtonGroup
            size="small"
            exclusive
            value={employeeType}
            onChange={(_, v) => {
              if (!v) return;
              onEmployeeTypeChange(v);
            }}
            aria-label="employee type"
          >
            <ToggleButton value="national">National</ToggleButton>
            <ToggleButton value="expat">Expat</ToggleButton>
            <ToggleButton value="all">All</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', md: 'block' } }} />

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={onSave}
            disabled={loading || dirtyCount === 0}
          >
            Save{dirtyCount > 0 ? ` (${dirtyCount})` : ''}
          </Button>
          <Button size="small" variant="outlined" startIcon={<UploadFileIcon />} disabled>
            Import Time Sheets
          </Button>
          <Button size="small" variant="outlined" startIcon={<CalculateIcon />} disabled>
            Calc. Time Sheets
          </Button>
          <Button size="small" variant="outlined" startIcon={<EventNoteIcon />} disabled>
            New Vacation
          </Button>
        </Stack>

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={1} alignItems="center"   useFlexGap sx={{ ml: 'auto' }}>
          <TextField
            size="small"
            placeholder="Enter text to search..."
            value={searchText}
            onChange={(e) => onSearchTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onFind();
            }}
            sx={{ width: 260 }}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={onFind}
            disabled={loading}
          >
            Find
          </Button>
          <Button
            size="small"
            variant="text"
            startIcon={<ClearIcon />}
            onClick={onClearSearch}
            disabled={loading || !searchText}
          >
            Clear
          </Button>
        </Stack>

       
      </Stack>
    </Box>
  );
}
