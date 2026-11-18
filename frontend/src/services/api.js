const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // send and receive HTTP-only cookies
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (name, email, password) => request('/auth/register', { method: 'POST', body: { name, email, password } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),

  // Kits
  listKits: () => request('/kits'),
  getKit: (id) => request(`/kits/${id}`),
  createKit: (kitData) => request('/kits', { method: 'POST', body: kitData }),
  deleteKit: (id) => request(`/kits/${id}`, { method: 'DELETE' }),
  batchUpload: (cases) => request('/kits/batch', { method: 'POST', body: { cases } }),

  // Question editing
  updateQuestion: (kitId, qId, updates) => request(`/kits/${kitId}/questions/${qId}`, { method: 'PUT', body: updates }),
  addQuestion: (kitId, questionData) => request(`/kits/${kitId}/questions`, { method: 'POST', body: questionData }),
  deleteQuestion: (kitId, qId) => request(`/kits/${kitId}/questions/${qId}`, { method: 'DELETE' }),
  reorderQuestions: (kitId, questionIds) => request(`/kits/${kitId}/questions-reorder`, { method: 'PUT', body: { questionIds } }),

  // Flashcards & Practice
  updateFlashcard: (kitId, fId, updates) => request(`/kits/${kitId}/flashcards/${fId}`, { method: 'PUT', body: updates }),
  addFlashcard: (kitId, cardData) => request(`/kits/${kitId}/flashcards`, { method: 'POST', body: cardData }),
  deleteFlashcard: (kitId, fId) => request(`/kits/${kitId}/flashcards/${fId}`, { method: 'DELETE' }),
  recordPractice: (kitId, cardId, confidence) => request(`/kits/${kitId}/practice`, { method: 'POST', body: { cardId, confidence } }),

  // Section Regeneration
  regenerateSection: (kitId, section) => request(`/kits/${kitId}/regenerate`, { method: 'POST', body: { section } }),
};

