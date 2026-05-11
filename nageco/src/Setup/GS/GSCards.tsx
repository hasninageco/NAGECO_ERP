import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Divider } from '@mui/material';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import UsersList from './Pages/UsersList';

type GSCard = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  component?: React.ReactNode;
};

const cards: GSCard[] = [
  {
    id: 1,
    title: 'Works Period',
    description: 'Create or set a work period for all users.',
    icon: <AccessTimeIcon fontSize="large" />,
  },
  {
    id: 2,
    title: 'Users list',
    description: 'List of all end users.',
    icon: <GroupIcon fontSize="large" />,
    component: <UsersList />,
  },
  {
    id: 3,
    title: 'Server Mail',
    description: 'Set up the server mail for sending emails.',
    icon: <MarkEmailUnreadIcon fontSize="large" />,
  },
  {
    id: 4,
    title: 'Chart of Accounts levels',
    description: 'Chart of accounts levels for the system.',
    icon: <AccountTreeIcon fontSize="large" />,
  },
  {
    id: 5,
    title: 'Fingerprint',
    description: 'Set up the fingerprint for the system.',
    icon: <FingerprintIcon fontSize="large" />,
  },
];

function SelectActionCard() {
  const [selectedCard, setSelectedCard] = React.useState<number | null>(null);

  if (selectedCard !== null && cards[selectedCard]?.component) {
    return (
      <Box sx={{ p: 3, ml: -3, mt: -3 }}>
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
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 2fr))',
        gap: 2,
        pt: 5,
      }}
    >
      {cards.map((card, index) => (
        <Card key={card.id}>
          <CardActionArea
            onClick={() => {
              if (card.component) {
                setSelectedCard(index);
              }
            }}
            disabled={!card.component}
            data-active={selectedCard === index ? '' : undefined}
            sx={{
              height: '100%',
              opacity: card.component ? 1 : 0.6,
              '&[data-active]': {
                backgroundColor: 'action.selected',
                '&:hover': {
                  backgroundColor: 'action.selectedHover',
                },
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
  );
}

export default SelectActionCard;
