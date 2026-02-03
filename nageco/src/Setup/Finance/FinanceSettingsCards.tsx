import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Divider } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SchemaIcon from '@mui/icons-material/Schema';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CategoryIcon from '@mui/icons-material/Category';
import Currency from './Pages/Currency';
import TypeFonds from './Pages/TypeFonds';
import Coa from './Pages/Coa';
const cards = [
  {
    id: 1,
    title: 'Currency',
    description: 'Set up the currency for the system.',
    icon: <AttachMoneyIcon fontSize="large" />,
    component: <Currency/>,
  },
  {
    id: 2,
    title: 'Chart of Accounts',
    description: 'Set up the chart of accounts for the company.',
    icon: <SchemaIcon fontSize="large" />,
    component: <Coa/>,
  },
  {
    id: 3,
    title: 'Accounts distribution',
    description: 'Set up the accounts distribution.',
    icon: <AccountTreeIcon fontSize="large" />,
  },
  {
    id: 4,
    title: 'Assets Types',
    description: 'Set up the assets types',
    icon: <CategoryIcon fontSize="large" />,
    component: <TypeFonds/>,
  },
];

function FinanceSettingsCards() {
 
 
  const [selectedCard, setSelectedCard] = React.useState<number | null>(null);

  if (selectedCard !== null) {
    return (
      <Box sx={{ p: 3, ml: -3,mt: -3  }}>
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
  );
}

export default FinanceSettingsCards;
