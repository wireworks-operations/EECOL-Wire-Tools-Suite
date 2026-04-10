import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import CuttingRecords from './pages/CuttingRecords';
import InventoryRecords from './pages/InventoryRecords/index';
import MarkCalculator from './pages/MarkCalculator';
import StopMark from './pages/StopMark';
import WeightCalculator from './pages/WeightCalculator';
import ReelCapacity from './pages/ReelCapacity';
import ReelSize from './pages/ReelSize';
import ShippingManifest from './pages/ShippingManifest';
import ReelLabels from './pages/ReelLabels';
import Maintenance from './pages/Maintenance';
import AdvancedMath from './pages/AdvancedMath';
import About from './pages/About';
import Reports from './pages/Reports';
import DatabaseConfig from './pages/DatabaseConfig';
import Education from './pages/Education';
import Privacy from './pages/Privacy';

function App() {
  return (
    <Router basename="/EECOL-Wire-Tools-Suite">
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cutting-records" element={<CuttingRecords />} />
          <Route path="/inventory-records" element={<InventoryRecords />} />
          <Route path="/mark-calculator" element={<MarkCalculator />} />
          <Route path="/stop-mark" element={<StopMark />} />
          <Route path="/weight" element={<WeightCalculator />} />
          <Route path="/reel-capacity" element={<ReelCapacity />} />
          <Route path="/reel-size" element={<ReelSize />} />
          <Route path="/shipping-manifest" element={<ShippingManifest />} />
          <Route path="/reel-labels" element={<ReelLabels />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/advanced-math" element={<AdvancedMath />} />
          <Route path="/about" element={<About />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/database" element={<DatabaseConfig />} />
          <Route path="/education" element={<Education />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
