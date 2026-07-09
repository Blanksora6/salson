import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { HubConnectionBuilder } from '@microsoft/signalr';

function PlayerGame() {
  const { joinCode } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [connection, setConnection] = useState(null);
  const [status, setStatus] = useState('waiting');
  const [question, setQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [error, setError] = useState(null);

  const nickname = state?.nickname || 'Player';

  useEffect(() => {
    const conn = new HubConnectionBuilder()
      .withUrl('http://localhost:5187/hubs/kahoot', {
        withCredentials: true
      })
      .withAutomaticReconnect()
      .build();

    conn.on('QuestionStarted', (q) => {
      setQuestion(q);
      setSelectedOption(null);
      setAnswerResult(null);
      setStatus('playing');
      setTimeLeft(q.timeLimitSeconds);
    });

    conn.on('AnswerResult', (result) => {
      setAnswerResult(result);
      setScore(result.totalScore);
      setStatus('answered');
    });

    conn.on('LeaderboardUpdated', (lb) => {
      setLeaderboard(lb);
    });

    conn.on('GameEnded', () => {
      setGameEnded(true);
      setStatus('ended');
    });

    conn.on('Error', (msg) => {
      setError(msg);
    });

    conn.start()
      .then(() => setConnection(conn))
      .catch(() => setError('Failed to connect to game server.'));

    return () => conn.stop();
  }, []);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || status !== 'playing') return;
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, status]);

  const handleAnswer = async (optionId) => {
    if (selectedOption || !connection || !question) return;
    setSelectedOption(optionId);

    try {
      await connection.invoke('SubmitAnswer',
        state?.participant?.sessionId || '',
        question.questionId.toString(),
        optionId.toString()
      );
    } catch (err) {
      setError('Failed to submit answer.');
    }
  };

  const optionColors = [
    'bg-red-500 hover:bg-red-600',
    'bg-blue-500 hover:bg-blue-600',
    'bg-yellow-500 hover:bg-yellow-600',
    'bg-green-500 hover:bg-green-600',
  ];

  if (gameEnded) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-gray-900 mb-2">Game Over!</h1>
        <p className="text-gray-500">Final Leaderboard</p>
      </div>
      <div className="bg-white rounded-3xl border border-gray-200 shadow-md w-full max-w-md p-6">
        {leaderboard.map((p, i) => (
          <div
            key={i}
            className={`flex items-center justify-between py-3 px-4 rounded-xl mb-2 ${p.nickname === nickname ? 'bg-primary text-white' : 'bg-gray-50'}`}
          >
            <div className="flex items-center gap-3">
              <span className="font-black text-lg">{i + 1}</span>
              <span className="font-semibold">{p.nickname}</span>
            </div>
            <span className="font-bold">{p.totalScore} pts</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate('/')}
        className="mt-8 px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-colors"
      >
        Back to Home
      </button>
    </div>
  );

  if (status === 'waiting') return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-5xl font-black text-gray-900 mb-4">
          Sal<span className="text-primary">son</span>
        </h1>
        <div className="bg-white rounded-3xl border border-gray-200 shadow-md px-12 py-10">
          <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">You joined as</p>
          <p className="text-4xl font-black text-gray-900 mb-4">{nickname}</p>
          <p className="text-gray-500">Waiting for the host to start the game...</p>
          <div className="mt-6 flex justify-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
        {error && <p className="text-danger mt-4 text-sm">{error}</p>}
      </div>
    </div>
  );

  if (!question) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-gray-500">Loading question...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-gray-700">{nickname}</span>
        <span className="text-2xl font-black text-primary">{score} pts</span>
        {timeLeft !== null && (
          <span className={`font-black text-xl ${timeLeft <= 5 ? 'text-danger' : 'text-gray-700'}`}>
            {timeLeft}s
          </span>
        )}
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
            Question {question.questionIndex + 1} of {question.totalQuestions}
          </p>
          <p className="text-xl font-bold text-gray-900">{question.text}</p>
        </div>

        {answerResult && (
          <div className={`rounded-2xl p-4 mb-4 text-center font-bold text-white text-lg ${answerResult.isCorrect ? 'bg-primary' : 'bg-danger'}`}>
            {answerResult.isCorrect
              ? `✓ Correct! +${answerResult.pointsAwarded} pts`
              : '✗ Wrong answer'}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {question.options.map((option, i) => (
            <button
              key={option.id}
              onClick={() => handleAnswer(option.id)}
              disabled={!!selectedOption}
              className={`
                ${optionColors[i % 4]}
                ${selectedOption === option.id ? 'ring-4 ring-white ring-offset-2 scale-95' : ''}
                ${selectedOption && selectedOption !== option.id ? 'opacity-50' : ''}
                text-white font-bold py-6 px-4 rounded-2xl text-lg transition-all disabled:cursor-not-allowed
              `}
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PlayerGame;