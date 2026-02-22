import { BrowserRouter, Routes, Route } from 'react-router-dom';
import EditorShell from './components/layout/EditorShell';

// Page components
import DashboardPage from './components/dashboard/DashboardPage';
import BrowseItemsPage from './components/browse-items/BrowseItemsPage';
import DOAItemsPage from './components/doa-items/DOAItemsPage';
import CategoriesPage from './components/categories/CategoriesPage';
import RolesPage from './components/roles/RolesPage';
import ThresholdsPage from './components/thresholds/ThresholdsPage';
import CountriesPage from './components/countries/CountriesPage';
import GlossaryPage from './components/glossary/GlossaryPage';
import SettingsPage from './components/settings/SettingsPage';
import AuditLogPage from './components/audit-log/AuditLogPage';
import ImportExportPage from './components/import-export/ImportExportPage';

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <BrowserRouter>
      <EditorShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/browse-items" element={<BrowseItemsPage />} />
          <Route path="/doa-items" element={<DOAItemsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/thresholds" element={<ThresholdsPage />} />
          <Route path="/countries" element={<CountriesPage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
          <Route path="/import-export" element={<ImportExportPage />} />
        </Routes>
      </EditorShell>
    </BrowserRouter>
  );
}
