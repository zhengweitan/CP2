// my_syllabi.js

document.addEventListener('DOMContentLoaded', function() {
    // Load user info
    const username = sessionStorage.getItem('username');
    const userId = sessionStorage.getItem('userId');
    const role = sessionStorage.getItem('role');
    
    if (!username || !userId || role !== 'lecturer') {
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('username-display').textContent = username;
    document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();
    
    // Load syllabi
    loadSyllabi();
});

function loadSyllabi() {
    const userId = sessionStorage.getItem('userId');
    const statusFilter = document.getElementById('statusFilter').value;
    const searchQuery = document.getElementById('searchInput').value;
    
    let url = `/api/syllabus/lecturer/${userId}`;
    if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
    }
    if (searchQuery) {
        url += `${statusFilter === 'all' ? '?' : '&'}search=${encodeURIComponent(searchQuery)}`;
    }
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.querySelector('#syllabusTable tbody');
            tableBody.innerHTML = '';
            
            if (data.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="no-data">No syllabi found</td>
                    </tr>
                `;
                return;
            }
            
            data.forEach(syllabus => {
                const row = document.createElement('tr');
                const statusClass = `status-${syllabus.status.toLowerCase()}`;
                const statusText = syllabus.status.charAt(0).toUpperCase() + syllabus.status.slice(1);
                const updatedAt = new Date(syllabus.updated_at);
                const formattedDate = updatedAt.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                row.innerHTML = `
                    <td>${syllabus.course_code || 'N/A'}</td>
                    <td>${syllabus.course_name || 'N/A'}</td>
                    <td>${syllabus.version || '1.0'}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${formattedDate}</td>
                    <td class="action-buttons">
                        <button class="action-btn btn-view" onclick="viewSyllabus(${syllabus.id})">View</button>
                        ${syllabus.status === 'rejected' ? 
                            `<button class="action-btn btn-edit" onclick="editSyllabus(${syllabus.id})">Edit & Resubmit</button>` : 
                            ''}
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading syllabi:', error);
            document.querySelector('#syllabusTable tbody').innerHTML = `
                <tr>
                    <td colspan="6" class="error">Error loading syllabi. Please try again.</td>
                </tr>
            `;
        });
}

function viewSyllabus(syllabusId) {
    fetch(`/api/syllabus/${syllabusId}`)
        .then(response => response.json())
        .then(data => {
            const modalContent = document.getElementById('modalContent');
            
            let html = `
                <div class="syllabus-details">
                    <div class="syllabus-header">
                        <h3>${data.course_name || 'Untitled Syllabus'}</h3>
                        <div class="syllabus-meta">
                            <span>Code: ${data.course_code || 'N/A'}</span>
                            <span>Version: ${data.version || '1.0'}</span>
                            <span class="status-badge status-${data.status.toLowerCase()}">
                                ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                            </span>
                        </div>
                    </div>
                    
                    <div class="syllabus-section">
                        <h4>Course Information</h4>
                        <div class="syllabus-field">
                            <label>Credit Hours:</label>
                            <span>${data.course_info?.creditValue || 'N/A'}</span>
                        </div>
                        <div class="syllabus-field">
                            <label>Classification:</label>
                            <span>${data.course_info?.courseClassification || 'N/A'}</span>
                        </div>
                        <div class="syllabus-field">
                            <label>Synopsis:</label>
                            <p>${data.course_info?.synopsis || 'Not provided'}</p>
                        </div>
                    </div>
            `;

            // Add learning outcomes if available
            if (data.learning_outcomes?.clos?.length > 0) {
                html += `
                    <div class="syllabus-section">
                        <h4>Learning Outcomes</h4>
                        <div class="clos-container">
                `;

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

                html += `</div></div>`;
            }

            // Add SLT summary if available
            if (data.slt_data) {
                html += `
                    <div class="syllabus-section">
                        <h4>Student Learning Time</h4>
                        <div class="slt-summary">
                            <div class="slt-row">
                                <span>Total SLT:</span>
                                <span>${data.slt_data.grandTotalSLT || '0'} hours</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            modalContent.innerHTML = html;
            document.getElementById('viewModal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error loading syllabus:', error);
            alert('Failed to load syllabus details');
        });
}

function editSyllabus(syllabusId) {
    // Store the syllabus ID to edit
    sessionStorage.setItem('editingSyllabusId', syllabusId);
    // Redirect to create syllabus page which will handle the edit mode
    window.location.href = 'create_syllabus.html?edit=true&id=' + syllabusId;
}

function closeModal() {
    document.getElementById('viewModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('viewModal');
    if (event.target === modal) {
        closeModal();
    }
};

function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}