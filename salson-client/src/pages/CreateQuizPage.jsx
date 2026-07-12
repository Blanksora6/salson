import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function CreateQuizPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Quiz title is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const quiz = await api.createQuiz({ title, description, isPublic });
      navigate(`/host/quiz/${quiz.id}/edit`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/host/dashboard')}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-xl font-black text-gray-900">
          Sal<span className="text-primary">son</span>
        </h1>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Create a Quiz</h2>

        {error && (
          <div className="bg-red-50 border border-danger text-danger px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quiz Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. World Geography"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors text-gray-900"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              placeholder="What is this quiz about?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors text-gray-900 resize-none"
            />
          </div>

          <div className="mb-6 flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
              className="w-5 h-5 accent-primary"
            />
            <label htmlFor="isPublic" className="text-sm font-semibold text-gray-700">
              Make this quiz public
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-primary hover:bg-primary-dark text-white text-lg font-bold rounded-2xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Quiz →'}
          </button>

        </div>
      </main>
    </div>
  );
}

export default CreateQuizPage;