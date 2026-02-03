import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
// import { color } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend, ChartDataLabels);

export interface GL {
  Acc_No: string;
  Dibt: string;
  Cridt: string;
  Date: string;
}

interface Props {
  currentYearData: GL[];
  prevYearData: GL[];
  selectedYear: number;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
function getMonthlyRevenue(glData: GL[], year: number): number[] {
  const monthly = Array(12).fill(0);



  glData.forEach((item: GL) => {

    if (item.Acc_No && item.Acc_No.startsWith('5') && item.Date) {
      const date = new Date(item.Date);
      if (date.getFullYear() === year) {
        const month = date.getMonth();
        monthly[month] += (parseFloat(item.Cridt) || 0) - (parseFloat(item.Dibt) || 0);
      }
    }
  });
  return monthly;
}


const RevenueYearComparisonChart: React.FC<Props> = ({ currentYearData, prevYearData, selectedYear }) => {
  const currentYear = selectedYear;
  const prevYear = currentYear - 1;
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    const current = getMonthlyRevenue(currentYearData, currentYear);
    const previous = getMonthlyRevenue(prevYearData, prevYear);
    // Remove months where both years are zero
    const filtered = months.map((m, i) => ({
      month: m,
      current: current[i],
      previous: previous[i],
    })).filter(row => row.current !== 0 || row.previous !== 0);
    const filteredMonths = filtered.map(row => row.month);
    const filteredCurrent = filtered.map(row => row.current);
    const filteredPrevious = filtered.map(row => row.previous);
    setChartData({
      labels: filteredMonths,
      datasets: [
      {
        label: prevYear.toString(),
        data: filteredPrevious,
        fill: true,
        backgroundColor: 'rgba(54, 162, 235, 0.2)', // blue area
        borderColor: 'rgba(54, 162, 235, 1)',
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        tension: 0.4,
      },
      {
        label: currentYear.toString(),
        data: filteredCurrent,
        fill: true,
        backgroundColor: 'rgba(255, 206, 86, 0.2)', // yellow area
        borderColor: 'rgba(255, 206, 86, 1)',
        pointBackgroundColor: 'rgba(255, 206, 86, 1)',
        tension: 0.4,
      },
      ],
    });
  }, [currentYearData, prevYearData, selectedYear, currentYear, prevYear]);

  if (!chartData) return <Box>Loading...</Box>;



  // Chart options for area chart
  const options: import('chart.js').ChartOptions<'line'> = {
   
    indexAxis: 'y', // Invert axes: months on y, values on x
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',

        labels: {

           
          font: { size: 14, weight: 'bold' },
        },
      },

      title: {
       
        display: true,
        text: 'Year over Year Revenue Analysis',
        font: { size: 18, weight: 700 },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function (context: any) {
            const val = context.dataset.data[context.dataIndex];
            return `${context.dataset.label}: ${val?.toLocaleString()} LYD`;
          }
        }
      },
      // disable datalabels so only the tooltip appears
      datalabels: {
        display: false,
      }
    },
    scales: {

      y: {
        
        type: 'category',
        ticks: {
          font: { weight: 600 },
         
        },
      },
      x: {
        beginAtZero: true,
        ticks: {
          font: { weight: 600 },
           
        },
      },
    },
    elements: {
 
      line: {
        borderWidth: 2, 
 
      },
      point: {
        radius: 4,
      },
    },
  };

  // Update chartData colors for dark mode


  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 180 }}>
      <Line

        data={chartData}
        options={options}
        style={{ width: '100%', height: '100%' }}
      />
    </Box>
  );
};

export default RevenueYearComparisonChart;
