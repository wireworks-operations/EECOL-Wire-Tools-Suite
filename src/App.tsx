import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import CuttingRecords from './pages/CuttingRecords';
import InventoryRecords from './pages/InventoryRecords';
import MarkCalculator from './pages/MarkCalculator';
import WeightCalculator from './pages/WeightCalculator';
import Reports from './pages/Reports';

function App() {
  return (
    <Router basename="/EECOL-Wire-Tools-Suite">
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cutting-records" element={<CuttingRecords />} />
          <Route path="/inventory-records" element={<InventoryRecords />} />
          <Route path="/mark-calculator" element={<MarkCalculator />} />
          <Route path="/weight" element={<WeightCalculator />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
