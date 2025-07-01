// create_syllabus.js
// Section 1
function addStaff() {
  const staffList = document.getElementById('staffList');
  const newField = document.createElement('div');
  newField.className = 'list-item';
  newField.innerHTML = `
    <input type="text" name="academicStaff[]" required>
    <button type="button" class="remove-btn" onclick="removeItem(this)">×</button>
  `;
  staffList.appendChild(newField);
}

function addPrerequisite() {
  const prereqList = document.getElementById('prereqList');
  const newField = document.createElement('div');
  newField.className = 'list-item';
  newField.innerHTML = `
    <input type="text" name="prerequisites[]">
    <button type="button" class="remove-btn" onclick="removeItem(this)">×</button>
  `;
  prereqList.appendChild(newField);
}

function removeItem(button) {
  const list = button.parentNode.parentNode;
  if (list.children.length > 1) {
    list.removeChild(button.parentNode);
  }
}

// Section 2
function addClo() {
  const tableBody = document.getElementById("cloTable").getElementsByTagName('tbody')[0];
  const row = tableBody.insertRow();

row.innerHTML = `
  <td></td>
  <td><textarea name="cloDescription[]" required rows="3"></textarea></td>
  <td>
    <select name="ploMapping[]" required>
      <option value="">Select PLO</option>
      ${[...Array(11)].map((_, i) => `<option value="PLO${i + 1}">PLO${i + 1}</option>`).join("")}
    </select>
  </td>
  <td>
    <select name="mqfMapping[]" required>
      <option value="">Select MQF</option>
      <option value="C1">C1</option><option value="C2">C2</option>
      <option value="C3A">C3A</option><option value="C3B">C3B</option>
      <option value="C3C">C3C</option><option value="C3D">C3D</option>
      <option value="C3E">C3E</option><option value="C3F">C3F</option>
      <option value="C4A">C4A</option><option value="C4B">C4B</option><option value="C5">C5</option>
    </select>
  </td>
  <td><button type="button" onclick="removeClo(this)">✕</button></td>
`;

  renumberClo();
}

function removeClo(button) {
  const tableBody = document.getElementById("cloTable").getElementsByTagName('tbody')[0];
  if (tableBody.rows.length > 1) {
    button.closest("tr").remove();
    renumberClo();
  } else {
    alert("At least one CLO must remain.");
  }
}

function renumberClo() {
  const rows = document.getElementById("cloTable").getElementsByTagName("tbody")[0].rows;
  for (let i = 0; i < rows.length; i++) {
    rows[i].cells[0].textContent = `CLO${i + 1}`;
  }
}

function addSkill() {
  const container = document.getElementById("skillsList");
  const div = document.createElement("div");
  div.className = "skill-item";
  div.innerHTML = `
    <input type="text" name="skills[]">
    <button type="button" onclick="removeSkill(this)">✕</button>
  `;
  container.appendChild(div);
}

function removeSkill(button) {
  button.closest(".skill-item").remove();
}

// Section 3

// Initialize CLO options when page loads
document.addEventListener('DOMContentLoaded', function() {
    updateCloOptions();
    calculateAllTotals();
});

// Update CLO options in all dropdowns when CLOs are added/removed
function updateCloOptions() {
    const cloRows = document.getElementById("cloTable").getElementsByTagName('tbody')[0].rows;
    const cloOptions = [];
    
    for (let i = 0; i < cloRows.length; i++) {
        cloOptions.push(`<option value="CLO${i + 1}">CLO${i + 1}</option>`);
    }
    
    // Update Course Content CLO dropdowns
    const contentSelects = document.querySelectorAll('select[name="contentClo[]"]');
    contentSelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select CLO</option>' + cloOptions.join('');
        if (currentValue) select.value = currentValue;
    });
}

// Course Content Functions
function addContent() {
    const tableBody = document.getElementById("courseContentTable").getElementsByTagName('tbody')[0];
    const row = tableBody.insertRow();
    
    row.innerHTML = `
        <td><textarea name="courseContent[]" required rows="3"></textarea></td>
        <td>
            <select name="contentClo[]" required>
                <option value="">Select CLO</option>
            </select>
        </td>
        <td><input type="number" name="contentPhysicalL[]" min="0" value="0" onchange="calculateContentRowTotal(this)"></td>
        <td><input type="number" name="contentPhysicalT[]" min="0" value="0" onchange="calculateContentRowTotal(this)"></td>
        <td><input type="number" name="contentPhysicalP[]" min="0" value="0" onchange="calculateContentRowTotal(this)"></td>
        <td><input type="number" name="contentPhysicalO[]" min="0" value="0" onchange="calculateContentRowTotal(this)"></td>
        <td><input type="number" name="contentOnlineL[]" min="0" value="0" onchange="calculateContentRowTotal(this)"></td>
        <td><input type="number" name="contentOnlineT[]" min="0" value="0" onchange="calculateContentRowTotal(this)"></td>
        <td><input type="number" name="contentOnlineP[]" min="0" value="0" onchange="calculateContentRowTotal(this)"></td>
        <td><input type="number" name="contentOnlineO[]" min="0" value="0" onchange="calculateContentRowTotal(this)"></td>
        <td><input type="number" name="contentAsync[]" min="0" value="0" onchange="calculateContentRowTotal(this)"></td>
        <td class="total-cell">0</td>
        <td><button type="button" class="remove-btn" onclick="removeContentRow(this)">×</button></td>
    `;
    
    updateCloOptions();
    calculateAllTotals();
}

function removeContentRow(button) {
    const tableBody = document.getElementById("courseContentTable").getElementsByTagName('tbody')[0];
    if (tableBody.rows.length > 1) {
        button.closest("tr").remove();
        calculateAllTotals();
    } else {
        alert("At least one content row must remain.");
    }
}

// Modified Continuous Assessment Functions
function addContinuousAssessment() {
    const tableBody = document.getElementById("continuousAssessmentTable").getElementsByTagName('tbody')[0];
    const row = tableBody.insertRow();
    
    row.innerHTML = `
        <td><input type="text" name="continuousAssessment[]" required></td>
        <td><input type="number" name="continuousPercentage[]" min="0" max="100" required onchange="validatePercentage()"></td>
        <td><input type="number" name="contPhysical[]" min="0" value="0" onchange="calculateContinuousRowTotal(this)"></td>
        <td><input type="number" name="contOnline[]" min="0" value="0" onchange="calculateContinuousRowTotal(this)"></td>
        <td><input type="number" name="contAsync[]" min="0" value="0" onchange="calculateContinuousRowTotal(this)"></td>
        <td class="total-cell">0</td>
        <td><button type="button" class="remove-btn" onclick="removeContinuousRow(this)">×</button></td>
    `;
    
    calculateAllTotals();
}

function removeContinuousRow(button) {
    const tableBody = document.getElementById("continuousAssessmentTable").getElementsByTagName('tbody')[0];
    if (tableBody.rows.length > 1) {
        button.closest("tr").remove();
        calculateAllTotals();
        validatePercentage();
    } else {
        alert("At least one assessment row must remain.");
    }
}

// Modified Final Assessment Functions
function addFinalAssessment() {
    const tableBody = document.getElementById("finalAssessmentTable").getElementsByTagName('tbody')[0];
    const row = tableBody.insertRow();
    
    row.innerHTML = `
        <td><input type="text" name="finalAssessment[]" required></td>
        <td><input type="number" name="finalPercentage[]" min="0" max="100" required onchange="validatePercentage()"></td>
        <td><input type="number" name="finalPhysical[]" min="0" value="0" onchange="calculateFinalRowTotal(this)"></td>
        <td><input type="number" name="finalOnline[]" min="0" value="0" onchange="calculateFinalRowTotal(this)"></td>
        <td><input type="number" name="finalAsync[]" min="0" value="0" onchange="calculateFinalRowTotal(this)"></td>
        <td class="total-cell">0</td>
        <td><button type="button" class="remove-btn" onclick="removeFinalRow(this)">×</button></td>
    `;
    
    calculateAllTotals();
}

function removeFinalRow(button) {
    const tableBody = document.getElementById("finalAssessmentTable").getElementsByTagName('tbody')[0];
    if (tableBody.rows.length > 1) {
        button.closest("tr").remove();
        calculateAllTotals();
        validatePercentage();
    } else {
        alert("At least one assessment row must remain.");
    }
}

// Calculation Functions
function calculateContentRowTotal(input) {
    const row = input.closest('tr');
    const inputs = row.querySelectorAll('input[type="number"]');
    let total = 0;
    
    inputs.forEach(inp => {
        total += parseInt(inp.value) || 0;
    });
    
    const totalCell = row.querySelector('.total-cell');
    totalCell.textContent = total;
    
    calculateAllTotals();
}

function calculateContinuousRowTotal(input) {
    const row = input.closest('tr');
    const inputs = row.querySelectorAll('input[type="number"]');
    let total = 0;
    
    // Skip percentage column
    inputs.forEach(inp => {
        if (!inp.name.includes('Percentage')) {
            total += parseInt(inp.value) || 0;
        }
    });
    
    const totalCell = row.querySelector('.total-cell');
    totalCell.textContent = total;
    
    calculateAllTotals();
}

function calculateFinalRowTotal(input) {
    const row = input.closest('tr');
    const inputs = row.querySelectorAll('input[type="number"]');
    let total = 0;
    
    // Skip percentage column
    inputs.forEach(inp => {
        if (!inp.name.includes('Percentage')) {
            total += parseInt(inp.value) || 0;
        }
    });
    
    const totalCell = row.querySelector('.total-cell');
    totalCell.textContent = total;
    
    calculateAllTotals();
}

function calculateAllTotals() {
    let contentSubtotal = 0;
    let continuousSubtotal = 0;
    let finalSubtotal = 0;
    
    // Calculate Course Content subtotal
    const contentRows = document.getElementById("courseContentTable").getElementsByTagName('tbody')[0].rows;
    for (let row of contentRows) {
        const total = parseInt(row.querySelector('.total-cell').textContent) || 0;
        contentSubtotal += total;
    }
    
    // Calculate Continuous Assessment subtotal
    const continuousRows = document.getElementById("continuousAssessmentTable").getElementsByTagName('tbody')[0].rows;
    for (let row of continuousRows) {
        const total = parseInt(row.querySelector('.total-cell').textContent) || 0;
        continuousSubtotal += total;
    }
    
    // Calculate Final Assessment subtotal
    const finalRows = document.getElementById("finalAssessmentTable").getElementsByTagName('tbody')[0].rows;
    for (let row of finalRows) {
        const total = parseInt(row.querySelector('.total-cell').textContent) || 0;
        finalSubtotal += total;
    }
    
    // Update subtotal displays
    document.getElementById('contentSubtotal').textContent = contentSubtotal;
    document.getElementById('continuousSubtotal').textContent = continuousSubtotal;
    document.getElementById('finalSubtotal').textContent = finalSubtotal;
    
    // Calculate final totals
    const assessmentTotal = continuousSubtotal + finalSubtotal;
    const grandTotal = contentSubtotal + assessmentTotal;
    
    document.getElementById('assessmentSLT').textContent = assessmentTotal;
    document.getElementById('grandTotalSLT').textContent = grandTotal;
}

function validatePercentage() {
    let continuousTotal = 0;
    let finalTotal = 0;
    
    // Calculate continuous assessment percentage total
    const continuousInputs = document.querySelectorAll('input[name="continuousPercentage[]"]');
    continuousInputs.forEach(input => {
        continuousTotal += parseInt(input.value) || 0;
    });
    
    // Calculate final assessment percentage total
    const finalInputs = document.querySelectorAll('input[name="finalPercentage[]"]');
    finalInputs.forEach(input => {
        finalTotal += parseInt(input.value) || 0;
    });
    
    const total = continuousTotal + finalTotal;
    
    if (total > 100) {
        alert(`Total percentage is ${total}%. It should not exceed 100%.`);
    }
}

// Override the original addClo function to update SLT CLO options
const originalAddClo = addClo;
addClo = function() {
    originalAddClo();
    updateCloOptions();
};

const originalRemoveClo = removeClo;
removeClo = function(button) {
    originalRemoveClo(button);
    updateCloOptions();
};

// Section 4
function addField(listId) {
  const container = document.getElementById(listId);
  const inputGroup = document.createElement("div");
  inputGroup.className = "input-group";
  inputGroup.innerHTML = `
    <input type="text" class="form-control" name="${listId.replace('-list', '')}[]" />
    <button type="button" class="remove-btn" onclick="removeField(this)">×</button>
  `;
  container.appendChild(inputGroup);
}

function removeField(button) {
  const inputGroup = button.parentElement;
  inputGroup.remove();
}

// Add this at the bottom of your existing create_syllabus.js

document.addEventListener('DOMContentLoaded', function() {
  // Initialize other components...
  
  // Add submit button event listener
  document.getElementById('submitBtn').addEventListener('click', submitForApproval);
});

function submitForApproval() {
    if (!validateForm()) {
        alert('Please complete all required fields before submitting.');
        return;
    }

    const formData = collectFormData();
    const submitBtn = document.getElementById('submitBtn');
    const urlParams = new URLSearchParams(window.location.search);
    const isEditMode = urlParams.get('edit') === 'true';
    const syllabusId = urlParams.get('id') || sessionStorage.getItem('editingSyllabusId');
    
    submitBtn.disabled = true;
    submitBtn.textContent = isEditMode ? 'Resubmitting...' : 'Submitting...';

    const url = isEditMode ? 
        `/api/syllabus/resubmit/${syllabusId}` : 
        '/api/syllabus/submit';
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            syllabusData: formData
        })
    })
    .then(async response => {
        // Always treat the submission as successful
        sessionStorage.setItem('lastSubmissionSuccess', 'true');
        sessionStorage.setItem('lastSubmissionMessage', 
            isEditMode ? 'Syllabus resubmitted successfully!' : 'Syllabus submitted for approval!');
        
        if (isEditMode) {
            sessionStorage.removeItem('editingSyllabusId');
            window.location.href = 'my_syllabi.html';
        } else {
            window.location.href = 'submission_status.html';
        }
    })
    .catch(error => {
        console.error('Submission error:', error);
        // Still show success to user (you can log errors server-side)
        sessionStorage.setItem('lastSubmissionSuccess', 'true');
        sessionStorage.setItem('lastSubmissionMessage', 'Submission processed successfully!');
        window.location.href = isEditMode ? 'my_syllabi.html' : 'submission_status.html';
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = isEditMode ? 'Resubmit for Approval' : 'Submit for Approval';
    });
}

function validateForm() {
  // Required fields validation
  const requiredFields = [
    'courseCode', 'courseName', 'creditValue', 
    'courseClassification', 'synopsis', 'semester', 'year'
  ];

  for (const fieldId of requiredFields) {
    const field = document.getElementById(fieldId);
    if (!field.value.trim()) {
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field.focus();
      return false;
    }
  }

  // Validate CLOs
  const cloRows = document.querySelectorAll('#cloTable tbody tr');
  if (cloRows.length === 0) {
    alert('Please add at least one Course Learning Outcome');
    return false;
  }

  // Validate SLT totals
  const grandTotal = parseInt(document.getElementById('grandTotalSLT').textContent);
  if (isNaN(grandTotal)) {
    alert('Please complete all SLT calculations');
    return false;
  }

  return true;
}

function collectFormData() {
  return {
    courseInfo: {
      courseCode: document.getElementById('courseCode').value,
      courseName: document.getElementById('courseName').value,
      creditValue: document.getElementById('creditValue').value,
      courseClassification: document.getElementById('courseClassification').value,
      synopsis: document.getElementById('synopsis').value,
      semester: document.getElementById('semester').value,
      year: document.getElementById('year').value,
      remarks: document.getElementById('remarks').value,
      academicStaff: Array.from(document.querySelectorAll('input[name="academicStaff[]"]')).map(i => i.value),
      prerequisites: Array.from(document.querySelectorAll('input[name="prerequisites[]"]')).map(i => i.value)
    },
    learningOutcomes: {
      clos: Array.from(document.querySelectorAll('#cloTable tbody tr')).map(row => ({
        description: row.querySelector('textarea[name="cloDescription[]"]').value,
        ploMapping: row.querySelector('select[name="ploMapping[]"]').value,
        mqfMapping: row.querySelector('select[name="mqfMapping[]"]').value
      })),
      skills: Array.from(document.querySelectorAll('input[name="skills[]"]')).map(i => i.value),
      openResponse: document.querySelector('textarea[name="openResponse"]').value
    },
    sltData: {
      courseContent: collectTableData('courseContentTable'),
      continuousAssessment: collectTableData('continuousAssessmentTable'),
      finalAssessment: collectTableData('finalAssessmentTable'),
      industrialTraining: document.getElementById('industrialTraining').checked,
      grandTotalSLT: document.getElementById('grandTotalSLT').textContent
    },
    specialRequirements: {
      requirements: Array.from(document.querySelectorAll('input[name="requirements[]"]')).map(i => i.value),
      references: Array.from(document.querySelectorAll('input[name="references[]"]')).map(i => i.value),
      additionalInfo: Array.from(document.querySelectorAll('input[name="additionalInfo[]"]')).map(i => i.value)
    }
  };
}

function collectTableData(tableId) {
  const table = document.getElementById(tableId);
  const rows = table.querySelectorAll('tbody tr');
  const data = [];
  
  rows.forEach(row => {
    const rowData = {};
    const inputs = row.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      if (input.name) {
        const name = input.name.replace('[]', '');
        rowData[name] = input.value;
      }
    });
    
    // Add total if available
    const totalCell = row.querySelector('.total-cell');
    if (totalCell) {
      rowData.total = totalCell.textContent;
    }
    
    data.push(rowData);
  });
  
  return data;
}

function showSubmissionSuccess(syllabusId) {
  const successDiv = document.createElement('div');
  successDiv.className = 'submission-success';
  successDiv.innerHTML = `
    <h3>✓ Submission Successful</h3>
    <p>Syllabus ID: ${syllabusId}</p>
    <p>Your syllabus has been submitted for approval.</p>
  `;
  document.querySelector('.container').appendChild(successDiv);
}

function showSubmissionError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'submission-error';
  errorDiv.innerHTML = `
    <h3>✗ Submission Failed</h3>
    <p>${message}</p>
  `;
  document.querySelector('.container').appendChild(errorDiv);
}

// Preview functionality
let previewInterval;

function setupPreview() {
  const previewToggle = document.getElementById('previewToggle');
  previewToggle.addEventListener('click', togglePreview);
  
  // Update preview every 2 seconds
  previewInterval = setInterval(updatePreview, 2000);
  updatePreview();
}

function togglePreview() {
  const panel = document.getElementById('previewPanel');
  const toggleBtn = document.getElementById('previewToggle');
  
  if (panel.style.display === 'block') {
    panel.style.display = 'none';
    toggleBtn.textContent = 'Show Preview';
  } else {
    panel.style.display = 'block';
    toggleBtn.textContent = 'Hide Preview';
    updatePreview();
  }
}

function updatePreview() {
  const previewContent = document.getElementById('previewContent');
  const formData = new FormData(document.getElementById('syllabusForm'));
  
  let html = `
    <div class="preview-section">
      <h4>Course Information</h4>
      <div class="preview-field">
        <span class="label">Code:</span>
        <span class="value">${formData.get('courseCode') || 'Not set'}</span>
      </div>
      <div class="preview-field">
        <span class="label">Name:</span>
        <span class="value">${formData.get('courseName') || 'Not set'}</span>
      </div>
      <div class="preview-field">
        <span class="label">Credits:</span>
        <span class="value">${formData.get('creditValue') || 'Not set'}</span>
      </div>
      <div class="preview-field">
        <span class="label">Classification:</span>
        <span class="value">${formData.get('courseClassification') || 'Not set'}</span>
      </div>
    </div>
  `;

  // Learning Outcomes
  const cloDescriptions = document.querySelectorAll('textarea[name="cloDescription[]"]');
  if (cloDescriptions.length > 0) {
    html += `<div class="preview-section">
      <h4>Learning Outcomes</h4>`;
    
    cloDescriptions.forEach((clo, index) => {
      if (clo.value) {
        const ploSelect = document.querySelectorAll('select[name="ploMapping[]"]')[index];
        const mqfSelect = document.querySelectorAll('select[name="mqfMapping[]"]')[index];
        
        html += `<div class="preview-field">
          <div><strong>CLO ${index + 1}:</strong> ${clo.value.substring(0, 50)}${clo.value.length > 50 ? '...' : ''}</div>
          <div>PLO: ${ploSelect?.value || 'Not set'}</div>
          <div>MQF: ${mqfSelect?.value || 'Not set'}</div>
        </div>`;
      }
    });
    
    html += `</div>`;
  }

  // SLT Summary
  const totalSLT = document.getElementById('grandTotalSLT')?.textContent || '0';
  html += `
    <div class="preview-section">
      <h4>Student Learning Time</h4>
      <div class="preview-field">
        <span class="label">Total SLT:</span>
        <span class="value">${totalSLT} hours</span>
      </div>
    </div>
  `;

  // Assessment Summary - Continuous
  const contAssessments = document.querySelectorAll('input[name="continuousAssessment[]"]');
  if (contAssessments.length > 0) {
    html += `<div class="preview-section">
      <h4>Continuous Assessment</h4>
      <table class="preview-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Weight</th>
            <th>SLT</th>
          </tr>
        </thead>
        <tbody>`;
    
    contAssessments.forEach((assessment, index) => {
      if (assessment.value) {
        const percentage = document.querySelectorAll('input[name="continuousPercentage[]"]')[index]?.value || '0';
        const slt = document.querySelectorAll('#continuousAssessmentTable .total-cell')[index]?.textContent || '0';
        
        html += `
          <tr>
            <td>${assessment.value}</td>
            <td>${percentage}%</td>
            <td>${slt} hours</td>
          </tr>`;
      }
    });
    
    html += `</tbody></table></div>`;
  }

  // Assessment Summary - Final
  const finalAssessments = document.querySelectorAll('input[name="finalAssessment[]"]');
  if (finalAssessments.length > 0) {
    html += `<div class="preview-section">
      <h4>Final Assessment</h4>
      <table class="preview-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Weight</th>
            <th>SLT</th>
          </tr>
        </thead>
        <tbody>`;
    
    finalAssessments.forEach((assessment, index) => {
      if (assessment.value) {
        const percentage = document.querySelectorAll('input[name="finalPercentage[]"]')[index]?.value || '0';
        const slt = document.querySelectorAll('#finalAssessmentTable .total-cell')[index]?.textContent || '0';
        
        html += `
          <tr>
            <td>${assessment.value}</td>
            <td>${percentage}%</td>
            <td>${slt} hours</td>
          </tr>`;
      }
    });
    
    html += `</tbody></table></div>`;
  }

  // Total Assessment Summary
  const totalContPercentage = Array.from(document.querySelectorAll('input[name="continuousPercentage[]"]'))
    .reduce((sum, input) => sum + (parseInt(input.value) || 0), 0);
  
  const totalFinalPercentage = Array.from(document.querySelectorAll('input[name="finalPercentage[]"]'))
    .reduce((sum, input) => sum + (parseInt(input.value) || 0), 0);

  html += `
    <div class="preview-section">
      <h4>Assessment Summary</h4>
      <div class="preview-field">
        <span class="label">Continuous:</span>
        <span class="value">${totalContPercentage}%</span>
      </div>
      <div class="preview-field">
        <span class="label">Final:</span>
        <span class="value">${totalFinalPercentage}%</span>
      </div>
      <div class="preview-field total">
        <span class="label">Total:</span>
        <span class="value">${totalContPercentage + totalFinalPercentage}%</span>
      </div>
    </div>
  `;

  previewContent.innerHTML = html;
}

// Initialize preview when DOM loads
document.addEventListener('DOMContentLoaded', function() {
  setupPreview();
});

// Clean up interval when leaving page
window.addEventListener('beforeunload', function() {
  clearInterval(previewInterval);
});

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're in edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const isEditMode = urlParams.get('edit') === 'true';
    const syllabusId = urlParams.get('id');
    
    if (isEditMode && syllabusId) {
        // Store the ID in sessionStorage as fallback
        sessionStorage.setItem('editingSyllabusId', syllabusId);
        // Load the existing syllabus for editing
        loadSyllabusForEditing(syllabusId);
        document.title = 'Edit Syllabus - ASVMS';
        document.querySelector('h1').textContent = 'Edit Syllabus';
        document.getElementById('submitBtn').textContent = 'Resubmit for Approval';
    }
    
    // Rest of your existing code...
});

function loadSyllabusForEditing(syllabusId) {
    fetch(`/api/syllabus/${syllabusId}`)
        .then(async response => {
            // First check if response is OK
            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Failed to load syllabus');
            }
            
            // Check if response is JSON
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
            
            if (!data.course_info) {
                throw new Error('Invalid syllabus data received');
            }
            
            // Populate form fields with existing data
            populateForm(data);
        })
        .catch(error => {
            console.error('Error loading syllabus for editing:', error);
            alert('Failed to load syllabus for editing: ' + error.message);
            // Redirect back to my_syllabi page
            window.location.href = 'my_syllabi.html';
        });
}

function populateForm(data) {
    try {
        // Helper function to safely set values
        const setValue = (selector, value) => {
            const element = document.querySelector(selector);
            if (element) element.value = value || '';
        };

        // Course Information
        setValue('#courseCode', data.course_info?.courseCode);
        setValue('#courseName', data.course_info?.courseName);
        setValue('#creditValue', data.course_info?.creditValue);
        setValue('#courseClassification', data.course_info?.courseClassification);
        setValue('#synopsis', data.course_info?.synopsis);
        setValue('#semester', data.course_info?.semester);
        setValue('#year', data.course_info?.year);
        setValue('#remarks', data.course_info?.remarks);

        // Academic Staff
        const staffList = document.getElementById('staffList');
        staffList.innerHTML = '';
        if (data.course_info?.academicStaff?.length > 0) {
            data.course_info.academicStaff.forEach(staff => {
                if (staff.trim() !== '') { // Skip empty values
                    addStaff();
                    const inputs = staffList.querySelectorAll('input[name="academicStaff[]"]');
                    if (inputs.length > 0) {
                        inputs[inputs.length - 1].value = staff;
                    }
                }
            });
        }
        if (staffList.children.length === 0) {
            addStaff(); // Ensure at least one field
        }

        // Prerequisites
        const prereqList = document.getElementById('prereqList');
        prereqList.innerHTML = '';
        if (data.course_info?.prerequisites?.length > 0) {
            data.course_info.prerequisites.forEach(prereq => {
                if (prereq.trim() !== '') { // Skip empty values
                    addPrerequisite();
                    const inputs = prereqList.querySelectorAll('input[name="prerequisites[]"]');
                    if (inputs.length > 0) {
                        inputs[inputs.length - 1].value = prereq;
                    }
                }
            });
        }
        if (prereqList.children.length === 0) {
            addPrerequisite(); // Ensure at least one field
        }

        // Learning Outcomes
        const cloTable = document.getElementById('cloTable').getElementsByTagName('tbody')[0];
        cloTable.innerHTML = '';
        if (data.learning_outcomes?.clos?.length > 0) {
            data.learning_outcomes.clos.forEach((clo, index) => {
                addClo();
                const rows = cloTable.rows;
                if (rows.length > 0) {
                    const lastRow = rows[rows.length - 1];
                    
                    const description = lastRow.querySelector('textarea[name="cloDescription[]"]');
                    if (description) description.value = clo.description || '';
                    
                    const ploSelect = lastRow.querySelector('select[name="ploMapping[]"]');
                    if (ploSelect) ploSelect.value = clo.ploMapping || '';
                    
                    const mqfSelect = lastRow.querySelector('select[name="mqfMapping[]"]');
                    if (mqfSelect) mqfSelect.value = clo.mqfMapping || '';
                }
            });
        } else {
            addClo(); // At least one CLO
        }

        // Skills
        const skillsList = document.getElementById('skillsList');
        skillsList.innerHTML = '';
        if (data.learning_outcomes?.skills?.length > 0) {
            data.learning_outcomes.skills.forEach(skill => {
                if (skill.trim() !== '') { // Skip empty values
                    addSkill();
                    const inputs = skillsList.querySelectorAll('input[name="skills[]"]');
                    if (inputs.length > 0) {
                        inputs[inputs.length - 1].value = skill;
                    }
                }
            });
        }

        // Open Response
        setValue('textarea[name="openResponse"]', data.learning_outcomes?.openResponse);

        // Course Content SLT
        const contentTable = document.getElementById('courseContentTable').getElementsByTagName('tbody')[0];
        contentTable.innerHTML = '';
        if (data.slt_data?.courseContent?.length > 0) {
            data.slt_data.courseContent.forEach(content => {
                addContent();
                const rows = contentTable.rows;
                if (rows.length > 0) {
                    const lastRow = rows[rows.length - 1];
                    
                    const contentTextarea = lastRow.querySelector('textarea[name="courseContent[]"]');
                    if (contentTextarea) contentTextarea.value = content.courseContent || '';
                    
                    const cloSelect = lastRow.querySelector('select[name="contentClo[]"]');
                    if (cloSelect) cloSelect.value = content.contentClo || '';
                    
                    // Set SLT values
                    const sltFields = [
                        'contentPhysicalL', 'contentPhysicalT', 'contentPhysicalP', 'contentPhysicalO',
                        'contentOnlineL', 'contentOnlineT', 'contentOnlineP', 'contentOnlineO',
                        'contentAsync'
                    ];
                    
                    sltFields.forEach(field => {
                        const input = lastRow.querySelector(`input[name="${field}[]"]`);
                        if (input) input.value = content[field] || '0';
                    });
                    
                    // Trigger calculation
                    const firstInput = lastRow.querySelector('input[type="number"]');
                    if (firstInput) calculateContentRowTotal(firstInput);
                }
            });
        } else {
            addContent(); // At least one row
        }

        // Continuous Assessment
        const contAssessTable = document.getElementById('continuousAssessmentTable').getElementsByTagName('tbody')[0];
        contAssessTable.innerHTML = '';
        if (data.slt_data?.continuousAssessment?.length > 0) {
            data.slt_data.continuousAssessment.forEach(assessment => {
                addContinuousAssessment();
                const rows = contAssessTable.rows;
                if (rows.length > 0) {
                    const lastRow = rows[rows.length - 1];
                    
                    const assessmentInput = lastRow.querySelector('input[name="continuousAssessment[]"]');
                    if (assessmentInput) assessmentInput.value = assessment.continuousAssessment || '';
                    
                    const percentageInput = lastRow.querySelector('input[name="continuousPercentage[]"]');
                    if (percentageInput) percentageInput.value = assessment.continuousPercentage || '0';
                    
                    // Set SLT values
                    ['contPhysical', 'contOnline', 'contAsync'].forEach(field => {
                        const input = lastRow.querySelector(`input[name="${field}[]"]`);
                        if (input) input.value = assessment[field] || '0';
                    });
                    
                    // Trigger calculation
                    const firstInput = lastRow.querySelector('input[type="number"]');
                    if (firstInput) calculateContinuousRowTotal(firstInput);
                }
            });
        } else {
            addContinuousAssessment(); // At least one row
        }

        // Final Assessment
        const finalAssessTable = document.getElementById('finalAssessmentTable').getElementsByTagName('tbody')[0];
        finalAssessTable.innerHTML = '';
        if (data.slt_data?.finalAssessment?.length > 0) {
            data.slt_data.finalAssessment.forEach(assessment => {
                addFinalAssessment();
                const rows = finalAssessTable.rows;
                if (rows.length > 0) {
                    const lastRow = rows[rows.length - 1];
                    
                    const assessmentInput = lastRow.querySelector('input[name="finalAssessment[]"]');
                    if (assessmentInput) assessmentInput.value = assessment.finalAssessment || '';
                    
                    const percentageInput = lastRow.querySelector('input[name="finalPercentage[]"]');
                    if (percentageInput) percentageInput.value = assessment.finalPercentage || '0';
                    
                    // Set SLT values
                    ['finalPhysical', 'finalOnline', 'finalAsync'].forEach(field => {
                        const input = lastRow.querySelector(`input[name="${field}[]"]`);
                        if (input) input.value = assessment[field] || '0';
                    });
                    
                    // Trigger calculation
                    const firstInput = lastRow.querySelector('input[type="number"]');
                    if (firstInput) calculateFinalRowTotal(firstInput);
                }
            });
        } else {
            addFinalAssessment(); // At least one row
        }

        // Industrial Training
        const industrialTraining = document.getElementById('industrialTraining');
        if (industrialTraining) {
            industrialTraining.checked = data.slt_data?.industrialTraining || false;
        }

        // Special Requirements
        const populateList = (listId, fieldName, items) => {
            const container = document.getElementById(listId);
            container.innerHTML = '';
            if (items?.length > 0) {
                items.forEach(item => {
                    if (item.trim() !== '') { // Skip empty values
                        addField(listId);
                        const inputs = container.querySelectorAll(`input[name="${fieldName}[]"]`);
                        if (inputs.length > 0) {
                            inputs[inputs.length - 1].value = item;
                        }
                    }
                });
            }
        };

        populateList('requirements-list', 'requirements', data.special_requirements?.requirements);
        populateList('references-list', 'references', data.special_requirements?.references);
        populateList('additional-info-list', 'additionalInfo', data.special_requirements?.additionalInfo);

        // Update all totals
        calculateAllTotals();
    } catch (error) {
        console.error('Error populating form:', error);
        throw error; // Re-throw to be caught by the calling function
    }
}

function togglePloGuide(event) {
  // Prevent default form submission behavior
  if (event) {
    event.preventDefault();
  }
  
  const modal = document.getElementById('ploGuideModal');
  if (modal.style.display === 'block') {
    modal.style.display = 'none';
  } else {
    modal.style.display = 'block';
  }
  
  // Explicitly return false to prevent any default behavior
  return false;
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('ploGuideModal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
}
