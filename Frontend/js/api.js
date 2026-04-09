const BASE_URL = "http://localhost:8000/api/v1";

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Request failed");
  return data;
}

// Auth
const api = {
  register: (email, name, password) =>
    apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name, password }),
    }),

  login: (email, password) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => apiFetch("/users/me"),

  // Transactions
  getTransactions: () => apiFetch("/transactions"),

  createTransaction: (data) =>
    apiFetch("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTransaction: (id, data) =>
    apiFetch(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteTransaction: (id) =>
    apiFetch(`/transactions/${id}`, { method: "DELETE" }),

  // Check-ins
  getCheckins: () => apiFetch("/checkins"),

  createCheckin: (data) =>
    apiFetch("/checkins", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCheckin: (id, data) =>
    apiFetch(`/checkins/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteCheckin: (id) =>
    apiFetch(`/checkins/${id}`, { method: "DELETE" }),

  // Insights
  getSummary: () => apiFetch("/insights/summary"),

  getCorrelation: () => apiFetch("/insights/correlation"),
};
