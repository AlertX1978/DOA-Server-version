import { useState } from 'react';
import { useTheme } from './context/ThemeContext';
import { useUser } from './context/UserContext';
import { ProtectedRoute } from './auth';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import OpportunityCalculator from './components/calculator/OpportunityCalculator';
import DOABrowser from './components/browser/DOABrowser';
import HelpPanel from './components/help/HelpPanel';
import AdminPanel from './components/admin/AdminPanel';

export default function App() {
  const { theme } = useTheme();
  const { isAdmin } = useUser();
  const [activeTab, setActiveTab] = useState('calculator');

  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', backgroundColor: theme.pageBg }}>
        <Header activeTab={activeTab} onTabChange={setActiveTab} />

        <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px' }}>
          {activeTab === 'calculator' && <OpportunityCalculator />}
          {activeTab === 'browse' && <DOABrowser />}
          {activeTab === 'help' && <HelpPanel />}
          {activeTab === 'admin' && isAdmin && <AdminPanel />}
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
