import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

type Props = {
  title: string;
  size?: number;
};

const InsuranceHeaderTitle: React.FC<Props> = ({ title, size = 32 }) => {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
      <Box
        component="img"
        src="/nag-insurance.png"
        alt="Insurance"
        sx={{ height: size, width: 'auto', display: 'block' }}
      />
      <Typography variant="h6">{title}</Typography>
    </Stack>
  );
};

export default InsuranceHeaderTitle;
