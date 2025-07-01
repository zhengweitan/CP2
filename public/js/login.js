// login.js
function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
  
    fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
      if (data.message === 'Login successful') {
        // Store user info in sessionStorage
        sessionStorage.setItem('userId', data.userId); // Add this line
        sessionStorage.setItem('username', data.username);
        sessionStorage.setItem('role', data.role);
        
        // Redirect based on role
        if (data.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'lecturer.html';
        }
      } else {
        alert('Login failed: Invalid credentials');
      }
    })
    .catch(err => alert('Login error: ' + err));
}

function signup() {
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
  
    fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(res => res.text())
    .then(msg => {
        alert(msg);
        window.location.href = 'login.html';
    })
    .catch(err => alert('Signup error: ' + err));
}