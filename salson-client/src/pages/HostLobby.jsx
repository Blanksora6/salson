import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

function HostLobby() {
  const { sessionId } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [participants] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = 'https://localhost:7296/api/auth/login';
    }
  }, [user, loading]);

  useEffect(() => {
    if (sessionId) {
      api.getSession(sessionId)
        .then(setSession)
        .catch(err => setError(err.message));
    }
  }, [sessionId]);

  const handleStartGame = () => {
    navigate(`/host/game/${sessionId}`);
  };

  if (loading || !session) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-gray-500 text-lg">Loading lobby...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">

      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-gray-900">
          Sal<span className="text-primary">son</span>
        </h1>
        <p className="text-gray-500 mt-2">Share this code with your players</p>
      </div>

      {/* Join Code */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-lg px-16 py-10 mb-8 text-center">
        <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Game PIN</p>
        <p className="text-7xl font-black text-gray-900 tracking-widest">
          {session.joinCode}
        </p>
        <p className="text-gray-400 text-sm mt-3">
          Join at <span className="text-primary font-semibold">localhost:3000</span>
        </p>
      </div>

      {/* Players */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-600 font-semibold">
            Players joined
          </p>
          <span className="bg-primary text-white text-sm font-bold px-3 py-1 rounded-full">
            {session.participantCount}
          </span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 min-h-24 flex flex-wrap gap-2">
          {session.participantCount === 0 ? (
            <p className="text-gray-400 text-sm w-full text-center py-4">
              Waiting for players to join...
            </p>
          ) : (
            participants.map(p => (
              <span
                key={p.id}
                className="bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold"
              >
                {p.nickname}
              </span>
            ))
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-danger text-danger px-4 py-3 rounded-xl mb-6 w-full max-w-lg">
          {error}
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={handleStartGame}
        className="w-full max-w-lg py-4 bg-accent hover:bg-yellow-500 text-white text-xl font-bold rounded-2xl transition-colors shadow-md"
      >
        Start Game →
      </button>

    </div>
  );
}

export default HostLobby;