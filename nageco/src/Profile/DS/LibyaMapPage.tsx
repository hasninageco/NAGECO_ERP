import React from 'react';
import { Box, Typography } from '@mui/material';

// Simple SVG map of Libya (placeholder, can be replaced with a more detailed map)
const LibyaMap = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
    <svg width="220" height="220" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="220" height="220" rx="24" fill="#e0e0e0" />
      <path d="M60 60 Q80 40 120 60 Q160 80 180 120 Q160 180 100 180 Q60 160 60 120 Q40 100 60 60 Z" fill="#2d7c5b" stroke="#1b4d3e" strokeWidth="3" />
      <text x="110" y="115" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="bold">ليبيا</text>
    </svg>
  </Box>
);

const LibyaMapPage = () => (
  <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
    <Typography variant="h4" mb={3}>خريطة ليبيا</Typography>
    <LibyaMap />
  </Box>
);

export default LibyaMapPage;
