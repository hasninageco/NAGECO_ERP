import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Divider } from '@mui/material';
// New appropriate icons
import StorefrontIcon from '@mui/icons-material/Storefront';
import CategoryIcon from '@mui/icons-material/Category';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import Products from './Pages/Products';
import { Button } from '@mui/material';
import ProductCategories from './Pages/ProductCategories';
import Vendors from './Pages/Vendors';

const cards = [
  {
    id: 1,
    title: 'Vendors',
    description: 'Set up the vendors.',
    icon: <StorefrontIcon fontSize="large" />,
    component: <Vendors />,
  },
  {
    id: 2,
    title: 'Product Categories',
    description: 'Set up the product categories.',
    icon: <CategoryIcon fontSize="large" />,
     component: <ProductCategories />,
  },
  {
    id: 3,
    title: 'Product Cards',
    description: 'Set up the product cards.',
    icon: <Inventory2Icon fontSize="large" />,
    component: <Products />,
  },
];

function SCSSettingsCards() {
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
  );
}


export default SCSSettingsCards;
