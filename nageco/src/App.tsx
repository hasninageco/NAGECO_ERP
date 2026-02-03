import { AppProvider } from '@toolpad/core';
import './App.css';
import Home from './Profile/Home';
 
import AuthLogin from './Users/AuthLogin';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
// Theme is handled per-page (Home) with MUI ThemeProvider and local preference

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<AuthLogin />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
