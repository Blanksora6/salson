import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HostDashboard from './pages/HostDashboard';
import HostLobby from './pages/HostLobby';
import HostGame from './pages/HostGame';
import JoinPage from './pages/JoinPage';
import PlayerGame from './pages/PlayerGame';
import CreateQuizPage from './pages/CreateQuizPage';
import EditQuizPage from './pages/EditQuizPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/host/dashboard" element={<HostDashboard />} />
          <Route path="/host/lobby/:sessionId" element={<HostLobby />} />
          <Route path="/host/game/:sessionId" element={<HostGame />} />
          <Route path="/host/quiz/create" element={<CreateQuizPage />} />
          <Route path="/host/quiz/:quizId/edit" element={<EditQuizPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/play/:joinCode" element={<PlayerGame />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;