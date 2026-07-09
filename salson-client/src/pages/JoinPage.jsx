import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function JoinPage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleJoin = async () => {
    if (!joinCode.trim() || joinCode.length !== 6) {
      setError('Please enter a valid 6-digit game PIN.');
      return;
    }
    if (!nickname.trim()) {
      setError('Please enter a nickname.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const participant = await api.joinSession(joinCode.trim(), nickname.trim());
      navigate(`/play/${joinCode}`, { state: { participant, joinCode, nickname } });
    } catch (err) {
      setError('Invalid game PIN or the game is no longer accepting players.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">

      {/* Brand */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-black text-gray-900">
          Sal<span className="text-primary">son</span>
        </h1>
        <p className="text-gray-500 mt-2">Enter your game PIN to join</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-md w-full max-w-sm p-8">

        {error && (
          <div className="bg-red-50 border border-danger text-danger text-sm px-4 py-3 rounded-xl mb-5">
            {error}
          </div>
        )}

        {/* PIN input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Game PIN
          </label>
          <input
            type="number"
            placeholder="e.g. 123456"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={6}
            className="w-full px-4 py-3 text-2xl font-bold text-center tracking-widest border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Nickname input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nickname
          </label>
          <input
            type="text"
            placeholder="e.g. QuizWizard"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={20}
            className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Join button */}
        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full py-4 bg-primary hover:bg-primary-dark text-white text-xl font-bold rounded-2xl transition-colors disabled:opacity-50"
        >
          {loading ? 'Joining...' : 'Join Game'}
        </button>

        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="w-full mt-3 py-3 text-gray-400 hover:text-gray-600 text-sm transition-colors"
        >
          ← Back to home
        </button>

      </div>
    </div>
  );
}

export default JoinPage;