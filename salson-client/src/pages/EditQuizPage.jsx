import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function EditQuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // new question form state
  const [questionText, setQuestionText] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [points, setPoints] = useState(100);
  const [options, setOptions] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [saving, setSaving] = useState(false);
  const [questionError, setQuestionError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getQuiz(quizId),
      api.getQuestions(quizId)
    ])
      .then(([q, qs]) => {
        setQuiz(q);
        setQuestions(qs);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [quizId]);

  const handleOptionChange = (index, field, value) => {
    setOptions(prev => prev.map((o, i) => {
      if (i !== index) return field === 'isCorrect' && value ? { ...o, isCorrect: false } : o;
      return { ...o, [field]: value };
    }));
  };

  const handleMarkCorrect = (index) => {
    setOptions(prev => prev.map((o, i) => ({
      ...o,
      isCorrect: i === index
    })));
  };

  const handleAddQuestion = async () => {
    if (!questionText.trim()) {
      setQuestionError('Question text is required.');
      return;
    }

    const correctCount = options.filter(o => o.isCorrect).length;
    if (correctCount !== 1) {
      setQuestionError('Exactly one answer must be marked as correct.');
      return;
    }

    const emptyOptions = options.filter(o => !o.text.trim());
    if (emptyOptions.length > 0) {
      setQuestionError('All answer options must have text.');
      return;
    }

    try {
      setSaving(true);
      setQuestionError(null);

      const newQuestion = await api.createQuestion(quizId, {
        text: questionText,
        orderIndex: questions.length + 1,
        timeLimitSeconds: timeLimit,
        points,
        options: options.map((o, i) => ({
          text: o.text,
          isCorrect: o.isCorrect,
          orderIndex: i + 1
        }))
      });

      setQuestions(prev => [...prev, newQuestion]);

      // reset form
      setQuestionText('');
      setTimeLimit(30);
      setPoints(100);
      setOptions([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);

    } catch (err) {
      setQuestionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await api.deleteQuestion(quizId, questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (err) {
      setError(err.message);
    }
  };

  const optionColors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-gray-500">Loading quiz...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/host/dashboard')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">{quiz?.title}</h1>
            <p className="text-gray-400 text-sm">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/host/dashboard')}
          className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors"
        >
          Done
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {error && (
          <div className="bg-red-50 border border-danger text-danger px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Existing questions */}
        {questions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Questions</h2>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={q.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">Question {i + 1} · {q.timeLimitSeconds}s · {q.points} pts</p>
                    <p className="font-semibold text-gray-900">{q.text}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {q.options?.map((o, oi) => (
                        <span
                          key={o.id}
                          className={`text-xs px-3 py-1 rounded-full text-white font-semibold ${optionColors[oi % 4]} ${o.isCorrect ? 'ring-2 ring-offset-1 ring-gray-800' : 'opacity-70'}`}
                        >
                          {o.text} {o.isCorrect ? '✓' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="ml-4 text-gray-300 hover:text-danger transition-colors text-lg"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add question form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Add a Question</h2>

          {questionError && (
            <div className="bg-red-50 border border-danger text-danger text-sm px-4 py-3 rounded-xl mb-5">
              {questionError}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Question</label>
            <input
              type="text"
              placeholder="e.g. What is the capital of France?"
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Time Limit (seconds)</label>
              <select
                value={timeLimit}
                onChange={e => setTimeLimit(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors"
              >
                <option value={10}>10s</option>
                <option value={20}>20s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Points</label>
              <select
                value={points}
                onChange={e => setPoints(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors"
              >
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Answer Options <span className="text-gray-400 font-normal">(click a circle to mark correct)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {options.map((option, i) => (
                <div key={i} className={`relative rounded-xl border-2 transition-colors ${option.isCorrect ? 'border-primary' : 'border-gray-200'}`}>
                  <div className={`absolute top-0 left-0 w-full h-1 rounded-t-xl ${optionColors[i]}`} />
                  <div className="p-3 pt-4">
                    <input
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={option.text}
                      onChange={e => handleOptionChange(i, 'text', e.target.value)}
                      className="w-full text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
                    />
                    <button
                      onClick={() => handleMarkCorrect(i)}
                      className={`mt-2 text-xs font-bold transition-colors ${option.isCorrect ? 'text-primary' : 'text-gray-300 hover:text-gray-500'}`}
                    >
                      {option.isCorrect ? '✓ Correct' : '○ Mark correct'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleAddQuestion}
            disabled={saving}
            className="w-full py-4 bg-accent hover:bg-yellow-500 text-white text-lg font-bold rounded-2xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Adding...' : '+ Add Question'}
          </button>
        </div>

      </main>
    </div>
  );
}

export default EditQuizPage;