// script.js
// Updated login function
async function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
      alert('Please enter both username and password');
      return;
  }

  try {
      const response = await fetch('http://localhost:3000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
          throw new Error(data.message || 'Login failed');
      }

      sessionStorage.setItem('username', data.username);
      sessionStorage.setItem('role', data.role);
      
      window.location.href = data.role === 'admin' ? 'admin.html' : 'lecturer.html';
      
  } catch (error) {
      console.error('Login error:', error);
      alert(`Login failed: ${error.message}`);
  }
}

// Updated signup function
async function signup() {
  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;

  if (!username || !password) {
      alert('Please enter both username and password');
      return;
  }

  try {
      const response = await fetch('http://localhost:3000/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
          const error = await response.text();
          throw new Error(error);
      }

      alert('Account created successfully!');
      window.location.href = 'login.html';
      
  } catch (error) {
      console.error('Signup error:', error);
      alert(`Signup failed: ${error.message}`);
  }
}

function checkAuth() {
  const protectedPages = ['admin.html', 'lecturer.html'];
  const currentPage = window.location.pathname.split('/').pop();
  
  if (protectedPages.includes(currentPage)) {
      const role = sessionStorage.getItem('role');
      const username = sessionStorage.getItem('username');
      
      if (!role || !username) {
          window.location.href = 'login.html';
          return;
      }
      
      // Update UI with user info
      document.getElementById('username-display').textContent = username;
      document.querySelector('.user-role').textContent = role;
      document.getElementById('user-avatar').textContent = 
          username.charAt(0).toUpperCase();
      
      // Verify role matches page
      if ((role === 'admin' && currentPage === 'lecturer.html') || 
          (role === 'lecturer' && currentPage === 'admin.html')) {
          window.location.href = role + '.html';
      }
  }
}

// Logout function
function logout() {
  sessionStorage.removeItem('username');
  sessionStorage.removeItem('role');
  window.location.href = 'login.html';
}

// Highlight current page in sidebar
function highlightActiveMenu() {
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-menu a').forEach(link => {
      if (link.getAttribute('href') === currentPage) {
          link.classList.add('active');
      } else {
          link.classList.remove('active');
      }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  highlightActiveMenu();
});

// Notification functions
function loadNotificationPreview() {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;
    
    fetch(`/notifications?userId=${userId}&limit=5`)
        .then(res => res.json())
        .then(notifications => {
            const container = document.getElementById('notification-preview');
            const unreadCount = notifications.filter(n => !n.is_read).length;
            
            // Update top bar badge only
            const topBadge = document.getElementById('unread-badge');
            if (topBadge) {
                topBadge.textContent = unreadCount;
                topBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
            }
            
            // Populate preview
            container.innerHTML = notifications.length === 0 
                ? '<p class="no-notifications">No notifications</p>'
                : notifications.map(notif => `
                    <div class="notification-preview ${notif.is_read ? '' : 'unread'}" 
                         onclick="viewNotification(${notif.id}, ${notif.is_read})">
                        <p>${notif.message}</p>
                        <p class="time">${formatTime(notif.created_at)}</p>
                    </div>
                `).join('');
        });
}

function toggleNotifications() {
    const dropdown = document.getElementById('notification-dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    if (dropdown.style.display === 'block') {
        loadNotificationPreview();
    }
}

function viewNotification(id, isRead) {
    if (!isRead) {
        fetch(`/notifications/${id}/read`, { method: 'POST' })
            .then(() => loadNotificationPreview());
    }
    // Redirect to relevant page based on notification type
    window.location.href = 'notifications.html';
}

function formatTime(timestamp) {
    // ... use the same formatTime function from earlier ...
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadNotificationPreview();
    setInterval(loadNotificationPreview, 30000); // Refresh every 30 seconds
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.notification-dropdown')) {
            document.getElementById('notification-dropdown').style.display = 'none';
        }
    });
});