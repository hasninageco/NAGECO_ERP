

import { Box } from '@mui/material';
import AgePyramid from './AgePyramid';

import RevenueChartBox from './RevenueChartBox';
import ExpenseChartBox from './ExpenseChartBox';
import PaymentPieBox from './PaymentPieBox';
import RequisitionCountBox from './RequisitionCountBox';
import ProductSummaryBox from './ProductSummaryBox';





const DashboardMain = () => {
  const theme = require('@mui/material/styles').useTheme();
  const cardBorder = theme.palette.mode === 'dark' ? '1px solid #23224a' : '1px solid #e0e0e0';

  return (
    <Box
          sx={{
          '& .MuiPaper-root': { backgroundColor: 'transparent', boxShadow: 'none' },
          '& .MuiTableContainer-root': { backgroundColor: 'transparent' },
          '& .MuiTableRow-root': { backgroundColor: 'transparent' },
          '& .MuiTableHead-root .MuiTableCell-root': { color: 'rgba(255,255,255,0.9)' },
          '& .MuiTableBody-root .MuiTableCell-root': { color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
        }}
    >
      {/* Row 1 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
        }}
      ><PaymentPieBox cardBorder={cardBorder} />

        <RequisitionCountBox cardBorder={cardBorder} />
        <ProductSummaryBox cardBorder={cardBorder} />

        <Box flex={{ xs: 'unset', sm: 2 }} minWidth={0} sx={{ bgcolor: 'inherit',
           border: cardBorder, borderRadius: 2, p: 0, height: { xs: 120, sm: 220 },
            display: 'flex', alignItems: 'stretch', justifyContent: 'stretch', position: 'relative' }}>
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, p: 2 }}>
            <Box sx={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ width: { xs: 80, sm: 120, md: 150 }, maxWidth: '100%', height: 'auto' }}>
                <AgePyramid />
              </Box>
            </Box>
          </Box>
        </Box>

      </Box>
      {/* Row 2 (merged 5 & 9, map) */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
        }}
      >
        <Box flex={2} minWidth={0} sx={{ bgcolor: 'inherit', border: cardBorder, borderRadius: 2, p: 2, height: { xs: 180, sm: 600 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {(() => {
            const LibyaMapBox = require('./LibyaMapBox').default;
            return <LibyaMapBox />;
          })()}
        </Box>

        <RevenueChartBox cardBorder={cardBorder} />


        <ExpenseChartBox cardBorder={cardBorder} />

      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
        }}
      >
      </Box>
    </Box>
  );

};

export default DashboardMain;
