import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { useAuth } from '../hooks/useAuth';

function HostGame() {
  const { sessionId } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [connection, setConnection] = useState(null);
  const [question, setQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = 'https://localhost:7296/api/auth/login';
    }
  }, [user, loading]);

  useEffect(() => {
    const conn = new HubConnectionBuilder()
      .withUrl('http://localhost:5187/hubs/kahoot', {
        withCredentials: true
      })
      .withAutomaticReconnect()
      .build();

    conn.on('QuestionStarted', (q) => {
      setQuestion(q);
      setQuestionIndex(q.questionIndex);
      setTotalQuestions(q.totalQuestions);
      setTimeLeft(q.timeLimitSeconds);
      setAnsweredCount(0);
    });

    conn.on('LeaderboardUpdated', (lb) => {
      setLeaderboard(Array.isArray(lb) ? lb : []);
      setAnsweredCount(Array.isArray(lb) ? lb.length : 0);
    });

    conn.on('GameEnded', () => {
      setGameEnded(true);
    });

    conn.on('Error', (msg) => {
      setError(typeof msg === 'string' ? msg : 'An error occurred.');
    });

    conn.start()
      .then(() => setConnection(conn))
      .catch(() => setError('Failed to connect to game server.'));

    return () => conn.stop();
  }, [sessionId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleNextQuestion = async () => {
    if (!connection) return;
    try {
      await connection.invoke('NextQuestion', sessionId, questionIndex + 1);
    } catch (err) {
      setError('Failed to advance question.');
    }
  };

  const handleEndGame = async () => {
    if (!connection) return;
    try {
      await connection.invoke('EndGame', sessionId);
    } catch (err) {
      setError('Failed to end game.');
    }
  };

  if (gameEnded) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-gray-900 mb-2">Game Over!</h1>
        <p className="text-gray-500">Final Results</p>
      </div>
      <div className="bg-white rounded-3xl border border-gray-200 shadow-md w-full max-w-md p-6 mb-8">
        {leaderboard.map((p, i) => (
          <div
            key={i}
            className={`flex items-center justify-between py-3 px-4 rounded-xl mb-2 ${i === 0 ? 'bg-accent text-white' : 'bg-gray-50'}`}
          >
            <div className="flex items-center gap-3">
              <span className="font-black text-lg">{i + 1}</span>
              <span className="font-semibold">{String(p.nickname)}</span>
            </div>
            <span className="font-bold">{p.totalScore} pts</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate('/host/dashboard')}
        className="px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-900">
          Sal<span className="text-primary">son</span>
        </h1>
        <div className="flex items-center gap-4">
          {question && (
            <span className="text-gray-500 text-sm">
              Question {questionIndex + 1} of {totalQuestions}
            </span>
          )}
          {timeLeft !== null && (
            <span className={`font-black text-2xl ${timeLeft <= 5 ? 'text-danger' : 'text-gray-700'}`}>
              {timeLeft}s
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6">

        {/* Question panel */}
        <div className="flex-1">
          {question ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-6 text-center">
                <p className="text-2xl font-bold text-gray-900">{String(question.text)}</p>
                <p className="text-gray-400 text-sm mt-3">
                  {answeredCount} player{answeredCount !== 1 ? 's' : ''} answered
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {Array.isArray(question.options) && question.options.map((option, i) => {
                  const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];
                  return (
                    <div
                      key={option.id || i}
                      className={`${colors[i % 4]} text-white font-bold py-6 px-4 rounded-2xl text-lg text-center`}
                    >
                      {String(option.text)}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                {questionIndex + 1 < totalQuestions ? (
                  <button
                    onClick={handleNextQuestion}
                    className="flex-1 py-4 bg-primary hover:bg-primary-dark text-white text-xl font-bold rounded-2xl transition-colors"
                  >
                    Next Question →
                  </button>
                ) : (
                  <button
                    onClick={handleEndGame}
                    className="flex-1 py-4 bg-accent hover:bg-yellow-500 text-white text-xl font-bold rounded-2xl transition-colors"
                  >
                    End Game
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400 text-lg">Waiting for question...</p>
            </div>
          )}
        </div>

        {/* Leaderboard panel */}
        <div className="w-full lg:w-72">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h2 className="font-bold text-gray-700 mb-3">Leaderboard</h2>
            {leaderboard.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No scores yet</p>
            ) : (
              leaderboard.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 rounded-xl mb-1 bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm font-bold">{i + 1}</span>
                    <span className="font-semibold text-gray-800 text-sm">{String(p.nickname)}</span>
                  </div>
                  <span className="text-primary font-bold text-sm">{p.totalScore}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {error ? (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-danger text-danger px-4 py-3 rounded-xl">
          {error}
        </div>
      ) : null}

    </div>
  );
}

export default HostGame;