import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HostDashboard from './pages/HostDashboard';
import HostLobby from './pages/HostLobby';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/host/dashboard" element={<HostDashboard />} />
          <Route path="/host/lobby/:sessionId" element={<HostLobby />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;