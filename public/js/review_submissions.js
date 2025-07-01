document.addEventListener('DOMContentLoaded', function() {
  // Load user info
  const username = sessionStorage.getItem('username');
  const role = sessionStorage.getItem('role');
  
  if (!username || role !== 'admin') {
    window.location.href = 'login.html';
    return;
  }
  
  document.getElementById('username-display').textContent = username;
  document.querySelector('.user-role').textContent = role;
  document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();
  
  // Load submissions
  loadSubmissions();
});

let currentReviewId = null;

function loadSubmissions() {
  const statusFilter = document.getElementById('statusFilter').value;
  
  let url = '/api/syllabus/submissions?role=admin';
  if (statusFilter !== 'all') {
    url += `&status=${statusFilter}`;
  }

  
  fetch(url)
    .then(response => response.json())
    .then(data => {
      const tableBody = document.querySelector('#submissionTable tbody');
      tableBody.innerHTML = '';
      
      if (data.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" class="no-data">No submissions found</td>
          </tr>
        `;
        return;
      }
      
      data.forEach(submission => {
        const row = document.createElement('tr');
        
        const statusClass = `status-${submission.status.toLowerCase()}`;
        const statusText = submission.status.charAt(0).toUpperCase() + submission.status.slice(1);
        
        row.innerHTML = `
          <td>${submission.course_code}</td>
          <td>${submission.course_name}</td>
          <td>${submission.lecturer_name}</td>
          <td>${submission.version}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td>${new Date(submission.submitted_at).toLocaleDateString()}</td>
          <td>
            <button class="action-btn btn-view" onclick="reviewSyllabus(${submission.id})">
              ${submission.status === 'submitted' ? 'Review' : 'View'}
            </button>
          </td>
        `;
        
        tableBody.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Error loading submissions:', error);
    });
}

function reviewSyllabus(syllabusId) {
  currentReviewId = syllabusId;
  
  fetch(`/api/syllabus/${syllabusId}`)
    .then(response => response.json())
    .then(data => {
      const modal = document.getElementById('reviewModal');
      const modalContent = document.getElementById('modalContent');
      
      // Format the syllabus data for display
      let html = `
        <div class="syllabus-details">
          <div class="syllabus-section">
            <h3>Course Information</h3>
            <div class="syllabus-field">
              <label>Course Code</label>
              <div class="value">${data.course_info.courseCode}</div>
            </div>
            <div class="syllabus-field">
              <label>Course Name</label>
              <div class="value">${data.course_info.courseName}</div>
            </div>
            <div class="syllabus-field">
              <label>Lecturer</label>
              <div class="value">${data.lecturer_name}</div>
            </div>
            <!-- Add more fields as needed -->
          </div>
          
          <div class="syllabus-section">
            <h3>Learning Outcomes</h3>
            ${data.learning_outcomes.clos.map((clo, index) => `
              <div class="clo-item">
                <div class="syllabus-field">
                  <label>CLO ${index + 1}</label>
                  <div class="value">${clo.description}</div>
                </div>
                <div class="syllabus-field">
                  <label>PLO Mapping</label>
                  <div class="value">${clo.ploMapping}</div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <!-- Add more sections as needed -->
        </div>
      `;
      
      modalContent.innerHTML = html;
      
      // Show/hide action buttons based on status
      const modalActions = document.getElementById('modalActions');
      if (data.status === 'submitted') {
        modalActions.style.display = 'block';
      } else {
        modalActions.style.display = 'none';
      }
      
      modal.style.display = 'block';
    })
    .catch(error => {
      console.error('Error loading syllabus:', error);
    });
}

function approveSyllabus() {
  const feedback = document.getElementById('feedbackText').value;
  
  fetch('/syllabus/approve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      syllabus_id: currentReviewId,
      feedback: feedback
    })
  })
  .then(response => {
    if (response.ok) {
      closeModal();
      loadSubmissions();
      alert('Syllabus approved successfully');
    } else {
      throw new Error('Approval failed');
    }
  })
  .catch(error => {
    console.error('Error approving syllabus:', error);
    alert('Failed to approve syllabus');
  });
}

function rejectSyllabus() {
  const feedback = document.getElementById('feedbackText').value;
  
  if (!feedback) {
    alert('Please provide feedback for rejection');
    return;
  }
  
  fetch('/syllabus/reject', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      syllabus_id: currentReviewId,
      feedback: feedback
    })
  })
  .then(response => {
    if (response.ok) {
      closeModal();
      loadSubmissions();
      alert('Syllabus rejected');
    } else {
      throw new Error('Rejection failed');
    }
  })
  .catch(error => {
    console.error('Error rejecting syllabus:', error);
    alert('Failed to reject syllabus');
  });
}

function closeModal() {
  document.getElementById('reviewModal').style.display = 'none';
  document.getElementById('feedbackText').value = '';
  currentReviewId = null;
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('reviewModal');
  if (event.target === modal) {
    closeModal();
  }
};

function logout() {
  sessionStorage.removeItem('username');
  sessionStorage.removeItem('role');
  sessionStorage.removeItem('userId');
  window.location.href = 'login.html';
}

function reviewSyllabus(syllabusId) {
  // Store the syllabus ID in sessionStorage for the approval page
  sessionStorage.setItem('reviewingSyllabusId', syllabusId);
  // Redirect to approval management page
  window.location.href = 'approval_management.html';
}