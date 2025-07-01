//submission_status.js

document.addEventListener('DOMContentLoaded', function() {
  // Load user info
  const username = sessionStorage.getItem('username');
  const role = sessionStorage.getItem('role');
  const userId = sessionStorage.getItem('userId');
  
  if (!username || !role || !userId) {
    window.location.href = 'login.html';
    return;
  }
  
  document.getElementById('username-display').textContent = username;
  document.querySelector('.user-role').textContent = role;
  document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();
  
  // Load submissions
  loadSubmissions();
});

function loadSubmissions() {
  const userId = sessionStorage.getItem('userId');
  const role = sessionStorage.getItem('role');
  const statusFilter = document.getElementById('statusFilter').value;
  
  fetch(`/api/syllabus/submissions?userId=${userId}&role=${role}&status=${statusFilter}`)
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      console.log('Submissions data:', data);  // Debug log
      const tableBody = document.querySelector('#submissionTable tbody');
      tableBody.innerHTML = '';
      
      if (!data || data.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="no-data">No submissions found</td>
          </tr>
        `;
        return;
      }
      
      data.forEach(submission => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', submission.id);
        
        const statusClass = `status-${submission.status.toLowerCase()}`;
        const statusText = submission.status.charAt(0).toUpperCase() + submission.status.slice(1);
        const submittedDate = new Date(submission.submitted_at);
        const formattedDate = submittedDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        row.innerHTML = `
          <td>${submission.course_code || 'N/A'}</td>
          <td>${submission.course_name || 'N/A'}</td>
          <td>${submission.version || '1.0'}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td>${formattedDate}</td>
        `;
        
        tableBody.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Error loading submissions:', error);
      document.querySelector('#submissionTable tbody').innerHTML = `
        <tr>
          <td colspan="5" class="error">Error loading submissions. Please try again.</td>
        </tr>
      `;
    });
}

function logout() {
  sessionStorage.removeItem('username');
  sessionStorage.removeItem('role');
  sessionStorage.removeItem('userId');
  window.location.href = 'login.html';
}