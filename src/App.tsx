import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Categories from '@/pages/Categories';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';

function App() {
  // Listen for deep links (GoCardless callback)
  useEffect(() => {
    const removeListener = window.ipcRenderer.on('gocardless:callback', async (url: string) => {
      console.log('Received callback URL:', url);
      try {
        await window.ipcRenderer.invoke('gocardless:complete-connection', url);
        // Refresh transactions if on that page
        window.ipcRenderer.send('transactions:updated'); // We might need to add this listener in main or just rely on manual refresh
        alert('Bank account linked successfully!');
        window.location.reload(); // Simple way to refresh data
      } catch (error: any) {
        console.error('Failed to complete connection:', error);
        alert(`Failed to link bank: ${error.message}`);
      }
    });
    return () => removeListener();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="categories" element={<Categories />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;