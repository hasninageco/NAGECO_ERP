import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import type { GL } from './ExpenseYearComparisonChart';
import { buildApiUrl } from '../../utils/api';



import { Button, ButtonGroup } from '@mui/material';
const ExpenseYearComparisonChart = require('./ExpenseYearComparisonChart').default;
const RevenueChartBox = ({ cardBorder }: { cardBorder: string }) => {
  const thisYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(thisYear);
  const [yearData, setYearData] = useState<{ [year: number]: GL[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLoading(true);
    const code = 6;
    const financeUrl = buildApiUrl('/DsFinance/allR');
    Promise.all([
      fetch(`${financeUrl}?year=${selectedYear}&code=${code}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json()),
      fetch(`${financeUrl}?year=${selectedYear - 1}&code=${code}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json()),
      fetch(`${financeUrl}?year=${selectedYear - 2}&code=${code}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json()),
    ])
      .then(([y1, y2, y3]) => {
        setYearData({
          [selectedYear]: Array.isArray(y1) ? y1 : [],
          [selectedYear - 1]: Array.isArray(y2) ? y2 : [],
          [selectedYear - 2]: Array.isArray(y3) ? y3 : [],
        });
      })
      .catch(() => {
        setYearData({ [selectedYear]: [], [selectedYear - 1]: [], [selectedYear - 2]: [] });
      })
      .finally(() => setLoading(false));
  }, [selectedYear]);

  // Chart always compares selected year and previous year
  const currentYear = selectedYear;
  const prevYear = selectedYear - 1;
  const currentYearData = yearData[currentYear] || [];
  const prevYearData = yearData[prevYear] || [];

  return (
    <Box
      flex={1}
      minWidth={0}
      sx={{
        border: cardBorder,
        borderRadius: 2,
        pt: 1,
        height: { xs: 180, sm: 600 },
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'stretch',
        fontSize: 32,
        fontWeight: 600,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Box sx={{ width: '100%', height: '90%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <ButtonGroup variant="contained" color="secondary">
            {[thisYear, thisYear - 1, thisYear - 2].map((year) => (
              <Button
                size="small"
                key={year}
                onClick={() => setSelectedYear(year)}
                disabled={selectedYear === year}
              >
                {year}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
        <ExpenseYearComparisonChart currentYearData={currentYearData} prevYearData={prevYearData} selectedYear={currentYear} />
      </Box>
    </Box>
  );
};

export default RevenueChartBox;
