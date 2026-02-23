import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './auth';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import { ToastProvider } from './context/ToastContext';
import App from './App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <UserProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </UserProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);
