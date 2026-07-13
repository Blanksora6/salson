import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

function HostDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = 'http://localhost:5187/api/auth/login';
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      api.getQuizzes()
        .then(setQuizzes)
        .catch(err => setError(err.message))
        .finally(() => setQuizzesLoading(false));
    }
  }, [user]);

  const handleHostQuiz = async (quizId) => {
    try {
      setCreating(true);
      const session = await api.createSession(quizId);
      navigate(`/host/lobby/${session.id}`, { state: { session } });
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    navigate('/');
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Delete this quiz? This cannot be undone.')) return;
    try {
      await api.deleteQuiz(quizId);
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
    } catch (err) {
      setError('Failed to delete quiz. Please try again.');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-gray-500 text-lg">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">

      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">
          Sal<span className="text-primary">son</span>
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">{user?.displayName}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-danger transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Your Quizzes</h2>
          <button
            onClick={() => navigate('/host/quiz/create')}
            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors"
          >
            + New Quiz
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-danger text-danger px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {quizzesLoading ? (
          <p className="text-gray-400">Loading quizzes...</p>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl mb-2">No quizzes yet.</p>
            <button
              onClick={() => navigate('/host/quiz/create')}
              className="mt-4 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors"
            >
              Create your first quiz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quizzes.map(quiz => (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-1">{quiz.title}</h3>
                <p className="text-gray-500 text-sm mb-1">{quiz.description || 'No description'}</p>
                <p className="text-gray-400 text-xs mb-4">
                  {quiz.questionCount} {quiz.questionCount === 1 ? 'question' : 'questions'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/host/quiz/${quiz.id}/edit`)}
                    className="flex-1 py-3 border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleHostQuiz(quiz.id)}
                    disabled={creating}
                    className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
                  >
                    {creating ? 'Starting...' : 'Host'}
                  </button>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="py-3 px-4 border-2 border-danger text-danger hover:bg-danger hover:text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

export default HostDashboard;