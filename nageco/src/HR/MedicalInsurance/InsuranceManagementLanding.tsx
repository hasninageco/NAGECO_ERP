import React from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { useTranslation } from 'react-i18next';

type Props = {
  onOpen: (path: string) => void;
};

const InsuranceManagementLanding: React.FC<Props> = ({ onOpen }) => {
  const { t } = useTranslation();

  return (
    <Box p={2}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Box
          component="img"
          src="/nag-insurance.png"
          alt="Insurance"
          sx={{ height: 48, width: 'auto', display: 'block' }}
        />
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          {t('insurance.title')}
        </Typography>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        }}
      >
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <MedicalServicesIcon sx={{ fontSize: 48 }} />
                {t('insurance.landing.servicesTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('insurance.landing.servicesLine1')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('insurance.landing.servicesLine2')}
              </Typography>
              <Box sx={{ mt: 1, display: 'grid', gap: 0.25 }}>
                <Typography variant="caption" color="text.secondary">
                  • {t('insurance.landing.servicesB1')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  • {t('insurance.landing.servicesB2')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  • {t('insurance.landing.servicesB3')}
                </Typography>
              </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
              <Button variant="contained" onClick={() => onOpen('/medicalInsurance/services')}>
                {t('common.open')}
              </Button>
            </CardActions>
          </Card>

        
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LocalHospitalIcon sx={{ fontSize: 48 }} />
                {t('insurance.landing.providersTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('insurance.landing.providersLine1')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('insurance.landing.providersLine2')}
              </Typography>
              <Box sx={{ mt: 1, display: 'grid', gap: 0.25 }}>
                <Typography variant="caption" color="text.secondary">
                  • {t('insurance.landing.providersB1')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  • {t('insurance.landing.providersB2')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  • {t('insurance.landing.providersB3')}
                </Typography>
              </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
              <Button variant="contained" onClick={() => onOpen('/medicalInsurance/providers')}>
                {t('common.open')}
              </Button>
            </CardActions>
          </Card>

        
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ReceiptLongIcon sx={{ fontSize: 48 }} />
                {t('insurance.landing.claimsTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('insurance.landing.claimsLine1')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('insurance.landing.claimsLine2')}
              </Typography>
              <Box sx={{ mt: 1, display: 'grid', gap: 0.25 }}>
                <Typography variant="caption" color="text.secondary">
                  • {t('insurance.landing.claimsB1')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  • {t('insurance.landing.claimsB2')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  • {t('insurance.landing.claimsB3')}
                </Typography>
              </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
              <Button variant="contained" onClick={() => onOpen('/medicalInsurance/claims')}>
                {t('common.open')}
              </Button>
            </CardActions>
          </Card>

          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <MonetizationOnIcon sx={{ fontSize: 48 }} />
                {t('insurance.landing.financeTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('insurance.landing.financeLine1')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('insurance.landing.financeLine2')}
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
              <Button variant="contained" onClick={() => onOpen('/medicalInsurance/finance')}>
                {t('common.open')}
              </Button>
            </CardActions>
          </Card>
      </Box>
    </Box>
  );
};

export default InsuranceManagementLanding;
