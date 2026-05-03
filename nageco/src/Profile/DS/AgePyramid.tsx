import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Button, Menu, MenuItem } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { buildApiUrl } from '../../utils/api';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

// Lightweight plugin to draw values on top of each bar (AgePyramid only)
const valueLabelsPlugin: any = {
  id: 'valueLabels',
  afterDatasetsDraw(chart: any, _args: any) {
    // Only run for this chart when explicitly configured and chart type is bar
    const pluginOptions = chart?.options?.plugins?.valueLabels;
    if (!pluginOptions || chart?.config?.type !== 'bar') return;

    const { ctx } = chart;
    const color = pluginOptions.color || '#222';
    const fontSize = pluginOptions.font?.size || 11;
    const fontWeight = pluginOptions.font?.weight || 'bold';
    const yOffset = pluginOptions.yOffset ?? 6;

    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar: any, index: number) => {
        const rawVal = dataset.data?.[index];
        const value = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal);
        if (!Number.isFinite(value)) return;
        const pos = bar.tooltipPosition();
        ctx.save();
        ctx.fillStyle = color;
        ctx.font = `${fontWeight} ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(value), pos.x, pos.y - yOffset);
        ctx.restore();
      });
    });
  }
};

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, valueLabelsPlugin);

const AGE_RANGES = [
  { label: '18-25', min: 18, max: 25 },
  { label: '26-35', min: 26, max: 35 },
  { label: '36-45', min: 36, max: 45 },
  { label: '46-55', min: 46, max: 55 },
  { label: '56-65', min: 56, max: 65 },
  { label: '66+', min: 66, max: 200 },
];

function calculateAge(dateString: string | undefined): number | null {
  if (!dateString) return null;
  const birthDate = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

interface AgeStat {
  label: string;
  count: number;
}

interface Employee {
  date_naissance?: string;
  investissement?: string;
}

const AgePyramid: React.FC = () => {
  const [stats, setStats] = useState<AgeStat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [investissements, setInvestissements] = useState<string[]>([]);
  const [selectedInvestissement, setSelectedInvestissement] = useState<string>('ALL');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchor);
  const openMenu = (e: React.MouseEvent<HTMLButtonElement>) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);
  const selectInv = (val: string) => { setSelectedInvestissement(val); closeMenu(); };

  const computeStats = (list: Employee[], inv: string): AgeStat[] => {
    const base = inv === 'ALL' ? list : list.filter(e => (e.investissement || '').toString() === inv);
    return AGE_RANGES.map(range => ({
      label: range.label,
      count: base.filter((emp: Employee) => {
        const age = calculateAge(emp.date_naissance as any);
        return age !== null && age >= range.min && age <= range.max;
      }).length
    }));
  };

  useEffect(() => {
    const fetchAges = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Not authenticated: missing token');
          setLoading(false);
          return;
        }

        // Call backend with absolute URL to avoid proxy issues
        const res = await axios.get<Employee[]>(buildApiUrl('/employees/all'), {
          headers: { Authorization: `Bearer ${token}` }
        });

        const employeesData = res.data;
 

        setEmployees(employeesData);
        // collect unique investissements ignoring null/empty
        const invs = Array.from(
          new Set(
            (employeesData as Employee[])
              .map(e => (e.investissement || '').toString().trim())
              .filter(v => v && v.length > 0)
          )
        ).sort((a, b) => a.localeCompare(b));
        setInvestissements(invs);
        setStats(computeStats(employeesData, 'ALL'));
      } catch (err: any) {
        console.error('Failed to load employees for AgePyramid:', err);
        setError(err?.response?.data?.message || err?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchAges();
  }, []);

  useEffect(() => {
    setStats(computeStats(employees, selectedInvestissement));
  }, [employees, selectedInvestissement]);

  const barData = {
    labels: stats.map(s => s.label),
    datasets: [
      {
        data: stats.map(s => s.count),
        backgroundColor: [
          '#1976d2', '#2196f3', '#64b5f6', '#90caf9', '#bbdefb', '#e3f2fd'
        ],
        borderWidth: 1,
        borderRadius: 4,
        // Make bars use more of the available horizontal space
        barPercentage: 0.95,
        categoryPercentage: 0.95,
      },
    ],
  };

  const barOptions = {
    plugins: {
      legend: {
        display: false,
        position: 'bottom' as const,
        labels: {
          font: { size: 10 },
          color: '#222',
        }
      },
      tooltip: { enabled: true },
      valueLabels: {
        color: '#222',
        font: { size: 11, weight: 'bold' },
        yOffset: 6
      }
    },
    maintainAspectRatio: false,
    responsive: true,
    layout: { padding: { top: 8, bottom: 4, left: 4, right: 4 } },
    scales: {
      x: {
        title: { display: true, text: 'Age ranges' },
        ticks: { maxRotation: 0, autoSkip: false },
        offset: true,
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        title: { display: false, text: 'Employees' },
        ticks: { precision: 0 },
        grid: { color: 'rgba(0,0,0,0.08)' }
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', py: 2, textAlign: 'center' }}>
        <Typography variant="body2">Loading age distribution…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100%', py: 2, textAlign: 'center' }}>
        <Typography color="error" variant="body2">{error}</Typography>
      </Box>
    );
  }

  const total = stats.reduce((sum, s) => sum + s.count, 0);

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {total === 0 ? (
        <Typography variant="body2" color="text.secondary">No employee age data available</Typography>
      ) : (
        <Box
          sx={{
           
            width: '250%',
            maxWidth: '250%',
            position: 'relative',
         
            // Adaptive height by breakpoint for better readability
            height: { xs: 130, sm: 150, md: 180, lg: 210 },
            px: 0,
          }}
        >
          <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1, zIndex: 1 }}>
            <Button
              variant="contained"
              color="secondary"
              size="small"
              onClick={openMenu}
              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 1.25, py: 0.5 }}
            >
              {selectedInvestissement === 'ALL' ? 'ALL' : selectedInvestissement}
            </Button>
            <Menu
              anchorEl={menuAnchor}
              open={menuOpen}
              onClose={closeMenu}
              PaperProps={{ sx: { borderRadius: 2 } }}
            >
              <MenuItem
                selected={selectedInvestissement==='ALL'}
                onClick={() => selectInv('ALL')}
                sx={{
                  textTransform: 'none',
                  '&.Mui-selected': { bgcolor: 'secondary.main', color: '#fff' },
                  '&.Mui-selected:hover': { bgcolor: 'secondary.dark' }
                }}
              >
                ALL
              </MenuItem>
              {investissements.map(inv => (
                <MenuItem
                  key={inv}
                  selected={selectedInvestissement===inv}
                  onClick={() => selectInv(inv)}
                  sx={{
                    '&.Mui-selected': { bgcolor: 'secondary.main', color: '#fff' },
                    '&.Mui-selected:hover': { bgcolor: 'secondary.dark' }
                  }}
                >
                  {inv}
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <Bar data={barData} options={barOptions} style={{ width: '100%', height: '100%' }} />
        </Box>
      )}
    </Box>
  );
};

export default AgePyramid;
