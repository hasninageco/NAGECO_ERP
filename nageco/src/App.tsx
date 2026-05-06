import { AppProvider } from '@toolpad/core';
import './App.css';
import Home from './Profile/Home';
 import SupplyChainPage from "./SupplyChain/SupplyChainPage";
import { BrowserRouter, Route, Routes } from 'react-router-dom';
 import AuthLogin from './Users/AuthLogin';
// Theme is handled per-page (Home) with MUI ThemeProvider and local preference

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<AuthLogin />} />
          <Route path="/supply-chain/*" element={<SupplyChainPage />} />
           <Route path="/home" element={<Home />} />
    
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
