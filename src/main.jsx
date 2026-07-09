import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { GlobalStyle } from './styles/GlobalStyle';
import { UGFProvider } from '@tychilabs/react-ugf';
import './index.css';
import './styles/spectra-parity.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <GlobalStyle />
          <UGFProvider mode="testnet">
            <App />
          </UGFProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
