//approval_management.js

document.addEventListener('DOMContentLoaded', function() {
  const syllabusId = sessionStorage.getItem('reviewingSyllabusId');
  const username = sessionStorage.getItem('username');
  const role = sessionStorage.getItem('role');
  
  if (!syllabusId || !username || role !== 'admin') {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('username-display').textContent = username;
  document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();

  // Load syllabus details
  loadSyllabusDetails(syllabusId);

  // Setup approval buttons
  document.getElementById('approveBtn').addEventListener('click', () => {
    const feedback = document.getElementById('feedbackText').value;
    approveSyllabus(syllabusId, feedback);
  });

  document.getElementById('rejectBtn').addEventListener('click', () => {
    const feedback = document.getElementById('feedbackText').value;
    if (!feedback) {
      alert('Please provide feedback for rejection');
      return;
    }
    rejectSyllabus(syllabusId, feedback);
  });
});

function loadSyllabusDetails(syllabusId) {
  fetch(`/api/syllabus/${syllabusId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.error) {
        throw new Error(data.error);
      }
      renderSyllabusDetails(data);
    })
    .catch(error => {
      console.error('Error loading syllabus:', error);
      document.getElementById('syllabusDetails').innerHTML = `
        <div class="error-message">
          Failed to load syllabus details: ${error.message}
        </div>
      `;
    });
}

function renderSyllabusDetails(data) {
  const container = document.getElementById('syllabusDetails');
  
  let html = `
    <div class="syllabus-header">
      <h2>${data.course_name || 'Untitled Syllabus'}</h2>
      <div class="syllabus-meta">
        <span>Course Code: ${data.course_code || 'N/A'}</span>
        <span>Submitted by: ${data.lecturer_name || 'Unknown'}</span>
        <span>Version: ${data.version || '1.0'}</span>
        <span class="status-badge status-${data.status ? data.status.toLowerCase() : 'unknown'}">
          ${data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : 'Unknown'}
        </span>
      </div>
    </div>
  `;

  // Add course information section if available
  if (data.course_info) {
    html += `
      <div class="syllabus-section">
        <h3>Course Information</h3>
        <div class="syllabus-field">
          <label>Credit Hours:</label>
          <span>${data.course_info.creditValue || 'N/A'}</span>
        </div>
        <div class="syllabus-field">
          <label>Classification:</label>
          <span>${data.course_info.courseClassification || 'N/A'}</span>
        </div>
        <div class="syllabus-field">
          <label>Synopsis:</label>
          <p>${data.course_info.synopsis || 'Not provided'}</p>
        </div>
      </div>
    `;
  }

  // Add learning outcomes if available
  if (data.learning_outcomes) {
    html += `
      <div class="syllabus-section">
        <h3>Learning Outcomes</h3>
        <div class="clos-container">
    `;

    if (data.learning_outcomes.clos && data.learning_outcomes.clos.length > 0) {
      data.learning_outcomes.clos.forEach((clo, index) => {
        html += `
          <div class="clo-item">
            <div class="clo-header">CLO ${index + 1}</div>
            <div class="clo-description">${clo.description || 'No description'}</div>
            <div class="clo-mapping">
              <span>PLO: ${clo.ploMapping || 'Not mapped'}</span>
              <span>MQF: ${clo.mqfMapping || 'Not mapped'}</span>
            </div>
          </div>
        `;
      });
    } else {
      html += '<p>No learning outcomes defined</p>';
    }

    html += `</div></div>`;
  }

  // Add SLT and assessment information if available
  if (data.slt_data) {
    html += `
      <div class="syllabus-section">
        <h3>Student Learning Time</h3>
        <div class="slt-summary">
          <div class="slt-row">
            <span>Course Content:</span>
            <span>${calculateContentSLT(data.slt_data.courseContent)} hours</span>
          </div>
          <div class="slt-row">
            <span>Assessments:</span>
            <span>${calculateAssessmentSLT(data.slt_data)} hours</span>
          </div>
          <div class="slt-row total">
            <span>Total SLT:</span>
            <span>${data.slt_data.grandTotalSLT || '0'} hours</span>
          </div>
        </div>
      </div>
    `;

    // Add assessments if available
    if (data.slt_data.continuousAssessment || data.slt_data.finalAssessment) {
      html += `
        <div class="syllabus-section">
          <h3>Assessments</h3>
      `;

      if (data.slt_data.continuousAssessment) {
        html += `
          <h4>Continuous Assessment</h4>
          <ul class="assessment-list">
        `;
        
        data.slt_data.continuousAssessment.forEach(assessment => {
          html += `
            <li>
              <span class="assessment-type">${assessment.continuousAssessment || 'Untitled'}</span>
              <span class="assessment-weight">${assessment.continuousPercentage || '0'}%</span>
              <span class="assessment-slt">${assessment.total || '0'} SLT</span>
            </li>
          `;
        });
        
        html += `</ul>`;
      }

      if (data.slt_data.finalAssessment) {
        html += `
          <h4>Final Assessment</h4>
          <ul class="assessment-list">
        `;
        
        data.slt_data.finalAssessment.forEach(assessment => {
          html += `
            <li>
              <span class="assessment-type">${assessment.finalAssessment || 'Untitled'}</span>
              <span class="assessment-weight">${assessment.finalPercentage || '0'}%</span>
              <span class="assessment-slt">${assessment.total || '0'} SLT</span>
            </li>
          `;
        });
        
        html += `</ul>`;
      }

      html += `</div>`;
    }
  }

  container.innerHTML = html;
}

function calculateContentSLT(content) {
  if (!content) return 0;
  return content.reduce((sum, item) => sum + (parseInt(item.total) || 0), 0);
}

function calculateAssessmentSLT(sltData) {
  const contAssess = sltData.continuousAssessment ? 
    sltData.continuousAssessment.reduce((sum, item) => sum + (parseInt(item.total) || 0), 0) : 0;
  
  const finalAssess = sltData.finalAssessment ? 
    sltData.finalAssessment.reduce((sum, item) => sum + (parseInt(item.total) || 0), 0) : 0;
  
  return contAssess + finalAssess;
}

function approveSyllabus(syllabusId, feedback) {
  fetch('/api/syllabus/approve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      syllabusId: parseInt(syllabusId), // Ensure it's a number
      feedback: feedback || ''
    })
  })
  .then(async response => {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Received non-JSON response');
    }
    return response.json();
  })
  .then(data => {
    if (data.error) {
      throw new Error(data.error);
    }
    if (data.success) {
      alert('Syllabus approved successfully');
      window.location.href = 'review_submissions.html';
    } else {
      throw new Error('Approval failed');
    }
  })
  .catch(error => {
    console.error('Error approving syllabus:', error);
    alert(`Failed to approve syllabus: ${error.message}`);
  });
}

function rejectSyllabus(syllabusId, feedback) {
  fetch('/api/syllabus/reject', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      syllabusId: parseInt(syllabusId), // Ensure it's a number
      feedback: feedback
    })
  })
  .then(async response => {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Received non-JSON response');
    }
    return response.json();
  })
  .then(data => {
    if (data.error) {
      throw new Error(data.error);
    }
    if (data.success) {
      alert('Syllabus rejected');
      window.location.href = 'review_submissions.html';
    } else {
      throw new Error('Rejection failed');
    }
  })
  .catch(error => {
    console.error('Error rejecting syllabus:', error);
    alert(`Failed to reject syllabus: ${error.message}`);
  });
}

function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}