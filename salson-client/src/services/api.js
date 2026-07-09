const BASE_URL = 'http://localhost:5187';
const request = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || response.statusText);
  }

  if (response.status === 204) return null;
  return response.json();
};

export const api = {
  // auth
  getMe: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),

  // quizzes
  getQuizzes: () => request('/api/quiz'),
  getQuiz: (id) => request(`/api/quiz/${id}`),
  createQuiz: (data) => request('/api/quiz', { method: 'POST', body: JSON.stringify(data) }),
  updateQuiz: (id, data) => request(`/api/quiz/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuiz: (id) => request(`/api/quiz/${id}`, { method: 'DELETE' }),

  // questions
  getQuestions: (quizId) => request(`/api/quizzes/${quizId}/questions`),
  createQuestion: (quizId, data) => request(`/api/quizzes/${quizId}/questions`, { method: 'POST', body: JSON.stringify(data) }),
  deleteQuestion: (quizId, id) => request(`/api/quizzes/${quizId}/questions/${id}`, { method: 'DELETE' }),

  // sessions
  createSession: (quizId) => request('/api/sessions', { method: 'POST', body: JSON.stringify({ quizId }) }),
  getSession: (id) => request(`/api/sessions/${id}`),
  getResults: (id) => request(`/api/sessions/${id}/results`),
  joinSession: (joinCode, nickname) => request('/api/sessions/join', { method: 'POST', body: JSON.stringify({ joinCode, nickname }) }),
};