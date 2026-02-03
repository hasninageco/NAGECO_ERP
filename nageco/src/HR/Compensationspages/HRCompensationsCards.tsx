import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Divider } from '@mui/material';
// New appropriate icons
import StorefrontIcon from '@mui/icons-material/CalendarToday';

import { Button } from '@mui/material';
import ALbalance from './LeavesBalances/ALbalance';
 

const LeaveClarification = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <Typography variant="h5" component="div">
      Annual leave and field break rules (Libyan Labour Law, Article 75)
    </Typography>

    <Typography variant="body1">
      Article 75 of the Libyan Labour Law (No. 12 of 2010) requires employers to provide paid
      annual leave of no less than 30 calendar days per year after the employee completes 12
      months of service. Leave is normally earned on a monthly basis, and any unused balance must
      either be carried forward by agreement or paid out when the employment relationship ends.
    </Typography>

    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Annual leave calculation
      </Typography>
      <Box component="ul" sx={{ pl: 3, mt: 0 }}>
        <Typography component="li" variant="body2">
          Accrual: minimum 30 calendar days per full year of service (Article 75) - accrues at 2.5 days
          per month once the employee is eligible.
        </Typography>
        <Typography component="li" variant="body2">
          Pro-rating: for joiners or leavers in the middle of a month, accrue proportionally using
          balance = 30 x (months worked / 12) - approved leave taken.
        </Typography>
        <Typography component="li" variant="body2">
          Carry-over: the law allows leave to be taken in the year it is earned; carry-over or cash
          payout should follow company policy but cannot be less favorable than the statutory minimum.
        </Typography>
        <Typography component="li" variant="body2">
          Public holidays: official public holidays that fall inside approved leave do not count against
          the employee's annual leave balance.
        </Typography>
        <Typography component="li" variant="body2">
          Termination payout: accrued but untaken annual leave must be paid at the employee's last
          basic wage on exit.
        </Typography>
      </Box>
    </Box>

    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Field break (rotation) guidance
      </Typography>
      <Box component="ul" sx={{ pl: 3, mt: 0 }}>
        <Typography component="li" variant="body2">
          The labour law does not name "field break" explicitly; it treats prolonged field duty under
          working-hours and occupational safety provisions. As good practice, treat field breaks as
          compensatory rest and record them separately from annual leave.
        </Typography>
        <Typography component="li" variant="body2">
          Suggested formula when a policy exists: field break days = field days x r, where r is the agreed
          rest ratio (for example, 1/7 grants 1 break day for every 7 days in the field). Do not reduce the
          statutory annual leave below 30 days per year.
        </Typography>
        <Typography component="li" variant="body2">
          Scheduling: plan field breaks immediately after a rotation when practicable, ensure the
          employee's return-to-work date is clear, and log approvals to keep payroll and balance records
          consistent.
        </Typography>
        <Typography component="li" variant="body2">
          Health and safety: for extended or hazardous field assignments, increase rest ratios or add
          recovery days to remain compliant with duty-of-care obligations.
        </Typography>
      </Box>
    </Box>

    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Compliance guardrails
      </Typography>
      <Box component="ul" sx={{ pl: 3, mt: 0 }}>
        <Typography component="li" variant="body2">
          Never grant less than 30 calendar days of paid annual leave per year for full-time staff
          (Article 75 baseline).
        </Typography>
        <Typography component="li" variant="body2">
          Keep distinct balances for statutory annual leave and any company field-break scheme to avoid
          under-provisioning.
        </Typography>
        <Typography component="li" variant="body2">
          Document any enhanced entitlements or rotation ratios in policy so they can be applied
          consistently and audited.
        </Typography>
      </Box>
    </Box>
  </Box>
);


const cards = [
  {
    id: 1,
    title: 'Annual leave balance',
    description: 'Set up the Annual leave balance',
    icon: <StorefrontIcon fontSize="large" />,
    component: <ALbalance />,
  },
  // Removed clarification card
];

function SCSSettingsCards() {
  const [selectedCard, setSelectedCard] = React.useState<number | null>(null);
  if (selectedCard !== null) {
    const isAnnualLeaveBalance = cards[selectedCard]?.id === 1;
    return (
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => setSelectedCard(null)}
            sx={{
              borderRadius: 3,
              backgroundColor: '#424242',
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
              py: 1,
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            Back
          </Button>

         
        </Box>

        <Divider sx={{ mb: 0, borderColor: 'grey.600', borderBottomWidth: 2 }} />

        {cards[selectedCard].component}

        {!isAnnualLeaveBalance && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2, borderColor: 'grey.600', borderBottomWidth: 2 }} />
            <LeaveClarification />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 2fr))',
          gap: 2,
          pt: 2,
        }}
      >
        {cards.map((card, index) => (
          <Card key={card.id}>
            <CardActionArea
              onClick={() => setSelectedCard(index)}
              sx={{
                height: '100%',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <CardContent sx={{ height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {card.icon}
                  <Typography variant="h5" component="div">
                    {card.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ mb: 2, borderColor: 'grey.600', borderBottomWidth: 2 }} />
        <LeaveClarification />
      </Box>
    </>
  );
}


export default SCSSettingsCards;
