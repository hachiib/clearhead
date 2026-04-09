// Save token and user after login/register
function saveSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

// Get the stored user object
function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

// Check if the user is logged in
function isLoggedIn() {
  return !!localStorage.getItem("token");
}

// Clear everything and go to login
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login.html";
}

// Call this at the top of any page that requires login
// If not logged in, redirects to login page immediately
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "/login.html";
  }
}
