import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomerList from '@/pages/CustomerList';
import CustomerDetail from '@/pages/CustomerDetail';
import AgentConfig from '@/pages/AgentConfig';
import Payments from '@/pages/Payments';
import Sidebar from '@/components/layout/Sidebar';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-300">
        <Sidebar />
        <main className="transition-all duration-300">
          <Routes>
            <Route path="/" element={<CustomerList />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/agent" element={<AgentConfig />} />
            <Route path="/payments" element={<Payments />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
