import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HubConnectionBuilder } from '@microsoft/signalr';

function JoinPage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState(null);
  const [connected, setConnected] = useState(false);

  const joinCodeRef = useRef(joinCode);
  const nicknameRef = useRef(nickname);

  useEffect(() => {
    joinCodeRef.current = joinCode;
  }, [joinCode]);

  useEffect(() => {
    nicknameRef.current = nickname;
  }, [nickname]);

  useEffect(() => {
    const conn = new HubConnectionBuilder()
      .withUrl('http://localhost:5187/hubs/kahoot', {
        withCredentials: true
      })
      .withAutomaticReconnect()
      .build();

    conn.onreconnected(() => {
      setConnected(true);
    });

    conn.on('LobbyUpdated', () => {
      const code = joinCodeRef.current;
      const name = nicknameRef.current;
      navigate(`/play/${code}`, {
        state: { nickname: name, joinCode: code }
      });
    });

    conn.on('Error', (msg) => {
      setError(typeof msg === 'string' ? msg : 'Failed to join game.');
      setLoading(false);
    });

    conn.start()
      .then(() => {
        setConnection(conn);
        setConnected(true);
      })
      .catch(() => {
        setConnection(conn);
      });

    return () => conn.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoin = async () => {
    if (!joinCode.trim() || joinCode.length !== 6) {
      setError('Please enter a valid 6-digit game PIN.');
      return;
    }
    if (!nickname.trim()) {
      setError('Please enter a nickname.');
      return;
    }
    if (!connected) {
      setError('Connecting to server, please try again in a moment.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await connection.invoke('JoinSession', joinCode.trim(), nickname.trim());
    } catch (err) {
      setError('Invalid game PIN or the game is no longer accepting players.');
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">

      <div className="mb-10 text-center">
        <h1 className="text-5xl font-black text-gray-900">
          Sal<span className="text-primary">son</span>
        </h1>
        <p className="text-gray-500 mt-2">Enter your game PIN to join</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-md w-full max-w-sm p-8">

        {error && (
          <div className="bg-red-50 border border-danger text-danger text-sm px-4 py-3 rounded-xl mb-5">
            {error}
          </div>
        )}

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
            className="w-full px-4 py-3 text-2xl font-bold text-center tracking-widest border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors"
          />
        </div>

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

        <button
          onClick={handleJoin}
          disabled={loading || !connected}
          className="w-full py-4 bg-primary hover:bg-primary-dark text-white text-xl font-bold rounded-2xl transition-colors disabled:opacity-50"
        >
          {loading ? 'Joining...' : connected ? 'Join Game' : 'Connecting...'}
        </button>

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