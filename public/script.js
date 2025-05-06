// script.js
// SIGNUP FUNCTION
function signup() {
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
  
    fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(res => res.text())
    .then(msg => alert(msg))
    .catch(err => alert('Signup error: ' + err));
  }
  
  // LOGIN FUNCTION
  function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
  
    fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(res => {
      if (res.ok) {
        alert('Login successful');
        window.location.href = 'home.html';
      } else {
        alert('Login failed: Invalid credentials');
      }
    })
    .catch(err => alert('Login error: ' + err));
  }
  